import { useEffect, useState } from 'react';
import { ArrowUpRight, Clock, Mail } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import facebookImg from '@/assets/facebook.png';
import instagramImg from '@/assets/Instagram.png';
import telefonoImg from '@/assets/Telefono.png';
import whatsapp from '@/assets/whatsapp.png';
import { getPublicConfig, getPublicSedes } from '@/api/public';

const formatTime12h = (time24: string) => {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  const hours = parseInt(h, 10);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${m} ${suffix}`;
};

export const Footer = () => {
  const navigate = useNavigate();
  const { alias } = useParams();
  const [config, setConfig] = useState<any>({});
  const [sedes, setSedes] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [horariosList, setHorariosList] = useState<any[]>([]);

  const baseUrl = alias ? `/${alias}` : '/ruta-del-sabor';

  useEffect(() => {
    getPublicConfig().then((data: any) => {
      if (data) {
        setConfig(data);
        try {
          const parsed = JSON.parse(data.horarioAtencion || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHorariosList(parsed);
          } else {
            throw new Error();
          }
        } catch (e) {
          const parts = (data.horarioAtencion || 'Lun - Dom|18:00|23:30').split('|');
          setHorariosList([{ dias: parts[0], apertura: parts[1], cierre: parts[2] }]);
        }
      }
    }).catch(() => {});
    
    getPublicSedes().then((data: any[]) => {
      if (data) setSedes(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (horariosList.length === 0) return;
    
    const checkOpenStatus = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      let currentlyOpen = false;

      for (const h of horariosList) {
        if (!h.apertura || !h.cierre) continue;
        const [openH, openM] = h.apertura.split(':').map(Number);
        const [closeH, closeM] = h.cierre.split(':').map(Number);
        
        const openMinutes = openH * 60 + openM;
        const closeMinutes = closeH * 60 + closeM;

        if (closeMinutes < openMinutes) { 
          if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) currentlyOpen = true;
        } else { 
          if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) currentlyOpen = true;
        }
      }
      setIsOpen(currentlyOpen);
    };

    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000); 
    return () => clearInterval(interval);
  }, [horariosList]);

  const handleGoToMenu = () => {
    const menuSection = document.getElementById('menu-section');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`${baseUrl}/menu`);
    }
  };

  const phone = config.telefonoPedidos || '+51 989 451 473';
  const wapp = config.whatsapp || '+51989451473';
  const wappClean = wapp.replace(/\D/g, '');
  const email = config.correoContacto || 'hola@rutadelsabor.com';
  const fbUrl = config.facebookUrl || 'https://facebook.com';
  const igUrl = config.instagramUrl || 'https://instagram.com';

  return (
    <footer className="bg-[#0a0a0a] text-white pt-20 lg:pt-28 px-6 lg:px-12 pb-12 border-t border-white/5 relative overflow-hidden font-sans">
      
      {/* LUZ DE FONDO */}
      <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-t from-orange-600/20 to-transparent blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* === BENTO CTA === */}
        <div className="flex flex-col lg:flex-row gap-4 lg:h-64 mb-4">
          <div className="flex-1 flex items-center justify-center lg:justify-start bg-[#111] rounded-[2rem] px-8 py-12 lg:py-0 border border-white/5 shadow-2xl overflow-hidden">
            {config.bentoCtaTipoCaja1 === 'IMAGEN' && config.bentoCtaImagenCaja1 ? (
              <img src={config.bentoCtaImagenCaja1} alt="Logo" className="max-h-32 lg:max-h-40 object-contain" />
            ) : (
              <h2 style={{ fontSize: `calc(13vw * ${config.bentoCtaEscalaCaja1 || 1})` }} className="leading-none font-display font-black uppercase tracking-tighter text-white select-none">
                {config.bentoCtaTextoCaja1 || 'LA'}
              </h2>
            )}
          </div>
          <div className="w-full lg:w-[42%] h-64 lg:h-full rounded-[2rem] overflow-hidden relative group shadow-2xl border border-white/5 bg-[#111]">
            <img src={config.bentoCtaImagenTop || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200'} alt="Promo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <span className="text-orange-500 text-[10px] font-black tracking-widest uppercase block mb-1">
                {config.bentoCtaEtiquetaTop || '100% ARTESANAL'}
              </span>
              <p className="text-white font-bold text-xl md:text-2xl drop-shadow-md">
                {config.bentoCtaTituloTop || 'El verdadero sabor al carbón.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-4 lg:h-[22rem] mb-32">
          <div onClick={handleGoToMenu} className="w-full lg:w-[35%] bg-orange-500 p-10 rounded-[2rem] flex flex-col justify-between group cursor-pointer hover:bg-orange-400 transition-colors duration-300 shadow-2xl relative overflow-hidden">
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[#0a0a0a]">Ir a la carta</span>
            <div className="text-4xl lg:text-5xl font-display font-black flex items-end justify-between leading-none text-[#0a0a0a]">
              <span>PIDE<br/>AHORA</span> 
              <div className="w-14 h-14 rounded-full bg-[#0a0a0a]/10 flex items-center justify-center group-hover:bg-[#0a0a0a] group-hover:text-orange-500 transition-colors">
                <ArrowUpRight size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"/>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-[#111] rounded-[2rem] px-6 py-12 lg:py-0 border border-white/5 overflow-hidden shadow-2xl">
            <h2 style={{ fontSize: `calc(7.5vw * ${config.bentoCtaEscalaCaja2 || 1})` }} className="leading-none font-display font-black uppercase tracking-tighter text-white select-none text-center break-words">
              {config.bentoCtaTextoCaja2 || 'TIENDA ROJAS'}
            </h2>
          </div>
        </div>

        {/* === DISEÑO LIMPIO INFERIOR === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
          
          {/* COLUMNA 1: Contacto y Pedidos */}
          <div className="flex flex-col items-center text-center gap-8">
            <h3 className="text-orange-500 font-black tracking-[0.2em] text-[11px] uppercase font-display">Contacto & Pedidos</h3>
            <div className="flex flex-col items-center gap-8 w-full">
              
              <a href={`tel:${phone}`} className="flex flex-col items-center gap-2 group transition-opacity hover:opacity-80">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg mb-1">
                  <img src={telefonoImg} alt="Telf" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <p className="font-bold text-base text-white">{phone}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">Llamar ahora</p>
                </div>
              </a>

              <a href={`mailto:${email}`} className="flex flex-col items-center gap-2 group transition-opacity hover:opacity-80">
                <Mail size={26} className="text-white mb-1" strokeWidth={1.5} />
                <div>
                  <p className="font-bold text-sm text-white">{email}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">Escríbenos</p>
                </div>
              </a>

              <a href={`https://wa.me/${wappClean}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#111] border border-white/10 text-white font-bold text-xs hover:bg-[#25D366] hover:border-[#25D366] hover:text-black transition-all duration-300 shadow-md">
                <img src={whatsapp} alt="WhatsApp" className="w-4 h-4 object-contain" />
                Pedir por WhatsApp
              </a>
            </div>
          </div>
                      
          {/* COLUMNA 2: Sedes */}
          <div className="flex flex-col items-center text-center gap-8">
            <h3 className="text-orange-500 font-black tracking-[0.2em] text-[11px] uppercase font-display">Nuestras Sedes</h3>
            <div className="flex flex-col items-center gap-6 w-full">
              {sedes.length > 0 ? (
                sedes.map((sede) => (
                  <a key={sede.id} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${sede.direccion}, Perú`)}`} target="_blank" rel="noreferrer" className="group/sede flex flex-col items-center transition-opacity hover:opacity-80">
                    <p className="text-white font-bold text-[15px] mb-1">{sede.nombre}</p>
                    <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">{sede.direccion}</p>
                  </a>
                ))
              ) : (
                <div className="text-gray-500 text-sm">Consultando sedes...</div>
              )}
            </div>
          </div>

          {/* COLUMNA 3: Horarios Multiples y Redes */}
          <div className="flex flex-col items-center text-center gap-8">
            <h3 className="text-orange-500 font-black tracking-[0.2em] text-[11px] uppercase font-display">Horarios & Redes</h3>
            
            <div className="flex flex-col items-center gap-4">
              <Clock size={32} className="text-orange-500" strokeWidth={1.5} />
              
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isOpen ? 'text-white' : 'text-gray-400'}`}>
                    {isOpen ? 'Abierto Ahora' : 'Cerrado Ahora'}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  {horariosList.map((h, i) => (
                    <p key={i} className="text-[13px] font-medium text-gray-300">
                      <span className="text-white font-bold">{h.dias}:</span> {formatTime12h(h.apertura)} - {formatTime12h(h.cierre)}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Síguenos</p>
              <div className="flex items-center justify-center gap-6">
                <a href={igUrl} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform">
                  <img src={instagramImg} alt="Instagram" className="w-8 h-8 object-contain" />
                </a>
                <a href={fbUrl} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform">
                  <img src={facebookImg} alt="Facebook" className="w-8 h-8 object-contain filter brightness-0 invert" />
                </a>
                <a href={`https://wa.me/${wappClean}`} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform">
                  <img src={whatsapp} alt="WhatsApp" className="w-8 h-8 object-contain" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* COPYRIGHT BOTTOM BAR */}
        <div className="flex flex-col md:flex-row justify-between items-center text-[9px] font-bold tracking-[0.2em] uppercase text-gray-500 gap-4 pt-8 border-t border-white/5">
          <p>© 2026 {config.textoNavbar || 'TIENDA ROJAS'}. TODOS LOS DERECHOS RESERVADOS.</p>
          <p className="text-white flex items-center gap-2">PLATAFORMA <span className="text-orange-500 font-black text-[11px]">RUTA DEL SABOR</span></p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">PRIVACIDAD</a>
            <a href="#" className="hover:text-white transition-colors">TÉRMINOS</a>
          </div>
        </div>

      </div>
    </footer>
  );
};