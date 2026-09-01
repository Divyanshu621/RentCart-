'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  CheckCircle2,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Us',
    detail: 'support@rentcart.in',
    sub: 'We reply within 24 hours',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: Phone,
    title: 'Call Us',
    detail: '1800-736-8227',
    sub: 'Mon–Sat, 9 AM – 8 PM IST',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    detail: 'In-App Messaging',
    sub: 'Available 9 AM – 10 PM IST',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: MapPin,
    title: 'Office',
    detail: 'Bengaluru, Karnataka',
    sub: 'India',
    color: 'text-orange-600 bg-orange-50',
  },
];

const issueCategories = [
  'Rental Issue',
  'Payment Problem',
  'Account & Verification',
  'Listing Help',
  'Dispute / Complaint',
  'Feature Request',
  'Bug Report',
  'Other',
];

export default function ContactPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.category || !form.message) {
      toast.error('Please fill all required fields');
      return;
    }
    setSending(true);
    // Simulate submission
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSubmitted(true);
    toast.success('Your message has been sent!');
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <button
            onClick={() => navigate('help-center')}
            className="flex items-center gap-1.5 text-emerald-100 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Help Center
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Headphones className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Contact Us</h1>
          </div>
          <p className="text-emerald-100 text-sm md:text-base max-w-lg">
            We&apos;re here to help. Reach out through any of the channels below or send us a message.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contact methods grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {contactMethods.map((method) => {
            const Icon = method.icon;
            return (
              <div
                key={method.title}
                className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3 ${method.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{method.title}</h3>
                <p className="text-sm font-medium text-gray-700">{method.detail}</p>
                <p className="text-xs text-gray-400 mt-1">{method.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Send us a message</h2>
              <p className="text-sm text-gray-500 mb-6">
                Fill out the form and we&apos;ll get back to you within 24 hours.
              </p>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                    Thank you for reaching out. Our team will respond within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: '', email: '', category: '', subject: '', message: '' });
                    }}
                    className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <Select value={form.category} onValueChange={(v) => update('category', v)}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {issueCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Subject
                      </label>
                      <Input
                        placeholder="Brief subject"
                        value={form.subject}
                        onChange={(e) => update('subject', e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Describe your issue or question in detail..."
                      value={form.message}
                      onChange={(e) => update('message', e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Business hours */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Business Hours</h3>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Monday – Friday</span>
                  <span className="text-gray-900 font-medium">9:00 AM – 8:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Saturday</span>
                  <span className="text-gray-900 font-medium">9:00 AM – 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sunday</span>
                  <span className="text-gray-400 font-medium">Closed</span>
                </div>
              </div>
            </div>

            {/* FAQ link */}
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Looking for quick answers?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Check out our Help Center for instant answers to common questions.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('help-center')}
                size="sm"
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-100"
              >
                Visit Help Center
              </Button>
            </div>

            {/* Response time */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Response Times</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-gray-600">Email: Within 24 hours</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-gray-600">Live Chat: Instant (business hours)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-gray-600">Phone: During business hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
