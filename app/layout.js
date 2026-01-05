import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'The River',
  description: 'Youth-run press, for Agusan & beyond',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={inter.className}>
        {/* Google Analytics */}
        <Script
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}');
          `}
        </Script>

        {/* Google AdSense */}
        <Script
          strategy="afterInteractive"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6596634799308501"
          crossOrigin="anonymous"
        />

        {children}
        <Analytics />
      </body>
    </html>
  );
}
