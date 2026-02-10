"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Carousel from "@/components/sections/Carousel";
import ProductSection from "@/components/sections/ProductSection";
import PromoBar from "@/components/sections/PromoBar";
import FeaturesSection from "@/components/sections/FeaturesSection";
import PromoBanner from "@/components/sections/PromoBanner";
import BackToTop from "@/components/sections/BackToTop";
import AllProductsModal from "@/components/products/AllProductsModal";
import { useLanguage } from "@/context/LanguageContext";
import { PRODUCTS, SECTION_TITLES, getProductsByCategory } from "@/lib/data";

export default function Home() {
  const { t } = useLanguage();
  const [isAllProductsOpen, setIsAllProductsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleViewMore = (category: string) => {
    setSelectedCategory(category);
    setIsAllProductsOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Promotional Announcement Bar */}
      <PromoBar />

      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Promotional Banner - Featured Collections */}
        <PromoBanner onShopNow={handleViewMore} />

        {/* Carousel Section */}
        <Carousel />

        {/* Product Sections */}
        <div className="bg-white">
          <ProductSection
            id="food-section"
            title={t.categories.food}
            products={getProductsByCategory("food")}
            category="food"
            onViewMore={handleViewMore}
          />
        </div>

        <div className="bg-gray-50">
          <ProductSection
            id="kitchenware-section"
            title={t.categories.kitchenware}
            products={getProductsByCategory("kitchenware")}
            category="kitchenware"
            onViewMore={handleViewMore}
          />
        </div>

        <div className="bg-white">
          <ProductSection
            id="artifacts-section"
            title={t.categories.artifacts}
            products={getProductsByCategory("artifacts")}
            category="artifacts"
            onViewMore={handleViewMore}
          />
        </div>

        {/* Why Sosina Mart - Features Section */}
        <FeaturesSection />
      </main>

      <Footer />

      {/* Back to Top Button */}
      <BackToTop />

      {/* All Products Modal */}
      <AllProductsModal
        isOpen={isAllProductsOpen}
        onClose={() => setIsAllProductsOpen(false)}
        initialCategory={selectedCategory}
      />
    </div>
  );
}
