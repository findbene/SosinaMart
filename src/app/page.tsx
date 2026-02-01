"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Carousel from "@/components/sections/Carousel";
import ProductSection from "@/components/sections/ProductSection";
import AllProductsModal from "@/components/products/AllProductsModal";
import { PRODUCTS, SECTION_TITLES, getProductsByCategory } from "@/lib/data";

export default function Home() {
  const [isAllProductsOpen, setIsAllProductsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleViewMore = (category: string) => {
    setSelectedCategory(category);
    setIsAllProductsOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Carousel Section */}
        <Carousel />

        {/* Product Sections */}
        <div className="bg-white">
          <ProductSection
            id="food-section"
            title={SECTION_TITLES.food}
            products={getProductsByCategory("food")}
            category="food"
            onViewMore={handleViewMore}
          />
        </div>

        <div className="bg-gray-50">
          <ProductSection
            id="kitchenware-section"
            title={SECTION_TITLES.kitchenware}
            products={getProductsByCategory("kitchenware")}
            category="kitchenware"
            onViewMore={handleViewMore}
          />
        </div>

        <div className="bg-white">
          <ProductSection
            id="artifacts-section"
            title={SECTION_TITLES.artifacts}
            products={getProductsByCategory("artifacts")}
            category="artifacts"
            onViewMore={handleViewMore}
          />
        </div>
      </main>

      <Footer />

      {/* All Products Modal */}
      <AllProductsModal
        isOpen={isAllProductsOpen}
        onClose={() => setIsAllProductsOpen(false)}
        initialCategory={selectedCategory}
      />
    </div>
  );
}
