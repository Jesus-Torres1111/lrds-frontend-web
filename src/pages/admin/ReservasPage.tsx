import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { CalendarDays, Users, Phone, CheckCircle, XCircle, Plus, Loader2, BookOpen, X, Calendar as CalendarIcon, Timer, ChevronLeft, ChevronRight, ChevronDown, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { crearReserva, cambiarEstadoReserva, type Reserva } from '@/api/reservas';
import api from '@/api/client';
import { sileo } from 'sileo';
import { useAuthStore } from '@/store/authStore';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function hoy() { return new Date().toISOString().split('T')[0]; }

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

function generarSlotsHora(inicio = 8 * 60, fin = 23 * 60 + 30, paso = 30) {
  const slots: string[] = [];
  for (let m = inicio; m <= fin; m += paso) {
    const h = Math.floor(m / 60).toString().padStart(2, '0');
    const mi = (m % 60).toString().padStart(2, '0');
    slots.push(`${h}:${mi}`);
  }
  return slots;
}

function formatearHora12(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const periodo = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${periodo}`;
}

function CustomCalendar({ valor, onSeleccionar, minFecha, className }: { valor: string; onSeleccionar: (iso: string) => void; minFecha?: string; className?: string }) {
  const fechaSeleccionada = parseISODate(valor);
  const [viewDate, setViewDate] = useState(new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1));
  const dias = generarDiasMes(viewDate);
  const hoyStr = hoy();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`absolute z-50 mt-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 ${className || ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 text-gray-500 hover:text-orange-600 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-black text-gray-900">{MESES[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
        <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 text-gray-500 hover:text-orange-600 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_SEMANA.map(d => (
          <span key={d} className="text-[10px] font-black text-gray-400 text-center uppercase">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dias.map(({ fecha, delMes }, i) => {
          const iso = toISODate(fecha);
          const esSeleccionado = iso === valor;
          const esHoy = iso === hoyStr;
          const deshabilitado = minFecha ? iso < minFecha : false;
          return (
            <button
              type="button"
              key={i}
              disabled={deshabilitado}
              onClick={() => onSeleccionar(iso)}
              className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs font-bold transition-all
                ${!delMes ? 'text-gray-300' : 'text-gray-700'}
                ${esSeleccionado ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' : 'hover:bg-orange-50'}
                ${esHoy && !esSeleccionado ? 'ring-2 ring-orange-300' : ''}
                ${deshabilitado ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''}`}
            >
              {fecha.getDate()}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function CampoFecha({ valor, onChange, minFecha }: { valor: string; onChange: (v: string) => void; minFecha?: string }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = parseISODate(valor).toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto(o => !o)}
        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-bold text-gray-900 flex items-center justify-between gap-2 transition-all ${abierto ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <span className="flex items-center gap-2 capitalize">
          <CalendarIcon size={15} className="text-orange-500" />
          {label}
        </span>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${abierto ? 'rotate-180 text-orange-500' : ''}`} />
      </button>
      <AnimatePresence>
        {abierto && (
          <CustomCalendar valor={valor} minFecha={minFecha} onSeleccionar={(iso) => { onChange(iso); setAbierto(false); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CampoHora({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const slots = generarSlotsHora();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto(o => !o)}
        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-bold text-gray-900 flex items-center justify-between gap-2 transition-all ${abierto ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <span className="flex items-center gap-2">
          <Timer size={15} className="text-orange-500" />
          {formatearHora12(valor)}
        </span>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${abierto ? 'rotate-180 text-orange-500' : ''}`} />
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-gray-200 shadow-xl p-2 max-h-56 overflow-y-auto custom-scrollbar"
          >
            {slots.map(s => {
              const activo = s === valor;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => { onChange(s); setAbierto(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${activo ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'text-gray-600 hover:bg-orange-50'}`}
                >
                  {formatearHora12(s)}
                  {activo && <CheckCircle size={13} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SelectorFechaFiltro({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const [anchor, setAnchor] = useState(() => {
    const d = parseISODate(valor);
    d.setDate(d.getDate() - 3);
    return d;
  });
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setCalendarioAbierto(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + i);
    return d;
  });

  const hoyStr = hoy();

  return (
    <div className="flex items-center gap-2" ref={ref}>
      <button
        type="button"
        onClick={() => { const n = new Date(anchor); n.setDate(n.getDate() - 7); setAnchor(n); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors shrink-0"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {dias.map((d) => {
          const iso = toISODate(d);
          const activo = iso === valor;
          const esHoy = iso === hoyStr;
          return (
            <button
              type="button"
              key={iso}
              onClick={() => onChange(iso)}
              className={`flex flex-col items-center justify-center w-11 h-12 rounded-xl transition-all shrink-0 ${activo ? 'bg-gradient-to-b from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30' : 'bg-gray-50 text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}
            >
              <span className="text-[9px] font-black uppercase tracking-wider opacity-80">{d.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '')}</span>
              <span className="text-sm font-black leading-none mt-0.5">{d.getDate()}</span>
              {esHoy && <span className={`w-1 h-1 rounded-full mt-1 ${activo ? 'bg-white' : 'bg-orange-500'}`}></span>}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => { const n = new Date(anchor); n.setDate(n.getDate() + 7); setAnchor(n); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors shrink-0"
      >
        <ChevronRight size={16} />
      </button>

      <div className="w-px h-8 bg-gray-200 mx-1"></div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setCalendarioAbierto(o => !o)}
          className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${calendarioAbierto ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}
        >
          <CalendarIcon size={16} />
        </button>
        <AnimatePresence>
          {calendarioAbierto && (
            <CustomCalendar
              className="right-0 origin-top-right"
              valor={valor}
              onSeleccionar={(iso) => {
                onChange(iso);
                const d = parseISODate(iso);
                d.setDate(d.getDate() - 3);
                setAnchor(d);
                setCalendarioAbierto(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ModalNuevaReserva({ isOpen, onClose, onGuardar, sedeId }: { isOpen: boolean; onClose: () => void; onGuardar: () => void; sedeId: number | null }) {
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [fecha, setFecha] = useState(() => hoy());
  const [hora, setHora] = useState('20:00');
  const [cantidadPersonas, setCantidadPersonas] = useState(2);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorLimpio = e.target.value.replace(/\D/g, '').slice(0, 9);
    setTelefonoCliente(valorLimpio);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCliente.trim() || !fecha || !hora) return sileo.error({ title: 'Completa los datos obligatorios' });
    if (telefonoCliente && telefonoCliente.length < 9) return sileo.error({ title: 'El teléfono debe tener 9 dígitos' });

    setLoading(true);
    try {
      const fechaHoraLiteral = `${fecha}T${hora}:00`;
      
      await crearReserva({
        nombreCliente,
        telefonoCliente,
        fechaHora: fechaHoraLiteral,
        cantidadPersonas,
        notas,
        sedeId: sedeId || undefined,
        estado: 'PENDIENTE'
      } as any);
      
      sileo.success({ title: 'Reserva agendada exitosamente' });
      onGuardar();
    } catch (error: any) {
      sileo.error({
        title: 'Error al procesar reserva',
        description: error.response?.data?.message || 'Error al guardar'
      });
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-[9999] overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
      <div className="min-h-screen px-4 pt-24 pb-12 flex justify-center items-start">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col relative animate-in zoom-in-95 duration-200">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0 rounded-t-2xl">
            <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-xl">
                <BookOpen size={20} className="text-orange-500" />
              </div>
              Nueva Reservación
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-200 p-1.5 rounded-lg transition-all active:scale-95"><X size={20} strokeWidth={2.5}/></button>
          </div>

          <form id="reserva-form" onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Users size={14} /> Nombre del Cliente
                  </label>
                  <input autoFocus value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" placeholder="Ej. Familia Pérez" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Phone size={14} /> Teléfono (9 dígitos)
                  </label>
                  <input type="text" inputMode="numeric" maxLength={9} value={telefonoCliente} onChange={handleTelefonoChange} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" placeholder="Ej. 987654321" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Users size={14} /> Cantidad de Personas
                  </label>
                  <input type="number" min={1} value={cantidadPersonas} onChange={e => setCantidadPersonas(Number(e.target.value))} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Notas / Peticiones</label>
                  <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm transition-all custom-scrollbar" placeholder="Ej. Cerca a la ventana, silla de bebé..." />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Fecha de la Reserva</label>
                  <CampoFecha valor={fecha} onChange={setFecha} minFecha={hoy()} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Hora</label>
                  <CampoHora valor={hora} onChange={setHora} />
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-5 flex items-center gap-4 mt-6">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                    <CalendarDays size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Resumen de Agenda</p>
                    <p className="text-sm font-black text-gray-900 capitalize mt-1 leading-tight">
                      {parseISODate(fecha).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                      <br />
                      {formatearHora12(hora)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="p-5 border-t border-gray-100 bg-gray-50/80 flex gap-4 shrink-0 justify-end rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">Cancelar</button>
            <button form="reserva-form" type="submit" disabled={loading} className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-sm rounded-xl disabled:opacity-50 flex justify-center items-center shadow-md transition-all active:scale-95">
              {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              {loading ? 'Procesando...' : 'Confirmar Mesa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReservasPage() {
  const { user, sedeSeleccionadaId } = useAuthStore();
  const navigate = useNavigate();

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState<string>(() => hoy());
  const [modNoHabilitado, setModNoHabilitado] = useState(false);

  const isAdmin = ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'].includes(user?.rol || '');

  const cargarReservas = useCallback(async () => {
    if (!sedeSeleccionadaId) return setLoading(false);
    setLoading(true);
    try {
      const { data } = await api.get('/reservas', { 
        params: { sedeId: sedeSeleccionadaId || undefined } 
      });
      setReservas(data || []);
      setModNoHabilitado(false);
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.data?.codigo === 'MODULO_NO_HABILITADO') {
        setModNoHabilitado(true);
      } else {
        sileo.error({ title: 'Aviso', description: 'Error al conectar con el servidor' });
      }
    } finally { setLoading(false); }
  }, [sedeSeleccionadaId]);

  useEffect(() => { cargarReservas(); }, [cargarReservas]);

  const handleEstado = async (id: number, estado: string) => {
    try {
      await cambiarEstadoReserva(id, estado);
      sileo.success({ title: 'Estado actualizado' });
      cargarReservas();
    } catch (e) { sileo.error({ title: 'Error al cambiar estado' }); }
  };

  const reservasFiltradasPorFecha = reservas.filter(res => {
    if (!fechaFiltro) return true;
    const fechaReservaLiteral = res.fechaHora.split('T')[0];
    return fechaReservaLiteral === fechaFiltro;
  }).sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

  if (modNoHabilitado) {
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col p-4 md:p-6 justify-center items-center">
          <div className="bg-white rounded-[2rem] p-10 max-w-xl w-full text-center shadow-xl border border-gray-200">
            <div className="w-20 h-20 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-orange-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Plan Premium Requerido</h2>
            <p className="text-gray-500 font-medium text-sm mb-6">El módulo de <strong>Reservaciones</strong> no está disponible.</p>
            <button onClick={() => navigate(-1)} className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-black shadow-lg mx-auto flex items-center gap-2 transition-all active:scale-95">
              <ArrowLeft size={18} /> Volver a mi panel
            </button>
          </div>
        </div>
      );
    }
    return (
      <AdminLayout>
        <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-120px)]">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-red-500"></div>
            <div className="w-20 h-20 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mb-4">
              <Lock size={32} className="text-orange-500" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-orange-200">
              <Sparkles size={12} /> Módulo Bloqueado
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Plan Premium Requerido</h2>
            <p className="text-gray-500 font-medium text-sm max-w-md mb-6">El módulo de <strong>Reservaciones</strong> está disponible únicamente para empresas operando con el Plan Completo.</p>
            <button onClick={() => navigate('/dashboard')} className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm">
              <ArrowLeft size={16} /> Volver al Dashboard
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'ASISTIO': return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">Asistió</span>;
      case 'CANCELADA': return <span className="bg-gray-100 text-gray-500 border border-gray-200 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">Cancelada</span>;
      default: return <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">Pendiente</span>;
    }
  };

  const renderContenido = () => (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Libro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Reservaciones</span>
          </h1>
          <p className="text-gray-500 font-medium text-sm">Gestión y control de mesas reservadas por fecha.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-2 transition-colors shadow-sm active:scale-95">
          <Plus size={16} /> Nueva Reserva
        </button>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 shrink-0 mb-4 w-full md:w-fit overflow-x-auto custom-scrollbar">
        <SelectorFechaFiltro valor={fechaFiltro} onChange={setFechaFiltro} />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="font-bold text-gray-500">Consultando agenda...</p>
          </div>
        ) : reservasFiltradasPorFecha.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-1">Agenda Libre</h3>
            <p className="text-gray-500 font-medium text-sm">No hay reservas programadas para este día.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max items-start">
            <AnimatePresence>
              {reservasFiltradasPorFecha.map((r) => (
                <motion.div layout variants={itemVariants} initial="hidden" animate="show" exit="hidden" key={r.id} className={`bg-white rounded-2xl border flex flex-col overflow-hidden shadow-sm transition-all hover:shadow-md ${r.estado === 'CANCELADA' ? 'opacity-60 border-gray-200' : 'border-gray-200'}`}>
                  <div className={`w-1.5 absolute top-0 bottom-0 left-0 ${r.estado === 'ASISTIO' ? 'bg-emerald-500' : r.estado === 'CANCELADA' ? 'bg-gray-300' : 'bg-orange-500'}`}></div>
                  
                  <div className="p-5 pl-7 relative">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-black text-lg text-gray-900 leading-tight">{r.nombreCliente}</h3>
                      {getStatusBadge(r.estado)}
                    </div>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 text-gray-600 text-xs font-bold">
                        <CalendarIcon size={14} className={r.estado === 'CANCELADA' ? 'text-gray-400' : 'text-orange-500'} />
                        {new Date(r.fechaHora).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(r.fechaHora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-600 text-xs font-bold">
                        <Users size={14} className={r.estado === 'CANCELADA' ? 'text-gray-400' : 'text-orange-500'} />
                        {r.cantidadPersonas} Personas
                      </div>
                      {r.telefonoCliente && (
                        <div className="flex items-center gap-2.5 text-gray-600 text-xs font-bold">
                          <Phone size={14} className={r.estado === 'CANCELADA' ? 'text-gray-400' : 'text-orange-500'} />
                          {r.telefonoCliente}
                        </div>
                      )}
                    </div>

                    {r.notas && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[11px] font-medium text-gray-600 italic leading-relaxed">"{r.notas}"</p>
                      </div>
                    )}
                  </div>

                  {r.estado === 'PENDIENTE' && (
                    <div className="flex border-t border-gray-100 bg-gray-50/50 mt-auto">
                      <button onClick={() => handleEstado(r.id, 'ASISTIO')} className="flex-1 py-3.5 flex items-center justify-center gap-1.5 text-xs font-black text-emerald-600 hover:bg-emerald-50 transition-colors border-r border-gray-100">
                        <CheckCircle size={14} /> Asistió
                      </button>
                      <button onClick={() => handleEstado(r.id, 'CANCELADA')} className="flex-1 py-3.5 flex items-center justify-center gap-1.5 text-xs font-black text-rose-600 hover:bg-rose-50 transition-colors">
                        <XCircle size={14} /> Faltó
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <div className="w-full flex-1 max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col h-screen">
          <div className="mb-4 shrink-0 flex justify-between items-center bg-gray-900 text-white px-6 py-4 rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[60px] pointer-events-none"></div>
            <div className="relative z-10">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Recepción</h1>
              <p className="text-gray-400 font-medium text-xs mt-0.5">Control de acceso y mesas reservadas</p>
            </div>
            <button onClick={() => navigate(-1)} className="relative z-10 bg-white/10 border border-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm">
              <ArrowLeft size={16} /> <span className="hidden sm:inline">Volver a mi panel</span>
            </button>
          </div>
          {renderContenido()}
        </div>
        <ModalNuevaReserva 
          isOpen={isModalOpen} 
          sedeId={sedeSeleccionadaId}
          onClose={() => setIsModalOpen(false)} 
          onGuardar={() => { setIsModalOpen(false); cargarReservas(); }} 
        />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-120px)] overflow-hidden">
        {renderContenido()}
      </div>
      <ModalNuevaReserva 
        isOpen={isModalOpen} 
        sedeId={sedeSeleccionadaId}
        onClose={() => setIsModalOpen(false)} 
        onGuardar={() => { setIsModalOpen(false); cargarReservas(); }} 
      />
    </AdminLayout>
  );
}