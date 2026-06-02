'use client';

import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAppContext } from '../AppContext';
import AuthScreen from '../ui/AuthScreen';
import LoadingScreen from '../ui/LoadingScreen';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { usePathname } from 'next/navigation';
import { AlertTriangle, Terminal, Key } from 'lucide-react';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { user, authLoading } = useAppContext();
  const pathname = usePathname();
  const [startupLoading, setStartupLoading] = useState(true);
  const [shouldExit, setShouldExit] = useState(false);
  const [loaderMounted, setLoaderMounted] = useState(true);

  // 1. Run startup timer for minimum load time (1.8s) to show the cool boot sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      setStartupLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // 2. Control exit slide transition and unmount of the loader screen
  useEffect(() => {
    if (!authLoading && !startupLoading) {
      const frame = requestAnimationFrame(() => {
        setShouldExit(true);
      });
      const unmountTimer = setTimeout(() => {
        setLoaderMounted(false);
      }, 700); // matches slide-up transition duration
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(unmountTimer);
      };
    }
  }, [authLoading, startupLoading]);

  // 3. Check if Supabase keys are configured. If not, prompt with a premium Bauhaus Setup Guide.
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-background text-primary flex flex-col justify-center items-center px-6 py-20 relative overflow-hidden z-50">
        <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>
        
        <div className="w-full max-w-2xl bg-card border-4 border-primary neo-shadow p-8 sm:p-10 relative z-10 flex flex-col gap-6">
          <div className="flex h-3 border-b-4 border-primary">
            <div className="w-1/2 bg-accent"></div>
            <div className="w-1/2 bg-secondary"></div>
          </div>

          <div className="flex items-center gap-4 border-b-4 border-primary pb-4">
            <div className="flex h-12 w-12 items-center justify-center border-4 border-primary bg-accent text-primary shrink-0">
              <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-headline font-black text-2xl uppercase leading-none">
                CONFIGURATION REQUIRED
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                DATABASE CONNECTION IS OFFLINE
              </p>
            </div>
          </div>

          <div className="font-body text-sm font-semibold uppercase leading-relaxed text-primary/80">
            PROMPTUBE USES SECURE CLOUD AUTHENTICATION TO PREVENT ABUSE BY BOT NETWORKS AND SECURELY LOG YOUR HISTORY ARCHIVES. SETUP CORRESPONDING SUPABASE ENDPOINTS TO ACTIVATE OFFLINE ACCESS.
          </div>

          <div className="border-4 border-primary bg-background p-5 font-mono text-xs flex flex-col gap-4">
            <div className="font-bold text-secondary uppercase flex items-center gap-1.5 border-b-2 border-primary/20 pb-2">
              <Terminal className="h-4 w-4" /> ADD THIS TO .env.local FILE IN ROOT DIRECTORY
            </div>
            <div className="bg-card p-3 border-2 border-primary overflow-x-auto select-all text-primary font-bold">
              NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co<br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-api-key-here
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-xs font-black uppercase text-primary tracking-wider">
              HOW TO ACQUIRE YOUR KEYS:
            </div>
            <ul className="text-xs font-bold text-muted-foreground uppercase list-decimal list-inside flex flex-col gap-1">
              <li>CREATE A FREE PROJECT AT <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline hover:text-accent">SUPABASE.COM</a></li>
              <li>GO TO PROJECT SETTINGS &gt; API</li>
              <li>COPY THE &quot;PROJECT URL&quot; AND &quot;ANON KEY&quot; (PUBLIC API KEY)</li>
              <li>RESTART THE LOCAL SERVER (`npm run dev`) AFTER SAVING CHANGES</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const isAdminRoute = pathname === '/admin';
  
  // Detect if route is non-existent (404) to prevent blocking with the auth gate
  const VALID_ROUTES = ['/', '/dashboard', '/history', '/privacy', '/settings', '/terms', '/admin'];
  const isNotFound = !VALID_ROUTES.includes(pathname) && !pathname.startsWith('/api');
  
  const isPublicRoute = pathname === '/' || pathname === '/privacy' || pathname === '/terms' || isAdminRoute || isNotFound;

  // Render AuthScreen if not authenticated on a protected route (only check after authLoading finishes)
  const showAuthGate = !authLoading && !user && !isPublicRoute;

  // 4. Authenticated / Standalone Admin Page Layout
  if (isAdminRoute) {
    return (
      <>
        {loaderMounted && <LoadingScreen shouldExit={shouldExit} />}
        <main className="flex-grow flex flex-col">{children}</main>
      </>
    );
  }

  // 5. Render members-only authenticating gate if not logged in on protected routes
  if (showAuthGate) {
    return (
      <>
        {loaderMounted && <LoadingScreen shouldExit={shouldExit} />}
        <header className="sticky top-0 z-40 w-full border-b-4 border-primary bg-background transition-colors duration-200">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center border-3 border-primary bg-secondary text-white">
                <span className="font-headline font-black text-xl">P</span>
              </div>
              <span className="font-headline font-black tracking-tight text-xl text-primary uppercase">
                promp<span className="text-secondary">tube</span>
              </span>
            </div>
            <div className="flex items-center gap-2 border-3 border-primary bg-secondary/15 px-3 py-1 text-xs font-black uppercase tracking-wider font-headline text-secondary">
              <Key className="h-3.5 w-3.5" />
              <span>Gate Locked</span>
            </div>
          </div>
        </header>
        <main className="flex-grow flex flex-col">
          <AuthScreen />
        </main>
        <Footer />
      </>
    );
  }

  // 6. If auth is still checking and loader is mounting, keep displaying the loader without background flash
  if (authLoading && loaderMounted) {
    return <LoadingScreen shouldExit={false} />;
  }

  // 7. Authenticated standard state - Render Workspace
  return (
    <>
      {loaderMounted && <LoadingScreen shouldExit={shouldExit} />}
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </>
  );
}
