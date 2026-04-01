'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCartStore } from '@/store/cartStore';
import { getImageUrl } from '@/lib/imageUrl';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Script from 'next/script';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Wallet,
  Tag,
  CheckCircle2,
  MapPin,
  ChevronRight,
  ShoppingBag,
  ArrowLeft,
  Lock,
  ChevronDown,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CheckoutStep = 'address' | 'summary' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items, getTotals, clearCart } = useCartStore();
  const { user, setAuth } = useAuthStore();
  const { itemsTotal } = getTotals();

  const { data: settings } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Flow State
  const [step, setStep] = useState<CheckoutStep>('address');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Multi-Address Logic
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number | null>(
    user?.addresses?.length > 0 ? 0 : null
  );
  const [showNewAddressForm, setShowNewAddressForm] = useState(user?.addresses?.length === 0);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  const shippingThreshold = settings?.shippingThreshold ?? 5000;
  const shippingCharge = settings?.shippingCharge ?? 150;
  const taxRate = settings?.taxRate ?? 18;

  const subtotal = itemsTotal;
  const shippingCost = subtotal > shippingThreshold ? 0 : shippingCharge;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const grandTotal = taxableAmount + taxAmount + shippingCost;

  useEffect(() => {
    if (!user) {
      toast.error('Verification Required');
      router.push('/account?tab=login&redirect=checkout');
    }
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [user, items.length, router]);

  const updateProfileOp = useMutation({
    mutationFn: async (data: any) => await api.put('/auth/me', data),
    onSuccess: (res) => {
      setAuth({ ...user, ...res.data });
      setSelectedAddressIdx((res.data.addresses?.length || 1) - 1);
      setShowNewAddressForm(false);
      toast.success('Address Synchronized');
    }
  });

  const validateCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', { code: couponCode, subtotal });
      setAppliedCoupon(data);
      toast.success(`Coupon ${data.code} applied: ₹${data.discountAmount} off`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid Coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const currentAddress = useMemo(() => {
    if (selectedAddressIdx !== null && user?.addresses) {
      return user.addresses[selectedAddressIdx];
    }
    return null;
  }, [selectedAddressIdx, user?.addresses]);

  const handleFinalPurchase = async () => {
    if (!currentAddress) return toast.error('Please select a delivery address');
    setLoading(true);

    const commonPayload = {
      items: items.map(i => ({
        product: i.product._id,
        name: i.name,
        image: i.image,
        size: i.size,
        color: i.color,
        qty: i.qty,
        price: i.price
      })),
      shippingAddress: currentAddress,
      itemsTotal: subtotal,
      shippingCost,
      total: grandTotal,
      couponCode: appliedCoupon?.code,
      discountAmount,
    };

    try {
      if (paymentMethod === 'cod') {
        await api.post('/orders/place-cod-order', commonPayload);
        clearCart();
        toast.success('Order placed successfully (Cash on Delivery)');
        router.push('/account?tab=orders');
      } else {
        const { data: { orderId, amount, currency } } = await api.post('/orders/create-razorpay-order', {
          amount: grandTotal,
          items: items.map(i => ({ product: i.product._id, qty: i.qty, size: i.size, color: i.color, name: i.name }))
        });

        const options = {
          key: settings?.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount,
          currency,
          name: 'Kora Apparel',
          order_id: orderId,
          handler: async function (response: any) {
            try {
              await api.post('/orders/verify-payment', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderData: { ...commonPayload, paymentMethod: 'razorpay' }
              });
              clearCart();
              toast.success('Payment Verified. Order Success.');
              router.push('/account?tab=orders');
            } catch (err: any) {
              toast.error('Payment verification failed.');
            }
          },
          prefill: { name: currentAddress.name, contact: currentAddress.phone },
          theme: { color: '#000000' }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!user || items.length === 0) return null;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="container mx-auto px-6 max-w-7xl pt-40 pb-40">

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-20 gap-4 border-b border-border pb-4">
          {[
            { id: 'address', label: 'ADDRESS' },
            { id: 'summary', label: 'SUMMARY' },
            { id: 'payment', label: 'PAYMENT' }
          ].map((s, i) => (
            <div key={s.id} className="flex flex-col md:flex-row md:items-center gap-2">
              <span className={cn(
                "text-[10px] font-black tracking-[0.3em] uppercase transition-colors",
                step === s.id ? "text-primary" : "text-muted-foreground opacity-50"
              )}>0{i + 1} // {s.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-16">

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {step === 'address' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                  <div className="flex justify-between items-center border-b border-border pb-6">
                    <h2 className="text-2xl font-serif font-bold">Shipping Destination</h2>
                    <Button
                      variant="link"
                      onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                      className="text-xs font-bold text-primary"
                    >
                      {showNewAddressForm ? 'Select Existing' : '+ Add New Address'}
                    </Button>
                  </div>

                  {!showNewAddressForm ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {user.addresses?.map((addr: any, i: number) => (
                        <div
                          key={i}
                          onClick={() => setSelectedAddressIdx(i)}
                          className={cn(
                            "p-6 border cursor-pointer transition-all relative group",
                            selectedAddressIdx === i ? "border-primary bg-primary/5" : "border-border hover:border-foreground/50"
                          )}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-muted/50 border",
                              selectedAddressIdx === i && "border-primary/20"
                            )}>
                              {addr.label}
                            </span>
                            {selectedAddressIdx === i && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-sm font-bold uppercase truncate tracking-widest">{addr.line1}</p>
                          <div className="text-[11px] text-muted-foreground mt-2 leading-relaxed uppercase tracking-wider">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </div>
                          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                            <Phone className="w-3 h-3 opacity-50" />
                            <span>{addr.phone}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-border p-8 space-y-8 bg-background">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 flex gap-4 border-b border-border pb-4">
                          {['Home', 'Work', 'Other'].map(l => (
                            <button
                              key={l}
                              onClick={() => setNewAddress({ ...newAddress, label: l })}
                              className={cn(
                                "text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                newAddress.label === l ? "text-primary" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                        <input placeholder="OPERATIVE DESIGNATION (FULL NAME) *" value={newAddress.line1} onChange={e => setNewAddress({ ...newAddress, line1: e.target.value })} className="w-full h-12 bg-transparent border-b border-border text-xs uppercase font-black tracking-widest text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 transition-colors rounded-none" />
                        <input placeholder="STREET / AREA *" value={newAddress.line2} onChange={e => setNewAddress({ ...newAddress, line2: e.target.value })} className="w-full h-12 bg-transparent border-b border-border text-xs uppercase font-black tracking-widest text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 transition-colors rounded-none" />
                        <input placeholder="CITY *" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full h-12 bg-transparent border-b border-border text-xs uppercase font-black tracking-widest text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 transition-colors rounded-none" />
                        <input placeholder="STATE *" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className="w-full h-12 bg-transparent border-b border-border text-xs uppercase font-black tracking-widest text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 transition-colors rounded-none" />
                        <input placeholder="PINCODE *" value={newAddress.pincode} onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })} className="w-full h-12 bg-transparent border-b border-border text-xs uppercase font-black tracking-widest text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 transition-colors rounded-none" />
                        <input placeholder="SECURE COMM LOOP (PHONE) *" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} className="w-full h-12 bg-transparent border-b border-border text-xs uppercase font-black tracking-widest text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 transition-colors rounded-none" />
                      </div>
                      <Button
                        onClick={() => {
                          if (!newAddress.line1 || !newAddress.city || !newAddress.pincode) return toast.error('Required fields missing');
                          updateProfileOp.mutate({ addresses: [...(user.addresses || []), newAddress] });
                        }}
                        className="w-full h-14 rounded-none font-black uppercase tracking-[0.2em] text-[10px] bg-foreground text-background hover:bg-primary transition-colors mt-8"
                      >
                        Commit Address Record
                      </Button>
                    </div>
                  )}

                  {!showNewAddressForm && (
                    <div className="pt-8 flex justify-end gap-2">
                      <Button
                        disabled={selectedAddressIdx === null}
                        onClick={() => setStep('summary')}
                        className="w-full lg:w-auto h-12 px-8 rounded-none font-black uppercase tracking-[0.2em] text-[10px] bg-foreground text-background hover:bg-primary transition-colors group"
                      >
                        Proceed <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 'summary' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                  <button onClick={() => setStep('address')} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4" /> Change Address
                  </button>

                  <div className="space-y-8">
                    <h2 className="text-2xl font-serif font-bold">Item Summary</h2>
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-6 p-4 bg-muted/10 border border-border rounded-xl items-center">
                          <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-muted border border-border">
                            <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-bold uppercase tracking-tight">{item.name}</h3>
                            <p className="text-[11px] text-muted-foreground font-medium mt-1">
                              {item.size} / {item.color} • Qty: {item.qty}
                            </p>
                            <p className="text-sm font-bold mt-2">₹{item.price * item.qty}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 flex justify-end gap-2">
                    <Button
                      onClick={() => setStep('payment')}
                      className="w-full lg:w-auto h-12 px-8 rounded-none font-black uppercase tracking-[0.2em] text-[10px] bg-foreground text-background hover:bg-primary transition-colors group"
                    >
                      Authenticate Settlement <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                  <button onClick={() => setStep('summary')} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4" /> Edit Summary
                  </button>

                  <div className="space-y-8">
                    <h2 className="text-2xl font-serif font-bold">Secure Settlement</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button
                        onClick={() => setPaymentMethod('razorpay')}
                        className={cn(
                          "flex flex-col p-6 border text-left transition-all relative group",
                          paymentMethod === 'razorpay' ? "border-primary bg-primary/5" : "border-border hover:border-foreground/50"
                        )}
                      >
                        <div className="flex justify-between items-start mb-6 w-full">
                          <CreditCard className={cn("w-5 h-5", paymentMethod === 'razorpay' ? "text-primary" : "text-muted-foreground")} />
                          {paymentMethod === 'razorpay' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">UPI / Card Route</span>
                      </button>

                      {settings?.isCodEnabled && (
                        <button
                          onClick={() => setPaymentMethod('cod')}
                          className={cn(
                            "flex flex-col p-6 border text-left transition-all relative group",
                            paymentMethod === 'cod' ? "border-primary bg-primary/5" : "border-border hover:border-foreground/50"
                          )}
                        >
                          <div className="flex justify-between items-start mb-6 w-full">
                            <Wallet className={cn("w-5 h-5", paymentMethod === 'cod' ? "text-primary" : "text-muted-foreground")} />
                            {paymentMethod === 'cod' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Physical Exchange</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-muted/5 border border-dashed border-border rounded-2xl flex items-center gap-4">
                    <Lock className="w-5 h-5 text-muted-foreground opacity-50" />
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Global standard encryption secured. PCI-DSS compliant infrastructure.</p>
                  </div>

                  <div className="pt-8 flex justify-end">
                    <Button
                      disabled={loading}
                      onClick={handleFinalPurchase}
                      className="w-full lg:w-auto h-14 px-12 rounded-none font-black uppercase tracking-[0.2em] text-[10px] bg-foreground text-background hover:bg-primary transition-colors hover:scale-105"
                    >
                      {loading ? 'Processing...' : 'Authorize Transaction'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Checkout Info Sidebar */}
          <div className="lg:w-96">
            <div className="sticky top-28 space-y-6">

              <div className="border border-border bg-background">
                <div className="p-8 space-y-8">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    <span>Transmission Summary</span>
                    <ShoppingBag className="w-4 h-4 opacity-50 text-primary" />
                  </div>

                  {/* Coupon UI */}
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input
                        placeholder="OVERRIDE CYPHER"
                        className="w-full h-12 bg-transparent border-b border-border text-[10px] uppercase font-black tracking-[0.2em] text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 transition-colors"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      />
                      <Button
                        variant="outline"
                        onClick={validateCoupon}
                        disabled={couponLoading || !couponCode}
                        className="h-12 border-border text-[10px] font-black tracking-[0.2em] uppercase cursor-pointer rounded-none hover:bg-primary hover:text-white transition-colors"
                      >
                        Apply
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary italic font-serif">{appliedCoupon.code} ACTIVE</span>
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-[10px] font-bold text-destructive hover:underline">Remove</button>
                    </div>
                  )}

                  <div className="space-y-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span>Value Escrow</span>
                      <span className="text-foreground">₹{subtotal}</span>
                    </div>
                    {discountAmount > 0 && (
                       <div className="flex justify-between text-primary border-b border-border/50 pb-2">
                        <span>Cypher Bypass</span>
                        <span>- ₹{discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span>State Tribute (GST {taxRate}%)</span>
                      <span className="text-foreground">₹{taxAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Logistics Fee</span>
                      <span className={cn(shippingCost === 0 ? "text-primary" : "text-foreground")}>{shippingCost === 0 ? "WAIVED" : `₹${shippingCost}`}</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-muted/5 flex flex-col items-start border-t border-border">
                  <div className="w-full flex justify-between items-end">
                     <div>
                       <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Net Settlement</p>
                       <h4 className="text-4xl font-serif font-bold tracking-tight">₹{grandTotal}</h4>
                     </div>
                     <ShieldCheck className="w-6 h-6 text-foreground opacity-50 mb-2" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 px-6 opacity-40">
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Contactless Dispatch Available</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Secure Data Vault Encryption</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
