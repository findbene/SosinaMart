"use client";

import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative min-h-[50vh] sm:min-h-[70vh] flex items-center justify-start overflow-hidden pt-16">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/Hero_Background.png"
          alt="Ethiopian Semien Mountains with Adey Abeba flowers"
          fill
          className="object-cover"
          style={{
            filter: "contrast(1.1) saturate(1.2) brightness(1.05)",
          }}
          priority
        />
        {/* Multi-layer overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-primary/30 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Decorative Ethiopian pattern strip */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 z-20 bg-gradient-to-r from-green-600 via-yellow-400 to-red-600" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Logo with float animation */}
          <div className="flex-shrink-0 animate-fade-in-up">
            <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden shadow-2xl bg-white/10 p-1 animate-float">
              <Image
                src="/images/logo.jpeg"
                alt="Sosina Mart Logo"
                fill
                className="object-cover rounded-full"
                priority
              />
              {/* Subtle ring glow */}
              <div className="absolute -inset-2 rounded-full bg-accent-gold/20 blur-xl -z-10" />
            </div>
          </div>

          {/* Text with staggered animations */}
          <div className="text-white text-center md:text-left">
            <span className="text-xl md:text-2xl font-light drop-shadow-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {t.hero.welcomeTo}
            </span>
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide mt-2 drop-shadow-xl animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <span className="bg-gradient-to-r from-white via-accent-gold to-white bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
                {t.hero.storeName}
              </span>
            </h1>
            <p className="text-lg md:text-xl mt-4 opacity-90 drop-shadow-md max-w-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {t.hero.tagline}
            </p>

            {/* Ethiopian-themed decorative line */}
            <div className="mt-6 flex items-center justify-center md:justify-start gap-2 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="h-0.5 w-8 bg-green-400 rounded-full" />
              <div className="h-0.5 w-12 bg-yellow-400 rounded-full" />
              <div className="h-0.5 w-8 bg-red-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
