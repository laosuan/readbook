import type { Metadata } from "next";
import { Inter, Noto_Serif, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ClientThemeProvider from "./components/ClientThemeProvider";

// 加载字体
const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

// Configure Noto Serif SC with proper settings to avoid preloading errors
const notoSerifSc = Noto_Serif_SC({ 
  weight: ['400', '700'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  preload: false,
  subsets: ['latin']
});

const notoSerif = Noto_Serif({ 
  subsets: ["latin"],
  weight: ['400', '700'],
  variable: '--font-noto-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "阅词名著 - 中英对照阅读经典名著",
  description: "阅词名著是一个支持中英对照阅读英语原著的网站，帮助您更好地理解和欣赏经典文学作品。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={`${inter.variable} ${notoSerifSc.variable} ${notoSerif.variable}`}>
      <body className={`${inter.className}`}>
        <ClientThemeProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pt-16">{children}</main>
            <Footer />
          </div>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
