import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/Providers";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: "RentCart - Rent Anything You Need | Rent it. Use it. Return it.",
  description: "India's premier rental marketplace. Rent cameras, laptops, gaming consoles, tools, furniture and more. Save money, reduce waste, and access premium items at a fraction of the cost.",
  keywords: ["RentCart", "rental marketplace", "rent items", "India", "rent camera", "rent laptop", "rent tools", "peer to peer rental", "rental platform"],
  authors: [{ name: "RentCart Team" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔄</text></svg>",
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔄</text></svg>",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RentCart",
  },
  openGraph: {
    title: "RentCart - Rent Anything You Need",
    description: "Get the things you need for a few days without buying them permanently.",
    siteName: "RentCart",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RentCart - Rent Anything You Need",
    description: "Get the things you need for a few days without buying them permanently.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
