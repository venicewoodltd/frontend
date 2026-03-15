"use client";

import { useState, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getSlideStyles = (
  index,
  currentIndex,
  prevIndex,
  isTransitioning,
  type,
) => {
  const isCurrent = index === currentIndex;
  const isPrev = index === prevIndex;

  switch (type) {
    case "slide-left": {
      if (isCurrent)
        return {
          transform: isTransitioning ? "translateX(0%)" : "translateX(100%)",
          opacity: 1,
          zIndex: 2,
          transition: "transform 1s ease-in-out, opacity 0.3s ease-in-out",
        };
      if (isPrev && isTransitioning)
        return {
          transform: "translateX(-100%)",
          opacity: 1,
          zIndex: 1,
          transition: "transform 1s ease-in-out",
        };
      return {
        transform: "translateX(100%)",
        opacity: 0,
        zIndex: 0,
        transition: "none",
      };
    }
    case "slide-right": {
      if (isCurrent)
        return {
          transform: isTransitioning ? "translateX(0%)" : "translateX(-100%)",
          opacity: 1,
          zIndex: 2,
          transition: "transform 1s ease-in-out, opacity 0.3s ease-in-out",
        };
      if (isPrev && isTransitioning)
        return {
          transform: "translateX(100%)",
          opacity: 1,
          zIndex: 1,
          transition: "transform 1s ease-in-out",
        };
      return {
        transform: "translateX(-100%)",
        opacity: 0,
        zIndex: 0,
        transition: "none",
      };
    }
    case "slide-up": {
      if (isCurrent)
        return {
          transform: isTransitioning ? "translateY(0%)" : "translateY(100%)",
          opacity: 1,
          zIndex: 2,
          transition: "transform 1s ease-in-out, opacity 0.3s ease-in-out",
        };
      if (isPrev && isTransitioning)
        return {
          transform: "translateY(-100%)",
          opacity: 1,
          zIndex: 1,
          transition: "transform 1s ease-in-out",
        };
      return {
        transform: "translateY(100%)",
        opacity: 0,
        zIndex: 0,
        transition: "none",
      };
    }
    case "slide-down": {
      if (isCurrent)
        return {
          transform: isTransitioning ? "translateY(0%)" : "translateY(-100%)",
          opacity: 1,
          zIndex: 2,
          transition: "transform 1s ease-in-out, opacity 0.3s ease-in-out",
        };
      if (isPrev && isTransitioning)
        return {
          transform: "translateY(100%)",
          opacity: 1,
          zIndex: 1,
          transition: "transform 1s ease-in-out",
        };
      return {
        transform: "translateY(-100%)",
        opacity: 0,
        zIndex: 0,
        transition: "none",
      };
    }
    case "zoom-in": {
      if (isCurrent)
        return {
          transform: isTransitioning ? "scale(1)" : "scale(1.3)",
          opacity: isTransitioning ? 1 : 0,
          zIndex: 2,
          transition: "transform 1.2s ease-in-out, opacity 0.8s ease-in-out",
        };
      if (isPrev && isTransitioning)
        return {
          transform: "scale(0.8)",
          opacity: 0,
          zIndex: 1,
          transition: "transform 1.2s ease-in-out, opacity 0.8s ease-in-out",
        };
      return {
        transform: "scale(1.3)",
        opacity: 0,
        zIndex: 0,
        transition: "none",
      };
    }
    case "zoom-out": {
      if (isCurrent)
        return {
          transform: isTransitioning ? "scale(1)" : "scale(0.7)",
          opacity: isTransitioning ? 1 : 0,
          zIndex: 2,
          transition: "transform 1.2s ease-in-out, opacity 0.8s ease-in-out",
        };
      if (isPrev && isTransitioning)
        return {
          transform: "scale(1.3)",
          opacity: 0,
          zIndex: 1,
          transition: "transform 1.2s ease-in-out, opacity 0.8s ease-in-out",
        };
      return {
        transform: "scale(0.7)",
        opacity: 0,
        zIndex: 0,
        transition: "none",
      };
    }
    case "morph": {
      if (isCurrent)
        return {
          transform: isTransitioning
            ? "scale(1) rotate(0deg)"
            : "scale(1.1) rotate(2deg)",
          opacity: isTransitioning ? 1 : 0,
          zIndex: 2,
          transition: "transform 1.5s ease-in-out, opacity 1s ease-in-out",
        };
      if (isPrev && isTransitioning)
        return {
          transform: "scale(0.95) rotate(-2deg)",
          opacity: 0,
          zIndex: 1,
          transition: "transform 1.5s ease-in-out, opacity 1s ease-in-out",
        };
      return {
        transform: "scale(1.1) rotate(2deg)",
        opacity: 0,
        zIndex: 0,
        transition: "none",
      };
    }
    case "flip": {
      if (isCurrent)
        return {
          transform: isTransitioning
            ? "perspective(1200px) rotateY(0deg)"
            : "perspective(1200px) rotateY(90deg)",
          opacity: isTransitioning ? 1 : 0,
          zIndex: 2,
          transition: "transform 1s ease-in-out, opacity 0.5s ease-in-out",
        };
      if (isPrev && isTransitioning)
        return {
          transform: "perspective(1200px) rotateY(-90deg)",
          opacity: 0,
          zIndex: 1,
          transition: "transform 1s ease-in-out, opacity 0.5s ease-in-out",
        };
      return {
        transform: "perspective(1200px) rotateY(90deg)",
        opacity: 0,
        zIndex: 0,
        transition: "none",
      };
    }
    case "fade":
    default:
      return {
        opacity: isCurrent ? 1 : 0,
        zIndex: isCurrent ? 1 : 0,
        transform: "none",
        transition: "opacity 1s ease-in-out",
      };
  }
};

export default function HeroCarousel() {
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState({
    interval: 5000,
    transitionType: "fade",
  });
  const [heroText, setHeroText] = useState({
    heroTitle: "Premium Bespoke Woodwork",
    heroSubtitle:
      "Handcrafted wooden furniture and architectural millwork in Mauritius. Excellence in every detail.",
    titleColor: "#4e342e",
    subtitleColor: "#1f2937",
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const transitionTimer = useRef(null);
  const defaultImage =
    "https://images.unsplash.com/photo-1549558549-415fe4c37b60?auto=format&fit=crop&w=3000&q=80";

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/hero`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setImages(data.images || []);
            setSettings(
              data.settings || { interval: 5000, transitionType: "fade" },
            );
            if (data.heroText) {
              setHeroText({
                heroTitle:
                  data.heroText.heroTitle || "Premium Bespoke Woodwork",
                heroSubtitle:
                  data.heroText.heroSubtitle ||
                  "Handcrafted wooden furniture and architectural millwork in Mauritius. Excellence in every detail.",
                titleColor: data.heroText.titleColor || "#4e342e",
                subtitleColor: data.heroText.subtitleColor || "#1f2937",
              });
            }
          }
        }
      } catch {
        /* silent */
      }
    };
    fetchHeroData();
  }, []);

  useEffect(() => {
    if (images.length === 0) return;
    images.forEach((img) => {
      const url = `${API_URL}/api/admin/hero/image/${img._id}`;
      if (!loadedImages[img._id]) {
        const preload = new Image();
        preload.onload = () =>
          setLoadedImages((prev) => ({ ...prev, [img._id]: true }));
        preload.src = url;
      }
    });
  }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToSlide = (nextIndex) => {
    if (nextIndex === currentIndex || isTransitioning) return;
    setPrevIndex(currentIndex);
    setCurrentIndex(nextIndex);
    setIsTransitioning(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
    });
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      setIsTransitioning(false);
      setPrevIndex(nextIndex);
    }, 1500);
  };

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      goToSlide((currentIndex + 1) % images.length);
    }, settings.interval);
    return () => clearInterval(timer);
  }, [images.length, settings.interval, currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      id="hero"
      className="relative overflow-hidden pt-16 md:pt-24 pb-16 md:pb-32 min-h-screen flex items-center"
    >
      {images.length > 0 ? (
        images.map((img, index) => {
          const styles = getSlideStyles(
            index,
            currentIndex,
            prevIndex,
            isTransitioning,
            settings.transitionType,
          );
          return (
            <div
              key={img._id}
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${API_URL}/api/admin/hero/image/${img._id}')`,
                backgroundAttachment: "fixed",
                ...styles,
              }}
            />
          );
        })
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${defaultImage}')`,
            backgroundAttachment: "fixed",
          }}
        />
      )}

      <div className="absolute inset-0 bg-white opacity-30 z-[2]" />

      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
        style={{ zIndex: 3 }}
      >
        <h1
          className="text-5xl md:text-7xl font-serif font-extrabold mb-4 leading-tight"
          style={{
            color: heroText.titleColor,
            textShadow: "0 2px 8px rgba(255,255,255,0.3)",
          }}
        >
          {heroText.heroTitle}
        </h1>
        <p
          className="text-lg md:text-xl max-w-3xl mx-auto mb-8"
          style={{ color: heroText.subtitleColor }}
        >
          {heroText.heroSubtitle}
        </p>
        <a
          href="/inquire"
          className="inline-block px-10 py-4 text-white font-semibold bg-[#4e342e] rounded-lg shadow-xl hover:bg-[#3e2723] transform hover:scale-105 transition duration-300 ease-in-out uppercase tracking-widest"
        >
          Get In Touch
        </a>
      </div>

      {images.length > 1 && (
        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2"
          style={{ zIndex: 4 }}
        >
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex ? "bg-[#4e342e] w-8" : "bg-[#4e342e]/50 w-2 hover:bg-[#4e342e]/75"}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
