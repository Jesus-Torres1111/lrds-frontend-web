import { motion } from 'framer-motion';
import { ShieldCheck, Smartphone } from 'lucide-react';

export const PaymentSection = () => {
  const features = [
    { icon: <ShieldCheck size={22} />, title: "BOX DELIVERY", subtitle: "REPARTO SEGURO" },
    { icon: <Smartphone size={22} />, title: "YAPE", subtitle: "PAGO RÁPIDO" },
    { icon: <Smartphone size={22} />, title: "PLIN", subtitle: "SIN COMISIONES" },
  ];

  return (
    <section className="bg-[#0a0a0a] py-14 w-full border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-center items-start md:items-center gap-12 md:gap-24 lg:gap-32">
          {features.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="flex items-center gap-5 group"
            >
              <div className="w-[52px] h-[52px] rounded-full bg-[#141414] border border-white/5 flex items-center justify-center text-gray-400 group-hover:text-brand group-hover:border-brand/30 transition-all shrink-0">
                {item.icon}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-lg md:text-xl font-display font-black text-white tracking-wider leading-none mb-1.5">
                  {item.title}
                </span>
                <span className="text-gray-400 font-medium text-[11px] tracking-widest uppercase">
                  {item.subtitle}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};