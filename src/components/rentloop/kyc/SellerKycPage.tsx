'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { SellerKyc as SellerKycType, KycDocStatus, BusinessType, User as UserType } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

import {
  Shield,
  FileCheck,
  CreditCard,
  Building2,
  Upload,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Eye,
  Camera,
  Image as ImageIcon,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

// ─── Document Upload Component ───────────────────────────────
function DocumentUpload({
  label,
  description,
  value,
  onChange,
  required,
  disabled,
}: {
  label: string;
  description: string;
  value?: string;
  onChange: (base64: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Use local upload state, fallback to parent value
  const preview = localPreview || (value || null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLocalPreview(result);
      onChange(result);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (preview) {
    return (
      <div className="relative">
        <div
          className="relative rounded-xl overflow-hidden border-2 border-emerald-200 bg-emerald-50/50 cursor-pointer group"
          onClick={() => !disabled && setShowPreview(!showPreview)}
        >
          <div className="flex items-center gap-3 p-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              <img src={preview} alt={label} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-800">{label}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Document uploaded successfully</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          </div>
        </div>
        {!disabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLocalPreview(null);
              onChange('');
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        {showPreview && !disabled && (
          <div
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <img src={preview} alt={label} className="w-full rounded-xl" />
              <button
                onClick={() => setShowPreview(false)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${
        dragOver ? 'border-emerald-500 bg-emerald-50' : disabled ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-gray-50/50 hover:border-emerald-400 hover:bg-emerald-50/30'
      } ${required && !value ? 'border-amber-300' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${required && !value ? 'bg-amber-100' : 'bg-gray-100'}`}>
          <Camera className={`w-5 h-5 ${required && !value ? 'text-amber-600' : 'text-gray-400'}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-[#0f172a]">{label} {required && <span className="text-red-500">*</span>}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>JPG, PNG up to 5MB</span>
        </div>
      </div>
    </div>
  );
}

// ─── Status Banner ───────────────────────────────────────────
function StatusBanner({ status, rejectionReason }: { status: KycDocStatus; rejectionReason?: string }) {
  const configs: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; title: string; desc: string }> = {
    DRAFT: {
      icon: <FileCheck className="w-5 h-5" />,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      title: 'Complete Your KYC Verification',
      desc: 'Upload your documents below to start selling on RentCart. All fields marked with * are required.',
    },
    SUBMITTED: {
      icon: <Clock className="w-5 h-5" />,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'KYC Submitted for Review',
      desc: 'Your documents are being reviewed by our team. This usually takes 1-2 business days.',
    },
    UNDER_REVIEW: {
      icon: <Eye className="w-5 h-5" />,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'KYC Under Review',
      desc: 'An admin is currently reviewing your documents. You will be notified once the review is complete.',
    },
    VERIFIED: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      title: 'KYC Verified Successfully',
      desc: 'Your seller account is fully verified. You can now list items and accept rental orders.',
    },
    REJECTED: {
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: 'KYC Verification Failed',
      desc: rejectionReason || 'Your documents did not meet our verification standards. Please review and resubmit.',
    },
  };

  const config = configs[status] || configs.DRAFT;

  return (
    <div className={`${config.bg} border ${config.border} rounded-xl p-4 sm:p-5`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.color}`}>{config.icon}</div>
        <div className="flex-1">
          <h3 className={`font-semibold text-sm ${config.color}`}>{config.title}</h3>
          <p className={`text-xs mt-1 ${config.color}/80 leading-relaxed`}>{config.desc}</p>
        </div>
        {status === 'VERIFIED' && (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
          </Badge>
        )}
      </div>
    </div>
  );
}

// ─── Steps Indicator ─────────────────────────────────────────
function StepsIndicator({ currentStep }: { currentStep: number }) {
  const steps = ['Identity', 'Bank Details', 'Business Info'];
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < currentStep
                  ? 'bg-emerald-500 text-white'
                  : i === currentStep
                  ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i < currentStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs sm:text-sm font-medium hidden sm:block ${i <= currentStep ? 'text-[#0f172a]' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className={`w-4 h-4 ${i < currentStep ? 'text-emerald-400' : 'text-gray-300'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function SellerKycPage() {
  const { user, navigate, setUser } = useAppStore();
  const [kyc, setKyc] = useState<SellerKycType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState('');
  const [aadhaarBack, setAadhaarBack] = useState('');
  const [panCard, setPanCard] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');
  const [passbook, setPassbook] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType | ''>('');
  const [businessAddress, setBusinessAddress] = useState('');

  const isLocked = kyc?.status === 'SUBMITTED' || kyc?.status === 'UNDER_REVIEW' || kyc?.status === 'VERIFIED';
  const canEdit = kyc?.status === 'DRAFT' || kyc?.status === 'REJECTED';

  // Fetch KYC data
  useEffect(() => {
    const fetchKyc = async () => {
      try {
        const data = await api.getKycStatus();
        if (data.kyc) {
          const k = data.kyc as unknown as SellerKycType;
          setKyc(k);
          setAadhaarNumber(k.aadhaarNumber || '');
          setPanNumber(k.panNumber || '');
          setGstNumber(k.gstNumber || '');
          setAadhaarFront(k.aadhaarFrontUrl || '');
          setAadhaarBack(k.aadhaarBackUrl || '');
          setPanCard(k.panCardUrl || '');
          setBankAccountNo(k.bankAccountNo || '');
          setBankIfsc(k.bankIfsc || '');
          setBankName(k.bankName || '');
          setBankHolderName(k.bankHolderName || '');
          setPassbook(k.passbookUrl || '');
          setBusinessName(k.businessName || '');
          setBusinessType(k.businessType || '');
          setBusinessAddress(k.businessAddress || '');

          // Set step based on progress
          if (k.aadhaarNumber && k.panNumber && k.aadhaarFrontUrl) setCurrentStep(1);
          if (k.bankAccountNo && k.bankIfsc) setCurrentStep(2);
        }
      } catch {
        toast.error('Failed to load KYC status');
      } finally {
        setLoading(false);
      }
    };
    fetchKyc();
  }, []);

  // Calculate completion progress
  const getProgress = () => {
    let filled = 0;
    const total = 8;
    if (aadhaarNumber) filled++;
    if (panNumber) filled++;
    if (aadhaarFront) filled++;
    if (aadhaarBack) filled++;
    if (panCard) filled++;
    if (bankAccountNo) filled++;
    if (bankIfsc) filled++;
    if (bankHolderName) filled++;
    return Math.round((filled / total) * 100);
  };

  const saveDraft = useCallback(async () => {
    if (!canEdit) return;
    try {
      await api.saveKycDraft({
        aadhaarNumber, panNumber, gstNumber,
        aadhaarFrontUrl: aadhaarFront, aadhaarBackUrl: aadhaarBack, panCardUrl: panCard,
        bankAccountNo, bankIfsc, bankName, bankHolderName, passbookUrl: passbook,
        businessName, businessType, businessAddress,
      });
    } catch {
      // Silent fail for draft save
    }
  }, [canEdit, aadhaarNumber, panNumber, gstNumber, aadhaarFront, aadhaarBack, panCard, bankAccountNo, bankIfsc, bankName, bankHolderName, passbook, businessName, businessType, businessAddress]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.submitKyc({
        aadhaarNumber, panNumber, gstNumber,
        aadhaarFrontUrl: aadhaarFront, aadhaarBackUrl: aadhaarBack, panCardUrl: panCard,
        bankAccountNo, bankIfsc, bankName, bankHolderName, passbookUrl: passbook,
        businessName, businessType: businessType || undefined, businessAddress,
      });
      toast.success('KYC documents submitted successfully!');
      // Refresh user data
      try {
        const meData = await api.me();
        setUser((meData as Record<string, unknown>).user as unknown as UserType);
      } catch {}
      // Refresh KYC
      const data = await api.getKycStatus();
      if (data.kyc) setKyc(data.kyc as unknown as SellerKycType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatAadhaar = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatPan = (val: string) => {
    return val.toUpperCase().slice(0, 10).replace(/[^A-Z0-9]/g, '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => navigate('dashboard')}
          className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">Seller Verification</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Complete KYC to start listing items</p>
        </div>
      </div>

      {/* Status Banner */}
      {kyc && <StatusBanner status={kyc.status} rejectionReason={kyc.rejectionReason || undefined} />}

      {/* Progress */}
      {canEdit && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Completion Progress</span>
            <span className="text-xs font-bold text-emerald-600">{getProgress()}%</span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>
      )}

      {/* Steps */}
      {canEdit && (
        <div className="mt-4 p-3 bg-white rounded-xl border border-gray-200">
          <StepsIndicator currentStep={currentStep} />
        </div>
      )}

      {/* Step Content */}
      <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
        {/* Step 1: Identity Documents */}
        {(canEdit || isLocked) && (
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Identity Documents</CardTitle>
                  <CardDescription className="text-xs">Aadhaar Card & PAN Card</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Aadhaar Number <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="XXXX XXXX XXXX"
                  value={aadhaarNumber}
                  onChange={(e) => { setAadhaarNumber(formatAadhaar(e.target.value)); if (aadhaarNumber) setCurrentStep(0); }}
                  disabled={isLocked}
                  className="h-11"
                  maxLength={14}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">PAN Number <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(formatPan(e.target.value))}
                  disabled={isLocked}
                  className="h-11 uppercase"
                  maxLength={10}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium text-[#0f172a]">Upload Document Photos</p>
                <DocumentUpload
                  label="Aadhaar Card (Front)"
                  description="Photo side with your name and Aadhaar number"
                  value={aadhaarFront}
                  onChange={(v) => { setAadhaarFront(v); setCurrentStep(0); }}
                  required={!isLocked}
                  disabled={isLocked}
                />
                <DocumentUpload
                  label="Aadhaar Card (Back)"
                  description="Address side of your Aadhaar card"
                  value={aadhaarBack}
                  onChange={setAadhaarBack}
                  required={!isLocked}
                  disabled={isLocked}
                />
                <DocumentUpload
                  label="PAN Card"
                  description="Clear photo of your PAN card"
                  value={panCard}
                  onChange={(v) => { setPanCard(v); setCurrentStep(0); }}
                  required={!isLocked}
                  disabled={isLocked}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Bank Details */}
        {(canEdit || isLocked) && (
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Bank Account Details</CardTitle>
                  <CardDescription className="text-xs">For receiving rental payments</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Account Holder Name <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Name as on bank account"
                    value={bankHolderName}
                    onChange={(e) => { setBankHolderName(e.target.value); setCurrentStep(1); }}
                    disabled={isLocked}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Bank Name</Label>
                  <Input
                    placeholder="e.g., SBI, HDFC, ICICI"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    disabled={isLocked}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Account Number <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Enter account number"
                    value={bankAccountNo}
                    onChange={(e) => { setBankAccountNo(e.target.value.replace(/\D/g, '')); setCurrentStep(1); }}
                    disabled={isLocked}
                    className="h-11"
                    maxLength={18}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">IFSC Code <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g., SBIN0001234"
                    value={bankIfsc}
                    onChange={(e) => { setBankIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setCurrentStep(1); }}
                    disabled={isLocked}
                    className="h-11 uppercase"
                    maxLength={11}
                  />
                </div>
              </div>
              <Separator className="my-2" />
              <DocumentUpload
                label="Bank Passbook / Cancelled Cheque"
                description="Optional but recommended for faster verification"
                value={passbook}
                onChange={setPassbook}
                disabled={isLocked}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 3: Business Info */}
        {(canEdit || isLocked) && (
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Business Information</CardTitle>
                  <CardDescription className="text-xs">Optional - for business/registered sellers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Business Name</Label>
                  <Input
                    placeholder="Your business name"
                    value={businessName}
                    onChange={(e) => { setBusinessName(e.target.value); setCurrentStep(2); }}
                    disabled={isLocked}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Business Type</Label>
                  <Select value={businessType} onValueChange={(v) => { setBusinessType(v as BusinessType); setCurrentStep(2); }} disabled={isLocked}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="PROPRIETORSHIP">Proprietorship</SelectItem>
                      <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                      <SelectItem value="LLP">LLP</SelectItem>
                      <SelectItem value="PRIVATE_LIMITED">Private Limited</SelectItem>
                      <SelectItem value="COMPANY">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">GST Number</Label>
                <Input
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  disabled={isLocked}
                  className="h-11 uppercase"
                  maxLength={15}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Business Address</Label>
                <Textarea
                  placeholder="Registered business address"
                  value={businessAddress}
                  onChange={(e) => { setBusinessAddress(e.target.value); setCurrentStep(2); }}
                  disabled={isLocked}
                  className="resize-none"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        {canEdit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-800">Your Data is Secure</p>
                  <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">All documents are encrypted and stored securely. We never share your personal data.</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">Important Notes</p>
                  <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">Ensure document photos are clear and readable. Mismatched details will cause rejection.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Submit Buttons */}
      {canEdit && (
        <div className="fixed bottom-16 left-0 right-0 md:bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-3 sm:p-4 z-30 safe-area-bottom">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await saveDraft();
                  toast.success('Draft saved');
                  navigate('dashboard');
                } catch {
                  toast.error('Failed to save draft. Please try again.');
                }
              }}
              className="h-11 flex-1 sm:flex-none sm:px-6"
            >
              Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-11 flex-[2] sm:flex-none sm:px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
              ) : (
                <><FileCheck className="w-4 h-4 mr-2" /> Submit for Verification</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Verified - Go to Dashboard */}
      {kyc?.status === 'VERIFIED' && (
        <div className="fixed bottom-16 left-0 right-0 md:bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-3 sm:p-4 z-30 safe-area-bottom">
          <div className="max-w-3xl mx-auto">
            <Button
              onClick={() => navigate('dashboard')}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              Go to Dashboard
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
