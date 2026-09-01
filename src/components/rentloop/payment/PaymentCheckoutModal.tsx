'use client';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
      close: () => void;
    };
  }
}

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CreditCard, Smartphone, Building2, Wallet, Truck,
  ShieldCheck, ChevronRight, Loader2, CheckCircle2, Lock, IndianRupee, Landmark, QrCode, ChevronDown, ChevronUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';

interface PaymentCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  rentalId: string;
  rentalData: {
    totalAmount: number;
    rentalAmount: number;
    platformFee: number;
    tax: number;
    deliveryFee: number;
    discount: number;
    securityDeposit: number;
    rentalDays: number;
    dailyRate: number;
    startDate: string;
    endDate: string;
    productTitle?: string;
    productImage?: string;
  } | null;
  onSuccess?: () => void;
}

interface PaymentMethodDef {
  id: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  tag?: string;
  tagColor?: string;
}

const banks = [
  { name: 'State Bank of India', code: 'SBI' },
  { name: 'HDFC Bank', code: 'HDFC' },
  { name: 'ICICI Bank', code: 'ICICI' },
  { name: 'Axis Bank', code: 'AXIS' },
  { name: 'Kotak Mahindra', code: 'KOTAK' },
  { name: 'Punjab National', code: 'PNB' },
  { name: 'Bank of Baroda', code: 'BOB' },
  { name: 'Canara Bank', code: 'CANARA' },
];

const upiApps = [
  { name: 'GPay', color: 'bg-white border border-gray-200 text-gray-800' },
  { name: 'PhonePe', color: 'bg-purple-600 text-white' },
  { name: 'Paytm', color: 'bg-[#00baf2] text-white' },
  { name: 'BHIM', color: 'bg-green-600 text-white' },
];

const wallets = [
  { name: 'Paytm', color: 'bg-[#00baf2] text-white' },
  { name: 'Amazon Pay', color: 'bg-amber-500 text-white' },
  { name: 'Freecharge', color: 'bg-red-500 text-white' },
  { name: 'MobiKwik', color: 'bg-red-600 text-white' },
  { name: 'Jio Money', color: 'bg-blue-500 text-white' },
  { name: 'Ola Money', color: 'bg-green-700 text-white' },
];

const allPaymentMethods: PaymentMethodDef[] = [
  {
    id: 'razorpay',
    icon: <CreditCard className="size-5" />,
    label: 'Razorpay',
    desc: 'UPI, Cards, Net Banking & Wallets',
    tag: 'Popular',
    tagColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'upi',
    icon: <Smartphone className="size-5" />,
    label: 'UPI',
    desc: 'GPay, PhonePe, Paytm',
    tag: 'Instant',
    tagColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'card',
    icon: <CreditCard className="size-5" />,
    label: 'Card',
    desc: 'Visa, Mastercard, Rupay',
  },
  {
    id: 'netbanking',
    icon: <Building2 className="size-5" />,
    label: 'Net Banking',
    desc: 'All major banks',
  },
  {
    id: 'wallet',
    icon: <Wallet className="size-5" />,
    label: 'Wallet',
    desc: 'Paytm, Amazon Pay, Mobikwik',
  },
  {
    id: 'cash',
    icon: <Truck className="size-5" />,
    label: 'Cash on Pickup',
    desc: 'Pay when you receive',
    tag: 'No Fee',
    tagColor: 'bg-amber-100 text-amber-700',
  },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('en-IN');
}

