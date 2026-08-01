
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { LogIn, Lock, User } from 'lucide-react';
import { useParallaxTilt } from '@/hooks/use-parallax-tilt';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const tilt = useParallaxTilt(4);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      toast({
        title: 'Login Successful',
        description: `Welcome, ${username}!`,
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        {...tilt}
        className="glass-panel-dark light-follow floating-card animate-rise w-full max-w-md p-8 sm:p-10"
        style={{ borderRadius: 32 }}
      >
        {/* Logo inside a circular glass badge */}
        <div className="flex flex-col items-center text-center">
          <div className="logo-badge flex h-28 w-28 items-center justify-center">
            <img
              src="/lovable-uploads/5759f407-e51d-4223-97b8-5049d0cfc448.png"
              alt="Jhaymarts Industries Inc. logo"
              className="relative z-10 h-16 w-auto drop-shadow-[0_10px_24px_rgba(120,235,170,0.45)]"
            />
          </div>
          {/* water reflection of the badge */}
          <div className="pointer-events-none -mt-1 h-10 w-28 overflow-hidden opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]">
            <img
              src="/lovable-uploads/5759f407-e51d-4223-97b8-5049d0cfc448.png"
              alt=""
              aria-hidden="true"
              className="mx-auto h-16 w-auto scale-y-[-1] blur-[1px]"
            />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-white text-3d-light font-display">
            Loan Monitoring System
          </h1>
          <p className="mt-1 text-sm uppercase tracking-[0.3em] text-emerald-200/70">
            Jhaymarts Industries
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white/80">
              Username (Employee First Name)
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-200/70" />
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your first name"
                required
                className="h-12 rounded-full border-white/20 bg-white/10 pl-11 text-white placeholder:text-white/40 backdrop-blur-md focus-visible:ring-emerald-400/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-200/70" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="h-12 rounded-full border-white/20 bg-white/10 pl-11 text-white placeholder:text-white/40 backdrop-blur-md focus-visible:ring-emerald-400/60"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-glass btn-emerald flex h-12 w-full items-center justify-center gap-2 text-base font-semibold"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40">
          Offline secure workstation access
        </p>
      </div>
    </div>
  );
};

export default Login;
