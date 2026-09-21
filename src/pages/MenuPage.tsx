import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCartStore } from '@/store/useCartStore';
import { Navbar } from '@/components/layouts/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Footer } from '@/components/layouts/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { getPublicCategorias, getPublicProductos } from '@/api/public';

const ImmersiveCard = ({ product, addToCart, nombreCategoria }: { product: any, addToCart: (p: any) => void, nombreCategoria: string }) => {
  const isAgotado = product.estadoDisponibilidad !== 'DISPONIBLE';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`relative h-[520px] w-full rounded-[2.5rem] overflow-hidden group shadow-xl transition-shadow duration-500 border border-white/10 ${
        isAgotado ? 'grayscale opacity-70' : 'cursor-pointer hover:shadow-2xl'
      }`}
    >
      <img 
        src={product.imagenUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600'} 
        alt={product.nombre} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500" />

      <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-20">
        <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-full">
          {nombreCategoria}
        </span>
        
        <div className="bg-brand text-[#0a0a0a] font-black text-lg px-4 py-2 rounded-2xl shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
          S/ {Number(product.precioVenta).toFixed(2)}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col justify-end">
        <h3 className="text-3xl sm:text-4xl font-black text-white leading-none tracking-tight">
          {product.nombre}
        </h3>

        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out">
          <div className="overflow-hidden">
            <p className="text-gray-300 text-sm font-medium leading-relaxed mt-4 mb-6 line-clamp-3">
              {product.descripcionWeb || 'Especialidad de la casa, preparada con los mejores ingredientes.'}
            </p>
          </div>
        </div>

        {isAgotado ? (
          <button disabled className="w-full bg-red-500/20 text-red-500 border border-red-500/30 py-4 rounded-2xl font-black tracking-widest text-sm flex justify-center items-center mt-2">
            AGOTADO
          </button>
        ) : (
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              addToCart({ 
                productoId: product.id, 
                nombre: product.nombre, 
                precio: product.precioVenta, 
                cantidad: 1, 
                notasPreparacion: '',
                imagenUrl: product.imagenUrl
              }); 
            }} 
            className="w-full bg-white/10 hover:bg-brand text-white hover:text-[#0a0a0a] border border-white/20 hover:border-brand backdrop-blur-md py-4 rounded-2xl font-black tracking-widest text-sm transition-all duration-300 flex justify-center items-center gap-2 group/btn mt-2"
          >
            <ShoppingBag className="group-hover/btn:-translate-y-1 transition-transform duration-300" size={18} />
            AGREGAR
          </button>
        )}
      </div>
    </motion.div>
  );
};

export const MenuPage = () => {
  const navigate = useNavigate();
  const { alias } = useParams();
  const addItem = useCartStore((state: any) => state.addItem);
  
  const [categorias, setCategorias] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | 'TODO'>('TODO');
  const [loading, setLoading] = useState(true);

  const baseUrl = alias ? `/${alias}` : '/ruta-del-sabor';

  // 1. Cargamos categorías y productos en paralelo, igual que en MenuGrid
  useEffect(() => {
    Promise.all([getPublicCategorias(), getPublicProductos()])
      .then(([catsData, prodsData]) => {
        if (catsData) setCategorias(catsData);
        if (prodsData) setProductos(prodsData);
      })
      .catch(error => console.error("Error cargando el catálogo:", error))
      .finally(() => setLoading(false));
  }, []);

  // 2. Filtramos usando categoriaId
  const filteredProducts = activeCategory === 'TODO' 
    ? productos 
    : productos.filter(p => p.categoriaId === activeCategory);

  return (
    <div className="min-h-screen relative font-sans bg-[#0c0c0c] text-white selection:bg-brand selection:text-background">
      <Navbar />
      <CartDrawer />
      <WhatsAppButton />

      <section className="relative min-h-[500px] w-full flex flex-col justify-center pt-32 pb-16 px-6 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1920&auto=format&fit=crop" 
            alt="Fondo Restaurante" 
            className="w-full h-full object-cover scale-105 filter brightness-90"
          />
          <div className="absolute inset-0 bg-[#080808]/80 backdrop-blur-[2px]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0c0c0c] to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
          <button 
            onClick={() => navigate(baseUrl)} 
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold text-xs tracking-widest uppercase mb-6 backdrop-blur-md border border-white/10 transition-colors"
          >
            <ArrowLeft size={16} /> Volver al inicio
          </button>

          <div className="max-w-3xl mx-auto">
            <span className="text-brand text-xs sm:text-sm font-black tracking-[0.4em] uppercase mb-3 block">
              Catálogo Oficial
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black uppercase tracking-tight mb-4 text-white drop-shadow-md">
              Nuestra Carta Completa
            </h1>
            <p className="text-gray-300 text-sm sm:text-base font-medium">
              Explora todas nuestras especialidades preparadas al carbón y elige tus favoritas para ordenar al instante.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full py-16 px-6 bg-[#0c0c0c]">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-16">
            <button
              onClick={() => setActiveCategory('TODO')}
              className={`relative px-6 py-3 rounded-full text-sm font-bold transition-colors z-10 ${
                activeCategory === 'TODO' ? 'text-background' : 'text-textSec hover:text-white'
              }`}
            >
              {activeCategory === 'TODO' && (
                <motion.div 
                  layoutId="active-pill-menu-page" 
                  className="absolute inset-0 bg-brand rounded-full -z-10 shadow-lg" 
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} 
                />
              )}
              <span className="relative z-20">TODO</span>
            </button>

            {categorias.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id} 
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative px-6 py-3 rounded-full text-sm font-bold transition-colors z-10 ${
                    isActive ? 'text-background' : 'text-textSec hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill-menu-page" 
                      className="absolute inset-0 bg-brand rounded-full -z-10 shadow-lg" 
                      transition={{ type: "spring", stiffness: 300, damping: 30 }} 
                    />
                  )}
                  <span className="relative z-20">{cat.nombre}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-brand w-12 h-12" />
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
                  // 3. Cruzamos el ID del producto con la lista de categorías para obtener el nombre real
                  const catName = categorias.find(c => c.id === product.categoriaId)?.nombre || 'General';
                  
                  return (
                    <ImmersiveCard 
                      key={product.id} 
                      product={product} 
                      addToCart={addItem} 
                      nombreCategoria={catName} 
                    />
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium">No hay platos disponibles en esta categoría por el momento.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};