'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export default function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}: DialogProps) {
  // Prevent background scrolling when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-primary/40 transition-opacity duration-150" 
        onClick={onClose}
      />

      {/* Dialog container */}
      <div 
        className={`relative z-10 w-full ${maxWidthClasses[maxWidth]} border-4 border-primary bg-card text-foreground bauhaus-shadow transition-all duration-150 animate-slide-up`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-primary p-4 bg-muted/40">
          <h3 className="text-xs font-black uppercase tracking-wider font-headline leading-none text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="border-2 border-primary p-1 text-primary hover:bg-accent transition-all duration-150 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t-3 border-primary bg-muted p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
