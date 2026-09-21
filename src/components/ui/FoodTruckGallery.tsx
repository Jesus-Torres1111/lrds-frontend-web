import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getPublicGallery } from '@/api/public';

export const FoodTruckGallery = () => {
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    getPublicGallery().then(data => {
      if (data) setImages(data);
    }).catch(() => {});
  }, []);

  const getImageUrl = (pos: number) => {
    const found = images.find(img => img.posicion === pos);
    return found ? found.imagenUrl : null;
  };

  const GRID_STRUCTURE = [
    { pos: 1, classes: "col-span-2 row-span-1" },
    { pos: 2, classes: "col-span-1 row-span-2" },
    { pos: 3, classes: "col-span-1 row-span-1" },
    { pos: 4, classes: "col-span-1 row-span-1" },
    { pos: 5, classes: "col-span-1 row-span-1 hidden md:block" },
    { pos: 6, classes: "col-span-1 row-span-1 hidden md:block" }, 
    { pos: 7, classes: "col-span-1 row-span-1 hidden md:block" },
  ];

  return (
    <section className="bg-[#0a0a0a] py-24 px-4 sm:px-6 relative overflow-hidden border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-12">
          <span className="text-brand text-[10px] sm:text-xs font-black tracking-[0.4em] uppercase mb-3 block">
            La Calle Es Nuestra
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white uppercase tracking-tight">
            NUESTRO FOOD TRUCK
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[160px] md:auto-rows-[250px] gap-3 md:gap-5 max-w-5xl mx-auto">
          {GRID_STRUCTURE.map((slot, i) => {
            const url = getImageUrl(slot.pos);
            
            return (
              <motion.div 
                key={slot.pos}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-3xl overflow-hidden bg-[#111] group shadow-xl border border-white/5 ${slot.classes}`}
              >
                {url ? (
                  <>
                    <img 
                      src={url} 
                      alt={`FoodTruck ${slot.pos}`} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-10 bg-[url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800')] bg-cover bg-center grayscale" />
                )}
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  );
};