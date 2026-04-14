import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealGuard - Secure Trade Protection",
  description: "DealGuard protects buyer and seller funds for secure marketplace and business trading",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
