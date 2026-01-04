"use client";

// 1. Add this line to force dynamic rendering
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import Link from "next/link";
import { getStorageUrl } from "../lib/supabase/storage";
import { Calendar, Clock, MessageCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Create a separate component for the search logic
function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState({});

  useEffect(() => {
    // No need for window check here since we are forcing dynamic, 
    // but keeping it is fine.
    if (query) {
      performSearch(query);
    } else {
      setLoading(false);
    }
    fetchSiteSettings();
  }, [query]);

  async function performSearch(searchTerm) {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data: searchResults, error } = await supabase
        .from("news_articles")
        .select(`
          *,
          category:news_categories(*)
        `)
        // Using template literals safely inside .or()
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

  async function fetchSiteSettings() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      const settings = {};
      data?.forEach((s) => { settings[s.key] = s.value });
      setSiteSettings(settings);
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  }

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getImageUrl = (imagePath) => {
    return getStorageUrl(imagePath) || imagePath;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            Search Results {query && `for "${query}"`}
          </h1>
          <p className="text-gray-400">
            {results.length} {results.length === 1 ? "article found" : "articles found"}
          </p>
        </div>

        {/* Search Box */}
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
              placeholder="Search for articles, topics, authors..."
              className="w-full bg-[#222222] text-white text-sm py-3 px-4 pl-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            <button 
              type="submit"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#667eea]"></div>
          </div>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && query && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">No results found</h3>
            <p className="text-gray-400">
              Try different keywords or check for typos
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Suggestions:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Use more general terms</li>
                <li>Check your spelling</li>
                <li>Try related keywords</li>
              </ul>
            </div>
          </div>
        )}

        {/* No Query Entered */}
        {!loading && !query && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Enter a search term</h3>
            <p className="text-gray-400">
              Search for articles by title, content, author, or keywords
            </p>
          </div>
        )}

        {/* Search Results */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.slug}`}
                className="bg-[#111111] rounded-lg overflow-hidden hover:bg-[#161616] transition-colors group"
              >
                {/* Article Image */}
                <div className="relative h-48 overflow-hidden">
                  {article.cover_image_url ? (
                    <img
                      src={getImageUrl(article.cover_image_url)}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  {article.category && (
                    <div className="absolute top-3 left-3">
                      <span 
                        className="text-white py-1 px-3 text-xs font-bold uppercase tracking-wider"
                        style={{ backgroundColor: article.category.color || '#667eea' }}
                      >
                        {article.category.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Article Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-[#667eea] transition-colors">
                    {article.title}
                  </h3>
                  
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {article.subtitle}
                  </p>

                  {/* Article Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-[#222222]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(article.published_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{article.read_time_minutes || 5} min</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      <span>{article.comments_count || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer siteSettings={siteSettings} />
    </div>
  );
}

// Main page component with Suspense
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        {/* NOTE: If your Navbar has search logic, it can fail here in the fallback. 
            However, 'force-dynamic' usually prevents the build error. */}
        <Navbar />
        <div className="flex-grow max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Search</h1>
          </div>
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#667eea]"></div>
          </div>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}