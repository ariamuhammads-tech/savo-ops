import type { Metadata } from "next";
import { Hanken_Grotesk, Source_Serif_4 } from "next/font/google";
import { Toaster } from "sonner";
import { ParallaxBg } from "@/components/parallax-bg";
import "./globals.css";

const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SAVO Ops",
  description: "Dasbor operasional internal SAVO — penjualan, resep & HPP, stok, dan invoice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Tema dipasang SEBELUM paint agar tidak berkedip (anti-FOUC):
            'savo-theme' di localStorage menang; tanpa itu ikuti sistem. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('savo-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
      </head>
      <body className={`${sans.variable} ${serif.variable} antialiased`}>
        <ParallaxBg />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
