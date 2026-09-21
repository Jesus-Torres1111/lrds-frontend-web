import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Building2, FileText, CheckCircle, MapPin,
  Loader2, Save, CreditCard, AlertTriangle, Clock, ArrowUpRight
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import { getMiEmpresa, actualizarEmpresa } from '@/api/empresa';
import type { Empresa } from '@/api/empresa';
import { sileo } from 'sileo';

const columnaVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } }
};

const bloqueVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 32 } }
};

function obtenerIniciales(nombre: string) {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return 'RS';
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

function calcularDiasRestantes(fechaFin?: string) {
  if (!fechaFin) return null;
  const fin = new Date(fechaFin);
  const hoy = new Date();
  fin.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);
  return Math.round((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

const NOMBRES_MODULOS: Record<string, string> = {
  POS_KDS: 'Ventas y Cocina',
  KARDEX: 'Control de Inventario',
  FINANZAS: 'Reportes Financieros',
  FACTURACION: 'Facturación Electrónica',
  MULTI_SEDE: 'Multi-sede'
};

export default function ConfiguracionPage() {
  const { user } = useAuthStore();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombreComercial: '',
    ruc: '',
    direccion: ''
  });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getMiEmpresa();
      if (data) {
        setEmpresa(data);
        setFormData({
          nombreComercial: data.nombreComercial || '',
          ruc: data.ruc || '',
          direccion: data.direccion || ''
        });
      }
    } catch (error) {
      sileo.error({ title: 'Error al cargar los datos de la plataforma' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorLimpio = e.target.value.replace(/\D/g, '');
    if (valorLimpio.length <= 11) {
      setFormData({ ...formData, ruc: valorLimpio });
    }
  };

  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombreComercial.trim() || !formData.ruc.trim() || !formData.direccion.trim()) {
      return sileo.error({ title: 'Todos los campos son obligatorios' });
    }
    if (formData.ruc.length !== 11) {
      return sileo.error({
        title: 'RUC Inválido',
        description: <span className="text-gray-200">El RUC debe tener exactamente 11 dígitos numéricos.</span>
      });
    }

    setSaving(true);
    try {
      if (empresa) {
        await actualizarEmpresa(empresa.id, formData);
        sileo.success({ title: 'Configuración actualizada exitosamente' });
        await cargarDatos();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Error al guardar los cambios';
      sileo.error({
        title: 'Error al guardar',
        description: <span className="text-gray-200">{errorMsg}</span>
      });
    } finally {
      setSaving(false);
    }
  };

  const suscripcion = empresa?.suscripcionVigente;
  const plan = suscripcion?.plan;
  const modulos = (plan as any)?.modulos || [];
  const diasRestantes = calcularDiasRestantes(suscripcion?.fechaFin);
  const esUrgente = diasRestantes !== null && diasRestantes <= 7;
  const tenantId = empresa?.id || user?.empresaId || 0;

  const modulosFallback = ['POS_KDS', 'KARDEX', 'FINANZAS', 'FACTURACION', 'MULTI_SEDE'];
  const listaModulos = modulos.length > 0
    ? modulos.map((m: any) => m.codigoModulo as string)
    : modulosFallback;

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto flex flex-col h-[calc(100vh-120px)]">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Ajustes de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Plataforma</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Administra la información de tu negocio y tu plan de facturación.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="font-bold text-gray-400">Cargando configuración...</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-8">

            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} className="w-full xl:w-[340px] shrink-0">
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-orange-500 via-orange-500 to-amber-600 p-6 text-white shadow-xl shadow-orange-500/25">
                <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full h-28 bg-black/10 pointer-events-none"></div>



                <div className="relative z-10 mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center text-xl font-black mb-3">
                    {obtenerIniciales(formData.nombreComercial)}
                  </div>
                  <p className="text-xl font-black tracking-tight leading-tight break-words">{formData.nombreComercial || 'Nombre de tu negocio'}</p>
                  <p className="text-[11px] text-white/60 font-bold mt-1">Ficha de socio de la cadena</p>
                </div>

                <div className="relative z-10 grid grid-cols-1 gap-3.5 text-[11px] mb-6">
                  <div>
                    <p className="text-white/60 font-bold uppercase tracking-widest mb-1">RUC</p>
                    <p className="font-mono font-bold text-sm">{formData.ruc || '— — — — — — — — — — —'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 font-bold uppercase tracking-widest mb-1">Sede Matriz</p>
                    <p className="font-bold text-sm truncate">{formData.direccion || 'Sin dirección registrada'}</p>
                  </div>
                </div>

                <div className="relative z-10 pt-5 border-t border-white/20 flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Plan Contratado</p>
                    <p className="font-black text-base">{plan?.nombre || 'Plan Estándar'}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    suscripcion?.estado === 'VENCIDA' ? 'bg-red-900/40 text-red-100' : 'bg-white/20'
                  }`}>
                    {suscripcion?.estado === 'ACTIVA' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                    {suscripcion?.estado || 'DESCONOCIDO'}
                  </span>
                </div>

                {diasRestantes !== null && (
                  <p className={`relative z-10 text-[11px] font-bold flex items-center gap-1.5 ${esUrgente ? 'text-red-100' : 'text-white/70'}`}>
                    <Clock size={12} />
                    {diasRestantes >= 0 ? `Se renueva en ${diasRestantes} días` : 'Licencia vencida'}
                  </p>
                )}

                <p className="relative z-10 text-[9px] text-white/45 font-mono mt-6 pt-4 border-t border-white/10">
                  TENANT #{tenantId} · {user?.correo || 'sin-correo'}
                </p>
              </div>
            </motion.div>

            <motion.div variants={columnaVariants} initial="hidden" animate="show" className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-8 space-y-6">

              <motion.form variants={bloqueVariants} onSubmit={handleGuardarCambios} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2.5">
                  <Building2 className="text-orange-500" size={18} strokeWidth={2.5} />
                  <div>
                    <h3 className="text-sm font-black text-gray-900 tracking-tight">Datos del Negocio</h3>
                    <p className="text-[11px] text-gray-400 font-medium">Aparecen en comprobantes de venta y reportes internos.</p>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre Comercial</label>
                    <input
                      type="text"
                      value={formData.nombreComercial}
                      onChange={e => setFormData({ ...formData, nombreComercial: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                      placeholder="Ej. La Ruta del Sabor"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FileText size={13} /> RUC</label>
                      <input
                        type="text"
                        value={formData.ruc}
                        onChange={handleRucChange}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm font-mono"
                        placeholder="11 dígitos numéricos"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin size={13} /> Dirección</label>
                      <input
                        type="text"
                        value={formData.direccion}
                        onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                        placeholder="Ej. Av. Principal 123"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-medium hidden sm:block">Los cambios aplican para toda la cadena.</p>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-5 py-2 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors shadow-sm disabled:opacity-70 text-sm"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </motion.form>

              <motion.div variants={bloqueVariants} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="text-orange-500" size={18} strokeWidth={2.5} />
                    <div>
                      <h3 className="text-sm font-black text-gray-900 tracking-tight">Plan y Facturación</h3>
                      <p className="text-[11px] text-gray-400 font-medium">Módulos habilitados según tu contrato actual.</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-gray-900">
                    S/ {plan?.precioMensual ? Number(plan.precioMensual).toFixed(2) : '0.00'}<span className="text-[11px] text-gray-400 font-bold">/mes</span>
                  </span>
                </div>

                <div className="p-6">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-3">Módulos Contratados</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    {listaModulos.map((codigo: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-orange-50/60 border border-orange-100 rounded-lg px-3 py-2.5">
                        <CheckCircle size={14} className="text-orange-500 shrink-0" />
                        {NOMBRES_MODULOS[codigo] || codigo.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">
                      Licencia vigente desde el <strong className="text-gray-800">{suscripcion?.fechaInicio || '-'}</strong> hasta el <strong className="text-gray-800">{suscripcion?.fechaFin || '-'}</strong>.
                    </p>
                    <button className="shrink-0 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5">
                      Contactar Soporte <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>

            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}