"use client";

import { useEffect, useRef, useState } from "react";
import { Shield, Truck, Coffee, Heart, Star, Globe } from "lucide-react";

const features = [
  {
    icon: Coffee,
    title: "100% Authentic",
    description: "Direct from Ethiopia — genuine spices, coffee, and handcrafted products",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    icon: Truck,
    title: "Free Local Delivery",
    description: "Free delivery within 15 miles on orders over $50",
    color: "bg-green-50 text-green-700 border-green-200",
  },
  {
    icon: Heart,
    title: "Ethiopian Heritage",
    description: "Sharing culture through food, art, and community since day one",
    color: "bg-red-50 text-red-700 border-red-200",
  },
  {
    icon: Star,
    title: "Premium Quality",
    description: "Hand-selected products meeting the highest quality standards",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  {
    icon: Shield,
    title: "Secure Shopping",
    description: "Safe checkout with 30-day return policy on unopened items",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    icon: Globe,
    title: "4 Languages",
    description: "Shop in English, Amharic, Tigrigna, or Spanish",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className={`text-2xl md:text-3xl font-bold text-gray-900 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            Why Shop at Sosina Mart?
          </h2>
          <p className={`mt-3 text-gray-600 max-w-2xl mx-auto transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            Bringing the authentic taste and culture of Ethiopia to your doorstep
          </p>
          <div className={`mt-4 flex items-center justify-center gap-1.5 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="h-0.5 w-6 bg-green-600 rounded-full" />
            <div className="h-0.5 w-10 bg-yellow-500 rounded-full" />
            <div className="h-0.5 w-6 bg-red-600 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`p-6 rounded-xl border-2 ${feature.color} transition-all duration-700 hover:shadow-lg hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: isVisible ? `${index * 100 + 200}ms` : '0ms' }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{feature.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
