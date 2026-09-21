import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  TrendingUp, AlertTriangle, 
  RefreshCw, Download, Loader2,
  CheckCircle, ArrowUpRight, ArrowDownRight,
  Receipt, X, Lock, Activity, DollarSign, Wallet, UtensilsCrossed, ChefHat, LayoutGrid, ChevronRight, Eye,
  Calendar as CalendarIcon, ChevronLeft, ChevronDown, Check
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { getDashboard, getAlertasStock, getMargenVentas } from '@/api/reportes';
import { getHistorialPedidos } from '@/api/pedidos';
import type { DashboardVentas, InsumoAlerta, MargenVentasDTO } from '@/api/reportes';
import type { PedidoActivo } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { fechaPeruISO, formatearFechaHoraPeru } from '@/lib/datetimePeru';
import AdminLayout from '@/components/layouts/AdminLayout';
import { sileo } from 'sileo';

const COLORS_CONSUMO = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
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
        className={`px-4 py-2.5 bg-white border rounded-xl text-sm font-bold text-gray-900 flex items-center gap-2.5 transition-all shadow-sm ${abierto ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <CalendarIcon size={16} className="text-orange-500" />
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
            className="absolute right-0 origin-top-right z-50 mt-2 w-[21rem] bg-white rounded-2xl border border-gray-200 shadow-xl p-4"
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

function ModalDetalleHistorial({ pedido, onClose }: { pedido: PedidoActivo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div>
            <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-2">
              <Receipt className="text-blue-600" size={20} /> Orden #{pedido.id}
            </h2>
            <p className="text-gray-500 text-xs font-medium mt-1">{pedido.mesa || pedido.tipoConsumo}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-xl transition-all active:scale-95"><X size={20} /></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 mb-4">
            <div>
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Atendido por</p>
              <p className="font-bold text-blue-900 text-sm">{pedido.mozo}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Fecha de cobro</p>
              <p className="font-semibold text-blue-800 text-xs">{formatearFechaHoraPeru(pedido.fechaCreacion)}</p>
            </div>
          </div>

          <div className="space-y-2">
            {pedido.items.map((item) => (
              <div key={item.detalleId} className="flex justify-between items-center text-sm p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex-1 pr-3">
                  <span className="font-black text-gray-900 mr-2">{item.cantidad}x</span> 
                  <span className="font-semibold text-gray-600 text-xs">{item.nombreProducto}</span>
                  {item.estadoItem === 'CANCELADO' && <span className="ml-2 text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-100">CANCELADO</span>}
                </div>
                <span className="font-bold text-gray-900 text-xs">S/ {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
              <span>Subtotal</span><span>S/ {(pedido.total + pedido.descuento).toFixed(2)}</span>
            </div>
            {pedido.descuento > 0 && (
              <div className="flex justify-between text-xs font-bold text-emerald-600 mb-2 bg-emerald-50 p-2 rounded-lg">
                <span>Descuento</span><span>- S/ {pedido.descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Pagado</span>
              <span className="text-2xl font-black text-gray-900 tracking-tight">S/ {pedido.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const KpiCard = ({ title, value, prefix = '', suffix = '', trend, trendUp, icon: Icon, isPremium = true }: any) => (
  <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
    {!isPremium && (
      <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-gray-500">
        <Lock size={20} className="mb-1 text-gray-400" />
        <span className="text-[9px] font-black uppercase tracking-widest">Premium</span>
      </div>
    )}
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
          {prefix}{value}{suffix}
        </h3>
      </div>
      <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors shadow-sm">
        <Icon size={20} strokeWidth={2.5} />
      </div>
    </div>
    <div className="flex items-center gap-2 mt-auto">
      {trend ? (
        <>
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-black ${trendUp ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
            {trendUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
            {trend}%
          </span>
          <span className="text-[10px] font-medium text-gray-400">vs mes anterior</span>
        </>
      ) : (
        <span className="text-[10px] font-medium text-gray-400">Datos en tiempo real</span>
      )}
    </div>
  </motion.div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, sedeSeleccionadaId } = useAuthStore();
  const [inicio, setInicio] = useState(hace30Dias());
  const [fin, setFin] = useState(hoy());
  
  const [dashboard, setDashboard] = useState<DashboardVentas | any>(null);
  const [alertas, setAlertas] = useState<InsumoAlerta[]>([]);
  const [pedidosRecientes, setPedidosRecientes] = useState<PedidoActivo[]>([]);
  const [consumoChartData, setConsumoChartData] = useState<any[]>([]);
  const [margen, setMargen] = useState<MargenVentasDTO | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [hasPremium, setHasPremium] = useState(true);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoActivo | null>(null);
  const [menuRapidoOpen, setMenuRapidoOpen] = useState(false);

  const [isChartReady, setIsChartReady] = useState(false);

  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? 'Buenos días' : horaActual < 18 ? 'Buenas tardes' : 'Buenas noches';
  const primerNombre = user?.nombre?.split(' ')[0] || user?.correo?.split('@')[0] || 'Admin';

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [dashData, alertasData, historialData] = await Promise.all([
        getDashboard(inicio, fin, sedeSeleccionadaId || undefined).catch(() => null),
        getAlertasStock(sedeSeleccionadaId || undefined).catch(() => []),
        getHistorialPedidos(inicio, fin, sedeSeleccionadaId || undefined).catch(() => [])
      ]);
      
      setDashboard(dashData);
      setAlertas(alertasData);
      
      const pagados = historialData.filter((p:any) => p.estadoActual === 'PAGADO');
      setPedidosRecientes(pagados.slice(0, 6)); 

      const conteoConsumo = pagados.reduce((acc: any, p: any) => {
        const tipo = p.tipoConsumo || 'OTROS';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {});
      setConsumoChartData(Object.keys(conteoConsumo).map(key => ({
        name: key,
        value: conteoConsumo[key]
      })));

      try {
        const margenData = await getMargenVentas(inicio, fin, sedeSeleccionadaId || undefined);
        setMargen(margenData);
        setHasPremium(true);
      } catch (err: any) {
        if (err.response?.status === 403 || err.response?.data?.codigo === 'MODULO_NO_HABILITADO') {
          setHasPremium(false);
          setMargen(null);
        }
      }
    } catch (e) {
      sileo.error({ title: 'Error al sincronizar dashboard' });
    } finally {
      setLoading(false);
      setTimeout(() => setIsChartReady(true), 300);
    }
  }, [inicio, fin, sedeSeleccionadaId]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

const descargarExcel = () => {
    const token = useAuthStore.getState().token;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
    
    let url = `${baseUrl}/api/reportes/excel?inicio=${inicio}&fin=${fin}&token=${token}`;
    if (sedeSeleccionadaId) url += `&sedeId=${sedeSeleccionadaId}`;
    window.open(url, '_blank');
  };

  const ticketPromedio = dashboard && dashboard.pedidosTotalesMensuales > 0 
    ? (dashboard.ingresosTotalesMensuales / dashboard.pedidosTotalesMensuales).toFixed(2) 
    : '0.00';

  const CustomTooltipArea = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111827] border border-gray-700 p-3 rounded-xl shadow-xl">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
            {new Date(label + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-white font-black text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            S/ {Number(payload[0].value).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipBar = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-lg">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{payload[0].payload.categoria}</p>
          <p className="text-gray-900 font-black text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-800"></span>
            S/ {Number(payload[0].value).toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-lg">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{payload[0].name}</p>
          <p className="text-gray-900 font-black text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></span>
            {payload[0].value} {payload[0].name === 'Utilidad Neta' || payload[0].name === 'Costos (Kardex)' ? 'Soles' : 'unidades'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-120px)] relative overflow-x-hidden">
        
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[100]">
          <div className="relative flex items-center">
            <AnimatePresence>
              {menuRapidoOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-full mr-3 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl flex flex-col gap-1 p-2 w-[170px]"
                >
                  <button onClick={() => navigate('/cajero')} className="flex items-center gap-3 p-3 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                    <Wallet size={18} strokeWidth={2.5} />
                    <span className="text-xs font-black tracking-wide">Caja Módulo</span>
                  </button>
                  <button onClick={() => navigate('/mozo')} className="flex items-center gap-3 p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <UtensilsCrossed size={18} strokeWidth={2.5} />
                    <span className="text-xs font-black tracking-wide">Salón y Mesas</span>
                  </button>
                  <button onClick={() => navigate('/cocina')} className="flex items-center gap-3 p-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all">
                    <ChefHat size={18} strokeWidth={2.5} />
                    <span className="text-xs font-black tracking-wide">KDS Cocina</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            <button 
              onClick={() => setMenuRapidoOpen(!menuRapidoOpen)} 
              className="bg-gray-900 text-white p-3.5 rounded-l-xl border-y border-l border-gray-700 shadow-[-5px_0_15px_rgba(0,0,0,0.3)] hover:bg-black transition-colors"
              title="Accesos Rápidos"
            >
              {menuRapidoOpen ? <ChevronRight size={20} /> : <LayoutGrid size={20} />}
            </button>
          </div>
        </div>

        {/* CONTENEDOR CON pr-4 PARA ALINEAR TODO PERFECTAMENTE A LA DERECHA */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 shrink-0 pr-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              {saludo}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">{primerNombre}</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Monitorea el rendimiento financiero, operativo y logístico en tiempo real.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto ml-auto">
            <SelectorRangoFechas inicio={inicio} fin={fin} onChange={(i, f) => { setInicio(i); setFin(f); }} />
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={cargarDatos} disabled={loading} title="Actualizar" className="flex-1 sm:flex-none bg-white hover:bg-gray-50 text-gray-700 p-2.5 rounded-xl border border-gray-200 transition-all flex justify-center items-center shadow-sm">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={descargarExcel} title="Exportar a Excel" className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex justify-center items-center gap-2 shadow-sm">
                <Download size={14} /> <span className="sm:hidden lg:inline">Exportar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 pr-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-white rounded-[2rem] border border-gray-200 shadow-sm">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="font-bold text-gray-400">Analizando métricas y reportes...</p>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard title="Ingresos Brutos" prefix="S/ " value={dashboard?.ingresosTotalesMensuales?.toFixed(2) || '0.00'} trend="12.5" trendUp={true} icon={DollarSign} />
                <KpiCard title="Ticket Promedio" prefix="S/ " value={ticketPromedio} trend="4.1" trendUp={true} icon={TrendingUp} />
                <KpiCard title="Margen de Utilidad" value={hasPremium && margen ? margen.margenBrutoPct.toFixed(1) : '0.0'} suffix="%" trend="1.2" trendUp={true} icon={Activity} isPremium={hasPremium} />
                <KpiCard title="Pérdidas (Mermas)" prefix="S/ " value={hasPremium && margen ? margen.costoMerma.toFixed(2) : '0.00'} icon={AlertTriangle} isPremium={hasPremium} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                <motion.div variants={itemVariants} className="xl:col-span-2 bg-[#0a0f1c] p-6 rounded-2xl shadow-xl border border-gray-800 flex flex-col relative overflow-hidden h-[360px]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                  <div className="relative z-10 flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-white font-black text-lg">Evolución de Ingresos</h3>
                      <p className="text-gray-400 text-xs font-medium mt-1">Facturación diaria en el período seleccionado.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md">
                      <span className="text-xs font-black text-white">S/ {dashboard?.ingresosTotalesMensuales?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  <div className="relative z-10 flex-1 w-full min-w-0">
                    {isChartReady && dashboard?.detalleDiario?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboard.detalleDiario} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                          <XAxis dataKey="fecha" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(str) => new Date(str + 'T00:00:00').toLocaleDateString('es-PE', {day: '2-digit', month: 'short'})} />
                          <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `S/${value}`} />
                          <RechartsTooltip content={<CustomTooltipArea />} cursor={{stroke: '#374151', strokeWidth: 1, strokeDasharray: '4 4'}} />
                          <Area type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" activeDot={{ r: 5, strokeWidth: 0, fill: '#60a5fa' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : !isChartReady ? (
                      <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-blue-500 animate-spin opacity-50" /></div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-sm font-bold">Sin datos para graficar</div>
                    )}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[360px] min-w-0">
                  <div className="mb-2 text-center">
                    <h3 className="text-gray-900 font-black text-lg mb-1">Distribución de Consumo</h3>
                    <p className="text-gray-500 text-xs font-medium">Canales preferidos por los clientes</p>
                  </div>
                  <div className="flex-1 w-full relative min-w-0">
                    {isChartReady && consumoChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={consumoChartData}
                            cx="50%" cy="50%"
                            innerRadius={65} outerRadius={90}
                            paddingAngle={4} cornerRadius={6} dataKey="value" nameKey="name" stroke="none"
                          >
                            {consumoChartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS_CONSUMO[index % COLORS_CONSUMO.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltipPie />} />
                          <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : !isChartReady ? (
                      <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-gray-300 animate-spin" /></div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-bold">Sin datos de canales</div>
                    )}
                  </div>
                </motion.div>

              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                <motion.div variants={itemVariants} className="xl:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[340px] min-w-0">
                  <div className="mb-6">
                    <h3 className="text-gray-900 font-black text-lg mb-1">Rendimiento por Categoría</h3>
                    <p className="text-gray-500 text-[11px] font-medium">Ingresos brutos por familias.</p>
                  </div>
                  <div className="flex-1 w-full min-w-0">
                    {isChartReady && dashboard?.ventasPorCategoria?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={dashboard.ventasPorCategoria.slice(0, 6)} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                          <XAxis type="number" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `S/${value}`} />
                          <YAxis type="category" dataKey="categoria" stroke="#4b5563" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} width={75} />
                          <RechartsTooltip content={<CustomTooltipBar />} cursor={{fill: '#f8fafc'}} />
                          <Bar dataKey="ingresosTotales" fill="#1e293b" radius={[0, 4, 4, 0]} barSize={18}>
                            {dashboard.ventasPorCategoria.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#0f172a' : '#1e293b'} className="hover:opacity-80 transition-opacity cursor-pointer" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : !isChartReady ? (
                      <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-gray-300 animate-spin" /></div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm font-bold">Sin datos suficientes</div>
                    )}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="xl:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[340px]">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <h3 className="text-gray-900 font-black text-lg mb-1">Top Productos</h3>
                    <p className="text-gray-500 text-[11px] font-medium">Por volumen de unidades vendidas.</p>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    {dashboard?.productosMasVendidos?.length > 0 ? (
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-[10px] text-gray-400 uppercase tracking-widest font-black sticky top-0 border-b border-gray-100">
                          <tr>
                            <th className="px-5 py-2">Rank</th>
                            <th className="px-5 py-2">Producto</th>
                            <th className="px-5 py-2 text-right">Unidades</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {dashboard.productosMasVendidos.slice(0, 5).map((prod: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3.5">
                                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</span>
                              </td>
                              <td className="px-5 py-3.5 font-bold text-gray-800 text-[13px] truncate max-w-[150px]">{prod.producto}</td>
                              <td className="px-5 py-3.5 text-right font-black text-gray-900">{prod.cantidadVendida}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm font-bold">Sin datos de venta</div>
                    )}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="xl:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[340px]">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                    <div>
                      <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                        <AlertTriangle size={16} className="text-rose-500"/> Stock Crítico
                      </h3>
                      <p className="text-gray-500 text-[11px] font-medium mt-1">Insumos por debajo del mínimo.</p>
                    </div>
                    <span className="bg-rose-50 text-rose-600 text-[9px] font-black px-2 py-1 rounded-full border border-rose-100 uppercase">
                      {alertas.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                    {alertas.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <CheckCircle size={32} className="mb-2 text-emerald-400 opacity-50"/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Almacén Óptimo</span>
                      </div>
                    ) : (
                      alertas.map((a: any, idx: number) => {
                        const critico = a.stockActual <= 0;
                        const pct = a.stockMinimo > 0 ? (a.stockActual / a.stockMinimo) * 100 : 0;
                        const validPct = Math.min(Math.max(pct, 5), 100); 
                        const nombreInsumo = a.insumo || a.nombre || a.insumoNombre || 'Desconocido';

                        return (
                          <div key={idx} className="p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                            <div className="flex justify-between items-end mb-1.5">
                              <span className="font-bold text-gray-800 text-[11px] truncate max-w-[140px]" title={nombreInsumo}>{nombreInsumo}</span>
                              <div className="text-right leading-none">
                                <span className={`font-black text-xs ${critico ? 'text-rose-600' : 'text-orange-500'}`}>{a.stockActual}</span>
                                <span className="text-[8px] text-gray-400 font-bold ml-1 uppercase">{a.unidadMedida || a.unidad || 'U'}</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                              <div className={`h-1 rounded-full ${critico ? 'bg-rose-500' : 'bg-orange-400'}`} style={{ width: `${validPct}%` }}></div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </motion.div>

              </div>

              <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-black text-gray-900 text-lg">Últimos Tickets Facturados</h3>
                  <button onClick={() => navigate('/historial')} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-blue-100 transition-colors border border-blue-100">
                    Ver Auditoría Completa
                  </button>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
                    <thead className="bg-white text-[10px] text-gray-400 uppercase tracking-widest font-black border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4">Ticket / Fecha</th>
                        <th className="px-6 py-4">Mesa / Consumo</th>
                        <th className="px-6 py-4">Atendido por</th>
                        <th className="px-6 py-4 text-right">Monto Total</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                        <th className="px-6 py-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pedidosRecientes.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold text-sm">No hay tickets recientes</td></tr>
                      ) : pedidosRecientes.map((p) => (
                        <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-3">
                            <p className="font-black text-gray-900 text-[14px]">#{p.id}</p>
                            <p className="text-[10px] text-gray-500 font-bold mt-0.5">{formatearFechaHoraPeru(p.fechaCreacion)}</p>
                          </td>
                          <td className="px-6 py-3 font-bold text-gray-700 text-[13px]">{p.mesa || p.tipoConsumo}</td>
                          <td className="px-6 py-3 text-xs font-bold text-gray-600 flex items-center gap-2 mt-1">
                            <div className="w-6 h-6 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] uppercase">{p.mozo.charAt(0)}</div>
                            {p.mozo}
                          </td>
                          <td className="px-6 py-3 text-right font-black text-gray-900 text-[14px]">S/ {p.total.toFixed(2)}</td>
                          <td className="px-6 py-3 text-center">
                            <span className="inline-flex px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-black text-[9px] tracking-widest uppercase border border-emerald-100">
                              {p.estadoActual}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button onClick={() => setPedidoSeleccionado(p)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm active:scale-95">
                              <Eye size={16} strokeWidth={2.5}/> Ver Detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

            </motion.div>
          )}
        </div>
      </div>

      {pedidoSeleccionado && <ModalDetalleHistorial pedido={pedidoSeleccionado} onClose={() => setPedidoSeleccionado(null)} />}
    </AdminLayout>
  );
}