export default function PaymentCheckoutModal({
  open,
  onClose,
  rentalId,
  rentalData,
  onSuccess,
}: PaymentCheckoutModalProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [enabledMethods, setEnabledMethods] = useState<Record<string, boolean> | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('razorpay');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'checkout' | 'processing' | 'success'>('checkout');
  const [txnId, setTxnId] = useState('');
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Fetch enabled payment methods from backend
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api.getPaymentSettings().then((res) => {
      if (cancelled) return;
      setEnabledMethods(res.enabledMethods);
      // Auto-select first enabled method if current selection is disabled
      if (!res.enabledMethods[selectedMethod]) {
        const firstEnabled = Object.entries(res.enabledMethods).find(([, v]) => v)?.[0];
        if (firstEnabled) setSelectedMethod(firstEnabled);
      }
    }).catch(() => {
      // Fallback: enable all if settings fetch fails
      if (!cancelled) {
        setEnabledMethods({
          razorpay: true, upi: true, card: true, netbanking: true, wallet: true, cash: true,
        });
      }
    });
    return () => { cancelled = true; };
  }, [open]);

  // Filter payment methods based on backend settings
  const paymentMethods = useMemo(() => {
    if (!enabledMethods) return allPaymentMethods; // show all while loading
    return allPaymentMethods.filter((m) => enabledMethods[m.id]);
  }, [enabledMethods]);

  const dateRange = useMemo(() => {
    if (!rentalData) return '';
    return `${formatDate(rentalData.startDate)} - ${formatDate(rentalData.endDate)}, ${new Date(rentalData.endDate).getFullYear()} (${rentalData.rentalDays} days)`;
  }, [rentalData]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 16);
    return v.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) return v.slice(0, 2) + '/' + v.slice(2);
    return v;
  };

  const validateUPI = (id: string) => {
    return id.includes('@') && id.length >= 3;
  };

  const validateCard = () => {
    const num = cardNumber.replace(/\s/g, '');
    return num.length === 16 && cardExpiry.length === 5 && cardCvv.length === 3 && cardName.trim().length > 0;
  };

  const getPaymentButtonLabel = () => {
    const amount = `₹${rentalData ? formatCurrency(rentalData.totalAmount) : '0'}`;
    switch (selectedMethod) {
      case 'razorpay': return `Pay ${amount} with Razorpay`;
      case 'upi': return `Pay ${amount} via UPI`;
      case 'card': return `Pay ${amount} via Card`;
      case 'netbanking': return `Pay ${amount} via Net Banking`;
      case 'wallet': return `Pay ${amount} via Wallet`;
      case 'cash': return 'Confirm Cash on Pickup';
      default: return `Pay ${amount}`;
    }
  };

  const isPayDisabled = () => {
    if (processing) return true;
    switch (selectedMethod) {
      case 'upi': return !validateUPI(upiId);
      case 'card': return !validateCard();
      case 'netbanking': return !selectedBank;
      case 'wallet': return !selectedWallet;
      default: return false;
    }
  };

  const resetState = useCallback(() => {
    setSelectedMethod('razorpay');
    setUpiId('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setSelectedBank('');
    setSelectedWallet('');
    setProcessing(false);
    setStep('checkout');
    setTxnId('');
    setSummaryExpanded(false);
  }, []);

  const handlePaymentSuccess = useCallback((transactionId: string) => {
    setTxnId(transactionId);
    setStep('success');
    queryClient.invalidateQueries({ queryKey: ['rentals'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['my-rentals'] });
  }, [queryClient]);

  const handlePaymentError = useCallback(() => {
    toast.error('Payment failed. Please try again.');
    setProcessing(false);
    setStep('checkout');
  }, []);

  const handlePayment = async () => {
    if (!rentalData) return;

    setProcessing(true);
    setStep('processing');

    try {
      if (selectedMethod === 'cash') {
        await api.verifyPayment({
          rentalId,
          paymentMethod: 'CASH_ON_PICKUP',
        });
        const txId = `CASH-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        handlePaymentSuccess(txId);
        return;
      }

      // Create order
      const orderData = await api.createPaymentOrder(rentalId, selectedMethod.toUpperCase()) as Record<string, unknown>;

      if (orderData.method === 'razorpay' && typeof window !== 'undefined' && window.Razorpay) {
        // Real Razorpay mode
        const rzpOptions: Record<string, unknown> = {
          key: orderData.key,
          amount: Math.round((orderData.amount as number) * 100),
          currency: orderData.currency,
          name: 'RentCart',
          description: `Rental: ${rentalData.productTitle || 'Item'}`,
          order_id: orderData.orderId,
          prefill: {
            name: (orderData.customer as Record<string, string>)?.name || '',
            email: (orderData.customer as Record<string, string>)?.email || '',
            contact: (orderData.customer as Record<string, string>)?.contact || '',
          },
          theme: { color: '#059669' },
          modal: !isMobile,
          handler: async (response: Record<string, string>) => {
            try {
              await api.verifyPayment({
                rentalId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });
              handlePaymentSuccess(response.razorpay_payment_id || (orderData.orderId as string));
            } catch {
              handlePaymentError();
            }
          },
        };

        const rzp = new window.Razorpay(rzpOptions);

        rzp.on('payment.failed', () => {
          handlePaymentError();
        });

        rzp.open();
        // Don't reset processing here — the handler callbacks will do it
        // Fallback: if user dismisses the Razorpay modal, reset processing after a timeout check
        const dismissCheck = setInterval(() => {
          const razorpayContainer = document.getElementById('razorpay-container');
          if (!razorpayContainer || razorpayContainer.style.display === 'none') {
            clearInterval(dismissCheck);
            setProcessing(false);
            setStep('checkout');
          }
        }, 1000);
        // Auto-clear the interval after 30 seconds to avoid memory leak
        setTimeout(() => clearInterval(dismissCheck), 30000);
        return;
      }

      // Simulated/demo mode — add a short delay to mimic real payment
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await api.verifyPayment({
        rentalId,
        paymentMethod: selectedMethod.toUpperCase(),
      });
      const txId = (orderData.orderId as string) || `TXN-${Date.now()}`;
      handlePaymentSuccess(txId);
    } catch {
      handlePaymentError();
    }
  };

  const handleClose = () => {
    if (processing) return;
    if (step === 'success') {
      onSuccess?.();
    }
    resetState();
    onClose();
  };

  const handleSuccess = () => {
    onSuccess?.();
    resetState();
    onClose();
  };

  const renderOrderSummary = () => (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">
      {/* Compact header — always visible on mobile */}
      <button
        type="button"
        onClick={() => setSummaryExpanded(!summaryExpanded)}
        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-100/50 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">Order Summary</h3>
          <Badge variant="secondary" className="text-[10px] font-medium bg-emerald-100 text-emerald-700 shrink-0">
            {rentalData?.rentalDays} days
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-gray-900">₹{formatCurrency(rentalData?.totalAmount ?? 0)}</span>
          {isMobile && (
            summaryExpanded ? <ChevronUp className="size-4 text-gray-400" /> : <ChevronDown className="size-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expandable details — always shown on desktop, toggleable on mobile */}
      <AnimatePresence>
        {(!isMobile || summaryExpanded) && (
          <motion.div
            initial={isMobile ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Separator className="bg-gray-200" />
            <div className="p-3 sm:p-4 space-y-2">
              <p className="text-sm font-medium text-gray-800 truncate">
                {rentalData?.productTitle || 'Rental Item'}
              </p>
              <p className="text-xs text-gray-500">{dateRange}</p>

              <Separator className="my-2.5 bg-gray-200" />

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Rental Amount</span>
                  <span className="font-medium text-gray-700">
                    ₹{rentalData?.dailyRate.toLocaleString('en-IN')} × {rentalData?.rentalDays} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Platform Fee (10%)</span>
                  <span className="font-medium text-gray-700">₹{formatCurrency(rentalData?.platformFee ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">GST (18%)</span>
                  <span className="font-medium text-gray-700">₹{formatCurrency(rentalData?.tax ?? 0)}</span>
                </div>
                {rentalData && rentalData.deliveryFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-medium text-gray-700">₹{formatCurrency(rentalData.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Security Deposit</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-700">₹{formatCurrency(rentalData?.securityDeposit ?? 0)}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Refundable</span>
                  </div>
                </div>
                {(rentalData?.discount ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-medium text-emerald-600">-₹{formatCurrency(rentalData?.discount ?? 0)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-2.5 bg-gray-200" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Total Payable</span>
                <span className="text-base font-bold text-gray-900">₹{formatCurrency(rentalData?.totalAmount ?? 0)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderMethodCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {paymentMethods.map((method) => {
        const isSelected = selectedMethod === method.id;
        return (
          <motion.button
            key={method.id}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelectedMethod(method.id);
              setSelectedBank('');
              setSelectedWallet('');
            }}
            className={`
              relative flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all text-left w-full min-h-[56px]
              ${isSelected
                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
            `}
          >
            <div
              className={`
                flex items-center justify-center size-9 rounded-lg shrink-0
                ${isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}
              `}
            >
              {method.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-800' : 'text-gray-800'}`}>
                  {method.label}
                </span>
                {method.tag && method.tagColor && (
                  <Badge
                    className={`text-[10px] px-1.5 py-0 font-semibold leading-tight border-0 shrink-0 ${method.tagColor}`}
                  >
                    {method.tag}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 truncate">{method.desc}</p>
            </div>
            {isSelected && (
              <div className="flex items-center justify-center size-5 rounded-full bg-emerald-500 text-white shrink-0">
                <CheckCircle2 className="size-3.5" />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );

  const renderUPIForm = () => (
    <motion.div
      key="upi-form"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3">
        <div>
          <Label className="text-xs font-semibold text-gray-700 mb-2 block">
            Quick Pay with UPI App
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {upiApps.map((app) => (
              <motion.button
                key={app.name}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  toast.info(`Opening ${app.name}...`, { description: 'Complete the payment in the UPI app' });
                }}
                className={`flex flex-col items-center gap-1.5 rounded-lg p-2.5 transition-all hover:shadow-sm min-h-[56px] ${app.color}`}
              >
                <Smartphone className="size-4" />
                <span className="text-[10px] font-semibold leading-tight text-center">{app.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Separator className="flex-1 bg-gray-200" />
          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">or enter UPI ID</span>
          <Separator className="flex-1 bg-gray-200" />
        </div>

        <div>
          <Label htmlFor="upi-id" className="text-xs font-semibold text-gray-700">
            UPI ID
          </Label>
          <div className="relative mt-1.5">
            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              id="upi-id"
              type="text"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value.toLowerCase())}
              className={`pl-10 h-12 text-base ${
                upiId.length > 0 && !validateUPI(upiId)
                  ? 'border-red-300 focus-visible:ring-red-200'
                  : 'focus-visible:ring-emerald-200 focus-visible:border-emerald-400'
              }`}
            />
          </div>
          {upiId.length > 0 && !validateUPI(upiId) && (
            <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
              <X className="size-3" /> Enter a valid UPI ID (e.g. name@upi)
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderCardForm = () => (
    <motion.div
      key="card-form"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3">
        <div>
          <Label htmlFor="card-number" className="text-xs font-semibold text-gray-700">
            Card Number
          </Label>
          <div className="relative mt-1.5">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              id="card-number"
              type="text"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className="pl-10 h-12 text-base font-mono tracking-wider"
              maxLength={19}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="card-expiry" className="text-xs font-semibold text-gray-700">
              Expiry Date
            </Label>
            <Input
              id="card-expiry"
              type="text"
              inputMode="numeric"
              placeholder="MM/YY"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
              className="mt-1.5 h-12 text-base font-mono"
              maxLength={5}
            />
          </div>
          <div>
            <Label htmlFor="card-cvv" className="text-xs font-semibold text-gray-700">
              CVV
            </Label>
            <Input
              id="card-cvv"
              type="password"
              inputMode="numeric"
              placeholder="•••"
              value={cardCvv}
              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
              className="mt-1.5 h-12 text-base font-mono"
              maxLength={3}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="card-name" className="text-xs font-semibold text-gray-700">
            Cardholder Name
          </Label>
          <Input
            id="card-name"
            type="text"
            placeholder="Name on card"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className="mt-1.5 h-12 text-base"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderNetBankingForm = () => (
    <motion.div
      key="netbanking-form"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3">
        <Label className="text-xs font-semibold text-gray-700">
          Popular Banks
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {banks.map((bank) => {
            const isSelected = selectedBank === bank.code;
            return (
              <motion.button
                key={bank.code}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedBank(bank.code)}
                className={`
                  flex items-center gap-2.5 rounded-lg border-2 px-3 py-3 transition-all text-left min-h-[48px]
                  ${isSelected
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <Landmark
                  className={`size-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`}
                />
                <span className={`text-xs font-medium truncate ${isSelected ? 'text-emerald-800' : 'text-gray-700'}`}>
                  {bank.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  const renderWalletForm = () => (
    <motion.div
      key="wallet-form"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3">
        <Label className="text-xs font-semibold text-gray-700">
          Select Wallet
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {wallets.map((wallet) => {
            const isSelected = selectedWallet === wallet.name;
            return (
              <motion.button
                key={wallet.name}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedWallet(wallet.name)}
                className={`
                  flex items-center gap-2.5 rounded-lg border-2 px-3 py-3 transition-all text-left min-h-[48px]
                  ${isSelected
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <Wallet
                  className={`size-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`}
                />
                <span className={`text-xs font-medium truncate ${isSelected ? 'text-emerald-800' : 'text-gray-700'}`}>
                  {wallet.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  const renderCashForm = () => (
    <motion.div
      key="cash-form"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center size-8 rounded-lg bg-amber-100 text-amber-600 shrink-0 mt-0.5">
            <Truck className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Cash on Pickup</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Pay the full amount in cash when you pick up the item. Keep exact amount ready.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-100/60 rounded-lg px-3 py-2.5">
          <IndianRupee className="size-3.5 text-amber-700 shrink-0" />
          <p className="text-xs text-amber-800 font-medium">
            Amount: <span className="font-bold">₹{formatCurrency(rentalData?.totalAmount ?? 0)}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );

  const renderMethodForm = () => {
    switch (selectedMethod) {
      case 'upi': return renderUPIForm();
      case 'card': return renderCardForm();
      case 'netbanking': return renderNetBankingForm();
      case 'wallet': return renderWalletForm();
      case 'cash': return renderCashForm();
      default: return null;
    }
  };

  const renderSecurityBadges = () => (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      <div className="flex flex-col items-center gap-1 py-2 rounded-lg bg-gray-50 border border-gray-200">
        <Lock className="size-3.5 sm:size-4 text-emerald-600" />
        <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600 text-center leading-tight">
          100% Secure
        </span>
      </div>
      <div className="flex flex-col items-center gap-1 py-2 rounded-lg bg-gray-50 border border-gray-200">
        <ShieldCheck className="size-3.5 sm:size-4 text-emerald-600" />
        <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600 text-center leading-tight">
          Buyer Protection
        </span>
      </div>
      <div className="flex flex-col items-center gap-1 py-2 rounded-lg bg-gray-50 border border-gray-200">
        <IndianRupee className="size-3.5 sm:size-4 text-emerald-600" />
        <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600 text-center leading-tight">
          Money-back
        </span>
      </div>
    </div>
  );

  const renderProcessingOverlay = () => (
    <motion.div
      key="processing-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white"
    >
      <div className="relative mb-6">
        <div className="size-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
        <Loader2 className="absolute inset-0 m-auto size-6 text-emerald-500 animate-spin" style={{ animationDirection: 'reverse' }} />
      </div>
      <h3 className="text-lg font-bold text-gray-900">Processing payment...</h3>
      <p className="text-sm text-gray-500 mt-1.5">Please do not close this</p>
    </motion.div>
  );

  const renderSuccessOverlay = () => (
    <motion.div
      key="success-overlay"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white p-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
        className="mb-5"
      >
        <div className="flex items-center justify-center size-20 rounded-full bg-emerald-100">
          <CheckCircle2 className="size-11 text-emerald-600" strokeWidth={2.5} />
        </div>
      </motion.div>

      <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
      <p className="text-sm text-gray-500 mt-1.5 text-center">
        Your rental request has been sent to the owner
      </p>

      <div className="mt-4 px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 w-full max-w-xs">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Transaction ID</p>
        <p className="text-sm font-mono font-semibold text-gray-700 mt-0.5 break-all">{txnId}</p>
      </div>

      <Button
        onClick={handleSuccess}
        className="mt-6 w-full max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white h-12 font-semibold rounded-xl"
      >
        View My Rentals
        <ChevronRight className="size-4 ml-1" />
      </Button>
    </motion.div>
  );

  // Shared inner content for both drawer and dialog
  const renderContent = () => (
    <div className="relative">
      {/* Processing & Success overlays */}
      <AnimatePresence>
        {step === 'processing' && renderProcessingOverlay()}
        {step === 'success' && renderSuccessOverlay()}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-7 rounded-lg bg-emerald-100">
            <Lock className="size-3.5 text-emerald-600" />
          </div>
          <h2 className="text-base font-bold text-gray-900">Secure Checkout</h2>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={processing}
          className="flex items-center justify-center size-9 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="size-4 text-gray-500" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className={`${isMobile ? 'max-h-[55vh]' : 'max-h-[65vh]'} overflow-y-auto`}>
        <div className="p-4 sm:p-5 space-y-4">
          {/* Order Summary */}
          {renderOrderSummary()}

          {/* Payment Methods */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2.5">Payment Method</h3>
            {renderMethodCards()}
          </div>

          {/* Method-specific form */}
          <AnimatePresence mode="wait">
            {renderMethodForm()}
          </AnimatePresence>

          {/* Security Badges */}
          {renderSecurityBadges()}
        </div>
      </div>

      {/* Sticky footer with pay button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-5 py-3 safe-area-bottom">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm text-gray-500">Total Payable</span>
          <span className="text-lg font-bold text-gray-900">
            ₹{formatCurrency(rentalData?.totalAmount ?? 0)}
          </span>
        </div>
        <Button
          onClick={handlePayment}
          disabled={isPayDisabled()}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="size-4 mr-2" />
              {getPaymentButtonLabel()}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (!rentalData) return null;

  return (
    <>
      {/* Mobile: Bottom Drawer */}
      {isMobile ? (
        <Drawer
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen) handleClose();
          }}
        >
          <DrawerContent className="max-h-[92vh] rounded-t-2xl">
            <DrawerTitle className="sr-only">Secure Checkout</DrawerTitle>
            <DrawerDescription className="sr-only">Complete your rental payment</DrawerDescription>
            {renderContent()}
          </DrawerContent>
        </Drawer>
      ) : (
        /* Desktop: Centered Dialog */
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen) handleClose();
          }}
        >
          <DialogContent
            className="sm:max-w-[520px] p-0 gap-0 overflow-hidden"
            onInteractOutside={(e) => {
              if (processing) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              if (processing) e.preventDefault();
            }}
          >
            {renderContent()}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
