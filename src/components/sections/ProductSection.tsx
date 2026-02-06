"use client";

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
  // Show only first 6 products
  const displayProducts = products.slice(0, 6);

  return (
    <section id={id} className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <h2 className="text-2xl md:text-3xl font-semibold text-primary text-center mb-8 uppercase tracking-wide">
          {title}
        </h2>

        {/* Product Grid with More Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}

          {/* More Card */}
          <button
            onClick={() => onViewMore(category)}
            className="bg-gradient-to-br from-primary to-primary-dark rounded-xl flex flex-col items-center justify-center p-6 text-white hover:from-primary-light hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] min-h-[280px]"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8" />
            </div>
            <span className="text-lg font-semibold">{t.products.viewMore}</span>
            <span className="text-sm opacity-80 mt-1">
              {getCategoryDisplayName(category)}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
