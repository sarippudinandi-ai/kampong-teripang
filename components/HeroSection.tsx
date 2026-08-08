"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { GALLERY_IMAGES } from "@/lib/data";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85",
    label: "Bintan Sea Life",
    title: "Experience the\nCollagen",
    subtitle: "Edu-ekowisata teripang pertama di dunia. Menginap di atas laut, belajar dari alam.",
  },
  {
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85",
    label: "Kelong Bintan",
    title: "Sleep Above\nthe Ocean",
    subtitle: "Villa kelong autentik di atas Selat Bintan. Rasakan Sea Healing yang sesungguhnya.",
  },
  {
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&q=85",
    label: "Tradisi Bekarang",
    title: "Wisdom of\nthe Sea",
    subtitle: "Ikuti tradisi Bekarang — ritual panen teripang yang diwariskan turun-temurun.",
  },
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  
  // MOBILE: Detect mobile device
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  
  // MOBILE: Disable parallax on mobile untuk save CPU
  const heroY = useTransform(scrollYProgress, [0, 1], isMobile ? ["0%", "0%"] : ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // MOBILE HOTFIX: Slower transitions on mobile to reduce CPU load
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, isMobile ? 8000 : 6000); // MOBILE: 8s instead of 6s
    return () => clearInterval(timer);
  }, [isMobile]);

  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);

  return (
    <section ref={heroRef} className="relative h-screen min-h-[600px] overflow-hidden">
      {/* Background slides */}
      {heroSlides.map((slide, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: i === currentSlide ? 1 : 0 }}
          transition={{ 
            duration: isMobile ? 1.5 : 1.2, // MOBILE: Slightly faster transition
            ease: "easeInOut" 
          }}
          style={{ willChange: i === currentSlide ? "opacity" : "auto" }}
        >
          <motion.div 
            className="absolute inset-0" 
            style={{ 
              y: heroY, // MOBILE: Disabled via useTransform above
              willChange: isMobile ? "auto" : "transform",
            }}
          >
            <Image
              src={slide.image}
              alt={slide.label}
              fill
              className="object-cover"
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : "low"}
              quality={isMobile ? 65 : 75} // MOBILE: 65 vs Desktop: 75
              sizes="100vw"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwYTJhMmEiLz48L3N2Zz4="
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-ocean-deep/80 via-ocean-deep/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/60 via-transparent to-transparent" />
        </motion.div>
      ))}

      {/* Hero Content */}
      <motion.div 
        className="relative z-10 h-full flex items-center" 
        style={{ 
          opacity: heroOpacity,
          willChange: "opacity", // HOTFIX: GPU compositing hint
        }}
      >
        <div className="max-w-6xl mx-auto px-8 sm:px-14 lg:px-24 w-full">
          <div className="max-w-2xl">
            <motion.div
              key={`label-${currentSlide}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              style={{ willChange: "opacity, transform" }} // HOTFIX: GPU hint
              className="flex items-center gap-3 mb-4"
            >
              <div className="w-8 h-px bg-sand" />
              <span className="text-sand text-sm tracking-widest uppercase font-light">
                {heroSlides[currentSlide].label}
              </span>
            </motion.div>

            <motion.h1
              key={`title-${currentSlide}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              style={{ willChange: "opacity, transform" }} // HOTFIX: GPU hint
              className="font-serif text-5xl sm:text-6xl lg:text-7xl text-white leading-tight mb-6 whitespace-pre-line"
            >
              {heroSlides[currentSlide].title}
            </motion.h1>

            <motion.p
              key={`sub-${currentSlide}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ willChange: "opacity, transform" }} // HOTFIX: GPU hint
              className="text-white/70 text-base sm:text-lg font-light leading-relaxed mb-8 max-w-md"
            >
              {heroSlides[currentSlide].subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ willChange: "opacity, transform" }} // HOTFIX: GPU hint
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/villa#booking"
                className="btn-gold px-7 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                Book Your Stay
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/edu-tour"
                className="glass px-7 py-3.5 rounded-full text-sm font-light text-white hover:bg-white/10 transition-all flex items-center gap-2"
              >
                Explore Edu Trip
              </Link>
            </motion.div>
          </div>

          {/* Gallery Cards — sejajar dengan navbar/Book Now di kanan */}
          <div className="absolute right-8 sm:right-14 lg:right-24 top-1/2 -translate-y-1/2 hidden lg:flex gap-3 items-center">
            {GALLERY_IMAGES.slice(0, 3).map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                className={`img-zoom rounded-2xl overflow-hidden shadow-2xl ${
                  i === 1 ? "w-36 h-48" : i === 0 ? "w-28 h-36" : "w-24 h-32"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  width={200}
                  height={250}
                  className="w-full h-full object-cover"
                  sizes="(max-width: 1024px) 0vw, 200px" // Hidden di mobile, fixed size di desktop
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Slide Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
        <button
          onClick={prevSlide}
          className="w-11 h-11 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="p-3 group" // Padding transparan untuk area sentuh 48x48px
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === currentSlide ? "true" : "false"}
            >
              <span
                className={`block transition-all rounded-full ${
                  i === currentSlide ? "w-8 h-1.5 bg-sand" : "w-1.5 h-1.5 bg-white/40 group-hover:bg-white/60"
                }`}
              />
            </button>
          ))}
        </div>
        <button
          onClick={nextSlide}
          className="w-11 h-11 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all"
          aria-label="Next slide"
        >
          <ChevronRight size={18} />
        </button>
        <span className="text-white/40 text-sm font-light ml-2">
          0{currentSlide + 1}
        </span>
      </div>
    </section>
  );
}
