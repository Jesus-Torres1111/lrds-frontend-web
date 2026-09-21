import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  TrendingDown, PieChart, Activity, Lock, ArrowLeft, 
  RefreshCw, Sparkles, DollarSign, TrendingUp, AlertTriangle,
  ChevronLeft, ChevronRight, ChevronDown, Check, Calendar as CalendarIcon
} from 'lucide-react';
import { getMargenVentas } from '@/api/reportes';
import type { MargenVentasDTO } from '@/api/reportes';
import { useAuthStore } from '@/store/authStore';
import AdminLayout from '@/components/layouts/AdminLayout';
import { fechaPeruISO } from '@/lib/datetimePeru';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function hoy() { return fechaPeruISO(); }
function hace1Dia() { const d = new Date(); d.setDate(d.getDate() - 1); return fechaPeruISO(d); }
function hace7Dias() { const d = new Date(); d.setDate(d.getDate() - 7); return fechaPeruISO(d); }
function hace30Dias() { const d = new Date(); d.setDate(d.getDate() - 30); return fechaPeruISO(d); }
function inicioDeMes() { const d = new Date(); d.setDate(1); return fechaPeruISO(d); }

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function generarDiasMes(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  let offset = primerDia.getDay() - 1;
  if (offset < 0) offset = 6;

  const dias: { fecha: Date; delMes: boolean }[] = [];
  for (let i = 0; i < offset; i++) {
    dias.push({ fecha: new Date(year, month, i - offset + 1), delMes: false });
  }
  for (let i = 1; i <= diasEnMes; i++) {
    dias.push({ fecha: new Date(year, month, i), delMes: true });
  }
  while (dias.length < 42) {
    const last = dias[dias.length - 1].fecha;
    dias.push({ fecha: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), delMes: false });
  }
  return dias;
}

