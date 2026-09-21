import api from './client';

export interface Reserva {
  id: number;
  nombreCliente: string;
  telefonoCliente: string;
  fechaHora: string;
  cantidadPersonas: number;
  notas: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'ASISTIO' | 'CANCELADA';
}

export const getReservasDelDia = () => 
  api.get<Reserva[]>('/reservas/del-dia').then(res => res.data);

export const crearReserva = (data: Partial<Reserva>) => 
  api.post<Reserva>('/reservas', data).then(res => res.data);

export const cambiarEstadoReserva = (id: number, estado: string) => 
  api.put<Reserva>(`/reservas/${id}/estado?estado=${estado}`).then(res => res.data);