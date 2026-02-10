"use client";

import { useState } from "react";
import { X, Truck, Clock, Phone } from "lucide-react";

export default function PromoBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-green-700 via-yellow-600 to-red-700 text-white text-center relative z-[60]">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-6 text-xs sm:text-sm font-medium">
        <span className="hidden sm:flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5" />
          Free delivery on orders $50+
        </span>
        <span className="hidden md:inline text-white/50">|</span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Open Mon-Sat 9AM-8PM, Sun 10AM-6PM
        </span>
        <span className="hidden md:inline text-white/50">|</span>
        <span className="hidden md:flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" />
          (470) 359-7924
        </span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1"
        aria-label="Close announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
