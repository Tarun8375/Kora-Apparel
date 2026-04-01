'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  User,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';

type MenuItem = {
  _id?: string;
  label: string;
  href: string;
  isVisible: boolean;
  openInNewTab: boolean;
  sortOrder: number;
  children?: MenuItem[];
};

const getVisibleItems = (items: MenuItem[]): MenuItem[] => {
  if (!items) return [];
  return items
    .filter((item) => item.isVisible)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((item) => ({
      ...item,
      children: item.children ? getVisibleItems(item.children) : [],
    }));
};

// ── Desktop Nav Item (with hover dropdown) ────────────────────────────────

const DesktopMenuItem = ({
  item,
  isScrolled,
}: {
  item: MenuItem;
  isScrolled: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasChildren = item.children && item.children.length > 0;

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href={item.href}
        target={item.openInNewTab ? '_blank' : undefined}
        className={`relative flex items-center gap-1 text-[11px] font-black tracking-[0.18em] uppercase py-2 transition-all duration-200 group ${isScrolled
            ? 'text-foreground hover:text-primary'
            : 'text-white/80 hover:text-white'
          } ${isOpen ? (isScrolled ? 'text-primary' : 'text-white') : ''}`}
      >
        {item.label}
        {hasChildren && (
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
        {/* Underline hover effect */}
        <span
          className={`absolute bottom-0 left-0 h-[1.5px] bg-current transition-all duration-300 ${isOpen ? 'w-full' : 'w-0 group-hover:w-full'
            }`}
        />
      </Link>

      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-[100] min-w-[180px] bg-card/95 backdrop-blur-xl border border-border shadow-2xl shadow-black/10 rounded-2xl overflow-hidden py-2"
          >
            {/* Top accent strip */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            {item.children?.map((child, idx) => (
              <Link
                key={child._id || idx}
                href={child.href}
                target={child.openInNewTab ? '_blank' : undefined}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all group/child"
              >
                {child.label}
                <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover/child:opacity-100 group-hover/child:translate-x-0 transition-all" />
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Mobile Nav Item ───────────────────────────────────────────────────────

const MobileMenuItem = ({
  item,
  onClose,
  depth = 0,
}: {
  item: MenuItem;
  onClose: () => void;
  depth?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <Link
          href={item.href}
          target={item.openInNewTab ? '_blank' : undefined}
          onClick={onClose}
          className={`flex-1 py-4 font-serif tracking-[0.08em] uppercase hover:text-primary transition-colors ${depth === 0 ? 'text-2xl' : 'text-base text-muted-foreground pl-4'
            }`}
        >
          {item.label}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Subtle divider */}
      <div className="h-px bg-border/30" />

      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden bg-muted/20"
          >
            {item.children?.map((child, idx) => (
              <MobileMenuItem
                key={child._id || idx}
                item={child}
                onClose={onClose}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Navbar ───────────────────────────────────────────────────────────

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { getTotals } = useCartStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: settings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const navMenuItems = useMemo(
    () => (settings?.navMenuItems ? getVisibleItems(settings.navMenuItems) : []),
    [settings?.navMenuItems]
  );

  if (pathname.startsWith('/admin') || pathname.startsWith('/admin-login')) return null;

  const { totalQty } = getTotals();

  const iconColor = isScrolled ? 'text-foreground' : 'text-white';

  const announcementText = useMemo(() => {
    const section = settings?.pageSections?.find((s: any) =>
      (s.type === 'announcement' || s.type === 'ticker') && s.isVisible
    );
    let baseText = section?.content?.text || settings?.announcementText;
    const threshold = settings?.shippingThreshold || 5000;
    if (baseText) {
      return baseText.replace('{{price}}', `₹${threshold.toLocaleString()}`).replace('₹{{price}}', `₹${threshold.toLocaleString()}`);
    }
    return `Free shipping on orders over ₹${threshold.toLocaleString()}`;
  }, [settings]);

  return (
    <>
      {/* ── Announcement Bar ───────────────────────────────────────────── */}
      <AnimatePresence>
        {announcementText && !isScrolled && !mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-0 w-full z-[999] bg-foreground text-background overflow-hidden opacity-90"
          >
            <div className="flex items-center justify-center py-2 overflow-hidden">
              <motion.div
                animate={{ x: [0, -400] }}
                transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
                className="flex gap-16 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.4em]"
              >
                {Array(8).fill(announcementText).map((t, i) => (
                  <span key={i}>{t}</span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header
        className={`fixed w-full z-[1000] transition-all duration-700 ${announcementText && !isScrolled && !mobileMenuOpen ? 'top-7' : 'top-0'
          } ${isScrolled
            ? 'bg-background/70 backdrop-blur-[20px] shadow-none'
            : 'bg-transparent'
          }`}
      >
        <div className="mx-auto px-6 max-w-7xl h-16 flex items-center justify-between">

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 -ml-2"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <div className={`flex flex-col gap-1.5 ${iconColor}`}>
              <span className="w-6 h-[1.5px] bg-current block transition-all" />
              <span className="w-4 h-[1.5px] bg-current block transition-all" />
            </div>
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="relative z-10 hover:opacity-80 transition-opacity duration-300 flex-shrink-0"
          >
            {settings?.logo ? (
              <img
                src={getImageUrl(settings.logo)}
                alt="Kora"
                className={`h-8 md:h-9 w-auto object-contain transition-all duration-500 ${isScrolled ? '' : 'brightness-0 invert'
                  }`}
              />
            ) : (
              <span
                className={`text-2xl font-serif font-black tracking-[0.25em] uppercase transition-colors duration-500 ${isScrolled ? 'text-foreground' : 'text-white'
                  }`}
              >
                Kora
              </span>
            )}
          </Link>

          {/* Desktop Nav — centered */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navMenuItems.map((item, idx) => (
              <DesktopMenuItem
                key={item._id || idx}
                item={item}
                isScrolled={isScrolled}
              />
            ))}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className={`p-3 transition-all hover:scale-110 hidden sm:block ${iconColor}`}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Account */}
            <Link
              href={mounted && user ? '/account' : '/account?tab=login'}
              className={`p-3 transition-all hover:scale-110 ${iconColor}`}
              aria-label="Account"
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className={`p-3 relative transition-all hover:scale-110 ${iconColor}`}
              aria-label={`Cart (${totalQty})`}
            >
              <ShoppingBag className="w-4 h-4" />
              <AnimatePresence>
                {mounted && totalQty > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2 right-2 min-w-[14px] h-[14px] bg-primary text-primary-foreground text-[8px] font-black flex items-center justify-center rounded-full"
                  >
                    {totalQty}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Search Overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-background/95 backdrop-blur-xl flex flex-col items-center pt-32 px-6"
          >
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-8 right-8 p-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-2xl"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-5 text-center">
                Search the collection
              </p>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="T-shirts, Outerwear, Drops…"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const q = (e.target as HTMLInputElement).value;
                      if (q) { window.location.href = `/shop?q=${encodeURIComponent(q)}`; setSearchOpen(false); }
                    }
                    if (e.key === 'Escape') setSearchOpen(false);
                  }}
                  className="w-full h-16 pl-14 pr-6 bg-card border border-border rounded-2xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xl"
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-4 font-medium tracking-widest uppercase">
                Press Enter to search · Esc to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Menu Overlay ─────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-0 z-[2000] bg-background flex flex-col"
          >
            {/* Mobile header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/10">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-serif tracking-tight uppercase"
              >
                Kora
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto px-6 pt-4 pb-8">
              {navMenuItems.map((item, idx) => (
                <MobileMenuItem
                  key={item._id || idx}
                  item={item}
                  onClose={() => setMobileMenuOpen(false)}
                />
              ))}

              {!user && (
                <Link
                  href="/account?tab=login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-10 flex items-center justify-center gap-3 w-full py-4 liquid-neon-btn text-xs font-black uppercase tracking-[0.2em] group transition-all"
                >
                  Acquire Access
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </nav>

            {/* Bottom links */}
            <div className="px-6 py-5 border-t border-border/30 bg-muted/10">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 mb-3">Quick Links</p>
              <div className="flex gap-6">
                <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Philosophy</Link>
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Contact</Link>
                <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Shop</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
