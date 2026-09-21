import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, 
  Wallet, FileSpreadsheet, BoxSelect, MapPin, ChevronDown,
  Menu, Moon, Sun, ShieldCheck, BarChart3, Server, CalendarDays, Globe
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getSedes, type Sede } from '@/api/sedes';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, sedeSeleccionadaId, setSedeSeleccionadaId } = useAuthStore();
  
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [isSedeMenuOpen, setIsSedeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const navRef = useRef<HTMLElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    } catch {}
  }, [isCollapsed]);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('sidebar-scroll');
    if (navRef.current && savedScroll) {
      navRef.current.scrollTop = Number(savedScroll);
    }
  }, []);

  const handleNavScroll = () => {
    if (navRef.current) {
      sessionStorage.setItem('sidebar-scroll', navRef.current.scrollTop.toString());
    }
  };

  useEffect(() => {
    if (user?.rol === 'ROLE_ADMIN_EMPRESA' || user?.rol === 'ROLE_SUPER_ADMIN') {
      getSedes().then(res => {
        setSedes(res);
        
        const currentSedeId = useAuthStore.getState().sedeSeleccionadaId;
        const sedeGuardadaExiste = res.some(sede => sede.id === currentSedeId);

        if (res.length > 0 && (!currentSedeId || !sedeGuardadaExiste)) {
          const principal = res.find(s => s.nombre.toLowerCase().includes('principal'));
          setSedeSeleccionadaId(principal ? principal.id : res[0].id);
        } else if (res.length === 0) {
          setSedeSeleccionadaId(null);
        }
      }).catch(() => {});
    }
  }, [user, setSedeSeleccionadaId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsSedeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navGroups = [
    {
      label: 'Operaciones',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
        { name: 'Historial Pedidos', path: '/historial', icon: ShoppingCart, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE', 'ROLE_CAJERO'] },
        { name: 'Reservaciones', path: '/reservas', icon: CalendarDays, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE', 'ROLE_CAJERO', 'ROLE_MOZO'] },
      ]
    },
    {
      label: 'Inventario y Menú',
      items: [
        { name: 'Catálogo', path: '/admin/catalogo', icon: BoxSelect, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
        { name: 'Recetas (BOM)', path: '/admin/recetas', icon: FileSpreadsheet, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
        { name: 'Inventario', path: '/admin/inventario', icon: Package, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
        { name: 'Kardex', path: '/admin/kardex', icon: Package, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
      ]
    },
    {
      label: 'Gestión y Análisis',
      items: [
        { name: 'Finanzas', path: '/admin/finanzas', icon: Wallet, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
        { name: 'Reportes', path: '/admin/reportes', icon: BarChart3, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
        { name: 'RRHH', path: '/admin/personal', icon: Users, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
      ]
    },
{
      label: 'Configuración',
      items: [
        { name: 'Mis Locales', path: '/admin/sedes', icon: MapPin, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA'] },
        { name: 'Ajustes', path: '/admin/configuracion', icon: Settings, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA'] },
        { name: 'Página Web (CMS)', path: '/admin/web-cms', icon: Globe, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
        { name: 'SaaS Master', path: '/admin/saas', icon: Server, roles: ['ROLE_SUPER_ADMIN'] },
      ]
    }
  ];
  
  const isActive = (path: string) => location.pathname === path;
  
  const themeSidebarBg = isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white border-gray-200';
  const themeHeaderBg = isDarkMode ? 'bg-[#0a0a0a] border-gray-800/60 text-white' : 'bg-white border-gray-200 text-gray-900';
  const themeText = isDarkMode ? 'text-white' : 'text-gray-900';
  const themeTextMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  const renderNavItem = (item: any) => {
    const active = isActive(item.path);
    const Icon = item.icon;

    const wrapperBase = `group relative flex items-center rounded-2xl font-bold transition-all duration-300 ${
      isCollapsed ? 'justify-center w-12 h-12 mx-auto px-0' : 'w-full px-4 py-3'
    }`;

    const wrapperTheme = active
      ? 'bg-[#FFC640] text-black shadow-lg shadow-[#FFC640]/10'
      : isDarkMode
        ? 'text-gray-400 hover:text-white hover:bg-white/5'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100';

    return (
      <Link 
        key={item.path} 
        to={item.path} 
        className={`${wrapperBase} ${wrapperTheme}`} 
        title={isCollapsed ? item.name : undefined}
        aria-label={`Ir a ${item.name}`}
      >
        <span className={`flex items-center justify-center shrink-0 transition-transform duration-300 ${active ? 'text-black scale-110' : ''}`}>
          <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        </span>
        <span className={`truncate text-sm tracking-wide transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>
          {item.name}
        </span>
      </Link>
    );
  };

  const nombreMostrar = user?.nombre || user?.correo?.split('@')[0] || 'Administrador';
  const sedeActiva = sedes.find(s => s.id === sedeSeleccionadaId);

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans overflow-hidden">
      <style>{`
        .custom-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes underline-grow {
          from { width: 0; opacity: 0; }
          to { width: 100%; opacity: 1; }
        }
      `}</style>

      <aside className={`flex flex-col flex-shrink-0 z-20 relative overflow-hidden transition-[width] duration-300 ease-in-out border-r ${isCollapsed ? 'w-[80px]' : 'w-[260px]'} ${themeSidebarBg} ${isDarkMode ? 'border-gray-800/60' : 'border-gray-200'}`}>
        
        <div className="flex items-center relative z-10 h-24 mb-2">
          <div className={`absolute left-0 right-0 flex justify-center transition-all duration-300 ${isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
            <span className="text-3xl font-black text-[#FFC640]">RS</span>
          </div>
          <div className={`absolute left-0 right-0 px-6 flex items-center w-full transition-all duration-300 ${isCollapsed ? 'opacity-0 -translate-x-8 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className={`text-2xl font-black ${themeText} tracking-tight leading-tight`}>
                SIS<span className="text-[#FFC640]">TE</span>MA 
              </h1>
              <p className={`text-[10px] ${themeTextMuted} font-bold uppercase tracking-widest mt-0.5`}>
                La Ruta del Sabor
              </p>
            </div>
          </div>
        </div>

        <div className={`mx-6 h-px transition-opacity duration-300 ${isDarkMode ? 'bg-gradient-to-r from-transparent via-gray-800 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-200 to-transparent'} ${isCollapsed ? 'opacity-0' : 'opacity-100'}`} />

        <nav 
          ref={navRef}
          onScroll={handleNavScroll}
          className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-6 overflow-y-auto custom-scrollbar relative z-10 flex flex-col`}
        >
          {navGroups.map((group, idx) => {
            const groupItems = group.items.filter(item => user && item.roles.includes(user.rol));
            if (groupItems.length === 0) return null;

            return (
              <div key={idx} className={idx > 0 ? "mt-5" : ""}>
                <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-10 opacity-100 mb-2'}`}>
                  <p className={`px-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {group.label}
                  </p>
                </div>
                <div className={`transition-all duration-300 overflow-hidden ${isCollapsed && idx > 0 ? 'max-h-px opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'}`}>
                  <div className={`mx-4 h-px ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
                </div>
                <div className="space-y-1.5">
                  {groupItems.map(renderNavItem)}
                </div>
              </div>
            );
          })}
        </nav>

        <div className={`p-6 relative z-10 flex flex-col`}>
          <div className={`mb-3 h-px transition-opacity duration-300 ${isDarkMode ? 'bg-gradient-to-r from-transparent via-gray-800 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-200 to-transparent'} ${isCollapsed ? 'opacity-0' : 'opacity-100'}`} />
          <button 
            onClick={handleLogout} 
            className={`group flex items-center font-bold transition-all duration-300 ${
              isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            } ${isCollapsed ? 'justify-center p-0 w-12 h-12 mx-auto' : 'w-full px-4 py-3'} rounded-2xl`}
            title={isCollapsed ? "Salir del Sistema" : undefined}
            aria-label="Cerrar sesión"
          >
            <span className="flex items-center justify-center shrink-0 transition-transform duration-300">
              <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </span>
            <span className={`text-sm tracking-wide transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>
              Salir del Sistema
            </span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className={`h-20 ${themeHeaderBg} border-b px-6 flex items-center justify-between z-30 sticky top-0 transition-colors duration-300`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              aria-label={isCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
              title="Alternar Menú"
              className={`p-2.5 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-xl font-black tracking-tight leading-none">
                {navGroups.flatMap(g => g.items).find(i => i.path === location.pathname)?.name || 'Panel'}
              </h2>
              <div
                key={location.pathname}
                className={`h-[3px] rounded-full mt-1.5 ${isDarkMode ? 'bg-[#FFC640]' : 'bg-gray-900'}`}
                style={{ animation: 'underline-grow 0.4s ease-out forwards' }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Alternar Tema"
              title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              className={`relative flex items-center w-[60px] h-8 rounded-full p-1 transition-all duration-500 focus:outline-none shrink-0 ${
                isDarkMode 
                  ? 'bg-gray-900 border border-gray-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]' 
                  : 'bg-indigo-50 border border-indigo-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]'
              }`}
            >
              <div className="absolute inset-0 flex justify-between items-center px-2.5 pointer-events-none">
                <Sun size={14} strokeWidth={2.5} className={`transition-opacity duration-500 ${isDarkMode ? 'opacity-0' : 'opacity-100 text-indigo-300'}`} />
                <Moon size={14} strokeWidth={2.5} className={`transition-opacity duration-500 ${isDarkMode ? 'opacity-100 text-gray-600' : 'opacity-0'}`} />
              </div>
              <div
                className={`relative w-6 h-6 rounded-full flex items-center justify-center transform transition-transform duration-500 z-10 ${
                  isDarkMode 
                    ? 'translate-x-[28px] bg-[#FFC640] text-black shadow-[0_0_10px_rgba(255,198,64,0.4)]' 
                    : 'translate-x-0 bg-white text-orange-500 shadow-md'
                }`}
              >
                {isDarkMode ? <Moon size={13} strokeWidth={3} /> : <Sun size={13} strokeWidth={3} />}
              </div>
            </button>

            {(user?.rol === 'ROLE_ADMIN_EMPRESA' || user?.rol === 'ROLE_SUPER_ADMIN') && (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsSedeMenuOpen(!isSedeMenuOpen)}
                  aria-label="Cambiar local o sede operativa"
                  title="Seleccionar Local"
                  className={`flex items-center gap-3 border px-4 py-2.5 rounded-xl shadow-sm transition-all focus:outline-none active:scale-[0.98] ${isDarkMode ? 'bg-[#131a2b] border-gray-700/60 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${isDarkMode ? 'bg-[#FFC640]/10' : 'bg-orange-50'}`}>
                    <MapPin size={14} className={isDarkMode ? 'text-[#FFC640]' : 'text-orange-500'} />
                  </span>
                  <div className="hidden sm:flex flex-col items-start text-left">
                    <span className={`text-[9px] font-black uppercase leading-none tracking-widest mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sede Activa</span>
                    <span className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                      {sedeActiva ? sedeActiva.nombre : 'Cargando locales...'}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-1 transition-transform duration-200 ${isSedeMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isSedeMenuOpen && (
                  <div className={`absolute right-0 mt-3 w-64 border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${isDarkMode ? 'bg-[#131a2b] border-gray-700/60' : 'bg-white border-gray-100'}`}>
                    <div className={`p-3 border-b ${isDarkMode ? 'bg-black/20 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mis Locales Operativos</p>
                    </div>
                    <div className="p-2 max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                      {sedes.map(s => {
                        const sel = sedeSeleccionadaId === s.id;
                        return (
                          <button
                            key={s.id}
                            aria-label={`Seleccionar sede ${s.nombre}`}
                            onClick={() => { setSedeSeleccionadaId(s.id); setIsSedeMenuOpen(false); }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                              sel 
                                ? (isDarkMode ? 'bg-white text-gray-900' : 'bg-gray-900 text-white shadow-md')
                                : (isDarkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                            }`}
                          >
                            <span className="truncate">{s.nombre}</span>
                            {sel && <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)] shrink-0 ml-2"></div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={`flex items-center gap-3 pl-3 sm:pl-4 border-l ${isDarkMode ? 'border-gray-700/60' : 'border-gray-200'}`}>
              <div className="text-right hidden md:block">
                <p className={`text-sm font-black leading-tight ${themeText}`}>{nombreMostrar}</p>
                <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  <ShieldCheck size={10} className={isDarkMode ? 'text-[#FFC640]' : 'text-orange-500'} />
                  {user?.rol.replace('ROLE_', '').replace('_', ' ')}
                </span>
              </div>
              <div className="relative w-11 h-11 shrink-0">
                <div className={`absolute inset-0 rounded-xl p-[2px] ${isDarkMode ? 'bg-[#FFC640]' : 'bg-gradient-to-br from-orange-500 to-amber-500'}`}>
                  <div className={`w-full h-full rounded-[9px] flex items-center justify-center font-black text-lg ${isDarkMode ? 'bg-[#0a0a0a] text-[#FFC640]' : 'bg-white text-orange-600'}`}>
                    {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8 relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
}