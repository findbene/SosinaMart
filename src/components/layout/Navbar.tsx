"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Phone, Menu, X, User, LogOut, Settings, Package, LayoutDashboard, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { NAV_LINKS, STORE_INFO } from "@/lib/data";
import { cn, formatPhoneForLink, scrollToElement } from "@/lib/utils";
import CartSidebar from "@/components/layout/CartSidebar";
import AllProductsModal from "@/components/products/AllProductsModal";
import LanguageDropdown from "@/components/layout/LanguageDropdown";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { cartCount } = useCart();
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAllProductsOpen, setIsAllProductsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdmin = (session?.user as { role?: string })?.role === "admin";

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
              {NAV_LINKS.map((link) => {
                const navLabel = (t.nav as Record<string, string>)[link.category || ''] || link.label;
                return (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.category)}
                    className="text-white font-medium hover:text-accent-gold transition-colors relative group"
                  >
                    {navLabel}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-gold transition-all group-hover:w-full" />
                  </button>
                );
              })}
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Language Dropdown */}
              <LanguageDropdown />

              {/* Contact Button */}
              <Link
                href={formatPhoneForLink(STORE_INFO.phone)}
                className="hidden sm:flex items-center space-x-2 text-white hover:text-accent-gold transition-colors group"
              >
                <Phone className="w-5 h-5" />
                <span className="text-sm font-medium group-hover:hidden">
                  {t.nav.contact}
                </span>
                <span className="text-sm font-medium hidden group-hover:inline">
                  {STORE_INFO.phone}
                </span>
              </Link>

              {/* Cart Button */}
              <Button
                data-testid="cart-button"
                variant="ghost"
                size="icon"
                className="relative text-white hover:text-accent-gold hover:bg-white/10"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span data-testid="cart-count" className="absolute -top-1 -right-1 w-5 h-5 bg-accent-gold text-primary-dark text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                {session ? (
                  <>
                    <Button
                      variant="ghost"
                      className="text-white hover:text-accent-gold hover:bg-white/10 flex items-center gap-1"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                      <User className="w-5 h-5" />
                      <span className="hidden sm:inline text-sm">{session.user?.name?.split(' ')[0] || 'Account'}</span>
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isUserMenuOpen && "rotate-180")} />
                    </Button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                        {isAdmin && (
                          <>
                            <Link
                              href="/admin"
                              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              {t.nav.adminDashboard}
                            </Link>
                            <div className="border-t my-1" />
                          </>
                        )}
                        <Link
                          href="/account"
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          {t.nav.myAccount}
                        </Link>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Package className="w-4 h-4" />
                          {t.nav.myOrders}
                        </Link>
                        <Link
                          href="/account/settings"
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          {t.nav.settings}
                        </Link>
                        <div className="border-t my-1" />
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          {t.nav.signOut}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="text-white hover:text-accent-gold hover:bg-white/10"
                    >
                      <User className="w-5 h-5 mr-1" />
                      <span className="hidden sm:inline">{t.nav.login}</span>
                    </Button>
                  </Link>
                )}
              </div>

              {/* Mobile Menu Button */}
              <Button
                data-testid="mobile-menu-button"
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
            isMobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="px-4 py-4 space-y-2 bg-primary-dark">
            {NAV_LINKS.map((link) => {
              const navLabel = (t.nav as Record<string, string>)[link.category || ''] || link.label;
              return (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.category)}
                  className="block w-full text-left text-white py-3 px-4 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {navLabel}
                </button>
              );
            })}

            {/* Mobile User Links */}
            {session ? (
              <>
                <div className="border-t border-white/20 my-2" />
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 text-accent-gold py-3 px-4 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    {t.nav.adminDashboard}
                  </Link>
                )}
                <Link
                  href="/account"
                  className="flex items-center gap-2 text-white py-3 px-4 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  {t.nav.myAccount}
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-2 text-white py-3 px-4 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Package className="w-5 h-5" />
                  {t.nav.myOrders}
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex items-center gap-2 text-red-400 py-3 px-4 rounded-lg hover:bg-white/10 transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  {t.nav.signOut}
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-white/20 my-2" />
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-white py-3 px-4 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  {t.nav.loginRegister}
                </Link>
              </>
            )}

            <Link
              href={formatPhoneForLink(STORE_INFO.phone)}
              className="block w-full text-center bg-accent-gold text-primary-dark py-3 px-4 rounded-lg font-semibold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t.common.call}: {STORE_INFO.phone}
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
