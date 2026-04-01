'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { getImageUrl } from '@/lib/imageUrl';
import { ImageMagnifier } from '@/components/ui/ImageMagnifier';
import { useParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Minus, Plus, ShoppingBag, ShieldCheck, Truck, RefreshCcw, Star, MessageSquare } from 'lucide-react';
import { WishlistButton } from '@/components/ui/WishlistButton';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';

const fetchProduct = async (slug: string) => {
  const { data } = await api.get(`/products/${slug}`);
  return data;
};

export default function ProductPage() {
  const { slug } = useParams();
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: product, isLoading: productLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProduct(slug as string),
    enabled: !!slug,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    }
  });

  const isLoading = productLoading || settingsLoading;

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: reviews } = useQuery({
    queryKey: ['reviews', product?._id],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/${product._id}`);
      return data;
    },
    enabled: !!product?._id,
  });

  const submitReview = useMutation({
    mutationFn: async () => api.post('/reviews', { product: product._id, rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', product._id] });
      toast.success('Review submitted successfully! It will appear once approved by an admin.');
      setRating(5);
      setComment('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  });

  if (isLoading) {
    return (
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
        <Skeleton className="w-full h-[50vh] lg:h-screen rounded-none bg-card" />
        <div className="flex flex-col justify-center px-8 lg:px-24 py-20 gap-8">
          <Skeleton className="w-1/4 h-4 bg-card rounded-none" />
          <Skeleton className="w-3/4 h-16 bg-card rounded-none" />
          <Skeleton className="w-1/3 h-8 bg-card rounded-none" />
          <div className="h-[1px] w-full bg-border my-8" />
          <Skeleton className="w-full h-32 bg-card rounded-none" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-background text-center px-6">
        <div className="flex flex-col gap-6 max-w-md">
          <h1 className="text-4xl font-serif uppercase tracking-tight">Signal Lost</h1>
          <p className="text-xs uppercase font-black tracking-[0.2em] text-muted-foreground leading-relaxed">The requested unit could not be located in the current archive. Return to the index.</p>
          <Link href="/shop" className="text-xs font-black uppercase tracking-[0.2em] text-foreground border-b border-foreground pb-2 hover:border-primary transition-colors w-fit mx-auto mt-4">Browse Index</Link>
        </div>
      </div>
    );
  }

  const selectedVariant = product.variants?.find((v: any) => v.size === selectedSize && v.color === selectedColor);
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      return toast.error('Please select a size');
    }
    if (product.colors?.length > 0 && !selectedColor) {
      return toast.error('Please select a color');
    }
    if (currentStock < qty) {
      return toast.error('Not enough stock available');
    }

    addItem({
      product,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      size: selectedSize,
      color: selectedColor,
      qty,
    });

    toast.success('Added to cart', {
      description: `${qty}x ${product.name}`,
    });
  };

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* IMAGE GALLERY - LEFT SPLIT */}
        <div className="lg:sticky lg:top-0 w-full h-[60vh] lg:h-screen flex items-center justify-center bg-card relative overflow-hidden group">
          <div className="absolute top-6 left-6 z-20 flex flex-col gap-4">
            {product.images?.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`relative w-12 aspect-[3/4] overflow-hidden transition-all duration-500 rounded-none border border-border/50 ${activeImage === idx ? 'opacity-100 scale-100 border-primary' : 'opacity-40 hover:opacity-100'
                  }`}
              >
                <img src={getImageUrl(img)} alt={`${product.name} ${idx}`} className="w-full h-full object-cover grayscale-[0.2]" />
              </button>
            ))}
          </div>

          <div className="absolute top-6 right-6 z-20">
            <WishlistButton product={product} />
          </div>

          <div className="w-full h-full">
            {product.images?.[activeImage] ? (
              <ImageMagnifier
                src={getImageUrl(product.images[activeImage])}
                alt={product.name}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-black text-xs uppercase tracking-[0.3em]">No Image Logged</div>
            )}
          </div>
        </div>

        {/* DETAILS - RIGHT SPLIT */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } }
          }}
          className="flex flex-col justify-center px-8 py-20 lg:px-24 min-h-screen border-l border-border"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex justify-between items-start mb-6">
            <p className="uppercase tracking-[0.3em] font-black text-[10px] text-muted-foreground">Class: {product.category}</p>
            {product.stock <= 0 && (
              <span className="text-[10px] uppercase font-black tracking-[0.3em] text-destructive bg-destructive/10 px-3 py-1">Depleted</span>
            )}
          </motion.div>
          
          <motion.h1 variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="text-5xl lg:text-7xl font-serif tracking-tight uppercase mb-8 text-foreground leading-[0.9]">
            {product.name}
          </motion.h1>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex items-center gap-6 mb-12">
            <span className="text-xl font-light tracking-widest uppercase">USD {product.price}</span>
            {product.comparePrice && (
              <span className="text-sm text-muted-foreground/40 line-through tracking-widest uppercase">USD {product.comparePrice}</span>
            )}
          </motion.div>

          <motion.p variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="text-muted-foreground font-light leading-loose text-sm uppercase tracking-widest mb-12 max-w-xl">
            {product.description}
          </motion.p>

          <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="h-[1px] w-full bg-border mb-12"></motion.div>

          {/* COLORS */}
          {product.colors?.length > 0 && (
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="mb-12">
              <div className="flex justify-between items-center mb-6 text-[10px] uppercase tracking-[0.3em] font-black">
                <span className="text-muted-foreground">Spectrum</span>
                <span className="text-foreground">{selectedColor || 'Pending'}</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {product.colors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-6 py-3 text-[10px] uppercase font-black tracking-[0.2em] transition-all duration-300 rounded-none border-b-2 ${selectedColor === color
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-border text-foreground hover:border-foreground bg-transparent'
                      }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* SIZES */}
          {product.sizes?.length > 0 && (
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="mb-16">
              <div className="flex justify-between items-center mb-6 text-[10px] uppercase tracking-[0.3em] font-black">
                <span className="text-muted-foreground">Dimensions</span>
                <button className="text-foreground hover:text-primary transition-colors border-b border-foreground pb-0.5">Parameters</button>
              </div>
              <div className="flex flex-wrap gap-4">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-14 h-14 flex items-center justify-center text-xs uppercase font-black tracking-widest transition-all duration-300 rounded-none border ${selectedSize === size
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-border text-foreground hover:border-foreground bg-transparent'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ACTIONS */}
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex gap-6 mb-16">
            <div className="flex items-center border border-border bg-transparent rounded-none">
              <button
                className="w-12 h-14 flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-xs font-black tracking-widest uppercase">{qty}</span>
              <button
                className="w-12 h-14 flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                disabled={qty >= product.stock}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <Button
              size="lg"
              className="flex-1 h-14 rounded-none text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-50 !liquid-neon-btn text-background border-none transition-all duration-500 shadow-xl"
              onClick={handleAddToCart}
              disabled={isOutOfStock && (!!selectedSize || !!selectedColor || !product.variants?.length)}
            >
              <ShoppingBag className="w-4 h-4 mr-3" />
              {isOutOfStock && (!!selectedSize || !!selectedColor || !product.variants?.length) ? 'Stock Depleted' : 'Acquire Unit'}
            </Button>
          </motion.div>

          {/* PROMISES */}
          <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-10 border-t border-border mt-auto">
            <div className="flex flex-col gap-3 group">
              <ShieldCheck className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[9px] uppercase font-black tracking-[0.2em] text-foreground">Aura Certified</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Architectural Grade</span>
            </div>
            <div className="flex flex-col gap-3 group">
              <Truck className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[9px] uppercase font-black tracking-[0.2em] text-foreground">Global Freight</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{settings?.deliveryPolicy || 'Complimentary'}</span>
            </div>
            <div className="flex flex-col gap-3 group">
              <RefreshCcw className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[9px] uppercase font-black tracking-[0.2em] text-foreground">Recall Protocol</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{settings?.returnPolicy || '14 Day window'}</span>
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* REVIEWS SECTION */}
      <div className="w-full bg-card border-t border-border py-32 px-6 lg:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          
          <div className="lg:col-span-4">
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground mb-4">Transmission Logs</p>
            <h2 className="text-5xl font-serif tracking-tight uppercase leading-[0.9] mb-12">Field <br/> Reports</h2>
            <div className="h-[1px] w-full bg-border mb-12" />

            {/* Review Form */}
            <div className="flex flex-col gap-8">
              <h3 className="text-xs uppercase font-black tracking-[0.2em] text-foreground">Log New Data</h3>
              {user ? (
                <div className="flex flex-col gap-8">
                  <div>
                    <label className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground mb-4 block">Satisfaction Level</label>
                    <div className="flex gap-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                          <Star className={`w-6 h-6 ${rating >= star ? 'fill-primary text-primary' : 'text-border'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground mb-4 block">Operation Notes</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-background border border-border p-6 min-h-[160px] rounded-none focus:outline-none focus:border-primary transition-colors text-xs uppercase tracking-widest text-foreground outline-none resize-none"
                      placeholder="ENTER DATA..."
                    />
                  </div>
                  <Button
                    onClick={() => submitReview.mutate()}
                    disabled={!comment.trim() || submitReview.isPending}
                    className="w-full h-14 rounded-none text-[10px] font-black uppercase tracking-[0.2em] bg-foreground text-background hover:bg-primary transition-colors"
                  >
                    {submitReview.isPending ? 'Syncing...' : 'Transmit Report'}
                  </Button>
                </div>
              ) : (
                <div className="text-left py-12 px-8 bg-background border border-border">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-8">Access Denied. Credentials Required.</p>
                  <Link href="/account?tab=login" className="text-xs font-black uppercase tracking-[0.2em] text-foreground border-b border-foreground pb-2 hover:border-primary transition-colors">Authenticate</Link>
                </div>
              )}
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-8 flex flex-col gap-12 lg:pl-12">
             <div className="h-[1px] w-full bg-border md:hidden mb-4" />
            {reviews?.length > 0 ? (
              reviews.map((review: any) => (
                <div key={review._id} className="pb-12 border-b border-border last:border-0 flex flex-col gap-6 group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
                    <div className="flex items-center gap-6">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-3 h-3 ${review.rating >= star ? 'fill-primary text-primary' : 'text-border'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground group-hover:text-primary transition-colors">{review.user?.name || 'Operative'}</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-[0.3em] font-black text-muted-foreground">T-{new Date(review.createdAt).getTime()}</span>
                  </div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground leading-loose">{review.comment}</p>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center min-h-[40vh] border border-border">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center px-6">Zero transmission logs found in database.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
