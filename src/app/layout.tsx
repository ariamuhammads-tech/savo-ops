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
    <html lang="id">
      <body className={`${sans.variable} ${serif.variable} antialiased`}>
        <ParallaxBg />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