function SelectorRangoFechas({ inicio, fin, onChange }: { inicio: string; fin: string; onChange: (inicio: string, fin: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseISODate(inicio));
  const [tempInicio, setTempInicio] = useState<string | null>(inicio);
  const [tempFin, setTempFin] = useState<string | null>(fin);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (abierto) {
      setTempInicio(inicio);
      setTempFin(fin);
      setViewDate(parseISODate(inicio));
    }
  }, [abierto, inicio, fin]);

  const dias = generarDiasMes(viewDate);
  const hoyISO = toISODate(new Date());

  const manejarClickDia = (iso: string) => {
    if (!tempInicio || (tempInicio && tempFin)) {
      setTempInicio(iso);
      setTempFin(null);
      return;
    }
    if (iso < tempInicio) {
      setTempFin(tempInicio);
      setTempInicio(iso);
    } else {
      setTempFin(iso);
    }
  };

  const aplicar = () => {
    if (tempInicio) {
      onChange(tempInicio, tempFin || tempInicio);
      setAbierto(false);
    }
  };

  const aplicarPreset = (pInicio: string, pFin: string) => {
    onChange(pInicio, pFin);
    setAbierto(false);
  };

  const mismoDia = inicio === fin;
  const inicioObj = parseISODate(inicio);
  const finObj = parseISODate(fin);
  const label = mismoDia
    ? inicioObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    : `${inicioObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} – ${finObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const presets = [
    { label: 'Hoy', inicio: hoy(), fin: hoy() },
    { label: 'Ayer', inicio: hace1Dia(), fin: hace1Dia() },
    { label: 'Últimos 7 días', inicio: hace7Dias(), fin: hoy() },
    { label: 'Últimos 30 días', inicio: hace30Dias(), fin: hoy() },
    { label: 'Este mes', inicio: inicioDeMes(), fin: hoy() },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto(o => !o)}
        className={`px-4 h-[42px] bg-white border rounded-xl text-sm font-bold text-gray-900 flex items-center gap-2.5 transition-all shadow-sm ${abierto ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <CalendarIcon size={16} className="text-orange-500" strokeWidth={2.5} />
        <span className="capitalize">{label}</span>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${abierto ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 origin-top-right z-[100] mt-3 w-[21rem] bg-white rounded-3xl border border-gray-200 shadow-2xl p-5"
          >
            <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b border-gray-100">
              {presets.map(p => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => aplicarPreset(p.inicio, p.fin)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-gray-600 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-gray-100"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 text-gray-500 hover:text-orange-600 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-black text-gray-900">{MESES[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
              <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 text-gray-500 hover:text-orange-600 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 mb-1">
              {DIAS_SEMANA.map(d => (
                <span key={d} className="text-[10px] font-black text-gray-400 text-center uppercase">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {dias.map(({ fecha, delMes }, i) => {
                const iso = toISODate(fecha);
                const esHoyDia = iso === hoyISO;
                const esInicio = iso === tempInicio;
                const esFin = iso === tempFin;
                const enRango = !!(tempInicio && tempFin && iso > tempInicio && iso < tempFin);
                return (
                  <div key={i} className="relative h-8 flex items-center justify-center">
                    {(enRango || esInicio || esFin) && tempFin && (
                      <div className={`absolute inset-y-0.5 bg-orange-50 ${esInicio ? 'left-1/2 right-0' : esFin ? 'left-0 right-1/2' : 'left-0 right-0'}`}></div>
                    )}
                    <button
                      type="button"
                      onClick={() => manejarClickDia(iso)}
                      className={`relative z-10 h-7 w-7 flex items-center justify-center rounded-full text-xs font-bold transition-all
                        ${!delMes ? 'text-gray-300' : 'text-gray-700'}
                        ${esInicio || esFin ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' : ''}
                        ${esHoyDia && !esInicio && !esFin ? 'ring-2 ring-orange-300' : ''}
                        ${!esInicio && !esFin && !enRango ? 'hover:bg-orange-50' : ''}
                        ${enRango ? 'hover:bg-orange-100' : ''}`}
                    >
                      {fecha.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400">
                {tempInicio && !tempFin ? 'Selecciona la fecha final' : 'Elige un rango o atajo'}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAbierto(false)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="button" onClick={aplicar} className="px-4 py-1.5 rounded-lg text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 flex items-center gap-1.5 shadow-sm transition-all">
                  <Check size={13} /> Aplicar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MetricCard = ({ icon, title, value, subtitle, colorClass, bgClass, borderClass }: any) => (
  <div className={`bg-white p-5 rounded-2xl border ${borderClass} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3 relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 w-20 h-20 ${bgClass} rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity`}></div>
    <div className="flex justify-between items-start relative z-10">
      <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass} group-hover:scale-110 transition-transform duration-300 border border-white/50`}>
        {icon}
      </div>
      {subtitle && <span className="text-[9px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded uppercase tracking-widest">{subtitle}</span>}
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
    </div>
  </div>
);

export default function AdminFinanzasPage() {
  const navigate = useNavigate();
  const [inicio, setInicio] = useState(hace30Dias());
  const [fin, setFin] = useState(hoy());
  const [datos, setDatos] = useState<MargenVentasDTO | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(true);
  const [error, setError] = useState('');

  const { sedeSeleccionadaId } = useAuthStore();

  const cargarDatos = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getMargenVentas(inicio, fin, sedeSeleccionadaId || undefined);
      setDatos(data); 
      setIsPremium(true);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.data?.codigo === 'MODULO_NO_HABILITADO') {
        setIsPremium(false);
      } else {
        setError('Ocurrió un error al calcular los márgenes financieros.');
      }
    } finally { setLoading(false); }
  }, [inicio, fin, sedeSeleccionadaId]); 

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-120px)] w-full">
        
        {!isPremium ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-red-500"></div>
            <div className="w-20 h-20 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mb-4">
              <Lock size={32} className="text-orange-500" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-orange-200">
              <Sparkles size={12} /> Módulo Bloqueado
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Plan Premium Requerido</h2>
            <p className="text-gray-500 font-medium text-sm max-w-md mb-6">El análisis de <strong>Rentabilidad</strong> utiliza el Kardex Ponderado para calcular tu utilidad real.</p>
            <button onClick={() => navigate('/dashboard')} className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm">
              <ArrowLeft size={16} /> Volver al Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0 pr-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  Rentabilidad <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Financiera</span>
                </h1>
                <p className="text-gray-500 font-medium text-sm">Análisis de costos y utilidad por sede.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto ml-auto">
                <div className="flex gap-2 w-full sm:w-auto">
                  <SelectorRangoFechas inicio={inicio} fin={fin} onChange={(i, f) => { setInicio(i); setFin(f); }} />
                  <button onClick={cargarDatos} disabled={loading} title="Actualizar" className="w-[42px] h-[42px] bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95 shadow-sm flex items-center justify-center shrink-0">
                    <RefreshCw size={18} className={loading ? 'animate-spin text-gray-900' : ''} />
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-2 mb-4 shrink-0 pr-4"><AlertTriangle size={14}/> {error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 mb-4 pr-4">
              <MetricCard 
                icon={<DollarSign size={20} strokeWidth={2.5} />} 
                title="Ingresos Totales" 
                value={`S/ ${datos?.ingresosTotales.toFixed(2) || '0.00'}`} 
                bgClass="bg-emerald-50" colorClass="text-emerald-600" borderClass="border-emerald-200"
              />
              <MetricCard 
                icon={<Activity size={20} strokeWidth={2.5} />} 
                title="Costo Ventas (Kardex)" 
                value={`S/ ${datos?.costoVentas.toFixed(2) || '0.00'}`} 
                subtitle="Inversión"
                bgClass="bg-rose-50" colorClass="text-rose-600" borderClass="border-rose-200"
              />
              <MetricCard 
                icon={<TrendingUp size={20} strokeWidth={2.5} />} 
                title="Utilidad Bruta" 
                value={`S/ ${datos?.utilidadBruta.toFixed(2) || '0.00'}`} 
                bgClass="bg-blue-50" colorClass="text-blue-600" borderClass="border-blue-200"
              />
              <div className="bg-gradient-to-br from-gray-900 to-slate-800 p-5 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/20 rounded-full blur-[20px] group-hover:bg-orange-500/30 transition-colors"></div>
                <div className="relative z-10 flex justify-between items-start mb-2">
                  <div className="bg-white/10 p-2.5 rounded-xl text-orange-400 border border-white/10 group-hover:scale-110 transition-transform">
                    <PieChart size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-[9px] font-bold text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase tracking-widest">Global</span>
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Margen</p>
                  <h3 className="text-3xl font-black text-white tracking-tight">{datos?.margenBrutoPct.toFixed(1) || '0.0'}%</h3>
                </div>
              </div>
            </div>

            {datos && datos.costoMerma > 0 && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-3 shrink-0 mb-4 pr-4">
                <div className="bg-white p-1.5 rounded-lg text-rose-600 border border-rose-100"><TrendingDown size={16} /></div>
                <div>
                  <p className="text-xs font-black text-rose-900">Alerta de Mermas Registradas</p>
                  <p className="text-[11px] font-medium text-rose-700">Pérdidas reportadas por <strong>S/ {datos.costoMerma.toFixed(2)}</strong>.</p>
                </div>
              </div>
            )}

            <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative flex flex-col mr-4">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 flex items-center gap-2 shrink-0">
                <div className="bg-white p-1.5 rounded-lg text-blue-600 border border-gray-200"><PieChart size={14}/></div>
                <h3 className="text-sm font-black text-gray-900">Rendimiento por Producto</h3>
              </div>
              <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px]">
                  <thead className="text-[10px] text-gray-500 uppercase tracking-widest font-black bg-gray-50 sticky top-0 border-b border-gray-200 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3">Plato / Producto</th>
                      <th className="px-6 py-3 text-right">Ingresos</th>
                      <th className="px-6 py-3 text-right">Costo Inv.</th>
                      <th className="px-6 py-3 text-right">Utilidad</th>
                      <th className="px-6 py-3 text-center">Margen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <AnimatePresence>
                      {datos?.desglosePorProducto.map((prod) => (
                        <motion.tr variants={itemVariants} initial="hidden" animate="show" exit="hidden" key={prod.productoId} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-3">
                            <span className="font-bold text-gray-900 text-[13px]">{prod.producto}</span>
                            {prod.esEstimado && <span className="ml-2 inline-block text-[8px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase">Estimado</span>}
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-emerald-600 text-xs">S/ {prod.ingresos.toFixed(2)}</td>
                          <td className="px-6 py-3 text-right font-bold text-rose-500 text-xs">S/ {prod.costoVentas.toFixed(2)}</td>
                          <td className="px-6 py-3 text-right font-black text-gray-900 text-[13px]">S/ {prod.utilidadBruta.toFixed(2)}</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-md font-black text-[10px] tracking-wider border ${
                              prod.margenPct >= 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              prod.margenPct >= 20 ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                              'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {prod.margenPct.toFixed(1)}%
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {datos?.desglosePorProducto.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm font-bold">No hay ventas registradas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}