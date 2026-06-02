import React from 'react';

interface YoutubeIconProps {
  className?: string;
}

export default function YoutubeIcon({ className = 'h-5 w-5' }: YoutubeIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M23.498 6.163c-.272-1.022-1.074-1.826-2.097-2.098C19.544 3.5 12 3.5 12 3.5s-7.544 0-9.401.565C1.576 4.337.774 5.14.502 6.163C0 8.02 0 12 0 12s0 3.98.502 5.837c.272 1.022 1.074 1.826 2.097 2.098C4.456 20.5 12 20.5 12 20.5s7.544 0 9.401-.565c1.023-.272 1.825-1.076 2.097-2.098C24 17.98 24 14 24 14s0-3.98-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
