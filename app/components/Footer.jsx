'use client'

import Link from 'next/link'

// Updated data structure to include paths
const footerSections = [
  {
    title: 'SECTIONS',
    links: [
      { label: 'Latest News', href: '/' },
      { label: 'National', href: '/category/national' },
      { label: 'Politics', href: '/category/politics' },
      { label: 'Opinion', href: '/category/opinion' },
      { label: 'Entertainment', href: '/category/entertainment' }
    ]
  },
  {
    title: 'MORE',
    links: [
      { label: 'Podcasts', href: '#' }, // Placeholder until route exists
      { label: 'Videos', href: '#' }    // Placeholder until route exists
    ]
  },
]

export default function Footer() {
  return (
    <footer className="bg-black text-white py-16 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="md:col-span-2">
            <h4 className="text-[28px] font-black mb-4 text-white tracking-tight">
              THE RIVER
            </h4>
            <p className="text-sm leading-relaxed text-[#888888] mb-6">
              Your trusted source for breaking news, in-depth analysis, and compelling stories from around the world.
            </p>
            <div className="flex gap-4">
              <a href="#" className="social-icon w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center no-underline hover:bg-[#222222] transition-colors">
                <span className="text-white text-lg">𝕏</span>
              </a>
              <a href="https://www.facebook.com/AgusanonTimes" className="social-icon w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center no-underline hover:bg-[#222222] transition-colors">
                <span className="text-white text-lg">ⓕ</span>
              </a>
            </div>
          </div>
          
          {/* Link Columns */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h5 className="text-sm font-bold mb-5 tracking-wider text-white">
                {section.title}
              </h5>
              <ul className="list-none p-0 m-0">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex} className="mb-3">
                    <Link 
                      href={link.href} 
                      className="text-[#888888] no-underline text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Copyright */}
        <div className="border-t border-[#222222] pt-6 text-center">
          <p className="text-xs text-[#666666] m-0">
            © 2025 The River. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}