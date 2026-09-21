import api from './client';

export const getConfiguracionWeb = async () => {
  const { data } = await api.get('/admin/web/configuracion');
  return data;
};

export const guardarConfiguracionWeb = async (config: any) => {
  const { data } = await api.post('/admin/web/configuracion', config);
  return data;
};

export const getCarruselWeb = async () => {
  const { data } = await api.get('/admin/web/carrusel');
  return data;
};

export const agregarImagenCarrusel = async (payload: { imagenUrl: string; orden: number }) => {
  const { data } = await api.post('/admin/web/carrusel', payload);
  return data;
};

export const eliminarImagenCarrusel = async (id: number) => {
  const { data } = await api.delete(`/admin/web/carrusel/${id}`);
  return data;
};

export const getGaleriaWeb = async () => {
  const { data } = await api.get('/admin/web/galeria');
  return data;
};

export const guardarImagenGaleriaWeb = async (payload: { imagenUrl: string; posicion: number }) => {
  const { data } = await api.post('/admin/web/galeria', payload);
  return data;
};

export const eliminarImagenGaleriaWeb = async (id: number) => {
  const { data } = await api.delete(`/admin/web/galeria/${id}`);
  return data;
};

export const eliminarImagenSeltaWeb = async (url: string) => {
  const { data } = await api.post('/admin/web/eliminar-imagen', { url });
  return data;
};