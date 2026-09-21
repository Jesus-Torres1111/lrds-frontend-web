import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Download, RefreshCw, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import api from '@/api/client';
import { sileo } from 'sileo';
import { fechaPeruISO, formatearFechaHoraPeru } from '@/lib/datetimePeru';

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
            className="absolute right-0 md:left-0 z-50 mt-2 w-[21rem] bg-white rounded-2xl border border-gray-200 shadow-xl p-4"
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

export default function ReportesCajasPage() {
  const { sedeSeleccionadaId } = useAuthStore();
  const [sesiones, setSesiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); 
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);

  const cargarAuditoria = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/caja/auditoria?inicio=${fechaInicio}&fin=${fechaFin}`;
      if (sedeSeleccionadaId) url += `&sedeId=${sedeSeleccionadaId}`;
      const { data } = await api.get(url);
      setSesiones(data);
    } catch (e) {
      sileo.error({ title: 'Error cargando auditoría de cajas' });
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  }, [fechaInicio, fechaFin, sedeSeleccionadaId]);

  useEffect(() => { cargarAuditoria(); }, [cargarAuditoria]);

  const descargarExcel = () => {
    if (sesiones.length === 0) return sileo.error({ title: 'No hay datos para exportar' });
    const token = useAuthStore.getState().token;
    let url = `http://localhost:8080/api/caja/auditoria/excel?inicio=${fechaInicio}&fin=${fechaFin}&token=${encodeURIComponent(token || '')}`;
    if (sedeSeleccionadaId) url += `&sedeId=${sedeSeleccionadaId}`;
    window.location.href = url;
  };

  const chartData = sesiones.filter(s => s.estado === 'CERRADA').map(s => {
    const finalDec = s.montoFinalDeclarado || 0;
    const diff = s.montoFinalCalculado ? (finalDec - s.montoFinalCalculado) : 0;
    return {
      cajero: s.cajero?.nombre?.split(' ')[0] || 'Usuario',
      fecha: new Date(s.fechaApertura).toLocaleDateString('es-PE', {day:'2-digit', month:'short'}),
      esperado: s.montoFinalCalculado || 0,
      declarado: finalDec,
      diferencia: diff
    };
  }).reverse();

  const descuadreTotal = chartData.reduce((acc, curr) => acc + curr.diferencia, 0);

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-120px)] animate-in fade-in relative overflow-x-hidden">
        
        {/* CABECERA ESTANDARIZADA IDÉNTICA AL DASHBOARD */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 shrink-0 pr-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Auditoría de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Cajas</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Supervisa aperturas, cierres y descuadres de tus cajeros.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full xl:w-auto ml-auto">
            <SelectorRangoFechas inicio={fechaInicio} fin={fechaFin} onChange={(i, f) => { setFechaInicio(i); setFechaFin(f); }} />
            <div className="flex gap-2 w-full sm:w-auto justify-end">

              <button onClick={cargarAuditoria} disabled={loading} title="Actualizar" className="flex-1 sm:flex-none bg-white hover:bg-gray-50 text-gray-700 p-2.5 rounded-xl border border-gray-200 transition-all flex justify-center items-center shadow-sm">
                
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              {/* BOTÓN CON GRADIENTE NARANJA */}
              <button onClick={descargarExcel} title="Exportar a Excel" className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex justify-center items-center gap-2 shadow-sm">
                <Download size={14} /> <span className="sm:hidden lg:inline">Exportar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 pr-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6 shrink-0">
            <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm h-72 flex flex-col">
              <h3 className="font-black text-gray-900 text-lg mb-4">Esperado vs Declarado (Últimos Cierres)</h3>
              <div className="flex-1 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} tickFormatter={(val) => `S/${val}`} />
                    <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="esperado" name="Sistema Esperaba" fill="#94a3b8" radius={[4,4,0,0]} barSize={20} />
                    <Bar dataKey="declarado" name="Cajero Declaró" fill="#f97316" radius={[4,4,0,0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-3xl p-8 shadow-xl text-white flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/20 rounded-full blur-[50px] pointer-events-none"></div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 relative z-10">Descuadre Acumulado</p>
              <h2 className={`text-5xl font-black tracking-tight leading-none mb-4 relative z-10 ${descuadreTotal < 0 ? 'text-rose-500' : descuadreTotal > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                S/ {Math.abs(descuadreTotal).toFixed(2)}
              </h2>
              <p className="text-sm font-medium text-slate-400 relative z-10">
                {descuadreTotal < 0 ? 'Faltantes predominan en el rango.' : descuadreTotal > 0 ? 'Sobrantes predominan en el rango.' : 'Cajas cuadradas a la perfección.'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto custom-scrollbar flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-black z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4">ID / Estado</th>
                    <th className="px-6 py-4">Cajero(a)</th>
                    <th className="px-6 py-4">Horarios (Apertura - Cierre)</th>
                    <th className="px-6 py-4 text-right">Fondo Inicial</th>
                    <th className="px-6 py-4 text-right">Efectivo Declarado</th>
                    <th className="px-6 py-4 text-right">Descuadre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sesiones.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center font-bold text-gray-400">No hay sesiones de caja en estas fechas</td></tr>
                  ) : (
                    sesiones.map((s) => {
                      const finalDec = s.montoFinalDeclarado || 0;
                      const diff = s.montoFinalCalculado ? (finalDec - s.montoFinalCalculado) : 0;
                      
                      return (
                        <tr key={s.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-start">
                              <span className="font-black text-gray-900 text-sm">#{s.id}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase mt-1 ${s.estado === 'ABIERTA' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                {s.estado === 'ABIERTA' ? <Unlock size={10}/> : <Lock size={10}/>} {s.estado}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-black text-xs">
                                {(s.cajero?.nombre || 'U').charAt(0)}
                              </div>
                              <span className="font-bold text-gray-700">{s.cajero?.nombre || 'Usuario'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-gray-800">{formatearFechaHoraPeru(s.fechaApertura)}</div>
                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">{s.fechaCierre ? formatearFechaHoraPeru(s.fechaCierre) : 'Sesión en curso...'}</div>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-gray-600">S/ {s.montoInicial.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-black text-gray-900">
                            {s.estado === 'CERRADA' ? `S/ ${finalDec.toFixed(2)}` : '---'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {s.estado === 'ABIERTA' ? <span className="text-gray-300">-</span> : (
                              <span className={`font-black text-xs px-3 py-1.5 rounded-lg ${diff < 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : diff > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}