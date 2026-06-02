'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Shield, Key, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import gsap from 'gsap';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        '.auth-stagger',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' }
      );
    }
  }, [isSignUp]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('PLEASE FILL IN ALL REQUIRED FIELDS.');
      return;
    }

    const blockedDomains = [
      '10minutemail.com', '10minutemail.net', '10minutemail.org',
      'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
      'guerrillamailblock.com', 'sharklasers.com', 'grr.la',
      'mailinator.com', 'mailinator.net', 'mailnesia.com',
      'temp-mail.org', 'tempmail.org', 'tempmail.com',
      'temp-mail.io', 'tempmailo.com', 'throwawaymail.com',
      'fakeinbox.com', 'getnada.com', 'nada.email',
      'yopmail.com', 'yopmail.fr', 'yopmail.net', 'yopmail.gq',
      'dispostable.com', 'trashmail.com', 'trashmail.net',
      'maildrop.cc', 'moakt.com', 'mintemail.com',
      'emailondeck.com', 'mailcatch.com', 'inboxkitten.com',
      'burnermail.io', 'spamgourmet.com', 'mytemp.email',
      'tempail.com', 'tempmailbox.com', 'tmpmail.org',
      'tempr.email', 'emailfake.com', 'fakemail.net',
      'dropmail.me', 'dropmail.co', 'dropmail.info',
      'mail.tm', 'chacuo.net', 'byom.de'
    ];

    const emailDomain = email.split('@')[1]?.toLowerCase().trim();
    if (emailDomain && blockedDomains.includes(emailDomain)) {
      setError('REGISTRATION BLOCKED: TEMPORARY OR DISPOSABLE EMAILS ARE NOT ALLOWED.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          setMessage('REGISTRATION COMPLETED. SIGNED IN SUCCESSFULLY!');
          setTimeout(() => {
            onAuthSuccess?.();
          }, 1500);
        } else {
          setMessage('REGISTRATION SUCCESSFUL! PLEASE CHECK YOUR INBOX FOR THE VERIFICATION EMAIL.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        setMessage('AUTHENTICATED SUCCESSFULLY! SECURING WORKSPACE...');
        setTimeout(() => {
          onAuthSuccess?.();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message?.toUpperCase() || 'AN AUTHENTICATION ERROR OCCURRED.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
        }
      });

      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message?.toUpperCase() || 'GOOGLE OAUTH INITIALIZATION FAILED.');
      setLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full flex-grow flex flex-col justify-center items-center px-4 py-8 md:py-12 relative overflow-hidden z-10"
    >
      {/* Background Dots Grid */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

      {/* 10% Larger Container */}
      <div className="w-full max-w-5xl bg-card border-4 border-primary neo-shadow p-8 sm:p-10 relative z-10 flex flex-col gap-6">
        
        {/* Cyber Accent Lines */}
        <div className="flex h-3 border-b-4 border-primary shrink-0">
          <div className="w-1/3 bg-secondary"></div>
          <div className="w-1/3 bg-accent"></div>
          <div className="w-1/3 bg-tertiary"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-stretch">
          
          {/* Left Column: Branding and Google Authorization */}
          <div className="md:col-span-5 flex flex-col justify-between gap-8 border-b-4 md:border-b-0 md:border-r-4 border-primary pb-8 md:pb-0 md:pr-10">
            
            {/* Header branding */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="auth-stagger flex h-14 w-14 shrink-0 items-center justify-center border-4 border-primary bg-accent text-primary neo-shadow-hover select-none">
                  <Shield className="h-7 w-7 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="auth-stagger font-headline font-black text-3xl tracking-tight uppercase leading-none text-primary">
                    PROMPT<span className="text-secondary">TUBE</span>
                  </h2>
                  <p className="auth-stagger text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                    SECURE INTERFACE
                  </p>
                </div>
              </div>
            </div>

            {/* Google OAuth Section - Spacious & Centered */}
            <div className="flex flex-col gap-4 py-8 my-auto">
              <span className="auth-stagger text-[10px] font-black uppercase tracking-widest text-muted-foreground self-center">
                Authorize Google Workspace
              </span>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-[#ffcc00] hover:bg-primary hover:text-primary-foreground text-primary border-4 border-primary py-4.5 text-sm font-black font-headline uppercase tracking-widest flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-50 shadow-[5px_5px_0px_0px_var(--primary)] hover:shadow-[7px_7px_0px_0px_var(--primary)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-150"
              >
                <svg className="h-5.5 w-5.5 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.12 1 1.16 5.94 1.16 12s4.96 11 11.08 11c6.39 0 10.63-4.474 10.63-10.785 0-.727-.078-1.284-.176-1.93H12.24z"/>
                </svg>
                <span>Google Sign In</span>
              </button>
            </div>

            {/* Minimal cool disclaimer */}
            <div className="auth-stagger text-[9px] font-bold text-muted-foreground uppercase leading-tight tracking-wider pt-4 border-t-2 border-primary/20">
              Form follows function. Secure data aggregation active.
            </div>
          </div>

          {/* Right Column: Email Credentials Form */}
          <div className="md:col-span-7 flex flex-col gap-6 justify-between">
            <div className="flex flex-col gap-5">
              
              {/* Tab Switcher */}
              <div className="auth-stagger grid grid-cols-2 border-4 border-primary bg-background overflow-hidden mb-2">
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                    setMessage('');
                  }}
                  className={`py-3.5 text-xs font-black uppercase tracking-wider font-headline transition-all cursor-pointer ${
                    !isSignUp
                      ? 'bg-primary text-primary-foreground font-black'
                      : 'hover:bg-accent/40 text-primary/80 hover:text-primary font-bold'
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                    setMessage('');
                  }}
                  className={`py-3.5 text-xs font-black uppercase tracking-wider font-headline transition-all cursor-pointer ${
                    isSignUp
                      ? 'bg-primary text-primary-foreground font-black'
                      : 'hover:bg-accent/40 text-primary/80 hover:text-primary font-bold'
                  }`}
                >
                  SIGN UP
                </button>
              </div>

              {error && (
                <div className="auth-stagger border-4 border-primary bg-secondary text-white font-headline font-bold uppercase tracking-wider text-[10px] p-3.5 neo-shadow-sm leading-tight animate-shake">
                  {error}
                </div>
              )}

              {message && (
                <div className="auth-stagger border-4 border-primary bg-accent text-primary font-headline font-bold uppercase tracking-wider text-[10px] p-3.5 neo-shadow-sm leading-tight">
                  {message}
                </div>
              )}

              <form onSubmit={handleAuth} className="flex flex-col gap-5">
                <div className="auth-stagger flex flex-col gap-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-2">
                    <Mail className="h-4.5 w-4.5" /> EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="ENTER YOUR EMAIL..."
                    className="p-3.5 border-4 border-primary bg-background text-sm font-headline focus:outline-none focus:bg-card focus:border-accent placeholder:text-primary/30 uppercase font-bold transition-all duration-150"
                  />
                </div>

                <div className="auth-stagger flex flex-col gap-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-2">
                    <Lock className="h-4.5 w-4.5" /> PASSWORD
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="ENTER PASSWORD..."
                    className="p-3.5 border-4 border-primary bg-background text-sm font-headline focus:outline-none focus:bg-card focus:border-accent placeholder:text-primary/30 uppercase font-bold transition-all duration-150"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="auth-stagger w-full bg-primary text-primary-foreground font-black font-headline py-4 text-xs uppercase border-4 border-primary cursor-pointer disabled:opacity-50 flex justify-center items-center gap-2 mt-2 transition-all duration-150 shadow-[5px_5px_0px_0px_var(--secondary)] hover:shadow-[7px_7px_0px_0px_var(--secondary)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-none"
                >
                  {loading ? (
                    'VALIDATING...'
                  ) : isSignUp ? (
                    <>
                      <UserPlus className="h-4.5 w-4.5" /> CREATE ACCOUNT
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4.5 w-4.5" /> AUTHORIZE ACCESS
                    </>
                  )}
                </button>
              </form>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
