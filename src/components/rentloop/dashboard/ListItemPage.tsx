'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  ImageIcon,
  IndianRupee,
  ImagePlus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Product, Category, State } from '@/types';
import { toast } from 'sonner';

// ─── Zod Schema ────────────────────────────────────────────
const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'DAMAGED']),
  brand: z.string().max(100).optional().or(z.literal('')),
  model: z.string().max(100).optional().or(z.literal('')),
  purchaseYear: z.string().optional().or(z.literal('')),
  dailyPrice: z.string().min(1, 'Daily price is required'),
  weeklyPrice: z.string().optional().or(z.literal('')),
  securityDeposit: z.string().min(1, 'Security deposit is required'),
  minRentalDays: z.string().min(1, 'Min rental days is required'),
  maxRentalDays: z.string().min(1, 'Max rental days is required'),
  stateId: z.string().min(1, 'State is required'),
  cityId: z.string().min(1, 'City is required'),
  pickupAddress: z.string().min(5, 'Pickup address must be at least 5 characters').max(500),
  deliveryAvailable: z.boolean(),
  deliveryFee: z.string().optional().or(z.literal('')),
  rentalRules: z.string().max(2000).optional().or(z.literal('')),
  cancellationPolicy: z.string().max(2000).optional().or(z.literal('')),
  ownerNotes: z.string().max(2000).optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

// ─── Condition Options ─────────────────────────────────────
const conditionOptions = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'DAMAGED', label: 'Damaged' },
];

// ─── Image Type ────────────────────────────────────────────
interface ImageItem {
  file?: File;
  url: string;          // object URL for preview, or server URL for existing
  serverUrl?: string;   // uploaded URL (starts with /uploads/)
  uploading?: boolean;
  progress?: number;
}

