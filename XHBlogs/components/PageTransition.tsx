"use client";

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function PageTransition({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div key={usePathname()} className={`page-arrival ${className}`}>{children}</div>;
}
