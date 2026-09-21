import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTenantIdByAlias, setGlobalTenantId } from '@/api/public';
import { Loader2 } from 'lucide-react';

export const TenantResolver = ({ children }: { children: React.ReactNode }) => {
  const { alias } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (alias) {
      getTenantIdByAlias(alias).then((res) => {
        if (res && res.id) {
          setGlobalTenantId(res.id.toString());
          setTimeout(() => setLoading(false), 50); 
        } else {
          setError(true);
          setLoading(false);
        }
      });
    } else {
      setError(true);
      setLoading(false);
    }
  }, [alias]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
        <p className="text-white font-bold tracking-widest uppercase text-sm">Cargando restaurante...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white text-center p-6">
        <h1 className="text-[120px] leading-none font-black text-rose-600 mb-2">404</h1>
        <h2 className="text-2xl font-bold uppercase tracking-widest mb-4">Restaurante no encontrado</h2>
        <p className="text-gray-400 font-medium">Verifica que el enlace (URL) esté bien escrito o comunícate con el soporte de Ruta del Sabor.</p>
      </div>
    );
  }

  return <>{children}</>;
};