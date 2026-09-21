import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Package, LayoutList, Search, Plus, Edit2, Trash2, X, UtensilsCrossed, AlertTriangle, CheckCircle, RotateCcw, Clock, ChevronDown, Loader2 } from 'lucide-react';
import { getCategorias, crearCategoria, actualizarCategoria, eliminarCategoria, activarCategoria, getProductosAdmin, crearProducto, actualizarProducto, eliminarProducto, activarProducto } from '@/api/catalogo';
import { subirImagenCloudinary } from '@/api/cloudinary'; 
import type { Categoria, CategoriaRequestDTO } from '@/api/catalogo';
import type { Producto } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore'; 
import { sileo } from 'sileo';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

function ModalConfirmacion({ isOpen, title, message, onClose, onConfirm }: { isOpen: boolean; title: string; message: string; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[9999] overflow-y-auto animate-in fade-in duration-200">
      <div className="min-h-screen px-4 pt-24 pb-10 flex justify-center items-start">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col relative animate-in zoom-in-95 duration-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
            <p className="text-gray-500 text-sm font-medium mt-2">{message}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancelar</button>
            <button type="button" onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl transition-all shadow-lg shadow-[#FFC640]/30">Sí, confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalCategoria({ categoria, onClose, onGuardar }: { categoria?: Categoria | null; onClose: () => void; onGuardar: () => void; }) {
  const [nombre, setNombre] = useState(categoria?.nombre || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return sileo.error({ title: 'El nombre es obligatorio' });
    
    setLoading(true);
    try {
      const payload: CategoriaRequestDTO = { nombre };
      if (categoria) {
        await actualizarCategoria(categoria.id, payload);
        sileo.success({ title: 'Categoría actualizada exitosamente' });
      } else {
        await crearCategoria(payload);
        sileo.success({ title: 'Categoría creada exitosamente' });
      }
      onGuardar();
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.message || 'Error al guardar la categoría' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[9999] overflow-y-auto animate-in fade-in duration-200">
      <div className="min-h-screen px-4 pt-24 pb-10 flex justify-center items-start">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col relative animate-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0 rounded-t-2xl">
            <h2 className="text-gray-900 font-black text-lg tracking-tight flex items-center gap-2">
              <LayoutList className="text-blue-500" size={20} />
              {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-lg transition-all active:scale-95">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre de la Categoría</label>
              <input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold text-gray-900" placeholder="Ej. Entradas, Bebidas..." />
            </div>
            <div className="pt-2 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl disabled:opacity-50 flex justify-center items-center shadow-lg shadow-[#FFC640]/30 transition-all">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ModalProducto({ producto, categorias, onClose, onGuardar }: { producto?: Producto | null; categorias: Categoria[]; onClose: () => void; onGuardar: () => void; }) {
  const [nombre, setNombre] = useState(producto?.nombre || '');
  const [precio, setPrecio] = useState(producto?.precioVenta?.toString() || '');
  const [categoriaId, setCategoriaId] = useState(producto?.categoriaId?.toString() || (categorias[0]?.id.toString() || ''));
  const [esPreparado, setEsPreparado] = useState<boolean>(producto?.esPreparado ?? true);
  const [tiempo, setTiempo] = useState(producto?.tiempoPreparacionMinutos?.toString() || '5');
  const [tagsBusqueda, setTagsBusqueda] = useState((producto as any)?.tagsBusqueda || '');
  const [descripcionWeb, setDescripcionWeb] = useState((producto as any)?.descripcionWeb || ''); 
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>((producto as any)?.imagenUrl || null);
  
  const [pasos, setPasos] = useState<string[]>(() => {
    if (producto && (producto as any).descripcion) {
      const lineas = (producto as any).descripcion.split('\n');
      const parseadas = lineas.map((l: string) => l.replace(/^\d+\.\s*/, '').trim()).filter((l: string) => l !== '');
      if (parseadas.length > 0) return parseadas;
    }
    return [''];
  });
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categoriasFiltradasDropdown = categorias.filter(c => 
    c.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase())
  );

  const handleStepChange = (idx: number, value: string) => {
    const nuevosPasos = [...pasos];
    nuevosPasos[idx] = value;
    setPasos(nuevosPasos);
  };

  const addStep = () => setPasos([...pasos, '']);
  const removeStep = (idx: number) => setPasos(pasos.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !precio || !categoriaId) return sileo.error({ title: 'Completa todos los campos obligatorios' });
    
    const pasosFiltrados = pasos.map(p => p.trim()).filter(p => p !== '');
    const descripcionFinal = pasosFiltrados.length > 0 
      ? pasosFiltrados.map((p, i) => `${i + 1}. ${p}`).join('\n') 
      : '';

    const procesarGuardado = async () => {
      try {
        let urlImagen = (producto as any)?.imagenUrl || "";
        if (imagenArchivo) {
          sileo.info({ 
            title: 'Procesando imagen...', 
            description: <span className="text-white">Se guardará en unos segundos.</span> 
          });
          urlImagen = await subirImagenCloudinary(imagenArchivo);
        }

        const payload: any = {
          nombre, precioVenta: parseFloat(precio), categoriaId: parseInt(categoriaId),
          tipoProducto: 'BIEN', esPreparado, tiempoPreparacionMinutos: parseInt(tiempo) || 5,
          tagsBusqueda: tagsBusqueda.trim(), imagenUrl: urlImagen, 
          descripcion: descripcionFinal, 
          descripcionWeb: descripcionWeb.trim() 
        };

        if (producto) {
          await actualizarProducto(producto.id, payload);
          sileo.success({ title: 'Producto actualizado exitosamente' });
        } else {
          await crearProducto(payload);
          sileo.success({ title: 'Producto creado exitosamente' });
        }
        onGuardar();
      } catch (err: any) {
        sileo.error({ title: err.response?.data?.message || 'Error al guardar el producto' });
      }
    };

    procesarGuardado();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-[9999] overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
      <div className="min-h-screen px-4 pt-24 pb-12 flex justify-center items-start">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col relative animate-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0 rounded-t-2xl">
            <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-xl"><UtensilsCrossed className="text-orange-500" size={20} /></div>
              {producto ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-200 p-1.5 rounded-lg transition-all active:scale-95">
              <X size={20} strokeWidth={2.5}/>
            </button>
          </div>
          
          <form id="producto-form" onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Categoría Perteneciente</label>
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-xl transition-all font-bold text-sm text-gray-900 flex justify-between items-center cursor-pointer select-none ${isDropdownOpen ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    <span className={categoriaId ? "text-gray-900" : "text-gray-400"}>
                      {categoriaId ? categorias.find(c => c.id.toString() === categoriaId)?.nombre : "Seleccione una categoría..."}
                    </span>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-orange-500' : ''}`} />
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="p-2 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <Search size={16} className="text-gray-400 shrink-0 ml-1" />
                        <input type="text" autoFocus placeholder="Buscar..." value={busquedaCategoria} onChange={(e) => setBusquedaCategoria(e.target.value)} className="bg-transparent text-sm outline-none w-full font-bold text-gray-700 py-1 placeholder-gray-400"/>
                      </div>
                      <ul className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        {categoriasFiltradasDropdown.length > 0 ? (
                          categoriasFiltradasDropdown.map(c => (
                            <li key={c.id} onClick={() => { setCategoriaId(c.id.toString()); setIsDropdownOpen(false); setBusquedaCategoria(''); }} className={`px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors ${categoriaId === c.id.toString() ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                              {c.nombre}
                            </li>
                          ))
                        ) : (
                          <li className="px-4 py-4 text-center text-sm text-gray-400 font-medium">Sin resultados</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre del Plato / Bebida</label>
                  <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-bold outline-none text-gray-900" placeholder="Ej. Lomo Saltado a lo Pobre" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Etiquetas de Búsqueda (Tags)</label>
                  <input 
                    value={tagsBusqueda} 
                    onChange={e => setTagsBusqueda(e.target.value.replace(/[0-9]/g, ''))} 
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-bold outline-none text-gray-900" 
                    placeholder="Ej. carne, picante, saltado, tomate" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Precio (S/)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">S/</span>
                      <input type="number" step="0.10" min="0" value={precio} onChange={e => setPrecio(e.target.value)} className="w-full pl-8 pr-3 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-black outline-none text-gray-900" placeholder="0.00" />
                    </div>
                  </div>

                  {esPreparado ? (
                    <div className="animate-in fade-in">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Clock size={12}/> Tiempo (Min)
                      </label>
                      <input type="number" min="1" value={tiempo} onChange={e => setTiempo(e.target.value)} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-bold outline-none text-gray-900" placeholder="5" />
                    </div>
                  ) : <div></div>}
                </div>

                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-sm mt-2">
                  <div>
                    <p className="text-sm font-black text-gray-900 leading-none">Va a Cocina (KDS)</p>
                    <p className="text-xs font-medium text-gray-500 mt-1 leading-none">¿Descuenta inventario mediante receta?</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={esPreparado} onChange={() => setEsPreparado(!esPreparado)} />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Foto de Referencia (Para Cocina y Menú)</label>
                <div className="flex-1 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[200px] shadow-inner">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6 flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <UtensilsCrossed size={32} className="text-gray-300"/>
                      </div>
                      <p className="text-sm font-black text-gray-500">Sin imagen seleccionada</p>
                      <p className="text-xs font-medium text-gray-400 mt-1">Sube una foto para que cocina vea la presentación.</p>
                    </div>
                  )}
                </div>
                <div className="bg-white border border-gray-200 p-1.5 rounded-xl shadow-sm">
                  <input 
                    type="file" accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setImagenArchivo(file);
                      if (file) setPreviewUrl(URL.createObjectURL(file)); 
                      else setPreviewUrl((producto as any)?.imagenUrl || null);
                    }} 
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-6 pt-2 border-t border-gray-100">
                {/* NUEVO CAMPO: DESCRIPCIÓN WEB */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Descripción Comercial (Para clientes en la Landing Page)
                  </label>
                  <textarea 
                    value={descripcionWeb} 
                    onChange={e => setDescripcionWeb(e.target.value)} 
                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium text-gray-900 resize-none h-20" 
                    placeholder="Ej. Deliciosa hamburguesa artesanal con doble carne, queso fundido y papas crujientes..." 
                  />
                </div>

                {esPreparado && (
                  <div className="animate-in fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest text-rose-500">
                        Preparación paso a paso (Solo para Cocina)
                      </label>
                      <button type="button" onClick={addStep} className="text-[11px] font-black text-orange-500 hover:text-orange-600 flex items-center gap-1 uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 transition-colors">
                        <Plus size={14} strokeWidth={3}/> Agregar paso
                      </button>
                    </div>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 max-h-64 overflow-y-auto custom-scrollbar">
                      {pasos.map((paso, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="shrink-0 w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-xs font-black shadow-sm mt-0.5">{idx + 1}</span>
                          <textarea 
                            value={paso} 
                            onChange={e => handleStepChange(idx, e.target.value)} 
                            rows={2} 
                            className="flex-1 px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium text-gray-900 resize-none custom-scrollbar" 
                            placeholder={`Describe el paso ${idx + 1}...`} 
                          />
                          {pasos.length > 1 && (
                            <button type="button" onClick={() => removeStep(idx)} className="shrink-0 p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors mt-0.5 border border-transparent hover:border-rose-100">
                              <X size={16} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>

          <div className="p-5 border-t border-gray-100 bg-gray-50/80 flex gap-4 shrink-0 justify-end rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">
              Cancelar
            </button>
            <button form="producto-form" type="submit" className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-sm rounded-xl flex justify-center items-center shadow-md transition-all active:scale-95">
              Confirmar Guardado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductosPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'ROLE_SUPER_ADMIN' || user?.rol === 'ROLE_ADMIN_EMPRESA';

  const [tab, setTab] = useState<'PRODUCTOS' | 'CATEGORIAS'>('PRODUCTOS');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'ACTIVOS' | 'INACTIVOS'>('ACTIVOS');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalCat, setModalCat] = useState<{ isOpen: boolean; data?: Categoria | null }>({ isOpen: false });
  const [modalProd, setModalProd] = useState<{ isOpen: boolean; data?: Producto | null }>({ isOpen: false });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({ isOpen: false, title: '', message: '', action: () => {} });

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([getCategorias(), getProductosAdmin()]);
      setCategorias(cats);
      setProductos(prods);
    } catch (error) {
      sileo.error({ title: 'Error al conectar con el servidor para cargar el catálogo.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleEliminarCategoria = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Desactivar Categoría?',
      message: 'Al ocultar esta categoría, dejará de estar visible en el sistema para los usuarios.',
      action: async () => {
        try { 
          await eliminarCategoria(id); 
          sileo.success({ title: 'Categoría ocultada' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'No se pudo desactivar';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const handleActivarCategoria = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Restaurar Categoría?',
      message: 'La categoría volverá a estar visible y disponible para su uso.',
      action: async () => {
        try { 
          await activarCategoria(id); 
          sileo.success({ title: 'Categoría restaurada' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'No se pudo restaurar';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const handleEliminarProducto = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Desactivar Producto?',
      message: 'Al ocultar este producto, dejará de estar disponible en el menú de ventas.',
      action: async () => {
        try { 
          await eliminarProducto(id); 
          sileo.success({ title: 'Producto ocultado' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'No se pudo desactivar';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const handleActivarProducto = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Restaurar Producto?',
      message: 'El producto volverá a estar disponible para su venta en el catálogo.',
      action: async () => {
        try { 
          await activarProducto(id); 
          sileo.success({ title: 'Producto restaurado' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'No se pudo restaurar';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    ((p as any).tagsBusqueda && (p as any).tagsBusqueda.toLowerCase().includes(busqueda.toLowerCase()))
  );
  const prodsMostrar = productosFiltrados.filter(p => filtroEstado === 'ACTIVOS' ? p.estadoRegistro : !p.estadoRegistro);

  const categoriasFiltradas = categorias.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const catsMostrar = categoriasFiltradas.filter(c => filtroEstado === 'ACTIVOS' ? c.estadoRegistro : !c.estadoRegistro);

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-120px)] relative overflow-x-hidden">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0 pr-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Catálogo y <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Menú</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Administración de precios, platos y categorías.</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4 shrink-0 mb-4">
          <div className="flex p-1 bg-gray-50 rounded-xl w-full xl:w-auto border border-gray-100">
            <button 
              onClick={() => { setTab('PRODUCTOS'); setFiltroEstado('ACTIVOS'); setBusqueda(''); }} 
              className={`flex-1 xl:w-40 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${tab === 'PRODUCTOS' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Platos y Bebidas
            </button>
            <button 
              onClick={() => { setTab('CATEGORIAS'); setFiltroEstado('ACTIVOS'); setBusqueda(''); }} 
              className={`flex-1 xl:w-40 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${tab === 'CATEGORIAS' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Categorías
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex bg-gray-50 p-1 rounded-xl shrink-0 w-full sm:w-auto border border-gray-100">
              <button onClick={() => setFiltroEstado('ACTIVOS')} className={`flex-1 sm:w-24 py-1.5 text-xs font-bold rounded-lg transition-all ${filtroEstado === 'ACTIVOS' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>Activos</button>
              <button onClick={() => setFiltroEstado('INACTIVOS')} className={`flex-1 sm:w-24 py-1.5 text-xs font-bold rounded-lg transition-all ${filtroEstado === 'INACTIVOS' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>Inactivos</button>
            </div>

            <motion.div
              initial={false}
              animate={{ width: isSearchExpanded || busqueda ? 240 : 40 }}
              className="relative flex items-center bg-gray-50 border border-gray-200 rounded-full overflow-hidden h-10 transition-colors focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 shrink-0"
            >
              <button
                onClick={() => {
                  if (!isSearchExpanded) {
                    setIsSearchExpanded(true);
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }
                }}
                className={`absolute left-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors z-10 ${isSearchExpanded || busqueda ? 'pointer-events-none' : ''}`}
              >
                <Search size={16} />
              </button>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={tab === 'PRODUCTOS' ? "Buscar producto..." : "Buscar categoría..."}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onFocus={() => setIsSearchExpanded(true)}
                onBlur={() => {
                  if (!busqueda) setIsSearchExpanded(false);
                }}
                className={`w-full h-full pl-10 pr-10 bg-transparent text-sm font-bold text-gray-700 outline-none placeholder-gray-400 ${isSearchExpanded || busqueda ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              />
              <AnimatePresence>
                {(isSearchExpanded || busqueda) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={() => {
                      setBusqueda('');
                      setIsSearchExpanded(false);
                    }}
                    className="absolute right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
            
            {isAdmin && tab === 'PRODUCTOS' && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setModalProd({ isOpen: true, data: null })} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-2 transition-colors shadow-sm shrink-0">
                <Plus size={16} /> Nuevo Producto
              </motion.button>
            )}
            {isAdmin && tab === 'CATEGORIAS' && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setModalCat({ isOpen: true, data: null })} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-2 transition-colors shadow-sm shrink-0">
                <Plus size={16} /> Nueva Categoría
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative flex flex-col">
          {loading ? (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-orange-500 mb-3"></div>
              <p className="font-bold text-gray-600 text-sm">Sincronizando catálogo...</p>
            </div>
          ) : null}

          {tab === 'PRODUCTOS' ? (
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-black z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3">Producto</th>
                    <th className="px-6 py-3">Categoría</th>
                    <th className="px-6 py-3">Precio Venta</th>
                    <th className="px-6 py-3">Disponibilidad</th>
                    <th className="px-6 py-3 text-center">Estado del Sistema</th>
                    {isAdmin && <th className="px-6 py-3 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {prodsMostrar.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 6 : 5} className="px-8 py-24 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <Package size={32} className="text-gray-300 mb-3"/>
                            <p className="font-bold text-gray-600 text-base">{filtroEstado === 'ACTIVOS' ? 'Catálogo Vacío' : 'Sin Inactivos'}</p>
                            <p className="text-sm mt-1">No hay productos {filtroEstado === 'ACTIVOS' ? 'activos' : 'inactivos'} para mostrar.</p>
                          </div>
                        </td>
                      </tr>
                    ) : prodsMostrar.map((p) => (
                      <motion.tr variants={itemVariants} initial="hidden" animate="show" exit="hidden" key={p.id} className={`hover:bg-orange-50/30 transition-colors group ${!p.estadoRegistro ? 'opacity-80' : ''}`}>
                        <td className="px-6 py-3 font-bold text-gray-900 flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center overflow-hidden relative shrink-0 ${p.estadoRegistro ? 'bg-orange-50 border-orange-100 text-orange-500' : 'bg-gray-200 border-gray-300 text-gray-500'}`}>
                            {(p as any).imagenUrl ? (
                              <img src={(p as any).imagenUrl} alt={p.nombre} className={`w-full h-full object-cover ${!p.estadoRegistro ? 'grayscale' : ''}`} />
                            ) : (
                              <UtensilsCrossed size={16} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[13px] ${!p.estadoRegistro ? 'line-through text-gray-500' : ''}`}>{p.nombre}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {p.tipoProducto === 'SERVICIO' && <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-widest border border-blue-200">SERVICIO</span>}
                              {!p.esPreparado && <span className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-widest border border-gray-200">DIRECTO</span>}
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-3 font-medium text-[13px] ${!p.estadoRegistro ? 'text-gray-400' : 'text-gray-500'}`}>{categorias.find(c => c.id === p.categoriaId)?.nombre || 'Sin categoría'}</td>
                        <td className={`px-6 py-3 font-black text-[14px] ${!p.estadoRegistro ? 'text-gray-500' : 'text-gray-900'}`}>S/ {p.precioVenta.toFixed(2)}</td>
                        <td className="px-6 py-3">
                          {!p.estadoRegistro ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 border border-gray-200">No Aplica</span>
                          ) : p.estadoDisponibilidad === 'DISPONIBLE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200"><CheckCircle size={10}/> Disponible</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest text-red-700 bg-red-50 border border-red-200"><AlertTriangle size={10}/> Agotado</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${p.estadoRegistro ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}`}>
                            {p.estadoRegistro ? 'Activo / Visible' : 'Inactivo / Oculto'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-3">
                              <button onClick={() => setModalProd({ isOpen: true, data: p })} className={`${p.estadoRegistro ? 'text-[#FFC640]' : 'text-gray-400 hover:text-[#FFC640]'} hover:scale-110 transition-transform`} title="Editar"><Edit2 size={16} strokeWidth={2.5} /></button>
                              {p.estadoRegistro ? (
                                <button onClick={() => handleEliminarProducto(p.id)} className="text-[#C1440E] hover:scale-110 transition-transform" title="Ocultar"><Trash2 size={16} strokeWidth={2.5} /></button>
                              ) : (
                                <button onClick={() => handleActivarProducto(p.id)} className="text-emerald-500 hover:scale-110 transition-transform" title="Restaurar"><RotateCcw size={16} strokeWidth={2.5} /></button>
                              )}
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-black z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 w-1/2">Categoría</th>
                    <th className="px-6 py-3 text-center">Estado del Sistema</th>
                    {isAdmin && <th className="px-6 py-3 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {catsMostrar.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 3 : 2} className="px-8 py-24 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <LayoutList size={32} className="text-gray-300 mb-3"/>
                            <p className="font-bold text-gray-600 text-base">{filtroEstado === 'ACTIVOS' ? 'Sin Categorías' : 'Sin Inactivos'}</p>
                          </div>
                        </td>
                      </tr>
                    ) : catsMostrar.map((c) => (
                      <motion.tr variants={itemVariants} initial="hidden" animate="show" exit="hidden" key={c.id} className={`hover:bg-orange-50/30 transition-colors group ${!c.estadoRegistro ? 'opacity-80' : ''}`}>
                        <td className={`px-6 py-3 font-bold flex items-center gap-3 text-[13px] ${!c.estadoRegistro ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.estadoRegistro ? 'bg-gray-100 text-gray-500' : 'bg-gray-200 text-gray-400'}`}><LayoutList size={14} /></div>
                          {c.nombre}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${c.estadoRegistro ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}`}>
                            {c.estadoRegistro ? 'Activo / Visible' : 'Inactivo / Oculto'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-3">
                              <button onClick={() => setModalCat({ isOpen: true, data: c })} className={`${c.estadoRegistro ? 'text-[#FFC640]' : 'text-gray-400 hover:text-[#FFC640]'} hover:scale-110 transition-transform`} title="Editar"><Edit2 size={16} strokeWidth={2.5} /></button>
                              {c.estadoRegistro ? (
                                <button onClick={() => handleEliminarCategoria(c.id)} className="text-[#C1440E] hover:scale-110 transition-transform" title="Ocultar"><Trash2 size={16} strokeWidth={2.5} /></button>
                              ) : (
                                <button onClick={() => handleActivarCategoria(c.id)} className="text-emerald-500 hover:scale-110 transition-transform" title="Restaurar"><RotateCcw size={16} strokeWidth={2.5} /></button>
                              )}
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalCat.isOpen && <ModalCategoria categoria={modalCat.data} onClose={() => setModalCat({ isOpen: false })} onGuardar={() => { setModalCat({ isOpen: false }); cargarDatos(); }} />}
      {modalProd.isOpen && <ModalProducto producto={modalProd.data} categorias={categorias} onClose={() => setModalProd({ isOpen: false })} onGuardar={() => { setModalProd({ isOpen: false }); cargarDatos(); }} />}
      {confirmModal.isOpen && <ModalConfirmacion isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.action} />}
    </AdminLayout>
  );
}