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
  // Show only first 6 products
  const displayProducts = products.slice(0, 6);

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
    <section ref={sectionRef} id={id} className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title with Ethiopian-themed decoration */}
        <div className={`text-center mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h2 className="text-2xl md:text-3xl font-semibold text-primary uppercase tracking-wide">
            {title}
          </h2>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <div className="h-0.5 w-6 bg-green-600 rounded-full" />
            <div className="h-0.5 w-10 bg-yellow-500 rounded-full" />
            <div className="h-0.5 w-6 bg-red-600 rounded-full" />
          </div>
        </div>

        {/* Product Grid with More Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {displayProducts.map((product, index) => (
            <div
              key={product.id}
              className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
            >
              <ProductCard product={product} />
            </div>
          ))}

          {/* More Card */}
          <div
            className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: isVisible ? `${displayProducts.length * 100}ms` : '0ms' }}
          >
            <button
              onClick={() => onViewMore(category)}
              className="w-full bg-gradient-to-br from-primary to-primary-dark rounded-xl flex flex-col items-center justify-center p-6 text-white hover:from-primary-light hover:to-primary transition-all duration-500 shadow-lg hover:shadow-xl hover:scale-[1.02] min-h-[280px] group"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <span className="text-lg font-semibold">{t.products.viewMore}</span>
              <span className="text-sm opacity-80 mt-1">
                {getCategoryDisplayName(category)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
