import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
      <body className={`${sans.variable} ${mono.variable} antialiased bg-background text-foreground min-h-screen selection:bg-foreground selection:text-background`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
