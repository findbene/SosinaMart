"use client";

import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isInCart } = useCart();
  const { t } = useLanguage();
  const inCart = isInCart(product.id);

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <div data-testid="product-card" className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-500 group flex flex-col hover:-translate-y-1">
      {/* Product Image */}
      <div className="relative aspect-[5/4] overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center p-3 text-gray-500 text-xs text-center"><span class="font-medium">${product.name}</span></div>`;
          }}
        />

        {/* Category Badge */}
        <span className="absolute top-1.5 left-1.5 bg-primary/90 text-white text-[10px] px-2 py-0.5 rounded-full capitalize backdrop-blur-sm">
          {product.category}
        </span>
      </div>

      {/* Product Info */}
      <div className="p-2.5 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-2 group-hover:text-primary transition-colors duration-300">
          {product.name}
        </h3>

        <Button
          variant={inCart ? "default" : "brown"}
          size="sm"
          className={cn(
            "w-full mt-auto gap-1.5 text-xs transition-all duration-300",
            inCart && "bg-primary hover:bg-primary-dark"
          )}
          onClick={handleAddToCart}
        >
          {inCart ? (
            <>
              <Check className="w-3.5 h-3.5" />
              {t.products.addedToCart}
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              {t.products.addToCart}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
