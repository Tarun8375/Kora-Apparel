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
 * 1. ASYMMETRIC HERO SECTION
 */
function HeroSection({ banner, settings, content = {} }: { banner: any, settings: any, content?: any }) {
  const heading = content.heading || banner?.title || settings?.heroHeading || 'The Essential Void';
  const subtext = content.subtext || banner?.subtitle || settings?.heroSubtext || 'Curated Uniforms — SS 2026';
  const btnText = content.buttonText || banner?.ctaText || settings?.heroButtonText || 'Enter Collection';
  const btnLink = banner?.ctaLink || '/shop';

  return (
    <section className="relative w-full min-h-[100svh] flex items-center pt-24 pb-12 bg-background overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(136,206,255,0.03),transparent_50%)] pointer-events-none" />
      <div className="container mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* TEXT CONTENT - Span 7 columns */}
        <div className="lg:col-span-7 flex flex-col items-start gap-8 z-20">
          <motion.p custom={0} initial="hidden" animate="visible" variants={fadeUp} className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-4">
            {subtext}
          </motion.p>
          <motion.h1 custom={1} initial="hidden" animate="visible" variants={fadeUp} className="text-[clamp(4rem,10vw,12rem)] font-serif leading-[0.85] tracking-tight uppercase text-foreground mix-blend-difference">
            {(heading || '').split(' ').map((word: string, i: number) => (
              <span key={i} className="block">
                {word}
              </span>
            ))}
          </motion.h1>
          <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp} className="flex grid-cols-2 flex-col sm:flex-row gap-6 sm:gap-12 mt-4 max-w-2xl w-full">
            <p className="text-muted-foreground text-sm uppercase tracking-widest leading-relaxed flex-1">
              {settings?.aboutPageText ? settings.aboutPageText.slice(0, 150) + '…' : 'A uniform designed for the digital age. Stripped of excess. Built for permanence.'}
            </p>
            <div className="flex flex-col gap-4 items-start sm:items-end flex-1">
              <Link href={btnLink} className="group flex items-center justify-between w-full border-b border-foreground pb-4 hover:border-primary transition-colors">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground group-hover:text-primary transition-colors">{btnText}</span>
                <ArrowRight className="w-5 h-5 text-foreground group-hover:text-primary transition-colors group-hover:translate-x-2" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* IMAGE CONTENT - Span 5 columns Asymmetric */}
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeIn} className="lg:col-span-5 relative flex justify-end lg:-mr-12 xl:-mr-24 mt-12 lg:mt-0">
          <div className="relative w-full max-w-[500px] aspect-[4/5] bg-card overflow-hidden">
            {banner?.image ? (
              <img src={getImageUrl(banner.image)} alt="Editorial Hero" className="w-full h-full object-cover scale-[1.02] hover:scale-105 transition-transform duration-[2s] sepia-[0.3] hover:sepia-0 grayscale-[0.2]" />
            ) : (
              <div className="w-full h-full bg-card" />
            )}
            <div className="absolute bottom-0 left-0 bg-background/80 backdrop-blur-md px-6 py-4">
              <p className="text-[10px] uppercase tracking-[0.3em] font-black">Archive 01</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

/**
 * 2. FEATURES BAR (Ghost Layout)
 */
