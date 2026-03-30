'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth, user } = useAuthStore();
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in as admin, redirect
  if (user && user.role === 'admin') {
    router.push('/admin');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Email and password required');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/login', { email, password });
      setAuth({ _id: data._id, name: data.name, email: data.email, role: data.role });
      toast.success('Welcome back, Admin!');
      router.push('/admin');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your admin email');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/forgot-password', { email });
      toast.success(data.message || 'Reset link sent to your email!');
      setView('login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 pb-32">
      <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 transition-all group-hover:bg-primary/50" />
        
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h1 className="text-3xl font-serif font-bold tracking-[0.1em] uppercase text-primary">KORA</h1>
            <div className="w-px h-6 bg-border" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Admin Access</span>
          </div>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-medium leading-relaxed">
            {view === 'login' ? 'Authorized personnel authentication only.' : 'Requesting administrative credential recovery.'}
          </p>
        </div>

        {view === 'login' ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Admin Email</label>
              <Input 
                type="email" 
                placeholder="admin@kora.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="h-12 bg-background border-border/60 focus:border-primary rounded-xl" 
                required
              />
            </div>
            <div className="space-y-2">
               <div className="flex justify-between items-center ml-1">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Master Password</label>
                 <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">Lost access?</button>
               </div>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="h-12 bg-background border-border/60 focus:border-primary rounded-xl" 
                required
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 uppercase tracking-[0.2em] text-[10px] font-bold mt-4 bg-foreground text-background hover:bg-primary transition-all rounded-xl" 
              disabled={loading}
            >
              {loading ? 'Validating...' : 'Authenticate'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleForgot} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Security Email</label>
              <Input 
                type="email" 
                placeholder="admin@kora.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="h-12 bg-background border-border/60 focus:border-primary rounded-xl" 
                required
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 uppercase tracking-[0.2em] text-[10px] font-bold mt-4 bg-foreground text-background hover:bg-primary transition-all rounded-xl" 
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Secure Recovery'}
            </Button>
            <div className="text-center mt-6">
              <button 
                type="button" 
                onClick={() => setView('login')}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-all uppercase tracking-[0.2em] font-bold"
              >
                ← Return to Console
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
