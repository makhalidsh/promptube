'use client';

import React, { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';
import ColorBends from './ColorBends/ColorBends';
import gsap from 'gsap';

interface LoadingScreenProps {
  shouldExit: boolean;
}

export default function LoadingScreen({ shouldExit }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  // Manage progress bar counter
  useEffect(() => {
    if (shouldExit) {
      const frame = requestAnimationFrame(() => setProgress(100));
      return () => cancelAnimationFrame(frame);
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95; // Wait for the auth check to fully complete to hit 100%
        }
        // Increment faster at first, then slow down
        const diff = Math.max(1, Math.floor((95 - prev) * 0.15));
        return prev + diff;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [shouldExit]);

  // Compute active log based on progress
  let activeLog = '';
  if (progress === 100) {
    activeLog = '> BOOT SEQUENCE COMPLETE. GRANTED SECURE ACCESS.';
  } else if (progress > 80) {
    activeLog = '> COGNITIVE MODEL MAPPING HYDRATED...';
  } else if (progress > 60) {
    activeLog = '> PROBING SECURE CREDENTIAL VAULT...';
  } else if (progress > 45) {
    activeLog = '> INITIALIZING EDGE FUNCTION ENDPOINTS...';
  } else if (progress > 25) {
    activeLog = '> RETRIEVING AUTHENTICATION SECRETS...';
  } else {
    activeLog = '> INITIALIZING PROMPTUBE CONSOLE CORE...';
  }

  // Entrance animations for loader shapes
  useEffect(() => {
    gsap.fromTo(
      '.loader-shape',
      { scale: 0, rotation: -90 },
      { scale: 1, rotation: 360, duration: 1.2, stagger: 0.12, ease: 'power3.out' }
    );
    
    // Continuously spin the shapes while loading
    gsap.to('.loader-shape-circle', { rotation: 360, repeat: -1, duration: 8, ease: 'none' });
    gsap.to('.loader-shape-triangle', { rotation: -360, repeat: -1, duration: 10, ease: 'none' });
    gsap.to('.loader-shape-square', { rotation: 180, repeat: -1, duration: 6, ease: 'none' });
  }, []);

  return (
    <div 
      className={`fixed inset-0 z-50 bg-background text-foreground flex flex-col justify-center items-center px-6 transition-all duration-500 ease-in-out ${
        shouldExit ? 'translate-y-[-100%] opacity-90' : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Background canvas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20 w-full h-full">
        <ColorBends
          rotation={45}
          speed={0.1}
          colors={["#e63b2e", "#ffcc00", "#0055ff", "#ffffff"] as any}
          transparent
          autoRotate={0}
          scale={1.1}
          frequency={0.7}
          warpStrength={1}
          mouseInfluence={0.2}
          parallax={0.1}
          noise={0.1}
          iterations={1}
          intensity={1}
          bandWidth={5}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        />
      </div>
      
      {/* Dots Grid */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

      {/* Main loading container */}
      <div className="w-full max-w-lg bg-card border-4 border-primary p-6 sm:p-8 neo-shadow relative z-10 flex flex-col items-center gap-8 select-none">
        
        {/* Top Accent Lines */}
        <div className="flex h-3 border-b-4 border-primary w-full -mt-6 -mx-6 mb-2 shrink-0">
          <div className="w-1/3 bg-[#e63b2e]"></div>
          <div className="w-1/3 bg-[#ffcc00]"></div>
          <div className="w-1/3 bg-[#0055ff]"></div>
        </div>

        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-3 border-primary bg-secondary text-white font-headline font-black text-lg">
            P
          </div>
          <span className="font-headline font-black tracking-tight text-lg text-primary uppercase">
            promp<span className="text-secondary">tube</span>
          </span>
        </div>

        {/* Dynamic Bauhaus geometric loading animation */}
        <div className="flex items-center justify-center gap-5 my-3 h-16">
          <div className="loader-shape loader-shape-square h-8 w-8 bg-secondary border-3 border-primary" />
          <div className="loader-shape loader-shape-circle h-8 w-8 bg-[#ffcc00] border-3 border-primary rounded-full" />
          <div className="loader-shape loader-shape-triangle cursor-default" />
        </div>

        {/* Progress Bar Container */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex justify-between items-baseline font-mono text-[10px] font-bold text-primary uppercase">
            <span>[ SYSTEM INITIALIZATION ]</span>
            <span>{progress}%</span>
          </div>
          
          {/* Brutalist Progress bar */}
          <div className="w-full h-7 border-4 border-primary bg-background relative overflow-hidden neo-shadow-sm">
            <div 
              className="h-full bg-accent border-r-3 border-primary transition-all duration-150 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Diagnostic logs */}
        <div className="w-full border-3 border-primary bg-background p-3.5 font-mono text-[10px] font-bold text-primary min-h-[50px] flex items-center select-text relative">
          <div className="flex items-center gap-1.5 w-full">
            <Terminal className="h-3.5 w-3.5 text-secondary shrink-0" />
            <span className="truncate">{activeLog}</span>
          </div>
          <span className="absolute right-3.5 bottom-3 h-3 w-1.5 bg-primary animate-pulse shrink-0"></span>
        </div>

        {/* Bottom micro branding */}
        <div className="w-full border-t-2 border-primary/20 pt-4 flex justify-between items-center text-[9px] font-black uppercase text-muted-foreground tracking-wider font-headline">
          <span>COGNITIVE GATEWAY // SECURE</span>
          <span>EST. 2026</span>
        </div>

      </div>

      <style jsx global>{`
        .loader-shape-triangle {
          width: 0;
          height: 0;
          border-left: 18px solid transparent;
          border-right: 18px solid transparent;
          border-bottom: 30px solid #0055ff;
          filter: drop-shadow(2px 2px 0px #1a1a1a);
        }
      `}</style>
    </div>
  );
}
