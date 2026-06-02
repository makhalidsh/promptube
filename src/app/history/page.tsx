'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, Check, Eye, Trash2, Tag, LayoutDashboard, History, Sparkles, AlertCircle
} from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import Dialog from '@/components/ui/Dialog';

export default function HistoryPage() {
  const router = useRouter();
  
  const {
    history,
    selectedHistoryIds,
    setSelectedHistoryIds,
    activeVideo,
    setActiveVideo,
    removeVideoFromHistory,
    profile,
  } = useAppContext();

  const [historySearch, setHistorySearch] = useState('');
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitExceededMsg, setLimitExceededMsg] = useState('');

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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black font-headline uppercase tracking-wider transition-all duration-150 cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => router.push('/history')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black font-headline uppercase tracking-wider transition-all duration-150 cursor-pointer bg-accent text-primary border-2 border-primary bauhaus-shadow-sm"
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

        {/* KNOWLEDGE VAULT TAB CONTENT */}
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {/* Vault filters & controls */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-card border-3 border-primary p-4 bauhaus-shadow-sm justify-between">
            
            {/* Search history */}
            <div className="w-full sm:max-w-md flex items-center gap-2 border-2 border-primary bg-background px-3 py-2">
              <Search className="h-4 w-4 text-primary" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search previously extracted titles, tags, or channels..."
                className="w-full bg-transparent text-xs font-headline font-bold text-primary focus:outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Batch execution indicators */}
            {selectedHistoryIds.length > 0 ? (
              <div className="flex items-center gap-3 animate-fade-in">
                <span className="text-[10px] font-headline font-black uppercase tracking-wider text-primary">
                  {selectedHistoryIds.length} item(s) selected
                </span>
                
                <button
                  onClick={() => {
                    router.push('/dashboard');
                    // Focus scroll on Prompt Config after redirecting
                    setTimeout(() => {
                      window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                      });
                    }, 200);
                  }}
                  className="border-3 border-primary bg-secondary text-white px-4 py-2 text-xs font-black font-headline uppercase tracking-wider hover:bg-primary transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bauhaus-shadow cursor-pointer"
                >
                  Configure Combined Prompt
                </button>

                <button
                  onClick={() => setSelectedHistoryIds([])}
                  className="text-[10px] font-black uppercase tracking-wider font-headline text-muted-foreground hover:text-secondary cursor-pointer"
                >
                  Clear Select
                </button>
              </div>
            ) : profile && (
              <div className="flex items-center gap-2 font-headline animate-fade-in">
                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border-2 border-primary ${
                  profile.tier === 'pro' 
                    ? 'bg-accent text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {profile.tier === 'pro' ? '★ Pro Tier' : 'Free Tier'}
                </span>
                <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border-2 border-primary bg-background text-primary">
                  Daily Extractions: {profile.tier === 'pro' ? 'Unlimited' : `${profile.usage_count || 0} / 3`}
                </span>
              </div>
            )}
          </div>

          {/* Grid of cards */}
          {filteredHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {filteredHistory.map((video) => {
                const isChecked = selectedHistoryIds.includes(video.videoId);
                const isLoaded = activeVideo?.videoId === video.videoId;

                return (
                  <div 
                    key={video.videoId}
                    className={`relative flex flex-col border-3 border-primary bg-card p-5 transition-all duration-150 bauhaus-shadow-sm select-none hover:translate-y-[-2px] hover:bauhaus-shadow ${
                      isChecked ? 'bg-accent/15 border-secondary' : ''
                    }`}
                  >
                    {/* Checkbox badge top corner */}
                    <button
                      onClick={() => toggleSelectHistory(video.videoId)}
                      className={`absolute top-4 right-4 flex h-6 w-6 items-center justify-center border-2 border-primary bg-card transition-all cursor-pointer ${
                        isChecked ? 'bg-accent text-primary' : 'hover:bg-accent/20'
                      }`}
                    >
                      {isChecked && <Check className="h-4 w-4 text-primary font-black" />}
                    </button>

                    {/* Header Video Row */}
                    <div className="flex gap-3.5 items-start mb-4 pr-6">
                      <div className="relative h-12 w-20 border border-primary bg-muted shrink-0">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.videoTitle}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop';
                          }}
                        />
                      </div>
                      <div>
                        {video.channelName && (
                          <span className="text-[9px] font-black font-headline uppercase text-muted-foreground">
                            {video.channelName}
                          </span>
                        )}
                        <h3 className="text-xs font-black uppercase tracking-wide font-headline text-primary line-clamp-2 leading-snug mt-0.5" title={video.videoTitle}>
                          {video.videoTitle}
                        </h3>
                      </div>
                    </div>

                    {/* Core Thesis */}
                    <p className="text-[11px] font-body text-muted-foreground line-clamp-3 leading-relaxed flex-grow">
                      {video.main_topic}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-4">
                      {video.tags.map((tag) => (
                        <span key={tag} className="border border-primary bg-background px-2 py-0.5 text-[8px] font-headline font-bold uppercase tracking-wider text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Card Footer controls */}
                    <div className="flex items-center justify-between border-t border-primary/20 mt-5 pt-3.5">
                      
                      {/* Launch active */}
                      <button
                        onClick={() => {
                          setActiveVideo(video);
                          router.push('/dashboard');
                        }}
                        className={`flex items-center gap-1 text-[10px] font-black font-headline uppercase tracking-wider cursor-pointer transition-colors ${
                          isLoaded ? 'text-secondary' : 'text-primary hover:text-secondary'
                        }`}
                      >
                        <Eye className="h-3 w-3" />
                        <span>{isLoaded ? 'Loaded Workspace' : 'Load in Workspace'}</span>
                      </button>

                      {/* Trash */}
                      <button
                        onClick={() => removeVideoFromHistory(video.videoId)}
                        className="border border-primary bg-card p-1 text-primary hover:bg-secondary hover:text-white transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border-4 border-dashed border-primary bg-card p-16 text-center h-[350px]">
              <Search className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-sm font-black uppercase tracking-widest font-headline text-primary">No matches found</h3>
              <p className="text-xs font-body font-semibold text-muted-foreground max-w-xs mt-2 leading-relaxed">
                Try typing another search keyword, or paste a new video URL to add more items to your history!
              </p>
            </div>
          )}

        </div>

      </div>

      {/* LIMIT EXCEEDED DIALOG */}
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
