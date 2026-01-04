export const dynamic = "force-dynamic";

"use client";


import { useState, useEffect, Suspense } from "react";
import { createClient } from "../lib/supabase/client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SearchResults from "./SearchResults"; // Import the file we just created

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
      {/* Navbar does NOT use useSearchParams, so it does not need Suspense */}
      <Navbar />

      <main className="flex-grow max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8">
        
        {/* We wrap the Imported Component in Suspense */}
        <Suspense fallback={
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#667eea]"></div>
          </div>
        }>
          <SearchResults />
        </Suspense>

      </main>

      <Footer siteSettings={siteSettings} />
    </div>
  );
}