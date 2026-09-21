import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { sileo } from 'sileo';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  WifiOff,
  UtensilsCrossed,
  ArrowRight,
  ArrowLeft,
  Check,
  Mail,
  Lock
} from 'lucide-react';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 26 },
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');
  const [roleName, setRoleName] = useState(''); 

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || isSuccess) return;

    if (!correo.trim() || !password.trim()) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await login({ correo, password });
      setAuth(data);

      const rol = data.rol;
      let rolePath = '/login';
      let displayRole = 'tu estación de trabajo';

      switch (rol) {
        case 'ROLE_COCINA':
          rolePath = '/kds';
          displayRole = 'Cocina (KDS)';
          break;
        case 'ROLE_MOZO':
          rolePath = '/mozo';
          displayRole = 'Salón y Mesas';
          break;
        case 'ROLE_CAJERO':
          rolePath = '/cajero';
          displayRole = 'Caja y Pagos';
          break;
        case 'ROLE_GERENTE_SEDE':
        case 'ROLE_ADMIN_EMPRESA':
        case 'ROLE_SUPER_ADMIN':
          rolePath = '/dashboard';
          displayRole = 'Panel de Administración';
          break;
      }

      setRedirectPath(rolePath);
      setRoleName(displayRole);
      setIsSuccess(true);

    } catch (err: any) {
      let errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Correo o contraseña incorrectos.';

      if (errorMsg === 'Network Error') {
        errorMsg = 'Error de red: el servidor interno no responde.';
      }

      sileo.error({
        title: `Acceso Denegado: ${errorMsg}`,
      });

      setError(errorMsg);
      setLoading(false);
    }
  };

  const isNetworkError = error.toLowerCase().includes('red');

  return (
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      <AnimatePresence>
        {!isSuccess && (
          <motion.div 
            layout
            exit={{ width: 0, opacity: 0, padding: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 32 }}
            className="hidden lg:flex w-5/12 bg-[#030303] relative flex-col justify-center px-12 xl:px-16 overflow-hidden border-r border-gray-800/50"
          >
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
            />

            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative z-10 max-w-md mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-orange-400 text-[10px] font-black uppercase tracking-widest mb-8 backdrop-blur-md">
                <UtensilsCrossed size={14} /> Sistema Integrado
              </div>
              
              <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">
                Sistema <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                  La Ruta del Sabor
                </span>
              </h1>
              
              <p className="text-gray-400 text-base xl:text-lg font-medium leading-relaxed mb-12">
                Mozos, cocina, caja y gerencia trabajando en perfecta armonía. Todos tus procesos operativos sincronizados en tiempo real.
              </p>
              
              <div className="relative h-32 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 40, rotate: -6 }}
                  animate={{ opacity: 1, y: 0, rotate: -4 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
                  className="absolute right-0 bottom-0 w-56 bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl"
                >
                  <div className="h-1.5 w-12 bg-orange-500/70 rounded-full mb-3" />
                  <div className="space-y-2">
                    <div className="h-1.5 w-full bg-zinc-700/60 rounded-full" />
                    <div className="h-1.5 w-4/5 bg-zinc-700/60 rounded-full" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-6 flex-1 bg-orange-500/15 border border-orange-500/20 rounded-lg" />
                    <div className="h-6 w-6 bg-zinc-800/80 rounded-lg" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: -40, rotate: 10 }}
                  animate={{ opacity: 1, y: 0, rotate: 8 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 120 }}
                  className="absolute left-0 top-0 w-48 bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="h-1.5 w-16 bg-zinc-700/70 rounded-full" />
                  </div>
                  <div className="h-8 w-full bg-zinc-800/70 rounded-xl mb-2" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        layout 
        className={`relative flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white transition-all duration-500 ease-in-out ${isSuccess ? 'w-full items-center' : 'w-full lg:w-7/12'}`}
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success-view"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, type: 'spring' }}
              onAnimationComplete={() => {
                setTimeout(() => navigate(redirectPath), 1200);
              }}
              className="w-full max-w-[400px] flex flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 18 }}
                className="relative mb-8"
              >
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150" />
                <div className="relative bg-emerald-50 border border-emerald-200 text-emerald-500 rounded-full p-6 shadow-xl">
                  <Check className="w-12 h-12" strokeWidth={3} />
                </div>
              </motion.div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">
                Acceso Concedido
              </h2>
              <p className="text-gray-500 font-bold text-[15px] mb-8">
                Preparando tu entorno: <span className="text-orange-500">{roleName}</span>...
              </p>
              
              <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: "100%" }} 
                  transition={{ duration: 1, ease: "easeInOut" }} 
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-500"
                />
              </div>
            </motion.div>

          ) : (
            
            <motion.div
              key="form-view"
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-[400px] mx-auto"
            >
              <motion.div variants={staggerContainer} initial="hidden" animate="show">
                
                <motion.div variants={fadeUp} className="mb-6">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors"
                  >
                    <ArrowLeft size={16} /> Volver al inicio
                  </button>
                </motion.div>

                <motion.div variants={fadeUp} className="flex lg:hidden items-center gap-3 mb-10">
                  <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 rounded-xl shadow-md">
                    <UtensilsCrossed className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="font-black tracking-tight text-xl text-gray-900">LRDScore</span>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="mb-10">
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-3">
                    Bienvenido
                  </h2>
                  <p className="text-gray-500 text-[15px] font-medium leading-relaxed">
                    Ingresa tus credenciales para acceder a la terminal de trabajo.
                  </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  
                  <motion.div variants={fadeUp} className="space-y-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest" htmlFor="correo">
                      Correo Electrónico
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                      <input
                        id="correo"
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="usuario@rutadelsabor.com"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 text-[15px] font-bold 
                                   focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 
                                   outline-none transition-all duration-200 disabled:opacity-50 placeholder-gray-400"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={fadeUp} className="space-y-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest" htmlFor="password">
                      Contraseña
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 text-[15px] font-bold 
                                   focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 
                                   outline-none transition-all duration-200 disabled:opacity-50 placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`flex items-start gap-3 border rounded-xl px-4 py-3.5 text-sm font-bold overflow-hidden ${
                          isNetworkError
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : 'bg-amber-50 border-amber-200 text-amber-600'
                        }`}
                      >
                        {isNetworkError ? (
                          <WifiOff size={18} className="mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                        )}
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={fadeUp} className="pt-4">
                    <motion.button
                      whileTap={{ scale: 0.985 }}
                      type="submit"
                      disabled={loading}
                      className="group relative w-full flex justify-center items-center gap-2.5 overflow-hidden
                                 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-base py-4 rounded-2xl
                                 shadow-lg shadow-gray-900/20 disabled:opacity-70 disabled:cursor-not-allowed
                                 outline-none focus-visible:ring-4 focus-visible:ring-gray-900/30 transition-all duration-200"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Verificando...
                        </>
                      ) : (
                        <>
                          Ingresar al Sistema
                          <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform duration-200" />
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </form>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}