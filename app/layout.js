import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script' // 1. Import the Script component

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'The River',
  description: 'youth-run press, for agusan & beyond',
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script src="/_sdk/element_sdk.js" defer></script>
        <script src="/_sdk/data_sdk.js" type="text/javascript" defer></script>
      </head>
      <body className={`${inter.className} h-full overflow-auto`}>
        {children}


        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6596634799308501"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        <script dangerouslySetInnerHTML={{
          __html: `
            (function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'9b452ab6224c403a',t:'MTc2NjgwMDIyNC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();
          `
        }} />
      </body>
    </html>
  )
}