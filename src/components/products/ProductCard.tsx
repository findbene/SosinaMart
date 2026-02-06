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
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center p-4 text-gray-500 text-sm text-center"><span class="font-medium">${product.name}</span></div>`;
          }}
        />

        {/* Category Badge */}
        <span className="absolute top-2 left-2 bg-primary/90 text-white text-xs px-2 py-1 rounded-full capitalize">
          {product.category}
        </span>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <Button
          variant={inCart ? "default" : "brown"}
          className={cn(
            "w-full mt-auto gap-2",
            inCart && "bg-primary hover:bg-primary-dark"
          )}
          onClick={handleAddToCart}
        >
          {inCart ? (
            <>
              <Check className="w-4 h-4" />
              {t.products.addedToCart}
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              {t.products.addToCart}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
