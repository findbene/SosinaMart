"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Phone, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { NAV_LINKS, STORE_INFO } from "@/lib/data";
import { cn, formatPhoneForLink, scrollToElement } from "@/lib/utils";
import CartSidebar from "@/components/layout/CartSidebar";
import AllProductsModal from "@/components/products/AllProductsModal";

export default function Navbar() {
  const { cartCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAllProductsOpen, setIsAllProductsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (category: string | undefined) => {
    if (category) {
      setSelectedCategory(category);
      setIsAllProductsOpen(true);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    setSelectedCategory("all");
    setIsAllProductsOpen(true);
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-primary/98 shadow-lg backdrop-blur-sm"
            : "bg-primary"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center transition-transform hover:scale-105"
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/20">
                <Image
                  src="/images/logo.jpeg"
                  alt="Sosina Mart"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.category)}
                  className="text-white font-medium hover:text-accent-gold transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-gold transition-all group-hover:w-full" />
                </button>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Contact Button */}
              <Link
                href={formatPhoneForLink(STORE_INFO.phone)}
                className="hidden sm:flex items-center space-x-2 text-white hover:text-accent-gold transition-colors group"
              >
                <Phone className="w-5 h-5" />
                <span className="text-sm font-medium group-hover:hidden">
                  Contact
                </span>
                <span className="text-sm font-medium hidden group-hover:inline">
                  {STORE_INFO.phone}
                </span>
              </Link>

              {/* Cart Button */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:text-accent-gold hover:bg-white/10"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-gold text-primary-dark text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden transition-all duration-300 overflow-hidden",
            isMobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="px-4 py-4 space-y-2 bg-primary-dark">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.category)}
                className="block w-full text-left text-white py-3 px-4 rounded-lg hover:bg-white/10 transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link
              href={formatPhoneForLink(STORE_INFO.phone)}
              className="block w-full text-center bg-accent-gold text-primary-dark py-3 px-4 rounded-lg font-semibold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Call: {STORE_INFO.phone}
            </Link>
          </div>
        </div>
      </nav>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* All Products Modal */}
      <AllProductsModal
        isOpen={isAllProductsOpen}
        onClose={() => setIsAllProductsOpen(false)}
        initialCategory={selectedCategory}
      />
    </>
  );
}
