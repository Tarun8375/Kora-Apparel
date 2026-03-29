"use client";

import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ExitPopup } from '@/components/exit-popup';
import TrackingScripts from '@/components/TrackingScripts';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kora Apparel | Premium Minimal Fashion',
  description: 'A modern, premium fashion brand for the bold.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} dark`}>
      <body className="antialiased min-h-screen flex flex-col selection:bg-primary selection:text-primary-foreground">
        <Providers>
          <TrackingScripts />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster richColors />
          <ExitPopup />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
