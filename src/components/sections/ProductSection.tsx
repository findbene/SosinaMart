"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { Product, ProductCategory } from "@/types";
import { getCategoryDisplayName } from "@/lib/utils";

interface ProductSectionProps {
  id: string;
  title: string;
  products: Product[];
  category: ProductCategory;
  onViewMore: (category: string) => void;
}

export default function ProductSection({
  id,
  title,
  products,
  category,
  onViewMore,
}: ProductSectionProps) {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  // Show only first 4 products to fit in one row
  const displayProducts = products.slice(0, 4);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id={id} className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title with Ethiopian-themed decoration */}
        <div className={`text-center mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h2 className="text-xl md:text-2xl font-semibold text-primary uppercase tracking-wide">
            {title}
          </h2>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <div className="h-0.5 w-5 bg-green-600 rounded-full" />
            <div className="h-0.5 w-8 bg-yellow-500 rounded-full" />
            <div className="h-0.5 w-5 bg-red-600 rounded-full" />
          </div>
        </div>

        {/* Product Grid — single row on desktop: 4 products + half-width View More */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(4,1fr)_0.5fr] gap-3 lg:gap-4">
          {displayProducts.map((product, index) => (
            <div
              key={product.id}
              className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
            >
              <ProductCard product={product} />
            </div>
          ))}

          {/* View More Card — same height, half width on desktop */}
          <div
            className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: isVisible ? `${displayProducts.length * 100}ms` : '0ms' }}
          >
            <button
              onClick={() => onViewMore(category)}
              className="w-full h-full bg-gradient-to-br from-primary to-primary-dark rounded-lg flex flex-col items-center justify-center p-3 text-white hover:from-primary-light hover:to-primary transition-all duration-500 shadow-md hover:shadow-lg hover:scale-[1.02] group"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <span className="text-sm font-semibold leading-tight text-center">{t.products.viewMore}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
