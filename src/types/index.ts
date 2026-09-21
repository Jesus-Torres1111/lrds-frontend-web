export interface AuthResponse {
  token: string;
  correo: string;
  rol: string;
  empresaId: number;
  modulosHabilitados: string[];  
  estadoSuscripcion: string;     
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export type EstadoPedido =
  | 'BORRADOR'
  | 'RECIBIDO'
  | 'EN_PREPARACION'
  | 'LISTO'
  | 'ENTREGADO'
  | 'PAGADO'
  | 'CANCELADO';

export type TipoConsumo = 'MESA' | 'PARA_LLEVAR' | 'DELIVERY';

export type EstadoItem = 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';

export interface DetallePedido {
  detalleId: number;
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notasPreparacion?: string;
  estadoItem: EstadoItem;
  numeroComanda: number;
}

export interface PedidoActivo {
  id: number;
  mozo: string;
  tipoConsumo: TipoConsumo;
  mesa: string;
  estadoActual: EstadoPedido;
  descuento: number;
  total: number;
  fechaCreacion: string;
  items: DetallePedido[];
  requiereRevision: boolean;
}

export type EstadoDisponibilidad = 'DISPONIBLE' | 'AGOTADO_TEMPORAL' | 'AGOTADO_SERVICIO';

export interface Producto {
  id: number;
  nombre: string;
  precioVenta: number;
  categoria?: { id: number; nombre: string };
  categoriaId?: number; 
  tipoProducto?: 'BIEN' | 'SERVICIO'; 
  estadoRegistro: boolean;
  estadoDisponibilidad: EstadoDisponibilidad;
  esPreparado?: boolean;              
  tiempoPreparacionMinutos?: number;   
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  estadoRegistro?: boolean;
}

export interface ItemPedidoLocal {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  notas: string;
}

export interface SseEvent {
  pedidoId: number;
  mesa: string;
  estado: EstadoPedido;
}