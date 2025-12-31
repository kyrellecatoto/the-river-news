"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import NewsletterSection from "./NewsletterSection"; 

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNewsletter, setShowNewsletter] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <nav className="bg-[#111111] border-b border-[#222222] py-4 px-4 md:px-6 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`h-0.5 w-full bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`h-0.5 w-full bg-white transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`h-0.5 w-full bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
            
            <Link href="/" className="flex items-center" onClick={closeMenu}>
              <div className="flex flex-col items-start">
                <div className="relative">
                  <Image 
                    src="/logo.png" 
                    alt="THE RIVER"
                    width={100}
                    height={35}
                    className="object-contain"
                    priority
                  />
                </div>
                <p id="site-tagline" className="text-[8px] md:text-[9px] mt-1 text-[#888888] tracking-wider font-semibold">
                  YOUTH-RUN PRESS NETWORK
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/" className="text-white no-underline text-sm font-semibold hover:text-gray-300">Latest News</Link>
            <Link href="/category/national" className="text-[#888888] no-underline text-sm font-medium hover:text-gray-300">National</Link>
            <Link href="/category/politics" className="text-[#888888] no-underline text-sm font-medium hover:text-gray-300">Politics</Link>
            <Link href="/category/opinion" className="text-[#888888] no-underline text-sm font-medium hover:text-gray-300">Opinion</Link>
            <Link href="/category/entertainment" className="text-[#888888] no-underline text-sm font-medium hover:text-gray-300">Entertainment</Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex gap-4 items-center">
            <button 
              onClick={() => setShowNewsletter(true)}
              className="bg-transparent border border-[#333333] text-white py-2 px-5 rounded-full text-xs font-semibold cursor-pointer hover:bg-[#222222] transition-colors"
            >
              Subscribe
            </button>

            <Link href="/admin">
              <div className="w-8 h-8 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-white text-sm font-bold">👤</span>
              </div>
            </Link>
          </div>

          {/* Mobile Spacer */}
          <div className="md:hidden flex items-center"></div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 md:hidden ${
          isMenuOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
      />

      {/* Mobile Menu Slide-in */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-[#111111] border-r border-[#222222] z-50 transform transition-transform duration-300 md:hidden ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 pt-20">
          <div className="flex flex-col gap-6">
            <Link href="/" className="text-white no-underline text-base font-semibold hover:text-gray-300 py-2" onClick={closeMenu}>Latest News</Link>
            <Link href="/category/national" className="text-[#888888] no-underline text-base font-medium hover:text-gray-300 py-2" onClick={closeMenu}>National</Link>
            <Link href="/category/politics" className="text-[#888888] no-underline text-base font-medium hover:text-gray-300 py-2" onClick={closeMenu}>Politics</Link>
            <Link href="/category/opinion" className="text-[#888888] no-underline text-base font-medium hover:text-gray-300 py-2" onClick={closeMenu}>Opinion</Link>
            <Link href="/category/entertainment" className="text-[#888888] no-underline text-base font-medium hover:text-gray-300 py-2" onClick={closeMenu}>Entertainment</Link>
          </div>

          <div className="mt-8 pt-8 border-t border-[#222222] flex flex-col gap-4">
            {/* Mobile Subscribe Button triggers popup too */}
            <button 
              onClick={() => { setShowNewsletter(true); closeMenu(); }}
              className="bg-transparent border border-[#333333] text-white py-3 px-6 rounded-full text-sm font-semibold cursor-pointer hover:bg-[#222222] w-full"
            >
              Subscribe
            </button>

            <Link href="/admin" onClick={closeMenu}>
              <div className="flex items-center gap-3 text-white py-3 hover:bg-[#222222] rounded-lg px-4 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center">
                  <span className="text-white text-base font-bold">👤</span>
                </div>
                <span className="font-medium">Admin Panel</span>
              </div>
            </Link>
          </div>

          <button className="absolute top-4 right-4 text-white p-2" onClick={closeMenu} aria-label="Close menu">
            <div className="w-6 h-6 relative">
              <span className="absolute top-1/2 left-0 w-full h-0.5 bg-white transform -rotate-45"></span>
              <span className="absolute top-1/2 left-0 w-full h-0.5 bg-white transform rotate-45"></span>
            </div>
          </button>
        </div>
      </div>

      {showNewsletter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          {/* Dark Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowNewsletter(false)}
          ></div>
          
          {/* Content Container */}
          <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
             {/* Close Button X */}
             <button 
               onClick={() => setShowNewsletter(false)} 
               className="absolute top-4 right-4 z-20 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full p-2 transition-all"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
             
             {/* Render the component inside the modal */}
             <NewsletterSection />
          </div>
        </div>
      )}
    </>
  );
}