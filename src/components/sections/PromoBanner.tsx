"use client";

import { Sparkles, ArrowRight } from "lucide-react";

interface PromoBannerProps {
  onShopNow: (category: string) => void;
}

export default function PromoBanner({ onShopNow }: PromoBannerProps) {
  return (
    <section className="py-8 bg-gradient-to-r from-primary via-primary-dark to-primary relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-accent-gold blur-3xl" />
        <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-accent-gold blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              <Sparkles className="w-5 h-5 text-accent-gold" />
              <span className="text-accent-gold font-semibold text-sm uppercase tracking-wider">Featured Collections</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">
              Discover Authentic Ethiopian Treasures
            </h3>
            <p className="mt-2 text-white/80 max-w-lg">
              From aromatic Yirgacheffe coffee to handcrafted Mesob baskets — explore curated collections that bring Ethiopian culture to your home.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onShopNow("food")}
              className="px-6 py-3 bg-accent-gold text-primary-dark font-bold rounded-full hover:bg-accent-gold-light transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              Shop Coffee & Spices
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onShopNow("artifacts")}
              className="px-6 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all border border-white/30 flex items-center gap-2"
            >
              Explore Artifacts
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Ethiopian flag strip at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />
    </section>
  );
}
