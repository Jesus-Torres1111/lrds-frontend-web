import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Lock, Unlock, Receipt, X, Split, CircleCheck, 
  FileText, Printer, Ban, Moon, Sun, ShieldAlert, Loader2, 
  Banknote, ArrowRightCircle, AlertTriangle, History, 
  TrendingUp, Smartphone, CreditCard, PieChart, ChevronDown, 
  Store, Plus, Minus, Send, PackageSearch, CalendarDays, ArrowLeft
} from 'lucide-react';
import { abrirCaja, cerrarCaja, getCajaActiva, procesarPago, getResumenCaja } from '@/api/caja';
// IMPORTANTE: Asegúrate de que entregarPedido esté importado aquí
import { getPedidosActivos, crearDocumentoCobro, listarDocumentosCobro, pagarDocumentoCobro, getHistorialPedidos, getProductos, crearPedido, confirmarPedido, entregarPedido } from '@/api/pedidos';
import { emitirDocumentoVenta, anularDocumentoVenta, listarPorPedido } from '@/api/documentosVenta';
import { getMiEmpresa } from '@/api/empresa';
import { useAuthStore } from '@/store/authStore';
import { formatearFechaHoraPeru } from '@/lib/datetimePeru';
import { sileo } from 'sileo';
import api from '@/api/client';
import type { SesionCaja, PagoItem } from '@/api/caja';
import type { PedidoActivo, Producto, ItemPedidoLocal } from '@/types';
import type { DocumentoCobro } from '@/api/pedidos';
import type { DocumentoVenta } from '@/api/documentosVenta';
import type { Empresa } from '@/api/empresa';

const THEMES = {
  light: {
    appBg: 'bg-zinc-50', panelBg: 'bg-white', cardBg: 'bg-white', itemBg: 'bg-zinc-50',
    textMain: 'text-zinc-900', textMainHover: 'hover:text-zinc-900', textMuted: 'text-zinc-500',
    border: 'border-zinc-200', borderLight: 'border-zinc-100',
    primaryBtn: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black font-bold',
    secondaryBtn: 'bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 shadow-sm',
    inputBg: 'bg-white focus:bg-zinc-50 text-zinc-900', ring: 'focus:ring-orange-400', iconBadge: 'bg-zinc-900 text-white'
  },
  dark: {
    appBg: 'bg-[#050505]', panelBg: 'bg-[#0a0a0a]', cardBg: 'bg-[#0a0a0a]', itemBg: 'bg-[#141414]', 
    textMain: 'text-white', textMainHover: 'hover:text-white', textMuted: 'text-gray-400',
    border: 'border-gray-800/60', borderLight: 'border-gray-800/40',
    primaryBtn: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black font-bold',
    secondaryBtn: 'bg-[#141414] hover:bg-[#222] text-white border border-gray-800',
    inputBg: 'bg-[#0a0a0a] focus:bg-[#141414] text-white', ring: 'focus:ring-[#FFC640]/50', iconBadge: 'bg-white text-black'
  }
};
type ThemeKey = 'light' | 'dark';

// Función para identificar rápidamente si un pedido viene de la pasarela web (Izipay)
const isWebOrder = (p: any) => p.mozo === 'Web / Delivery' || p.mesa === 'DELIVERY WEB' || p.mesa === 'RECOJO WEB';

