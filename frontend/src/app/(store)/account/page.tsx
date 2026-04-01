'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import {
  User as UserIcon,
  MapPin,
  Heart,
  ShoppingBag,
  Lock,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Mail,
  Phone,
  Package,
  X,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function OrderDetailView({ id, onCancel, isCancelling }: { id: string, onCancel: () => void, isCancelling: boolean }) {
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data;
    },
    enabled: !!id
  });

  if (isLoading) return <div className="p-20 text-center animate-pulse text-sm font-medium text-muted-foreground">LOADING ORDER DATA...</div>;
  if (!order) return <div className="p-20 text-center text-sm font-medium text-destructive">ORDER NOT FOUND</div>;

  return (
    <div className="p-8 md:p-12 max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold mb-2">Order Details</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>ID: #{order._id.slice(-8).toUpperCase()}</span>
            <span className="w-1 h-1 rounded-full bg-border"></span>
            <span>Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className={cn(
          "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
          order.status === 'cancelled' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'
        )}>
          {order.status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-10">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6">Items in Order</h3>
            <div className="space-y-4">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex gap-4 items-center bg-muted/20 p-4 rounded-xl border border-border/50">
                  <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-background border border-border">
                    {item.product?.images?.[0] && <img src={getImageUrl(item.product.images[0])} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold truncate line-clamp-1">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1">{item.size} / {item.color} • x{item.qty}</p>
                  </div>
                  <p className="text-sm font-bold">₹{item.price * item.qty}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/5 border border-border rounded-xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Pricing Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items Total</span>
                <span className="font-medium">₹{order.itemsTotal || order.total}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Incentive Discount</span>
                  <span>- ₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping Protocol</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border mt-3 text-lg font-bold">
                <span className="font-serif">Grand Total</span>
                <span>₹{order.total}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-8">Order Status</h3>
            <div className="space-y-8 relative ml-2">
              <div className="absolute left-0 top-2 bottom-2 w-px bg-border"></div>
              {order.status === 'cancelled' ? (
                <div className="flex gap-4 relative">
                  <div className="w-2.5 h-2.5 rounded-full z-10 -ml-[5px] mt-1 bg-destructive"></div>
                  <div>
                    <p className="text-xs font-bold text-destructive uppercase tracking-wider">Protocol Terminated</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Order cancelled and inventory restored.</p>
                  </div>
                </div>
              ) : (
                [
                  { label: 'Validated', date: order.createdAt, active: true, icon: CheckCircle },
                  { label: 'Settlement Secured', active: order.isPaid || order.paymentMethod === 'cod', icon: CreditCard },
                  { label: 'Dispatched', active: ['shipped', 'delivered'].includes(order.status), icon: Truck },
                  { label: 'Delivered', active: order.status === 'delivered', icon: Package }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full z-10 -ml-[5px] mt-1.5 transition-all shadow-sm",
                      step.active ? "bg-primary" : "bg-muted"
                    )}></div>
                    <div>
                      <p className={cn(
                        "text-xs font-bold transition-colors",
                        step.active ? "text-foreground" : "text-muted-foreground/40"
                      )}>{step.label}</p>
                      {step.date && <p className="text-[10px] text-muted-foreground mt-1">{new Date(step.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Destination</h4>
            <p className="text-sm font-bold">{order.shippingAddress?.name}</p>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {order.shippingAddress?.line1}<br />
              {order.shippingAddress?.line2 && <>{order.shippingAddress?.line2}<br /></>}
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </p>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Phone Link</span>
              <span className="text-xs font-bold">{order.shippingAddress?.phone}</span>
            </div>
          </div>

          {['pending', 'processing'].includes(order.status) ? (
            <Button
              onClick={onCancel}
              disabled={isCancelling}
              variant="outline"
              className="w-full h-12 rounded-full font-bold text-xs uppercase tracking-widest border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all"
            >
              {isCancelling ? 'Processing...' : 'Cancel Order'}
            </Button>
          ) : order.status === 'cancelled' ? (
            <div className="w-full h-12 flex items-center justify-center rounded-full font-bold text-[10px] uppercase tracking-[0.2em] bg-destructive/10 text-destructive border border-destructive/20">
              Order Cancelled
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const initTab = searchParams?.get('tab') || 'login';
  const redirect = searchParams?.get('redirect') || '';

  const { user, setAuth, logout } = useAuthStore();
  const { items: localCart, setCart, addItem } = useCartStore();
  const { setWishlist } = useWishlistStore();

  const [activeTab, setActiveTab] = useState(initTab);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [authAction, setAuthAction] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (user && activeTab === 'login') {
      setActiveTab('orders');
    }
  }, [user, activeTab]);
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState('all');

  // Queries
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'my'],
    queryFn: async () => {
      const { data } = await api.get('/orders/my');
      console.log('[DEBUG] Account Page Orders:', data);
      return data;
    },
    enabled: !!user,
  });

  const { data: wishlist, isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me/wishlist');
      return data.wishlist;
    },
    enabled: !!user,
  });

  const filteredOrders = useMemo(() => {
    if (!ordersData?.orders) return [];
    const ordersArray = ordersData.orders;
    if (orderFilter === 'all') return ordersArray;
    return ordersArray.filter((o: any) => o.status === orderFilter);
  }, [ordersData, orderFilter]);

  // Mutations
  const updateProfileOp = useMutation({
    mutationFn: async (data: any) => await api.put('/auth/me', data),
    onSuccess: (res) => {
      setAuth({ ...user, ...res.data });
      toast.success('Profile synced successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed')
  });

  const cancelOrderOp = useMutation({
    mutationFn: async (id: string) => await api.put(`/orders/${id}/cancel`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Order cancelled');
    }
  });

  useEffect(() => {
    if (wishlist) {
      setWishlist(wishlist);
    }
  }, [wishlist, setWishlist]);

  const toggleWishlistOp = useMutation({
    mutationFn: async (productId: string) => await api.put('/auth/me/wishlist', { productId }),
    onSuccess: (res) => {
      queryClient.setQueryData(['wishlist'], res.data.wishlist);
      setWishlist(res.data.wishlist); // Sync with Shop Heart icons
      toast.success('Collection updated');
    }
  });

  // Auth Functions
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return toast.error('Enter your email');
    if (authAction === 'register' && !name) return toast.error('Enter your full name');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email, name: authAction === 'register' ? name : undefined, action: authAction });
      setShowOtpInput(true);
      toast.success('Verification code transmitted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transmission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp, localCart });
      setAuth({ _id: data._id, name: data.name, email: data.email, role: data.role });
      if (data.cart) setCart(data.cart);
      toast.success('Access Granted');
      if (redirect) router.push(`/${redirect}`);
      else setActiveTab('orders');
    } catch (err: any) {
      toast.error('Invalid Verification Code');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Logged out successfully');
  };

  // Address Logic
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressIdx, setEditingAddressIdx] = useState<number | null>(null);
  const [addressData, setAddressData] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });

  const handleSaveAddress = () => {
    let newAddresses = [...(user?.addresses || [])];
    if (editingAddressIdx !== null) {
      newAddresses[editingAddressIdx] = addressData;
    } else {
      newAddresses.push(addressData);
    }
    updateProfileOp.mutate({ addresses: newAddresses });
    setShowAddressForm(false);
    setEditingAddressIdx(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-40 pb-32 flex flex-col items-center justify-center px-6 bg-background">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-serif uppercase tracking-tight mb-4">Identity</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground">Access your restricted protocols</p>
          </div>

          <div className="space-y-8">
            {!showOtpInput ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-8">
                <div className="flex gap-4 mb-6 border-b border-border pb-4">
                  <button
                    type="button"
                    onClick={() => setAuthAction('login')}
                    className={cn(
                      "flex-1 text-[10px] uppercase tracking-[0.3em] font-black transition-all pb-2 text-left border-b",
                      authAction === 'login' ? "text-foreground border-primary" : "text-muted-foreground/40 border-transparent hover:text-foreground"
                    )}
                  >
                    Authenticate
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthAction('register')}
                    className={cn(
                      "flex-1 text-[10px] uppercase tracking-[0.3em] font-black transition-all pb-2 text-right border-b",
                      authAction === 'register' ? "text-foreground border-primary" : "text-muted-foreground/40 border-transparent hover:text-foreground"
                    )}
                  >
                    Establish
                  </button>
                </div>

                <AnimatePresence mode="popLayout">
                  {authAction === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <input
                        placeholder="OPERATIVE DESIGNATION (FULL NAME)"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full h-12 bg-transparent border-b border-foreground/30 text-xs uppercase font-black tracking-widest text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/70 transition-colors"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <input
                    placeholder="TRANSMISSION CABLE (EMAIL)"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-12 bg-transparent border-b border-foreground/30 text-xs uppercase font-black tracking-widest text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/70 transition-colors"
                  />
                </div>
                
                <Button type="submit" disabled={loading} className="w-full h-14 rounded-none font-black uppercase tracking-[0.2em] text-[10px] mt-8 bg-foreground text-background hover:bg-primary transition-colors">
                  {loading ? 'Processing...' : authAction === 'login' ? 'Initiate Link' : 'Register Signature'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-8">
                <div className="space-y-4">
                  <input
                    placeholder="ENTER 6-DIGIT CYPHER"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="w-full h-16 bg-transparent border-b border-foreground/30 text-center text-xl uppercase font-black tracking-[0.5em] text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 transition-colors"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-14 rounded-none font-black uppercase tracking-[0.2em] text-[10px] bg-foreground text-background hover:bg-primary transition-colors">
                  {loading ? 'Verifying...' : 'Establish Session'}
                </Button>
                <button type="button" onClick={() => setShowOtpInput(false)} className="w-full text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary transition-colors mt-4">
                  Abort / Resend Cypher
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 max-w-7xl pt-40 pb-40">

      <div className="flex flex-col lg:flex-row gap-12">

        {/* Navigation Sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-card border border-border p-6 rounded-2xl mb-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-serif font-bold text-xl">
              {user.name?.[0] || 'U'}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Hello,</p>
              <p className="text-base font-bold truncate">{user.name}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border/50">
            {[
              { id: 'orders', label: 'Order History', icon: ShoppingBag },
              { id: 'profile', label: 'Profile Details', icon: UserIcon },
              { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
              { id: 'wishlist', label: 'My Collection', icon: Heart },
              { id: 'settings', label: 'Security Center', icon: ShieldCheck }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center justify-between p-4 text-left transition-all",
                  activeTab === tab.id ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-primary" : "text-muted-foreground/40")} />
                  <span className="text-sm font-bold">{tab.label}</span>
                </div>
                <ChevronRight className={cn("w-3 h-3 transition-transform", activeTab === tab.id ? "translate-x-0" : "-translate-x-2 opacity-0")} />
              </button>
            ))}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 text-left text-destructive hover:bg-destructive/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold">Sign Out</span>
            </button>
          </div>

          <div className="mt-8 p-6 bg-muted/10 rounded-2xl border border-dashed border-border/50">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Account Analytics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xl font-bold">{ordersData?.total || 0}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Orders</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold">{wishlist?.length || 0}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Wishlist</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >

              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-border pb-6">
                    <h2 className="text-2xl font-serif font-bold underline decoration-primary decoration-4 underline-offset-8">Order History</h2>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(f => (
                        <button
                          key={f}
                          onClick={() => setOrderFilter(f)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border",
                            orderFilter === f ? "bg-foreground text-background border-foreground shadow-lg" : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {ordersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />)}
                    </div>
                  ) : filteredOrders?.length === 0 ? (
                    <div className="py-24 text-center bg-card border border-dashed border-border rounded-3xl group">
                      <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-20 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-medium text-muted-foreground">No orders found in this category</p>
                      <Link href="/shop" className="mt-6 inline-block">
                        <Button variant="outline" className="rounded-full px-8 text-xs font-bold uppercase tracking-widest">Start Browsing</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order: any) => (
                        <div
                          key={order._id}
                          onClick={() => setSelectedOrderId(order._id)}
                          className="bg-card border border-border p-5 rounded-2xl hover:border-primary/50 transition-all cursor-pointer group flex items-center justify-between shadow-sm hover:shadow-md"
                        >
                          <div className="flex gap-5 items-center">
                            <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-muted border border-border">
                              {order.items[0]?.image && <img src={getImageUrl(order.items[0].image)} alt="Product" className="w-full h-full object-cover" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  "w-2 h-2 rounded-full",
                                  order.status === 'delivered' ? "bg-green-500" : order.status === 'cancelled' ? "bg-destructive" : "bg-primary animate-pulse"
                                )}></span>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{order.status}</p>
                              </div>
                              <p className="text-sm font-bold tracking-tight">
                                ID: #{order._id.slice(-6).toUpperCase()}
                              </p>
                              <p className="text-[10px] font-medium text-muted-foreground mt-1">
                                {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <p className="text-base font-bold font-serif">₹{order.total}</p>
                            <ArrowRight className="w-4 h-4 text-primary mt-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div className="border-b border-border pb-6">
                    <h2 className="text-2xl font-serif font-bold">My Profile</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage your identity data</p>
                  </div>

                  <div className="max-w-2xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground ml-1">Full Name</label>
                        <Input
                          defaultValue={user.name}
                          onBlur={(e) => updateProfileOp.mutate({ name: e.target.value })}
                          className="h-12 rounded-xl focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2 opacity-60">
                        <label className="text-xs font-bold text-muted-foreground ml-1">Email Address</label>
                        <Input
                          value={user.email}
                          disabled
                          className="h-12 rounded-xl bg-muted/40 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl flex items-start gap-4">
                      <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-primary italic font-serif">Profile Security</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Your data is encrypted and stored securely. Changing primary identifiers requires manual verification for security.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center border-b border-border pb-6">
                    <h2 className="text-2xl font-serif font-bold">Saved Addresses</h2>
                    <Button
                      onClick={() => {
                        setAddressData({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' });
                        setEditingAddressIdx(null);
                        setShowAddressForm(true);
                      }}
                      variant="outline"
                      className="rounded-full text-[10px] font-bold uppercase tracking-widest h-10 px-6 border-primary text-primary hover:bg-primary/10"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Address
                    </Button>
                  </div>

                  <AnimatePresence>
                    {showAddressForm ? (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-8 bg-card border border-border shadow-2xl rounded-2xl space-y-8 max-w-2xl overflow-hidden">
                        <h3 className="text-sm font-bold uppercase tracking-widest underline underline-offset-8 decoration-primary/30">
                          {editingAddressIdx !== null ? 'Edit Address' : 'Add New Address'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2 space-y-3">
                            <label className="text-[10px] font-black uppercase text-muted-foreground/50">Address Label</label>
                            <div className="flex gap-3">
                              {['Home', 'Work', 'Other'].map(l => (
                                <button
                                  key={l}
                                  onClick={() => setAddressData({ ...addressData, label: l })}
                                  className={cn(
                                    "px-5 h-9 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                                    addressData.label === l ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                  {l}
                                </button>
                              ))}
                            </div>
                          </div>
                          <Input placeholder="Recipient Name *" value={addressData.line1} onChange={e => setAddressData({ ...addressData, line1: e.target.value })} className="h-12" />
                          <Input placeholder="Street / Area *" value={addressData.line2} onChange={e => setAddressData({ ...addressData, line2: e.target.value })} className="h-12" />
                          <Input placeholder="City *" value={addressData.city} onChange={e => setAddressData({ ...addressData, city: e.target.value })} className="h-12" />
                          <Input placeholder="State *" value={addressData.state} onChange={e => setAddressData({ ...addressData, state: e.target.value })} className="h-12" />
                          <Input placeholder="Pincode *" value={addressData.pincode} onChange={e => setAddressData({ ...addressData, pincode: e.target.value })} className="h-12" />
                          <Input placeholder="Secure Phone *" value={addressData.phone} onChange={e => setAddressData({ ...addressData, phone: e.target.value })} className="h-12" />
                        </div>
                        <div className="flex gap-4">
                          <Button onClick={handleSaveAddress} className="flex-1 h-12 rounded-xl font-bold uppercase text-xs tracking-widest">Commit Entry</Button>
                          <Button variant="ghost" onClick={() => setShowAddressForm(false)} className="px-8 h-12 text-xs font-bold text-muted-foreground">Discard</Button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {user.addresses?.length > 0 ? (
                          user.addresses.map((addr: any, i: number) => (
                            <div key={i} className="group bg-card border border-border p-6 rounded-2xl hover:border-primary transition-all shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-muted border border-border">{addr.label}</span>
                                <div className="flex gap-3 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setAddressData(addr); setEditingAddressIdx(i); setShowAddressForm(true); }} className="hover:text-primary">Recalibrate</button>
                                  <button onClick={() => { if (confirm('Delete address?')) updateProfileOp.mutate({ addresses: user.addresses.filter((_: any, idx: number) => idx !== i) }); }} className="text-destructive hover:underline">Purge</button>
                                </div>
                              </div>
                              <p className="text-sm font-bold uppercase truncate">{addr.line1}</p>
                              <p className="text-xs text-muted-foreground mt-2 leading-relaxed opacity-80">
                                {addr.line2 && <>{addr.line2}, </>}
                                {addr.city}, {addr.state} ━ {addr.pincode}
                              </p>
                              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
                                <span>Security-Token (Phone)</span>
                                <span>{addr.phone}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-24 text-center bg-card border border-dashed border-border rounded-3xl opacity-50">
                            <MapPin className="w-10 h-10 mx-auto mb-4" />
                            <p className="text-sm font-medium">No destinations mapped</p>
                          </div>
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center border-b border-border pb-6">
                    <h2 className="text-2xl font-serif font-bold">My Collection</h2>
                    <Heart className="w-5 h-5 text-primary" fill="currentColor" />
                  </div>

                  {wishlistLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                      {[1, 2, 3].map(i => <div key={i} className="aspect-[4/5] bg-card border border-border rounded-2xl animate-pulse" />)}
                    </div>
                  ) : !wishlist || wishlist.length === 0 ? (
                    <div className="py-24 text-center bg-card border border-dashed border-border rounded-3xl group">
                      <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-20 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-medium text-muted-foreground">Your collection is currently empty</p>
                      <Link href="/shop" className="mt-6 inline-block">
                        <Button variant="outline" className="rounded-full px-8 text-xs font-bold uppercase tracking-widest">Discover Collection</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                      {wishlist.map((product: any) => (
                        <motion.div key={product._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group relative">
                          <div className="aspect-[3/4] relative overflow-hidden rounded-2xl border border-border bg-muted">
                            {product.images?.[0] && <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 gap-2">
                              <Button
                                onClick={() => {
                                  addItem({ product, name: product.name, price: product.price, image: product.images[0], qty: 1, size: product.sizes?.[0] || 'OS', color: product.colors?.[0] || 'Default' });
                                  toast.success('Deployed to Cart');
                                }}
                                className="w-full bg-white text-black h-10 text-[10px] font-bold uppercase tracking-widest rounded-full"
                              >
                                Deploy to Cart
                              </Button>
                              <button
                                onClick={() => toggleWishlistOp.mutate(product._id)}
                                className="text-[9px] font-bold uppercase text-white hover:underline underline-offset-4"
                              >
                                Remove Record
                              </button>
                            </div>
                          </div>
                          <div className="mt-4 px-1">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground truncate">{product.name}</h3>
                            <p className="text-sm font-bold mt-1 font-serif tracking-tight">₹{product.price}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8">
                  <div className="border-b border-border pb-6">
                    <h2 className="text-2xl font-serif font-bold">Security Settings</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage your security settings</p>
                  </div>

                  <div className="max-w-xl bg-card border border-border p-8 rounded-2xl shadow-xl space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">Update Password</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Input type="password" placeholder="Current Password" className="h-12 border-border" />
                      </div>
                      <div className="space-y-1">
                        <Input type="password" placeholder="New Password" className="h-12 border-border" />
                      </div>
                      <div className="space-y-1">
                        <Input type="password" placeholder="Confirm New Password" className="h-12 border-border" />
                      </div>
                      <Button className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest mt-4">Save Changes</Button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrderId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/60 backdrop-blur-md"
            onClick={() => setSelectedOrderId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setSelectedOrderId(null)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-muted/50 hover:bg-foreground hover:text-background transition-all rounded-full z-10">
                <X className="w-4 h-4" />
              </button>
              <OrderDetailView
                id={selectedOrderId}
                onCancel={() => cancelOrderOp.mutate(selectedOrderId)}
                isCancelling={cancelOrderOp.isPending}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <AccountContent />
    </Suspense>
  );
}
