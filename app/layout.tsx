import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: { default: "CreatorMint — Sell Digital Products in India", template: "%s | CreatorMint" },
  description:
    "The simplest way for Indian creators to sell digital products and get paid via UPI.",
  keywords: ["digital products", "creator economy", "India", "UPI payments", "sell online"],
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "!bg-card !text-foreground !border !border-border !rounded-lg !shadow-lg",
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
