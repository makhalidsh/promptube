'use client';

import React from 'react';
import { ArrowLeft, Shield, Eye, Database, Lock, Globe, Server } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="relative flex-1 flex flex-col bg-background min-h-screen">
      {/* Mouse Reactive Background / Grid */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0 opacity-[0.03]"></div>

      <div className="relative z-10 flex-1 mx-auto max-w-5xl w-full px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-primary pb-8 mb-12">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="border-3 border-primary bg-card p-3 text-primary hover:bg-accent transition-all cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bauhaus-shadow-sm"
              title="Return to Workspace"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black font-headline uppercase tracking-widest text-primary">
                Privacy Policy
              </h1>
              <p className="text-xs sm:text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                Form Follows Function. Your Data Belongs To You.
              </p>
            </div>
          </div>
          <div className="text-[10px] font-headline uppercase font-bold text-muted-foreground border-2 border-primary bg-card px-3 py-1.5 self-start md:self-auto">
            Last Updated: June 1, 2026
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Legal Content */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Section: Overview */}
            <div className="bg-card border-3 border-primary p-6 sm:p-8 bauhaus-shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-widest font-headline text-primary mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-secondary" />
                <span>1. Core Philosophy</span>
              </h2>
              <div className="font-body text-xs sm:text-sm text-primary leading-relaxed space-y-4 font-medium">
                <p>
                  At Promptube, we believe user privacy is not a feature—it is a fundamental architectural requirement. 
                  In alignment with the core principles of digital minimalism and Bauhaus engineering, our system is designed 
                  with a local-first philosophy.
                </p>
                <p>
                  We do not run centralized database clusters to collect, profile, or monetize your search behaviors, 
                  synthesized prompts, or video logs. What you parse, synthesize, and store remains entirely within your domain.
                </p>
              </div>
            </div>

            {/* Section: Data Collection */}
            <div className="bg-card border-3 border-primary p-6 sm:p-8 bauhaus-shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-widest font-headline text-primary mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-secondary" />
                <span>2. Local Browser Storage</span>
              </h2>
              <div className="font-body text-xs sm:text-sm text-primary leading-relaxed space-y-4 font-medium">
                <p>
                  All structured video metadata, transcripts, prompt vaults, and generated AI templates are stored locally 
                  in your web browser's storage system (such as localState and IndexedDB).
                </p>
                <p>
                  No transcripts or generated documents are synced to any remote Promptube backend servers. You maintain 
                  absolute control over this data. You can inspect, modify, or permanently wipe this database at any moment 
                  directly via the <strong>Global Settings</strong> dashboard panel.
                </p>
              </div>
            </div>

            {/* Section: AI Providers and API Keys */}
            <div className="bg-card border-3 border-primary p-6 sm:p-8 bauhaus-shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-widest font-headline text-primary mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-secondary" />
                <span>3. Credentials & API Keys</span>
              </h2>
              <div className="font-body text-xs sm:text-sm text-primary leading-relaxed space-y-4 font-medium">
                <p>
                  Promptube allows you to input custom API keys for Google Gemini models and TranscriptAPI tokens. 
                  These tokens are stored safely in browser-level context memory and state persistence.
                </p>
                <p>
                  These credentials are never transmitted to Promptube or any unauthorized third parties. They are utilized 
                  strictly to execute direct API queries on your behalf to fetch video transcript data and construct 
                  rich JSON summaries.
                </p>
              </div>
            </div>

            {/* Section: Third Party services */}
            <div className="bg-card border-3 border-primary p-6 sm:p-8 bauhaus-shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-widest font-headline text-primary mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-secondary" />
                <span>4. Third-Party Data Transmission</span>
              </h2>
              <div className="font-body text-xs sm:text-sm text-primary leading-relaxed space-y-4 font-medium">
                <p>
                  When utilizing Promptube, the following standard client-side network connections are established:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Google Gemini AI:</strong> When custom Gemini keys are active, prompt payloads and transcript snippets are 
                    transmitted directly to Google API servers to perform cognitive parsing. This request is subject to the 
                    <a 
                      href="https://ai.google.dev/gemini-api/terms" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-secondary hover:underline font-bold"
                    > Google Gemini API Privacy Policy</a>.
                  </li>
                  <li>
                    <strong>TranscriptAPI.com:</strong> To convert YouTube videos into structured transcript matrices, we fetch video payloads via 
                    our lightweight local helper or directly to TranscriptAPI.com endpoints.
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* Sidebar Panel - At a Glance */}
          <div className="flex flex-col gap-6">
            
            {/* Bauhaus Card */}
            <div className="bg-accent border-3 border-primary p-6 text-primary bauhaus-shadow">
              <h3 className="text-base font-black uppercase tracking-widest font-headline mb-4 flex items-center gap-1.5">
                <Eye className="h-5 w-5 fill-current" />
                <span>At a Glance</span>
              </h3>
              
              <div className="flex flex-col gap-4 font-headline uppercase font-bold text-xs">
                
                <div className="flex items-center gap-3 border-b-2 border-primary/20 pb-3">
                  <div className="h-5 w-5 border-2 border-primary bg-primary text-background flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                  <span>100% Local Storage</span>
                </div>

                <div className="flex items-center gap-3 border-b-2 border-primary/20 pb-3">
                  <div className="h-5 w-5 border-2 border-primary bg-primary text-background flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                  <span>Zero Profiling Cookies</span>
                </div>

                <div className="flex items-center gap-3 border-b-2 border-primary/20 pb-3">
                  <div className="h-5 w-5 border-2 border-primary bg-primary text-background flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                  <span>Direct API Pipelines</span>
                </div>

                <div className="flex items-center gap-3 pb-1">
                  <div className="h-5 w-5 border-2 border-primary bg-primary text-background flex items-center justify-center text-[10px] font-black shrink-0">4</div>
                  <span>Immediate Data Wipe</span>
                </div>

              </div>
            </div>

            {/* Quick action card */}
            <div className="bg-card border-3 border-primary p-6 flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-widest font-headline text-primary">
                Need to wipe your local trace?
              </h3>
              <p className="text-[11px] font-body font-medium text-muted-foreground leading-relaxed">
                You can flush the entirety of your cached videos, synthesized prompts, and API keys stored in your browser storage instantly.
              </p>
              <Link
                href="/settings"
                className="w-full text-center border-2 border-primary bg-primary text-primary-foreground font-headline font-black uppercase text-xs py-3 hover:bg-secondary hover:text-white transition-all cursor-pointer"
              >
                Go to Settings
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
