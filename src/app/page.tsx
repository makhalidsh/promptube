'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layers, Terminal, Network } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { getDemoVideos } from '@/lib/demoData';
import ColorBends from '@/components/ui/ColorBends/ColorBends';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  const { 
    setActiveVideo, 
    addVideoToVault, 
    isExtracting, 
    setIsExtracting, 
    setExtractionProgress,
    user,
    profile,
    fetchProfile,
    signOut
  } = useAppContext();

  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgradeToPro = async () => {
    if (!user) {
      router.push('/dashboard');
      return;
    }
    try {
      setIsUpgrading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ tier: 'pro' })
        .eq('id', user.id);
      if (error) throw error;
      await fetchProfile();
      alert('Congratulations! Your account has been upgraded to PRO. You can now merge up to 3 videos concurrently in your Workspace.');
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      alert('Failed to upgrade account: ' + err.message);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDowngradeToFree = async () => {
    if (!user) {
      router.push('/dashboard');
      return;
    }
    try {
      setIsUpgrading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ tier: 'free' })
        .eq('id', user.id);
      if (error) throw error;
      await fetchProfile();
      alert('Your account tier has been successfully set back to FREE.');
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      alert('Failed to change tier: ' + err.message);
    } finally {
      setIsUpgrading(false);
    }
  };
  
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const demos = getDemoVideos();

  // Handle URL submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError('');
    setIsExtracting(true);
    setExtractionProgress('Extracting video details...');

    try {
      const res = await fetch(`/api/transcript?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch transcript');
      }

      setIsExtracting(false);
      router.push(`/dashboard?url=${encodeURIComponent(url.trim())}`);
    } catch (err: any) {
      setIsExtracting(false);
      setError(err.message || 'Could not fetch the transcript. Please try pasting a transcript manually in the Dashboard.');
      
      setTimeout(() => {
        router.push(`/dashboard?manual=true&title=Manual%20Video`);
      }, 3000);
    }
  };

  // Launch a demo video immediately
  const handleSelectDemo = (demoId: string) => {
    const selected = demos.find(d => d.videoId === demoId);
    if (selected) {
      addVideoToVault(selected);
      setActiveVideo(selected);
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex-grow bg-background text-foreground font-body relative flex flex-col justify-center items-center px-4 sm:px-8 py-16 md:py-24 z-10 select-none overflow-x-hidden">
      
      {/* ColorBends WebGL Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-30 w-full h-full">
        <ColorBends
          rotation={90}
          speed={0.2}
          colors={["#5227FF","#FF9FFC","#7cff67","#ffffff"] as any}
          transparent
          autoRotate={0}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          parallax={0.5}
          noise={0.15}
          iterations={1}
          intensity={1.5}
          bandWidth={6}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        />
      </div>

      {/* Background Dots Grid */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

      {/* Hero Heading */}
      <div className="text-center mb-12 select-none z-10 w-full max-w-4xl flex flex-col items-center">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-headline tracking-tighter uppercase text-foreground leading-[0.9]">
          EXTRACT<br/>KNOWLEDGE
        </h1>
        <p className="text-xs sm:text-base md:text-lg font-bold uppercase tracking-widest mt-6 text-muted-foreground">
          The Bauhaus OS for Digital Synthesis
        </p>
      </div>

      {/* Brutalist Input Field */}
      <form onSubmit={handleSubmit} className="w-full max-w-3xl mb-20 z-10 px-4">
        <div className="flex flex-col md:flex-row gap-0 neo-shadow">
          <input 
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isExtracting}
            className="flex-grow p-6 border-4 border-primary bg-card text-base sm:text-xl font-headline focus:outline-none focus:ring-0 placeholder:text-muted-foreground uppercase text-foreground font-bold" 
            placeholder={isExtracting ? "PARSING VIDEO DETAILS..." : "PASTE YOUTUBE URL OR PROMPT SOURCE..."}
          />
          <button 
            type="submit"
            disabled={isExtracting}
            className="bg-primary text-primary-foreground font-black font-headline px-12 py-6 text-base sm:text-xl uppercase hover:bg-accent hover:text-primary transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0 border-4 border-t-0 md:border-t-4 md:border-l-0 border-primary"
          >
            {isExtracting ? "PROCESSING..." : "PROCESS"}
          </button>
        </div>
        {error && (
          <div className="border-4 border-primary bg-secondary text-white font-headline font-bold uppercase tracking-wider text-xs sm:text-sm p-4 mt-6 text-left neo-shadow">
            {error}
          </div>
        )}
      </form>

      {/* Auth Screen Gate Navigation */}
      {user ? (
        <button 
          onClick={signOut}
          className="mb-16 border-4 border-primary bg-secondary text-white font-black font-headline px-8 py-4 text-sm uppercase hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer neo-shadow z-10 shrink-0"
        >
          Return to Promptube Gate
        </button>
      ) : (
        <Link 
          href="/dashboard"
          className="mb-16 border-4 border-primary bg-accent text-primary font-black font-headline px-8 py-4 text-sm uppercase hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer neo-shadow z-10 shrink-0 inline-block text-center"
        >
          Enter Promptube Gate
        </Link>
      )}

      {/* Geometric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl z-10 px-4">
        
        {/* SaaS Scaffolding Card */}
        <div 
          onClick={() => handleSelectDemo('Yl3L-R9P9vA')}
          className="group relative bg-[#ffcc00] border-4 border-primary p-6 sm:p-8 neo-shadow neo-shadow-hover transition-all cursor-pointer overflow-hidden text-[#1a1a1a]"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
            <Layers className="h-16 w-16 text-[#1a1a1a]" />
          </div>
          <h3 className="font-headline font-black text-xl sm:text-2xl mb-4 uppercase text-[#1a1a1a]">SaaS Scaffolding</h3>
          <p className="font-body text-xs sm:text-sm font-bold uppercase mb-6 leading-tight text-[#1a1a1a]/90">Generate foundational architecture from technical teardowns.</p>
          <div className="h-1 bg-[#1a1a1a] w-12 group-hover:w-full transition-all duration-500"></div>
        </div>

        {/* Clean Code Card */}
        <div 
          onClick={() => handleSelectDemo('L18dG2P-XoM')}
          className="group relative bg-[#e63b2e] border-4 border-primary p-6 sm:p-8 neo-shadow neo-shadow-hover transition-all cursor-pointer overflow-hidden text-white"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
            <Terminal className="h-16 w-16 text-white" />
          </div>
          <h3 className="font-headline font-black text-xl sm:text-2xl mb-4 uppercase text-white">Clean Code</h3>
          <p className="font-body text-xs sm:text-sm font-bold uppercase mb-6 leading-tight text-white/95">Refactor legacy logic into modern paradigms instantly.</p>
          <div className="h-1 bg-white w-12 group-hover:w-full transition-all duration-500"></div>
        </div>

        {/* App Router Card */}
        <div 
          onClick={() => handleSelectDemo('T3m9q8R9a_s')}
          className="group relative bg-[#0055ff] border-4 border-primary p-6 sm:p-8 neo-shadow neo-shadow-hover transition-all cursor-pointer overflow-hidden text-white"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
            <Network className="h-16 w-16 text-white" />
          </div>
          <h3 className="font-headline font-black text-xl sm:text-2xl mb-4 uppercase text-white">App Router</h3>
          <p className="font-body text-xs sm:text-sm font-bold uppercase mb-6 leading-tight text-white/95">Automate nested navigation and server-side state logic.</p>
          <div className="h-1 bg-white w-12 group-hover:w-full transition-all duration-500"></div>
        </div>

      </div>

      {/* Plan Comparisons / Pricing Section */}
      <div className="w-full max-w-5xl mt-24 z-10 px-4 flex flex-col gap-10 mb-12">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-black font-headline uppercase tracking-wider text-primary">
            CHOOSE YOUR INTERFACE LEVEL
          </h2>
          <p className="text-xs font-headline font-bold uppercase tracking-widest text-muted-foreground mt-2">
            SELECT A TIER CONFORMING TO YOUR PIPELINE DEMANDS
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Free Tier Card */}
          <div className="bg-card border-4 border-primary p-6 sm:p-8 flex flex-col justify-between gap-6 relative neo-shadow">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-baseline border-b-4 border-primary pb-4">
                <h3 className="font-headline font-black text-2xl uppercase text-primary">FREE TIER</h3>
                <div className="flex flex-col items-end">
                  <span className="font-headline font-black text-2xl text-primary">$0</span>
                  <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider mt-0.5">PER MONTH</span>
                </div>
              </div>

              <p className="font-body text-xs font-semibold text-muted-foreground uppercase leading-relaxed text-left">
                PERFECT FOR HOBBYISTS AND CASUAL DISCOVERIES. EXPLORE AND SYNTHESIZE TECHNICAL VIDEOS OFFLINE USING LOCAL PARSING PARADIGMS.
              </p>

              <div className="flex flex-col gap-3.5 mt-2 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary border-b border-primary/20 pb-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-primary inline-block"></span> CORE SPECS
                </span>
                <ul className="text-[10px] font-semibold text-muted-foreground uppercase list-disc list-inside flex flex-col gap-2">
                  <li>3 VIDEO EXTRACTIONS DAILY QUOTA</li>
                  <li>LOCAL HEURISTIC OFFLINE STRUCTURING</li>
                  <li>KNOWLEDGE ARCHIVE VAULT & SEED REPOSITORIES</li>
                  <li>DEFAULT TRANSLATION BINDINGS ACTIVE</li>
                </ul>
              </div>
            </div>

            {user ? (
              profile?.tier === 'pro' ? (
                <button
                  onClick={handleDowngradeToFree}
                  disabled={isUpgrading}
                  className="w-full text-center border-4 border-primary bg-card hover:bg-muted text-primary py-3.5 text-xs font-black font-headline uppercase tracking-widest transition-all duration-150 hover:translate-y-[-1px] hover:bauhaus-shadow-sm cursor-pointer mt-6 disabled:opacity-50"
                >
                  {isUpgrading ? 'PROCESSING...' : 'DOWNGRADE TO FREE'}
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="w-full text-center border-4 border-primary bg-card text-primary py-3.5 text-xs font-black font-headline uppercase tracking-widest transition-all duration-150 mt-6 border-dashed opacity-75 inline-block"
                >
                  ✓ FREE PLAN ACTIVE (ENTER WORKSPACE)
                </Link>
              )
            ) : (
              <Link
                href="/dashboard"
                className="w-full text-center border-4 border-primary bg-card hover:bg-muted text-primary py-3.5 text-xs font-black font-headline uppercase tracking-widest transition-all duration-150 hover:translate-y-[-1px] hover:bauhaus-shadow-sm cursor-pointer mt-6 inline-block"
              >
                ACCESS FREE WORKSPACE
              </Link>
            )}
          </div>

          {/* Pro Tier Card */}
          <div className="bg-[#ffcc00] border-4 border-primary p-6 sm:p-8 flex flex-col justify-between gap-6 relative neo-shadow text-[#1a1a1a]">
            {/* Hot Popular Badge */}
            <div className="absolute top-0 right-8 translate-y-[-50%] border-4 border-primary bg-[#e63b2e] text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest font-headline">
              ★ POPULAR
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-baseline border-b-4 border-primary pb-4 border-[#1a1a1a]">
                <h3 className="font-headline font-black text-2xl uppercase text-[#1a1a1a]">PRO TIER</h3>
                <div className="flex flex-col items-end">
                  <span className="font-headline font-black text-2xl text-[#1a1a1a]">$5.98</span>
                  <span className="text-[9px] font-bold uppercase text-[#1a1a1a]/70 tracking-wider mt-0.5">PER MONTH</span>
                </div>
              </div>

              <p className="font-body text-xs font-semibold text-[#1a1a1a]/85 uppercase leading-relaxed text-left">
                ENGINEERED FOR POWER USERS AND ELITE SYSTEM BUILDERS. UNLOCK THE FULL REASONING INTENSITY OF GOOGLE GEMINI MODELS SECURELY ON THE SERVER SIDE.
              </p>

              <div className="flex flex-col gap-3.5 mt-2 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1a1a1a] border-b border-[#1a1a1a]/20 pb-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-[#1a1a1a] inline-block"></span> ADVANCED SPECS
                </span>
                <ul className="text-[10px] font-semibold text-[#1a1a1a]/80 uppercase list-disc list-inside flex flex-col gap-2">
                  <li className="font-black text-[#1a1a1a]">UNLIMITED VIDEO EXTRACTIONS</li>
                  <li>SECURE SERVER-SIDE GEMINI 2.5 PRO & FLASH APIS</li>
                  <li>ZERO CLIENT-SIDE API KEYS CONFIGURATION REQUIRED</li>
                  <li>ULTRA HIGH-FIDELITY CO-STAR XML/JSON ARCHITECTURES</li>
                  <li>PRIORITY RESPONSE THROTTLES FOR RAPID PIPELINES</li>
                </ul>
              </div>
            </div>

            {user ? (
              profile?.tier === 'pro' ? (
                <Link
                  href="/dashboard"
                  className="w-full text-center border-4 border-primary bg-[#e63b2e] hover:bg-[#ffcc00] hover:text-[#1a1a1a] text-white py-3.5 text-xs font-black font-headline uppercase tracking-widest transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bauhaus-shadow-sm cursor-pointer mt-6 inline-block"
                >
                  ★ PRO ACTIVE (ENTER WORKSPACE)
                </Link>
              ) : (
                <button
                  onClick={handleUpgradeToPro}
                  disabled={isUpgrading}
                  className="w-full text-center border-4 border-primary bg-[#e63b2e] hover:bg-primary text-white hover:text-primary-foreground py-3.5 text-xs font-black font-headline uppercase tracking-widest transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bauhaus-shadow-sm cursor-pointer mt-6 disabled:opacity-50"
                >
                  {isUpgrading ? 'PROCESSING...' : 'UPGRADE PLAN TO PRO'}
                </button>
              )
            ) : (
              <Link
                href="/dashboard"
                className="w-full text-center border-4 border-primary bg-[#e63b2e] hover:bg-primary text-white hover:text-primary-foreground py-3.5 text-xs font-black font-headline uppercase tracking-widest transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bauhaus-shadow-sm cursor-pointer mt-6 inline-block"
              >
                UPGRADE PLAN TO PRO
              </Link>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
