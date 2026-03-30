'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';
import { ArrowUpRight, ArrowRight, Truck, RotateCcw, Gem, MapPin, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

// ── Data Fetchers ───────────────────────────────────────────────────────────

const fetchNewArrivals = async () => { const { data } = await api.get('/products?sort=newest&limit=4'); return data.products; };
const fetchCollections = async () => { const { data } = await api.get('/products?featured=true&limit=4'); return data.products; };
const fetchBasics = async () => { const { data } = await api.get('/products?category=Basics&limit=4'); return data.products; };
const fetchActiveBanner = async () => { try { const { data } = await api.get('/banners/active'); return data; } catch (err) { console.error('Failed to fetch active banner:', err); return null; } };
const fetchSettings = async () => { try { const { data } = await api.get('/settings'); return data; } catch (err) { console.error('Failed to fetch settings:', err); return null; } };
const fetchTestimonials = async () => { try { const { data } = await api.get('/testimonials?active=true'); return data; } catch (err) { console.error('Failed to fetch testimonials:', err); return []; } };
const fetchCategories = async () => { try { const { data } = await api.get('/categories'); return data; } catch (err) { console.error('Failed to fetch categories:', err); return []; } };

// ── Animation Helpers ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { delay: i * 0.1, duration: 0.6 }
  }),
};

// ── Modular Components ──────────────────────────────────────────────────────

/**
 * 1. SPLIT HERO SECTION
 */
