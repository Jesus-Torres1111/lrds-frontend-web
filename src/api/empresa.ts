import api from './client';

export interface PlanModulo {
  codigoModulo: string;
}

export interface Plan {
  id: number;
  nombre: string;
  precioMensual: number;
  modulos?: PlanModulo[];
}

export interface Suscripcion {
  id: number;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  plan: Plan;
}

export interface Empresa {
  id: number;
  nombreComercial: string;
  ruc: string;
  direccion: string;
  estadoRegistro: boolean; 
  suscripcionVigente?: Suscripcion; 
}

export const getMiEmpresa = () => 
  api.get<Empresa>('/v1/empresas/mi-empresa')
     .then(r => r.data)
     .catch(() => null);

export const actualizarEmpresa = (id: number, payload: Partial<Empresa>) => 
  api.put<Empresa>(`/v1/empresas/${id}`, payload)
     .then(r => r.data);

export const getTodasEmpresas = async (): Promise<Empresa[]> => {
  try {
    const response = await api.get('/v1/empresas');
    return response.data;
  } catch (error: any) {
    console.error("ERROR DEL BACKEND:", error.response?.data || error.message);
    throw error;
  }
};

export const suspenderEmpresa = async (id: number): Promise<void> => {
  await api.delete(`/v1/empresas/${id}`);
};

export const activarEmpresa = async (id: number): Promise<void> => {
  await api.put(`/v1/empresas/${id}/activar`);
};

export const cambiarPlanEmpresa = async (empresaId: number, planId: number): Promise<Empresa> => {
  const response = await api.put(`/v1/empresas/${empresaId}/plan`, { planId });
  return response.data;
};

export const registrarNuevoInquilino = async (payload: any): Promise<Empresa> => {
  const response = await api.post(`/v1/empresas/onboarding`, payload);
  return response.data;
};