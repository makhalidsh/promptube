'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Key, Settings, Sun, Moon, User } from 'lucide-react';
import YoutubeIcon from '../ui/YoutubeIcon';
import { useAppContext } from '../AppContext';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, apiKey, user, signOut } = useAppContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Workspace', href: '/dashboard' },
    { name: 'History', href: '/history' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b-4 border-primary bg-background transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center border-3 border-primary bg-secondary text-white transition-all duration-150 group-hover:bg-accent group-hover:text-primary">
            <YoutubeIcon className="h-5 w-5 fill-current" />
          </div>
          <span className="font-headline font-black tracking-tight text-xl text-primary uppercase">
            promp<span className="text-secondary">tube</span>
          </span>
        </Link>

        {/* Desktop Navigation (Text-only Bauhaus style) */}
        <nav className="hidden md:flex items-center gap-4">
          {navItems.map((item) => {
            const hasHistoryTab = typeof window !== 'undefined' && window.location.search.includes('tab=history');
            let isActive = false;
            
            if (item.href.includes('tab=history')) {
              isActive = pathname === '/dashboard' && hasHistoryTab;
            } else if (item.href === '/dashboard') {
              isActive = pathname === '/dashboard' && !hasHistoryTab;
            } else {
              isActive = pathname === item.href;
            }
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center text-xs font-bold uppercase tracking-wider font-headline border-3 px-4 py-2 transition-all duration-150 ${
                  isActive 
                    ? 'bg-accent text-primary border-primary bauhaus-shadow-sm translate-x-[-2px] translate-y-[-2px]' 
                    : 'border-transparent text-primary hover:bg-muted hover:border-primary hover:translate-x-[-1px] hover:translate-y-[-1px] hover:bauhaus-shadow-sm'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          
          {/* API Key Status Indicator */}
          {user && (
            apiKey ? (
              <div className="hidden sm:flex items-center gap-1.5 border-3 border-primary bg-accent/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider font-headline text-primary">
                <Key className="h-3.5 w-3.5" />
                <span>Gemini Active</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 border-3 border-primary bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-wider font-headline text-muted-foreground">
                <Key className="h-3.5 w-3.5" />
                <span>Local AI Mode</span>
              </div>
            )
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="flex h-9 w-9 items-center justify-center border-3 border-primary bg-card text-foreground transition-all duration-150 hover:bg-accent cursor-pointer shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-accent animate-fade-in" />
            ) : (
              <Moon className="h-4 w-4 text-primary animate-fade-in" />
            )}
          </button>

          {/* Access Gate Button for unauthenticated users only */}
          {!user && (
            <Link
              href="/dashboard"
              className="border-3 border-primary bg-primary px-4 py-1.5 text-xs font-black uppercase tracking-wider font-headline text-primary-foreground hover:bg-accent hover:text-primary transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bauhaus-shadow-sm"
            >
              Access Gate
            </Link>
          )}

          {/* Profile Dropdown for authenticated users */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User Profile Menu"
                className="flex h-9 w-9 items-center justify-center border-3 border-primary bg-[#ffcc00] text-primary transition-all duration-150 hover:bg-accent cursor-pointer shrink-0 neo-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                <User className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3.5 w-56 border-3 border-primary bg-card p-4 neo-shadow z-50 flex flex-col gap-3.5">
                  {/* User details */}
                  <div className="flex flex-col gap-1 border-b-2 border-primary/20 pb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Authenticated User</span>
                    <span className="text-[10px] font-headline font-black text-primary truncate uppercase select-all animate-fade-in" title={user.email}>
                      {user.email}
                    </span>
                  </div>

                  {/* Options */}
                  <div className="flex flex-col gap-1.5">
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider font-headline border-2 border-transparent hover:border-primary hover:bg-accent hover:text-primary px-2.5 py-1.5 transition-all text-primary"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Account Settings</span>
                    </Link>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full text-center border-3 border-primary bg-secondary hover:bg-primary text-white hover:text-primary-foreground py-2 text-[10px] font-black font-headline uppercase tracking-widest transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--primary)] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
