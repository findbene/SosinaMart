"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-start overflow-hidden pt-16">
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
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary/30 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden shadow-2xl bg-white/10 p-1">
              <Image
                src="/images/logo.jpeg"
                alt="Sosina Mart Logo"
                fill
                className="object-cover rounded-full"
                priority
              />
            </div>
          </div>

          {/* Text */}
          <div className="text-white text-center md:text-left">
            <span className="text-xl md:text-2xl font-light drop-shadow-lg">
              Welcome to
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide mt-2 drop-shadow-xl">
              SOSINA MART
            </h1>
            <p className="text-lg md:text-xl mt-4 opacity-90 drop-shadow-md max-w-xl">
              Authentic Ethiopian Products in Atlanta
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