const METODOS_INFO: Record<string, { icon: React.ReactNode, label: string, color: string, bg: string }> = {
  'EFECTIVO': { icon: <Banknote size={18} />, label: 'Efectivo', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'YAPE': { icon: <Smartphone size={18} />, label: 'Yape', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'PLIN': { icon: <Smartphone size={18} />, label: 'Plin', color: 'text-sky-500', bg: 'bg-sky-500/10' },
  'TARJETA': { icon: <CreditCard size={18} />, label: 'Tarjeta', color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

const puedeAnular = (rol?: string) => rol === 'ROLE_GERENTE_SEDE' || rol === 'ROLE_SUPER_ADMIN' || rol === 'ROLE_ADMIN_EMPRESA';

const imprimirTicketCierreZ = (sesionCerrada: any, resumen: any, empresa: Empresa | null, user: any) => {
  const win = window.open('', 'Imprimir Arqueo', 'width=400,height=600');
  if (!win) return sileo.error({ title: 'Permita las ventanas emergentes para imprimir' });
  
  const totalEfectivoVentas = resumen['EFECTIVO'] || 0;
  const totalDigital = (resumen['YAPE'] || 0) + (resumen['PLIN'] || 0) + (resumen['TARJETA'] || 0);
  const fondoBase = sesionCerrada.montoInicial || 0;
  const totalEsperadoFisico = fondoBase + totalEfectivoVentas;
  const montoDeclarado = sesionCerrada.montoFinalDeclarado || 0;
  const diferencia = montoDeclarado - totalEsperadoFisico;

  win.document.write(`
    <html>
    <head>
      <title>Ticket de Cierre Z</title>
      <style>
        body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 10px; width: 100%; max-width: 300px; color: #000; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-bottom: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        td { padding: 2px 0; vertical-align: top; }
        .right { text-align: right; }
        @media print {
          @page { margin: 0; }
          body { width: 100%; max-width: 300px; margin: 0 auto; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        <h2 style="margin: 0; font-size: 16px;">${empresa?.nombreComercial || 'LA RUTA DEL SABOR'}</h2>
        <div class="line"></div>
        <h3 style="margin: 5px 0; font-size: 14px;">REPORTE Z - CIERRE DE CAJA</h3>
        <div class="bold">SESIÓN #${sesionCerrada.id}</div>
      </div>
      <div class="line"></div>
      <div><span class="bold">Apertura:</span> ${new Date(sesionCerrada.fechaApertura).toLocaleString('es-PE')}</div>
      <div><span class="bold">Cierre:</span> ${new Date(sesionCerrada.fechaCierre || new Date()).toLocaleString('es-PE')}</div>
      <div><span class="bold">Cajero(a):</span> ${user?.nombre || 'Usuario'}</div>
      
      <div class="line"></div>
      <div class="center bold">RESUMEN DE INGRESOS</div>
      <table>
        <tr><td>EFECTIVO (Ventas):</td><td class="right">S/ ${totalEfectivoVentas.toFixed(2)}</td></tr>
        <tr><td>YAPE:</td><td class="right">S/ ${(resumen['YAPE'] || 0).toFixed(2)}</td></tr>
        <tr><td>PLIN:</td><td class="right">S/ ${(resumen['PLIN'] || 0).toFixed(2)}</td></tr>
        <tr><td>TARJETAS:</td><td class="right">S/ ${(resumen['TARJETA'] || 0).toFixed(2)}</td></tr>
        <tr><td class="bold">TOTAL DIGITAL:</td><td class="right bold">S/ ${totalDigital.toFixed(2)}</td></tr>
      </table>

      <div class="line"></div>
      <div class="center bold">ARQUEO FÍSICO (EFECTIVO)</div>
      <table>
        <tr><td>Fondo de Inicio:</td><td class="right">S/ ${fondoBase.toFixed(2)}</td></tr>
        <tr><td>Ventas Efectivo:</td><td class="right">+ S/ ${totalEfectivoVentas.toFixed(2)}</td></tr>
        <tr><td class="bold">SISTEMA ESPERABA:</td><td class="right bold">S/ ${totalEsperadoFisico.toFixed(2)}</td></tr>
        <tr><td>CAJERO DECLARÓ:</td><td class="right">S/ ${montoDeclarado.toFixed(2)}</td></tr>
      </table>
      
      <div class="line"></div>
      <table>
        <tr>
          <td class="bold" style="font-size:14px;">${diferencia < 0 ? 'FALTANTE' : diferencia > 0 ? 'SOBRANTE' : 'CUADRE EXACTO'}:</td>
          <td class="right bold" style="font-size:14px;">S/ ${Math.abs(diferencia).toFixed(2)}</td>
        </tr>
      </table>
      <div class="line"></div>
      <br><br><br>
      <div class="center">
        <div class="line" style="width: 80%; margin: 0 auto;"></div>
        <div>Firma del Cajero</div>
      </div>
      <script>
        window.onload = function() { window.print(); window.close(); }
      </script>
    </body>
    </html>
  `);
  win.document.close();
};

const imprimirTicketTermico = (pedido: PedidoActivo, docVenta: DocumentoVenta | null, empresa: Empresa | null) => {
  const win = window.open('', 'Imprimir Ticket', 'width=400,height=600');
  if (!win) return sileo.error({ title: 'Permita las ventanas emergentes para imprimir' });
  const tipoDocTexto = docVenta?.tipo === 'FACTURA' ? 'FACTURA ELECTRÓNICA' :
                       docVenta?.tipo === 'BOLETA' ? 'BOLETA DE VENTA ELECTRÓNICA' : 'TICKET DE VENTA';
  const esOficial = docVenta?.tipo === 'FACTURA' || docVenta?.tipo === 'BOLETA';
  const numeroDoc = docVenta ? `${docVenta.serie}-${String(docVenta.correlativo).padStart(6, '0')}` : `ORDEN #${pedido.id}`;
  const docReceptor = docVenta?.numeroDocumentoReceptor;
  const nombreReceptor = docVenta?.razonSocialReceptor;
  const tipoDocReceptor = docVenta?.tipoDocumentoReceptor;
  const totalImprimir = docVenta?.total || pedido.total;

  win.document.write(`
    <html>
    <head>
      <title>Ticket ${numeroDoc}</title>
      <style>
        body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 10px; width: 100%; max-width: 300px; color: #000; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-bottom: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        th, td { padding: 3px 0; vertical-align: top; }
        th { border-bottom: 1px solid #000; text-align: left; }
        .right { text-align: right; }
        @media print {
          @page { margin: 0; }
          body { width: 100%; max-width: 300px; margin: 0 auto; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        <h2 style="margin: 0; font-size: 16px;">${empresa?.nombreComercial || 'LA RUTA DEL SABOR'}</h2>
        ${empresa?.ruc ? `<div>RUC: ${empresa.ruc}</div>` : ''}
        ${empresa?.direccion ? `<div>${empresa.direccion}</div>` : ''}
        <div class="line"></div>
        <h3 style="margin: 5px 0; font-size: 14px;">${tipoDocTexto}</h3>
        <div class="bold">${numeroDoc}</div>
      </div>
      <div class="line"></div>
      <div><span class="bold">F. Emisión:</span> ${new Date(docVenta?.fechaEmision || new Date()).toLocaleString('es-PE')}</div>
      <div><span class="bold">Atendido por:</span> ${pedido.mozo || 'Cajero'}</div>
      <div><span class="bold">Mesa/Ref:</span> ${pedido.mesa || pedido.tipoConsumo}</div>
      
      ${nombreReceptor || docReceptor ? '<div class="line"></div>' : ''}
      ${nombreReceptor ? `<div><span class="bold">Cliente:</span> ${nombreReceptor}</div>` : ''}
      ${docReceptor ? `<div><span class="bold">${tipoDocReceptor || 'DOC'}:</span> ${docReceptor}</div>` : ''}
      
      <div class="line"></div>
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">CANT</th>
            <th style="width: 55%;">DESCRIPCIÓN</th>
            <th style="width: 30%;" class="right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${pedido.items.map((i: any) => `
            <tr>
              <td>${i.cantidad}</td>
              <td>${i.nombreProducto}</td>
              <td class="right">S/ ${i.subtotal.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="line"></div>
      <table>
        ${esOficial ? `
        <tr><td>OP. GRAVADAS:</td><td class="right">S/ ${(docVenta?.subtotal || totalImprimir / 1.18).toFixed(2)}</td></tr>
        <tr><td>IGV (18%):</td><td class="right">S/ ${(docVenta?.igv || totalImprimir - (totalImprimir / 1.18)).toFixed(2)}</td></tr>
        ` : ''}
        ${pedido.descuento > 0 ? `<tr><td>DESCUENTO:</td><td class="right">-S/ ${pedido.descuento.toFixed(2)}</td></tr>` : ''}
        <tr><td class="bold" style="font-size:15px; padding-top: 5px;">TOTAL A PAGAR:</td><td class="right bold" style="font-size:15px; padding-top: 5px;">S/ ${totalImprimir.toFixed(2)}</td></tr>
      </table>
      <div class="line"></div>
      <div class="center">
        <div class="bold">¡Gracias por su preferencia!</div>
        <div style="font-size: 10px; margin-top: 5px;">Vuelva Pronto</div>
        ${esOficial ? `<div style="font-size: 9px; margin-top:8px; color: #333;">Representación impresa de la ${docVenta?.tipo === 'FACTURA' ? 'Factura' : 'Boleta'} Electrónica</div>` : ''}
      </div>
      <script>
        window.onload = function() { window.print(); window.close(); }
      </script>
    </body>
    </html>
  `);
  win.document.close();
};

const buscarClienteExterno = async (tipo: string, documento: string, setNombre: (val: string) => void, setLoading: (val: boolean) => void) => {
  if (!documento || (tipo === 'BOLETA' && documento.length !== 8) || (tipo === 'FACTURA' && documento.length !== 11)) return;
  setLoading(true);
  try {
    const endpoint = tipo === 'FACTURA' 
      ? `/externo/ruc?numero=${documento}` 
      : `/externo/dni?numero=${documento}`;
      
    const response = await api.get(endpoint);
    const data = response.data;
    
    if (data) {
      if (tipo === 'FACTURA' && data.razon_social) {
        setNombre(data.razon_social);
      } else if (tipo === 'BOLETA' && data.full_name) {
        setNombre(data.full_name);
      }
    }
  } catch (error) {
    console.error("Error al consultar DNI/RUC mediante el backend", error);
  } finally {
    setLoading(false);
  }
};

function ModalConfirmacion({ isOpen, title, message, type, requireInput, inputPlaceholder, onConfirm, onCancel, loading, theme }: any) {
  const c = THEMES[theme as ThemeKey] || THEMES.dark;
  const [val, setVal] = useState('');
  
  useEffect(() => { if (isOpen) setVal(''); }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className={`${c.panelBg} border ${c.border} rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200`}>
        <div className={`px-8 py-8 flex flex-col items-center text-center ${type === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${type === 'danger' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
            {type === 'danger' ? <ShieldAlert size={40} /> : <AlertTriangle size={40} />}
          </div>
          <h2 className={`font-black text-2xl tracking-tight mb-3 ${type === 'danger' ? 'text-red-500' : 'text-amber-500'}`}>{title}</h2>
          <p className={`text-sm font-bold leading-relaxed ${c.textMuted}`}>{message}</p>
        </div>
        {requireInput && (
          <div className={`px-8 pt-4 pb-8 ${c.panelBg}`}>
            <input autoFocus type={type === 'number' ? 'number' : 'text'} step="0.1" value={val} onChange={(e) => setVal(e.target.value)} placeholder={inputPlaceholder} className={`w-full px-5 py-4 border ${c.border} rounded-2xl ${c.inputBg} ${c.ring} outline-none font-black text-lg text-center transition-all`} />
          </div>
        )}
        <div className={`px-8 pb-8 flex gap-4 ${c.panelBg} ${!requireInput ? 'pt-8' : ''}`}>
          <button onClick={onCancel} disabled={loading} className={`flex-1 px-6 py-4 border-2 ${c.borderLight} ${c.textMuted} rounded-2xl font-bold hover:${c.textMain} transition-transform active:scale-95`}>Volver</button>
          <button onClick={() => onConfirm(val)} disabled={loading || (requireInput && !val)} className={`flex-1 px-6 py-4 rounded-2xl font-black active:scale-95 transition-transform flex justify-center items-center gap-2 ${type === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white' : c.primaryBtn} disabled:opacity-50 shadow-lg`}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Procesando' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectorPagos({ total, c, onConfirmar }: any) {
  const [pagos, setPagos] = useState<any[]>([{ metodoPago: 'EFECTIVO', monto: total === 0 ? '' : total, numeroYape: '', ultimosDigitos: '', titular: '' }]);
  const [procesando, setProcesando] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState<number | null>(null);

  const totalPagado = pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const vuelto = totalPagado - total;
  const saldoPendiente = total - totalPagado;

  const agregarMetodo = () => setPagos((prev) => [...prev, { metodoPago: 'YAPE', monto: saldoPendiente > 0 ? saldoPendiente : '', numeroYape: '', ultimosDigitos: '', titular: '' }]);
  const quitarMetodo = (i: number) => setPagos((prev) => prev.filter((_, idx) => idx !== i));
  const actualizarPago = (i: number, campo: string, valor: string | number) => {
    setPagos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  };

  const handleConfirmar = async () => {
    if (saldoPendiente > 0.01) return sileo.error({ title: 'Falta Saldo', description: <span className="text-white">{`Faltan S/ ${saldoPendiente.toFixed(2)} por cubrir.`}</span> });
    setProcesando(true);
    try {
      const pagosLimpios = pagos.map(p => ({ ...p, monto: Number(p.monto) || 0 }));
      await onConfirmar(pagosLimpios);
    } 
    catch (err: any) { sileo.error({ title: 'Error de Cobro', description: <span className="text-white">{err.response?.data?.message || err.message}</span> }); } 
    finally { setProcesando(false); }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {pagos.map((pago, i) => (
          <div key={i} className={`p-4 md:p-5 rounded-[1.5rem] border ${c.borderLight} ${c.itemBg} space-y-4 shadow-sm`}>
            
            <div className="flex gap-2 items-center relative">
              <div className="relative flex-1 min-w-0">
                <button 
                  onClick={() => setDropdownAbierto(dropdownAbierto === i ? null : i)}
                  className={`flex items-center justify-between w-full px-4 py-3.5 ${c.panelBg} border ${c.border} rounded-xl text-sm font-black outline-none transition-colors hover:border-orange-500/50`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${METODOS_INFO[pago.metodoPago].bg} ${METODOS_INFO[pago.metodoPago].color}`}>
                      {METODOS_INFO[pago.metodoPago].icon}
                    </div>
                    <span className={c.textMain}>{METODOS_INFO[pago.metodoPago].label}</span>
                  </div>
                  <ChevronDown size={16} className={c.textMuted} />
                </button>

                {dropdownAbierto === i && (
                  <div className={`absolute top-full left-0 w-full mt-2 ${c.panelBg} border ${c.border} rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95`}>
                    {Object.entries(METODOS_INFO).map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => { actualizarPago(i, 'metodoPago', key); setDropdownAbierto(null); }}
                        className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm font-bold transition-all hover:bg-gray-800 ${c.textMain}`}
                      >
                        <div className={`p-1.5 rounded-lg ${info.bg} ${info.color}`}>{info.icon}</div>
                        {info.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative shrink-0">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${c.textMuted} font-bold`}>S/</span>
                <input 
                  type="number" min="0" step="0.10" value={pago.monto} 
                  onChange={(e) => actualizarPago(i, 'monto', e.target.value === '' ? '' : e.target.value)} 
                  className={`w-28 md:w-32 pl-8 pr-3 py-3.5 ${c.inputBg} border ${c.border} rounded-xl text-sm md:text-base font-black outline-none transition-colors focus:ring-2 focus:ring-[#FFC640]/50`} 
                />
              </div>
              {pagos.length > 1 && <button onClick={() => quitarMetodo(i)} aria-label="Quitar método de pago" className={`shrink-0 p-3.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-colors`}><X size={18} /></button>}
            </div>

            {(pago.metodoPago === 'YAPE' || pago.metodoPago === 'PLIN') && (
              <div className="relative animate-in fade-in slide-in-from-top-2">
                <Smartphone className={`absolute left-4 top-1/2 -translate-y-1/2 ${c.textMuted}`} size={16} />
                <input type="text" placeholder="Nro de Operación / Celular" value={pago.numeroYape || ''} onChange={(e) => actualizarPago(i, 'numeroYape', e.target.value)} className={`w-full min-w-0 pl-11 pr-4 py-3.5 text-xs md:text-sm font-bold border ${c.border} rounded-xl ${c.inputBg} outline-none focus:ring-2 focus:ring-[#FFC640]/50 transition-colors`} />
              </div>
            )}

            {pago.metodoPago === 'TARJETA' && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="relative w-32 md:w-40 shrink-0">
                  <CreditCard className={`absolute left-3 top-1/2 -translate-y-1/2 ${c.textMuted}`} size={16} />
                  <input type="text" placeholder="4 Dígitos" maxLength={4} value={pago.ultimosDigitos || ''} onChange={(e) => actualizarPago(i, 'ultimosDigitos', e.target.value.replace(/\D/g, ''))} className={`w-full min-w-0 pl-9 pr-2 py-3.5 text-xs md:text-sm font-bold border ${c.border} rounded-xl ${c.inputBg} outline-none focus:ring-2 focus:ring-[#FFC640]/50 transition-colors`} />
                </div>
                <input type="text" placeholder="Titular de la Tarjeta" value={pago.titular || ''} onChange={(e) => actualizarPago(i, 'titular', e.target.value)} className={`flex-1 min-w-0 px-4 py-3.5 text-xs md:text-sm font-bold border ${c.border} rounded-xl ${c.inputBg} outline-none focus:ring-2 focus:ring-[#FFC640]/50 transition-colors`} />
              </div>
            )}

          </div>
        ))}
        {pagos.length < 3 && <button onClick={agregarMetodo} className="w-full py-4 border-2 border-dashed border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-xl text-xs font-black tracking-widest uppercase transition-colors">+ Añadir Pago Dividido</button>}
      </div>

      <div className={`${c.panelBg} border ${c.border} rounded-2xl p-6 space-y-3 text-sm font-bold shadow-lg`}>
        <div className={`flex justify-between ${c.textMuted}`}><span>Total a cobrar</span><span>S/ {total.toFixed(2)}</span></div>
        <div className={`flex justify-between ${c.textMuted}`}><span>Monto recibido</span><span>S/ {totalPagado.toFixed(2)}</span></div>
        {vuelto > 0.01 && <div className="flex justify-between text-emerald-500 font-black pt-3 border-t border-emerald-500/20"><span className="uppercase tracking-widest text-[10px]">Vuelto a entregar</span><span className="text-xl">S/ {vuelto.toFixed(2)}</span></div>}
        {saldoPendiente > 0.01 && <div className="flex justify-between text-rose-500 font-black pt-3 border-t border-rose-500/20"><span className="uppercase tracking-widest text-[10px]">Monto Faltante</span><span className="text-xl">S/ {saldoPendiente.toFixed(2)}</span></div>}
      </div>

      <button onClick={handleConfirmar} disabled={procesando || saldoPendiente > 0.01} className={`w-full ${c.primaryBtn} disabled:opacity-50 py-5 rounded-2xl font-black text-base transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl`}>
        {procesando ? <Loader2 size={20} className="animate-spin" /> : <Banknote size={20} />}
        {procesando ? 'Procesando Transacción...' : `Cobrar S/ ${total.toFixed(2)}`}
      </button>
    </div>
  );
}

function ModalPago({ pedido, sesionId, empresa, c, theme, onClose, onPagado }: any) {
  const { user } = useAuthStore();
  const [exito, setExito] = useState(false);
  const [comprobante, setComprobante] = useState<DocumentoVenta | null>(null);
  const [tipoDoc, setTipoDoc] = useState<'NOTA_VENTA' | 'BOLETA' | 'FACTURA'>('NOTA_VENTA');
  const [numeroDocReceptor, setNumeroDocReceptor] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<any>({ isOpen: false });
  const [buscandoAPI, setBuscandoAPI] = useState(false);

  // Verificamos si es un pedido que viene pagado desde la web
  const isWeb = isWebOrder(pedido);

  useEffect(() => {
    if (tipoDoc === 'BOLETA' && numeroDocReceptor.length === 8) {
      buscarClienteExterno('BOLETA', numeroDocReceptor, setRazonSocial, setBuscandoAPI);
    } else if (tipoDoc === 'FACTURA' && numeroDocReceptor.length === 11) {
      buscarClienteExterno('FACTURA', numeroDocReceptor, setRazonSocial, setBuscandoAPI);
    }
  }, [numeroDocReceptor, tipoDoc]);

  // FLUJO NORMAL: Cobro Físico
  const handleConfirmarPago = async (pagos: PagoItem[]) => {
    try {
      await procesarPago(pedido.id, sesionId, pagos);
      setExito(true);
      const doc = await emitirDocumentoVenta({
        tipo: tipoDoc, pedidoId: pedido.id,
        tipoDocumentoReceptor: tipoDoc === 'FACTURA' ? 'RUC' : (tipoDoc === 'BOLETA' && numeroDocReceptor ? 'DNI' : undefined),
        numeroDocumentoReceptor: tipoDoc !== 'NOTA_VENTA' ? numeroDocReceptor : undefined,
        razonSocialReceptor: tipoDoc !== 'NOTA_VENTA' ? razonSocial : undefined
      });
      setComprobante(doc);
      sileo.success({ title: '¡Transacción Exitosa!' });
      imprimirTicketTermico(pedido, doc, empresa);
    } catch (err: any) { 
      sileo.error({ title: 'Atención', description: <span className="text-white">{`Cobro realizado, pero el comprobante falló: ${err.message}`}</span> }); 
    }
  };

  // FLUJO WEB: Solo emitir comprobante y despachar (Ya está pagado)
  const handleConfirmarWeb = async () => {
    setBuscandoAPI(true);
    try {
      const doc = await emitirDocumentoVenta({
        tipo: tipoDoc, pedidoId: pedido.id,
        tipoDocumentoReceptor: tipoDoc === 'FACTURA' ? 'RUC' : (tipoDoc === 'BOLETA' && numeroDocReceptor ? 'DNI' : undefined),
        numeroDocumentoReceptor: tipoDoc !== 'NOTA_VENTA' ? numeroDocReceptor : undefined,
        razonSocialReceptor: tipoDoc !== 'NOTA_VENTA' ? razonSocial : undefined
      });
      setComprobante(doc);
      
      // Lo marcamos como ENTREGADO para cerrar su ciclo y sacarlo de "Por Cobrar"
      await entregarPedido(pedido.id);
      
      setExito(true);
      sileo.success({ title: '¡Comprobante Emitido y Delivery Despachado!' });
      imprimirTicketTermico(pedido, doc, empresa);
    } catch (err: any) {
      sileo.error({ title: 'Atención', description: <span className="text-white">{`Ocurrió un error: ${err.response?.data?.message || err.message}`}</span> });
    } finally {
      setBuscandoAPI(false);
    }
  };

  const handleAnular = () => {
    if (!comprobante) return;
    setConfirmDialog({
      isOpen: true, title: 'Anular Comprobante', message: 'Ingresa el motivo exacto de la anulación para auditoría.', type: 'danger', requireInput: true, inputPlaceholder: 'Ej. Error en los datos del cliente', isProcessing: false, theme: theme,
      onConfirm: async (motivo: string) => {
        setConfirmDialog((p: any) => ({ ...p, loading: true }));
        try {
          setComprobante(await anularDocumentoVenta(comprobante.id, motivo.trim()));
          sileo.success({ title: 'Comprobante Anulado' });
        } catch (err: any) { sileo.error({ title: 'Error al anular', description: <span className="text-white">{err.message}</span> }); }
        finally { setConfirmDialog((p: any) => ({ ...p, isOpen: false, loading: false })); }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className={`${c.panelBg} rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border ${c.border}`}>
        
        <div className={`px-8 py-6 flex items-center justify-between border-b ${c.border} shrink-0 bg-gradient-to-r from-transparent to-black/5 dark:to-white/5`}>
          <div className="flex items-center gap-4">
            <div className="bg-[#FFC640]/20 text-[#FFC640] p-3 rounded-2xl">
              <Receipt size={24} />
            </div>
            <div>
              <h2 className={`${c.textMain} font-black text-2xl tracking-tight`}>
                {isWeb ? `Despachar Orden #${pedido.id}` : `Cobrar Orden #${pedido.id}`}
              </h2>
              <p className={`${c.textMuted} font-bold text-sm mt-0.5`}>{pedido.mesa || 'Para Llevar'} • {pedido.items.length} ítems</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar modal de pago" className={`${c.textMuted} hover:${c.textMain} bg-gray-500/10 hover:bg-rose-500/20 p-3 rounded-full active:scale-95 transition-all`}><X size={20} /></button>
        </div>

        {exito ? (
          <div className="p-10 text-center overflow-y-auto custom-scrollbar flex-1 flex flex-col items-center justify-center">
            <div className={`w-full max-w-md mx-auto ${c.itemBg} border ${c.border} p-10 rounded-[2rem] shadow-lg relative mt-8`}>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center shadow-inner border border-emerald-500/20 backdrop-blur-md">
                <CircleCheck size={48} className="text-emerald-500" />
              </div>
              <h3 className={`text-4xl font-black ${c.textMain} tracking-tight mt-6 mb-2`}>¡Completado!</h3>
              <p className={`text-sm font-bold ${c.textMuted} mb-8`}>La orden ha sido finalizada con éxito.</p>
              
              {comprobante && (
                <div className={`rounded-2xl border ${c.border} p-6 text-left ${comprobante.estadoEmision === 'ANULADO' ? 'opacity-50' : c.panelBg} shadow-sm mb-8`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-xs font-black uppercase tracking-widest ${c.textMuted}`}>{comprobante.tipo.replace('_', ' ')}</span>
                    {comprobante.estadoEmision === 'ANULADO' && <span className="text-[10px] font-black text-white bg-rose-500 px-3 py-1 rounded-lg uppercase tracking-widest">Anulada</span>}
                  </div>
                  <p className={`font-mono font-black ${c.textMain} text-2xl tracking-tight`}>{comprobante.serie}-{String(comprobante.correlativo).padStart(6, '0')}</p>
                  <p className={`text-xl font-black text-[#FFC640] mt-1`}>S/ {comprobante.total.toFixed(2)}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button onClick={() => imprimirTicketTermico(pedido, comprobante, empresa)} className={`w-full ${c.secondaryBtn} font-black py-4 rounded-xl text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 border ${c.border}`}>
                  <Printer size={18} /> Imprimir Ticket
                </button>
                {comprobante?.estadoEmision !== 'ANULADO' && puedeAnular(user?.rol) && (
                  <button onClick={handleAnular} className="w-full text-rose-500 hover:text-rose-400 bg-rose-500/10 font-bold py-4 rounded-xl text-sm flex justify-center items-center gap-2 transition-transform active:scale-95 border border-rose-500/20">
                    <Ban size={18} /> Anular Comprobante
                  </button>
                )}
                <button onClick={onPagado} className={`w-full ${c.primaryBtn} font-black py-4 rounded-xl text-sm transition-transform active:scale-95 mt-4`}>
                  Finalizar y Cerrar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            <div className={`w-full lg:w-5/12 flex flex-col border-b lg:border-b-0 lg:border-r ${c.borderLight} ${c.appBg}`}>
              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
                
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-widest ${c.textMuted} mb-4`}>Resumen de la Orden</h3>
                  <div className={`${c.panelBg} rounded-2xl p-5 space-y-3 max-h-48 overflow-y-auto border ${c.border} custom-scrollbar shadow-sm`}>
                    {pedido.items.map((item: any, i: number) => (
                      <div key={i} className={`flex justify-between items-start text-sm ${item.estadoItem === 'CANCELADO' ? 'opacity-40 line-through' : ''}`}>
                        <span className={`${c.textMain} font-bold pr-4`}><span className="text-[#FFC640] mr-1">{item.cantidad}x</span> {item.nombreProducto}</span>
                        <span className={`${c.textMuted} font-black whitespace-nowrap`}>S/ {item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className={`text-xs font-black uppercase tracking-widest ${c.textMuted} mb-4`}>Datos de Facturación</h3>
                  <div className="space-y-4">
                    <div className={`flex p-1.5 ${c.panelBg} rounded-xl border ${c.border} shadow-sm`}>
                      {(['NOTA_VENTA', 'BOLETA', 'FACTURA'] as const).map(t => {
                        const puedeFactura = user?.modulosHabilitados?.includes('FACTURACION');
                        if (t === 'FACTURA' && !puedeFactura) return null;
                        return (
                          <button key={t} onClick={() => setTipoDoc(t)} className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${tipoDoc === t ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                            {t === 'NOTA_VENTA' ? 'Nota' : t === 'BOLETA' ? 'Boleta' : 'Factura'}
                          </button>
                        );
                      })}
                    </div>

                    {tipoDoc !== 'NOTA_VENTA' && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 pt-2">
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder={tipoDoc === 'FACTURA' ? 'RUC (11 dígitos)' : 'DNI (Opcional - Máx 8)'} 
                            maxLength={tipoDoc === 'FACTURA' ? 11 : 8} 
                            value={numeroDocReceptor} 
                            onChange={e => setNumeroDocReceptor(e.target.value.replace(/\D/g, ''))} 
                            className={`w-full min-w-0 pl-5 pr-10 py-4 border ${c.border} rounded-xl text-sm font-bold focus:outline-none focus:ring-2 ${c.ring} ${c.panelBg} ${c.textMain} transition-colors shadow-sm`} 
                          />
                          {buscandoAPI && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#FFC640]" size={18} />}
                        </div>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Razón Social / Nombre Completo" 
                            value={razonSocial} 
                            onChange={e => setRazonSocial(e.target.value)} 
                            className={`w-full min-w-0 px-5 py-4 border ${c.border} rounded-xl text-sm font-bold focus:outline-none focus:ring-2 ${c.ring} ${c.panelBg} ${c.textMain} transition-colors shadow-sm`} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className={`w-full lg:w-7/12 flex flex-col ${c.panelBg}`}>
              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                {isWeb ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-10">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
                       <CircleCheck size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-emerald-500 tracking-tight">Pago Verificado</h3>
                    <p className={`text-sm font-bold ${c.textMuted} max-w-sm`}>
                       Este pedido fue pagado exitosamente en línea mediante Izipay. No requiere cobro físico en caja.
                    </p>
                    <div className={`w-full p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 mt-4 flex justify-between items-center shadow-inner`}>
                      <span className="text-xs font-black uppercase text-emerald-500 tracking-widest">Total Pagado:</span>
                      <span className="text-3xl font-black text-emerald-500">S/ {pedido.total.toFixed(2)}</span>
                    </div>
                    <button onClick={handleConfirmarWeb} disabled={buscandoAPI} className={`w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white mt-8 py-5 rounded-2xl font-black text-base transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl`}>
                      {buscandoAPI ? <Loader2 size={20} className="animate-spin" /> : <PackageSearch size={20} />}
                      {buscandoAPI ? 'Procesando...' : 'Emitir Comprobante y Despachar'}
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className={`text-xs font-black uppercase tracking-widest ${c.textMuted} mb-6`}>Configuración de Pago</h3>
                    <SelectorPagos total={pedido.total} c={c} onConfirmar={handleConfirmarPago} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <ModalConfirmacion {...confirmDialog} theme={theme} onCancel={() => setConfirmDialog((p: any) => ({ ...p, isOpen: false }))} />
    </div>
  );
}

function ModalSplitCuenta({ pedido, sesionId, empresa, c, onClose, onCambio }: any) {
  const { user } = useAuthStore();
  const [documentos, setDocumentos] = useState<DocumentoCobro[]>([]);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [montoLibre, setMontoLibre] = useState('');
  const [docPagandoId, setDocPagandoId] = useState<number | null>(null);
  const [tipoDocSplit, setTipoDocSplit] = useState<'NOTA_VENTA' | 'BOLETA' | 'FACTURA'>('NOTA_VENTA');
  const [rucSplit, setRucSplit] = useState('');
  const [razonSocialSplit, setRazonSocialSplit] = useState('');
  const [buscandoAPI, setBuscandoAPI] = useState(false);

  useEffect(() => {
    if (tipoDocSplit === 'BOLETA' && rucSplit.length === 8) {
      buscarClienteExterno('BOLETA', rucSplit, setRazonSocialSplit, setBuscandoAPI);
    } else if (tipoDocSplit === 'FACTURA' && rucSplit.length === 11) {
      buscarClienteExterno('FACTURA', rucSplit, setRazonSocialSplit, setBuscandoAPI);
    }
  }, [rucSplit, tipoDocSplit]);

  const cargar = useCallback(async () => setDocumentos(await listarDocumentosCobro(pedido.id)), [pedido.id]);
  useEffect(() => { cargar(); }, [cargar]);

  const itemsActivos = pedido.items.filter((i: any) => i.estadoItem !== 'CANCELADO');
  const idsAsignados = new Set(documentos.flatMap((d) => d.detalleIds));
  const itemsDisponibles = itemsActivos.filter((i: any) => !idsAsignados.has(i.detalleId));
  const totalAsignado = documentos.reduce((s, d) => s + d.total, 0);
  const totalPorAsignar = pedido.total - totalAsignado;
  const pedidoCompletado = documentos.filter((d) => d.estado === 'PAGADO').reduce((s, d) => s + d.total, 0) >= pedido.total - 0.01;

  const handleCrearPorItems = async () => {
    try {
      await crearDocumentoCobro(pedido.id, { tipo: 'ITEMS', detalleIds: seleccionados });
      setSeleccionados([]); await cargar();
      sileo.success({ title: 'División creada' });
    } catch (e: any) { sileo.error({ title: 'Error', description: <span className="text-white">{e.message}</span> }); }
  };

  const handleCrearPorMonto = async () => {
    const monto = parseFloat(montoLibre);
    if (monto > 0 && monto <= totalPorAsignar + 0.01) {
      try {
        await crearDocumentoCobro(pedido.id, { tipo: 'MONTO', monto });
        setMontoLibre(''); await cargar();
        sileo.success({ title: 'División creada' });
      } catch (e: any) { sileo.error({ title: 'Error', description: <span className="text-white">{e.message}</span> }); }
    }
  };

  const handlePagar = async (doc: DocumentoCobro, pagos: PagoItem[]) => {
    try {
      await pagarDocumentoCobro(doc.id, sesionId, pagos);
      const resDoc = await emitirDocumentoVenta({
        tipo: tipoDocSplit, documentoCobroId: doc.id,
        tipoDocumentoReceptor: tipoDocSplit === 'FACTURA' ? 'RUC' : (tipoDocSplit === 'BOLETA' && rucSplit ? 'DNI' : undefined),
        numeroDocumentoReceptor: tipoDocSplit !== 'NOTA_VENTA' ? rucSplit : undefined,
        razonSocialReceptor: tipoDocSplit !== 'NOTA_VENTA' ? razonSocialSplit : undefined
      }).catch(() => null);

      if (resDoc) imprimirTicketTermico(pedido, resDoc, empresa);
      
      sileo.success({ title: 'Parte cobrada exitosamente' });
      setDocPagandoId(null); await cargar(); await onCambio();
    } catch (e: any) { sileo.error({ title: 'Error', description: <span className="text-white">{e.response?.data?.message || e.message}</span> }); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className={`${c.panelBg} rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border ${c.border}`}>
        <div className={`border-b ${c.border} px-8 py-6 flex justify-between shrink-0 items-center`}>
          <div>
            <h2 className={`${c.textMain} font-black text-xl flex items-center gap-2`}><Split size={20} className="text-[#FFC640]"/> Dividir Cuenta</h2>
            <p className={`${c.textMuted} text-sm font-bold mt-1`}>Falta asignar: S/ {totalPorAsignar.toFixed(2)}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar modal de división" className={`${c.textMuted} hover:${c.textMain} bg-gray-500/10 p-2.5 rounded-full h-fit active:scale-95 transition-colors`}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {pedidoCompletado && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-3 text-emerald-500 text-sm font-black justify-center">
              <CircleCheck size={24} /> ¡Todas las partes pagadas!
            </div>
          )}

          {documentos.length > 0 && (
            <div className="space-y-4">
              <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Cuentas Divididas</p>
              {documentos.map((doc) => (
                <div key={doc.id} className={`border ${c.border} rounded-[1.5rem] p-5 ${c.cardBg} shadow-sm transition-all`}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className={`text-xs font-bold ${c.textMuted}`}>{doc.tipo === 'ITEMS' ? `${doc.detalleIds.length} ítem(s)` : 'Monto Fijo'}</p>
                      <p className={`text-2xl font-black text-[#FFC640] tracking-tight mt-0.5`}>S/ {doc.total.toFixed(2)}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg ${doc.estado === 'PAGADO' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                      {doc.estado}
                    </span>
                  </div>
                  
                  {doc.estado === 'PENDIENTE' && docPagandoId === doc.id && (
                    <div className={`mt-6 pt-6 border-t ${c.borderLight} animate-in fade-in`}>
                      <div className="mb-6 space-y-3">
                        <div className={`flex p-1.5 rounded-xl border ${c.border} ${c.appBg}`}>
                          {(['NOTA_VENTA', 'BOLETA', 'FACTURA'] as const).map(t => {
                            const puedeFactura = user?.modulosHabilitados?.includes('FACTURACION');
                            if (t === 'FACTURA' && !puedeFactura) return null;
                            return (
                              <button key={t} onClick={() => setTipoDocSplit(t)} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${tipoDocSplit === t ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                                {t === 'NOTA_VENTA' ? 'Nota' : t === 'BOLETA' ? 'Boleta' : 'Factura'}
                              </button>
                            );
                          })}
                        </div>
                        {tipoDocSplit !== 'NOTA_VENTA' && (
                          <div className="flex gap-2 relative">
                            <div className="relative w-1/3 min-w-0">
                              <input 
                                type="text" 
                                placeholder={tipoDocSplit === 'FACTURA' ? 'RUC (11)' : 'DNI (8)'} 
                                maxLength={tipoDocSplit === 'FACTURA' ? 11 : 8} 
                                value={rucSplit} 
                                onChange={e => setRucSplit(e.target.value.replace(/\D/g, ''))} 
                                className={`w-full px-4 py-3.5 border ${c.borderLight} rounded-xl text-xs font-bold focus:outline-none focus:ring-2 ${c.ring} ${c.inputBg}`} 
                              />
                              {buscandoAPI && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-amber-500" size={14} />}
                            </div>
                            <input type="text" placeholder="Razón Social / Nombre" value={razonSocialSplit} onChange={e => setRazonSocialSplit(e.target.value)} className={`w-2/3 min-w-0 px-4 py-3.5 border ${c.borderLight} rounded-xl text-xs font-bold focus:outline-none focus:ring-2 ${c.ring} ${c.inputBg}`} />
                          </div>
                        )}
                      </div>
                      <SelectorPagos total={doc.total} c={c} onConfirmar={(p: any) => handlePagar(doc, p)} />
                      <button onClick={() => setDocPagandoId(null)} className={`w-full mt-4 py-3 text-xs font-bold ${c.textMuted} hover:${c.textMain} transition-colors border border-gray-500/20 rounded-xl`}>Cancelar pago</button>
                    </div>
                  )}
                  {doc.estado === 'PENDIENTE' && docPagandoId !== doc.id && (
                    <button onClick={() => { setDocPagandoId(doc.id); setTipoDocSplit('NOTA_VENTA'); setRucSplit(''); setRazonSocialSplit(''); }} className={`mt-5 w-full ${c.secondaryBtn} border ${c.border} text-sm font-black py-3.5 rounded-xl transition-transform active:scale-95`}>
                      Cobrar esta parte
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!pedidoCompletado && (
            <div className={`${c.itemBg} p-6 rounded-[1.5rem] border ${c.border} space-y-6`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Nueva división</p>
              
              {itemsDisponibles.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {itemsDisponibles.map((i: any) => (
                      <label key={i.detalleId} className={`flex items-center gap-4 ${c.cardBg} p-4 rounded-xl border ${c.borderLight} cursor-pointer hover:border-[#FFC640]/50 transition-colors`}>
                        <input type="checkbox" checked={seleccionados.includes(i.detalleId)} onChange={() => setSeleccionados(p => p.includes(i.detalleId) ? p.filter(x => x !== i.detalleId) : [...p, i.detalleId])} className={`w-5 h-5 text-amber-500 rounded focus:ring-amber-500 ${c.appBg} border-${c.border}`} />
                        <span className={`flex-1 text-sm font-bold ${c.textMain}`}>{i.cantidad}x {i.nombreProducto}</span>
                        <span className={`font-black text-sm ${c.textMuted}`}>S/ {i.subtotal.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={handleCrearPorItems} disabled={seleccionados.length === 0} className={`w-full ${c.primaryBtn} disabled:opacity-50 text-sm font-black py-4 rounded-xl transition-transform active:scale-95`}>
                    Extraer {seleccionados.length} ítem(s)
                  </button>
                </div>
              )}
              
              <div className={`flex flex-col gap-3 pt-5 border-t ${c.borderLight}`}>
                <span className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>O extraer por monto (S/)</span>
                <div className="flex gap-2">
                  <input type="number" min="0" max={totalPorAsignar} step="0.10" value={montoLibre} onChange={(e) => setMontoLibre(e.target.value)} placeholder="0.00" className={`w-full min-w-0 px-4 py-3.5 border ${c.border} rounded-xl text-sm font-bold focus:outline-none focus:ring-2 ${c.ring} ${c.inputBg}`} />
                  <button onClick={handleCrearPorMonto} disabled={!montoLibre} className={`${c.primaryBtn} disabled:opacity-50 text-sm font-black px-6 rounded-xl active:scale-95 transition-transform`}>Extraer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HeaderCajero({ user, theme, changeTheme, logout, setVistaActiva, goToReservas }: any) {
  const navigate = useNavigate();

  const isAdmin = ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'].includes(user?.rol || '');

  const handleVolverRol = () => {
    if (user?.rol === 'ROLE_MOZO') navigate('/mozo');
    else if (user?.rol === 'ROLE_COCINA') navigate('/cocina');
    else navigate('/dashboard');
  };

  return (
    <header className={`border-b px-6 py-4 flex flex-col xl:flex-row items-center justify-between z-30 shrink-0 gap-4 ${theme === 'dark' ? 'bg-[#0a0a0a] border-gray-800/60' : 'bg-white border-gray-200'}`}>

      <div className="flex items-center gap-3 w-full xl:w-auto text-center xl:text-left">
        
        {isAdmin && (
          <button 
            onClick={handleVolverRol}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-2 font-bold text-sm ${theme === 'dark' ? 'bg-[#141414] text-gray-300 border-gray-800 hover:text-white' : 'bg-white text-gray-700 border-gray-200 hover:text-black'}`}
            title="Regresar a mi panel"
          >
            <ArrowLeft size={18} /> <span className="hidden sm:inline">Volver</span>
          </button>
        )}

        <div className="bg-[#FFC640] p-2.5 rounded-[12px] shadow-inner">
          <Receipt className="text-black w-5 h-5" strokeWidth={2.5} />
        </div>
        <div className="hidden sm:block">
          <h1 className={`text-xl font-black leading-none tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>La Ruta del Sabor</h1>
          <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Caja Registradora</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 w-full xl:w-auto justify-center xl:justify-end shrink-0">
        
        <button onClick={goToReservas} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-transform active:scale-95 shadow-sm border ${theme === 'dark' ? 'bg-[#141414] border-gray-800 text-gray-300 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:text-black'} mr-2`}>
          <CalendarDays size={18} /> <span className="hidden sm:inline">Reservas</span>
        </button>

        <button 
          onClick={() => setVistaActiva('VENTA_DIRECTA')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-transform active:scale-95 shadow-md shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white mr-2`}
        >
          <Store size={18} /> <span className="hidden sm:inline">Venta Rápida</span>
        </button>

        <button onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')} className={`p-2.5 rounded-xl border transition-colors ${theme === 'dark' ? 'bg-[#141414] text-gray-400 border-gray-800 hover:text-white' : 'bg-white text-gray-500 border-gray-200 hover:text-black'}`}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className={`hidden sm:block h-8 w-px mx-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}></div>

        <div className="flex items-center gap-3 text-right">
          <div className="hidden sm:block">
            <p className={`text-sm font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.nombre?.split(' ')[0] || user?.correo?.split('@')[0] || 'Cajero'}</p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{user?.rol || 'Rol Cajero'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FFC640] flex items-center justify-center text-black font-black text-lg shadow-inner">
            {(user?.nombre || user?.correo || 'C').charAt(0).toUpperCase()}
          </div>
        </div>

        <div className={`w-px h-8 mx-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
        
        <button onClick={logout} className={`p-2.5 rounded-xl transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-rose-500 hover:bg-rose-500/10' : 'text-gray-500 hover:text-rose-600 hover:bg-rose-50'}`} title="Cerrar Sesión">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}

export default function CajeroPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [theme, setTheme] = useState<ThemeKey>(() => (localStorage.getItem('pos_theme_bw') as ThemeKey) || 'dark');
  const changeTheme = (newTheme: ThemeKey) => { setTheme(newTheme); localStorage.setItem('pos_theme_bw', newTheme); };
  const c = THEMES[theme];

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [sesion, setSesion] = useState<SesionCaja | null>(null);
  const [pedidosEntregados, setPedidosEntregados] = useState<PedidoActivo[]>([]);
  const [historialHoy, setHistorialHoy] = useState<any[]>([]);
  const [resumenPagos, setResumenPagos] = useState<Record<string, number>>({});

  const [vistaActiva, setVistaActiva] = useState<'POR_COBRAR' | 'HISTORIAL' | 'ARQUEO' | 'VENTA_DIRECTA'>('POR_COBRAR');
  const [loading, setLoading] = useState(true);

  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<any>({ isOpen: false });

  const [pedidoACobrar, setPedidoACobrar] = useState<PedidoActivo | null>(null);
  const [pedidoSplit, setPedidoSplit] = useState<PedidoActivo | null>(null);
  const [operando, setOperando] = useState(false);

  const [productosDirectos, setProductosDirectos] = useState<Producto[]>([]);
  const [carritoDirecto, setCarritoDirecto] = useState<ItemPedidoLocal[]>([]);
  const [creandoVenta, setCreandoVenta] = useState(false);

  const [ticketZData, setTicketZData] = useState<any>(null);

  const getFechaLocalHoy = () => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
  };

  const cargarEstado = useCallback(async () => {
    try {
      const hoy = getFechaLocalHoy();
      const [empRes, cajaRes, pedidosRes, historialRes] = await Promise.allSettled([
        getMiEmpresa(),
        getCajaActiva(),
        getPedidosActivos(),
        getHistorialPedidos(hoy, hoy)
      ]);

      if (empRes.status === 'fulfilled') setEmpresa(empRes.value);

      let cajaActiva = null;
      if (cajaRes.status === 'fulfilled' && cajaRes.value) {
        cajaActiva = cajaRes.value;
        setSesion(cajaActiva);
        if (cajaActiva.estado === 'ABIERTA') {
          const resumen = await getResumenCaja().catch(() => ({}));
          setResumenPagos(resumen);
        }
      } else {
        setSesion(null);
      }
      
      let entregadosWeb: PedidoActivo[] = [];

      if (pedidosRes.status === 'fulfilled') {
        const activos = pedidosRes.value;
        
        // Excluimos los pedidos web que ya fueron despachados (ENTREGADO) de la pestaña "Por Cobrar"
        const porCobrar = activos.filter((p) => {
          const web = isWebOrder(p);
          if (web && p.estadoActual === 'ENTREGADO') return false; 
          return p.estadoActual === 'ENTREGADO' || p.estadoActual === 'LISTO' || p.estadoActual === 'RECIBIDO';
        });
        setPedidosEntregados(porCobrar);

        // Guardamos los pedidos web despachados para inyectarlos en el historial
        entregadosWeb = activos.filter((p) => isWebOrder(p) && p.estadoActual === 'ENTREGADO');
      }

      if (historialRes.status === 'fulfilled') {
        // Obtenemos el historial normal (Pagados o Cancelados) y le sumamos los "Entregados Web"
        const listaHistorial = historialRes.value.filter((p: any) => p.estadoActual === 'PAGADO' || p.estadoActual === 'CANCELADO');
        
        const historialCombinado = [...listaHistorial];
        entregadosWeb.forEach(ew => {
          if (!historialCombinado.some(h => h.id === ew.id)) {
            historialCombinado.push(ew);
          }
        });
        
        const comprobantes = await Promise.all(
          historialCombinado.map(p => listarPorPedido(p.id).catch(() => []))
        );
        
        const historialConDocs = historialCombinado.map((p, i) => ({
           ...p,
           documentosVenta: comprobantes[i] || []
        }));
        
        setHistorialHoy(historialConDocs.sort((a,b) => b.id - a.id));
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    getProductos()
      .then(res => {
        setProductosDirectos(res.filter(p => !p.esPreparado && p.estadoRegistro && p.estadoDisponibilidad === 'DISPONIBLE'));
      })
      .catch(() => {});
  }, []);

  useEffect(() => { cargarEstado(); }, [cargarEstado]);

useEffect(() => {
    const token = useAuthStore.getState().token;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
    const es = new EventSource(`${baseUrl}/api/kds/eventos?token=${token}`);
    
    es.addEventListener('PEDIDO_LISTO', () => cargarEstado());
    es.addEventListener('NUEVA_COMANDA', () => cargarEstado());
    return () => es.close();
  }, [cargarEstado]);

  const handleAccionCaja = (accion: 'ABRIR' | 'CERRAR') => {
    const monto = parseFloat(accion === 'ABRIR' ? montoApertura : montoCierre);
    if (isNaN(monto) || monto < 0) return sileo.error({ title: 'Monto inválido' });

    setConfirmDialog({
      isOpen: true, title: accion === 'ABRIR' ? 'Aperturar Turno' : 'Arqueo de Caja',
      message: accion === 'ABRIR' 
        ? `¿Confirmas la apertura con S/ ${monto.toFixed(2)}?` 
        : `Vas a declarar S/ ${monto.toFixed(2)} físicos en la caja. El sistema validará los descuadres.`,
      type: accion === 'ABRIR' ? 'warning' : 'danger', requireInput: false, isProcessing: false, theme: theme,
      onConfirm: async () => {
        setOperando(true);
        setConfirmDialog((p: any) => ({ ...p, loading: true }));
        try {
          if (accion === 'ABRIR') {
            await abrirCaja(monto);
            setMontoApertura(''); sileo.success({ title: '¡Turno Iniciado!' });
            await cargarEstado();
            setConfirmDialog((p: any) => ({ ...p, isOpen: false, loading: false }));
          } else {
            const resumenActual = { ...resumenPagos };
            const cerrada = await cerrarCaja(sesion!.id, monto);
            
            setMontoCierre(''); 
            setVistaActiva('POR_COBRAR');
            await cargarEstado();
            setConfirmDialog((p: any) => ({ ...p, isOpen: false, loading: false }));
            
            const totalEfectivo = resumenActual['EFECTIVO'] || 0;
            const esperado = cerrada.montoInicial + totalEfectivo;
            const finalDec = cerrada.montoFinalDeclarado || 0;
            const diferenciaRevisada = finalDec - esperado;
            
            setTicketZData({
               sesion: { ...cerrada, diferencia: diferenciaRevisada },
               resumen: resumenActual
            });
          }
        } catch (err: any) { 
          sileo.error({ title: 'Error', description: <span className="text-white">{err.response?.data?.message || err.message}</span> }); 
          setConfirmDialog((p: any) => ({ ...p, isOpen: false, loading: false }));
        } finally {
          setOperando(false);
        }
      }
    });
  };

  const agregarAlCarrito = (prod: Producto) => {
    setCarritoDirecto(prev => {
      const existe = prev.find(i => i.productoId === prod.id);
      if (existe) return prev.map(i => i.productoId === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { productoId: prod.id, nombre: prod.nombre, precio: prod.precioVenta, cantidad: 1, notas: '' }];
    });
  };

  const cambiarCantidadCarrito = (productoId: number, delta: number) => {
    setCarritoDirecto(prev => {
      return prev.map(i => i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i).filter(i => i.cantidad > 0);
    });
  };

  const procesarVentaDirecta = async () => {
    if (carritoDirecto.length === 0) return;
    setCreandoVenta(true);
    try {
      const nuevoPedido = await crearPedido({
        tipoConsumo: 'PARA_LLEVAR',
        mesa: 'Venta en Caja',
        notasGenerales: 'Venta rápida directa',
        items: carritoDirecto.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, notasPreparacion: '' }))
      });
      await confirmarPedido(nuevoPedido.id);
      
      setCarritoDirecto([]);
      await cargarEstado(); 
      setVistaActiva('POR_COBRAR');
      sileo.success({ title: 'Venta registrada, lista para cobro.' });

    } catch (err: any) {
      sileo.error({ title: 'Error', description: <span className="text-white">{err.response?.data?.message || err.message}</span> });
    } finally {
      setCreandoVenta(false);
    }
  };

  if (loading) return <div className={`flex h-screen items-center justify-center font-black ${c.appBg} ${c.textMuted}`}><Loader2 size={64} className="animate-spin" /></div>;

  const totalEfectivo = (resumenPagos['EFECTIVO'] || 0);
  const totalDigital = (resumenPagos['YAPE'] || 0) + (resumenPagos['PLIN'] || 0) + (resumenPagos['TARJETA'] || 0) + (resumenPagos['TRANSFERENCIA'] || 0);
  const granTotal = totalEfectivo + totalDigital;
  const totalCarrito = carritoDirecto.reduce((s, i) => s + i.precio * i.cantidad, 0);

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden transition-colors duration-300 ${c.appBg} relative`}>
      <HeaderCajero user={user} theme={theme} changeTheme={changeTheme} logout={() => { logout(); navigate('/login'); }} setVistaActiva={setVistaActiva} goToReservas={() => navigate('/reservas')} />

      <div className="flex-1 flex overflow-hidden">
        <aside className={`w-full md:w-96 lg:w-[420px] ${c.panelBg} border-r ${c.border} flex flex-col shrink-0 overflow-y-auto custom-scrollbar shadow-2xl z-20`}>
          <div className="p-10 space-y-8">
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${c.textMuted} mb-3`}>Estado de Caja</p>
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner transition-colors ${!sesion || sesion.estado === 'CERRADA' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                {!sesion || sesion.estado === 'CERRADA' ? <Lock size={48} /> : <Unlock size={48} />}
              </div>
              <h2 className={`text-5xl font-black tracking-tight ${c.textMain} mb-2`}>
                {!sesion || sesion.estado === 'CERRADA' ? 'Cerrado' : 'Abierto'}
              </h2>
              {sesion?.estado === 'ABIERTA' && (
                <div className="mt-6 space-y-4 animate-in fade-in">
                  <div className={`p-5 rounded-[1.5rem] border ${c.borderLight} ${c.itemBg} shadow-sm`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Aperturado el</p>
                    <p className={`font-black text-sm ${c.textMain}`}>{formatearFechaHoraPeru(sesion.fechaApertura)}</p>
                  </div>
                  <div className={`p-5 rounded-[1.5rem] border ${c.borderLight} ${c.itemBg} shadow-sm flex items-center justify-between`}>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Fondo de Inicio</p>
                      <p className={`font-black text-3xl tracking-tight ${c.textMain}`}>S/ {sesion.montoInicial.toFixed(2)}</p>
                    </div>
                    <Banknote size={32} className={c.textMuted} />
                  </div>
                </div>
              )}
            </div>

            <div className={`pt-8 border-t ${c.borderLight}`}>
              {!sesion || sesion.estado === 'CERRADA' ? (
                <div className="space-y-4">
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-2 block`}>Fondo Base para dar Vuelto (S/)</label>
                    <div className="relative">
                      <span className={`absolute left-5 top-1/2 -translate-y-1/2 text-sm ${c.textMuted}`}>S/</span>
                      <input type="number" min="0" step="0.5" value={montoApertura} onChange={e => setMontoApertura(e.target.value)} className={`w-full min-w-0 pl-12 pr-5 py-5 ${c.inputBg} border-2 ${c.border} rounded-2xl text-xl font-black focus:outline-none focus:border-[#FFC640] focus:ring-4 focus:ring-[#FFC640]/20 transition-all`} placeholder="0.00" />
                    </div>
                  </div>
                  <button onClick={() => handleAccionCaja('ABRIR')} disabled={!montoApertura || operando} className={`w-full ${c.primaryBtn} disabled:opacity-50 py-5 rounded-2xl font-black text-base transition-transform active:scale-95 flex justify-center items-center gap-2`}>
                    Comenzar Turno <ArrowRightCircle size={20} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-2 block`}>Dinero Físico en Caja Registradora (S/)</label>
                    <div className="relative">
                      <span className={`absolute left-5 top-1/2 -translate-y-1/2 text-sm ${c.textMuted}`}>S/</span>
                      <input type="number" min="0" step="0.5" value={montoCierre} onChange={e => setMontoCierre(e.target.value)} className={`w-full min-w-0 pl-12 pr-5 py-5 ${c.inputBg} border-2 ${c.border} rounded-2xl text-xl font-black focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all`} placeholder="0.00" />
                    </div>
                  </div>
                  <button onClick={() => handleAccionCaja('CERRAR')} disabled={!montoCierre || operando} className="w-full bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50 py-5 rounded-2xl font-black text-base transition-transform active:scale-95 shadow-xl shadow-rose-500/20 flex justify-center items-center gap-2">
                    <Lock size={20} /> Ejecutar Cierre
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className={`flex-1 flex flex-col relative overflow-hidden ${c.appBg}`}>
          {(!sesion || sesion.estado === 'CERRADA') ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className={`w-40 h-40 rounded-full flex items-center justify-center bg-rose-500/5 mb-8 border-2 border-dashed border-rose-500/20`}>
                <AlertTriangle size={64} className="text-rose-500 opacity-80" />
              </div>
              <h2 className={`text-5xl font-black tracking-tight ${c.textMain} mb-4`}>Terminal Inactiva</h2>
              <p className={`text-xl font-medium ${c.textMuted} max-w-lg`}>Debes aperturar la caja indicando el fondo base para poder visualizar y gestionar las transacciones.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className={`px-10 pt-10 pb-6 flex items-center justify-between shrink-0`}>
                <div className={`flex p-2 ${c.panelBg} rounded-2xl border ${c.border} shadow-sm`}>
                  <button onClick={() => setVistaActiva('POR_COBRAR')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${vistaActiva === 'POR_COBRAR' ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                    <FileText size={18} /> Por Cobrar 
                    {pedidosEntregados.length > 0 && <span className="ml-2 bg-rose-500 text-white text-[10px] px-2.5 py-0.5 rounded-md">{pedidosEntregados.length}</span>}
                  </button>
                  <button onClick={() => setVistaActiva('HISTORIAL')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${vistaActiva === 'HISTORIAL' ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                    <History size={18} /> Comprobantes
                  </button>
                  <button onClick={() => setVistaActiva('ARQUEO')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${vistaActiva === 'ARQUEO' ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                    <PieChart size={18} /> Arqueo
                  </button>
                </div>
                <button onClick={cargarEstado} className={`${c.secondaryBtn} border ${c.border} px-6 py-3 rounded-2xl text-xs font-black transition-transform active:scale-95 uppercase tracking-widest flex items-center gap-2`}>
                  <TrendingUp size={16} /> Refrescar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar">
                
                {vistaActiva === 'POR_COBRAR' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 animate-in fade-in">
                    {pedidosEntregados.map((pedido) => {
                      return (
                        <div key={pedido.id} className={`${c.cardBg} rounded-[2.5rem] border ${c.border} p-8 shadow-sm hover:shadow-2xl transition-all flex flex-col group`}>
                          <div className={`flex justify-between items-start mb-6 border-b ${c.borderLight} pb-6`}>
                            <div>
                              <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>ORD-{pedido.id.toString().padStart(3,'0')}</p>
                              <h3 className={`text-3xl font-black tracking-tight mt-1.5 ${c.textMain}`}>{pedido.mesa || 'Llevar'}</h3>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider`}>
                                {pedido.estadoActual === 'RECIBIDO' ? 'Recibido' : pedido.estadoActual === 'EN_PREPARACION' ? 'Preparando' : 'Listo'}
                              </span>
                              {!isWebOrder(pedido) && (
                                <button onClick={() => setPedidoSplit(pedido)} className={`text-xs font-bold ${c.textMuted} hover:text-[#FFC640] transition-colors flex items-center gap-1 mt-2`}>
                                  <Split size={14}/> Dividir
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1 max-h-48 overflow-y-auto space-y-3 mb-6 custom-scrollbar pr-3">
                            {pedido.items.map((i) => (
                              <div key={i.detalleId} className={`flex justify-between text-sm font-medium ${c.textMuted} items-start ${c.itemBg} border ${c.borderLight} p-3 rounded-xl`}>
                                <span className="pr-2 leading-tight">
                                  <span className={`font-black ${c.textMain} mr-2`}>{i.cantidad}x</span> {i.nombreProducto}
                                </span>
                                <span className={`font-black ${c.textMain} whitespace-nowrap`}>S/{i.subtotal.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className={`mt-auto pt-6 border-t ${c.borderLight}`}>
                            <div className="flex items-end justify-between mb-6">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Monto a Cobrar</span>
                              <span className="text-4xl font-black text-[#FFC640] tracking-tight leading-none">S/ {pedido.total.toFixed(2)}</span>
                            </div>
                            {isWebOrder(pedido) ? (
                              <button onClick={() => setPedidoACobrar(pedido)} className={`w-full bg-blue-500 hover:bg-blue-600 text-white text-base font-black py-5 rounded-2xl transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2`}>
                                <PackageSearch size={20} /> Despachar Delivery
                              </button>
                            ) : (
                              <button onClick={() => setPedidoACobrar(pedido)} className={`w-full ${c.primaryBtn} text-base font-black py-5 rounded-2xl transition-transform active:scale-95 shadow-lg`}>
                                Procesar Pago
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {pedidosEntregados.length === 0 && (
                      <div className={`col-span-full py-32 flex flex-col items-center justify-center ${c.cardBg} rounded-[3rem] border-2 border-dashed ${c.border} opacity-70`}>
                        <CircleCheck size={80} className={`${c.textMuted} mb-6 opacity-30`} />
                        <p className={`font-black text-4xl tracking-tight ${c.textMain}`}>Caja limpia</p>
                        <p className={`text-lg font-bold mt-3 ${c.textMuted}`}>No hay pedidos listos para cobrar.</p>
                      </div>
                    )}
                  </div>
                )}

                {vistaActiva === 'HISTORIAL' && (
                  <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in">
                    {historialHoy.length === 0 ? (
                      <div className={`text-center py-20 ${c.textMuted}`}><History size={56} className="mx-auto mb-5 opacity-30" /><p className="font-bold text-lg">No hay transacciones registradas hoy</p></div>
                    ) : (
                      historialHoy.map(p => (
                        <div key={p.id} className={`${c.cardBg} border ${c.border} rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow`}>
                          <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center font-black text-xl border ${p.estadoActual === 'PAGADO' || p.estadoActual === 'ENTREGADO' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                              #{p.id}
                            </div>
                            <div>
                              <h3 className={`font-black text-2xl tracking-tight ${c.textMain}`}>{p.mesa || 'Para Llevar'}</h3>
                              <p className={`text-xs font-bold ${c.textMuted} mt-1`}>{formatearFechaHoraPeru(p.fechaCreacion)}</p>
                              <div className="flex gap-2 mt-3">
                                {p.documentosVenta?.map((doc: any) => (
                                  <span key={doc.id} className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${doc.tipo === 'FACTURA' ? 'border-purple-500/30 text-purple-500 bg-purple-500/10' : doc.tipo === 'BOLETA' ? 'border-blue-500/30 text-blue-500 bg-blue-500/10' : 'border-gray-500/30 text-gray-400 bg-gray-500/10'}`}>
                                    {doc.tipo.replace('_', ' ')}: {doc.serie}-{doc.correlativo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className={`flex items-center gap-8 border-t md:border-t-0 md:border-l ${c.borderLight} pt-4 md:pt-0 md:pl-8`}>
                            <div className="text-right">
                              <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Total</p>
                              <p className={`text-2xl font-black ${c.textMain}`}>S/ {p.total.toFixed(2)}</p>
                            </div>
                            <button onClick={() => imprimirTicketTermico(p, p.documentosVenta?.[0] || null, empresa)} className={`${c.secondaryBtn} border ${c.border} p-4 rounded-2xl hover:text-[#FFC640] hover:border-[#FFC640]/50 transition-all shadow-sm`} title="Imprimir Ticket">
                              <Printer size={24} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {vistaActiva === 'ARQUEO' && (
                  <div className="max-w-5xl mx-auto animate-in fade-in">
                    <h3 className={`text-2xl font-black ${c.textMain} mb-8 tracking-tight`}>Resumen de Operaciones del Turno</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className={`${c.panelBg} rounded-[2rem] border ${c.border} p-8 shadow-sm flex items-center gap-6`}>
                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                          <Banknote size={32} />
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Total Efectivo Físico</p>
                          <p className={`text-4xl font-black ${c.textMain} tracking-tight`}>S/ {totalEfectivo.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className={`${c.panelBg} rounded-[2rem] border ${c.border} p-8 shadow-sm flex items-center gap-6`}>
                        <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                          <TrendingUp size={32} />
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Total Cobros Digitales</p>
                          <p className={`text-4xl font-black ${c.textMain} tracking-tight`}>S/ {totalDigital.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="md:col-span-2 grid grid-cols-3 gap-6">
                        <div className={`${c.itemBg} rounded-[1.5rem] border ${c.borderLight} p-6 text-center shadow-sm`}>
                          <div className="flex justify-center mb-2"><Smartphone size={20} className="text-purple-500"/></div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Yape</p>
                          <p className={`text-2xl font-black ${c.textMain}`}>S/ {(resumenPagos['YAPE'] || 0).toFixed(2)}</p>
                        </div>
                        <div className={`${c.itemBg} rounded-[1.5rem] border ${c.borderLight} p-6 text-center shadow-sm`}>
                          <div className="flex justify-center mb-2"><Smartphone size={20} className="text-sky-500"/></div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Plin</p>
                          <p className={`text-2xl font-black ${c.textMain}`}>S/ {(resumenPagos['PLIN'] || 0).toFixed(2)}</p>
                        </div>
                        <div className={`${c.itemBg} rounded-[1.5rem] border ${c.borderLight} p-6 text-center shadow-sm`}>
                          <div className="flex justify-center mb-2"><CreditCard size={20} className="text-blue-500"/></div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Tarjetas</p>
                          <p className={`text-2xl font-black ${c.textMain}`}>S/ {(resumenPagos['TARJETA'] || 0).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className={`md:col-span-2 bg-[#0a0a0a] rounded-[2rem] p-10 shadow-xl flex items-center justify-between border border-gray-800`}>
                        <div>
                          <p className={`text-sm font-black uppercase tracking-widest text-gray-400 mb-2`}>Ingresos Globales del Turno</p>
                          <p className={`text-6xl font-black text-[#FFC640] tracking-tight`}>S/ {granTotal.toFixed(2)}</p>
                        </div>
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-gray-800">
                          <PieChart size={48} className="text-[#FFC640]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {vistaActiva === 'VENTA_DIRECTA' && (
                  <div className="flex flex-col lg:flex-row gap-6 h-full animate-in fade-in">
                    
                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                      <div className="flex items-center gap-3 mb-6">
                        <PackageSearch size={24} className={c.textMain} />
                        <h2 className={`text-2xl font-black tracking-tight ${c.textMain}`}>Productos Directos</h2>
                      </div>
                      
                      {productosDirectos.length === 0 ? (
                        <div className={`text-center py-20 border-2 border-dashed ${c.borderLight} rounded-3xl`}>
                          <p className={`font-bold ${c.textMuted}`}>No hay productos directos disponibles para venta rápida.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                          {productosDirectos.map(prod => {
                            return (
                              <div 
                                key={prod.id} 
                                onClick={() => agregarAlCarrito(prod)} 
                                className={`${c.cardBg} border ${c.borderLight} p-5 rounded-3xl cursor-pointer hover:border-orange-500 hover:shadow-lg active:scale-95 transition-all flex flex-col justify-between h-32 relative overflow-hidden group`}
                              >
                                <div>
                                  <p className={`font-black text-[15px] leading-tight ${c.textMain} group-hover:text-orange-500 transition-colors`}>{prod.nombre}</p>
                                </div>
                                <div className="flex justify-between items-end">
                                  <p className={`font-black text-sm text-[#FFC640]`}>S/ {prod.precioVenta.toFixed(2)}</p>
                                  <span className={`w-8 h-8 flex items-center justify-center ${c.itemBg} text-gray-400 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors`}>
                                    <Plus size={16}/>
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className={`w-full lg:w-96 ${c.cardBg} border ${c.border} rounded-[2rem] flex flex-col shadow-lg overflow-hidden shrink-0 h-[600px]`}>
                      <div className={`p-6 border-b ${c.borderLight} shrink-0`}>
                        <h3 className={`font-black text-lg ${c.textMain}`}>Resumen de Venta</h3>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${c.textMuted}`}>Cliente para llevar</p>
                      </div>

                      <div className={`flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar`}>
                        {carritoDirecto.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                            <Store size={48} className={`mb-4 ${c.textMuted}`} strokeWidth={1} />
                            <p className={`font-bold ${c.textMuted}`}>Agrega productos para cobrar.</p>
                          </div>
                        ) : (
                          carritoDirecto.map((i: any) => (
                            <div key={i.productoId} className={`flex items-center justify-between gap-3 ${c.itemBg} p-3.5 rounded-2xl border ${c.borderLight} shadow-sm`}>
                              
                              <div className="flex-1 min-w-0">
                                <p className={`font-black text-sm ${c.textMain} truncate leading-tight`}>{i.nombre}</p>
                                <p className={`font-black text-xs mt-1 text-[#FFC640]`}>S/ {(i.precio * i.cantidad).toFixed(2)}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className={`flex items-center ${c.panelBg} rounded-xl border ${c.border} overflow-hidden shadow-inner`}>
                                  <button onClick={() => cambiarCantidadCarrito(i.productoId, -1)} className={`${c.textMuted} hover:text-red-500 px-2 py-1.5 transition-colors`}><Minus size={14} strokeWidth={3}/></button>
                                  <span className={`font-black text-xs ${c.textMain} px-2`}>{i.cantidad}</span>
                                  <button onClick={() => cambiarCantidadCarrito(i.productoId, 1)} className={`${c.textMuted} hover:text-orange-500 px-2 py-1.5 transition-colors`}><Plus size={14} strokeWidth={3}/></button>
                                </div>

                                <button 
                                  onClick={() => setCarritoDirecto(prev => prev.filter(item => item.productoId !== i.productoId))} 
                                  className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-colors"
                                  title="Eliminar producto"
                                >
                                  <X size={16} strokeWidth={3} />
                                </button>
                              </div>

                            </div>
                          ))
                        )}
                      </div>

                      <div className={`p-6 border-t ${c.borderLight} shrink-0 ${c.itemBg}`}>
                        <div className="flex justify-between items-center mb-5">
                          <span className={`text-xs font-black uppercase tracking-widest ${c.textMuted}`}>Total Venta</span>
                          <span className={`text-3xl font-black text-[#FFC640]`}>S/ {totalCarrito.toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={procesarVentaDirecta} 
                          disabled={creandoVenta || carritoDirecto.length === 0} 
                          className={`w-full ${c.primaryBtn} py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50`}
                        >
                          {creandoVenta ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                          Crear e Ir a Cobrar
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            </div>
          )}
        </main>
      </div>

      <ModalConfirmacion {...confirmDialog} theme={theme} onCancel={() => setConfirmDialog((p: any) => ({ ...p, isOpen: false }))} />
      
      {pedidoACobrar && sesion && <ModalPago pedido={pedidoACobrar} sesionId={sesion.id} empresa={empresa} c={c} theme={theme} onClose={() => setPedidoACobrar(null)} onPagado={() => { setPedidoACobrar(null); cargarEstado(); }} />}
      {pedidoSplit && sesion && <ModalSplitCuenta pedido={pedidoSplit} sesionId={sesion.id} empresa={empresa} c={c} onClose={() => setPedidoSplit(null)} onCambio={cargarEstado} />}

      {/* MODAL DE CIERRE Z EXITOSO */}
      {ticketZData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4 animate-in fade-in duration-200">
          <div className={`${c.panelBg} border ${c.border} rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border ${ticketZData.sesion.diferencia < 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
              <Lock size={48} />
            </div>
            <h2 className={`font-black text-3xl tracking-tight mb-2 ${c.textMain}`}>Caja Cerrada</h2>
            <p className={`text-sm font-bold ${c.textMuted} mb-6`}>Turno finalizado exitosamente.</p>
            
            <div className={`rounded-xl p-4 mb-8 text-left border ${ticketZData.sesion.diferencia < 0 ? 'bg-rose-500/10 border-rose-500/20' : ticketZData.sesion.diferencia > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${ticketZData.sesion.diferencia < 0 ? 'text-rose-500' : ticketZData.sesion.diferencia > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {ticketZData.sesion.diferencia < 0 ? 'Faltante en Caja' : ticketZData.sesion.diferencia > 0 ? 'Sobrante en Caja' : 'Cuadre Exacto'}
              </p>
              <p className={`text-2xl font-black ${c.textMain}`}>
  S/ {ticketZData.sesion.diferencia === 0 
        ? ticketZData.sesion.montoFinalDeclarado.toFixed(2) 
        : Math.abs(ticketZData.sesion.diferencia).toFixed(2)}
</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => imprimirTicketCierreZ(ticketZData.sesion, ticketZData.resumen, empresa, user)} 
                className={`w-full ${c.primaryBtn} py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all`}
              >
                <Printer size={18} /> Imprimir Reporte Z
              </button>
              <button 
                onClick={() => setTicketZData(null)} 
                className={`w-full ${c.secondaryBtn} py-4 rounded-xl font-black text-sm active:scale-95 transition-all`}
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}