function HeroSection({ banner, settings, content = {} }: { banner: any, settings: any, content?: any }) {
  const heading = content.heading || banner?.title || settings?.heroHeading || 'Redefining Essentials';
  const subtext = content.subtext || banner?.subtitle || settings?.heroSubtext || 'New Collection — SS 2026';
  const btnText = content.buttonText || banner?.ctaText || settings?.heroButtonText || 'Explore Collection';
  const btnLink = banner?.ctaLink || '/shop';

  return (
    <section className="relative w-full min-h-[90svh] flex items-center overflow-hidden pt-20 md:pt-16 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.04),transparent_60%)] pointer-events-none" />
      <div className="container mx-auto px-6 max-w-[1400px] w-full grid md:grid-cols-2 gap-8 md:gap-16 items-center py-16 relative z-10">
        <div className="flex flex-col gap-6 md:gap-8 order-2 md:order-1 items-start">
          <motion.p custom={0} initial="hidden" animate="visible" variants={fadeUp} className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
            <span className="w-8 h-[1.5px] bg-primary inline-block" />
            {subtext}
          </motion.p>
          <motion.h1 custom={1} initial="hidden" animate="visible" variants={fadeUp} className="text-[clamp(3rem,7vw,7rem)] font-serif font-medium leading-[0.9] tracking-tight text-foreground lowercase">
            {heading.split(' ').map((word: string, i: number) => (
              <span key={i} className={`block ${i % 2 !== 0 ? 'ml-[0.15em] italic text-primary/80' : ''}`}>
                {word}
              </span>
            ))}
          </motion.h1>
          <motion.p custom={2} initial="hidden" animate="visible" variants={fadeUp} className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-md font-light">
            {settings?.aboutPageText ? settings.aboutPageText.slice(0, 150) + '…' : 'Premium minimal fashion designed for the bold.'}
          </motion.p>
          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="flex items-center gap-5 flex-wrap">
            <Link href={btnLink} className="group inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.18em] hover:bg-primary hover:text-primary-foreground transition-all duration-500 shadow-xl active:scale-95">
              <span className="relative z-10">{btnText}</span>
              <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
            <Link href="/drops" className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 border-b border-transparent hover:border-foreground/10 pb-1">
              View Drops <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeIn} className="relative order-1 md:order-2 flex justify-center">
          <div className="relative w-full max-w-[480px] aspect-[3/4] rounded-[3rem] overflow-hidden bg-muted shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/5">
            {banner?.image ? (
              <img src={getImageUrl(banner.image)} alt="Kora Collection" className="w-full h-full object-cover object-center scale-[1.02] hover:scale-[1.05] transition-transform duration-[2s]" />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
            <div className="absolute top-8 right-8 bg-background/95 backdrop-blur-md rounded-2xl px-5 py-4 shadow-2xl border border-border/30">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">SS 2026</p>
              <p className="text-sm font-serif font-medium text-foreground italic">New House Code</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * 2. FEATURES BAR
 */
function FeatureBar({ settings }: { settings: any }) {
  const features = [
    { icon: Truck, label: 'Free Shipping', sub: settings?.deliveryPolicy || 'On orders over ₹2,000' },
    { icon: RotateCcw, label: 'Easy Returns', sub: settings?.returnPolicy || '14-day return policy' },
    { icon: Gem, label: 'Premium Quality', sub: 'Ethically crafted fabrics' },
    { icon: MapPin, label: 'Made in India', sub: 'Proudly home-grown' },
  ];
  return (
    <section className="w-full border-y border-border/30 bg-card/10 backdrop-blur-md relative z-20">
      <div className="container mx-auto max-w-[1400px]">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/30">
          {features.map(({ icon: Icon, label, sub }, i) => (
            <motion.div key={label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex items-center gap-4 px-8 py-8 group transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all duration-500 transform group-hover:rotate-[10deg]">
                <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[11px] font-black uppercase tracking-widest text-foreground truncate">{label}</span>
                <span className="text-[10px] text-muted-foreground truncate font-light">{sub}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 3. CATEGORY CARDS
 */
function CategoryGridSection({ categories }: { categories: any[] }) {
  const visible = categories.filter(c => c.isVisible !== false).slice(0, 3);
  if (visible.length === 0) return null;
  return (
    <section className="w-full py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6 max-w-[1400px]">
        <div className="flex items-end justify-between mb-12 md:mb-16">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-3">The Curation</p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-4xl md:text-6xl font-serif font-medium tracking-tight lowercase">
              explore the house
            </motion.h2>
          </div>
          <Link href="/shop" className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all group pb-1 border-b border-transparent hover:border-foreground/10">
            All Categories <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {visible.map((cat, idx) => (
            <motion.div key={cat._id} custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <Link href={`/shop?category=${encodeURIComponent(cat.slug)}`} className="group relative block w-full aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-muted border border-border/20 shadow-xl">
                {cat.image ? (
                  <img src={getImageUrl(cat.image)} alt={cat.name} className="w-full h-full object-cover object-center transition-transform duration-[2s] ease-[0.22,1,0.36,1] group-hover:scale-110" />
                ) : <div className="w-full h-full bg-muted" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 flex items-end justify-between">
                  <div className="flex flex-col gap-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/80 group-hover:text-primary transition-colors">House Line 00{idx + 1}</p>
                    <h3 className="text-3xl font-serif font-medium text-white tracking-tight lowercase">{cat.name}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-md group-hover:bg-primary group-hover:border-primary group-hover:scale-110 transition-all duration-500">
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 4. TICKER 
 */
function Ticker({ content = {}, settings }: { content?: any, settings: any }) {
  const threshold = settings?.shippingThreshold || 5000;
  const rawText = content.text || "NEW DROP NOW LIVE · LIMITED EDITIONS · FREE SHIPPING ON ORDERS OVER {{price}} · REFINING MINIMALISM · ";
  const text = rawText.replace('{{price}}', `₹${threshold.toLocaleString()}`).replace('₹{{price}}', `₹${threshold.toLocaleString()}`);

  return (
    <div className="w-full bg-primary py-5 overflow-hidden flex whitespace-nowrap border-y border-primary/20 uppercase relative z-30">
      <motion.div animate={{ x: [0, -1000] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="flex gap-16 items-center">
        {Array(10).fill(text).map((t, i) => (
          <span key={i} className="text-[11px] font-black uppercase tracking-[0.4em] text-primary-foreground whitespace-nowrap">{t}</span>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * 5. PRODUCT CARD COMPONENT
 */
function ProductCard({ product, idx }: { product: any; idx: number }) {
  return (
    <motion.div custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={fadeUp} className="group flex flex-col gap-4">
      <Link href={`/shop/${product.slug}`} className="relative block w-full aspect-[3/4] overflow-hidden rounded-[2.5rem] bg-muted border border-border/10">
        {product.images?.[0] ? (
          <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover object-center transition-transform duration-[1.5s] ease-[0.22,1,0.36,1] group-hover:scale-110" />
        ) : <div className="w-full h-full bg-muted" />}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
          <span className="flex items-center gap-2 bg-background/90 backdrop-blur-md text-foreground text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full shadow-2xl border border-border/40 whitespace-nowrap">
            <ShoppingBag className="w-3.5 h-3.5" /> Quick Shop
          </span>
        </div>
        {product.stock === 0 && (
          <div className="absolute top-4 left-4 text-[9px] font-black uppercase tracking-widest bg-foreground text-background px-4 py-1.5 rounded-full">
            Sold Out
          </div>
        )}
      </Link>
      <div className="flex flex-col gap-1 px-1">
        <Link href={`/shop/${product.slug}`} className="text-sm font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors line-clamp-1">{product.name}</Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-light text-foreground/70 tracking-widest">₹{product.price.toLocaleString()}</span>
          {product.comparePrice > product.price && <span className="text-xs text-muted-foreground line-through opacity-40">₹{product.comparePrice.toLocaleString()}</span>}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 6. PRODUCT GRID SECTION 
 */
function ProductGridSection({ title, eyebrow, products, isLoading, viewAllLink }: { title: string, eyebrow: string, products: any[], isLoading: boolean, viewAllLink: string }) {
  if (!isLoading && (!products || products.length === 0)) return null;
  return (
    <section className="w-full py-24 md:py-32 border-t border-border/10 bg-background">
      <div className="container mx-auto px-6 max-w-[1400px]">
        <div className="flex items-end justify-between mb-14 md:mb-20">
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
            <motion.h2 initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-4xl md:text-6xl font-serif font-medium tracking-tight lowercase">{title}</motion.h2>
          </div>
          <Link href={viewAllLink} className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
            View All <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-12 md:gap-y-20">
          {isLoading ? Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <div className="aspect-[3/4] bg-muted animate-pulse rounded-[2.5rem]" />
              <div className="h-4 w-2/3 bg-muted animate-pulse rounded-full" />
            </div>
          )) : products?.slice(0, 4).map((p: any, i: number) => (
            <ProductCard key={p._id} product={p} idx={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 7. TESTIMONIALS & EDITORIAL CTA
 */
function TestimonialsSection({ testimonials, content = {} }: { testimonials: any[], content?: any }) {
  if (testimonials.length === 0) return null;
  return (
    <section className="w-full py-24 md:py-32 border-t border-border/10 bg-card/5">
      <div className="container mx-auto px-6 max-w-[1400px]">
        <div className="text-center mb-16 md:mb-24 flex flex-col items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Voices of Kora</p>
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-4xl md:text-6xl font-serif font-medium tracking-tight lowercase">
            {content.sectionLabel || 'what they say'}
          </motion.h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t: any, idx: number) => (
            <motion.div key={t._id} custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-background border border-border/40 rounded-[2.5rem] p-10 flex flex-col gap-6 shadow-xl hover:shadow-2xl transition-all duration-500">
              <p className="text-foreground/90 text-[15px] leading-relaxed font-light italic flex-1">"{t.review}"</p>
              <div className="flex items-center gap-4 pt-8 border-t border-border/30">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm">{t.name.charAt(0)}</div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-foreground">{t.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.designation || 'Verified Buyer'}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorialSection({ content = {}, settings }: { content?: any, settings: any }) {
  return (
    <section className="relative w-full py-32 md:py-48 overflow-hidden bg-foreground text-background">
      <div className="relative container mx-auto px-6 max-w-4xl text-center flex flex-col items-center gap-10">
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium tracking-tight lowercase leading-[1.1]">
          {content.heading || 'elevating everyday wear through intentional design.'}
          {content.subheading && <span className="italic text-background/50 font-light block mt-6 text-2xl md:text-3xl">{content.subheading}</span>}
        </motion.h2>
        <Link href="/shop" className="group flex items-center gap-3 bg-background text-foreground px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-all duration-500 shadow-2xl">
          Explore Collection <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </section>
  );
}

/**
 * 8. NEWSLETTER
 */
function NewsletterSection() {
  return (
    <section className="w-full py-40 md:py-56 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 text-center max-w-3xl space-y-12 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">The Inner Circle</p>
        <h2 className="text-5xl md:text-8xl font-serif font-medium tracking-tight lowercase leading-[0.8] mb-8">join the <br /> house list</h2>
        <form className="flex flex-col md:flex-row gap-5 justify-center mt-12">
          <input type="email" placeholder="Enter your email address" className="w-full md:w-[380px] bg-card border border-border/40 px-8 py-5 rounded-full focus:outline-none focus:border-primary/60 text-sm font-light" />
          <button className="bg-foreground text-background px-10 py-5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all shadow-xl">Join Now</button>
        </form>
      </div>
    </section>
  );
}

// ── MAIN EXPORT ──────────────────────────────────────────────────────────────

export default function Home() {
  const { data: newArrivals, isLoading: newArrivalsLoading } = useQuery({ queryKey: ['products', 'newest'], queryFn: fetchNewArrivals });
  const { data: collections, isLoading: collectionsLoading } = useQuery({ queryKey: ['products', 'featured'], queryFn: fetchCollections });
  const { data: basics, isLoading: basicsLoading } = useQuery({ queryKey: ['products', 'basics'], queryFn: fetchBasics });
  const { data: banner } = useQuery({ queryKey: ['active-banner'], queryFn: fetchActiveBanner });
  const { data: settings, isLoading: settingsLoading } = useQuery({ queryKey: ['global-settings'], queryFn: fetchSettings });
  const { data: testimonials = [] } = useQuery({ queryKey: ['testimonials'], queryFn: fetchTestimonials });
  const { data: allCategories = [] } = useQuery({ queryKey: ['public-categories'], queryFn: fetchCategories });

  const { data: categoryRowProducts = [] } = useQuery({
    queryKey: ['category-row-products', settings?.pageSections?.find((s: any) => s.type === 'category-row')?.content?.categorySlug],
    queryFn: async () => {
      const slug = settings?.pageSections?.find((s: any) => s.type === 'category-row')?.content?.categorySlug;
      if (!slug) return [];
      const { data } = await api.get(`/products?category=${encodeURIComponent(slug)}&limit=4`);
      return data.products;
    },
    enabled: !!settings?.pageSections?.some((s: any) => s.type === 'category-row')
  });

  if (settingsLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const pageSections = settings?.pageSections ? [...settings.pageSections].sort((a: any, b: any) => a.sortOrder - b.sortOrder) : [];

  return (
    <div className="w-full flex flex-col bg-background text-foreground min-h-screen selection:bg-primary selection:text-white">
      {pageSections.length > 0 ? (
        pageSections.map((section: any, idx: number) => {
          if (section.isVisible === false) return null;
          const key = `${section.type}-${idx}`;
          switch (section.type) {
            case 'hero': return <HeroSection key={key} banner={banner} settings={settings} content={section.content} />;
            case 'features-bar': return <FeatureBar key={key} settings={settings} />;
            case 'categories': return <CategoryGridSection key={key} categories={allCategories} />;
            case 'ticker': case 'announcement': return <Ticker key={key} content={section.content} settings={settings} />;
            case 'new-arrivals': case 'drops': return <ProductGridSection key={key} title={section.content?.title || "new arrivals"} eyebrow={section.content?.eyebrow || "just in"} products={newArrivals || []} isLoading={newArrivalsLoading} viewAllLink="/shop?sort=newest" />;
            case 'featured': return <ProductGridSection key={key} title={section.content?.title || "the collection"} eyebrow={section.content?.eyebrow || "handpicked"} products={collections || []} isLoading={collectionsLoading} viewAllLink="/shop?featured=true" />;
            case 'category-row': return <ProductGridSection key={key} title={section.content?.title || "basics collection"} eyebrow={section.content?.eyebrow || "essentials"} products={categoryRowProducts} isLoading={false} viewAllLink={`/shop?category=${encodeURIComponent(section.content?.categorySlug || '')}`} />;
            case 'testimonials': return <TestimonialsSection key={key} testimonials={testimonials} content={section.content} />;
            case 'editorial': return <EditorialSection key={key} content={section.content} settings={settings} />;
            case 'newsletter': return <NewsletterSection key={key} />;
            default: return null;
          }
        })
      ) : (
        <>
          <HeroSection banner={banner} settings={settings} />
          <FeatureBar settings={settings} />
          <ProductGridSection title="new arrivals" eyebrow="just in" products={newArrivals || []} isLoading={newArrivalsLoading} viewAllLink="/shop" />
        </>
      )}
    </div>
  );
}
