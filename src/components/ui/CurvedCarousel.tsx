import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getPublicCarousel } from '@/api/public';

export const CurvedCarousel = () => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    getPublicCarousel()
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const urls = data.sort((a, b) => a.orden - b.orden).map(img => img.imagenUrl);
          setImages(urls);
        } else {
          setImages(["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop"]);
        }
      })
      .catch(() => {
        setImages(["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop"]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      next();
    } else if (isRightSwipe) {
      prev();
    }
  };

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  if (loading) {
    return (
      <div className="py-28 flex justify-center bg-[#F9F9F6] border-y border-gray-200">
        <Loader2 className="animate-spin text-brand w-12 h-12" />
      </div>
    );
  }

  return (
    <section className="relative w-full py-28 overflow-hidden flex flex-col items-center justify-center bg-[#F9F9F6] border-y border-gray-200">
      <div className="text-center mb-16 px-4">
        <h2 className="text-4xl md:text-5xl font-display font-black text-gray-900 mb-4 tracking-tight">
          Experiencia Visual
        </h2>
        <p className="text-gray-500 font-medium tracking-wide">
          Sabor que se siente a través de la pantalla.
        </p>
      </div>

      <div 
        className="relative h-[500px] w-full max-w-7xl flex justify-center items-center perspective-[1200px] touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {images.map((img, i) => {
          let offset = i - currentIndex;
          const half = Math.floor(images.length / 2);
          
          if (offset > half) offset -= images.length;
          else if (offset < -half) offset += images.length;
          
          const absOffset = Math.abs(offset);
          const isActive = offset === 0;
          const isVisible = absOffset <= 2;
          
          return (
            <motion.div
              key={i}
              className="absolute w-[280px] md:w-[340px] h-[480px] rounded-[2rem] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.15)] cursor-pointer bg-white border border-gray-100"
              onClick={() => setCurrentIndex(i)}
              animate={{
                rotateY: offset * -20,
                scale: isActive ? 1 : 0.85 - (absOffset * 0.05),
                x: offset * 220,
                z: isActive ? 50 : -absOffset * 100,
                opacity: isVisible ? 1 : 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ 
                transformStyle: "preserve-3d", 
                zIndex: images.length - absOffset,
                pointerEvents: isVisible ? 'auto' : 'none'
              }}
            >
              <img src={img} alt={`Carrusel ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
              
              <motion.div 
                className="absolute inset-0 bg-black pointer-events-none"
                animate={{ opacity: isActive ? 0 : 0.35 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-16 z-20">
        <button 
          onClick={prev} 
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-900 shadow-xl hover:bg-brand hover:text-white hover:border-brand transition-all active:scale-95"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={next} 
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-900 shadow-xl hover:bg-brand hover:text-white hover:border-brand transition-all active:scale-95"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  );
};