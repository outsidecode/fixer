import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import type { Propiedad, Area, Dano, ItemInventario, TareaLimpieza, EstadoDano } from './types';

export function useFixer(usuarioId: string) {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [areas,       setAreas]       = useState<Area[]>([]);
  const [danos,       setDanos]       = useState<Dano[]>([]);
  const [inventario,  setInventario]  = useState<ItemInventario[]>([]);
  const [tareas,      setTareas]      = useState<TareaLimpieza[]>([]);
  const [cargando,    setCargando]    = useState(true);

  // ── Carga inicial ──────────────────────────────────────────────────
  useEffect(() => {
    if (!usuarioId) return;
    const cargar = async () => {
      setCargando(true);
      try {
        const [p, a, d, i, t] = await Promise.all([
          supabase.from('propiedades').select('*').eq('usuario_id', usuarioId).order('created_at'),
          supabase.from('areas').select('*').order('created_at'),
          supabase.from('danos').select('*').eq('usuario_id', usuarioId).order('created_at', { ascending: false }),
          supabase.from('inventario').select('*').eq('usuario_id', usuarioId).order('created_at'),
          supabase.from('tareas_limpieza').select('*').eq('usuario_id', usuarioId).order('created_at'),
        ]);
        setPropiedades(p.data ?? []);
        setAreas(a.data ?? []);
        setDanos(d.data ?? []);
        setInventario(i.data ?? []);
        setTareas(t.data ?? []);
      } finally { setCargando(false); }
    };
    cargar();
  }, [usuarioId]);

  // ── PROPIEDADES ────────────────────────────────────────────────────
  const agregarPropiedad = useCallback(async (datos: { nombre: string; direccion?: string }) => {
    const { data, error } = await supabase.from('propiedades').insert({ ...datos, usuario_id: usuarioId }).select().single();
    if (error) throw error;
    setPropiedades(prev => [...prev, data]);
    return data as Propiedad;
  }, [usuarioId]);

  const eliminarPropiedad = useCallback(async (id: string) => {
    setPropiedades(prev => prev.filter(p => p.id !== id));
    setAreas(prev => prev.filter(a => a.propiedad_id !== id));
    setDanos(prev => prev.filter(d => d.propiedad_id !== id));
    setInventario(prev => prev.filter(i => i.propiedad_id !== id));
    setTareas(prev => prev.filter(t => t.propiedad_id !== id));
    await supabase.from('propiedades').delete().eq('id', id);
  }, []);

  // ── ÁREAS ──────────────────────────────────────────────────────────
  const agregarArea = useCallback(async (datos: { propiedad_id: string; nombre: string; tipo: string }) => {
    const { data, error } = await supabase.from('areas').insert(datos).select().single();
    if (error) throw error;
    setAreas(prev => [...prev, data]);
    return data as Area;
  }, []);

  const eliminarArea = useCallback(async (id: string) => {
    setAreas(prev => prev.filter(a => a.id !== id));
    await supabase.from('areas').delete().eq('id', id);
  }, []);

  // ── DAÑOS ──────────────────────────────────────────────────────────
  const agregarDano = useCallback(async (datos: Omit<Dano, 'id' | 'usuario_id' | 'created_at'>) => {
    const { data, error } = await supabase.from('danos').insert({ ...datos, usuario_id: usuarioId }).select().single();
    if (error) throw error;
    setDanos(prev => [data, ...prev]);
    return data as Dano;
  }, [usuarioId]);

  const actualizarEstadoDano = useCallback(async (id: string, estado: EstadoDano) => {
    setDanos(prev => prev.map(d => d.id === id ? { ...d, estado } : d));
    await supabase.from('danos').update({ estado }).eq('id', id);
  }, []);

  const eliminarDano = useCallback(async (id: string) => {
    setDanos(prev => prev.filter(d => d.id !== id));
    await supabase.from('danos').delete().eq('id', id);
  }, []);

  // ── INVENTARIO ─────────────────────────────────────────────────────
  const agregarItem = useCallback(async (datos: Omit<ItemInventario, 'id' | 'usuario_id'>) => {
    const { data, error } = await supabase.from('inventario').insert({ ...datos, usuario_id: usuarioId }).select().single();
    if (error) throw error;
    setInventario(prev => [...prev, data]);
    return data as ItemInventario;
  }, [usuarioId]);

  const actualizarCantidad = useCallback(async (id: string, cantidad: number) => {
    setInventario(prev => prev.map(i => i.id === id ? { ...i, cantidad } : i));
    await supabase.from('inventario').update({ cantidad }).eq('id', id);
  }, []);

  const eliminarItem = useCallback(async (id: string) => {
    setInventario(prev => prev.filter(i => i.id !== id));
    await supabase.from('inventario').delete().eq('id', id);
  }, []);

  // ── TAREAS ─────────────────────────────────────────────────────────
  const agregarTarea = useCallback(async (datos: Omit<TareaLimpieza, 'id' | 'usuario_id'>) => {
    const { data, error } = await supabase.from('tareas_limpieza').insert({ ...datos, usuario_id: usuarioId }).select().single();
    if (error) throw error;
    setTareas(prev => [...prev, data]);
    return data as TareaLimpieza;
  }, [usuarioId]);

  const toggleTarea = useCallback(async (id: string, completada: boolean) => {
    setTareas(prev => prev.map(t => t.id === id ? { ...t, completada, ultima_vez: completada ? new Date().toISOString() : t.ultima_vez } : t));
    await supabase.from('tareas_limpieza').update({ completada, ultima_vez: completada ? new Date().toISOString() : null }).eq('id', id);
  }, []);

  const eliminarTarea = useCallback(async (id: string) => {
    setTareas(prev => prev.filter(t => t.id !== id));
    await supabase.from('tareas_limpieza').delete().eq('id', id);
  }, []);

  return {
    propiedades, areas, danos, inventario, tareas, cargando,
    agregarPropiedad, eliminarPropiedad,
    agregarArea, eliminarArea,
    agregarDano, actualizarEstadoDano, eliminarDano,
    agregarItem, actualizarCantidad, eliminarItem,
    agregarTarea, toggleTarea, eliminarTarea,
  };
}
