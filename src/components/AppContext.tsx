'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme, Theme } from '@/hooks/useTheme';
import { StructuredKnowledge, PromptConfig } from '@/types';
import { supabase } from '@/lib/supabaseClient';

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
  geminiModel: string;
  setGeminiModel: (model: string) => void;
  history: StructuredKnowledge[];
  setHistory: (history: StructuredKnowledge[]) => void;
  selectedHistoryIds: string[];
  setSelectedHistoryIds: (ids: string[]) => void;
  activeVideo: StructuredKnowledge | null;
  setActiveVideo: (video: StructuredKnowledge | null) => void;
  promptConfig: PromptConfig;
  setPromptConfig: React.Dispatch<React.SetStateAction<PromptConfig>>;
  generatedPrompt: string;
  setGeneratedPrompt: (prompt: string) => void;
  isExtracting: boolean;
  setIsExtracting: (val: boolean) => void;
  extractionProgress: string;
  setExtractionProgress: (val: string) => void;
  addVideoToHistory: (video: StructuredKnowledge) => Promise<void>;
  removeVideoFromHistory: (videoId: string) => Promise<void>;
  updateVideoInHistory: (video: StructuredKnowledge) => Promise<void>;
  resetHistory: () => Promise<void>;
  
  // Vault Aliases (Compatibility layer)
  vault: StructuredKnowledge[];
  setVault: (vault: StructuredKnowledge[]) => void;
  selectedVaultIds: string[];
  setSelectedVaultIds: (ids: string[]) => void;
  addVideoToVault: (video: StructuredKnowledge) => Promise<void>;
  removeVideoFromVault: (videoId: string) => Promise<void>;
  updateVideoInVault: (video: StructuredKnowledge) => Promise<void>;
  resetVault: () => Promise<void>;
  
  // Supabase Auth & Profile
  user: any | null;
  profile: any | null;
  authLoading: boolean;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultPromptConfig: PromptConfig = {
  promptType: 'Feature Implementation',
  targetAi: 'Cursor',
  strength: 'balanced',
  toggles: {
    addFeatures: true,
    createTodo: true,
    preserveDesign: false,
    mobileFirst: true,
    accessibilityFocus: false,
    performanceFocus: true,
    productionReady: true,
    mvpMode: false,
    seniorMode: true,
    layer: 'fullstack',
  },
  additionalContext: '',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme, isDark, setTheme } = useTheme();
  
  // Clean: default to empty string so owner's API key is never shown or exposed to the client
  const [apiKey, setApiKey] = useLocalStorage<string>('gemini_api_key', '');
  const [geminiModel, setGeminiModel] = useLocalStorage<string>('gemini_model', 'gemini-2.5-flash');
  
  const [history, setHistory] = useState<StructuredKnowledge[]>([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [activeVideo, setActiveVideo] = useState<StructuredKnowledge | null>(null);
  const [promptConfig, setPromptConfig] = useState<PromptConfig>(defaultPromptConfig);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionProgress, setExtractionProgress] = useState<string>('');

  // Supabase auth & profile states
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Authenticate session check & active listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.warn('Failed to load profile details:', err);
    }
  };

  // Load profile details when user is authenticated
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  // Fetch database history upon successful user authentication
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const fetchUserHistory = async () => {
      try {
        // Automatically delete the 3 pre-seeded demo history records from Supabase if they exist
        const demoVideoIds = ['Yl3L-R9P9vA', 'L18dG2P-XoM', 'T3m9q8R9a_s'];
        await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .in('video_id', demoVideoIds);

        // Fetch remaining clean user-specific history
        const { data, error } = await supabase
          .from('user_history')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const mappedHistory = data.map((dbItem: any) => ({
            videoId: dbItem.video_id,
            videoTitle: dbItem.video_title,
            thumbnailUrl: dbItem.thumbnail_url,
            channelName: dbItem.channel_name || undefined,
            main_topic: dbItem.main_topic,
            principles: dbItem.principles || [],
            lessons: dbItem.lessons || [],
            warnings: dbItem.warnings || [],
            examples: dbItem.examples || [],
            frameworks: dbItem.frameworks || [],
            tags: dbItem.tags || [],
            createdAt: dbItem.created_at || dbItem.createdAt,
            transcriptText: dbItem.transcript_text,
          }));
          setHistory(mappedHistory);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.warn('Error reading from database:', err);
        setHistory([]);
      }
    };

    fetchUserHistory();
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setHistory([]);
    setActiveVideo(null);
    setSelectedHistoryIds([]);
    setGeneratedPrompt('');
  };

  const addVideoToHistory = async (video: StructuredKnowledge) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.videoId !== video.videoId);
      return [video, ...filtered];
    });

    if (user) {
      try {
        const { error } = await supabase.from('user_history').upsert({
          user_id: user.id,
          video_id: video.videoId,
          video_title: video.videoTitle,
          thumbnail_url: video.thumbnailUrl,
          channel_name: video.channelName || null,
          main_topic: video.main_topic,
          principles: video.principles || [],
          lessons: video.lessons || [],
          warnings: video.warnings || [],
          examples: video.examples || [],
          frameworks: video.frameworks || [],
          tags: video.tags || [],
          transcript_text: video.transcriptText,
          created_at: video.createdAt || new Date().toISOString(),
        }, {
          onConflict: 'user_id,video_id'
        });

        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync added record to remote database:', err);
      }
    }
  };

  const removeVideoFromHistory = async (videoId: string) => {
    setHistory((prev) => prev.filter((item) => item.videoId !== videoId));
    if (activeVideo?.videoId === videoId) {
      setActiveVideo(null);
    }
    setSelectedHistoryIds((prev) => prev.filter((id) => id !== videoId));

    if (user) {
      try {
        const { error } = await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', videoId);

        if (error) throw error;
      } catch (err) {
        console.error('Failed to remove record from remote database:', err);
      }
    }
  };

  const updateVideoInHistory = async (video: StructuredKnowledge) => {
    setHistory((prev) => prev.map((item) => (item.videoId === video.videoId ? video : item)));
    if (activeVideo?.videoId === video.videoId) {
      setActiveVideo(video);
    }

    if (user) {
      try {
        const { error } = await supabase
          .from('user_history')
          .update({
            video_title: video.videoTitle,
            thumbnail_url: video.thumbnailUrl,
            channel_name: video.channelName || null,
            main_topic: video.main_topic,
            principles: video.principles || [],
            lessons: video.lessons || [],
            warnings: video.warnings || [],
            examples: video.examples || [],
            frameworks: video.frameworks || [],
            tags: video.tags || [],
            transcript_text: video.transcriptText,
          })
          .eq('user_id', user.id)
          .eq('video_id', video.videoId);

        if (error) throw error;
      } catch (err) {
        console.error('Failed to update record in remote database:', err);
      }
    }
  };

  const resetHistory = async () => {
    setHistory([]);
    setActiveVideo(null);
    setSelectedHistoryIds([]);
    setGeneratedPrompt('');

    if (user) {
      try {
        const { error } = await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err) {
        console.error('Failed to wipe records in remote database:', err);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark,
        apiKey,
        setApiKey,
        geminiModel,
        setGeminiModel,
        history,
        setHistory,
        selectedHistoryIds,
        setSelectedHistoryIds,
        activeVideo,
        setActiveVideo,
        promptConfig,
        setPromptConfig,
        generatedPrompt,
        setGeneratedPrompt,
        isExtracting,
        setIsExtracting,
        extractionProgress,
        setExtractionProgress,
        addVideoToHistory,
        removeVideoFromHistory,
        updateVideoInHistory,
        resetHistory,
        
        // Vault Aliases
        vault: history,
        setVault: setHistory,
        selectedVaultIds: selectedHistoryIds,
        setSelectedVaultIds: setSelectedHistoryIds,
        addVideoToVault: addVideoToHistory,
        removeVideoFromVault: removeVideoFromHistory,
        updateVideoInVault: updateVideoInHistory,
        resetVault: resetHistory,
        
        user,
        profile,
        authLoading,
        signOut,
        fetchProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
