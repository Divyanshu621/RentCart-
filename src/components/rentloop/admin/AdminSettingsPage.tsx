'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Truck,
  Settings as SettingsIcon,
  Save,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  IndianRupee,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface PaymentMethodConfig {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  settingKey: string;
  iconBg: string;
  iconColor: string;
}

const paymentMethodConfigs: PaymentMethodConfig[] = [
  {
    id: 'razorpay',
    label: 'Razorpay',
    description: 'UPI, Cards, Net Banking & Wallets via Razorpay gateway',
    icon: <CreditCard className="size-5" />,
    settingKey: 'razorpayEnabled',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'upi',
    label: 'UPI Direct',
    description: 'GPay, PhonePe, Paytm & other UPI apps',
    icon: <Smartphone className="size-5" />,
    settingKey: 'upiEnabled',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    id: 'card',
    label: 'Credit/Debit Card',
    description: 'Visa, Mastercard, Rupay cards',
    icon: <IndianRupee className="size-5" />,
    settingKey: 'cardEnabled',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    description: 'All major Indian banks supported',
    icon: <Building2 className="size-5" />,
    settingKey: 'netbankingEnabled',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    id: 'wallet',
    label: 'Wallets',
    description: 'Paytm, Amazon Pay, Mobikwik & others',
    icon: <Wallet className="size-5" />,
    settingKey: 'walletEnabled',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  {
    id: 'cash',
    label: 'Cash on Pickup',
    description: 'Customer pays cash when picking up the item',
    icon: <Truck className="size-5" />,
    settingKey: 'cashOnPickupEnabled',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
];

export default function AdminSettingsPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.getPaymentSettings();
      // Map API keys (razorpay, cash) to setting keys (razorpayEnabled, cashOnPickupEnabled)
      const keyMap: Record<string, string> = {
        razorpay: 'razorpayEnabled',
        upi: 'upiEnabled',
        card: 'cardEnabled',
        netbanking: 'netbankingEnabled',
        wallet: 'walletEnabled',
        cash: 'cashOnPickupEnabled',
      };
      const mapped: Record<string, boolean> = {};
      for (const [apiKey, enabled] of Object.entries(res.enabledMethods)) {
        mapped[keyMap[apiKey] || apiKey] = enabled as boolean;
      }
      setSettings(mapped);
    } catch {
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = (settingKey: string, checked: boolean) => {
    // Check if disabling would leave no methods enabled
    if (!checked) {
      if (!window.confirm('Are you sure you want to disable this payment method?')) return;
      const otherEnabled = Object.entries(settings).some(([key, val]) => key !== settingKey && val);
      if (!otherEnabled) {
        toast.error('At least one payment method must remain enabled');
        return;
      }
    }
    setSaved(false);
    setSettings((prev) => ({ ...prev, [settingKey]: checked }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Map setting keys back to API keys for the PUT request
      const keyMap: Record<string, string> = {
        razorpayEnabled: 'razorpayEnabled',
        upiEnabled: 'upiEnabled',
        cardEnabled: 'cardEnabled',
        netbankingEnabled: 'netbankingEnabled',
        walletEnabled: 'walletEnabled',
        cashOnPickupEnabled: 'cashOnPickupEnabled',
      };
      const payload: Record<string, boolean> = {};
      for (const [key, val] of Object.entries(settings)) {
        if (keyMap[key] !== undefined) {
          payload[keyMap[key]] = val;
        }
      }
      await api.updatePaymentSettings(payload as Parameters<typeof api.updatePaymentSettings>[0]);
      setSaved(true);
      toast.success('Payment settings saved successfully');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to save settings');
      fetchSettings(); // revert
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(settings).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('admin-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-[#0f172a] flex items-center justify-center">
              <SettingsIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Payment Settings</h1>
              <p className="text-sm text-slate-500">Enable or disable payment methods</p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-100 shrink-0">
              <ShieldCheck className="size-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {enabledCount} of {paymentMethodConfigs.length} methods enabled
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Customers will only see enabled payment methods at checkout
              </p>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-semibold shrink-0">
              {enabledCount} Active
            </Badge>
          </div>
        </motion.div>

        {/* Payment Methods Card */}
        {loading ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-8 flex items-center justify-center">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 shadow-sm mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-900">Payment Methods</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Toggle payment methods on or off. Changes take effect immediately for all customers.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {paymentMethodConfigs.map((method, idx) => {
                  const isEnabled = settings[method.settingKey] ?? false;
                  return (
                    <motion.div
                      key={method.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className={`flex items-center gap-4 p-3.5 rounded-xl transition-colors ${
                        isEnabled ? 'bg-emerald-50/50' : 'bg-slate-50/50'
                      }`}>
                        <div className={`flex items-center justify-center size-10 rounded-lg ${method.iconBg} shrink-0`}>
                          <span className={method.iconColor}>{method.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`toggle-${method.id}`}
                              className="text-sm font-semibold text-slate-900 cursor-pointer"
                            >
                              {method.label}
                            </Label>
                            {isEnabled && (
                              <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 font-semibold border-0">
                                ON
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{method.description}</p>
                        </div>
                        <Switch
                          id={`toggle-${method.id}`}
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleToggle(method.settingKey, checked)}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>
                      {idx < paymentMethodConfigs.length - 1 && (
                        <Separator className="my-1 bg-slate-100" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 sticky bottom-4">
          <Button
            onClick={handleSave}
            disabled={saving || loading || saved}
            className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="size-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
