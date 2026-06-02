'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, AlertCircle, Copy, Check, Download, 
  Trash2, Edit3, Plus, Search, HelpCircle, Eye, Settings,
  History, LayoutDashboard, Save, Share2, Tag, BookOpen,
  Play, Sliders
} from 'lucide-react';
import YoutubeIcon from '@/components/ui/YoutubeIcon';
import { useAppContext } from '@/components/AppContext';
import { extractKnowledge, generatePrompt } from '@/lib/gemini';
import { extractVideoId } from '@/lib/youtube';
import { StructuredKnowledge, PromptType, TargetAI } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import Switch from '@/components/ui/Switch';
import Dialog from '@/components/ui/Dialog';
import Tabs from '@/components/ui/Tabs';

// Wrap search params extraction in Suspense
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading workspace dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState<'principles' | 'lessons' | 'warnings' | 'examples' | 'frameworks'>('principles');
  const [showFunctionalControls, setShowFunctionalControls] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitExceededMsg, setLimitExceededMsg] = useState('');

  const {
    apiKey,
    history,
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
    geminiModel,
    profile,
    fetchProfile,
  } = useAppContext();

  const isContentCreator = [
    'News Video Script Creator',
    'Story Adaptation & Recreation',
    'YouTube Video Script',
    'Technical Blog Post Writer',
    'Social Media Content Pack',
    'Podcast Outline & Script',
    'Interactive Storyboard'
  ].includes(promptConfig.promptType);

  const isBusinessStartup = [
    'Startup MVP Spec',
    'SaaS Pitch Deck Outline',
    'Go-To-Market Plan',
    'Marketing Campaign Strategy',
    'SEO Article Outline',
    'Customer Support Playbook'
  ].includes(promptConfig.promptType);

  const getToggleMetadata = (key: keyof typeof promptConfig.toggles) => {
    switch (key) {
      case 'addFeatures':
        return isContentCreator
          ? { label: 'Expand Story Outline', description: 'Include detailed subplot variations and character arcs' }
          : isBusinessStartup
          ? { label: 'Add Product Options', description: 'Include upsell routes, customer tiers, or monetization options' }
          : { label: 'Add New Features', description: 'Include expanded features and options in the prompt' };
      case 'createTodo':
        return isContentCreator
          ? { label: 'Create Narrative Checklist', description: 'Require a scene-by-scene editing checklist' }
          : isBusinessStartup
          ? { label: 'Create Strategic TODOs', description: 'Request a step-by-step roadmap action list' }
          : { label: 'Create TODO List', description: 'Request a task checklists list inside code reviews' };
      case 'preserveDesign':
        return isContentCreator
          ? { label: 'Preserve Editorial Style', description: 'Enforce strictly maintaining the source voice and tone' }
          : isBusinessStartup
          ? { label: 'Preserve Brand Identity', description: 'Enforce strict compliance with brand values' }
          : { label: 'Preserve Original Design', description: 'Enforce strictly keeping existing styles/CSS tokens' };
      case 'mobileFirst':
        return isContentCreator
          ? { label: 'Optimize Screen Formatting', description: 'Optimize pacing and cues for mobile video formats (Shorts/TikTok)' }
          : isBusinessStartup
          ? { label: 'Mobile Distribution Focus', description: 'Target mobile-first acquisition channels and ads' }
          : { label: 'Mobile First Layout', description: 'Instruct agents to prioritize mobile layouts first' };
      case 'accessibilityFocus':
        return isContentCreator
          ? { label: 'Readability Focus', description: 'Enforce clear, direct language matching standard readability tests' }
          : isBusinessStartup
          ? { label: 'Inclusive Pitch Tone', description: 'Ensure business communication is clear and jargon-free' }
          : { label: 'Accessibility Focus (WCAG)', description: 'Inject rigorous keyboard navigability guidelines' };
      case 'performanceFocus':
        return isContentCreator
          ? { label: 'Pacing & Retention Focus', description: 'Streamline writing to keep audience retention high and cut fluff' }
          : isBusinessStartup
          ? { label: 'Actionable Growth Focus', description: 'Prioritize low-cost, high-velocity acquisition tactics' }
          : { label: 'Performance Focus', description: 'Optimize render nodes and reduce heavy imports' };
      case 'productionReady':
        return isContentCreator
          ? { label: 'Publish-Ready Quality', description: 'Require full scene dialogues with zero placeholder lines' }
          : isBusinessStartup
          ? { label: 'Investor-Ready Precision', description: 'Require highly rigorous validation models and metrics' }
          : { label: 'Production Quality Code', description: 'Enforce error bounds, defensive logic, and types' };
      case 'mvpMode':
        return isContentCreator
          ? { label: 'Agile Script Draft', description: 'Prioritize the primary narrative hook and fast dialogues' }
          : isBusinessStartup
          ? { label: 'Agile Validation Pitch', description: 'Focus strictly on validating immediate customer pain points' }
          : { label: 'MVP Agile Mode', description: 'Keep blocks highly streamlined and quick to write' };
      case 'seniorMode':
        return isContentCreator
          ? { label: 'Creative Director Persona', description: 'Set LLM personality to an award-winning storyteller' }
          : isBusinessStartup
          ? { label: 'Veteran Founder Persona', description: 'Set LLM personality to a battle-tested SaaS founder' }
          : { label: 'Senior Engineer Persona', description: 'Set LLM personality to defensive clean coder' };
      default:
        return { label: '', description: '' };
    }
  };

  // Search Param Trigger for extraction on load
  const urlParam = searchParams.get('url');
  const tabParam = searchParams.get('tab');
  const manualParam = searchParams.get('manual');

  // Tabs layout
  const [activeTab, setActiveTab] = useState<'workspace' | 'history'>('workspace');
  
  // URL Input State
  const [inputUrl, setInputUrl] = useState('');
  const [inputError, setInputError] = useState('');

  // Editing state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<'principles' | 'lessons' | 'warnings' | 'examples' | 'frameworks' | 'main_topic' | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // Custom addition input
  const [newCardText, setNewCardText] = useState('');

  // Clipboard copy state
  const [isCopied, setIsCopied] = useState(false);

  // Search in Vault
  const [historySearch, setHistorySearch] = useState('');

  // Manual transcript override states
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualChannel, setManualChannel] = useState('');
  const [manualText, setManualText] = useState('');

  // Handle URL Param extraction on load
  useEffect(() => {
    if (tabParam === 'history') {
      router.replace('/history');
    } else {
      setActiveTab('workspace');
    }
  }, [tabParam, router]);

  useEffect(() => {
    if (manualParam === 'true') {
      setIsManualModalOpen(true);
    }
  }, [manualParam]);

  // Dynamic Target AI selection reset on promptType change
  useEffect(() => {
    const activeOptions = isContentCreator 
      ? ['Claude.ai (Web)', 'ChatGPT Plus', 'Google Gemini Web', 'Midjourney (Images)', 'Descript (AV Editor)', 'CapCut / Premiere AI', 'ElevenLabs (Voice)', 'Generic AI']
      : isBusinessStartup
      ? ['ChatGPT Plus', 'Claude.ai (Web)', 'Google Gemini Web', 'v0 by Vercel', 'Agentic CRM Planner', 'Generic AI']
      : ['Cursor', 'Claude Code', 'Gemini CLI', 'Windsurf', 'Bolt', 'Lovable', 'OpenAI Codex', 'Generic AI'];

    if (!activeOptions.includes(promptConfig.targetAi)) {
      const defaultTarget = isContentCreator 
        ? 'Claude.ai (Web)' 
        : isBusinessStartup 
        ? 'ChatGPT Plus' 
        : 'Cursor';
      setPromptConfig(prev => ({
        ...prev,
        targetAi: defaultTarget as any
      }));
    }
  }, [promptConfig.promptType, isContentCreator, isBusinessStartup, promptConfig.targetAi, setPromptConfig]);

  useEffect(() => {
    const triggerUrlExtraction = async () => {
      if (urlParam) {
        const extractedId = extractVideoId(urlParam);
        if (extractedId && (!activeVideo || activeVideo.videoId !== extractedId)) {
          setInputUrl(urlParam);
          setIsExtracting(true);
          setExtractionProgress('Connecting to YouTube routes...');
          
          try {
            const res = await fetch(`/api/transcript?url=${encodeURIComponent(urlParam)}`);
            const data = await res.json();
            
            if (!data.success) {
              if (data.videoTitle && data.videoTitle !== 'YouTube Video') {
                setManualTitle(data.videoTitle);
              }
              if (data.channelName && data.channelName !== 'Unknown Channel') {
                setManualChannel(data.channelName);
              }
              throw new Error(data.error || 'No transcripts found');
            }
            
            setExtractionProgress('Analyzing transcript structure...');
            
            const sessionRes = await supabase.auth.getSession();
            const token = sessionRes.data.session?.access_token;
            if (!token) {
              throw new Error('Not authenticated: please sign in first');
            }

            const extractRes = await fetch('/api/ai/extract', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                transcriptText: data.transcriptText,
                videoTitle: data.videoTitle,
                videoId: data.videoId,
                thumbnailUrl: data.thumbnailUrl,
                channelName: data.channelName,
                geminiModel: geminiModel,
              }),
            });

            const extractData = await extractRes.json();
            if (!extractData.success) {
              if (extractRes.status === 429) {
                setLimitExceededMsg(extractData.message || 'Daily extraction limit reached.');
                setIsLimitModalOpen(true);
                throw new Error('Limit exceeded');
              }
              throw new Error(extractData.error || 'Failed to extract knowledge');
            }

            const structured = extractData.data;
            fetchProfile();

            addVideoToHistory(structured);
            setActiveVideo(structured);
            setInputUrl('');
            
            // Clean up extraction query parameters
            const params = new URLSearchParams(window.location.search);
            params.delete('url');
            params.delete('manual');
            const searchStr = params.toString();
            router.replace(`/dashboard${searchStr ? `?${searchStr}` : ''}`);
          } catch (err: any) {
            if (err.message !== 'Limit exceeded') {
              setInputError(err.message || 'Scraping blocked. Try manual transcription.');
              setIsManualModalOpen(true);
            }
            
            // Clean up extraction query parameters
            const params = new URLSearchParams(window.location.search);
            params.delete('url');
            params.delete('manual');
            const searchStr = params.toString();
            router.replace(`/dashboard${searchStr ? `?${searchStr}` : ''}`);
          } finally {
            setIsExtracting(false);
            setExtractionProgress('');
          }
        }
      }
    };
    
    triggerUrlExtraction();
  }, [urlParam, apiKey, activeVideo, geminiModel, fetchProfile]);

  // Handle Manual Transcript Submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualText.trim()) return;

    setIsExtracting(true);
    setExtractionProgress('Extracting key architecture items...');

    try {
      const mockId = 'manual_' + Math.random().toString(36).substr(2, 9);
      const mockThumb = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop';
      
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data.session?.access_token;
      if (!token) {
        throw new Error('Not authenticated: please sign in first');
      }

      const extractRes = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          transcriptText: manualText,
          videoTitle: manualTitle,
          videoId: mockId,
          thumbnailUrl: mockThumb,
          channelName: manualChannel || 'Manual Upload',
          geminiModel: geminiModel,
        }),
      });

      const extractData = await extractRes.json();
      if (!extractData.success) {
        if (extractRes.status === 429) {
          setLimitExceededMsg(extractData.message || 'Daily extraction limit reached.');
          setIsLimitModalOpen(true);
          throw new Error('Limit exceeded');
        }
        throw new Error(extractData.error || 'Failed to extract knowledge');
      }

      const structured = extractData.data;
      fetchProfile();

      addVideoToHistory(structured);
      setActiveVideo(structured);
      setIsManualModalOpen(false);
      setManualTitle('');
      setManualText('');
      setManualChannel('');
    } catch (err: any) {
      if (err.message !== 'Limit exceeded') {
        alert(err.message || 'Manual extraction failed.');
      }
    } finally {
      setIsExtracting(false);
      setExtractionProgress('');
    }
  };

  // Re-run extraction or fetch new video
  const handleExtractUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setInputError('');
    setIsExtracting(true);
    setExtractionProgress('Fetching subtitles...');

    try {
      const res = await fetch(`/api/transcript?url=${encodeURIComponent(inputUrl.trim())}`);
      const data = await res.json();

      if (!data.success) {
        if (data.videoTitle && data.videoTitle !== 'YouTube Video') {
          setManualTitle(data.videoTitle);
        }
        if (data.channelName && data.channelName !== 'Unknown Channel') {
          setManualChannel(data.channelName);
        }
        throw new Error(data.error || 'Could not fetch subtitles');
      }

      setExtractionProgress('Refining topics and warnings...');
      
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data.session?.access_token;
      if (!token) {
        throw new Error('Not authenticated: please sign in first');
      }

      const extractRes = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          transcriptText: data.transcriptText,
          videoTitle: data.videoTitle,
          videoId: data.videoId,
          thumbnailUrl: data.thumbnailUrl,
          channelName: data.channelName,
          geminiModel: geminiModel,
        }),
      });

      const extractData = await extractRes.json();
      if (!extractData.success) {
        if (extractRes.status === 429) {
          setLimitExceededMsg(extractData.message || 'Daily extraction limit reached.');
          setIsLimitModalOpen(true);
          throw new Error('Limit exceeded');
        }
        throw new Error(extractData.error || 'Failed to extract knowledge');
      }

      const structured = extractData.data;
      fetchProfile();

      addVideoToHistory(structured);
      setActiveVideo(structured);
      setInputUrl('');
    } catch (err: any) {
      if (err.message !== 'Limit exceeded') {
        setInputError(err.message || 'Scraping rate-limited. Try using demo datasets or manual pasting.');
        setIsManualModalOpen(true);
      }
    } finally {
      setIsExtracting(false);
      setExtractionProgress('');
    }
  };

  // Toggle checklist selections
  const handleToggleChange = (key: keyof typeof promptConfig.toggles) => {
    setPromptConfig({
      ...promptConfig,
      toggles: {
        ...promptConfig.toggles,
        [key]: !promptConfig.toggles[key],
      },
    });
  };

  // Handle prompt creation
  const handleGeneratePrompt = async () => {
    if (!activeVideo && selectedHistoryIds.length === 0) return;

    setIsExtracting(true);
    setExtractionProgress('Assembling engineering instruction prompt...');

    try {
      // Gather inputs
      let targets: StructuredKnowledge[] = [];
      if (selectedHistoryIds.length > 0) {
        targets = history.filter(v => selectedHistoryIds.includes(v.videoId));
      } else if (activeVideo) {
        targets = [activeVideo];
      }

      const isPro = profile?.tier === 'pro';
      const limit = isPro ? 3 : 1;
      if (targets.length > limit) {
        if (!isPro) {
          setLimitExceededMsg("FREE accounts are limited to selecting 1 video at a time for prompt compilation. Upgrade to a PRO account to select and merge up to 3 videos concurrently.");
          setIsLimitModalOpen(true);
        } else {
          alert("Pro accounts are limited to merging up to 3 videos concurrently to ensure high-fidelity outputs.");
        }
        setIsExtracting(false);
        setExtractionProgress('');
        return;
      }

      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data.session?.access_token;
      if (!token) {
        throw new Error('Not authenticated: please sign in first');
      }

      const generateRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          knowledgeEntries: targets,
          config: promptConfig,
          geminiModel: geminiModel,
        }),
      });

      const generateData = await generateRes.json();
      if (!generateData.success) {
        throw new Error(generateData.error || 'Failed to generate prompt');
      }

      setGeneratedPrompt(generateData.data);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Prompt generation failed.');
    } finally {
      setIsExtracting(false);
      setExtractionProgress('');
    }
  };

  // Editing knowledge cards
  const openEditModal = (category: typeof editingCategory, index: number | null, text: string) => {
    setEditingCategory(category);
    setEditingIndex(index);
    setEditingText(text);
    setIsEditModalOpen(true);
  };

  const saveEdit = () => {
    if (!activeVideo || !editingCategory) return;

    const updated = { ...activeVideo };

    if (editingCategory === 'main_topic') {
      updated.main_topic = editingText;
    } else if (editingIndex !== null) {
      const arr = [...(updated[editingCategory] as string[])];
      arr[editingIndex] = editingText;
      (updated[editingCategory] as any) = arr;
    }

    updateVideoInHistory(updated);
    setIsEditModalOpen(false);
    setEditingCategory(null);
    setEditingIndex(null);
    setEditingText('');
  };

  const deleteCardItem = (category: 'principles' | 'lessons' | 'warnings' | 'examples' | 'frameworks', index: number) => {
    if (!activeVideo) return;
    const updated = { ...activeVideo };
    const arr = [...(updated[category] as string[])];
    arr.splice(index, 1);
    (updated[category] as any) = arr;
    updateVideoInHistory(updated);
  };

  const addCardItem = (category: 'principles' | 'lessons' | 'warnings' | 'examples' | 'frameworks') => {
    if (!activeVideo || !newCardText.trim()) return;
    const updated = { ...activeVideo };
    const arr = [...(updated[category] as string[])];
    arr.push(newCardText.trim());
    (updated[category] as any) = arr;
    updateVideoInHistory(updated);
    setNewCardText('');
  };

  // Copy to clipboard
  const handleCopyClipboard = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download markdown
  const handleDownloadMarkdown = () => {
    if (!generatedPrompt) return;
    const element = document.createElement("a");
    const file = new Blob([generatedPrompt], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${activeVideo?.videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'promptube'}_prompt.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Toggle selection for combining history
  const toggleSelectHistory = (id: string) => {
    const isChecked = selectedHistoryIds.includes(id);
    const isPro = profile?.tier === 'pro';

    if (!isChecked) {
      if (!isPro && selectedHistoryIds.length >= 1) {
        setLimitExceededMsg("FREE accounts are limited to selecting 1 video at a time for prompt compilation. Upgrade to a PRO account to select and merge up to 3 videos concurrently.");
        setIsLimitModalOpen(true);
        return;
      }
      if (isPro && selectedHistoryIds.length >= 3) {
        alert("Pro accounts are limited to merging up to 3 videos concurrently to ensure high-fidelity outputs.");
        return;
      }
    }

    const nextIds = isChecked 
      ? selectedHistoryIds.filter((x: string) => x !== id) 
      : [...selectedHistoryIds, id];
    setSelectedHistoryIds(nextIds);
  };

  // Filter history videos
  const filteredHistory = history.filter(video => 
    video.videoTitle.toLowerCase().includes(historySearch.toLowerCase()) ||
    (video.channelName && video.channelName.toLowerCase().includes(historySearch.toLowerCase())) ||
    video.tags.some(tag => tag.toLowerCase().includes(historySearch.toLowerCase()))
  );

  return (
    <div className="relative flex-1 flex flex-col bg-background min-h-[calc(100vh-4rem)]">
      
      {/* Primary Workspace Panel */}
      <div className="flex-1 flex flex-col mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-primary pb-5 mb-8">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2.5 sm:gap-4">
              <h1 className="text-2xl font-black font-headline uppercase tracking-widest text-primary leading-none">Promptube Hub</h1>
              {profile && (
                <div className="flex items-center gap-2 font-headline">
                  <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border-2 border-primary ${
                    profile.tier === 'pro' 
                      ? 'bg-accent text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {profile.tier === 'pro' ? '★ Pro Tier' : 'Free Tier'}
                  </span>
                  <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border-2 border-primary bg-background text-primary">
                    Daily Extractions: {profile.tier === 'pro' ? 'Unlimited' : `${profile.usage_count || 0} / 3`}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs font-body font-semibold text-muted-foreground mt-1">Extract lessons, refine specifications, and compile LLM engineer commands.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-card border-3 border-primary p-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black font-headline uppercase tracking-wider transition-all duration-150 cursor-pointer bg-accent text-primary border-2 border-primary bauhaus-shadow-sm"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => router.push('/history')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black font-headline uppercase tracking-wider transition-all duration-150 cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <History className="h-3.5 w-3.5" />
              <span>History</span>
              {history.length > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center border-2 border-primary bg-secondary text-[10px] font-black text-white">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* LOADING INDICATOR STATE */}
        {isExtracting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 animate-fade-in">
            <div className="flex flex-col items-center gap-4 p-8 border-4 border-primary bg-card bauhaus-shadow max-w-sm text-center">
              <div className="relative flex h-10 w-10 items-center justify-center border-3 border-primary bg-accent">
                <Sparkles className="h-5 w-5 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider font-headline text-primary">AI Refinement Active</h3>
                <p className="text-[10px] font-bold font-headline uppercase text-muted-foreground mt-1.5">{extractionProgress || 'Synthesizing structures...'}</p>
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE TAB */}
        {activeTab === 'workspace' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT AREA: EXTRACED VIDEO INFO & CARDS (col-span-7) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* YouTube Parser Input */}
              <div className="bg-card border-3 border-primary p-4 bauhaus-shadow-sm">
                <form onSubmit={handleExtractUrl} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex items-center gap-2 border-2 border-primary bg-background px-3 py-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-primary bg-secondary text-white">
                      <YoutubeIcon className="h-4 w-4 fill-current" />
                    </div>
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="Load another URL or YouTube Video ID..."
                      className="w-full bg-transparent text-xs font-headline font-bold text-primary focus:outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <button
                    type="submit"
                    className="border-2 border-primary bg-primary text-primary-foreground px-5 py-2.5 text-xs font-black uppercase tracking-wider font-headline hover:bg-accent hover:text-primary transition-all duration-150 cursor-pointer"
                  >
                    Load URL
                  </button>
                </form>
                {inputError && <p className="text-[10px] font-headline font-bold uppercase text-secondary mt-2 pl-2">{inputError}</p>}
                
                <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t-2 border-primary/20">
                  <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-muted-foreground">Have raw text?</span>
                  <button
                    onClick={() => setIsManualModalOpen(true)}
                    className="text-[10px] font-black uppercase tracking-wider font-headline text-secondary hover:underline cursor-pointer"
                  >
                    Paste custom transcript manually
                  </button>
                </div>
              </div>

              {/* Active Video Title Display */}
              {activeVideo ? (
                <div className="bg-card border-3 border-primary bauhaus-shadow-sm overflow-hidden animate-fade-in">
                  
                  {/* Video Meta row */}
                  <div className="flex flex-col sm:flex-row gap-4 p-5 bg-muted/30 border-b-3 border-primary">
                    <div className="relative aspect-video w-full sm:w-32 border-2 border-primary overflow-hidden shrink-0">
                      <img
                        src={activeVideo.thumbnailUrl}
                        alt={activeVideo.videoTitle}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <Play className="h-6 w-6 text-white/80 fill-current" />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className="border-2 border-primary bg-accent px-2 py-0.5 text-[9px] font-black uppercase tracking-widest font-headline text-primary">
                          Active Entry
                        </span>
                        {activeVideo.channelName && (
                          <span className="text-[10px] font-black uppercase tracking-wider font-headline text-muted-foreground">
                            {activeVideo.channelName}
                          </span>
                        )}
                      </div>
                      <h2 className="text-sm font-black uppercase tracking-wide font-headline text-primary mt-2 leading-snug">
                        {activeVideo.videoTitle}
                      </h2>
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {activeVideo.tags.map((tag) => (
                          <span key={tag} className="flex items-center gap-0.5 border-2 border-primary bg-background px-2.5 py-0.5 text-[9px] font-headline font-black uppercase tracking-wider text-primary">
                            <Tag className="h-2 w-2 text-secondary shrink-0" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Main Topic Editable Quote Card */}
                  <div className="p-5 border-b-3 border-primary flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-wider font-headline flex items-center gap-1.5 text-primary">
                        <BookOpen className="h-3.5 w-3.5 text-secondary" />
                        <span>Core Thesis</span>
                      </h3>
                      <button 
                        onClick={() => openEditModal('main_topic', null, activeVideo.main_topic)}
                        className="border border-primary bg-card p-1 text-primary hover:bg-accent cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    </div>
                    <blockquote className="border-l-4 border-accent bg-accent/10 p-3 text-xs font-body font-medium italic leading-relaxed text-primary">
                      "{activeVideo.main_topic}"
                    </blockquote>
                  </div>

                  {/* Dynamic Structured Knowledge Tabs */}
                  <div className="p-5 border-t-3 border-primary bg-background">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-3 border-b-3 border-primary">
                      <h3 className="text-xs font-black uppercase tracking-widest font-headline text-primary flex items-center gap-2 select-none">
                        <span className="h-3 w-3 bg-secondary border border-primary inline-block"></span>
                        Structured Architectural Knowledge
                      </h3>
                      
                      <span className="text-[10px] font-black uppercase tracking-wider font-headline bg-primary text-primary-foreground px-2.5 py-1 border-2 border-primary bauhaus-shadow-sm select-none">
                        {activeVideo[activeKnowledgeTab]?.length || 0} Entries
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      {/* Left Column: Vertical Tab Selectors */}
                      <div className="md:col-span-4 flex flex-col gap-2.5">
                        {(['principles', 'lessons', 'warnings', 'examples', 'frameworks'] as const).map((category) => {
                          const isActive = activeKnowledgeTab === category;
                          const count = activeVideo[category]?.length || 0;
                          
                          const categoryLabels = {
                            principles: 'Principles',
                            lessons: 'Key Lessons',
                            warnings: 'Warnings',
                            examples: 'Examples',
                            frameworks: 'Frameworks',
                          };

                          const categoryIcons = {
                            principles: 'architecture',
                            lessons: 'lightbulb',
                            warnings: 'warning',
                            examples: 'code',
                            frameworks: 'hub',
                          };

                          const activeColors = {
                            principles: 'bg-accent text-primary border-primary bauhaus-shadow-sm translate-x-[-2px] translate-y-[-2px]',
                            lessons: 'bg-card text-primary border-primary bauhaus-shadow-sm translate-x-[-2px] translate-y-[-2px]',
                            warnings: 'bg-secondary text-white border-primary bauhaus-shadow-sm translate-x-[-2px] translate-y-[-2px]',
                            examples: 'bg-tertiary text-white border-primary bauhaus-shadow-sm translate-x-[-2px] translate-y-[-2px]',
                            frameworks: 'bg-primary text-primary-foreground border-primary bauhaus-shadow-sm translate-x-[-2px] translate-y-[-2px]',
                          };

                          return (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setActiveKnowledgeTab(category)}
                              className={`flex items-center justify-between p-3 border-3 text-xs font-black uppercase tracking-wider font-headline transition-all duration-150 cursor-pointer select-none ${
                                isActive 
                                  ? activeColors[category] 
                                  : 'border-primary bg-card text-primary hover:bg-accent/5'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[16px] shrink-0">{categoryIcons[category]}</span>
                                <span>{categoryLabels[category]}</span>
                              </div>
                              
                              <span className={`flex h-5 w-5 items-center justify-center border-2 text-[9px] font-black ${
                                isActive 
                                  ? 'border-primary bg-background text-primary' 
                                  : 'border-primary bg-muted text-primary'
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Right Column: Card Items List */}
                      <div className="md:col-span-8 flex flex-col gap-3">
                        {(() => {
                          const list = activeVideo[activeKnowledgeTab] || [];
                          
                          const categoryColors = {
                            principles: 'bg-accent/5 border-primary border-l-8 border-l-accent',
                            lessons: 'bg-card border-primary border-l-8 border-l-primary',
                            warnings: 'bg-secondary/5 border-secondary border-l-8 border-l-secondary text-secondary',
                            examples: 'bg-tertiary/5 border-tertiary border-l-8 border-l-tertiary',
                            frameworks: 'bg-muted/30 border-primary border-l-8 border-l-primary-fixed',
                          };

                          const textColors = {
                            principles: 'text-primary',
                            lessons: 'text-primary',
                            warnings: 'text-secondary',
                            examples: 'text-primary',
                            frameworks: 'text-primary',
                          };

                          const activeCategoryLabels = {
                            principles: 'Architectural Principle Directive',
                            lessons: 'Critical Takeaway Lesson',
                            warnings: 'Anti-Pattern Warning Flag',
                            examples: 'Example Code Case Study',
                            frameworks: 'Reference Framework Model',
                          };

                          if (list.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center border-3 border-dashed border-primary bg-card/50 p-8 text-center h-[240px] select-none">
                                <span className="material-symbols-outlined text-3xl text-primary/40 mb-3">inbox</span>
                                <p className="text-xs font-headline font-black uppercase text-primary">No Entries Found</p>
                                <p className="text-[10px] font-body text-muted-foreground mt-2 max-w-xs leading-relaxed">
                                  There are currently zero entries saved in this section. Append a new item below to start structuring your system context.
                                </p>
                              </div>
                            );
                          }

                          return (
                            <>
                              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                                {list.map((item, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`group flex items-start justify-between gap-3 border-3 p-3 transition-all duration-150 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#1a1a1a] ${
                                      categoryColors[activeKnowledgeTab]
                                    }`}
                                  >
                                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                                      <span className="text-[8px] font-black uppercase tracking-widest font-headline text-primary opacity-60 select-none">
                                        {activeCategoryLabels[activeKnowledgeTab]} #{idx + 1}
                                      </span>
                                      <p className={`text-xs font-body font-medium leading-relaxed whitespace-pre-wrap break-words ${textColors[activeKnowledgeTab]}`}>
                                        {item}
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={() => openEditModal(activeKnowledgeTab, idx, item)}
                                        className="border-2 border-primary bg-card p-1 text-primary hover:bg-accent cursor-pointer transition-colors"
                                        title="Edit Item"
                                      >
                                        <span className="material-symbols-outlined text-[12px] block">edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteCardItem(activeKnowledgeTab, idx)}
                                        className="border-2 border-primary bg-card p-1 text-primary hover:bg-secondary hover:text-white cursor-pointer transition-colors"
                                        title="Delete Item"
                                      >
                                        <span className="material-symbols-outlined text-[12px] block">delete</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Fast Inline Addition Field */}
                              <div className="flex gap-2 mt-2 pt-3 border-t-2 border-primary/20">
                                <input
                                  type="text"
                                  placeholder={`Append new ${activeKnowledgeTab.substring(0, activeKnowledgeTab.length - 1)} element...`}
                                  className="flex-grow border-3 border-primary bg-card px-3 py-2 text-xs font-headline font-bold placeholder:text-muted-foreground focus:outline-none focus:bg-accent/5 focus:border-accent transition-colors"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = (e.target as HTMLInputElement).value;
                                      if (val.trim()) {
                                        const updated = { ...activeVideo };
                                        const arr = [...(updated[activeKnowledgeTab] as string[])];
                                        arr.push(val.trim());
                                        (updated[activeKnowledgeTab] as any) = arr;
                                        updateVideoInHistory(updated);
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const input = (e.currentTarget.previousSibling as HTMLInputElement);
                                    if (input && input.value.trim()) {
                                      const updated = { ...activeVideo };
                                      const arr = [...(updated[activeKnowledgeTab] as string[])];
                                      arr.push(input.value.trim());
                                      (updated[activeKnowledgeTab] as any) = arr;
                                      updateVideoInHistory(updated);
                                      input.value = '';
                                    }
                                  }}
                                  className="border-3 border-primary bg-primary px-4 py-2 text-xs font-black uppercase tracking-wider font-headline text-primary-foreground hover:bg-accent hover:text-primary transition-all duration-150 cursor-pointer shrink-0"
                                >
                                  Add Card
                                </button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center border-4 border-dashed border-primary bg-card p-12 text-center h-[400px]">
                  <YoutubeIcon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-sm font-black uppercase tracking-widest font-headline text-primary">No Video Workspace Active</h3>
                  <p className="text-xs font-body font-semibold text-muted-foreground max-w-sm mt-3 leading-relaxed">
                    Paste a YouTube URL at the top to extract structured architectural knowledge, or launch one of our pre-saved sets inside the **History** tab instantly.
                  </p>
                  <button
                    onClick={() => router.push('/history')}
                    className="mt-6 border-3 border-primary bg-accent px-5 py-2.5 text-xs font-black uppercase tracking-wider font-headline hover:bg-primary hover:text-primary-foreground hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bauhaus-shadow-sm transition-all cursor-pointer"
                  >
                    Browse History
                  </button>
                </div>
              )}

            </div>

            {/* RIGHT AREA: PROMPT CONFIGURATIONS & OUTPUT (col-span-5) */}
            <div className="lg:col-span-5 flex flex-col gap-6 sticky top-20">
              
              {/* Configurator Box */}
              <div className="bg-card border-3 border-primary p-5 bauhaus-shadow-sm">
                <h2 className="text-xs font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-secondary" />
                  <span>Prompt Builder Toggles</span>
                </h2>

                <div className="flex flex-col gap-4">
                  {/* Select: Prompt Type */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black font-headline uppercase tracking-wider text-muted-foreground mb-1.5">Prompt Type</label>
                    <select
                      value={promptConfig.promptType}
                      onChange={(e) => setPromptConfig({ ...promptConfig, promptType: e.target.value as PromptType })}
                      className="border-2 border-primary bg-background px-3 py-2 text-xs font-headline font-bold uppercase tracking-wider focus:outline-none focus:bg-accent focus:text-black dark:focus:text-black text-foreground dark:text-foreground"
                    >
                      <optgroup label="Software Engineering" className="bg-background text-foreground uppercase font-bold">
                        {['Feature Implementation', 'Bug Fix', 'Refactor', 'UI Improvement', 'UX Improvement', 'Design System', 'Mobile Optimization', 'Performance Optimization', 'Accessibility Audit', 'Database Schema Design', 'API Integration', 'Unit Test Suite Generator', 'Security Hardening', 'DevOps & CI/CD Pipeline', 'General Development'].map((t) => (
                          <option key={t} value={t} className="bg-background text-foreground uppercase font-sans font-bold">{t}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Content Creation" className="bg-background text-foreground uppercase font-bold">
                        {['News Video Script Creator', 'Story Adaptation & Recreation', 'YouTube Video Script', 'Technical Blog Post Writer', 'Social Media Content Pack', 'Podcast Outline & Script', 'Interactive Storyboard'].map((t) => (
                          <option key={t} value={t} className="bg-background text-foreground uppercase font-sans font-bold">{t}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Startup & Marketing" className="bg-background text-foreground uppercase font-bold">
                        {['Startup MVP Spec', 'SaaS Pitch Deck Outline', 'Go-To-Market Plan', 'Marketing Campaign Strategy', 'SEO Article Outline', 'Customer Support Playbook'].map((t) => (
                          <option key={t} value={t} className="bg-background text-foreground uppercase font-sans font-bold">{t}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Select: Target AI */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black font-headline uppercase tracking-wider text-muted-foreground mb-1.5">Target AI Agent</label>
                    <select
                      value={promptConfig.targetAi}
                      onChange={(e) => setPromptConfig({ ...promptConfig, targetAi: e.target.value as TargetAI })}
                      className="border-2 border-primary bg-background px-3 py-2 text-xs font-headline font-bold uppercase tracking-wider focus:outline-none focus:bg-accent focus:text-black dark:focus:text-black text-foreground dark:text-foreground"
                    >
                      {(isContentCreator 
                        ? ['Claude.ai (Web)', 'ChatGPT Plus', 'Google Gemini Web', 'Midjourney (Images)', 'Descript (AV Editor)', 'CapCut / Premiere AI', 'ElevenLabs (Voice)', 'Generic AI']
                        : isBusinessStartup
                        ? ['ChatGPT Plus', 'Claude.ai (Web)', 'Google Gemini Web', 'v0 by Vercel', 'Agentic CRM Planner', 'Generic AI']
                        : ['Cursor', 'Claude Code', 'Gemini CLI', 'Windsurf', 'Bolt', 'Lovable', 'OpenAI Codex', 'Generic AI']
                      ).map((aiName) => (
                        <option key={aiName} value={aiName} className="bg-background text-foreground uppercase font-sans font-bold">{aiName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Radio Group: Prompt Strength */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black font-headline uppercase tracking-wider text-muted-foreground mb-1.5">Prompt Strength</label>
                    <div className="grid grid-cols-3 gap-2 bg-muted p-1 border-2 border-primary">
                      {['conservative', 'balanced', 'aggressive'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setPromptConfig({ ...promptConfig, strength: st as any })}
                          className={`px-2 py-1.5 text-[9px] font-black font-headline uppercase tracking-widest transition-all duration-150 cursor-pointer ${
                            promptConfig.strength === st
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-primary'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggle checklist items (Advanced Section) */}
                  <div className="border-t-2 border-primary pt-4 mt-2 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setShowFunctionalControls(!showFunctionalControls)}
                      className="w-full flex items-center justify-between border-2 border-primary bg-muted hover:bg-accent px-3 py-2 text-[10px] font-black font-headline uppercase tracking-wider transition-all duration-150 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1.5 text-primary font-bold">
                        <span className="material-symbols-outlined text-[16px] shrink-0">settings</span>
                        <span>Advanced Options</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px] transition-transform duration-200 text-primary" style={{ transform: showFunctionalControls ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        expand_more
                      </span>
                    </button>
                    
                    {showFunctionalControls && (
                      <div className="flex flex-col gap-3 mt-2 animate-slide-up pl-2 border-l-2 border-primary/30">
                        {/* Header for Functional Controls inside the Advanced Section */}
                        <div className="flex items-center gap-1.5 text-primary border-b border-primary/10 pb-1.5 mb-0.5">
                          <span className="material-symbols-outlined text-[14px] shrink-0 text-secondary">tune</span>
                          <span className="text-[9px] font-black uppercase tracking-wider font-headline">Functional Controls</span>
                        </div>

                        <Switch
                          checked={promptConfig.toggles.addFeatures}
                          onCheckedChange={() => handleToggleChange('addFeatures')}
                          label={getToggleMetadata('addFeatures').label}
                          description={getToggleMetadata('addFeatures').description}
                        />

                        <Switch
                          checked={promptConfig.toggles.createTodo}
                          onCheckedChange={() => handleToggleChange('createTodo')}
                          label={getToggleMetadata('createTodo').label}
                          description={getToggleMetadata('createTodo').description}
                        />

                        <Switch
                          checked={promptConfig.toggles.preserveDesign}
                          onCheckedChange={() => handleToggleChange('preserveDesign')}
                          label={getToggleMetadata('preserveDesign').label}
                          description={getToggleMetadata('preserveDesign').description}
                        />

                        <Switch
                          checked={promptConfig.toggles.mobileFirst}
                          onCheckedChange={() => handleToggleChange('mobileFirst')}
                          label={getToggleMetadata('mobileFirst').label}
                          description={getToggleMetadata('mobileFirst').description}
                        />

                        <Switch
                          checked={promptConfig.toggles.accessibilityFocus}
                          onCheckedChange={() => handleToggleChange('accessibilityFocus')}
                          label={getToggleMetadata('accessibilityFocus').label}
                          description={getToggleMetadata('accessibilityFocus').description}
                        />

                        <Switch
                          checked={promptConfig.toggles.performanceFocus}
                          onCheckedChange={() => handleToggleChange('performanceFocus')}
                          label={getToggleMetadata('performanceFocus').label}
                          description={getToggleMetadata('performanceFocus').description}
                        />

                        <Switch
                          checked={promptConfig.toggles.productionReady}
                          onCheckedChange={() => handleToggleChange('productionReady')}
                          label={getToggleMetadata('productionReady').label}
                          description={getToggleMetadata('productionReady').description}
                        />

                        <Switch
                          checked={promptConfig.toggles.mvpMode}
                          onCheckedChange={() => handleToggleChange('mvpMode')}
                          label={getToggleMetadata('mvpMode').label}
                          description={getToggleMetadata('mvpMode').description}
                        />

                        <Switch
                          checked={promptConfig.toggles.seniorMode}
                          onCheckedChange={() => handleToggleChange('seniorMode')}
                          label={getToggleMetadata('seniorMode').label}
                          description={getToggleMetadata('seniorMode').description}
                        />
                      </div>
                    )}
                  </div>

                  {/* Radio Group: Application Layer */}
                  <div className="flex flex-col border-t-2 border-primary pt-4 mt-1">
                    <label className="text-[10px] font-black font-headline uppercase tracking-wider text-muted-foreground mb-1.5">
                      {isContentCreator 
                        ? 'Narrative Format Target' 
                        : isBusinessStartup 
                        ? 'Business Objective Target' 
                        : 'Stack Layer Target'}
                    </label>
                    <div className="grid grid-cols-3 gap-2 bg-muted p-1 border-2 border-primary">
                      {(isContentCreator 
                        ? [
                            { id: 'ui-only', label: 'Short-Form Script' },
                            { id: 'backend-only', label: 'Podcast Outline' },
                            { id: 'fullstack', label: 'Long-Form Video' }
                          ]
                        : isBusinessStartup
                        ? [
                            { id: 'ui-only', label: 'Lean MVP Spec' },
                            { id: 'backend-only', label: 'Investor Pitch' },
                            { id: 'fullstack', label: 'Growth Plan' }
                          ]
                        : [
                            { id: 'ui-only', label: 'UI Only' },
                            { id: 'backend-only', label: 'Backend' },
                            { id: 'fullstack', label: 'Full Stack' }
                          ]
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPromptConfig({
                            ...promptConfig,
                            toggles: { ...promptConfig.toggles, layer: item.id as any }
                          })}
                          className={`px-1 py-1.5 text-[8px] font-black font-headline uppercase tracking-widest transition-all duration-150 cursor-pointer ${
                            promptConfig.toggles.layer === item.id
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-primary'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input: Additional Context */}
                  <div className="flex flex-col border-t-2 border-primary pt-4 mt-1">
                    <label className="text-[10px] font-black font-headline uppercase tracking-wider text-muted-foreground mb-1.5">Additional Context / Scope</label>
                    <textarea
                      value={promptConfig.additionalContext || ''}
                      onChange={(e) => setPromptConfig({ ...promptConfig, additionalContext: e.target.value })}
                      placeholder="e.g. Include detailed tests using Jest, target the checkout flow..."
                      rows={3}
                      className="border-2 border-primary bg-background px-3 py-2 text-xs font-headline font-bold focus:outline-none placeholder:text-muted-foreground resize-none focus:bg-accent/5"
                    />
                  </div>

                  {/* Compilation Execution Action Button */}
                  <button
                    onClick={handleGeneratePrompt}
                    disabled={!activeVideo && selectedHistoryIds.length === 0}
                    className="w-full mt-4 border-3 border-primary bg-secondary text-white py-3.5 text-xs font-black font-headline uppercase tracking-widest hover:bg-primary transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bauhaus-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Compile Prompt
                  </button>

                </div>
              </div>

              {/* Generated Output Area */}
              {generatedPrompt && (
                <div className="bg-card border-3 border-primary bauhaus-shadow overflow-hidden animate-fade-in">
                  
                  {/* Action Header bar */}
                  <div className="flex items-center justify-between border-b-3 border-primary bg-muted p-3">
                    <span className="text-[10px] font-black font-headline uppercase tracking-widest text-primary">
                      Prompt Compiled
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyClipboard}
                        className="flex items-center gap-1.5 border-2 border-primary bg-background px-2.5 py-1.5 text-[10px] font-headline font-black uppercase tracking-wider text-primary hover:bg-accent transition-all cursor-pointer hover:translate-y-[-1px] hover:bauhaus-shadow-sm"
                        title="Copy to Clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-secondary" />
                            <span className="text-secondary">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-primary" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={handleDownloadMarkdown}
                        className="flex items-center gap-1.5 border-2 border-primary bg-background px-2.5 py-1.5 text-[10px] font-headline font-black uppercase tracking-wider text-primary hover:bg-accent transition-all cursor-pointer hover:translate-y-[-1px] hover:bauhaus-shadow-sm"
                        title="Download Markdown"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>

                  {/* Scrollable code body */}
                  <div className="p-4 bg-primary text-primary-foreground max-h-[350px] overflow-y-auto">
                    <pre className="text-left whitespace-pre-wrap font-mono text-xs text-primary-foreground leading-relaxed leading-5 select-all">
                      {generatedPrompt}
                    </pre>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* KNOWLEDGE VAULT TAB REMOVED (Moved to dedicated /history route) */}

      </div>

      {/* EDIT CARD DETAIL DIALOG MODAL */}
      <Dialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Card Item`}
        footer={
          <>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="border-2 border-primary bg-card px-4 py-2 text-xs font-black font-headline uppercase tracking-wider text-muted-foreground hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              className="border-2 border-primary bg-accent px-4 py-2 text-xs font-black font-headline uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer"
            >
              Save Changes
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black font-headline uppercase tracking-wider text-primary">Content text</label>
          <textarea
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            rows={5}
            className="w-full border-2 border-primary bg-background px-3 py-3.5 text-xs font-headline font-semibold leading-relaxed focus:outline-none focus:bg-accent/5"
          />
        </div>
      </Dialog>

      {/* MANUAL PASTE CAPTIONS DIALOG MODAL */}
      <Dialog
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Manual Transcript Input"
        maxWidth="lg"
        footer={
          <>
            <button
              onClick={() => setIsManualModalOpen(false)}
              className="border-2 border-primary bg-card px-4 py-2 text-xs font-black font-headline uppercase tracking-wider text-muted-foreground hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleManualSubmit}
              disabled={!manualTitle.trim() || !manualText.trim()}
              className="border-2 border-primary bg-accent px-4 py-2 text-xs font-black font-headline uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer disabled:opacity-50"
            >
              Extract from text
            </button>
          </>
        }
      >
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
          <p className="text-[11px] font-body text-muted-foreground leading-relaxed">
            Pasting captions manually bypasses all standard YouTube CORS or network-scraping boundaries. Add your titles and paste subtitles or custom markdown below.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-[10px] font-black font-headline uppercase tracking-wider text-primary mb-1.5">Video Title *</label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g. Master Clean Coding principles in JavaScript"
                required
                className="border-2 border-primary bg-background px-3 py-2 text-xs font-headline font-bold focus:outline-none focus:bg-accent/5"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-[10px] font-black font-headline uppercase tracking-wider text-primary mb-1.5">Channel Name / Author</label>
              <input
                type="text"
                value={manualChannel}
                onChange={(e) => setManualChannel(e.target.value)}
                placeholder="e.g. Uncle Bob Academy"
                className="border-2 border-primary bg-background px-3 py-2 text-xs font-headline font-bold focus:outline-none focus:bg-accent/5"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-black font-headline uppercase tracking-wider text-primary mb-1.5">Transcript Subtitles or Core Notes *</label>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste transcript sentences, subtitles, or video logs..."
              rows={12}
              required
              className="w-full border-2 border-primary bg-background px-4 py-3.5 text-xs font-headline font-semibold leading-relaxed resize-none focus:outline-none focus:bg-accent/5"
            />
          </div>
        </form>
      </Dialog>

      {/* DAILY EXTRACTION LIMITS EXCEEDED MODAL */}
      <Dialog
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        title="SYSTEM CONSOLE"
        footer={
          <>
            <button
              onClick={() => setIsLimitModalOpen(false)}
              className="border-2 border-primary bg-card px-4 py-2 text-xs font-black font-headline uppercase tracking-wider text-muted-foreground hover:bg-muted cursor-pointer font-bold"
            >
              Close
            </button>
            <Link
              href="/settings"
              onClick={() => setIsLimitModalOpen(false)}
              className="border-2 border-primary bg-accent text-primary px-5 py-2.5 text-xs font-black font-headline uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-all duration-150 cursor-pointer inline-block text-center font-bold"
            >
              Review Settings
            </Link>
          </>
        }
      >
        <div className="flex flex-col gap-4 text-left font-sans select-none">
          {/* MOCK CHROME BROWSER SHELL */}
          <div className="border-3 border-primary bg-zinc-950 text-zinc-100 shadow-[4px_4px_0px_0px_#1a1a1a] overflow-hidden">
            {/* mock window head */}
            <div className="flex items-center justify-between bg-zinc-900 border-b-2 border-primary px-3 py-2">
              <div className="flex items-center gap-1.5 select-none">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56] inline-block border border-red-700/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e] inline-block border border-yellow-700/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f] inline-block border border-green-700/40" />
              </div>
              <div className="bg-zinc-950 border border-zinc-800 text-zinc-400 text-[8px] font-mono px-3 py-0.5 rounded-sm select-all">
                chrome://limits/daily-video-cap
              </div>
              <div className="w-10"></div>
            </div>

            {/* inner body */}
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 shrink-0">
                  <AlertCircle className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-black font-headline uppercase tracking-wide text-rose-500 leading-tight">
                      Aw, Snap! Extraction Cap
                    </h4>
                    <span className="bg-rose-500/20 border border-rose-500/30 text-rose-400 font-mono text-[7px] px-1 rounded uppercase tracking-wider font-semibold">
                      {limitExceededMsg.toLowerCase().includes('merge') || limitExceededMsg.toLowerCase().includes('select') 
                        ? 'ERR_TIER_MERGE_LIMIT' 
                        : 'ERR_TIER_LIMIT_EXCEEDED'}
                    </span>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 font-headline">
                    {limitExceededMsg.toLowerCase().includes('merge') || limitExceededMsg.toLowerCase().includes('select') 
                      ? 'Action Restricted: Multi-Video Merging'
                      : 'FREE TIER LIMIT: 3 VIDEO EXTRACTIONS / DAY'}
                  </p>
                </div>
              </div>

              {/* DYNAMIC COOL CONVINCING COPY */}
              <div className="bg-zinc-900 border-2 border-primary/20 p-3.5">
                <p className="text-xs font-body font-semibold text-zinc-200 leading-relaxed uppercase">
                  {limitExceededMsg.toLowerCase().includes('merge') || limitExceededMsg.toLowerCase().includes('select')
                    ? "Standard accounts are limited to compiling 1 video at a time. Upgrade to Pro to merge up to 3 videos concurrently for high-fidelity outputs."
                    : "Standard parsing is capped at 3 extractions daily. Upgrade to Pro for high-fidelity processing and unlimited daily extractions."}
                </p>
              </div>

              {/* WHY UPGRADE GRID */}
              <div className="border-t border-zinc-800 pt-3.5 flex flex-col gap-2.5">
                <h5 className="text-[9px] font-black uppercase tracking-wider text-accent flex items-center gap-1.5 font-headline select-none">
                  <span>★</span>
                  <span>Power up to Pro for Unlimited Features</span>
                </h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px] uppercase font-headline font-bold text-zinc-400">
                  <div className="flex items-start gap-2 border border-zinc-800 bg-zinc-900/40 p-2 rounded">
                    <span className="text-accent text-[11px]">⚡</span>
                    <div className="flex flex-col">
                      <span className="text-zinc-200 font-bold">Unlimited Processing</span>
                      <span className="text-[7px] font-medium text-zinc-500 mt-0.5 normal-case font-body">Zero limits on daily extractions</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 border border-zinc-800 bg-zinc-900/40 p-2 rounded">
                    <span className="text-accent text-[11px]">🤖</span>
                    <div className="flex flex-col">
                      <span className="text-zinc-200 font-bold">High-Fidelity Models</span>
                      <span className="text-[7px] font-medium text-zinc-500 mt-0.5 normal-case font-body">Secure server-side Gemini endpoints</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 border border-zinc-800 bg-zinc-900/40 p-2 rounded">
                    <span className="text-accent text-[11px]">🔑</span>
                    <div className="flex flex-col">
                      <span className="text-zinc-200 font-bold">No Credentials Exposed</span>
                      <span className="text-[7px] font-medium text-zinc-500 mt-0.5 normal-case font-body">No client-side API keys needed</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 border border-zinc-800 bg-zinc-900/40 p-2 rounded">
                    <span className="text-accent text-[11px]">🧠</span>
                    <div className="flex flex-col">
                      <span className="text-zinc-200 font-bold">Deep Reasoning</span>
                      <span className="text-[7px] font-medium text-zinc-500 mt-0.5 normal-case font-body">High-fidelity prompt architecture</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* UPGRADE DETAILS FOOTER */}
              <p className="text-[8px] font-headline font-black text-zinc-500 uppercase leading-normal tracking-wide border-t border-zinc-800 pt-3">
                To upgrade, contact your administrator to set your account tier to Pro in Supabase, or configure a personal Gemini API Key in Settings for direct offline connection.
              </p>
            </div>
          </div>
        </div>
      </Dialog>

    </div>
  );
}
