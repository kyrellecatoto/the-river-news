"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import Link from "next/link";
import { getStorageUrl } from "../lib/supabase/storage";
import { Calendar, Clock } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Component that uses useSearchParams - wrapped in Suspense
function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setLoading(false);
    }
  }, [query]);

  async function performSearch(searchTerm) {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data: searchResults, error } = await supabase
        .from("news_articles")
        .select(`*, category:news_categories(*)`)
        .or(`title.ilike.%${searchTerm}%,subtitle.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,author_name.ilike.%${searchTerm}%`)
        .order("published_at", { ascending: false });

      if (error) throw error;
      setResults(searchResults || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const getImageUrl = (imagePath) => {
    return getStorageUrl(imagePath) || imagePath;
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">
          Search Results {query && `for "${query}"`}
        </h1>
        <p className="text-gray-400">
          {results.length} {results.length === 1 ? "article found" : "articles found"}
        </p>
      </div>

      <div className="mb-8">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const searchQuery = formData.get("search");
            if (searchQuery.trim()) {
              window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
            }
          }}
          className="relative"
        >
          <input
            type="text"
            name="search"
            defaultValue={query}
            placeholder="Search..."
            className="w-full bg-[#222222] text-white text-sm py-3 px-4 pl-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button type="submit" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </form>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#667eea]"></div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="bg-[#111111] rounded-lg overflow-hidden hover:bg-[#161616] transition-colors group"
            >
              <div className="relative h-48 overflow-hidden">
                {article.cover_image_url ? (
                  <img
                    src={getImageUrl(article.cover_image_url)}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#667eea] to-[#764ba2]" />
                )}
                {article.category && (
                  <span className="absolute top-3 left-3 text-white py-1 px-3 text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: article.category.color || '#667eea' }}>
                    {article.category.name}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-[#667eea] transition-colors">{article.title}</h3>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-[#222222]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(article.published_at)}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {article.read_time_minutes || 5} min</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

// Main page component
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