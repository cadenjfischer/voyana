'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import Header from '@/components/Header';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Header />
      {children}
    </ThemeProvider>
  );
}
