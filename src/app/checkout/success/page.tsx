"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Payment Successful!
      </h1>
      <p className="text-gray-600 mb-6">
        Thank you for your order. We will contact you shortly to confirm
        delivery details.
      </p>

      {sessionId && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-500 mb-1">Payment Reference</p>
          <p className="text-sm font-mono text-gray-700 break-all">
            {sessionId}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
        >
          <ShoppingBag className="w-5 h-5" />
          Continue Shopping
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full text-gray-600 py-2 text-sm hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse" />
            <p className="text-gray-400">Loading...</p>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
