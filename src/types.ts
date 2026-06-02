export type EstadoDano    = 'Pendiente' | 'En progreso' | 'Resuelto';
export type PrioridadDano = 'Baja' | 'Media' | 'Alta' | 'Urgente';
export type FrecuenciaLimpieza = 'Diaria' | 'Semanal' | 'Mensual' | 'Anual';

export interface Propiedad {
  id: string;
  usuario_id?: string;
  nombre: string;
  direccion?: string;
  imagen_url?: string;
  created_at?: string;
}

export interface Area {
  id: string;
  propiedad_id: string;
  nombre: string;
  tipo: string;
  imagen_url?: string;
}

export interface Dano {
  id: string;
  area_id: string;
  propiedad_id: string;
  usuario_id?: string;
  titulo: string;
  descripcion?: string;
  costo_estimado?: number;
  tiempo_estimado?: string;
  estado: EstadoDano;
  prioridad: PrioridadDano;
  imagen_url?: string;
  pos_x?: number;
  pos_y?: number;
  created_at?: string;
}

export interface ItemInventario {
  id: string;
  area_id: string;
  propiedad_id: string;
  usuario_id?: string;
  producto: string;
  cantidad: number;
  cantidad_minima: number;
  categoria: string;
}

export interface TareaLimpieza {
  id: string;
  propiedad_id: string;
  usuario_id?: string;
  titulo: string;
  frecuencia: FrecuenciaLimpieza;
  ultima_vez?: string;
  completada: boolean;
}

export interface ToastMsg {
  id: string;
  tipo: 'ok' | 'error' | 'info';
  texto: string;
}