// ─── Section Wrapper ───────────────────────────────────────
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function ListItemPage() {
  const navigate = useAppStore((s) => s.navigate);
  const viewData = useAppStore((s) => s.viewData);
  const queryClient = useQueryClient();

  const editingProduct = viewData?.product as Product | undefined;
  const isEditing = !!editingProduct;

  // ─── Image State ───────────────────────────────
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (editingProduct?.images && editingProduct.images.length > 0) {
      return editingProduct.images.map((img: { url: string; id?: string }) => ({
        url: img.url,
        serverUrl: img.url,
      }));
    }
    return [];
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing images when editing

  const MAX_IMAGES = 5;
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    const toProcess = fileArray.slice(0, remaining);
    const validFiles: File[] = [];

    for (const f of toProcess) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`"${f.name}" is not a supported format. Use PNG, JPG, or WEBP.`);
        continue;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`"${f.name}" exceeds 5MB limit`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    // Add items with uploading state
    const newItems: ImageItem[] = validFiles.map(f => ({
      file: f,
      url: URL.createObjectURL(f),
      uploading: true,
      progress: 0,
    }));
    setImages(prev => [...prev, ...newItems]);

    // Upload each file
    for (let i = 0; i < validFiles.length; i++) {
      const itemIdx = images.length + i;
      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setImages(prev => {
            const updated = [...prev];
            if (updated[itemIdx]) {
              updated[itemIdx] = {
                ...updated[itemIdx],
                progress: Math.min((updated[itemIdx].progress || 0) + Math.random() * 30, 90),
              };
            }
            return updated;
          });
        }, 200);

        const result = await api.uploadImages([validFiles[i]]);

        clearInterval(progressInterval);

        setImages(prev => {
          const updated = [...prev];
          if (updated[itemIdx] && result.url) {
            updated[itemIdx] = {
              ...updated[itemIdx],
              serverUrl: result.url,
              uploading: false,
              progress: 100,
            };
          }
          return updated;
        });
      } catch {
        setImages(prev => prev.filter((_, idx) => idx !== itemIdx));
        toast.error(`Failed to upload "${validFiles[i].name}"`);
      }
    }
  }, [images.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const item = prev[index];
      // Revoke object URL if it's a local preview
      if (item && !item.serverUrl && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Fetch categories & states
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const d = await api.getCategories(); return d as unknown as Category[]; },
  });

  const { data: states = [], isLoading: loadingStates } = useQuery({
    queryKey: ['states'],
    queryFn: async () => { const d = await api.getStates(); return d as unknown as State[]; },
  });

  // Form
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      categoryId: '',
      description: '',
      condition: 'GOOD',
      brand: '',
      model: '',
      purchaseYear: '',
      dailyPrice: '',
      weeklyPrice: '',
      securityDeposit: '',
      minRentalDays: '1',
      maxRentalDays: '30',
      stateId: '',
      cityId: '',
      pickupAddress: '',
      deliveryAvailable: false,
      deliveryFee: '',
      rentalRules: '',
      cancellationPolicy: '',
      ownerNotes: '',
    },
  });

  const { register, handleSubmit, control, setValue, formState: { errors } } = form;
  const selectedStateId = useWatch({ control: form.control, name: 'stateId' });
  const deliveryAvailable = useWatch({ control: form.control, name: 'deliveryAvailable' });

  // Get cities for selected state
  const selectedState = states.find((s: State) => s.id === selectedStateId);
  const cities = (selectedState as any)?.cities ?? [];

  // Populate form when editing
  useEffect(() => {
    if (editingProduct) {
      setValue('title', editingProduct.title);
      setValue('categoryId', editingProduct.categoryId);
      setValue('description', editingProduct.description || '');
      setValue('condition', editingProduct.condition);
      setValue('brand', editingProduct.brand || '');
      setValue('model', editingProduct.model || '');
      setValue('purchaseYear', editingProduct.purchaseYear ? String(editingProduct.purchaseYear) : '');
      setValue('dailyPrice', String(editingProduct.dailyPrice));
      setValue('weeklyPrice', editingProduct.weeklyPrice ? String(editingProduct.weeklyPrice) : '');
      setValue('securityDeposit', String(editingProduct.securityDeposit));
      setValue('minRentalDays', String(editingProduct.minRentalDays));
      setValue('maxRentalDays', String(editingProduct.maxRentalDays));
      setValue('stateId', editingProduct.stateId || '');
      setValue('cityId', editingProduct.cityId || '');
      setValue('pickupAddress', editingProduct.pickupAddress || '');
      setValue('deliveryAvailable', editingProduct.deliveryAvailable);
      setValue('deliveryFee', String(editingProduct.deliveryFee));
      setValue('rentalRules', editingProduct.rentalRules || '');
      setValue('cancellationPolicy', editingProduct.cancellationPolicy || '');
      setValue('ownerNotes', editingProduct.ownerNotes || '');
    }
  }, [editingProduct, setValue]);

  // Reset city when state changes
  useEffect(() => {
    if (!isEditing || !editingProduct?.cityId) {
      setValue('cityId', '');
    }
  }, [selectedStateId]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Wait for any pending uploads
      const pendingUpload = images.some(img => img.uploading);
      if (pendingUpload) {
        throw new Error('Please wait for images to finish uploading');
      }

      const payload: Record<string, unknown> = {
        title: data.title,
        categoryId: data.categoryId,
        description: data.description,
        condition: data.condition,
        brand: data.brand || undefined,
        model: data.model || undefined,
        purchaseYear: data.purchaseYear ? parseInt(data.purchaseYear) : undefined,
        dailyPrice: parseFloat(data.dailyPrice),
        weeklyPrice: data.weeklyPrice ? parseFloat(data.weeklyPrice) : undefined,
        securityDeposit: parseFloat(data.securityDeposit),
        minRentalDays: parseInt(data.minRentalDays),
        maxRentalDays: parseInt(data.maxRentalDays),
        stateId: data.stateId,
        cityId: data.cityId,
        pickupAddress: data.pickupAddress,
        deliveryAvailable: data.deliveryAvailable,
        deliveryFee: data.deliveryFee ? parseFloat(data.deliveryFee) : 0,
        rentalRules: data.rentalRules || undefined,
        cancellationPolicy: data.cancellationPolicy || undefined,
        ownerNotes: data.ownerNotes || undefined,
      };

      // Attach uploaded image URLs
      const uploadedUrls = images
        .filter(img => img.serverUrl)
        .map(img => img.serverUrl);
      if (uploadedUrls.length > 0) {
        payload.imageUrls = uploadedUrls;
      }

      if (isEditing) {
        return api.updateProduct(editingProduct.id, payload);
      }
      return api.createProduct(payload);
    },
    onSuccess: async () => {
      toast.success(isEditing ? 'Listing updated successfully!' : 'Listing created successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Refresh user data (role may have been upgraded to OWNER)
      try {
        const data = await api.me();
        const store = useAppStore.getState();
        store.setUser(data.user as any);
      } catch {}
      navigate('my-listings');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (data: ProductFormData) => {
    submitMutation.mutate(data);
  };

  const isSubmitting = submitMutation.isPending;
  const isLoadingData = loadingCategories || loadingStates;
  const hasUploadingImages = images.some(img => img.uploading);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900" onClick={() => navigate('my-listings')}>
                <ArrowLeft className="h-4 w-4 mr-1" />Back
              </Button>
              <div className="h-6 w-px bg-slate-200" />
              <h1 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Listing' : 'List a New Item'}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {isLoadingData ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
          </div>
        ) : (
          <motion.form
            noValidate
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Basic Information */}
            <FormSection title="Basic Information">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                      Product Title <span className="text-red-500">*</span>
                    </Label>
                    <Input id="title" placeholder="e.g., Canon EOS R5 Camera" className="mt-1.5" {...register('title')} />
                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Category <span className="text-red-500">*</span></Label>
                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Condition <span className="text-red-500">*</span></Label>
                    <Controller
                      name="condition"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {conditionOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea id="description" placeholder="Describe your item in detail..." rows={4} className="mt-1.5 resize-none" {...register('description')} />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="brand" className="text-sm font-medium text-slate-700">Brand</Label>
                    <Input id="brand" placeholder="e.g., Canon" className="mt-1.5" {...register('brand')} />
                  </div>
                  <div>
                    <Label htmlFor="model" className="text-sm font-medium text-slate-700">Model</Label>
                    <Input id="model" placeholder="e.g., EOS R5" className="mt-1.5" {...register('model')} />
                  </div>
                  <div>
                    <Label htmlFor="purchaseYear" className="text-sm font-medium text-slate-700">Purchase Year</Label>
                    <Input id="purchaseYear" placeholder="e.g., 2023" className="mt-1.5" {...register('purchaseYear')} />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Pricing */}
            <FormSection title="Pricing">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="dailyPrice" className="text-sm font-medium text-slate-700">Daily Price (₹) <span className="text-red-500">*</span></Label>
                  <div className="relative mt-1.5">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="dailyPrice" placeholder="0" className="pl-9" {...register('dailyPrice')} />
                  </div>
                  {errors.dailyPrice && <p className="text-xs text-red-500 mt-1">{errors.dailyPrice.message}</p>}
                </div>
                <div>
                  <Label htmlFor="weeklyPrice" className="text-sm font-medium text-slate-700">Weekly Price (₹)</Label>
                  <div className="relative mt-1.5">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="weeklyPrice" placeholder="Optional" className="pl-9" {...register('weeklyPrice')} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="securityDeposit" className="text-sm font-medium text-slate-700">Security Deposit (₹) <span className="text-red-500">*</span></Label>
                  <div className="relative mt-1.5">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="securityDeposit" placeholder="0" className="pl-9" {...register('securityDeposit')} />
                  </div>
                  {errors.securityDeposit && <p className="text-xs text-red-500 mt-1">{errors.securityDeposit.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minRentalDays" className="text-sm font-medium text-slate-700">Min Days <span className="text-red-500">*</span></Label>
                    <Input id="minRentalDays" type="number" min="1" className="mt-1.5" {...register('minRentalDays')} />
                    {errors.minRentalDays && <p className="text-xs text-red-500 mt-1">{errors.minRentalDays.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="maxRentalDays" className="text-sm font-medium text-slate-700">Max Days <span className="text-red-500">*</span></Label>
                    <Input id="maxRentalDays" type="number" min="1" className="mt-1.5" {...register('maxRentalDays')} />
                    {errors.maxRentalDays && <p className="text-xs text-red-500 mt-1">{errors.maxRentalDays.message}</p>}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Location */}
            <FormSection title="Location">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">State <span className="text-red-500">*</span></Label>
                    <Controller
                      name="stateId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={(v) => { field.onChange(v); setValue('cityId', ''); }}>
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            {states.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.stateId && <p className="text-xs text-red-500 mt-1">{errors.stateId.message}</p>}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">City <span className="text-red-500">*</span></Label>
                    <Controller
                      name="cityId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={!selectedStateId}>
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder={selectedStateId ? 'Select city' : 'Select state first'} /></SelectTrigger>
                          <SelectContent>
                            {cities.map((c: { id: string; name: string }) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.cityId && <p className="text-xs text-red-500 mt-1">{errors.cityId.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="pickupAddress" className="text-sm font-medium text-slate-700">Pickup Address <span className="text-red-500">*</span></Label>
                  <Textarea id="pickupAddress" placeholder="Full pickup address..." rows={2} className="mt-1.5 resize-none" {...register('pickupAddress')} />
                  {errors.pickupAddress && <p className="text-xs text-red-500 mt-1">{errors.pickupAddress.message}</p>}
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Controller
                    name="deliveryAvailable"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label className="text-sm font-medium text-slate-700 cursor-pointer" onClick={() => setValue('deliveryAvailable', !deliveryAvailable)}>
                    Delivery Available
                  </Label>
                  {deliveryAvailable && (
                    <div className="relative ml-auto">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="Delivery fee" className="w-32 pl-9 h-9" {...register('deliveryFee')} />
                    </div>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Images */}
            <FormSection title="Images">
              <div className="space-y-4">
                {/* Image Previews */}
                <AnimatePresence mode="popLayout">
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {images.map((img, idx) => (
                        <motion.div
                          key={`${img.url}-${idx}`}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={img.url}
                            alt={`Product ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Upload overlay */}
                          {img.uploading && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                              <Loader2 className="h-5 w-5 text-white animate-spin" />
                              <Progress value={img.progress || 0} className="w-16 h-1.5" />
                              <span className="text-[10px] text-white/80">{Math.round(img.progress || 0)}%</span>
                            </div>
                          )}
                          {/* First image badge */}
                          {idx === 0 && !img.uploading && (
                            <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">Cover</div>
                          )}
                          {/* Remove button */}
                          {!img.uploading && (
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </motion.div>
                      ))}

                      {/* Add more button */}
                      {images.length < MAX_IMAGES && !hasUploadingImages && (
                        <motion.button
                          type="button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <ImagePlus className="h-5 w-5 text-slate-400" />
                          <span className="text-[10px] text-slate-400 font-medium">Add</span>
                        </motion.button>
                      )}
                    </div>
                  )}
                </AnimatePresence>

                {/* Drop Zone (shown when no images) */}
                {images.length === 0 && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                      isDragOver
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                      <Upload className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Drag & drop images here, or click to browse</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB each (max {MAX_IMAGES} images)</p>
                    <Button type="button" variant="outline" size="sm" className="mt-3 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                      <ImageIcon className="h-4 w-4 mr-1.5" />
                      Choose Files
                    </Button>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) processFiles(e.target.files);
                    e.target.value = '';
                  }}
                />

                <p className="text-xs text-slate-400">{images.length}/{MAX_IMAGES} images uploaded. First image will be the cover photo.</p>
              </div>
            </FormSection>

            {/* Policies */}
            <FormSection title="Policies & Rules">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rentalRules" className="text-sm font-medium text-slate-700">Rental Rules</Label>
                  <Textarea id="rentalRules" placeholder="e.g., No smoking near the item, handle with care..." rows={3} className="mt-1.5 resize-none" {...register('rentalRules')} />
                </div>
                <div>
                  <Label htmlFor="cancellationPolicy" className="text-sm font-medium text-slate-700">Cancellation Policy</Label>
                  <Textarea id="cancellationPolicy" placeholder="e.g., Free cancellation 24 hours before start date..." rows={3} className="mt-1.5 resize-none" {...register('cancellationPolicy')} />
                </div>
                <div>
                  <Label htmlFor="ownerNotes" className="text-sm font-medium text-slate-700">Owner Notes</Label>
                  <Textarea id="ownerNotes" placeholder="Any additional notes for renters..." rows={3} className="mt-1.5 resize-none" {...register('ownerNotes')} />
                </div>
              </div>
            </FormSection>

            {/* Submit */}
            <div className="flex items-center justify-between pb-8">
              <Button type="button" variant="outline" className="text-slate-600" onClick={() => navigate('my-listings')}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px]"
                disabled={isSubmitting || hasUploadingImages}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isEditing ? 'Updating...' : 'Creating...'}</>
                ) : hasUploadingImages ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Uploading images...</>
                ) : (
                  <>{isEditing ? 'Update Listing' : 'Create Listing'}</>
                )}
              </Button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