function FeatureBar({ settings }: { settings: any }) {
  const features = [
    { icon: Truck, label: 'Global Shipping', sub: settings?.deliveryPolicy || 'Complimentary over $200' },
    { icon: RotateCcw, label: 'Free Returns', sub: settings?.returnPolicy || '14-day curation window' },
    { icon: Gem, label: 'Architectural Specs', sub: 'High-density fabrics' },
    { icon: MapPin, label: 'Studio Origin', sub: 'Designed in isolation' },
  ];
  return (
    <section className="w-full bg-card pt-20 pb-20 relative z-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 lg:gap-8">
          {features.map(({ icon: Icon, label, sub }, i) => (
            <motion.div key={label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex flex-col gap-4 group">
              <div className="w-full h-[1px] bg-border group-hover:bg-primary transition-colors duration-500" />
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground">{label}</span>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-widest">{sub}</span>
                </div>
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1} />
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
    <section className="w-full py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-xl">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-5xl md:text-7xl font-serif leading-[0.9] tracking-tight uppercase">
              The Archives
            </motion.h2>
          </div>
          <Link href="/shop" className="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-foreground hover:text-primary transition-colors border-b border-foreground hover:border-primary pb-2 w-fit">
            View Syllabus <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-16 gap-x-8">
          {visible.map((cat, idx) => (
            <motion.div key={cat._id} custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className={`flex flex-col gap-6 ${idx === 1 ? 'md:mt-24' : ''}`}>
              <Link href={`/shop?category=${encodeURIComponent(cat.slug)}`} className="group relative block w-full aspect-[3/4] bg-card overflow-hidden">
                {cat.image ? (
                  <img src={getImageUrl(cat.image)} alt={cat.name} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-[2s] scale-100 group-hover:scale-105" />
                ) : <div className="w-full h-full bg-card" />}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-700" />
              </Link>
              <div className="flex justify-between items-end border-b border-border pb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground">Vol. 0{idx + 1}</span>
                  <h3 className="text-2xl font-serif uppercase tracking-tight text-foreground">{cat.name}</h3>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
              </div>
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
  const rawText = content.text || "NOISE CANCELLATION · REDUCED TO ESSENTIALS · NO BRANDING · ONLY FORM · FREE GLOBAL SHIPPING OVER {{price}} · ";
  const text = rawText.replace('{{price}}', `₹${threshold.toLocaleString()}`).replace('₹{{price}}', `₹${threshold.toLocaleString()}`);

  return (
    <div className="w-full bg-foreground py-4 overflow-hidden flex whitespace-nowrap border-y border-border/30 uppercase relative z-30 opacity-90">
      <motion.div animate={{ x: [0, -1000] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="flex gap-16 items-center">
        {Array(10).fill(text).map((t, i) => (
          <span key={i} className="text-[10px] font-black uppercase tracking-[0.4em] text-background whitespace-nowrap">{t}</span>
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
    <motion.div custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={fadeUp} className="group flex flex-col gap-6 w-full">
      <Link href={`/shop/${product.slug}`} className="relative block w-full aspect-[3/4] overflow-hidden bg-card">
        {product.images?.[0] ? (
          <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover object-center grayscale-[0.1] hover:grayscale-0 transition-transform duration-[1.5s] ease-[0.22,1,0.36,1] group-hover:scale-105" />
        ) : <div className="w-full h-full bg-card" />}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out flex items-end justify-center pb-6">
          <span className="flex items-center gap-2 text-foreground text-[10px] font-black uppercase tracking-widest border-b border-foreground/30 hover:border-foreground pb-1">
            <ShoppingBag className="w-3.5 h-3.5" /> Acquire Unit
          </span>
        </div>
        {product.stock === 0 && (
          <div className="absolute top-0 right-0 bg-background px-4 py-2 border-l border-b border-border">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground">DEPLETED</span>
          </div>
        )}
      </Link>
      <div className="flex justify-between items-start pt-2 border-t border-border">
        <Link href={`/shop/${product.slug}`} className="text-xs font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors max-w-[70%] leading-relaxed">{product.name}</Link>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-light text-foreground tracking-widest">USD {product.price?.toLocaleString()}</span>
          {product.comparePrice > product.price && <span className="text-[10px] text-muted-foreground line-through">USD {product.comparePrice.toLocaleString()}</span>}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 6. ASYMMETRIC PRODUCT GRID 
 */
function ProductGridSection({ title, eyebrow, products, isLoading, viewAllLink }: { title: string, eyebrow: string, products: any[], isLoading: boolean, viewAllLink: string }) {
  if (!isLoading && (!products || products.length === 0)) return null;
  return (
    <section className="w-full py-32 bg-background">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">{eyebrow}</p>
            <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-5xl md:text-7xl font-serif tracking-tight uppercase leading-[0.9]">{title}</motion.h2>
          </div>
          <Link href={viewAllLink} className="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-foreground border-b border-foreground pb-2 hover:border-primary transition-colors w-fit">
            View Protocol <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 gap-y-20">
          {isLoading ? Array(4).fill(0).map((_, i) => (
            <div key={i} className={`flex flex-col gap-6 ${i % 2 !== 0 ? 'lg:mt-32' : ''}`}>
              <div className="aspect-[3/4] bg-card animate-pulse" />
              <div className="h-[1px] w-full bg-border" />
              <div className="h-4 w-2/3 bg-card animate-pulse" />
            </div>
          )) : products?.slice(0, 4).map((p: any, i: number) => (
            <div key={p._id} className={`${i % 2 !== 0 ? 'lg:mt-32' : ''}`}>
              <ProductCard product={p} idx={i} />
            </div>
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
    <section className="w-full py-32 bg-card">
      <div className="container mx-auto px-6">
        <div className="mb-24 flex flex-col gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Intercepted Signals</p>
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-5xl md:text-7xl font-serif tracking-tight uppercase">
            {content.sectionLabel || 'Field Reports'}
          </motion.h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {testimonials.map((t: any, idx: number) => (
            <motion.div key={t._id} custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex flex-col gap-8 group">
              <div className="w-full h-[1px] bg-border group-hover:bg-primary transition-colors duration-500" />
              <p className="text-foreground text-sm uppercase tracking-widest leading-loose flex-1">&quot;{t.review}&quot;</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-foreground">{t.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{t.designation || 'Classified'}</p>
                </div>
                <div className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground text-[10px] font-black">
                  {String(idx + 1).padStart(2, '0')}
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
    <section className="relative w-full py-40 md:py-64 overflow-hidden bg-background">
      <div className="relative container mx-auto px-6 text-center flex flex-col items-center gap-12 z-10">
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-5xl md:text-8xl lg:text-9xl font-serif tracking-tight uppercase leading-[0.8] mix-blend-difference">
          {content.heading || 'ABSOLUTE. FORM.'}
        </motion.h2>
        {content.subheading && (
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {content.subheading}
          </p>
        )}
        <Link href="/shop" className="mt-8 relative group inline-flex items-center justify-center px-12 py-5 liquid-neon-btn text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 hover:scale-105 active:scale-95">
          <span className="relative z-10 flex items-center gap-4">Initialize <ArrowRight className="w-4 h-4" /></span>
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
    <section className="w-full py-32 bg-card relative overflow-hidden border-t border-border">
      <div className="container mx-auto px-6 flex flex-col md:flex-row gap-16 md:items-end justify-between relative z-10">
        <div className="space-y-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Encrypted Network</p>
          <h2 className="text-4xl md:text-6xl font-serif tracking-tight uppercase leading-[0.9]">establish <br /> connection</h2>
        </div>
        <form className="flex flex-col sm:flex-row gap-0 sm:gap-6 items-end w-full max-w-xl">
          <div className="flex-1 w-full border-b border-border pb-2 group focus-within:border-primary transition-colors">
            <input type="email" placeholder="ENTER COMM LINK (EMAIL)" className="w-full bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-foreground placeholder-muted-foreground/30 focus:ring-0 px-0" />
          </div>
          <button className="mt-8 sm:mt-0 text-xs font-black uppercase tracking-[0.2em] text-foreground border-b border-foreground pb-2 hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
            Transmit
          </button>
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
  const sectionTypes = pageSections.map((s: any) => s.type);
  const hasHero = sectionTypes.includes('hero');
  const hasFeatures = sectionTypes.includes('features-bar');

  return (
    <div className="w-full flex flex-col bg-background text-foreground min-h-screen selection:bg-primary selection:text-white">
      {/* Resilient Core Layout */}
      {!hasHero && <HeroSection banner={banner} settings={settings} />}
      {!hasFeatures && <FeatureBar settings={settings} />}

      {pageSections.length > 0 ? (
        pageSections.map((section: any, idx: number) => {
          if (section.isVisible === false) return null;
          const key = `${section.type}-${idx}`;
          switch (section.type) {
            case 'hero': return hasHero ? <HeroSection key={key} banner={banner} settings={settings} content={section.content} /> : null;
            case 'features-bar': return hasFeatures ? <FeatureBar key={key} settings={settings} /> : null;
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
          <CategoryGridSection categories={allCategories} />
          <ProductGridSection title="new arrivals" eyebrow="just in" products={newArrivals || []} isLoading={newArrivalsLoading} viewAllLink="/shop" />
        </>
      )}
    </div>
  );
}
