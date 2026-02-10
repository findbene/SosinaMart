"use client";

import { useState } from "react";
import { X, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn, formatPrice, generateOrderNumber, isValidEmail, isValidPhone } from "@/lib/utils";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { items, cartTotal, clearCart } = useCart();
  const { success: toastSuccess, error: toastError } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t.checkout.nameRequired;
    }
    if (!formData.email.trim()) {
      newErrors.email = t.checkout.emailRequired;
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = t.checkout.emailInvalid;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t.checkout.phoneRequired;
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = t.checkout.phoneInvalid;
    }
    if (!formData.address.trim()) {
      newErrors.address = t.checkout.addressRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            description: item.description,
            image: item.image,
          })),
          customerInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            notes: formData.notes,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      // If Stripe session URL returned, redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      // Fallback mode (no Stripe configured) — show success in-app
      const newOrderNumber = generateOrderNumber();
      setOrderNumber(newOrderNumber);
      setIsSuccess(true);
      clearCart();

      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error submitting order:", error);
      toastError("Failed to submit order. Please try again.", "Order Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSuccess) {
      setIsSuccess(false);
      setOrderNumber("");
      onSuccess();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Modal */}
      <div data-testid="checkout-modal" className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10"
          onClick={handleClose}
        >
          <X className="w-6 h-6" />
        </Button>

        {isSuccess ? (
          /* Success State */
          <div className="p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t.checkout.orderSuccess}
            </h2>
            <p className="text-gray-600 mb-4">
              {t.checkout.orderSuccessMsg}
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">{t.checkout.orderNumber}</p>
              <p className="text-xl font-bold text-primary">{orderNumber}</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              {t.cart.continueShopping}
            </Button>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            <h2 className="text-2xl font-bold text-primary mb-6">{t.checkout.checkout}</h2>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.checkout.fullName} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn(
                    "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary",
                    errors.name && "border-red-500"
                  )}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.checkout.email} *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={cn(
                    "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary",
                    errors.email && "border-red-500"
                  )}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.checkout.phone} *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={cn(
                    "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary",
                    errors.phone && "border-red-500"
                  )}
                  placeholder="470-359-7924"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.checkout.deliveryAddress} *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={cn(
                    "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary",
                    errors.address && "border-red-500"
                  )}
                  rows={3}
                  placeholder="123 Main St, Atlanta, GA 30301"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.checkout.orderNotes}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={2}
                  placeholder={t.checkout.specialInstructions}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">{t.checkout.orderSummary}</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-3 pt-3 font-bold flex justify-between">
                <span>{items.length} {t.checkout.itemsInOrder}</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full mt-6"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t.checkout.processing}
                </>
              ) : (
                t.checkout.placeOrder
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
