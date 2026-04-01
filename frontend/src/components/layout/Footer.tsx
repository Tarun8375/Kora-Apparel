'use client';

import Link from 'next/link';
import { getImageUrl } from '@/lib/imageUrl';
import { usePathname } from 'next/navigation';
import { ArrowRight, Loader2, Instagram, Twitter, Facebook } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Footer() {
  const pathname = usePathname();

  // Fetch settings for dynamic footer links
  const { data: settings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch visible shop categories for footer
  const { data: categories = [] } = useQuery({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (pathname?.startsWith('/admin')) return null;

  // Dynamic footer nav links
  const footerLinks: { label: string; href: string; openInNewTab: boolean }[] =
    settings?.footerMenuItems?.filter((item: any) => item.isVisible)
      ?.sort((a: any, b: any) => a.sortOrder - b.sortOrder) || [
      { label: 'Shop', href: '/shop', openInNewTab: false },
      { label: 'About', href: '/about', openInNewTab: false },
      { label: 'Contact', href: '/contact', openInNewTab: false },
    ];

  const shopCategories = categories.filter((c: any) => c.isVisible).slice(0, 6);
  const brandName = settings?.brandName || 'Kora Apparel';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/newsletter', { email });
      toast.success('Thank you for subscribing!');
      setEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to subscribe to newsletter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-background border-t border-border pt-32 pb-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 mb-32">
          
          {/* Brand */}
          <div className="md:col-span-5 flex flex-col gap-8">
            <Link href="/" className="inline-block transition-opacity hover:opacity-70">
              {settings?.logo ? (
                <img src={getImageUrl(settings.logo)} alt="Kora Apparel" className="h-8 md:h-10 w-auto object-contain" />
              ) : (
                <h2 className="text-4xl font-serif tracking-tight uppercase">KORA</h2>
              )}
            </Link>
            <p className="text-sm uppercase tracking-widest text-muted-foreground leading-loose max-w-sm">
              {settings?.brandDescription || 'ABSOLUTE FORM. ZERO NOISE. A UNIFORM FOR THE NEW ARCHITECTURE.'}
            </p>

            {/* Social Links */}
            <div className="flex gap-6 mt-4">
              {settings?.socialLinks?.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings?.socialLinks?.twitter && (
                <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {settings?.socialLinks?.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div className="md:col-span-1 hidden md:block"></div>

          {/* Dynamic Category Shop Links */}
          <div className="md:col-span-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-foreground">Divisions</h4>
            <ul className="flex flex-col gap-4">
              {shopCategories.length > 0 ? shopCategories.map((cat: any) => (
                <li key={cat._id}>
                  <Link
                    href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                    className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              )) : (
                <>
                  <li><Link href="/shop" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">All Units</Link></li>
                  <li><Link href="/drops" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">New Transmissions</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Dynamic Footer Links */}
          <div className="md:col-span-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-foreground">Index</h4>
            <ul className="flex flex-col gap-4">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.openInNewTab ? '_blank' : undefined}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-full h-[1px] bg-border mb-8" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">
          <p suppressHydrationWarning={true}>© {new Date().getFullYear()} KORA STUDIO. ALL RIGHTS RESERVED.</p>
          <div className="flex space-x-8">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
