'use client';

import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSearchParams } from 'next/navigation';
import { getImageUrl } from '@/lib/imageUrl';
import { WishlistButton } from '@/components/ui/WishlistButton';
import { motion } from 'framer-motion';

const fetchProducts = async ({ pageParam = 1, queryKey }: any) => {
  const [_key, filters] = queryKey;
  const { category, sort } = filters;
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (sort) params.append('sort', sort);
  params.append('page', pageParam.toString());
  params.append('limit', '8');
  const { data } = await api.get(`/products?${params.toString()}`);
  return data;
};

import { Suspense } from 'react';

function ShopContent() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('newest');

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['products', { category, sort }],
    queryFn: fetchProducts,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) return lastPage.page + 1;
      return undefined;
    }
  });

  const products = data?.pages.flatMap(page => page.products) || [];
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fetch dynamic categories from API (only show-in-shop ones)
  const { data: rawCategories = [] } = useQuery({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.filter((c: any) => c.showInShop);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Prepend "All" option with empty slug
  const categories: { name: string; slug: string }[] = [
    { name: 'All', slug: '' },
    ...rawCategories,
  ];

  const sortOptions = [
    { label: 'Newest Arrivals', value: 'newest' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Most Popular', value: 'popular' },
  ];

  return (
    <div className="pt-40 pb-32 bg-background min-h-screen">
      <div className="container mx-auto px-6 max-w-7xl">

        {/* HEADER & FILTERS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-24 pb-8 border-b border-border">
          <div className="flex flex-col gap-4">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-muted-foreground text-[10px] uppercase font-black tracking-[0.3em]"
            >
              Archive / {products?.length || 0} Units
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-serif tracking-tight uppercase leading-[0.9] text-foreground"
            >
              The Collection
            </motion.h1>
          </div>

          <div className="flex items-center gap-6 mt-8 md:mt-0">
            {/* Mobile Filters */}
            <Sheet>
              <SheetTrigger className="md:hidden flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] border-b border-foreground pb-1 hover:text-primary transition-colors">
                <SlidersHorizontal className="w-4 h-4" /> Parameters
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-card border-r border-border overflow-y-auto pt-24">
                <SheetHeader>
                  <SheetTitle className="text-left font-serif text-4xl uppercase tracking-tight mb-12">Index</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-8">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">Divisions</h4>
                    <div className="flex flex-col gap-5">
                      {categories.map((cat) => (
                        <button
                          key={cat.slug}
                          onClick={() => setCategory(cat.slug)}
                          className={`text-left text-xs uppercase tracking-widest font-black transition-colors ${category === cat.slug ? 'text-primary' : 'text-foreground hover:text-primary'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Categories */}
            <div className="hidden md:flex items-center gap-6 mr-8 border-r border-border pr-8 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setCategory(cat.slug)}
                  className={`text-[10px] uppercase font-black tracking-[0.2em] transition-all hover:text-primary whitespace-nowrap ${category === cat.slug
                    ? 'text-primary scale-105'
                    : 'text-muted-foreground'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 text-[10px] uppercase font-black tracking-[0.2em] text-foreground hover:text-primary transition-colors outline-none cursor-pointer border-b border-foreground pb-1 hover:border-primary">
                Sort: {sortOptions.find(o => o.value === sort)?.label.split(':')[0]} <ChevronDown className="w-4 h-4 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border rounded-none shadow-2xl w-56 mt-4 p-2">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    className={`cursor-pointer hover:bg-muted text-xs font-black uppercase tracking-widest px-4 py-3 text-foreground ${sort === option.value ? 'bg-primary/10 text-primary' : ''}`}
                    onClick={() => setSort(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-6 w-full">
                <Skeleton className="w-full aspect-[3/4] bg-card rounded-none" />
                <div className="h-[1px] w-full bg-border" />
                <Skeleton className="w-2/3 h-4 bg-card rounded-none" />
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center border-y border-border">
            <h3 className="text-4xl font-serif uppercase tracking-tight text-foreground mb-6">No Records Found</h3>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground w-full max-w-md mx-auto leading-relaxed">
              The requested parameters yielded zero units. Alter your query to continue.
            </p>
            <button className="mt-12 text-xs font-black uppercase tracking-[0.2em] text-foreground border-b border-foreground pb-2 hover:border-primary hover:text-primary transition-colors" onClick={() => setCategory('')}>
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-20"
            >
              {products?.map((product: any, i: number) => (
                <motion.div
                  key={product._id}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] } }
                  }}
                  className={`group flex flex-col gap-6 w-full ${i % 2 !== 0 ? 'lg:mt-32' : ''}`}
                >
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-card">
                    <div className="absolute top-4 right-4 z-20">
                      <WishlistButton product={product} />
                    </div>
                    
                    <Link href={`/shop/${product.slug}`} className="block w-full h-full relative">
                      {product.images?.[0] ? (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover object-center grayscale-[0.1] hover:grayscale-0 group-hover:scale-105 transition-transform duration-[1.5s] ease-[0.21,0.47,0.32,0.98]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] font-black tracking-[0.3em] uppercase">No Record</div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out flex items-end justify-center pb-6">
                        <span className="flex items-center gap-2 text-foreground text-[10px] font-black uppercase tracking-widest border-b border-foreground/30 hover:border-foreground pb-1">
                          <ShoppingBag className="w-3 h-3" /> Acquire Unit
                        </span>
                      </div>

                      {product.stock === 0 && (
                        <div className="absolute top-0 right-0 bg-background px-4 py-2 border-l border-b border-border z-10">
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground">DEPLETED</span>
                        </div>
                      )}
                    </Link>
                  </div>

                  <div className="flex justify-between items-start pt-2 border-t border-border">
                    <Link href={`/shop/${product.slug}`} className="text-xs font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors max-w-[70%] leading-relaxed">{product.name}</Link>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-light text-foreground tracking-widest">USD {product.price.toLocaleString()}</span>
                      {product.comparePrice > product.price && <span className="text-[10px] text-muted-foreground line-through">USD {product.comparePrice.toLocaleString()}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="w-full h-24 flex items-center justify-center mt-12">
              {isFetchingNextPage && (
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing...</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center animate-pulse"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div></div>}>
      <ShopContent />
    </Suspense>
  );
}
