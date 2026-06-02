import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import YoutubeIcon from '../ui/YoutubeIcon';

export default function Footer() {
  return (
    <footer className="w-full border-t-4 border-primary bg-background transition-colors duration-200 py-6 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Branding */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center border-2 border-primary bg-secondary text-white">
            <YoutubeIcon className="h-3.5 w-3.5 fill-current" />
          </div>
          <span className="text-xs font-black tracking-widest font-headline uppercase text-foreground">
            promp<span className="text-secondary">tube</span>
          </span>
          <span className="text-[10px] font-bold font-headline text-muted-foreground">© {new Date().getFullYear()}</span>
        </div>

        {/* Tech Stack Info */}
        <div className="flex items-center gap-1 text-[11px] font-headline uppercase font-bold text-muted-foreground">
          <span>Engineered using Next.js & Gemini AI</span>
        </div>

        {/* Links */}
        <div className="flex gap-4 text-[11px] font-headline uppercase font-bold text-muted-foreground">
          <Link href="/privacy" className="hover:text-secondary transition-colors duration-150">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-secondary transition-colors duration-150">Terms of Service</Link>
          <a href="#" className="hover:text-secondary transition-colors duration-150">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
