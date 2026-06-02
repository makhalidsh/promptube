'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, ShieldCheck, User, Users, Star, 
  Settings, ArrowLeft, Search, Save, Check, RefreshCw,
  Key, Mail, Lock, UserPlus, LogIn
} from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  id: string;
  tier: 'free' | 'pro' | 'admin';
  usage_count: number;
  last_used_date: string | null;
  updated_at: string;
  email?: string;
}

export default function AdminPanel() {
  const { user, profile, authLoading } = useAppContext();
  const router = useRouter();
  const [profilesList, setProfilesList] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  
  // Profile verification loading buffer
  const [profileChecking, setProfileChecking] = useState(true);

  // Custom admin auth states
  const [isAdminSignUp, setIsAdminSignUp] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminMessage, setAdminMessage] = useState('');

  // Track local edits for each profile
  const [editedTiers, setEditedTiers] = useState<Record<string, 'free' | 'pro' | 'admin'>>({});
  const [editedUsages, setEditedUsages] = useState<Record<string, number>>({});

  const isAdmin = profile?.tier === 'admin';

  // Profile check delay to prevent premature Access Denied checks while fetching
  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        setProfileChecking(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [authLoading, profile]);

  // Fetch all profiles from Supabase profiles table
  const fetchAllProfiles = async () => {
    if (!isAdmin) return;
    setLoadingProfiles(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (profilesError) throw profilesError;

      const mapped: UserProfile[] = (profilesData || []).map((p: any) => ({
        id: p.id,
        tier: p.tier || 'free',
        usage_count: p.usage_count || 0,
        last_used_date: p.last_used_date || null,
        updated_at: p.updated_at,
        email: p.id === '6d5c59fd-482c-4574-9242-d929bffb32c0' ? 'khalidbentisse@gmail.com' : `User (${p.id.substring(0, 8)})`
      }));

      setProfilesList(mapped);
      
      // Initialize local states
      const tiers: Record<string, 'free' | 'pro' | 'admin'> = {};
      const usages: Record<string, number> = {};
      mapped.forEach((u) => {
        tiers[u.id] = u.tier;
        usages[u.id] = u.usage_count;
      });
      setEditedTiers(tiers);
      setEditedUsages(usages);
    } catch (err) {
      console.error('Failed to load system profiles:', err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllProfiles();
    }
  }, [isAdmin]);

  // Handle saving profile changes
  const handleSaveProfile = async (targetId: string) => {
    const tier = editedTiers[targetId];
    const usageCount = editedUsages[targetId];
    
    setSavingId(targetId);
    try {
      // Call SECURITY DEFINER database function to bypass RLS securely
      const { error } = await supabase.rpc('admin_update_profile', {
        target_user_id: targetId,
        new_tier: tier,
        new_usage_count: usageCount
      });

      if (error) throw error;

      setSuccessId(targetId);
      setTimeout(() => {
        setSuccessId(null);
      }, 2000);

      // Refresh list to keep in sync
      fetchAllProfiles();
    } catch (err: any) {
      alert(err.message || 'Failed to update user profile credentials.');
    } finally {
      setSavingId(null);
    }
  };

  // Custom Admin Gate email/password authentication
  const handleAdminEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      setAdminError('PLEASE FILL IN ALL REQUIRED FIELDS.');
      return;
    }
    setAdminError('');
    setAdminMessage('');
    setAdminLoading(true);

    try {
      if (isAdminSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: adminEmail,
          password: adminPassword,
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          setAdminMessage('REGISTRATION COMPLETED. SIGNED IN SUCCESSFULLY!');
        } else {
          setAdminMessage('REGISTRATION SUCCESSFUL! PLEASE CHECK YOUR INBOX FOR VERIFICATION.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword,
        });

        if (signInError) throw signInError;
        setAdminMessage('AUTHENTICATED SUCCESSFULLY! LOADING GATEWAY...');
      }
    } catch (err: any) {
      setAdminError(err.message?.toUpperCase() || 'AN AUTHENTICATION ERROR OCCURRED.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Custom Admin Gate Google OAuth authorization (Redirecting back to /admin)
  const handleAdminGoogleSignIn = async () => {
    setAdminError('');
    setAdminMessage('');
    setAdminLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined,
        }
      });

      if (oauthError) throw oauthError;
    } catch (err: any) {
      setAdminError(err.message?.toUpperCase() || 'GOOGLE OAUTH INITIALIZATION FAILED.');
      setAdminLoading(false);
    }
  };

  // Authenticate session or profile loading
  if (authLoading || (user && !profile && profileChecking)) {
    return (
      <div className="min-h-screen bg-background text-primary flex flex-col justify-center items-center relative overflow-hidden">
        <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="flex gap-2">
            <div className="h-6 w-6 border-4 border-primary bg-secondary animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-6 w-6 border-4 border-primary bg-accent animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-6 w-6 border-4 border-primary bg-tertiary animate-bounce"></div>
          </div>
          <div className="font-headline font-black uppercase tracking-widest text-sm text-primary">
            VERIFYING CREDENTIAL PRIVILEGES...
          </div>
        </div>
      </div>
    );
  }

  // 1. Dedicated standalone Gate for admin/auth if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-primary flex flex-col justify-center items-center px-4 py-8 md:py-12 relative overflow-hidden z-50">
        <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

        <div className="w-full max-w-4xl bg-card border-4 border-primary neo-shadow p-8 sm:p-10 relative z-10 flex flex-col gap-6">
          
          <div className="flex h-3 border-b-4 border-primary shrink-0">
            <div className="w-1/3 bg-secondary"></div>
            <div className="w-1/3 bg-accent"></div>
            <div className="w-1/3 bg-tertiary"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-stretch">
            
            {/* Left side: branding & Google OAuth */}
            <div className="md:col-span-5 flex flex-col justify-between gap-8 border-b-4 md:border-b-0 md:border-r-4 border-primary pb-8 md:pb-0 md:pr-10">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center border-4 border-primary bg-accent text-primary neo-shadow-hover">
                    <ShieldCheck className="h-7 w-7 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="font-headline font-black text-2xl tracking-tight uppercase leading-none text-primary">
                      ADMIN<span className="text-secondary">GATE</span>
                    </h2>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                      SECURE OPERATIONS
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 py-8 my-auto">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground self-center">
                  Authorize Admin Session
                </span>
                <button
                  onClick={handleAdminGoogleSignIn}
                  disabled={adminLoading}
                  className="w-full bg-[#ffcc00] hover:bg-primary hover:text-primary-foreground text-primary border-4 border-primary py-4 text-xs font-black font-headline uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 shadow-[4px_4px_0px_0px_var(--primary)] hover:shadow-[6px_6px_0px_0px_var(--primary)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-150"
                >
                  <svg className="h-5 w-5 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.12 1 1.16 5.94 1.16 12s4.96 11 11.08 11c6.39 0 10.63-4.474 10.63-10.785 0-.727-.078-1.284-.176-1.93H12.24z"/>
                  </svg>
                  <span>Google Sign In</span>
                </button>
              </div>

              <div className="text-[9px] font-bold text-muted-foreground uppercase leading-tight tracking-wider pt-4 border-t-2 border-primary/20">
                Administrative session tracking is active.
              </div>
            </div>

            {/* Right side: Email credentials auth */}
            <div className="md:col-span-7 flex flex-col gap-6 justify-between">
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 border-4 border-primary bg-background overflow-hidden mb-2">
                  <button
                    onClick={() => {
                      setIsAdminSignUp(false);
                      setAdminError('');
                      setAdminMessage('');
                    }}
                    className={`py-3 text-xs font-black uppercase tracking-wider font-headline transition-all cursor-pointer ${
                      !isAdminSignUp
                        ? 'bg-primary text-primary-foreground font-black'
                        : 'hover:bg-accent/40 text-primary/80 hover:text-primary font-bold'
                    }`}
                  >
                    SIGN IN
                  </button>
                  <button
                    onClick={() => {
                      setIsAdminSignUp(true);
                      setAdminError('');
                      setAdminMessage('');
                    }}
                    className={`py-3 text-xs font-black uppercase tracking-wider font-headline transition-all cursor-pointer ${
                      isAdminSignUp
                        ? 'bg-primary text-primary-foreground font-black'
                        : 'hover:bg-accent/40 text-primary/80 hover:text-primary font-bold'
                    }`}
                  >
                    SIGN UP
                  </button>
                </div>

                {adminError && (
                  <div className="border-4 border-primary bg-secondary text-white font-headline font-bold uppercase tracking-wider text-[10px] p-3 neo-shadow-sm leading-tight">
                    {adminError}
                  </div>
                )}

                {adminMessage && (
                  <div className="border-4 border-primary bg-accent text-primary font-headline font-bold uppercase tracking-wider text-[10px] p-3 neo-shadow-sm leading-tight">
                    {adminMessage}
                  </div>
                )}

                <form onSubmit={handleAdminEmailAuth} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-2">
                      <Mail className="h-4 w-4" /> EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      disabled={adminLoading}
                      placeholder="ENTER ADMIN EMAIL..."
                      className="p-3 border-4 border-primary bg-background text-xs font-headline focus:outline-none focus:bg-card focus:border-accent placeholder:text-primary/30 uppercase font-bold transition-all duration-150"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-2">
                      <Lock className="h-4 w-4" /> PASSWORD
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      disabled={adminLoading}
                      placeholder="ENTER PASSWORD..."
                      className="p-3 border-4 border-primary bg-background text-xs font-headline focus:outline-none focus:bg-card focus:border-accent placeholder:text-primary/30 uppercase font-bold transition-all duration-150"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full bg-primary text-primary-foreground font-black font-headline py-3.5 text-xs uppercase border-4 border-primary cursor-pointer disabled:opacity-50 flex justify-center items-center gap-2 mt-2 transition-all duration-150 shadow-[4px_4px_0px_0px_var(--secondary)] hover:shadow-[6px_6px_0px_0px_var(--secondary)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-none"
                  >
                    {adminLoading ? (
                      'VALIDATING...'
                    ) : isAdminSignUp ? (
                      <>
                        <UserPlus className="h-4 w-4" /> CREATE ACCOUNT
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" /> AUTHORIZE ACCESS
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

  // 2. Access Denied shield if authenticated but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background text-primary flex flex-col justify-center items-center px-6 py-20 relative overflow-hidden z-50">
        <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>
        
        <div className="w-full max-w-2xl bg-card border-4 border-primary neo-shadow p-8 sm:p-10 relative z-10 flex flex-col gap-6 items-center text-center">
          <div className="flex h-3 w-full border-b-4 border-primary shrink-0">
            <div className="w-1/3 bg-secondary"></div>
            <div className="w-1/3 bg-accent"></div>
            <div className="w-1/3 bg-tertiary"></div>
          </div>

          <div className="flex h-16 w-16 items-center justify-center border-4 border-primary bg-secondary text-white shrink-0 neo-shadow-hover mt-4">
            <ShieldAlert className="h-9 w-9 stroke-[2.5]" />
          </div>

          <div className="flex flex-col gap-1.5">
            <h2 className="font-headline font-black text-3xl uppercase leading-none text-primary">
              ACCESS DENIED
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary mt-1">
              ADMINISTRATIVE PRIVILEGES REQUIRED
            </p>
          </div>

          <div className="font-body text-xs font-semibold uppercase leading-relaxed text-muted-foreground max-w-md">
            THIS AREA IS RESTRICTED STRICTLY TO SYSTEM ADMINISTRATORS. IF YOU BELIEVE YOUR ACCOUNT REQUIRES AUTHORIZATION, RUN THE UPDATE SQL QUERY IN YOUR DATABASE EDITOR.
          </div>

          <Link
            href="/dashboard"
            className="border-4 border-primary bg-[#ffcc00] text-primary px-8 py-3.5 text-xs font-black font-headline uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bauhaus-shadow-sm cursor-pointer mt-4"
          >
            RETURN TO HUB
          </Link>
        </div>
      </div>
    );
  }

  // Filter accounts
  const filteredProfiles = profilesList.filter((p) => 
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Stats summaries
  const totalUsers = profilesList.length;
  const totalPro = profilesList.filter((p) => p.tier === 'pro').length;
  const totalAdmin = profilesList.filter((p) => p.tier === 'admin').length;
  const totalFree = profilesList.filter((p) => p.tier === 'free').length;

  return (
    <div className="min-h-screen bg-background text-foreground font-body relative flex flex-col z-10 select-none pb-20">
      
      {/* Background Dots Grid */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 relative z-10 flex flex-col gap-8">
        
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-primary pb-5">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center border-3 border-primary bg-card hover:bg-accent text-primary cursor-pointer transition-all"
            >
              <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
            </Link>
            <div>
              <h1 className="text-2xl font-black font-headline uppercase tracking-widest text-primary flex items-center gap-2">
                <ShieldCheck className="h-7 w-7 text-secondary" />
                <span>Admin Operations</span>
              </h1>
              <p className="text-xs font-body font-semibold text-muted-foreground mt-1">
                Manage user database tiers, reset daily limits, and audit system credentials.
              </p>
            </div>
          </div>

          <button
            onClick={fetchAllProfiles}
            className="flex items-center gap-1.5 border-3 border-primary bg-card px-4 py-2 text-xs font-black font-headline uppercase tracking-wider text-primary hover:bg-accent hover:translate-y-[-1px] transition-all cursor-pointer shadow-[3px_3px_0px_0px_var(--primary)] hover:shadow-[4px_4px_0px_0px_var(--primary)] active:shadow-none active:translate-y-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingProfiles ? 'animate-spin' : ''}`} />
            <span>Reload Profiles</span>
          </button>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="border-3 border-primary bg-[#ffcc00] p-5 bauhaus-shadow-sm text-[#1a1a1a]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-wider font-headline">TOTAL ACCOUNTS</span>
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-black font-headline mt-3 leading-none">{totalUsers}</h2>
          </div>

          <div className="border-3 border-primary bg-[#e63b2e] p-5 bauhaus-shadow-sm text-white">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-wider font-headline text-white/80">PRO TIERS</span>
              <Star className="h-5 w-5 fill-current text-[#ffcc00] border-0" />
            </div>
            <h2 className="text-3xl font-black font-headline mt-3 leading-none">{totalPro}</h2>
          </div>

          <div className="border-3 border-primary bg-primary p-5 bauhaus-shadow-sm text-primary-foreground">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-wider font-headline text-primary-foreground/75">ADMINISTRATORS</span>
              <Settings className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-black font-headline mt-3 leading-none">{totalAdmin}</h2>
          </div>

          <div className="border-3 border-primary bg-card p-5 bauhaus-shadow-sm text-primary">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase tracking-wider font-headline text-muted-foreground">FREE TIERS</span>
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-black font-headline mt-3 leading-none">{totalFree}</h2>
          </div>
        </div>

        {/* Search Field */}
        <div className="flex items-center gap-3 bg-card border-3 border-primary p-3">
          <Search className="h-5 w-5 text-primary shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search profiles by User ID or email identifier..."
            className="w-full bg-transparent text-xs font-headline font-bold text-primary focus:outline-none placeholder:text-muted-foreground uppercase"
          />
        </div>

        {/* Profiles Table */}
        <div className="border-3 border-primary bg-card overflow-hidden bauhaus-shadow">
          
          <div className="bg-primary px-6 py-3 border-b-3 border-primary flex items-center text-primary-foreground font-headline font-black uppercase tracking-wider text-[10px]">
            <div className="flex-1">USER IDENTIFICATION</div>
            <div className="w-40 text-center">ACCOUNT TIER</div>
            <div className="w-40 text-center">DAILY USAGE COUNT</div>
            <div className="w-44 text-right">OPERATIONS</div>
          </div>

          {loadingProfiles ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <span className="text-xs font-black uppercase tracking-wider font-headline text-muted-foreground">
                FETCHING USER RECORDS...
              </span>
            </div>
          ) : filteredProfiles.length > 0 ? (
            <div className="divide-y divide-primary/20">
              {filteredProfiles.map((p) => {
                const isSaving = savingId === p.id;
                const isSuccess = successId === p.id;
                
                const tierVal = editedTiers[p.id] || p.tier;
                const usageVal = editedUsages[p.id] !== undefined ? editedUsages[p.id] : p.usage_count;

                return (
                  <div key={p.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 bg-card hover:bg-muted/30 transition-colors">
                    
                    {/* User Profile Identifiers */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0 pr-4">
                      <div className="font-headline font-black text-xs text-primary truncate">
                        {p.email}
                      </div>
                      <div className="font-mono text-[9px] text-muted-foreground select-all">
                        ID: {p.id}
                      </div>
                      <div className="font-mono text-[8px] text-muted-foreground/60">
                        LAST USED: {p.last_used_date || 'NEVER'} | LAST SYNC: {new Date(p.updated_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Tier selector */}
                    <div className="w-40 shrink-0 flex items-center justify-center">
                      <select
                        value={tierVal}
                        onChange={(e) => setEditedTiers({ ...editedTiers, [p.id]: e.target.value as any })}
                        className="w-full border-2 border-primary bg-background px-2.5 py-1.5 text-[10px] font-headline font-bold uppercase tracking-wider focus:outline-none focus:bg-accent focus:text-black dark:focus:text-black text-foreground dark:text-foreground"
                      >
                        <option value="free">★ Free Account</option>
                        <option value="pro">★ Pro Account</option>
                        <option value="admin">✦ Administrator</option>
                      </select>
                    </div>

                    {/* Usage count */}
                    <div className="w-40 shrink-0 flex items-center justify-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={usageVal}
                        onChange={(e) => setEditedUsages({ ...editedUsages, [p.id]: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-20 border-2 border-primary bg-background px-2 py-1.5 text-center text-[10px] font-headline font-bold text-primary focus:outline-none"
                      />
                      <button
                        onClick={() => setEditedUsages({ ...editedUsages, [p.id]: 0 })}
                        className="border border-primary bg-background hover:bg-secondary hover:text-white px-2 py-1 text-[8px] font-black uppercase tracking-wider font-headline transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Save update */}
                    <div className="w-44 shrink-0 flex justify-end gap-2">
                      <button
                        onClick={() => handleSaveProfile(p.id)}
                        disabled={isSaving || isSuccess}
                        className={`flex items-center gap-1.5 border-2 border-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-wider font-headline transition-all cursor-pointer ${
                          isSuccess 
                            ? 'bg-accent text-primary' 
                            : 'bg-primary text-primary-foreground hover:bg-accent hover:text-primary disabled:opacity-50'
                        }`}
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Saving</span>
                          </>
                        ) : isSuccess ? (
                          <>
                            <Check className="h-3 w-3 stroke-[3]" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3" />
                            <span>Update Profile</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="h-10 w-10 text-primary mb-3" />
              <h3 className="text-sm font-black uppercase tracking-widest font-headline text-primary">No profiles match</h3>
              <p className="text-xs font-body font-semibold text-muted-foreground max-w-xs mt-1.5">
                Refine your search parameters and check again.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
