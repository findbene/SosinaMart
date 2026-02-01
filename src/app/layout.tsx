import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Sosina Mart - Ethiopian Store in Atlanta",
  description:
    "Authentic Ethiopian products - Injera, Spices, Traditional Clothes, Artifacts & More. Based in Atlanta, Georgia.",
  keywords: [
    "Ethiopian store",
    "Atlanta",
    "Injera",
    "Berbere",
    "Habesha",
    "Ethiopian kitchenware",
    "Ethiopian food",
    "Tucker GA",
  ],
  authors: [{ name: "Sosina Mart" }],
  openGraph: {
    title: "Sosina Mart - Ethiopian Store in Atlanta",
    description: "Authentic Ethiopian products in Atlanta, Georgia",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
