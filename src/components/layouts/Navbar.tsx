import { useState, useEffect } from 'react';
import { ShoppingCart, User, LogOut, Menu, X, UtensilsCrossed } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getPublicConfig } from '@/api/public';

export const Navbar = () => {
  const { items, toggleCart } = useCartStore() as any;
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { alias } = useParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [config, setConfig] = useState<any>({});
  
  const totalItems = items ? items.reduce((acc: any, item: any) => acc + item.cantidad, 0) : 0;
  const baseUrl = alias ? `/${alias}` : '/ruta-del-sabor';

  useEffect(() => {
    getPublicConfig().then((data: any) => {
      if (data) setConfig(data);
    }).catch(() => {});
  }, []);

  const handleGoToMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    navigate(`${baseUrl}/menu`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-40 bg-background/90 backdrop-blur-xl border-b border-white/5 px-6 py-5 transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to={baseUrl} onClick={() => setIsMenuOpen(false)}>
            {config.tipoLogo === 'IMAGEN' && config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="h-10 object-contain" />
            ) : (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-display font-black tracking-widest text-white uppercase">
                {config.textoNavbar || 'LA BUMANGUESA'}
              </motion.div>
            )}
          </Link>
                      
          <div className="hidden md:flex gap-8 items-center">
            <a href={`${baseUrl}/menu`} onClick={handleGoToMenu} className="text-xs font-black tracking-widest text-textSec hover:text-brand transition-colors cursor-pointer">
              NUESTRO MENÚ
            </a>
            {user ? (
              <button onClick={logout} className="flex items-center gap-2 text-textSec hover:text-red-500 transition-colors">
                <LogOut size={18} />
                <span className="text-xs font-black tracking-widest">SALIR</span>
              </button>
            ) : (
              location.pathname !== '/login' && (
                <Link to="/login" className="flex items-center gap-2 text-textSec hover:text-brand transition-colors">
                  <User size={18} />
                  <span className="text-xs font-black tracking-widest">ACCEDER / REGISTRO</span>
                </Link>
              )
            )}
                          
            <button onClick={toggleCart} className="relative flex items-center gap-2 text-textMain hover:text-brand transition-colors">
              <ShoppingCart size={22} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 bg-brand text-background text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(245,181,27,0.5)]"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
          
          <div className="flex md:hidden items-center gap-4">
            <button onClick={toggleCart} className="relative text-textMain hover:text-brand transition-colors">
              <ShoppingCart size={22} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 bg-brand text-background text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button onClick={() => setIsMenuOpen(true)} className="text-white">
              <Menu size={28} />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-[30px] left-4 right-4 z-50 bg-[#120e0a] border border-brand/30 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden md:hidden"
            >
              
              <div className="flex justify-between items-center p-4 sm:p-5 border-b-2 border-dotted border-brand/30 bg-[#080808]">
                <button onClick={() => setIsMenuOpen(false)} className="flex items-center gap-1.5 bg-brand text-background px-3 py-2 rounded-full font-bold text-[10px] sm:text-xs tracking-widest uppercase">
                  <X size={14} /> CLOSE
                </button>
                               
                {config.tipoLogo === 'IMAGEN' && config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="h-8 object-contain mx-auto" />
                ) : (
                  <span className="font-display font-black text-brand text-sm sm:text-base tracking-tighter text-center leading-none uppercase">
                    {config.textoNavbar || 'LA BUMANGUESA'}
                  </span>
                )}
                
                <button onClick={() => { setIsMenuOpen(false); toggleCart(); }} className="flex items-center gap-1.5 bg-brand text-background px-3 py-2 rounded-full font-bold text-[10px] sm:text-xs tracking-widest uppercase">
                  PIDE <ShoppingCart size={14} />
                </button>
              </div>

              <div className="flex flex-col p-4 gap-3 bg-[#0c0c0c]">
                <a href={`${baseUrl}/menu`} onClick={handleGoToMenu} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-transparent hover:border-brand/30 px-5 py-4 rounded-2xl transition-all group">
                  <div className="w-11 h-11 rounded-full bg-[#080808] flex items-center justify-center text-gray-400 group-hover:text-brand border border-white/5 group-hover:border-brand/30 transition-all shrink-0">
                    <UtensilsCrossed size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-white tracking-widest text-sm uppercase group-hover:text-brand transition-colors">Nuestra Carta</h4>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">Explora el menú completo</p>
                  </div>
                </a>

                {user ? (
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="flex items-center gap-4 bg-red-500/5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-5 py-4 rounded-2xl transition-all group w-full text-left">
                    <div className="w-11 h-11 rounded-full bg-[#080808] flex items-center justify-center text-red-500 border border-red-500/10 group-hover:scale-110 transition-transform shrink-0">
                      <LogOut size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-bold text-red-500 tracking-widest text-sm uppercase">Cerrar Sesión</h4>
                    </div>
                  </button>
                ) : (
                  location.pathname !== '/login' && (
                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 bg-brand hover:bg-white px-5 py-4 rounded-2xl transition-all group shadow-lg shadow-brand/20">
                      <div className="w-11 h-11 rounded-full bg-black/10 flex items-center justify-center text-[#0a0a0a] group-hover:scale-110 transition-transform shrink-0">
                        <User size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-black text-[#0a0a0a] tracking-widest text-sm uppercase">Acceder</h4>
                        <p className="text-[11px] text-[#0a0a0a]/70 font-bold mt-0.5">Inicia sesión o regístrate</p>
                      </div>
                    </Link>
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};