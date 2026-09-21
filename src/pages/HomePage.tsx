import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layouts/Navbar';
import { Hero3D } from '@/components/ui/Hero3D';
import { MenuGrid } from '@/components/menu/MenuGrid';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Footer } from '@/components/layouts/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { PaymentSection } from '@/components/ui/PaymentSection';
import { CurvedCarousel } from '@/components/ui/CurvedCarousel';
import { FoodTruckGallery } from '@/components/ui/FoodTruckGallery';
import { getPublicConfig } from '@/api/public';

export const Home = () => {
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    getPublicConfig().then((data: any) => {
      if (data) setConfig(data);
    }).catch(() => {});
  }, []);

  const scale = config.escalaTituloHero ? Number(config.escalaTituloHero) : 1.0;

  const colorEtiqueta = config.colorEtiquetaHero || '#f97316';
  const colorTitulo1 = config.colorTitulo1 || '#ffffff';
  const colorTitulo2 = config.colorTitulo2 || '#f5b51b';

  return (
    <div className="min-h-screen relative font-sans bg-background selection:bg-brand selection:text-background">
      <Navbar />
      <CartDrawer />
      <WhatsAppButton />
      
      <section className="relative min-h-screen sm:min-h-[900px] w-full flex flex-col justify-between pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1920&auto=format&fit=crop" 
            alt="Fondo Restaurante" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-[#080808]/75 backdrop-blur-[1px]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        <div className="relative z-10 text-center flex flex-col items-center w-full px-4 shrink-0 mt-2 sm:mt-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-4 sm:mb-6"
          >
            <div className="w-12 sm:w-20 h-[1px]" style={{ backgroundImage: `linear-gradient(to right, transparent, ${colorEtiqueta})` }} />
            <span style={{ color: colorEtiqueta }} className="text-xs sm:text-sm font-black tracking-[0.4em] uppercase text-shadow-sm">
              {config.etiquetaHero || 'Fuego & Sabor'}
            </span>
            <div className="w-12 sm:w-20 h-[1px]" style={{ backgroundImage: `linear-gradient(to left, transparent, ${colorEtiqueta})` }} />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 20, delay: 0.2 }}
            className="leading-[0.85] font-black font-display tracking-tighter uppercase drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
            style={{ fontSize: `calc(10vw * ${scale})`, color: colorTitulo1 }}
          >
            {config.tituloHero1 || 'SABOR REAL'}
          </motion.h1>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ opacity: { delay: 0.4 }, y: { delay: 0.4 } }}
            className="leading-none font-black font-display tracking-tight uppercase mt-2 drop-shadow-[0_5px_3px_rgba(0,0,0,0.9)]"
            style={{ 
              WebkitTextStroke: '1px rgba(255,255,255,0.15)',
              fontSize: `calc(4.5vw * ${scale})`,
              color: colorTitulo2
            }}
          >
            {config.tituloHero2 || 'BUMANGUESA'}
          </motion.h2>
        </div>

        <div className="relative z-20 flex-1 w-full flex items-center justify-center mt-6 mb-10 min-h-[30vh]">
          <Hero3D />
        </div>

        <div className="relative z-30 px-6 shrink-0 flex justify-center pb-4">
          <motion.button 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-brand text-background px-12 py-5 rounded-full font-black tracking-widest text-sm hover:bg-white hover:text-background transition-colors shadow-[0_0_40px_rgba(245,181,27,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] uppercase"
          >
            Ver la Carta
          </motion.button>
        </div>
      </section>

      <PaymentSection />
      <CurvedCarousel />
      <FoodTruckGallery />
      <MenuGrid />
      <Footer />
    </div>
  );
};