import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2, Lock, Loader2, ShieldCheck, ArrowLeft, MapPin, Store, Phone, Map, UserCircle, Info } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/authStore';
import { procesarCheckoutPublico } from '@/api/public';

// Importación a prueba de fallos para Vite
import * as IzipayLibrary from '@lyracom/embedded-form-glue';

export const CartDrawer = () => {
  const { items, isCartOpen, toggleCart, removeItem, updateQuantity, clearCart, getTotal } = useCartStore() as any;
  const { user } = useAuthStore();
  
  const [view, setView] = useState<'cart' | 'checkout'>('cart');
  const [showMapHelp, setShowMapHelp] = useState(false);
  
  // Estado para Izipay
  const [formToken, setFormToken] = useState<string>('');

  const [orderData, setOrderData] = useState({
    method: 'delivery', 
    address: '',
    mapUrl: '',
    pickupName: user?.nombre || '',
    phone: '',
    reference: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const itemCount = items ? items.reduce((acc: number, item: any) => acc + item.cantidad, 0) : 0;
  const subtotal = getTotal ? getTotal() : 0;
  const deliveryCost = orderData.method === 'delivery' ? 5.00 : 0.00; 
  const total = subtotal + deliveryCost;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 9);
    setOrderData({ ...orderData, phone: onlyNumbers });
  };

  const handleCheckoutSubmit = async () => {
    if (orderData.phone.length !== 9) {
      setError('El número telefónico debe tener exactamente 9 dígitos.');
      return;
    }
    
    if (orderData.method === 'pickup') {
      if (!orderData.pickupName.trim()) {
        setError('Por favor, ingresa el nombre de la persona que recogerá el pedido.');
        return;
      }
    }

    if (orderData.method === 'delivery') {
      if (!orderData.address.trim()) {
        setError('Por favor, indica tu dirección escrita (Ej: Urb. Puente Blanco).');
        return;
      }
      if (!orderData.mapUrl.trim()) {
        setError('Por favor, pega el link de Google Maps de tu ubicación.');
        return;
      }
      if (!orderData.reference.trim()) {
        setError('Por favor, ingresa una referencia para ubicar tu casa más rápido.');
        return;
      }
    }

    setError('');
    setIsProcessing(true);
    
    try {
      const payload = {
        tipoConsumo: orderData.method === 'delivery' ? 'DELIVERY' : 'PARA_LLEVAR',
        notasGenerales: orderData.method === 'delivery' ? 'Pedido para Delivery' : 'Pedido para Recojo',
        items: items.map((i: any) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          notasPreparacion: i.notasPreparacion || ''
        })),
        telefonoContacto: orderData.phone,
        direccionEscrita: orderData.method === 'delivery' ? orderData.address : '',
        linkGoogleMaps: orderData.method === 'delivery' ? orderData.mapUrl : '',
        referencia: orderData.method === 'delivery' ? orderData.reference : '',
        nombreRecojo: orderData.method === 'pickup' ? orderData.pickupName : ''
      };

      const response = await procesarCheckoutPublico(payload);
      
      // Guardamos el token que viene desde Java
      setFormToken(response.urlPasarela || response.preferenciaPagoUrl); 
      setIsProcessing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar el pedido.');
      setIsProcessing(false);
    }
  };

  // Efecto que carga Izipay cuando tenemos un formToken
  useEffect(() => {
    if (formToken) {
      const loadIzipay = async () => {
        try {
          const loadLib = (IzipayLibrary as any).loadLibrary || (IzipayLibrary as any).default?.loadLibrary || (IzipayLibrary as any).default;
          
          if (!loadLib || typeof loadLib !== 'function') {
            throw new Error("No se pudo extraer loadLibrary del paquete de Izipay.");
          }

          // Cargamos la librería con la URL Global y la Public Key Oficial de Demostración
          const { KR } = await loadLib('https://static.lyra.com', '69876357:testpublickey_DEMOPUBLICKEY95me92597fd28tGD4r5');
          
          await KR.setFormConfig({ 
            formToken: formToken, 
            'kr-language': 'es-PE'
          });
          
          await KR.onSubmit((paymentData: any) => {
            console.log("¡Pago exitoso!", paymentData);
            clearCart();
            setView('cart');
            setFormToken('');
            toggleCart();
            return false;
          });
          
          const { result } = await KR.addForm('#myPaymentForm');
          
          // En modo Pop-in, esto abre la ventana emergente automáticamente
          await KR.showForm(result.formId);

        } catch (error) {
          console.error("Error al cargar Izipay:", error);
          setError("Error al renderizar la tarjeta de pago.");
        }
      };

      loadIzipay();
    }
  }, [formToken]);

  const handleClose = () => {
    toggleCart();
    setTimeout(() => {
      setView('cart');
      setError('');
      setShowMapHelp(false);
      setFormToken('');
    }, 300); 
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-md"
          />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-white/5 z-[101] flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center px-6 pt-6 pb-5 border-b border-white/5 bg-background z-10">
              {view === 'cart' ? (
                <div>
                  <h2 className="text-3xl font-display font-black text-white leading-none">Tu orden</h2>
                  <p className="text-sm text-textSec font-medium mt-1.5">
                    {itemCount === 0 ? 'Aún no agregas nada' : `${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => {setView('cart'); setError(''); setFormToken('');}} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-brand hover:text-black transition-colors text-white">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-2xl font-display font-black text-white leading-none uppercase">Checkout</h2>
                </div>
              )}
              <button onClick={handleClose} disabled={isProcessing} className="w-10 h-10 flex items-center justify-center bg-surface rounded-full text-textSec hover:text-white hover:bg-white/10 transition-colors border border-white/5 shrink-0 disabled:opacity-50">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide relative">
              <AnimatePresence mode="wait">
                
                {view === 'cart' && (
                  <motion.div key="cart-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                    <div className="flex-1 px-6 py-5 space-y-3">
                      {items && items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                          <div className="w-20 h-20 mb-5 rounded-full bg-surface border border-white/5 flex items-center justify-center shadow-inner">
                            <ShoppingBag size={28} className="text-textSec" />
                          </div>
                          <p className="text-lg font-bold text-white mb-1.5">Tu carrito está vacío</p>
                          <p className="text-sm text-textSec mb-6 max-w-[220px]">Explora nuestro menú al carbón y elige tus favoritos.</p>
                          <button onClick={handleClose} className="px-6 py-3 rounded-xl bg-brand/10 border border-brand/20 text-brand font-bold text-sm hover:bg-brand hover:text-black transition-colors shadow-lg">Ver productos</button>
                        </div>
                      ) : (
                        items.map((item: any) => (
                          <div key={`${item.productoId}-${item.notasPreparacion}`} className="group relative flex items-start bg-surface p-3 rounded-2xl border border-white/5 gap-3.5 shadow-sm">
                            <div className="w-16 h-16 rounded-xl bg-background overflow-hidden relative shrink-0 border border-white/5">
                              <img src={item.imagenUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600'} alt={item.nombre} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col gap-2">
                              <div className="flex justify-between items-start gap-3">
                                <h4 className="font-bold text-white leading-snug text-[15px] line-clamp-2">{item.nombre}</h4>
                                <button onClick={() => removeItem(item.productoId, item.notasPreparacion)} className="text-textSec/60 hover:text-red-500 transition-colors shrink-0 mt-0.5"><Trash2 size={16} /></button>
                              </div>
                              <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                  <span className="text-xs text-textSec">S/ {item.precio.toFixed(2)} c/u</span>
                                  <span className="font-black text-brand text-base leading-tight">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center bg-background rounded-full border border-white/5 p-1">
                                  <button onClick={() => updateQuantity(item.productoId, item.notasPreparacion, -1)} className="w-7 h-7 flex items-center justify-center text-textSec hover:text-white hover:bg-white/5 rounded-full"><Minus size={14} /></button>
                                  <span className="font-bold text-white w-7 text-center text-sm">{item.cantidad}</span>
                                  <button onClick={() => updateQuantity(item.productoId, item.notasPreparacion, 1)} className="w-7 h-7 flex items-center justify-center text-textSec hover:text-white hover:bg-white/5 rounded-full"><Plus size={14} /></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {items && items.length > 0 && (
                      <div className="px-6 pt-4 pb-6 border-t border-white/5 bg-background shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-white text-lg font-bold">Subtotal</span>
                          <span className="text-3xl font-black text-white leading-none">S/ {subtotal.toFixed(2)}</span>
                        </div>
                        <button onClick={() => setView('checkout')} className="w-full bg-brand hover:bg-white text-black font-black text-sm tracking-widest uppercase py-5 rounded-2xl shadow-lg transition-all">
                          Continuar Compra
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {view === 'checkout' && (
                  <motion.div key="checkout-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full flex flex-col">
                    <div className="flex-1 px-6 py-5 space-y-6">
                      
                      {!formToken ? (
                        <>
                          <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Método de entrega</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => {setOrderData({...orderData, method: 'delivery'}); setError('');}} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${orderData.method === 'delivery' ? 'bg-brand/10 border-brand text-brand' : 'bg-surface border-white/5 text-gray-400 hover:border-white/20'}`}>
                                <MapPin size={24} />
                                <span className="font-bold text-sm">Delivery</span>
                              </button>
                              <button onClick={() => {setOrderData({...orderData, method: 'pickup'}); setError('');}} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${orderData.method === 'pickup' ? 'bg-brand/10 border-brand text-brand' : 'bg-surface border-white/5 text-gray-400 hover:border-white/20'}`}>
                                <Store size={24} />
                                <span className="font-bold text-sm">Recojo en Sede</span>
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block border-b border-white/5 pb-2">Tus Datos</label>
                            
                            <div className="space-y-4">
                              <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input 
                                  type="tel" placeholder="Teléfono de contacto (9 dígitos)" 
                                  value={orderData.phone} onChange={handlePhoneChange}
                                  className="w-full pl-11 pr-4 py-3.5 bg-surface border border-white/10 rounded-xl text-white text-sm font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder-gray-600"
                                />
                                {orderData.phone.length === 9 && (
                                  <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                                )}
                              </div>

                              <AnimatePresence mode="wait">
                                {orderData.method === 'pickup' && (
                                  <motion.div key="pickup-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative pt-1 overflow-hidden">
                                    <UserCircle className="absolute left-4 top-[1.3rem] text-gray-500" size={18} />
                                    <input 
                                      type="text" placeholder="Nombre de quien recoge" 
                                      value={orderData.pickupName} onChange={(e) => setOrderData({...orderData, pickupName: e.target.value})}
                                      className="w-full pl-11 pr-4 py-3.5 bg-surface border border-white/10 rounded-xl text-white text-sm font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder-gray-600"
                                    />
                                  </motion.div>
                                )}

                                {orderData.method === 'delivery' && (
                                  <motion.div key="delivery-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden pt-1">
                                    
                                    <div className="relative">
                                      <MapPin className="absolute left-4 top-[1.05rem] text-gray-500" size={18} />
                                      <input 
                                        type="text" placeholder="Dirección escrita (Ej: Urb. Puente Blanco)" 
                                        value={orderData.address} onChange={(e) => setOrderData({...orderData, address: e.target.value})}
                                        className="w-full pl-11 pr-4 py-3.5 bg-surface border border-white/10 rounded-xl text-white text-sm font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder-gray-600"
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="relative">
                                        <Map className="absolute left-4 top-[1.05rem] text-gray-500" size={18} />
                                        <input 
                                          type="text" placeholder="Link de Google Maps" 
                                          value={orderData.mapUrl} onChange={(e) => setOrderData({...orderData, mapUrl: e.target.value})}
                                          className="w-full pl-11 pr-12 py-3.5 bg-surface border border-white/10 rounded-xl text-white text-sm font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder-gray-600"
                                        />
                                        <button 
                                          type="button"
                                          onClick={() => setShowMapHelp(!showMapHelp)}
                                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand transition-colors"
                                        >
                                          <Info size={20} />
                                        </button>
                                      </div>
                                      
                                      <AnimatePresence>
                                        {showMapHelp && (
                                          <motion.div 
                                            initial={{ opacity: 0, height: 0 }} 
                                            animate={{ opacity: 1, height: 'auto' }} 
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="bg-brand/10 border border-brand/20 p-3.5 rounded-xl text-xs text-gray-300 space-y-2 font-medium">
                                              <p className="text-brand font-bold">¿Cómo obtener tu link?</p>
                                              <p>1. Abre la app de <strong className="text-white">Google Maps</strong>.</p>
                                              <p>2. Mantén presionado sobre tu ubicación exacta.</p>
                                              <p>3. Toca el botón <strong className="text-white">Compartir</strong>.</p>
                                              <p>4. Selecciona <strong className="text-white">Copiar enlace</strong> y pégalo aquí.</p>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>

                                    <div className="relative">
                                      <input 
                                        type="text" placeholder="Referencia de la casa" 
                                        value={orderData.reference} onChange={(e) => setOrderData({...orderData, reference: e.target.value})}
                                        className="w-full px-4 py-3.5 bg-surface border border-white/10 rounded-xl text-white text-sm font-bold focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder-gray-600"
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <AnimatePresence>
                              {error && (
                                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex items-start gap-2">
                                  <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                                  {error}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center min-h-[400px]">
                          {/* 1. CARGAMOS LOS ESTILOS OFICIALES DE IZIPAY */}
                          <link rel="stylesheet" href="https://static.lyra.com/static/js/krypton-client/V4.0/ext/classic-reset.css" />
                          <link rel="stylesheet" href="https://static.lyra.com/static/js/krypton-client/V4.0/ext/classic.css" />
                          
                          {/* 2. CAMBIAMOS A MODO POP-IN */}
                          <div className="kr-popin" id="myPaymentForm"></div>
                          
                          <p className="text-gray-400 text-sm font-bold mt-4 animate-pulse">Abriendo ventana de pago seguro...</p>
                        </div>
                      )}

                    </div>

                    {!formToken && (
                      <div className="px-6 pt-4 pb-6 border-t border-white/5 bg-background shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        <div className="space-y-1.5 mb-5">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-textSec font-medium">Subtotal</span>
                            <span className="text-white font-bold">S/ {subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-textSec font-medium">Costo de envío</span>
                            <span className="text-emerald-400 font-bold">{deliveryCost === 0 ? '¡GRATIS!' : `S/ ${deliveryCost.toFixed(2)}`}</span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-2">
                            <span className="text-white text-lg font-bold">Total a pagar</span>
                            <span className="text-3xl font-black text-white leading-none tracking-tighter">S/ {total.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="bg-surface/50 border border-white/5 p-3.5 rounded-xl mb-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-[#FF2A3B]" />
                            <span className="text-[10px] font-black tracking-widest text-white uppercase">Checkout Seguro Izipay</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="px-2 py-1 bg-white/5 border border-white/10 text-white rounded text-[9px] font-black tracking-wider">VISA</span>
                            <span className="px-2 py-1 bg-white/5 border border-white/10 text-white rounded text-[9px] font-black tracking-wider">MASTERCARD</span>
                            <span className="px-2 py-1 bg-[#FF2A3B]/10 border border-[#FF2A3B]/30 text-[#FF2A3B] rounded text-[9px] font-black tracking-wider">AMEX</span>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          disabled={isProcessing} onClick={handleCheckoutSubmit}
                          className="relative overflow-hidden w-full flex items-center justify-center gap-2 bg-[#FF2A3B] hover:bg-[#D61F2C] text-white font-black text-sm tracking-widest uppercase py-5 rounded-2xl shadow-[0_0_20px_rgba(255,42,59,0.3)] disabled:opacity-50 transition-all"
                        >
                          {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Conectando a Caja...</> : <><Lock size={18} /> Proceder al Pago</>}
                        </motion.button>
                      </div>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};