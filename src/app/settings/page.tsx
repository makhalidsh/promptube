'use client';

import React, { useState } from 'react';
import { 
  Key, Shield, AlertTriangle, RefreshCw, Moon, Sun, 
  Trash2, Database, HelpCircle, ArrowLeft, Check, Eye, EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/components/AppContext';
import { getDemoVideos } from '@/lib/demoData';
import Dialog from '@/components/ui/Dialog';
import YoutubeIcon from '@/components/ui/YoutubeIcon';

export default function SettingsPage() {
  const {
    apiKey,
    setApiKey,
    geminiModel,
    setGeminiModel,
    vault,
    setVault,
    theme,
    setTheme,
    resetVault,
    user,
    signOut,
    profile,
    fetchProfile,
  } = useAppContext();

  // Load latest profile on mount
  React.useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Settings UI states
  const [localKey, setLocalKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isKeySavedFeedback, setIsKeySavedFeedback] = useState(false);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Save API Key
  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(localKey.trim());
    setIsKeySavedFeedback(true);
    setTimeout(() => setIsKeySavedFeedback(false), 2500);
  };

  // Delete API Key
  const handleDeleteKey = () => {
    setApiKey('');
    setLocalKey('');
    setIsKeySavedFeedback(true);
    setTimeout(() => setIsKeySavedFeedback(false), 2500);
  };

  // Reset local database history
  const handleResetHistory = () => {
    resetVault();
    setIsResetConfirmOpen(false);
  };

  // Reload defaults
  const handleLoadDemos = () => {
    const demos = getDemoVideos();
    setVault(demos);
  };

  return (
    <div className="relative flex-1 flex flex-col bg-background">

      <div className="flex-1 mx-auto max-w-3xl w-full px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Settings Header */}
        <div className="flex items-center gap-4 border-b-4 border-primary pb-5 mb-8">
          <Link
            href="/dashboard"
            className="border-3 border-primary bg-card p-2 text-primary hover:bg-accent transition-all cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:bauhaus-shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black font-headline uppercase tracking-widest text-primary">Global Settings</h1>
            <p className="text-xs font-body font-semibold text-muted-foreground">Configure AI engines, manage history records, and adjust visual themes.</p>
          </div>
        </div>

        {/* Configurations Content */}
        <div className="flex flex-col gap-8">
          
          {/* Section 0: User Profile & Authentication */}
          {user && (
            <div className="flex flex-col gap-6">
              <div className="bg-card border-3 border-primary p-6 bauhaus-shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center border-4 border-primary bg-secondary text-white shrink-0">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-widest font-headline text-primary">
                      AUTHENTICATED ACCOUNT IDENTITY
                    </h2>
                    <p className="text-sm font-black font-headline text-secondary mt-1 select-all">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="inline-block h-2.5 w-2.5 bg-accent border border-primary animate-pulse" />
                      <span className="text-[9px] font-black font-headline uppercase tracking-wider text-muted-foreground">
                        DATABASE SYNCHRONIZATION ACTIVE (SUPABASE CLOUD)
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="border-2 border-primary bg-secondary text-white px-5 py-2.5 text-xs font-black font-headline uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-all duration-150 cursor-pointer shrink-0"
                >
                  Sign Out Account
                </button>
              </div>

              {/* Account Tier Dashboard */}
              <div className="bg-card border-3 border-primary p-6 bauhaus-shadow-sm flex flex-col md:flex-row gap-6 items-stretch animate-fade-in">
                <div className="flex-1 flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase tracking-widest font-headline text-primary">
                    Subscription Tier & Quotas
                  </h3>
                  <p className="text-[10px] font-body text-muted-foreground leading-relaxed">
                    Promptube has two account levels: Free Tier and Pro Tier. Free tier utilizes local offline heuristic parsing with 3 extractions daily limit, while Pro Tier enables deep high-fidelity AI-powered extractions using secure server-side Gemini endpoints.
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mt-3">
                    <div className="flex flex-col border-2 border-primary bg-background px-4 py-3 min-w-[140px]">
                      <span className="text-[9px] font-black uppercase text-muted-foreground font-headline">Active Plan</span>
                      <span className={`text-sm font-black uppercase mt-1 font-headline ${profile?.tier === 'pro' ? 'text-accent' : 'text-primary'}`}>
                        {profile?.tier === 'pro' ? '★ Pro Tier' : 'Free Tier'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col border-2 border-primary bg-background px-4 py-3 min-w-[180px]">
                      <span className="text-[9px] font-black uppercase text-muted-foreground font-headline">Daily Usage Today</span>
                      <span className="text-sm font-black uppercase mt-1 font-headline text-primary">
                        {profile?.tier === 'pro' ? 'Unlimited' : `${profile?.usage_count || 0} / 3 Extractions`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-72 border-t-3 md:border-t-0 md:border-l-3 border-primary pt-6 md:pt-0 md:pl-6 flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider font-headline text-primary">
                      {profile?.tier === 'pro' ? '★ Pro Account Active' : 'Upgrade to Pro Account'}
                    </h4>
                    <p className="text-[10px] font-bold font-headline uppercase text-muted-foreground mt-1 leading-normal">
                      {profile?.tier === 'pro'
                        ? 'You have unlimited premium Gemini AI extractions. Secure server-side processing is active.'
                        : 'Unlock unlimited video parsing, premium AI models, and zero client-side API key configuration.'}
                    </p>
                  </div>
                  
                  {profile?.tier !== 'pro' && (
                    <div className="border-2 border-dashed border-primary bg-accent/5 p-3 text-[9px] font-headline font-black uppercase text-primary tracking-normal leading-relaxed">
                      To upgrade, contact your administrator to set your account tier to Pro in Supabase.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section 1: AI Provider */}
          <div className="bg-card border-3 border-primary p-6 bauhaus-shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest font-headline text-primary mb-2 flex items-center gap-1.5">
              <Key className="h-4 w-4 text-secondary" />
              <span>AI Provider & Gemini Credentials</span>
            </h2>
            <p className="text-[10px] font-body text-muted-foreground leading-relaxed mb-6">
              Promptube uses a hybrid model. By default, it runs instantly in your browser using structured template engines. 
              To get rich, high-fidelity JSON extractions directly from Google Models, provide a custom Gemini API Key below.
            </p>

            <form onSubmit={handleSaveKey} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-black font-headline uppercase tracking-wider text-muted-foreground mb-1.5">Gemini API Key</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex items-center gap-2 border-2 border-primary bg-background px-3 py-2 min-w-0">
                    <Shield className="h-4 w-4 text-primary shrink-0" />
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={localKey}
                      onChange={(e) => setLocalKey(e.target.value)}
                      placeholder={apiKey ? '••••••••••••••••••••••••••••••••' : 'Enter your Google Gemini API Key...'}
                      className="w-full bg-transparent text-xs font-headline font-bold text-primary focus:outline-none placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="text-primary hover:text-secondary shrink-0 cursor-pointer"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="border-2 border-primary bg-primary text-primary-foreground px-5 py-2 text-xs font-black font-headline uppercase tracking-wider hover:bg-accent hover:text-primary transition-all duration-150 cursor-pointer shrink-0"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </form>

            <div className="flex items-center justify-between gap-4 mt-5 pt-4 border-t-2 border-primary/20">
              <div className="flex items-center gap-1.5">
                <span className={`inline-block h-3.5 w-3.5 border border-primary ${apiKey ? 'bg-accent' : 'bg-muted'}`} />
                <span className="text-[10px] font-black font-headline uppercase tracking-wider text-primary">
                  Status: {apiKey ? 'Gemini AI Model Connected' : 'Local Offline Parser Active'}
                </span>
              </div>
              
              {apiKey && (
                <button
                  onClick={handleDeleteKey}
                  className="text-[10px] font-black font-headline uppercase tracking-wider text-secondary hover:underline cursor-pointer"
                >
                  Disconnect API Key
                </button>
              )}
            </div>

            {isKeySavedFeedback && (
              <div className="mt-4 border-2 border-primary bg-accent/20 px-3 py-2 text-[10px] font-black font-headline uppercase tracking-wider text-primary animate-fade-in">
                <Check className="h-3.5 w-3.5 inline mr-1" />
                <span>API credentials synchronized successfully.</span>
              </div>
            )}

            {/* Model Selection */}
            <div className="flex flex-col border-t-2 border-primary/20 pt-5 mt-5">
              <label className="text-[10px] font-black font-headline uppercase tracking-wider text-muted-foreground mb-2">Active Generation Model</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gemini 2.5 Flash card */}
                <button
                  type="button"
                  onClick={() => setGeminiModel('gemini-2.5-flash')}
                  className={`flex flex-col items-start justify-center border-3 border-primary p-4 transition-all duration-150 cursor-pointer text-left ${
                    geminiModel === 'gemini-2.5-flash'
                      ? 'bg-accent text-primary bauhaus-shadow-sm translate-x-[-2px] translate-y-[-2px]'
                      : 'bg-card text-primary hover:bg-accent/5'
                  }`}
                >
                  <span className="text-xs font-black font-headline uppercase tracking-wider">Gemini 2.5 Flash</span>
                  <span className="text-[9px] font-bold font-headline uppercase text-muted-foreground mt-1">Recommended • Free Tier Active</span>
                  <span className="text-[10px] font-body text-primary mt-2">Highly responsive, massive daily limits, and fully free. Avoids quota rate-limit blocks.</span>
                </button>

                {/* Gemini 2.5 Pro card */}
                <button
                  type="button"
                  onClick={() => setGeminiModel('gemini-2.5-pro')}
                  className={`flex flex-col items-start justify-center border-3 border-primary p-4 transition-all duration-150 cursor-pointer text-left ${
                    geminiModel === 'gemini-2.5-pro'
                      ? 'bg-accent text-primary bauhaus-shadow-sm translate-x-[-2px] translate-y-[-2px]'
                      : 'bg-card text-primary hover:bg-accent/5'
                  }`}
                >
                  <span className="text-xs font-black font-headline uppercase tracking-wider">Gemini 2.5 Pro</span>
                  <span className="text-[9px] font-bold font-headline uppercase text-muted-foreground mt-1">Paid API Key • Deep Reasoning</span>
                  <span className="text-[10px] font-body text-primary mt-2">Advanced cognitive architectures. (Free API keys are blocked or quota-limited to 0).</span>
                </button>
              </div>
            </div>
          </div>



          {/* Section 2: Vault History Records */}
          <div className="bg-card border-3 border-primary p-6 bauhaus-shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest font-headline text-primary mb-2 flex items-center gap-1.5">
              <Database className="h-4 w-4 text-secondary" />
              <span>Storage Database & Vault Operations</span>
            </h2>
            <p className="text-[10px] font-body text-muted-foreground leading-relaxed mb-6">
              Promptube synchronizes all structured knowledge cards with your Supabase cloud database instance. This ensures your prompts are permanently archived and accessible from any device. You can wipe your history logs or reload standard demo configurations here.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Vault Stats */}
              <div className="border-3 border-primary bg-muted p-5 flex flex-col justify-center">
                <span className="text-[10px] font-black font-headline uppercase text-muted-foreground tracking-wider leading-none">History Records</span>
                <span className="text-4xl font-black font-headline text-primary mt-3 leading-none">{vault.length}</span>
                <span className="text-[9px] font-headline font-bold uppercase tracking-wider text-muted-foreground mt-2">Structured video cards in storage</span>
              </div>

              {/* Db Action list */}
              <div className="flex flex-col gap-3 justify-center">
                <button
                  onClick={handleLoadDemos}
                  className="w-full flex items-center justify-center gap-1.5 border-2 border-primary bg-card hover:bg-accent text-xs font-black font-headline uppercase tracking-wider py-2.5 transition-all duration-150 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:bauhaus-shadow-sm cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-primary" />
                  <span>Reload Demo Video Cards</span>
                </button>

                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  disabled={vault.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 border-2 border-primary bg-secondary/15 hover:bg-secondary text-secondary hover:text-white text-xs font-black font-headline uppercase tracking-wider py-2.5 transition-all duration-150 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear Storage Database</span>
                </button>
              </div>

            </div>
          </div>

          {/* Section 3: Interface Customization */}
          <div className="bg-card border-3 border-primary p-6 bauhaus-shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest font-headline text-primary mb-2 flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-secondary" />
              <span>Visual Customization & Styling</span>
            </h2>
            <p className="text-[10px] font-body text-muted-foreground leading-relaxed mb-6">
              Switch between premium dark mode (stark high-contrast dark styling) and clean Bauhaus warm light mode options.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Dark Theme Select */}
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center border-3 border-primary p-5 transition-all duration-150 cursor-pointer gap-2.5 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bauhaus-shadow-sm ${
                  theme === 'dark' ? 'bg-primary text-primary-foreground shadow-none' : 'bg-card text-primary'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center border-2 border-primary bg-zinc-950 text-accent`}>
                  <Moon className="h-5 w-5" />
                </div>
                <span className="text-xs font-black font-headline uppercase tracking-wider">Stark Dark Mode</span>
              </button>

              {/* Light Theme Select */}
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center border-3 border-primary p-5 transition-all duration-150 cursor-pointer gap-2.5 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bauhaus-shadow-sm ${
                  theme === 'light' ? 'bg-accent text-primary shadow-none' : 'bg-card text-primary'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center border-2 border-primary bg-white text-primary`}>
                  <Sun className="h-5 w-5" />
                </div>
                <span className="text-xs font-black font-headline uppercase tracking-wider">Bauhaus Light Mode</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* CONFIRM STORAGE RESET MODAL */}
      <Dialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Confirm Database Wipe"
        footer={
          <>
            <button
              onClick={() => setIsResetConfirmOpen(false)}
              className="border-2 border-primary bg-card px-4 py-2 text-xs font-black font-headline uppercase tracking-wider text-muted-foreground hover:bg-muted cursor-pointer"
            >
              Cancel Wiping
            </button>
            <button
              onClick={handleResetHistory}
              className="border-2 border-primary bg-secondary text-white px-4 py-2 text-xs font-black font-headline uppercase tracking-wider hover:bg-primary transition-all duration-150 cursor-pointer"
            >
              Wipe Database History
            </button>
          </>
        }
      >
        <div className="flex items-start gap-4 p-1">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-primary bg-secondary text-white shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider font-headline text-primary">Are you absolutely sure?</h4>
            <p className="text-[11px] font-body text-muted-foreground leading-relaxed mt-2">
              This action cannot be undone. Clicking confirm will permanently wipe all {vault.length} extracted YouTube video entries and tags from your local storage database instance.
            </p>
          </div>
        </div>
      </Dialog>

    </div>
  );
}
