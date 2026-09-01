'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldX,
  Eye,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Check,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { User } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  OWNER: 'bg-emerald-100 text-emerald-700',
  CUSTOMER: 'bg-sky-100 text-sky-700',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  OWNER: 'Owner',
  CUSTOMER: 'Customer',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminUsersPage() {
  const navigate = useAppStore((s) => s.navigate);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const params: Record<string, string> = { page: String(page) };
  if (search) params.search = search;
  if (roleFilter !== 'all') params.role = roleFilter;
  if (statusFilter !== 'all') params.status = statusFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter, statusFilter],
    queryFn: () => api.getAdminUsers(params),
  });

  const users = ((data as { users?: User[] })?.users || []) as User[];
  const total = (data as { total?: number })?.total || 0;
  const totalPages = (data as { totalPages?: number })?.totalPages || 1;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.updateAdminUser(id, data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const action = vars.data.action as string;
      toast.success(`User ${action} successfully`);
    },
    onError: () => {
      toast.error('Failed to update user');
    },
  });

  const handleAction = (userId: string, action: string, extraData?: Record<string, unknown>) => {
    updateMutation.mutate({ id: userId, data: { action, ...extraData } });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('admin-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500">{total} total users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg font-medium">No users found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : isMobile ? (
          /* Mobile: Card Layout */
          <div className="space-y-3">
            <AnimatePresence>
              {users.map((u) => (
                <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-sm font-medium">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm text-slate-900">{u.name}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${roleColors[u.role] || 'bg-slate-100 text-slate-600'}`}>
                              {roleLabels[u.role] || u.role}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {u.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {u.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {u.email}
                          </p>
                          {u.phone && (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {u.phone}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400 mt-1">
                            Joined {format(new Date(u.createdAt), 'dd MMM yyyy')}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {u.isActive ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7"
                                onClick={() => handleAction(u.id, 'suspend')}
                                disabled={updateMutation.isPending}
                              >
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs h-7"
                                onClick={() => handleAction(u.id, 'activate')}
                                disabled={updateMutation.isPending}
                              >
                                Activate
                              </Button>
                            )}
                            {!u.isVerified && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-sky-600 border-sky-200 hover:bg-sky-50 text-xs h-7"
                                onClick={() => handleAction(u.id, 'verify')}
                                disabled={updateMutation.isPending}
                              >
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verify
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="text-xs h-7">
                                  Role
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleAction(u.id, 'changeRole', { role: 'CUSTOMER' })}>
                                  Customer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction(u.id, 'changeRole', { role: 'OWNER' })}>
                                  Owner
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction(u.id, 'changeRole', { role: 'ADMIN' })}>
                                  Admin
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Desktop: Table Layout */
          <>
            <Card className="border-slate-200 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {users.map((u) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                                {getInitials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <button
                                className="font-medium text-sm text-slate-900 hover:text-emerald-600 transition-colors text-left"
                                onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                              >
                                {u.name}
                              </button>
                              {expandedId === u.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  className="text-xs text-slate-500 mt-0.5 space-y-0.5"
                                >
                                  {u.state?.name && (
                                    <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{u.state.name}{u.city?.name ? `, ${u.city.name}` : ''}</p>
                                  )}
                                  <p className="flex items-center gap-1"><Star className="h-3 w-3" />Rating: {u.avgRating.toFixed(1)} ({u.totalReviews} reviews)</p>
                                  <p>Trust Score: {u.trustScore}</p>
                                  <p>Response Rate: {u.responseRate}%</p>
                                  {u.address && <p>Address: {u.address}</p>}
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">{u.email}</TableCell>
                        <TableCell className="text-slate-600 text-sm">{u.phone || '—'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${roleColors[u.role] || 'bg-slate-100 text-slate-600'}`}>
                            {roleLabels[u.role] || u.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {u.isVerified ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {u.isVerified ? 'Yes' : 'No'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[u.isActive ? 'active' : 'suspended']}`}>
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{format(new Date(u.createdAt), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!u.isVerified && (
                                <DropdownMenuItem onClick={() => handleAction(u.id, 'verify')}>
                                  <ShieldCheck className="h-4 w-4 mr-2 text-emerald-600" /> Verify
                                </DropdownMenuItem>
                              )}
                              {u.isActive ? (
                                <DropdownMenuItem onClick={() => handleAction(u.id, 'suspend')} className="text-red-600">
                                  <ShieldX className="h-4 w-4 mr-2" /> Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleAction(u.id, 'activate')} className="text-emerald-600">
                                  <ShieldCheck className="h-4 w-4 mr-2" /> Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleAction(u.id, 'changeRole', { role: 'CUSTOMER' })}>
                                Set as Customer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(u.id, 'changeRole', { role: 'OWNER' })}>
                                Set as Owner
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(u.id, 'changeRole', { role: 'ADMIN' })}>
                                Set as Admin
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | string)[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      typeof p === 'string' ? (
                        <span key={`dots-${i}`} className="px-2 text-slate-400">...</span>
                      ) : (
                        <Button
                          key={p}
                          variant={page === p ? 'default' : 'outline'}
                          size="sm"
                          className={page === p ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
