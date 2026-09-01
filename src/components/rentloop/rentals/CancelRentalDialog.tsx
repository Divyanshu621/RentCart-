'use client';

import { useState } from 'react';
import { XCircle, AlertTriangle, IndianRupee, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import type { RentalStatus } from '@/types';

// ─── Cancel reason options ─────────────────────────────────
const CANCEL_REASONS = [
  'No longer need the item',
  'Found a better deal elsewhere',
  'Changed my plans',
  'Delivery/pickup timing issue',
  'Item condition concern',
  'Financial constraints',
  'Other',
];

// Statuses where full refund applies
const FULL_REFUND_STATUSES: RentalStatus[] = ['PENDING_PAYMENT', 'OWNER_PENDING'];
const CANCELLABLE_STATUSES: RentalStatus[] = [
  'PENDING_PAYMENT',
  'PAYMENT_COMPLETED',
  'OWNER_PENDING',
  'OWNER_ACCEPTED',
  'READY_FOR_PICKUP',
];

// ─── Props ─────────────────────────────────────────────────
interface CancelRentalDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  rentalStatus: RentalStatus;
  productName: string;
  totalAmount: number;
  isPending: boolean;
  isSuccess?: boolean;
}

export default function CancelRentalDialog({
  open,
  onClose,
  onConfirm,
  rentalStatus,
  productName,
  totalAmount,
  isPending,
  isSuccess = false,
}: CancelRentalDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');

  const isFullRefund = FULL_REFUND_STATUSES.includes(rentalStatus);
  const isCancellable = CANCELLABLE_STATUSES.includes(rentalStatus);

  const refundAmount = isFullRefund
    ? totalAmount
    : Math.round(totalAmount * 0.9);
  const cancellationFee = isFullRefund ? 0 : totalAmount - refundAmount;

  const handleConfirm = () => {
    const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!reason) return;
    onConfirm(reason);
  };

  const handleClose = () => {
    if (!isPending) {
      setSelectedReason('');
      setCustomReason('');
      setStep('confirm');
      onClose();
    }
  };

  // Derive effective step from parent's isSuccess signal to avoid setState during render
  const effectiveStep = isSuccess ? 'success' : step;

  if (!isCancellable) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-gray-200">
        <AnimatePresence mode="wait">
          {effectiveStep === 'confirm' ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6"
            >
              <DialogHeader className="text-left mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-[#0f172a]">Cancel Rental</DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 mt-0.5">
                      Are you sure you want to cancel?
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Product info */}
              <div className="p-3 bg-gray-50 rounded-xl mb-4">
                <p className="text-sm font-medium text-[#0f172a] truncate">{productName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total: ₹{totalAmount.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Refund info */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
                <p className="text-sm font-semibold text-emerald-800 mb-2">
                  {isFullRefund ? 'Full Refund' : 'Refund Details'}
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-emerald-700">
                    <span>Refund amount</span>
                    <span className="font-semibold">₹{refundAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {!isFullRefund && (
                    <div className="flex justify-between text-red-600">
                      <span>Cancellation fee (10%)</span>
                      <span>-₹{cancellationFee.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-emerald-600 mt-2">
                  {isFullRefund
                    ? 'Full amount will be refunded to your original payment method.'
                    : 'Refund will be processed within 5-7 business days.'}
                </p>
              </div>

              {/* Reason selection */}
              <div className="mb-4">
                <label className="text-sm font-medium text-[#0f172a] mb-2 block">
                  Reason for cancellation <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {CANCEL_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setSelectedReason(reason)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors border ${
                        selectedReason === reason
                          ? 'border-red-300 bg-red-50 text-red-700 font-medium'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom reason input */}
              {selectedReason === 'Other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <Textarea
                    placeholder="Please describe your reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="rounded-xl border-gray-200 min-h-[80px] resize-none text-sm"
                    autoFocus
                  />
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl border-gray-200 text-[#0f172a] hover:bg-gray-50"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Keep Rental
                </Button>
                <Button
                  className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium"
                  onClick={handleConfirm}
                  disabled={isPending || !selectedReason || (selectedReason === 'Other' && !customReason.trim())}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1.5" />
                  )}
                  Cancel Rental
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 flex flex-col items-center text-center py-10"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-1">Rental Cancelled</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-xs">
                {isFullRefund
                  ? 'Your full refund will be processed within 5-7 business days.'
                  : `₹${refundAmount.toLocaleString('en-IN')} will be refunded to your payment method within 5-7 business days.`}
              </p>
              <div className="p-3 bg-gray-50 rounded-xl mb-6 w-full max-w-xs">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Refund</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {refundAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <Button
                className="h-11 rounded-xl px-8 bg-[#0f172a] hover:bg-[#0f172a]/90 text-white"
                onClick={handleClose}
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
