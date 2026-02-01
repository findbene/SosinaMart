"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAROUSEL_ITEMS, SECTION_TITLES } from "@/lib/data";
import { cn } from "@/lib/utils";

// Individual video component with Intersection Observer
function VideoCard({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      className="w-full h-full object-cover"
      muted
      loop
      playsInline
      preload="auto"
    />
  );
}

export default function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  // Responsive items per view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalSlides = Math.ceil(CAROUSEL_ITEMS.length / itemsPerView);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-advance every 6 seconds (matches video length)
  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <h2 className="text-2xl md:text-3xl font-semibold text-primary text-center mb-8 uppercase tracking-wide">
          {SECTION_TITLES.carousel}
        </h2>

        {/* Carousel Container */}
        <div className="relative flex items-center gap-4">
          {/* Previous Button */}
          <Button
            variant="default"
            size="icon"
            className="flex-shrink-0 w-12 h-12 rounded-full shadow-lg z-10"
            onClick={prevSlide}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          {/* Carousel Track */}
          <div className="flex-1 overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out gap-4"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView + (4 / itemsPerView))}%)`,
              }}
            >
              {CAROUSEL_ITEMS.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex-shrink-0 aspect-[9/16] rounded-xl overflow-hidden shadow-lg relative group",
                    itemsPerView === 1 && "w-full",
                    itemsPerView === 2 && "w-[calc(50%-0.5rem)]",
                    itemsPerView === 3 && "w-[calc(33.333%-0.75rem)]"
                  )}
                >
                  {item.type === "video" ? (
                    <VideoCard
                      src={item.src}
                      title={item.title}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent-gold/20 to-brown/20 flex items-center justify-center">
                      <div className="text-center p-4">
                        <p className="font-medium text-gray-700">{item.title}</p>
                      </div>
                    </div>
                  )}

                  {/* Title overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white font-medium text-center text-sm">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <Button
            variant="default"
            size="icon"
            className="flex-shrink-0 w-12 h-12 rounded-full shadow-lg z-10"
            onClick={nextSlide}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                currentIndex === index
                  ? "bg-primary scale-125"
                  : "bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
