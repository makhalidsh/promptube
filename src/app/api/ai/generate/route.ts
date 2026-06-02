import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return Response.json({ success: false, error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Create a Supabase client verified by the user's JWT
    const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const body = await request.json();

    // Invoke Supabase Edge Function
    const { data: edgeResult, error: edgeError } = await supabaseServer.functions.invoke('gemini/generate', {
      body,
    });

    if (edgeError) {
      console.error('Edge Function Generate Error:', edgeError);
      
      let errorMsg = 'Failed to generate prompt';
      let limitExceeded = false;
      
      try {
        const errorBody = await edgeError.context.json();
        errorMsg = errorBody.message || errorBody.error || errorMsg;
        limitExceeded = errorBody.limitExceeded || edgeError.status === 429;
      } catch {
        errorMsg = edgeError.message || errorMsg;
        limitExceeded = edgeError.status === 429;
      }

      return Response.json({ 
        success: false, 
        error: errorMsg,
        limitExceeded
      }, { status: edgeError.status || 500 });
    }

    return Response.json(edgeResult);
  } catch (err: any) {
    console.error('API Generate Error:', err);
    return Response.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
