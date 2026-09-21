import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
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
              {/* Lee la descripción comercial web y deja la receta para cocina */}
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

export const MenuGrid = () => {
  const addItem = useCartStore((state: any) => state.addItem);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | 'TODO'>('TODO');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPublicCategorias(), getPublicProductos()])
      .then(([catsData, prodsData]) => {
        if (catsData) setCategorias(catsData);
        if (prodsData) setProductos(prodsData);
      })
      .catch(error => console.error("Error cargando el catálogo:", error))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = activeCategory === 'TODO'
    ? categorias.flatMap(cat => 
        productos.filter(p => p.categoriaId === cat.id).slice(0, 6)
      )
    : productos.filter(p => p.categoriaId === activeCategory).slice(0, 6);

  return (
    <section id="menu-section" className="w-full py-28 bg-[#F9F9F6] border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-black text-gray-900 mb-4">Nuestra Carta</h2>
          <p className="text-gray-500 font-medium tracking-wide">La mejor selección, preparada al momento.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-brand" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              <button
                onClick={() => setActiveCategory('TODO')}
                className={`px-8 py-2.5 rounded-full font-black text-[11px] tracking-widest uppercase transition-all shadow-sm active:scale-95 ${
                  activeCategory === 'TODO' 
                    ? 'bg-[#0f172a] text-white' 
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-900 hover:text-gray-900'
                }`}
              >
                TODO
              </button>

              {categorias.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id} 
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-8 py-2.5 rounded-full font-black text-[11px] tracking-widest uppercase transition-all shadow-sm active:scale-95 ${
                      isActive 
                        ? 'bg-[#0f172a] text-white' 
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-900 hover:text-gray-900'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                );
              })}
            </div>

            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
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

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 font-medium">No hay platos disponibles en esta categoría por el momento.</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};