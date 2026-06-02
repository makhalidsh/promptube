'use client';

import React from 'react';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export default function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
}: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      {(label || description) && (
        <div className="flex flex-col select-none">
          {label && <span className="text-xs font-semibold text-foreground leading-none">{label}</span>}
          {description && <span className="text-[10px] text-muted-foreground mt-1">{description}</span>}
        </div>
      )}
      
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center border-3 border-primary transition-all duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-accent' : 'bg-muted'
        }`}
      >
        <span
          className={`pointer-events-none block h-4 w-4 border-2 border-primary bg-primary transition-transform duration-150 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
