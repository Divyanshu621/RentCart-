'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Loader2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { User as UserType } from '@/types';

// ─── Zod Schema ─────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Google SVG Icon ────────────────────────────────────────
function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ─── Left Panel SVG Illustration ────────────────────────────
function RentalIllustration() {
  return (
    <svg viewBox="0 0 480 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto">
      {/* Background circle glow */}
      <circle cx="240" cy="200" r="160" fill="url(#glowGrad)" opacity="0.3" />
      
      {/* Camera */}
      <g transform="translate(80, 80)">
        <rect x="0" y="8" width="80" height="56" rx="8" fill="#10b981" opacity="0.9" />
        <rect x="4" y="12" width="72" height="48" rx="6" fill="#064e3b" />
        <circle cx="40" cy="36" r="14" fill="none" stroke="#34d399" strokeWidth="3" />
        <circle cx="40" cy="36" r="6" fill="#34d399" />
        <rect x="56" y="14" width="12" height="8" rx="2" fill="#6ee7b7" opacity="0.5" />
        <rect x="28" y="4" width="24" height="8" rx="4" fill="#10b981" opacity="0.9" />
      </g>
      
      {/* Laptop */}
      <g transform="translate(300, 100)">
        <rect x="0" y="0" width="80" height="52" rx="6" fill="#10b981" opacity="0.9" />
        <rect x="4" y="4" width="72" height="40" rx="3" fill="#064e3b" />
        <rect x="-8" y="52" width="96" height="6" rx="3" fill="#10b981" opacity="0.8" />
        {/* Screen content lines */}
        <rect x="12" y="12" width="40" height="3" rx="1.5" fill="#34d399" opacity="0.6" />
        <rect x="12" y="20" width="56" height="3" rx="1.5" fill="#34d399" opacity="0.4" />
        <rect x="12" y="28" width="48" height="3" rx="1.5" fill="#34d399" opacity="0.4" />
        <rect x="12" y="36" width="32" height="3" rx="1.5" fill="#34d399" opacity="0.3" />
      </g>
      
      {/* Bike */}
      <g transform="translate(120, 240)">
        <circle cx="24" cy="40" r="20" fill="none" stroke="#10b981" strokeWidth="3" opacity="0.9" />
        <circle cx="76" cy="40" r="20" fill="none" stroke="#10b981" strokeWidth="3" opacity="0.9" />
        <path d="M24 40 L50 12 L76 40" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50 12 L40 40 L76 40" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="50" y1="12" x2="66" y2="12" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="12" r="3" fill="#6ee7b7" />
      </g>
      
      {/* Drill / Tool */}
      <g transform="translate(320, 260)">
        <rect x="0" y="20" width="60" height="24" rx="6" fill="#10b981" opacity="0.9" />
        <rect x="60" y="24" width="30" height="16" rx="3" fill="#064e3b" />
        <polygon points="90,28 110,32 90,36" fill="#34d399" />
        <rect x="8" y="0" width="8" height="20" rx="2" fill="#10b981" opacity="0.7" />
        <circle cx="42" cy="32" r="4" fill="#064e3b" />
        <circle cx="42" cy="32" r="2" fill="#6ee7b7" />
      </g>
      
      {/* Floating dots / particles */}
      <circle cx="200" cy="60" r="4" fill="#34d399" opacity="0.5" />
      <circle cx="280" cy="50" r="3" fill="#6ee7b7" opacity="0.4" />
      <circle cx="420" cy="200" r="4" fill="#34d399" opacity="0.3" />
      <circle cx="60" cy="180" r="3" fill="#6ee7b7" opacity="0.4" />
      <circle cx="160" cy="320" r="3" fill="#34d399" opacity="0.3" />
      <circle cx="380" cy="320" r="4" fill="#6ee7b7" opacity="0.3" />
      
      {/* Connection lines */}
      <path d="M160 120 Q200 160 170 240" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      <path d="M340 140 Q360 200 340 260" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      
      <defs>
        <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── Unstop-inspired Split Login Page ───────────────────────
export default function LoginPage() {
  const { setUser, navigate, setAuthModalOpen, setAuthModalView } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [checkedConfig, setCheckedConfig] = useState(false);

  // Check if real Google OAuth is configured
  useEffect(() => {
    api.getGoogleConfig()
      .then((config) => setGoogleConfigured(config.configured))
      .catch(() => setGoogleConfigured(false))
      .finally(() => setCheckedConfig(true));
  }, []);

  // Handle Google auth error from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError) {
      toast.error(authError);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const successCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('google_auth_success='));
    if (successCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(successCookie.split('=')[1]));
        setUser(userData as unknown as UserType);
        toast.success('Welcome back!');
        navigate('marketplace');
      } catch {
        // Fall through to api.me()
      }
      document.cookie = 'google_auth_success=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
  }, [setUser, navigate]);

  const handleGoogleClick = async () => {
    if (googleConfigured) {
      setIsGoogleLoading(true);
      window.location.href = '/api/auth/google';
    } else {
      setGoogleEmail('');
      setGoogleName('');
      setShowGoogleDialog(true);
    }
  };

  const handleDemoGoogleLogin = async () => {
    if (!googleEmail.trim() || !googleEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    const emailLower = googleEmail.trim().toLowerCase();
    if (!emailLower.endsWith('@gmail.com') && !emailLower.endsWith('@googlemail.com')) {
      toast.error('Please enter a valid Gmail address (e.g., you@gmail.com)');
      return;
    }
    setIsGoogleLoading(true);
    try {
      const name = googleName.trim() || emailLower.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      await api.googleAuth({ email: emailLower, name });
      const meData = await api.me();
      setUser((meData as Record<string, unknown>).user as unknown as UserType);
      toast.success('Welcome back!');
      setShowGoogleDialog(false);
      navigate('marketplace');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    try {
      const res = await api.login({ email: data.email, password: data.password });
      try {
        const meData = await api.me();
        setUser((meData as Record<string, unknown>).user as unknown as UserType);
      } catch {
        setUser(res.user as unknown as UserType);
      }
      toast.success('Welcome back!');
      navigate('marketplace');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setServerError(message);
      toast.error(message);
    }
  };

  const openRegister = () => {
    setAuthModalView('register');
    setAuthModalOpen(true);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel (hidden on mobile) ─── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0a0f1a] flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
        
        {/* Gradient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center text-center px-10"
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
              </svg>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">RentCart</span>
          </div>

          {/* Illustration */}
          <RentalIllustration />

          {/* Tagline */}
          <h2 className="mt-10 text-3xl font-bold text-white leading-tight">
            Your Next Rental
            <br />
            <span className="text-emerald-400">Starts Here</span>
          </h2>
          <p className="mt-4 text-slate-400 text-base max-w-xs leading-relaxed">
            Discover thousands of items available for rent near you. Save money, reduce waste, and enjoy more.
          </p>
        </motion.div>
      </div>

      {/* ─── Right Panel ─── */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col min-h-screen">
        {/* Top bar with logo (mobile only) */}
        <div className="w-full px-6 pt-6 pb-2 lg:hidden">
          <button
            onClick={() => navigate('landing')}
            className="inline-flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
              </svg>
            </div>
            <span className="text-[#0f172a] font-bold text-xl tracking-tight group-hover:opacity-80 transition-opacity">RentCart</span>
          </button>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >
            {/* Heading */}
            <h1 className="text-[28px] font-bold text-[#0f172a] leading-tight mb-2">
              Welcome Back!
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Log in to access your rentals, listings, and messages
            </p>

            {/* Error display */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
              >
                {serverError}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className={`h-[48px] rounded-xl border-slate-300 text-[15px] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 px-4 ${errors.email ? 'border-red-400 focus-visible:ring-red-400 focus-visible:border-red-400' : ''}`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1 ml-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={`h-[48px] rounded-xl border-slate-300 text-[15px] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 px-4 pr-12 ${errors.password ? 'border-red-400 focus-visible:ring-red-400 focus-visible:border-red-400' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1 ml-1">{errors.password.message}</p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="pt-1 text-right">
                <button
                  type="button"
                  onClick={() => toast.info('Password reset feature is coming soon. Please contact support@rentcart.in for assistance.')}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Log in button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[48px] rounded-full bg-[#e60023] hover:bg-[#cc001f] active:bg-[#b3001b] text-white font-semibold text-[15px] transition-colors shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log in'
                )}
              </Button>
            </form>

            {/* OR divider */}
            <div className="relative my-5 flex items-center">
              <div className="flex-1 border-t border-slate-200" />
              <span className="px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">or</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isGoogleLoading || !checkedConfig}
              className="w-full h-[48px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center gap-2.5 text-[15px] font-medium text-[#0f172a] transition-colors disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              ) : (
                <GoogleIcon />
              )}
              {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>

            {/* Sign up link */}
            <p className="mt-6 text-center text-sm text-slate-600">
              Not on RentCart yet?{' '}
              <button
                onClick={openRegister}
                className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
              >
                Sign up
              </button>
            </p>

            {/* Terms notice */}
            <p className="mt-4 text-center text-xs text-slate-400 leading-relaxed">
              By continuing, you agree to RentCart&apos;s{' '}
              <button type="button" onClick={() => navigate('terms-of-service')} className="underline cursor-pointer hover:text-slate-600 bg-transparent p-0 text-inherit border-0">Terms of Service</button>
              {' '}and acknowledge our{' '}
              <button type="button" onClick={() => navigate('privacy-policy')} className="underline cursor-pointer hover:text-slate-600 bg-transparent p-0 text-inherit border-0">Privacy Policy</button>.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ─── Google Sign-in Dialog (Demo Mode) ─── */}
      <AnimatePresence>
        {showGoogleDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={() => !isGoogleLoading && setShowGoogleDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <GoogleIcon className="w-7 h-7" />
                  <div>
                    <h3 className="font-bold text-[#0f172a] text-[17px]">Sign in with Google</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Enter your Gmail to continue</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGoogleDialog(false)}
                  disabled={isGoogleLoading}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#0f172a] mb-1.5 block">Gmail Address</label>
                  <Input
                    type="email"
                    placeholder="you@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDemoGoogleLogin()}
                    disabled={isGoogleLoading}
                    className="h-[48px] rounded-xl border-gray-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-[15px]"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Only Gmail addresses are supported for demo mode</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0f172a] mb-1.5 block">
                    Display Name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDemoGoogleLogin()}
                    disabled={isGoogleLoading}
                    className="h-[48px] rounded-xl border-gray-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-[15px]"
                  />
                </div>
                <Button
                  onClick={handleDemoGoogleLogin}
                  disabled={isGoogleLoading || !googleEmail.trim()}
                  className="w-full h-[48px] rounded-full bg-[#e60023] hover:bg-[#cc001f] active:bg-[#b3001b] text-white font-semibold text-[15px] transition-colors shadow-none"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
