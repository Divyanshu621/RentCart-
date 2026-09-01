'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  X,
  CalendarRange,
  Clock,
  IndianRupee,
  User,
  MapPin,
  Package,
  CreditCard,
  CheckCircle2,
  Circle,
  Loader2,
  RotateCcw,
  Timer,
  Phone,
  AlertTriangle,
  ArrowRight,
  Send,
  Star,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Rental, RentalStatus, Payment, ExtensionRequest } from '@/types';
import { toast } from 'sonner';
import CancelRentalDialog from './CancelRentalDialog';

// ─── Status Color Mapping ──────────────────────────────────
const statusColors: Record<RentalStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700 border-amber-200',
  PAYMENT_COMPLETED: 'bg-sky-100 text-sky-700 border-sky-200',
  OWNER_PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  OWNER_ACCEPTED: 'bg-blue-100 text-blue-700 border-blue-200',
  OWNER_REJECTED: 'bg-red-100 text-red-700 border-red-200',
  READY_FOR_PICKUP: 'bg-sky-100 text-sky-700 border-sky-200',
  OUT_FOR_DELIVERY: 'bg-sky-100 text-sky-700 border-sky-200',
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  RETURN_PENDING: 'bg-orange-100 text-orange-700 border-orange-200',
  RETURNED: 'bg-blue-100 text-blue-700 border-blue-200',
  INSPECTION: 'bg-sky-100 text-sky-700 border-sky-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
  DISPUTED: 'bg-red-100 text-red-700 border-red-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<RentalStatus, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  PAYMENT_COMPLETED: 'Payment Completed',
  OWNER_PENDING: 'Pending Owner Approval',
  OWNER_ACCEPTED: 'Owner Accepted',
  OWNER_REJECTED: 'Owner Rejected',
  READY_FOR_PICKUP: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  ACTIVE: 'Active',
  RETURN_PENDING: 'Return Pending',
  RETURNED: 'Returned',
  INSPECTION: 'Under Inspection',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
  OVERDUE: 'Overdue',
};

// Status flow timeline
const statusFlow: RentalStatus[] = [
  'PENDING_PAYMENT', 'PAYMENT_COMPLETED', 'OWNER_PENDING', 'OWNER_ACCEPTED',
  'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'ACTIVE', 'RETURN_PENDING',
  'RETURNED', 'INSPECTION', 'COMPLETED',
];

const paymentTypeLabels: Record<string, string> = {
  RENTAL: 'Rental',
  DEPOSIT: 'Security Deposit',
  EXTENSION: 'Extension',
  REFUND: 'Refund',
  LATE_FEE: 'Late Fee',
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-sky-100 text-sky-700',
};

const extensionStatusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

