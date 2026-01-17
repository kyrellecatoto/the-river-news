import { Inter } from 'next/font/google';
import './globals.css';
import Head from 'next/head';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
 
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'The River',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <link rel="icon" href="/ikb.png" />

        {/* Primary Meta Tags */}
        <meta name="title" content="The River" />
        <meta
          name="description"
        />
      </Head>

      {/* ✅ Google Analytics */}
      <Script
        strategy="lazyOnload"
        async
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

      {/* ✅ Google AdSense (global, loaded once) */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6596634799308501"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
