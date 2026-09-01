'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, Phone, MapPin, Home } from 'lucide-react';

import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type { User as UserType, State } from '@/types';

// ─── Zod Schemas ────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z.string().min(10, 'Phone number must be 10 digits').max(10, 'Phone number must be 10 digits').regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  stateId: z.string().min(1, 'Please select a state'),
  cityId: z.string().min(1, 'Please select a city'),
  pinCode: z.string().min(1, 'PIN code is required'),
  address: z.string().min(1, 'Address is required'),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Pinterest-style Input class ────────────────────────────
const inputClass =
  'h-11 rounded-2xl border-gray-300 text-[15px] placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 px-4';
const inputErrorClass =
  'h-11 rounded-2xl border-red-400 text-[15px] placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:border-red-400 px-4';

// ─── AuthModal Component ────────────────────────────────────
export default function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalView,
    setAuthModalView,
    setUser,
    navigate,
    returnUrl,
    setReturnUrl,
  } = useAppStore();

  const [states, setStates] = useState<State[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);

  useEffect(() => {
    api.getStates()
      .then((data) => {
        const parsed = data as unknown as State[];
        setStates(parsed.filter((s) => s.isActive));
      })
      .catch(() => toast.error('Failed to load states'))
      .finally(() => setLoadingStates(false));
  }, []);

  const handleClose = useCallback(() => setAuthModalOpen(false), [setAuthModalOpen]);

  const toggleView = useCallback(() => {
    setAuthModalView(authModalView === 'login' ? 'register' : 'login');
  }, [authModalView, setAuthModalView]);

  const handleAuthSuccess = useCallback(async (userData: Record<string, unknown>) => {
    try {
      const meData = await api.me();
      const userObj = (meData as Record<string, unknown>).user as unknown as UserType;
      setUser(userObj);
      toast.success(authModalView === 'login' ? 'Welcome back!' : 'Account created successfully!');
      setAuthModalOpen(false);
      setReturnUrl(null);
      if (userObj.role === 'OWNER' && userObj.kycStatus !== 'VERIFIED') {
        navigate('seller-kyc');
      } else {
        navigate(returnUrl ? (returnUrl as 'marketplace' | 'dashboard') : 'marketplace');
      }
    } catch {
      setUser(userData as unknown as UserType);
    }
  }, [authModalView, returnUrl, navigate, setAuthModalOpen, setReturnUrl, setUser]);

  return (
    <Dialog open={authModalOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[440px] max-h-[92vh] p-0 overflow-hidden gap-0 rounded-3xl border-gray-200 flex flex-col">
        <div className="p-6 sm:p-7 overflow-y-auto flex-1">
          {authModalView === 'login' ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onToggleView={toggleView}
            />
          ) : (
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onToggleView={toggleView}
              states={states}
              loadingStates={loadingStates}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Login Form ─────────────────────────────────────────────
function LoginForm({
  onSuccess,
  onToggleView,
}: {
  onSuccess: (data: Record<string, unknown>) => void;
  onToggleView: () => void;
}) {
  const navigate = useAppStore((s) => s.navigate);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  // Fetch Google Client ID
  useEffect(() => {
    api.getGoogleConfig()
      .then((c) => setGoogleClientId(c.clientId || null))
      .catch(() => {});
  }, []);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!googleClientId) return;

    const handleCredentialResponse = async (response: { credential: string }) => {
      setIsGoogleLoading(true);
      try {
        const res = await api.googleAuth({ credential: response.credential });
        onSuccess(res.user);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
      } finally {
        setIsGoogleLoading(false);
      }
    };

    // Load GIS script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (typeof window.google === 'undefined' || !window.google.accounts) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the button if the ref is available
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: googleBtnRef.current.offsetWidth,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
        });
      }
    };

    script.onerror = () => {
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '<p style="color:#94a3b8;font-size:13px;text-align:center;">Google Sign-In unavailable</p>';
      }
    };

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [googleClientId, onSuccess]);

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    try {
      const res = await api.login({ email: data.email, password: data.password });
      onSuccess(res.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <>
      <div>
        {/* Heading */}
        <h2 className="text-[24px] font-semibold text-[#0f172a] leading-tight mb-5">
          Log in to discover more<br />rental deals just for you
        </h2>

        {serverError && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Email */}
          <div>
            <Input
              type="email"
              placeholder="Email"
              className={errors.email ? inputErrorClass : inputClass}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1 ml-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className={`pr-12 ${errors.password ? inputErrorClass : inputClass}`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 mt-1 ml-1">{errors.password.message}</p>
            )}
          </div>

          {/* Forgot password - left aligned */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => toast.info('Password reset feature is coming soon. Please contact support@rentcart.in for assistance.')}
              className="text-[15px] text-[#0074e8] hover:text-[#0060b8] font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Log in - Red pill button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[52px] rounded-full bg-[#e60023] hover:bg-[#cc001f] active:bg-[#b3001b] text-white font-semibold text-[16px] transition-colors shadow-none"
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
          <div className="flex-1 border-t border-gray-300" />
          <span className="px-4 text-sm font-medium text-[#0f172a]">OR</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        {/* Continue with Google */}
        <div className="relative">
          {isGoogleLoading && (
            <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center rounded-2xl">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          )}
          {googleClientId ? (
            <div ref={googleBtnRef} className="w-full flex justify-center overflow-hidden" style={{ minHeight: 52 }} />
          ) : (
            <button
              type="button"
              disabled
              className="w-full h-[52px] rounded-2xl border border-gray-300 bg-gray-50 flex items-center justify-center gap-2.5 text-[15px] font-medium text-gray-400 cursor-not-allowed"
            >
              Google Sign-In unavailable
            </button>
          )}
        </div>

        {/* Sign up link */}
        <p className="mt-5 text-center text-sm text-[#0f172a]">
          Not on RentCart yet?{' '}
          <button
            onClick={onToggleView}
            className="text-[#0074e8] hover:text-[#0060b8] font-semibold transition-colors"
          >
            Sign up
          </button>
        </p>

        {/* Terms */}
        <p className="mt-3 text-center text-xs text-gray-500 leading-relaxed">
          By continuing, you agree to RentCart&apos;s{' '}
          <button type="button" onClick={() => { setAuthModalOpen(false); setTimeout(() => navigate('terms-of-service'), 300); }} className="underline cursor-pointer bg-transparent p-0 text-inherit">Terms of Service</button>
          {' '}and acknowledge our{' '}
          <button type="button" onClick={() => { setAuthModalOpen(false); setTimeout(() => navigate('privacy-policy'), 300); }} className="underline cursor-pointer bg-transparent p-0 text-inherit">Privacy Policy</button>.
        </p>
      </div>
    </>
  );
}

// ─── Register Form ──────────────────────────────────────────
function RegisterForm({
  onSuccess,
  onToggleView,
  states,
  loadingStates,
}: {
  onSuccess: (data: Record<string, unknown>) => void;
  onToggleView: () => void;
  states: State[];
  loadingStates: boolean;
}) {
  const navigate = useAppStore((s) => s.navigate);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      stateId: '',
      cityId: '',
      pinCode: '',
      address: '',
      agreeTerms: false as unknown as true,
    },
  });

  const selectedStateId = useWatch({ control, name: 'stateId' });
  const selectedState = states.find((s) => s.id === selectedStateId);
  const cities = selectedState?.cities?.filter((c) => c.isActive) || [];

  useEffect(() => { setValue('cityId', ''); }, [selectedStateId, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    try {
      const res = await api.register({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
        stateId: data.stateId,
        cityId: data.cityId,
        pinCode: data.pinCode || undefined,
        address: data.address || undefined,
      });
      onSuccess(res.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <>
      <div>
        {/* Heading */}
        <h2 className="text-[24px] font-semibold text-[#0f172a] leading-tight mb-1">
          Welcome to RentCart
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Create an account to start renting and saving
        </p>

        {serverError && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
          {/* Full Name */}
          <div>
            <Input
              placeholder="Full Name"
              className={errors.name ? inputErrorClass : inputClass}
              {...register('name')}
            />
            {errors.name && <p className="text-sm text-red-600 mt-1 ml-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <Input
              type="email"
              placeholder="Email"
              className={errors.email ? inputErrorClass : inputClass}
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-red-600 mt-1 ml-1">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="tel"
                placeholder="Phone Number"
                className={`pl-10 ${errors.phone ? inputErrorClass : inputClass}`}
                {...register('phone')}
              />
            </div>
            {errors.phone && <p className="text-sm text-red-600 mt-1 ml-1">{errors.phone.message}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (min. 6 characters)"
                className={`pr-12 ${errors.password ? inputErrorClass : inputClass}`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-600 mt-1 ml-1">{errors.password.message}</p>}
          </div>

          {/* State & City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Controller
                name="stateId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={loadingStates}>
                    <SelectTrigger className={`w-full h-11 rounded-2xl border-gray-300 ${errors.stateId ? 'border-red-400' : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <SelectValue placeholder={loadingStates ? 'Loading...' : 'State'} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.stateId && <p className="text-xs text-red-600 mt-1 ml-1">{errors.stateId.message}</p>}
            </div>
            <div>
              <Controller
                name="cityId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!selectedStateId}>
                    <SelectTrigger className={`w-full h-11 rounded-2xl border-gray-300 ${errors.cityId ? 'border-red-400' : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <SelectValue placeholder={cities.length === 0 ? 'State first' : 'City'} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.cityId && <p className="text-xs text-red-600 mt-1 ml-1">{errors.cityId.message}</p>}
            </div>
          </div>

          {/* PIN & Address */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                placeholder="PIN Code"
                className={errors.pinCode ? inputErrorClass : inputClass}
                {...register('pinCode')}
              />
              {errors.pinCode && <p className="text-xs text-red-600 mt-1 ml-1">{errors.pinCode.message}</p>}
            </div>
            <div>
              <Textarea
                placeholder="Address"
                className={`${errors.address ? inputErrorClass : inputClass} h-[52px] resize-none`}
                {...register('address')}
              />
              {errors.address && <p className="text-xs text-red-600 mt-1 ml-1">{errors.address.message}</p>}
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2.5 pt-1">
            <Controller
              name="agreeTerms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value as boolean}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-0.5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
              )}
            />
            <label
              className="text-xs text-gray-500 leading-relaxed cursor-pointer"
              onClick={(e) => {
                const cb = e.currentTarget.previousElementSibling as HTMLButtonElement;
                cb?.click();
              }}
            >
              I agree to the{' '}
              <button type="button" onClick={() => { setAuthModalOpen(false); setTimeout(() => navigate('terms-of-service'), 300); }} className="text-[#0074e8] font-medium hover:underline cursor-pointer bg-transparent p-0 border-0">Terms of Service</button>
              {', '}
              <button type="button" onClick={() => { setAuthModalOpen(false); setTimeout(() => navigate('privacy-policy'), 300); }} className="text-[#0074e8] font-medium hover:underline cursor-pointer bg-transparent p-0 border-0">Privacy Policy</button>
            </label>
          </div>
          {errors.agreeTerms && <p className="text-xs text-red-600 ml-1">{errors.agreeTerms.message}</p>}

          {/* Submit - Red pill */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-full bg-[#e60023] hover:bg-[#cc001f] active:bg-[#b3001b] text-white font-semibold text-[15px] transition-colors shadow-none mt-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Login link */}
        <p className="mt-4 text-center text-sm text-[#0f172a]">
          Already a member?{' '}
          <button
            onClick={onToggleView}
            className="text-[#0074e8] hover:text-[#0060b8] font-semibold transition-colors"
          >
            Log in
          </button>
        </p>

        {/* Terms */}
        <p className="mt-3 text-center text-xs text-gray-500 leading-relaxed">
          By continuing, you agree to RentCart&apos;s{' '}
          <button type="button" onClick={() => { setAuthModalOpen(false); setTimeout(() => navigate('terms-of-service'), 300); }} className="underline cursor-pointer bg-transparent p-0 text-inherit">Terms of Service</button>
          {' '}and acknowledge our{' '}
          <button type="button" onClick={() => { setAuthModalOpen(false); setTimeout(() => navigate('privacy-policy'), 300); }} className="underline cursor-pointer bg-transparent p-0 text-inherit">Privacy Policy</button>.
        </p>
      </div>
    </>
  );
}
