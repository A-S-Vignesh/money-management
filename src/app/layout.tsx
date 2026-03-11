import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider";
import Navbar from "@/landingcomponents/Navbar";
import Footer from "@/landingcomponents/Footer";
import LayoutWrapper from "@/landingcomponents/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Money Nest",
  description:
    "A simple and beautiful personal finance app. Track spending, set budgets, and achieve your financial goals.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nest",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#4f46e5" />
        <meta
          name="google-site-verification"
          content="rY46jA55lDxJARyTs3BCYKp079RBOphEEL6aDqQ_hB4"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerProvider />
        <LayoutWrapper>
          <Providers>{children}</Providers>
        </LayoutWrapper>
      </body>
    </html>
  );
}
