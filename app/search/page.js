"use client";

export const dynamic = "force-dynamic";


import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import dynamicImport from 'next/dynamic'; // Rename to avoid conflict with 'dynamic' export above

// NUCLEAR FIX: Lazy load the SearchResults component and DISABLE server-side rendering for it.
// This prevents the build process from ever seeing 'useSearchParams' inside this component.
const SearchResults = dynamicImport(() => import('./SearchResults'), { 
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-16">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#667eea]"></div>
    </div>
  )
});

export default function SearchPage() {
  const [siteSettings, setSiteSettings] = useState({});

  useEffect(() => {
    async function fetchSettings() {
      const supabase = createClient();
      const { data } = await supabase.from('site_settings').select('*');
      const settings = {};
      data?.forEach((s) => { settings[s.key] = s.value });
      setSiteSettings(settings);
    }
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8">
        {/* We don't even need Suspense here anymore because ssr: false handles it, 
            but keeping it is safe practice. */}
        <SearchResults />
      </main>

      <Footer siteSettings={siteSettings} />
    </div>
  );
}