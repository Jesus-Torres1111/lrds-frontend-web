import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X } from 'lucide-react';
import whatsapp from '@/assets/whatsapp.png';
import { getPublicConfig } from '@/api/public';

export const WhatsAppButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [wappClean, setWappClean] = useState('51989451473');

  useEffect(() => {
    getPublicConfig().then((data: any) => {
      if (data && data.whatsapp) {
        setWappClean(data.whatsapp.replace(/\D/g, ''));
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-[90]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-24 right-0 w-80 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h4 className="font-bold text-white tracking-widest text-xs uppercase">Contactar Sede</h4>
              <button onClick={() => setIsOpen(false)} className="text-textSec hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-3 space-y-2">
              <a href={`https://wa.me/${wappClean}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-[#25D366]/30 transition-all group">
                <div className="w-12 h-12 rounded-full bg-[#080808] flex items-center justify-center border border-white/5 group-hover:border-[#25D366]/50 transition-colors shrink-0">
                  <img src={whatsapp} alt="WhatsApp" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm tracking-wide group-hover:text-[#25D366] transition-colors">Atención Central</h5>
                  <p className="text-xs text-textSec mt-1 flex items-center gap-1.5"><MapPin size={12} className="text-[#25D366]"/> Escríbenos ahora</p>
                </div>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-16 h-16 bg-[#0a0a0a] border-2 border-white/10 hover:border-[#25D366] rounded-full shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-300"
      >
        <img src={whatsapp} alt="whatsApp" className="w-8 h-8 object-contain" />
        <span className="absolute top-0 right-0 w-4 h-4 bg-[#25D366] border-2 border-[#0a0a0a] rounded-full"></span>
      </motion.button>
    </div>
  );
};