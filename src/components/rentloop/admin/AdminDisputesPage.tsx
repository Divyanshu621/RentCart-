'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Gavel,
  Loader2,
  User,
  Package,
  Calendar,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Dispute } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-700 border-amber-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700 border-blue-200',
  CUSTOMER_RESPONSE: 'bg-sky-100 text-sky-700 border-sky-200',
  OWNER_RESPONSE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  OPEN: 'Open',
  UNDER_REVIEW: 'Under Review',
  CUSTOMER_RESPONSE: 'Awaiting Customer',
  OWNER_RESPONSE: 'Awaiting Owner',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminDisputesPage() {
  const navigate = useAppStore((s) => s.navigate);
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => api.getDisputes().then((data: any) => Array.isArray(data?.disputes) ? data.disputes as Dispute[] : []),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.updateDispute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute updated successfully');
      setExpandedId(null);
      setResolutionStatus('');
      setResolutionNotes('');
    },
    onError: () => {
      toast.error('Failed to update dispute');
    },
  });

  const handleResolve = (disputeId: string) => {
    if (!resolutionStatus) {
      toast.error('Please select a resolution status');
      return;
    }
    updateMutation.mutate({
      id: disputeId,
      data: {
        status: resolutionStatus,
        adminNotes: resolutionNotes,
        resolution: resolutionNotes,
      },
    });
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setResolutionStatus('');
      setResolutionNotes('');
    } else {
      setExpandedId(id);
      setResolutionStatus('');
      setResolutionNotes('');
    }
  };

  const canResolve = (dispute: Dispute) =>
    dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('admin-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Gavel className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Disputes</h1>
              <p className="text-sm text-slate-500">
                {disputes.length} total dispute{disputes.length !== 1 ? 's' : ''}
                {disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length > 0 && (
                  <span className="text-amber-600 font-medium">
                    {' '}({disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length} active)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Gavel className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No disputes</h3>
            <p className="text-sm text-slate-500">All is well! No open disputes at this time.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {disputes.map((dispute) => (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  layout
                >
                  <Card className="border-slate-200 shadow-sm overflow-hidden">
                    {/* Dispute Header - Clickable */}
                    <button
                      className="w-full p-4 text-left"
                      onClick={() => toggleExpand(dispute.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0 mt-0.5">
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                            {getInitials(dispute.raisedBy?.name || '?')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-sm text-slate-900">
                              {dispute.reason}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[dispute.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {statusLabels[dispute.status] || dispute.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">{dispute.description}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {dispute.raisedBy?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {dispute.rental?.product?.title || 'Rental #' + dispute.rentalId.slice(-6).toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(dispute.createdAt), 'dd MMM yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 mt-1">
                          {expandedId === dispute.id ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedId === dispute.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                            {/* Full description */}
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-slate-700 mb-1">Description</h4>
                              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3">
                                {dispute.description}
                              </p>
                            </div>

                            {/* Rental info */}
                            {dispute.rental && (
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Rental Information</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 rounded-lg p-3">
                                  <div>
                                    <span className="text-slate-500 text-xs">Product</span>
                                    <p className="font-medium text-slate-900 text-xs">
                                      {dispute.rental.product?.title}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 text-xs">Customer</span>
                                    <p className="font-medium text-slate-900 text-xs">
                                      {dispute.rental.customer?.name}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 text-xs">Owner</span>
                                    <p className="font-medium text-slate-900 text-xs">
                                      {dispute.rental.owner?.name}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 text-xs">Amount</span>
                                    <p className="font-medium text-emerald-600 text-xs">
                                      ₹{dispute.rental.totalAmount?.toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Previous admin notes */}
                            {dispute.adminNotes && (
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-slate-700 mb-1">Admin Notes</h4>
                                <p className="text-sm text-slate-600 leading-relaxed bg-blue-50 rounded-lg p-3 border border-blue-100">
                                  {dispute.adminNotes}
                                </p>
                              </div>
                            )}

                            {/* Resolution Form for OPEN/UNDER_REVIEW */}
                            {canResolve(dispute) && (
                              <div className="border-t border-slate-200 pt-4">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  Resolve Dispute
                                </h4>
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                                      Resolution Status
                                    </label>
                                    <Select value={resolutionStatus} onValueChange={setResolutionStatus}>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select status..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                        <SelectItem value="CUSTOMER_RESPONSE">Request Customer Response</SelectItem>
                                        <SelectItem value="OWNER_RESPONSE">Request Owner Response</SelectItem>
                                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                                      Resolution Notes
                                    </label>
                                    <Textarea
                                      placeholder="Enter resolution details, actions taken, or decision reasoning..."
                                      value={resolutionNotes}
                                      onChange={(e) => setResolutionNotes(e.target.value)}
                                      rows={3}
                                      className="resize-none"
                                    />
                                  </div>
                                  <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleResolve(dispute.id)}
                                    disabled={updateMutation.isPending}
                                  >
                                    {updateMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <Send className="h-4 w-4 mr-2" />
                                    )}
                                    Submit Resolution
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Show resolution for closed disputes */}
                            {(dispute.status === 'RESOLVED' || dispute.status === 'REJECTED') && dispute.resolution && (
                              <div className="border-t border-slate-200 pt-4">
                                <h4 className="text-sm font-semibold text-slate-700 mb-1">
                                  Resolution
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                  {dispute.resolution}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
