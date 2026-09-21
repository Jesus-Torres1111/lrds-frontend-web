import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

export const Hero3D = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 30 });

  const translateX = useTransform(mouseXSpring, [-0.5, 0.5], ["30px", "-30px"]);
  const translateY = useTransform(mouseYSpring, [-0.5, 0.5], ["30px", "-30px"]);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const xPct = e.clientX / window.innerWidth - 0.5;
      const yPct = e.clientY / window.innerHeight - 0.5;
      x.set(xPct);
      y.set(yPct);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [x, y]);

  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 15, stiffness: 80, delay: 0.2 }}
        style={{
          x: translateX,
          y: translateY,
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
        className="relative w-full max-w-md sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-brand/20 blur-[100px] rounded-full transform translate-y-12" />
        
        <img
          src="/Burger.png"
          alt="La Bumanguesa"
          className="w-full h-auto max-h-[45vh] lg:max-h-[55vh] object-contain drop-shadow-[0_40px_50px_rgba(0,0,0,0.8)] relative z-10"
        />
      </motion.div>
    </div>
  );
};