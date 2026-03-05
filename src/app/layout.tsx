import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TCG Trainer | Competitive Pokemon TCG Analytics",
    template: "%s | TCG Trainer",
  },
  description:
    "Train smarter with real tournament data, matchup analysis, and AI coaching for competitive Pokemon TCG.",
  keywords: [
    "Pokemon TCG",
    "competitive",
    "meta analysis",
    "matchup matrix",
    "deck builder",
    "AI coach",
  ],
  openGraph: {
    title: "TCG Trainer | Competitive Pokemon TCG Analytics",
    description:
      "Train smarter with real tournament data, matchup analysis, and AI coaching.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TCG Trainer",
    description:
      "Train smarter with real tournament data, matchup analysis, and AI coaching.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            classNames: {
              toast: "bg-card border-border",
              title: "text-foreground",
              description: "text-muted-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