// ─── Props ─────────────────────────────────────────────────
interface RentalDetailDialogProps {
  rentalId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function RentalDetailDialog({ rentalId, open, onClose }: RentalDetailDialogProps) {
  const user = useAppStore((s) => s.user);
  const navigate = useAppStore((s) => s.navigate);
  const queryClient = useQueryClient();

  const { data: rental, isLoading } = useQuery({
    queryKey: ['rental', rentalId],
    queryFn: async () => {
      const data = await api.getRental(rentalId!);
      return (data as any)?.rental as Rental;
    },
    enabled: !!rentalId && open,
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => api.payRental(id),
    onSuccess: () => { toast.success('Payment successful!'); queryClient.invalidateQueries({ queryKey: ['rental', rentalId] }); queryClient.invalidateQueries({ queryKey: ['rentals'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.cancelRental(id, reason),
    onSuccess: () => { setCancelSuccess(true); queryClient.invalidateQueries({ queryKey: ['rental', rentalId] }); queryClient.invalidateQueries({ queryKey: ['rentals'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.acceptRental(id),
    onSuccess: () => { toast.success('Rental accepted!'); queryClient.invalidateQueries({ queryKey: ['rental', rentalId] }); queryClient.invalidateQueries({ queryKey: ['rentals'] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.rejectRental(id),
    onSuccess: () => { toast.success('Rental rejected'); queryClient.invalidateQueries({ queryKey: ['rental', rentalId] }); queryClient.invalidateQueries({ queryKey: ['rentals'] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => api.returnRental(id),
    onSuccess: () => { toast.success('Return initiated'); queryClient.invalidateQueries({ queryKey: ['rental', rentalId] }); queryClient.invalidateQueries({ queryKey: ['rentals'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const respondExtMutation = useMutation({
    mutationFn: ({ rentalId, extId, approved }: { rentalId: string; extId: string; approved: boolean }) =>
      api.respondExtension(rentalId, extId, { approved }),
    onSuccess: () => { toast.success('Extension response recorded'); queryClient.invalidateQueries({ queryKey: ['rental', rentalId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const isOwner = user?.id === rental?.ownerId;
  const isCustomer = user?.id === rental?.customerId;

  const getCurrentStepIndex = () => {
    if (!rental) return -1;
    const idx = statusFlow.indexOf(rental.status);
    if (idx !== -1) return idx;
    if (rental.status === 'CANCELLED') return statusFlow.indexOf('OWNER_PENDING');
    if (rental.status === 'OVERDUE') return statusFlow.indexOf('ACTIVE');
    if (rental.status === 'DISPUTED') return statusFlow.indexOf('ACTIVE');
    if (rental.status === 'OWNER_REJECTED') return statusFlow.indexOf('OWNER_PENDING');
    return -1;
  };

  const currentStep = getCurrentStepIndex();

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0 sticky top-0 bg-white z-10 border-b border-slate-100 rounded-t-lg">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-lg font-bold text-slate-900">Rental Details</DialogTitle>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading || !rental ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[rental.status]}`}>
                {statusLabels[rental.status]}
              </span>
              <span className="text-xs text-slate-400">ID: {rental.id.slice(0, 8)}</span>
            </div>

            {/* Product Info */}
            <div
              className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => { onClose(); navigate('product', { productId: rental.productId }); }}
            >
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-slate-400 to-gray-300 flex items-center justify-center shrink-0">
                <Package className="h-8 w-8 text-white/80" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm">{rental.product.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Condition: {rental.product.condition.replace('_', ' ')}</p>
                {rental.product.pickupAddress && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <MapPin className="h-3 w-3" />{rental.product.pickupAddress}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-emerald-600">₹{rental.dailyRate.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-400">/day</p>
              </div>
            </div>

            {/* People */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    {rental.customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Renter</p>
                  <p className="text-sm font-medium text-slate-900 truncate">{rental.customer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-sky-100 text-sky-700 text-xs font-semibold">
                    {rental.owner.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Owner</p>
                  <p className="text-sm font-medium text-slate-900 truncate">{rental.owner.name}</p>
                </div>
              </div>
            </div>

            {/* Dates & Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <CalendarRange className="h-3 w-3" />Start Date
                </div>
                <p className="text-sm font-medium text-slate-900">{format(new Date(rental.startDate), 'dd MMM yyyy')}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <CalendarRange className="h-3 w-3" />End Date
                </div>
                <p className="text-sm font-medium text-slate-900">{format(new Date(rental.endDate), 'dd MMM yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{rental.rentalDays} days rental period</span>
            </div>

            <Separator />

            {/* Pricing Breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Pricing Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Rental ({rental.rentalDays} days × ₹{rental.dailyRate.toLocaleString('en-IN')})</span><span className="text-slate-900">₹{rental.rentalAmount.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Platform Fee (10%)</span><span className="text-slate-900">₹{rental.platformFee.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">GST (18%)</span><span className="text-slate-900">₹{rental.tax.toLocaleString('en-IN')}</span></div>
                {rental.deliveryFee > 0 && (
                  <div className="flex justify-between"><span className="text-slate-500">Delivery Fee</span><span className="text-slate-900">₹{rental.deliveryFee.toLocaleString('en-IN')}</span></div>
                )}
                {rental.discount > 0 && (
                  <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{rental.discount.toLocaleString('en-IN')}</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-500">Security Deposit</span><span className="text-slate-900">₹{rental.securityDeposit.toLocaleString('en-IN')}</span></div>
                {rental.totalLateFee > 0 && (
                  <div className="flex justify-between text-red-600"><span>Late Fee</span><span>₹{rental.totalLateFee.toLocaleString('en-IN')}</span></div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base"><span className="text-slate-900">Total</span><span className="text-emerald-600">₹{rental.totalAmount.toLocaleString('en-IN')}</span></div>
              </div>
            </div>

            <Separator />

            {/* Status Timeline */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Status Timeline</h4>
              <div className="relative pl-6">
                {statusFlow.map((step, idx) => {
                  const isReached = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  const isRejected = rental.status === 'OWNER_REJECTED' && step === 'OWNER_ACCEPTED';
                  const isCancelled = rental.status === 'CANCELLED';
                  const showTerminal = (isRejected || isCancelled || rental.status === 'OVERDUE' || rental.status === 'DISPUTED') && idx === currentStep;

                  return (
                    <div key={step} className="relative pb-4 last:pb-0">
                      {/* Vertical line */}
                      {idx < statusFlow.length - 1 && (
                        <div className={`absolute left-[-18px] top-5 w-0.5 h-full ${isReached && !isRejected ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                      )}
                      {/* Circle */}
                      <div className={`absolute left-[-24px] top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        isRejected || showTerminal
                          ? 'border-red-400 bg-red-100'
                          : isCurrent
                            ? 'border-emerald-500 bg-emerald-500'
                            : isReached
                              ? 'border-emerald-400 bg-emerald-400'
                              : 'border-slate-300 bg-white'
                      }`}>
                        {(isCurrent || isReached) && !isRejected && !showTerminal && (
                          <CheckCircle2 className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                        )}
                        {isRejected && <X className="h-2.5 w-2.5 text-red-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${isCurrent ? 'text-emerald-700' : isReached && !isRejected ? 'text-slate-700' : 'text-slate-400'}`}>
                          {statusLabels[step]}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Current</span>
                        )}
                      </div>
                      {/* Show terminal status label */}
                      {showTerminal && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <ArrowRight className="h-3 w-3 text-red-400" />
                          <span className={`text-xs font-semibold ${statusColors[rental.status]}`}>{statusLabels[rental.status]}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Payment History */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Payment History</h4>
              {rental.payments && rental.payments.length > 0 ? (
                <div className="space-y-2">
                  {(rental.payments as Payment[]).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          payment.type === 'REFUND' ? 'bg-sky-100' : 'bg-emerald-100'
                        }`}>
                          {payment.type === 'REFUND' ? (
                            <RotateCcw className="h-4 w-4 text-sky-600" />
                          ) : (
                            <CreditCard className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{paymentTypeLabels[payment.type] || payment.type}</p>
                          <p className="text-[11px] text-slate-400">{format(new Date(payment.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${payment.type === 'REFUND' ? 'text-sky-600' : 'text-slate-900'}`}>
                          {payment.type === 'REFUND' ? '+' : '-'}₹{payment.amount.toLocaleString('en-IN')}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${paymentStatusColors[payment.status]}`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No payments yet.</p>
              )}
            </div>

            {/* Extension Requests */}
            {rental.extensionRequests && rental.extensionRequests.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Extension Requests</h4>
                  <div className="space-y-2">
                    {(rental.extensionRequests as ExtensionRequest[]).map((ext) => (
                      <div key={ext.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-900">+{ext.requestedDays} days</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${extensionStatusColors[ext.status]}`}>
                            {ext.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">New end: {format(new Date(ext.newEndDate), 'dd MMM yyyy')} • Fee: ₹{ext.additionalFee.toLocaleString('en-IN')}</p>
                        {ext.reason && <p className="text-xs text-slate-400 mt-1 italic">&quot;{ext.reason}&quot;</p>}
                        {ext.status === 'PENDING' && isOwner && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              className="h-7 px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={respondExtMutation.isPending}
                              onClick={() => respondExtMutation.mutate({ rentalId: rental.id, extId: ext.id, approved: true })}
                            >
                              {respondExtMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-3 text-[11px] border-red-200 text-red-600 hover:bg-red-50"
                              disabled={respondExtMutation.isPending}
                              onClick={() => respondExtMutation.mutate({ rentalId: rental.id, extId: ext.id, approved: false })}
                            >
                              <X className="h-3 w-3 mr-1" />Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {rental.status === 'PENDING_PAYMENT' && isCustomer && (
                <>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={payMutation.isPending} onClick={() => payMutation.mutate(rental.id)}>
                    {payMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}Pay Now
                  </Button>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setCancelDialogOpen(true)}>
                    <X className="h-4 w-4 mr-2" />Cancel
                  </Button>
                </>
              )}
              {rental.status === 'OWNER_PENDING' && isOwner && (
                <>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={acceptMutation.isPending} onClick={() => acceptMutation.mutate(rental.id)}>
                    {acceptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}Accept Request
                  </Button>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" disabled={rejectMutation.isPending} onClick={() => rejectMutation.mutate(rental.id)}>
                    {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}Reject
                  </Button>
                </>
              )}
              {rental.status === 'OWNER_PENDING' && isCustomer && (
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setCancelDialogOpen(true)}>
                  <X className="h-4 w-4 mr-2" />Cancel
                </Button>
              )}
              {(rental.status === 'PAYMENT_COMPLETED' || rental.status === 'OWNER_ACCEPTED' || rental.status === 'READY_FOR_PICKUP') && isCustomer && (
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setCancelDialogOpen(true)}>
                  <X className="h-4 w-4 mr-2" />Cancel Rental
                </Button>
              )}
              {(rental.status === 'ACTIVE' || rental.status === 'OVERDUE') && isCustomer && (
                <Button className={rental.status === 'OVERDUE' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} disabled={returnMutation.isPending} onClick={() => returnMutation.mutate(rental.id)}>
                  {returnMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                  {rental.status === 'OVERDUE' ? 'Return Now' : 'Start Return'}
                </Button>
              )}
              {rental.status === 'RETURN_PENDING' && isOwner && (
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={returnMutation.isPending} onClick={() => returnMutation.mutate(rental.id)}>
                  {returnMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}Confirm Return
                </Button>
              )}
              {rental.status === 'COMPLETED' && isCustomer && (
                <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => { onClose(); navigate('product', { productId: rental.productId }); }}>
                  Rent Again
                </Button>
              )}
              {rental.status === 'OVERDUE' && isCustomer && (
                <Button variant="outline" onClick={() => toast.info('Message feature coming soon!')}>
                  <Phone className="h-4 w-4 mr-2" />Contact Owner
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Cancel Dialog - rendered outside parent dialog */}
    <CancelRentalDialog
      open={cancelDialogOpen}
      onClose={() => { setCancelDialogOpen(false); setCancelSuccess(false); onClose(); }}
      onConfirm={(reason) => cancelMutation.mutate({ id: rental!.id, reason })}
      rentalStatus={rental?.status as RentalStatus}
      productName={rental?.product?.title || ''}
      totalAmount={rental?.totalAmount || 0}
      isPending={cancelMutation.isPending}
      isSuccess={cancelSuccess}
    />
    </>);
}
