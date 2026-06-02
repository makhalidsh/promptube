'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Terminal, Compass, AlertTriangle, ArrowLeft } from 'lucide-react';
import ColorBends from '@/components/ui/ColorBends/ColorBends';
import gsap from 'gsap';

export default function NotFound() {
  const [currentPath, setCurrentPath] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeShape, setActiveShape] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<HTMLDivElement>(null);

  // Set current path on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const frame = requestAnimationFrame(() => {
        setCurrentPath(window.location.pathname);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  // Staggered GSAP Entrance Animations
  useEffect(() => {
    if (containerRef.current) {
      // Setup timeline for smooth sequential triggers
      const tl = gsap.timeline();
      
      tl.fromTo(
        '.notfound-title',
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power4.out' }
      );
      
      tl.fromTo(
        '.notfound-card',
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.5'
      );
      
      tl.fromTo(
        '.notfound-shape',
        { scale: 0, rotation: -45 },
        { scale: 1, rotation: 0, duration: 0.8, stagger: 0.15, ease: 'back.out(1.7)' },
        '-=0.4'
      );

      tl.fromTo(
        '.notfound-btn',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
        '-=0.3'
      );
    }
  }, []);

  // Mock terminal logging sequence
  useEffect(() => {
    if (!currentPath) return;

    const messages = [
      `[sys] init request verification: GET ${currentPath}`,
      `[sys] probing registry mapping databases...`,
      `[err] route lookup fault: matching page not registered`,
      `[sys] parsing active stack parameters: Node/NextJS 16`,
      `[sys] database check: profiles, usage_logs state: OK`,
      `[warn] cognitive stack redirect recommended`,
      `[sys] ready for teleportation.`
    ];

    let timer: NodeJS.Timeout;
    
    const triggerLog = (index: number) => {
      if (index < messages.length) {
        setLogs(prev => [...prev, messages[index]]);
        timer = setTimeout(() => triggerLog(index + 1), 250 + Math.random() * 200);
      }
    };

    triggerLog(0);

    return () => clearTimeout(timer);
  }, [currentPath]);

  // Shapes interaction logic - subtle rotation on click/hover
  const handleShapeClick = (shapeName: string) => {
    setActiveShape(shapeName);
    const element = document.querySelector(`.shape-${shapeName}`);
    if (element) {
      gsap.to(element, {
        rotation: '+=90',
        scale: 1.15,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(element, { scale: 1, duration: 0.3, ease: 'power2.inOut' });
        }
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-grow bg-background text-foreground font-body relative flex flex-col justify-center items-center px-4 sm:px-8 py-16 md:py-24 z-10 select-none overflow-x-hidden"
    >
      {/* ColorBends Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-25 w-full h-full">
        <ColorBends
          rotation={135}
          speed={0.15}
          colors={["#e63b2e", "#ffcc00", "#0055ff", "#ffffff"] as any}
          transparent
          autoRotate={0}
          scale={1.2}
          frequency={0.8}
          warpStrength={1.2}
          mouseInfluence={0.5}
          parallax={0.3}
          noise={0.12}
          iterations={1}
          intensity={1.2}
          bandWidth={8}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        />
      </div>

      {/* Grid Dots */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

      {/* Content wrapper */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-10 relative z-10">
        
        {/* Massive Brutalist Header */}
        <div className="text-center notfound-title flex flex-col items-center">
          <div className="flex items-center gap-3 border-4 border-primary bg-secondary text-white px-5 py-2 mb-6 font-headline font-black text-xs uppercase tracking-widest neo-shadow-sm select-none">
            <AlertTriangle className="h-4 w-4 animate-pulse" />
            <span>CRITICAL FAULT: 404</span>
          </div>
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black font-headline tracking-tighter uppercase leading-[0.8] text-primary">
            OUT OF<br/>BOUNDS
          </h1>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest mt-6 text-muted-foreground max-w-lg leading-relaxed">
            THE CHOSEN PIPELINE DOES NOT EXIST WITHIN THE PROMPTUBE LOGICAL SPACE. RETURN TO SYSTEM SAFE ZONES.
          </p>
        </div>

        {/* Layout Grid: Mock Terminal & Bauhaus Interactive Shapes */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-stretch">
          
          {/* Diagnostic Log Console (Left, col-span-7) */}
          <div className="notfound-card md:col-span-7 bg-card border-4 border-primary p-6 relative neo-shadow flex flex-col justify-between min-h-[300px] select-text">
            
            {/* Top Border Decor */}
            <div className="flex h-3 border-b-4 border-primary shrink-0 -mt-6 -mx-6 mb-6">
              <div className="w-1/4 bg-[#e63b2e]"></div>
              <div className="w-1/4 bg-[#ffcc00]"></div>
              <div className="w-1/4 bg-[#0055ff]"></div>
              <div className="w-1/4 bg-primary"></div>
            </div>

            {/* Terminal Body */}
            <div className="flex flex-col gap-4 font-mono text-xs flex-grow overflow-y-auto">
              <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
                <Terminal className="h-4.5 w-4.5 text-secondary shrink-0" />
                <span className="font-bold text-primary uppercase tracking-wider">DIAGNOSTIC TELEMETRY LOG</span>
              </div>
              <div className="flex flex-col gap-1.5 text-primary/80 font-bold leading-normal">
                {logs.map((log, i) => (
                  <div key={i} className="animate-fade-in truncate">
                    {log}
                  </div>
                ))}
                {logs.length < 7 && (
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping"></span>
                    <span className="text-[10px] text-muted-foreground uppercase italic animate-pulse">scanning...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Decor Panel */}
            <div className="border-t-2 border-primary/20 pt-4 mt-6 flex justify-between items-center text-[9px] font-black uppercase text-muted-foreground tracking-wider font-mono">
              <span>STATUS: ROUTE_UNRESOLVED</span>
              <span>ERR_0x404</span>
            </div>
          </div>

          {/* Interactive Shapes Playground (Right, col-span-5) */}
          <div className="notfound-card md:col-span-5 bg-card border-4 border-primary p-6 relative neo-shadow flex flex-col justify-between items-center text-center">
            
            {/* Top Info */}
            <div className="w-full flex items-center gap-2 border-b border-primary/20 pb-3 mb-6">
              <Compass className="h-4.5 w-4.5 text-[#0055ff] shrink-0" />
              <span className="font-headline font-black text-xs text-primary uppercase tracking-wider">GEOMETRIC DECODER</span>
            </div>

            {/* Playground shapes */}
            <div ref={shapesRef} className="flex justify-center items-center gap-6 py-6 relative w-full h-full min-h-[160px]">
              
              {/* Red Square */}
              <button
                onClick={() => handleShapeClick('red')}
                className="notfound-shape shape-red h-14 w-14 bg-secondary border-4 border-primary neo-shadow-sm cursor-pointer transition-all hover:bg-primary active:scale-95"
                title="Brutalist Square"
              />

              {/* Yellow Circle */}
              <button
                onClick={() => handleShapeClick('yellow')}
                className="notfound-shape shape-yellow h-14 w-14 bg-[#ffcc00] border-4 border-primary rounded-full neo-shadow-sm cursor-pointer transition-all hover:bg-primary active:scale-95"
                title="Bauhaus Circle"
              />

              {/* Blue Triangle */}
              <button
                onClick={() => handleShapeClick('blue')}
                className="notfound-shape shape-blue cursor-pointer active:scale-95 relative"
                title="Kinetic Triangle"
              />

            </div>

            {/* Decoded state */}
            <div className="mt-4 border-4 border-primary bg-background p-3 w-full font-mono text-[10px] font-bold text-primary select-none uppercase">
              {activeShape ? (
                <span>Shape: {activeShape} | Vector: Rotated 90°</span>
              ) : (
                <span className="text-muted-foreground animate-pulse">&gt; ACTIVATE SHAPE CORE TO DECODE</span>
              )}
            </div>

          </div>

        </div>

        {/* Teleportation / Navigation Options */}
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg mt-4 px-4 justify-center">
          
          <Link
            href="/dashboard"
            className="notfound-btn flex-grow text-center border-4 border-primary bg-accent hover:bg-primary hover:text-primary-foreground text-primary py-4 px-6 text-sm font-black font-headline uppercase tracking-widest transition-all duration-150 shadow-[5px_5px_0px_0px_var(--primary)] hover:shadow-none hover:translate-x-[5px] hover:translate-y-[5px] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none cursor-pointer"
          >
            Return to Site Gate
          </Link>

          <Link
            href="/"
            className="notfound-btn flex-grow text-center border-4 border-primary bg-card hover:bg-muted text-primary py-4 px-6 text-sm font-black font-headline uppercase tracking-widest transition-all duration-150 shadow-[5px_5px_0px_0px_var(--primary)] hover:shadow-none hover:translate-x-[5px] hover:translate-y-[5px] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4.5 w-4.5 stroke-[2.5]" />
            <span>Teleport Home</span>
          </Link>

        </div>

      </div>

      {/* SVG custom triangle definition injected directly in render */}
      <style jsx global>{`
        .shape-blue {
          width: 0;
          height: 0;
          border-left: 32px solid transparent;
          border-right: 32px solid transparent;
          border-bottom: 56px solid #0055ff;
          filter: drop-shadow(4px 4px 0px #1a1a1a);
        }
        .shape-blue:hover {
          border-bottom-color: var(--primary);
        }
      `}</style>
    </div>
  );
}
