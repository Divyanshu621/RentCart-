'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  CreditCard,
  Package,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Bell,
  BellOff,
  ArrowLeft,
  Loader2,
  CheckCheck,
  Star,
  ShieldCheck,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Notification, AppView } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const typeConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  RENTAL_REQUEST: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
  PAYMENT: { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  REFUND: { icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
  RETURN: { icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
  MESSAGE: { icon: MessageCircle, color: 'text-violet-600', bg: 'bg-violet-50' },
  DISPUTE: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  VERIFICATION: { icon: ShieldCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
  REVIEW: { icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
  RENTAL_APPROVED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  RENTAL_REJECTED: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  RENTAL_COMPLETED: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  OVERDUE: { icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
  EXTENSION: { icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50' },
  COUPON: { icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
};

const defaultConfig = { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-50' };

interface NotificationsPanelProps {
  mode?: 'dropdown' | 'fullpage';
  onClose?: () => void;
}

export default function NotificationsPanel({ mode = 'fullpage', onClose }: NotificationsPanelProps) {
  const user = useAppStore((s) => s.user);
  const navigate = useAppStore((s) => s.navigate);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications().then((data: any) => Array.isArray(data?.notifications) ? data.notifications as Notification[] : []),
    enabled: !!user,
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.markNotificationsRead(undefined, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      useAppStore.getState().setUnreadCount(0);
      toast.success('All notifications marked as read');
    },
  });

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) {
      api.markNotificationsRead([notif.id]).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
    if (notif.data) {
      try {
        const data = JSON.parse(notif.data);
        if (data.view) {
          const viewMap: Record<string, string> = {
            rental: 'my-rentals',
            product: 'product',
            messages: 'messages',
            'my-rentals': 'my-rentals',
          };
          const resolvedView = viewMap[data.view];
          if (resolvedView) {
            const navData: Record<string, unknown> = {};
            if (data.productId) navData.productId = data.productId;
            if (data.rentalId) navData.rentalId = data.rentalId;
            navigate(resolvedView as AppView, navData);
          }
        }
      } catch {
        // ignore parse errors
      }
    }
    onClose?.();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const content = (
    <div className={mode === 'fullpage' ? 'min-h-screen bg-slate-50' : ''}>
      {mode === 'fullpage' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
              <p className="text-sm text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                {markAllMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <CheckCheck className="h-4 w-4 mr-1" />
                )}
                Mark all read
              </Button>
            )}
          </div>
        </div>
      )}

      <div className={mode === 'fullpage' ? 'max-w-2xl mx-auto px-4 pb-6' : ''}>
        {mode === 'dropdown' && notifications.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <span className="text-xs font-medium text-slate-500">Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                Mark all read
              </Button>
            )}
          </div>
        )}

        <ScrollArea className={mode === 'dropdown' ? 'h-96' : 'max-h-[calc(100vh-200px)]'}>
          {isLoading ? (
            <div className="space-y-3 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <BellOff className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-700 mb-1">No notifications</h3>
              <p className="text-sm text-slate-500">
                You&apos;re all caught up! We&apos;ll notify you when something comes up.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notif, idx) => {
                const config = typeConfig[notif.type] || defaultConfig;
                const Icon = config.icon;
                return (
                  <motion.button
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full flex items-start gap-3 p-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                      !notif.isRead ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-full ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${!notif.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </ScrollArea>
      </div>
    </div>
  );

  return content;
}
