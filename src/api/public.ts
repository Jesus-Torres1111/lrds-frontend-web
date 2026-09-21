import axios from 'axios';

export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

export const setGlobalTenantId = (id: string) => {
  localStorage.setItem('current_tenant_id', id);
};

publicApi.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('current_tenant_id') || '1';
  config.headers['X-Tenant-ID'] = tenantId;
  return config;
});

export const getTenantIdByAlias = async (alias: string) => {
  try {
    const { data } = await publicApi.get(`/public/empresa/${alias}`);
    return data; 
  } catch (error) {
    return null;
  }
};

export const getPublicConfig = async () => {
  try {
    const { data } = await publicApi.get('/public/cms/configuracion');
    return data;
  } catch (error: any) {
    console.error("ERROR EN CONFIGURACION:", error.response?.data || error.message);
    throw error;
  }
};

export const getPublicCarousel = async () => {
  try {
    const { data } = await publicApi.get('/public/cms/carrusel');
    return data;
  } catch (error: any) {
    console.error("ERROR EN CARRUSEL:", error.response?.data || error.message);
    throw error;
  }
};

export const getPublicGallery = async () => {
  try {
    const { data } = await publicApi.get('/public/cms/galeria');
    return data;
  } catch (error: any) {
    console.error("ERROR EN GALERIA:", error.response?.data || error.message);
    throw error;
  }
};

export const getPublicCatalog = async () => {
  try {
    const { data } = await publicApi.get('/public/catalogo/productos');
    return data;
  } catch (error: any) {
    console.error("ERROR EN CATALOGO:", error.response?.data || error.message);
    throw error;
  }
};

export const getPublicSedes = async () => {
  try {
    const { data } = await publicApi.get('/public/sedes');
    return data;
  } catch (error: any) {
    console.error("ERROR EN SEDES:", error.response?.data || error.message);
    throw error;
  }
};

export const procesarCheckoutPublico = async (payload: any) => {
  try {
    const { data } = await publicApi.post('/public/checkout', payload);
    return data;
  } catch (error: any) {
    console.error("ERROR EN CHECKOUT:", error.response?.data || error.message);
    throw error;
  }
};

export const getPublicCategorias = async () => {
  try {
    const { data } = await publicApi.get('/public/catalogo/categorias');
    return data;
  } catch (error: any) {
    console.error("ERROR EN CATEGORIAS:", error.response?.data || error.message);
    throw error;
  }
};

export const getPublicProductos = async () => {
  try {
    const { data } = await publicApi.get('/public/catalogo/productos');
    return data;
  } catch (error: any) {
    console.error("ERROR EN PRODUCTOS:", error.response?.data || error.message);
    throw error;
  }
};