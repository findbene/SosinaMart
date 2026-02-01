"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Mail, Phone, Globe } from "lucide-react";
import { STORE_INFO } from "@/lib/data";
import { formatPhoneForLink } from "@/lib/utils";

// Social Icons
const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "Facebook":
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "Instagram":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case "Twitter":
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "YouTube":
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
      );
    case "TikTok":
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden">
              <Image
                src="/images/logo.jpeg"
                alt="Sosina Mart"
                fill
                className="object-cover"
              />
            </div>
            <h3 className="text-xl font-bold">{STORE_INFO.name}</h3>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 flex-shrink-0 text-accent-gold" />
              <span className="text-sm">{STORE_INFO.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 flex-shrink-0 text-accent-gold" />
              <Link
                href={`mailto:${STORE_INFO.email}`}
                className="text-sm hover:text-accent-gold transition-colors"
              >
                {STORE_INFO.email}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 flex-shrink-0 text-accent-gold" />
              <Link
                href={formatPhoneForLink(STORE_INFO.phone)}
                className="text-sm hover:text-accent-gold transition-colors"
              >
                {STORE_INFO.phone}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 flex-shrink-0 text-accent-gold" />
              <Link
                href={`https://${STORE_INFO.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-accent-gold transition-colors"
              >
                {STORE_INFO.website}
              </Link>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap gap-3 md:justify-end">
            {STORE_INFO.socialLinks.map((social) => (
              <Link
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent-gold hover:text-primary-dark transition-all"
                aria-label={social.platform}
              >
                <SocialIcon platform={social.platform} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm opacity-80">
            &copy; {new Date().getFullYear()} {STORE_INFO.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
