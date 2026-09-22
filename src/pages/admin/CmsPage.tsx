import React, { useEffect, useState, useRef } from 'react';
import { 
  Save, Image as ImageIcon, Phone, Clock, Mail, 
  UploadCloud, Loader2, Trash2, LayoutTemplate, Link as LinkIcon, Palette, Monitor, 
  ChevronDown, LayoutGrid, MousePointerClick, ArrowUpRight, Plus, CreditCard, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/components/layouts/AdminLayout';
import { sileo } from 'sileo';
import { subirImagenCloudinary } from '@/api/cloudinary';
import { 
  getConfiguracionWeb, guardarConfiguracionWeb, 
  getCarruselWeb, agregarImagenCarrusel, eliminarImagenCarrusel,
  getGaleriaWeb, guardarImagenGaleriaWeb, eliminarImagenGaleriaWeb,
  eliminarImagenSeltaWeb
} from '@/api/cms';

const TimeSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const times = [];
  for(let i=0; i<24; i++) {
    const h = i.toString().padStart(2, '0');
    times.push(`${h}:00`);
    times.push(`${h}:30`);
  }
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer">
        {times.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16}/>
    </div>
  );
};

export default function CmsPage() {
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingElement, setDeletingElement] = useState(false);
  const [uploadingBentoCaja1, setUploadingBentoCaja1] = useState(false);
  const [uploadingBentoTop, setUploadingBentoTop] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [horarios, setHorarios] = useState([{ dias: 'Lun - Dom', apertura: '12:00', cierre: '23:00' }]);

  const [config, setConfig] = useState({
    telefonoPedidos: '', whatsapp: '', correoContacto: '', horarioAtencion: '', facebookUrl: '', instagramUrl: '',
    tipoLogo: 'TEXTO', logoUrl: '', textoNavbar: '', etiquetaHero: '', tituloHero1: '', tituloHero2: '', escalaTituloHero: 1.00,
    colorEtiquetaHero: '#f97316', colorTitulo1: '#ffffff', colorTitulo2: '#f5b51b',
    bentoCtaTipoCaja1: 'TEXTO', bentoCtaTextoCaja1: 'LA', bentoCtaImagenCaja1: '', bentoCtaTextoCaja2: 'TIENDA ROJAS',
    bentoCtaImagenTop: '', bentoCtaEtiquetaTop: '100% ARTESANAL', bentoCtaTituloTop: 'El verdadero sabor al carbón.',
    bentoCtaEscalaCaja1: 1.00, bentoCtaEscalaCaja2: 1.00,
    limiteImagenesCarrusel: 7 as number | string,
    izipayShopId: '', izipayApiKey: '', izipayPublicKey: '', izipayHmacKey: ''
  });

  const [imagenes, setImagenes] = useState<any[]>([]);
  const [galeria, setGaleria] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isTipoLogoOpen, setIsTipoLogoOpen] = useState(false);
  const [isTipoCaja1Open, setIsTipoCaja1Open] = useState(false);
  const [uploadingGaleria, setUploadingGaleria] = useState<number | null>(null);
  const [targetPosicion, setTargetPosicion] = useState<number | null>(null); 

  const inputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const tipoLogoRef = useRef<HTMLDivElement>(null);
  const tipoCaja1Ref = useRef<HTMLDivElement>(null);
  const galeriaInputRef = useRef<HTMLInputElement>(null);
  const bentoCaja1InputRef = useRef<HTMLInputElement>(null);
  const bentoTopInputRef = useRef<HTMLInputElement>(null);

  const opcionesLogo = [{ value: 'TEXTO', label: 'Solo Texto' }, { value: 'IMAGEN', label: 'Subir Imagen' }];
  const ESTRUCTURA_GALERIA = [
    { pos: 1, titulo: 'Horizontal (16:9)', class: 'col-span-2 row-span-1 md:col-span-2 md:row-span-1' },
    { pos: 2, titulo: 'Vertical (9:16)', class: 'col-span-1 row-span-2 md:col-span-1 md:row-span-2' },
    { pos: 3, titulo: 'Cuadrada 1', class: 'col-span-1 row-span-1 md:col-span-1 md:row-span-1' },
    { pos: 4, titulo: 'Cuadrada 2', class: 'col-span-1 row-span-1 md:col-span-1 md:row-span-1' },
    { pos: 5, titulo: 'Cuadrada 3', class: 'col-span-1 row-span-1 md:col-span-1 md:row-span-1' },
    { pos: 6, titulo: 'Cuadrada 4', class: 'col-span-1 row-span-1 md:col-span-1 md:row-span-1' },
    { pos: 7, titulo: 'Cuadrada 5', class: 'col-span-1 row-span-1 md:col-span-1 md:row-span-1' },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tipoLogoRef.current && !tipoLogoRef.current.contains(event.target as Node)) setIsTipoLogoOpen(false);
      if (tipoCaja1Ref.current && !tipoCaja1Ref.current.contains(event.target as Node)) setIsTipoCaja1Open(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [confData, imgData, galData] = await Promise.allSettled([getConfiguracionWeb(), getCarruselWeb(), getGaleriaWeb()]);
      
      if (confData.status === 'fulfilled' && confData.value) {
        const cData = confData.value;

        const dataLimpia = Object.keys(cData).reduce((acc, key) => {
          acc[key] = cData[key] === null ? '' : cData[key];
          return acc;
        }, {} as any);

        setConfig({
          ...config, 
          ...dataLimpia, 
          escalaTituloHero: cData.escalaTituloHero ? Number(cData.escalaTituloHero) : 1.00,
          bentoCtaEscalaCaja1: cData.bentoCtaEscalaCaja1 ? Number(cData.bentoCtaEscalaCaja1) : 1.00,
          bentoCtaEscalaCaja2: cData.bentoCtaEscalaCaja2 ? Number(cData.bentoCtaEscalaCaja2) : 1.00,
          limiteImagenesCarrusel: cData.limiteImagenesCarrusel || 7,
          izipayShopId: cData.izipayShopId || '',
          izipayPublicKey: cData.izipayPublicKey || '',
          izipayApiKey: '',
          izipayHmacKey: ''
        });

        if (cData.horarioAtencion) {
          try {
            const parsed = JSON.parse(cData.horarioAtencion);
            if (Array.isArray(parsed)) setHorarios(parsed);
          } catch (e) {
            const parts = cData.horarioAtencion.split('|');
            setHorarios([{ dias: parts[0] || 'Lun - Dom', apertura: parts[1] || '12:00', cierre: parts[2] || '23:00' }]);
          }
        }
      }
      if (imgData.status === 'fulfilled' && imgData.value) setImagenes(imgData.value);
      if (galData.status === 'fulfilled' && galData.value) setGaleria(galData.value);
    } catch (error) { sileo.error({ title: 'Error al cargar los datos del CMS' }); } 
    finally { setLoading(false); }
  };
  
  useEffect(() => { cargarDatos(); }, []);

  const handlePhoneChange = (key: 'telefonoPedidos' | 'whatsapp', val: string) => {
    const onlyNumbers = val.replace(/\D/g, '').slice(0, 9);
    setConfig({ ...config, [key]: onlyNumbers });
  };

  const handleGuardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (config.correoContacto && !emailRegex.test(config.correoContacto)) {
      return sileo.error({ title: 'Correo inválido', description: 'Por favor, ingresa un formato de correo válido.' });
    }
    if (config.telefonoPedidos && config.telefonoPedidos.length < 9) return sileo.error({ title: 'El teléfono debe tener 9 dígitos.' });
    if (config.whatsapp && config.whatsapp.length < 9) return sileo.error({ title: 'El WhatsApp debe tener 9 dígitos.' });

    setSavingConfig(true);
    try {
      await guardarConfiguracionWeb({
        ...config,
        escalaTituloHero: Number(config.escalaTituloHero),
        bentoCtaEscalaCaja1: Number(config.bentoCtaEscalaCaja1),
        bentoCtaEscalaCaja2: Number(config.bentoCtaEscalaCaja2),
        limiteImagenesCarrusel: config.limiteImagenesCarrusel === '' ? 7 : Number(config.limiteImagenesCarrusel),
        horarioAtencion: JSON.stringify(horarios)
      });
      
      setConfig(prev => ({ ...prev, izipayApiKey: '', izipayHmacKey: '' }));
      sileo.success({ title: 'Configuración web guardada con éxito' });
    } catch (error: any) { sileo.error({ title: error.response?.data?.message || 'Error al guardar' }); } 
    finally { setSavingConfig(false); }
  };

  const handleEliminarImagenSelta = async (url: string, updateState: () => void) => {
    if (!url) return;
    setDeletingElement(true); sileo.info({ title: 'Eliminando imagen de la nube...' });
    try { await eliminarImagenSeltaWeb(url); updateState(); sileo.success({ title: 'Imagen eliminada correctamente' }); } 
    catch (e) { sileo.error({ title: 'Error al eliminar la imagen' }); } finally { setDeletingElement(false); }
  };

  const handleFileCarrusel = async (file: File) => {
    if (!file) return; 
    const maxLimit = Number(config.limiteImagenesCarrusel) || 7;
    
    if (imagenes.length >= maxLimit) {
      return sileo.error({ title: `Límite alcanzado (${maxLimit} imágenes máximo)` });
    }
    setUploadingImg(true); sileo.info({ title: 'Subiendo imagen...' });
    try {
      const urlSegura = await subirImagenCloudinary(file);
      const nuevaImagen = await agregarImagenCarrusel({ imagenUrl: urlSegura, orden: imagenes.length + 1 });
      setImagenes(prev => [...prev, nuevaImagen]); sileo.success({ title: 'Imagen agregada al carrusel' });
    } catch (error: any) { sileo.error({ title: 'Error al procesar la imagen' }); } finally { setUploadingImg(false); }
  };

  const handleFileLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setUploadingLogo(true); sileo.info({ title: 'Subiendo logo...' });
    try { const urlSegura = await subirImagenCloudinary(file); setConfig({ ...config, logoUrl: urlSegura }); sileo.success({ title: 'Logo subido' }); } 
    catch (error) { sileo.error({ title: 'Error' }); } finally { setUploadingLogo(false); }
  };

  const handleFileBentoCaja1 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setUploadingBentoCaja1(true); sileo.info({ title: 'Subiendo imagen...' });
    try { const urlSegura = await subirImagenCloudinary(file); setConfig({ ...config, bentoCtaImagenCaja1: urlSegura }); sileo.success({ title: 'Imagen subida' }); } 
    catch (error) { sileo.error({ title: 'Error' }); } finally { setUploadingBentoCaja1(false); }
  };

  const handleFileBentoTop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setUploadingBentoTop(true); sileo.info({ title: 'Subiendo imagen...' });
    try { const urlSegura = await subirImagenCloudinary(file); setConfig({ ...config, bentoCtaImagenTop: urlSegura }); sileo.success({ title: 'Imagen subida' }); } 
    catch (error) { sileo.error({ title: 'Error' }); } finally { setUploadingBentoTop(false); }
  };

  const handleEliminarImagen = async (id: number) => {
    try { await eliminarImagenCarrusel(id); setImagenes(prev => prev.filter(img => img.id !== id)); sileo.success({ title: 'Imagen eliminada' }); } 
    catch (error) { sileo.error({ title: 'Error' }); }
  };

  const handleGaleriaUploadClick = (posicion: number) => { setTargetPosicion(posicion); if (galeriaInputRef.current) galeriaInputRef.current.value = ''; galeriaInputRef.current?.click(); };
  const handleFileGaleria = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || targetPosicion === null) return; 
    setUploadingGaleria(targetPosicion); sileo.info({ title: 'Subiendo a la galería...' });
    try {
      const urlSegura = await subirImagenCloudinary(file);
      const nuevaImagen = await guardarImagenGaleriaWeb({ imagenUrl: urlSegura, posicion: targetPosicion });
      setGaleria(prev => { const filtrado = prev.filter(g => g.posicion !== targetPosicion); return [...filtrado, nuevaImagen]; });
      sileo.success({ title: 'Imagen actualizada' });
    } catch (error) { sileo.error({ title: 'Error' }); } finally { setUploadingGaleria(null); setTargetPosicion(null); if (galeriaInputRef.current) galeriaInputRef.current.value = ''; }
  };
  const handleEliminarGaleria = async (id: number) => {
    try { await eliminarImagenGaleriaWeb(id); setGaleria(prev => prev.filter(g => g.id !== id)); sileo.success({ title: 'Eliminada' }); } 
    catch (error) { sileo.error({ title: 'Error' }); }
  };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileCarrusel(e.dataTransfer.files[0]); };

  const limiteMax = Number(config.limiteImagenesCarrusel) || 7;

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col h-full relative overflow-x-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0 pr-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Panel <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Público (CMS)</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Personaliza la marca, información e imágenes de tu restaurante o food truck.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-white rounded-2xl border border-gray-200 shadow-sm"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pr-4 pb-8">
            <form onSubmit={handleGuardarConfig} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit flex flex-col gap-0">
              
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
                <Palette className="text-orange-500" size={18} strokeWidth={2.5} />
                <div><h3 className="text-sm font-black text-gray-900 tracking-tight">Identidad de Marca y Colores</h3></div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative" ref={tipoLogoRef}>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Formato del Logo</label>
                    <div onClick={() => setIsTipoLogoOpen(!isTipoLogoOpen)} className={`w-full px-4 py-2.5 bg-white border rounded-xl transition-all font-bold text-sm text-gray-900 flex justify-between items-center cursor-pointer select-none border-gray-300`}>
                      <span>{opcionesLogo.find(o => o.value === config.tipoLogo)?.label || 'Solo Texto'}</span>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform ${isTipoLogoOpen ? 'rotate-180 text-orange-500' : ''}`} />
                    </div>
                    {isTipoLogoOpen && (
                      <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <ul className="max-h-48 overflow-y-auto p-1.5 custom-scrollbar">
                          {opcionesLogo.map(opc => (
                            <li key={opc.value} onClick={() => { setConfig({...config, tipoLogo: opc.value}); setIsTipoLogoOpen(false); }} className="px-4 py-2.5 rounded-lg text-sm font-bold text-gray-700 cursor-pointer transition-colors hover:bg-gray-50">{opc.label}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {config.tipoLogo === 'TEXTO' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Texto del Navbar</label>
                      <input type="text" value={config.textoNavbar} onChange={e => setConfig({...config, textoNavbar: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Imagen del Logo</label>
                      <div className="flex items-center gap-2">
                        {config.logoUrl && <img src={config.logoUrl} alt="Logo" className="h-10 w-10 object-contain bg-gray-100 rounded-lg border border-gray-200" />}
                        <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo || deletingElement} className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 hover:bg-gray-100">
                          {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} Subir
                        </button>
                        {config.logoUrl && (
                          <button type="button" onClick={() => handleEliminarImagenSelta(config.logoUrl, () => setConfig({...config, logoUrl: '', tipoLogo: 'TEXTO'}))} disabled={deletingElement} className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2.5 rounded-xl border border-rose-200 transition-colors">
                            {deletingElement ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        )}
                        <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleFileLogo} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Etiqueta Superior (Hero)</label>
                    <div className="flex gap-3 items-center">
                      <input type="text" value={config.etiquetaHero} onChange={e => setConfig({...config, etiquetaHero: e.target.value})} className="flex-1 w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" />
                      <input type="color" value={config.colorEtiquetaHero || '#f97316'} onChange={e => setConfig({...config, colorEtiquetaHero: e.target.value})} className="w-11 h-11 p-0 border-0 rounded-xl cursor-pointer shrink-0" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Título Línea 1</label>
                    <div className="flex gap-3 items-center">
                      <input type="text" value={config.tituloHero1} onChange={e => setConfig({...config, tituloHero1: e.target.value})} className="flex-1 w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" />
                      <input type="color" value={config.colorTitulo1 || '#ffffff'} onChange={e => setConfig({...config, colorTitulo1: e.target.value})} className="w-11 h-11 p-0 border-0 rounded-xl cursor-pointer shrink-0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Título Línea 2</label>
                    <div className="flex gap-3 items-center">
                      <input type="text" value={config.tituloHero2} onChange={e => setConfig({...config, tituloHero2: e.target.value})} className="flex-1 w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" />
                      <input type="color" value={config.colorTitulo2 || '#f5b51b'} onChange={e => setConfig({...config, colorTitulo2: e.target.value})} className="w-11 h-11 p-0 border-0 rounded-xl cursor-pointer shrink-0" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                    <span>Tamaño del Título (Escala)</span><span className="text-orange-500">{config.escalaTituloHero}x</span>
                  </label>
                  <input type="range" min="0.5" max="1.5" step="0.05" value={config.escalaTituloHero} onChange={e => setConfig({...config, escalaTituloHero: parseFloat(e.target.value)})} className="w-full accent-orange-500" />
                </div>
              </div>

              <div className="px-6 py-5 border-y border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
                <MousePointerClick className="text-orange-500" size={18} strokeWidth={2.5} />
                <div><h3 className="text-sm font-black text-gray-900 tracking-tight">Llamado a la Acción (Bento Inferior)</h3></div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative" ref={tipoCaja1Ref}>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Caja Izquierda (LA)</label>
                    <div onClick={() => setIsTipoCaja1Open(!isTipoCaja1Open)} className={`w-full px-4 py-2.5 bg-white border rounded-xl transition-all font-bold text-sm text-gray-900 flex justify-between items-center cursor-pointer select-none border-gray-300`}>
                      <span>{opcionesLogo.find(o => o.value === config.bentoCtaTipoCaja1)?.label || 'Solo Texto'}</span>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform ${isTipoCaja1Open ? 'rotate-180 text-orange-500' : ''}`} />
                    </div>
                    {isTipoCaja1Open && (
                      <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <ul className="max-h-48 overflow-y-auto p-1.5 custom-scrollbar">
                          {opcionesLogo.map(opc => (
                            <li key={opc.value} onClick={() => { setConfig({...config, bentoCtaTipoCaja1: opc.value}); setIsTipoCaja1Open(false); }} className="px-4 py-2.5 rounded-lg text-sm font-bold text-gray-700 cursor-pointer transition-colors hover:bg-gray-50">{opc.label}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {config.bentoCtaTipoCaja1 === 'TEXTO' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Texto Caja Izquierda</label>
                      <input type="text" value={config.bentoCtaTextoCaja1} onChange={e => setConfig({...config, bentoCtaTextoCaja1: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Imagen Caja Izquierda</label>
                      <div className="flex items-center gap-2">
                        {config.bentoCtaImagenCaja1 && <img src={config.bentoCtaImagenCaja1} alt="Logo" className="h-10 w-10 object-contain bg-gray-100 rounded-lg border border-gray-200 shrink-0" />}
                        <button type="button" onClick={() => bentoCaja1InputRef.current?.click()} disabled={uploadingBentoCaja1 || deletingElement} className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 hover:bg-gray-100">
                          {uploadingBentoCaja1 ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} Subir
                        </button>
                        {config.bentoCtaImagenCaja1 && (
                          <button type="button" onClick={() => handleEliminarImagenSelta(config.bentoCtaImagenCaja1, () => setConfig({...config, bentoCtaImagenCaja1: '', bentoCtaTipoCaja1: 'TEXTO'}))} disabled={deletingElement} className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2.5 rounded-xl border border-rose-200 transition-colors shrink-0">
                            {deletingElement ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        )}
                        <input type="file" accept="image/*" className="hidden" ref={bentoCaja1InputRef} onChange={handleFileBentoCaja1} />
                      </div>
                    </div>
                  )}
                </div>
                
                {config.bentoCtaTipoCaja1 === 'TEXTO' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                      <span>Tamaño Texto Izquierda (Escala)</span><span className="text-orange-500">{config.bentoCtaEscalaCaja1}x</span>
                    </label>
                    <input type="range" min="0.5" max="1.5" step="0.05" value={config.bentoCtaEscalaCaja1} onChange={e => setConfig({...config, bentoCtaEscalaCaja1: parseFloat(e.target.value)})} className="w-full accent-orange-500" />
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Texto Caja Derecha Inferior</label>
                  <input type="text" value={config.bentoCtaTextoCaja2} onChange={e => setConfig({...config, bentoCtaTextoCaja2: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                    <span>Tamaño Texto Derecha (Escala)</span><span className="text-orange-500">{config.bentoCtaEscalaCaja2}x</span>
                  </label>
                  <input type="range" min="0.5" max="1.5" step="0.05" value={config.bentoCtaEscalaCaja2} onChange={e => setConfig({...config, bentoCtaEscalaCaja2: parseFloat(e.target.value)})} className="w-full accent-orange-500" />
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Caja Derecha Superior (Promoción)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Imagen de Fondo</label>
                      <div className="flex items-center gap-2">
                        {config.bentoCtaImagenTop && <img src={config.bentoCtaImagenTop} alt="Promo" className="h-10 w-10 object-cover bg-gray-100 rounded-lg border border-gray-200 shrink-0" />}
                        <button type="button" onClick={() => bentoTopInputRef.current?.click()} disabled={uploadingBentoTop || deletingElement} className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 hover:bg-gray-100">
                          {uploadingBentoTop ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} Subir
                        </button>
                        {config.bentoCtaImagenTop && (
                          <button type="button" onClick={() => handleEliminarImagenSelta(config.bentoCtaImagenTop, () => setConfig({...config, bentoCtaImagenTop: ''}))} disabled={deletingElement} className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2.5 rounded-xl border border-rose-200 transition-colors shrink-0">
                            {deletingElement ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        )}
                        <input type="file" accept="image/*" className="hidden" ref={bentoTopInputRef} onChange={handleFileBentoTop} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Etiqueta Pequeña</label>
                      <input type="text" value={config.bentoCtaEtiquetaTop} onChange={e => setConfig({...config, bentoCtaEtiquetaTop: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Título Promocional</label>
                    <input type="text" value={config.bentoCtaTituloTop} onChange={e => setConfig({...config, bentoCtaTituloTop: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 border-y border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
                <LayoutTemplate className="text-orange-500" size={18} strokeWidth={2.5} />
                <div><h3 className="text-sm font-black text-gray-900 tracking-tight">Contacto y Horarios Múltiples</h3></div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Phone size={13} /> Teléfono Local (9 dígitos)</label>
                    <input type="text" value={config.telefonoPedidos} onChange={e => handlePhoneChange('telefonoPedidos', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ej. 987654321" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Phone size={13} className="text-emerald-500" /> WhatsApp (9 dígitos)</label>
                    <input type="text" value={config.whatsapp} onChange={e => handlePhoneChange('whatsapp', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ej. 987654321" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Mail size={13} /> Correo Electrónico</label>
                  <input type="email" value={config.correoContacto} onChange={e => setConfig({...config, correoContacto: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" placeholder="contacto@rutadelsabor.com" />
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Clock size={13} /> Días de Apertura</label>
                    <button type="button" onClick={() => setHorarios([...horarios, { dias: 'Nuevo', apertura: '12:00', cierre: '23:00' }])} className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-orange-100 transition-colors w-full sm:w-auto justify-center">
                      <Plus size={14}/> Agregar Horario
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {horarios.map((h, idx) => (
                      <div key={idx} className="flex flex-wrap lg:flex-nowrap items-end gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <div className="flex-1 min-w-[120px] w-full">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Días (Texto)</label>
                          <input type="text" value={h.dias} onChange={e => { const newH = [...horarios]; newH[idx].dias = e.target.value; setHorarios(newH); }} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Lun - Sab" />
                        </div>
                        <div className="flex gap-3 w-full lg:w-auto">
                          <div className="flex-1 lg:w-[110px]">
                            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Apertura</label>
                            <TimeSelect value={h.apertura} onChange={(val) => { const newH = [...horarios]; newH[idx].apertura = val; setHorarios(newH); }} />
                          </div>
                          <div className="flex-1 lg:w-[110px]">
                            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Cierre</label>
                            <TimeSelect value={h.cierre} onChange={(val) => { const newH = [...horarios]; newH[idx].cierre = val; setHorarios(newH); }} />
                          </div>
                        </div>
                        {horarios.length > 1 && (
                          <button type="button" onClick={() => setHorarios(horarios.filter((_, i) => i !== idx))} className="w-full lg:w-10 h-10 flex items-center justify-center shrink-0 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors mt-2 lg:mt-0">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><LinkIcon size={13} className="text-blue-500" /> Link Facebook</label>
                    <input type="url" value={config.facebookUrl} onChange={e => setConfig({...config, facebookUrl: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><LinkIcon size={13} className="text-pink-500" /> Link Instagram</label>
                    <input type="url" value={config.instagramUrl} onChange={e => setConfig({...config, instagramUrl: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 border-y border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
                <CreditCard className="text-orange-500" size={18} strokeWidth={2.5} />
                <div><h3 className="text-sm font-black text-gray-900 tracking-tight">Pasarela de Pagos (Izipay)</h3></div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Shop ID (Usuario)</label>
                    <input 
                      type="text" 
                      value={config.izipayShopId || ''} 
                      onChange={e => setConfig({...config, izipayShopId: e.target.value})}
                      placeholder="Ej. 69876357"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">API Key (Test Password)</label>
                    <input 
                      type="password" 
                      value={config.izipayApiKey || ''} 
                      onChange={e => setConfig({...config, izipayApiKey: e.target.value})}
                      placeholder="testpassword_..."
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Public Key</label>
                    <input 
                      type="text" 
                      value={config.izipayPublicKey || ''} 
                      onChange={e => setConfig({...config, izipayPublicKey: e.target.value})}
                      placeholder="...testpublickey_..."
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">HMAC Key</label>
                    <input 
                      type="password" 
                      value={config.izipayHmacKey || ''} 
                      onChange={e => setConfig({...config, izipayHmacKey: e.target.value})}
                      placeholder="Clave SHA-256..."
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
                  <p className="text-[11px] font-medium text-gray-400 leading-relaxed max-w-2xl">
                    * Por seguridad, las contraseñas están ocultas al recargar el panel. Si ya configuraste las llaves antes y solo deseas actualizar otros datos de la web, déjalas en blanco.
                  </p>
                  
                  <button 
                    type="button" 
                    onClick={() => {
                        setConfig({...config, izipayShopId: 'ELIMINAR_CREDENCIALES'});
                        sileo.info({title: 'Listo. Haz clic en "Guardar Información" para aplicar.'});
                    }}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg transition-colors shrink-0"
                  >
                    Desvincular cuenta
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                <button type="submit" disabled={savingConfig} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-5 py-2.5 w-full sm:w-auto rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                  {savingConfig ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar Información
                </button>
              </div>
            </form>

            <div className="flex flex-col gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit flex flex-col">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
                  <Monitor className="text-orange-500" size={18} strokeWidth={2.5} />
                  <div><h3 className="text-sm font-black text-gray-900 tracking-tight">Vista Previa Hero</h3></div>
                </div>
                <div className="p-6 bg-gray-100 flex items-center justify-center">
                  <div className="relative w-full max-w-2xl aspect-video bg-[#0a0a0a] rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6 text-center">
                    <div className="absolute top-0 w-full p-4 flex justify-between items-center border-b border-white/10">
                      {config.tipoLogo === 'IMAGEN' && config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="h-4 object-contain" />
                      ) : (
                        <span className="text-[10px] font-black tracking-widest text-white uppercase">{config.textoNavbar || 'LA BUMANGUESA'}</span>
                      )}
                      <div className="flex gap-2">
                        <div className="w-10 h-2 bg-white/20 rounded-full"></div>
                        <div className="w-4 h-2 bg-white/20 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="z-10 flex flex-col items-center mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-[1px]" style={{ backgroundImage: `linear-gradient(to right, transparent, ${config.colorEtiquetaHero || '#f97316'})` }} />
                        <span style={{ color: config.colorEtiquetaHero || '#f97316' }} className="text-[8px] font-black tracking-[0.4em] uppercase">
                          {config.etiquetaHero || 'Fuego & Sabor'}
                        </span>
                        <div className="w-6 h-[1px]" style={{ backgroundImage: `linear-gradient(to left, transparent, ${config.colorEtiquetaHero || '#f97316'})` }} />
                      </div>
                      
                      <h1 style={{ fontSize: `calc(3vw * ${config.escalaTituloHero || 1})`, color: config.colorTitulo1 || '#ffffff' }} className="leading-none font-black font-display tracking-tighter uppercase">{config.tituloHero1 || 'SABOR REAL'}</h1>
                      <h2 style={{ fontSize: `calc(1.5vw * ${config.escalaTituloHero || 1})`, color: config.colorTitulo2 || '#f5b51b' }} className="leading-none font-black font-display tracking-tight uppercase mt-1 mb-4">{config.tituloHero2 || 'BUMANGUESA'}</h2>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit flex flex-col">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
                  <Monitor className="text-orange-500" size={18} strokeWidth={2.5} />
                  <div><h3 className="text-sm font-black text-gray-900 tracking-tight">Vista Previa CTA</h3></div>
                </div>
                <div className="p-6 bg-gray-100 flex items-center justify-center">
                  <div className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-xl overflow-hidden shadow-2xl p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                      <div className="lg:col-span-5 bg-[#111] rounded-2xl p-4 flex items-center justify-center min-h-[120px] border border-white/5 overflow-hidden">
                        {config.bentoCtaTipoCaja1 === 'IMAGEN' && config.bentoCtaImagenCaja1 ? (
                          <img src={config.bentoCtaImagenCaja1} alt="Logo" className="max-h-16 object-contain" />
                        ) : (
                          <h2 style={{ fontSize: `calc(4vw * ${config.bentoCtaEscalaCaja1 || 1})` }} className="font-black text-white uppercase tracking-tighter text-center leading-none break-words">
                            {config.bentoCtaTextoCaja1 || 'LA'}
                          </h2>
                        )}
                      </div>
                      
                      <div className="lg:col-span-7 bg-[#111] rounded-2xl overflow-hidden relative min-h-[120px] border border-white/5">
                        <img src={config.bentoCtaImagenTop || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800'} alt="Promo" className="absolute inset-0 w-full h-full object-cover opacity-70" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4 z-10">
                          <span className="text-orange-500 text-[8px] font-black tracking-widest uppercase mb-0.5 block">{config.bentoCtaEtiquetaTop || '100% ARTESANAL'}</span>
                          <h3 className="text-white text-sm font-bold leading-tight">{config.bentoCtaTituloTop || 'El verdadero sabor al carbón.'}</h3>
                        </div>
                      </div>
                      
                      <div className="lg:col-span-5 bg-orange-500 rounded-2xl p-4 flex flex-col justify-between min-h-[120px]">
                        <span className="text-[#0a0a0a] text-[8px] font-black tracking-widest uppercase">Ir a la carta</span>
                        <div className="flex items-end justify-between mt-4">
                          <h2 className="text-2xl font-black text-[#0a0a0a] leading-none uppercase tracking-tighter">Pide<br/>Ahora</h2>
                          <div className="w-6 h-6 rounded-full bg-[#0a0a0a]/10 flex items-center justify-center text-[#0a0a0a]"><ArrowUpRight size={14} strokeWidth={2.5} /></div>
                        </div>
                      </div>
                      
                      <div className="lg:col-span-7 bg-[#111] rounded-2xl p-4 flex items-center justify-center min-h-[120px] border border-white/5 overflow-hidden">
                        <h2 style={{ fontSize: `calc(2.5vw * ${config.bentoCtaEscalaCaja2 || 1})` }} className="font-black text-white uppercase text-center tracking-tighter leading-none break-words">
                          {config.bentoCtaTextoCaja2 || 'TIENDA ROJAS'}
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit flex flex-col">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="text-orange-500" size={18} strokeWidth={2.5} />
                    <div><h3 className="text-sm font-black text-gray-900 tracking-tight">Carrusel Principal</h3></div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Límite:</label>
                    <input 
                      type="text"
                      value={config.limiteImagenesCarrusel === '' ? '' : config.limiteImagenesCarrusel} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setConfig({...config, limiteImagenesCarrusel: val === '' ? '' : parseInt(val)});
                      }} 
                      className="w-12 text-center text-xs font-black text-gray-900 outline-none bg-gray-50 rounded"
                    />
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  
                  {imagenes.length >= limiteMax ? (
                    <div className="w-full h-40 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50 flex flex-col items-center justify-center text-rose-500 p-4 text-center">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                      <p className="font-black text-sm">Límite Alcanzado ({limiteMax})</p>
                      <p className="text-[10px] font-bold mt-1 text-rose-400">Elimina una imagen para subir otra.</p>
                    </div>
                  ) : (
                    <div onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop} onClick={() => inputRef.current?.click()} className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all p-4 text-center ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                      <input type="file" accept="image/*" className="hidden" ref={inputRef} onChange={(e) => e.target.files && handleFileCarrusel(e.target.files[0])} />
                      {uploadingImg ? (
                        <div className="flex flex-col items-center text-orange-500"><Loader2 className="w-8 h-8 animate-spin mb-2" /><p className="font-bold text-sm">Subiendo...</p></div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <UploadCloud className={`w-10 h-10 mb-2 ${dragActive ? 'text-orange-500' : 'text-gray-400'}`} />
                          <p className="font-bold text-sm text-gray-600">Haz clic o arrastra una imagen aquí</p>
                          <p className="text-[10px] uppercase font-bold mt-1 tracking-widest">{imagenes.length} de {limiteMax} subidas</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagenes.map((img) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video shadow-sm">
                        <img src={img.imagenUrl} alt="Carrusel" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => handleEliminarImagen(img.id)} className="bg-rose-500 hover:bg-rose-600 text-white p-2.5 rounded-full active:scale-95 transition-transform"><Trash2 size={16} strokeWidth={2.5} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit flex flex-col mt-8 xl:col-span-2">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid className="text-orange-500" size={18} strokeWidth={2.5} />
                    <div><h3 className="text-sm font-black text-gray-900 tracking-tight">Galería Food Truck</h3></div>
                  </div>
                </div>
                <div className="p-6 bg-gray-100">
                  <input type="file" accept="image/*" className="hidden" ref={galeriaInputRef} onChange={handleFileGaleria} />
                  <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[120px] lg:auto-rows-[180px] gap-4 max-w-4xl mx-auto">
                    {ESTRUCTURA_GALERIA.map((slot) => {
                      const imgActual = galeria.find(g => g.posicion === slot.pos);
                      return (
                        <div key={slot.pos} className={`relative rounded-2xl overflow-hidden shadow-sm border-2 border-dashed ${imgActual ? 'border-transparent' : 'border-gray-300 bg-white hover:border-orange-500'} transition-all group ${slot.class}`}>
                          {imgActual ? (
                            <>
                              <img src={imgActual.imagenUrl} alt={`Pos ${slot.pos}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button type="button" onClick={() => handleGaleriaUploadClick(slot.pos)} className="bg-white text-gray-900 p-2.5 rounded-full hover:bg-orange-50 hover:text-orange-500 transition-colors"><UploadCloud size={16} /></button>
                                <button type="button" onClick={() => handleEliminarGaleria(imgActual.id)} className="bg-rose-500 hover:bg-rose-600 text-white p-2.5 rounded-full transition-colors"><Trash2 size={16} /></button>
                              </div>
                            </>
                          ) : (
                            <button type="button" onClick={() => handleGaleriaUploadClick(slot.pos)} className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-orange-500 outline-none">
                              {uploadingGaleria === slot.pos ? (
                                <Loader2 size={24} className="animate-spin text-orange-500" />
                              ) : (
                                <>
                                  <UploadCloud size={24} className="mb-2" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">{slot.titulo}</span>
                                  <span className="text-[9px] font-bold text-gray-400 mt-1">Posición {slot.pos}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDisconnectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm"
              onClick={() => setShowDisconnectModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">
                ¿Desvincular Izipay?
              </h3>
              <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">
                Si eliminas tus credenciales, tu tienda <strong className="text-gray-900">ya no podrá recibir pagos en línea</strong> de tus clientes. Volverás al modo de pruebas.
              </p>
              <div className="flex w-full gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowDisconnectModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setConfig({...config, izipayShopId: 'ELIMINAR_CREDENCIALES'});
                    setShowDisconnectModal(false);
                    sileo.info({title: 'Listo. Haz clic en "Guardar Información" para aplicar.'});
                  }}
                  className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-rose-200"
                >
                  Sí, desvincular
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}