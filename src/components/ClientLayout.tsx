'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide header on trip detail pages (they use TripSideHeader instead)
  const isTripDetailPage = pathname?.startsWith('/itinerary/') && pathname !== '/itinerary';
  
  return (
    <ThemeProvider>
      {!isTripDetailPage && <Header />}
      {children}
    </ThemeProvider>
  );
}
