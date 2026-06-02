import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import AuthPage from './AuthPage';
import { useFixer } from './useFixer';
import type {
  Propiedad, Area, Dano, ItemInventario, TareaLimpieza,
  EstadoDano, PrioridadDano, FrecuenciaLimpieza, ToastMsg
} from './types';

// ── Toast ─────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: string) => void }) {
  const col: Record<ToastMsg['tipo'], string> = { ok: 'bg-emerald-600 border-emerald-500', error: 'bg-rose-700 border-rose-600', info: 'bg-orange-600 border-orange-500' };
  const ico: Record<ToastMsg['tipo'], string> = { ok: '✅', error: '❌', info: '🔧' };
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full">
      {toasts.map(t => (
        <div key={t.id} className={`${col[t.tipo]} border text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-start gap-3 slide-in`}>
          <span className="flex-shrink-0">{ico[t.tipo]}</span>
          <span className="flex-1">{t.texto}</span>
          <button onClick={() => onDismiss(t.id)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────
function ConfirmModal({ titulo, mensaje, onConfirmar, onCancelar }: { titulo: string; mensaje: string; onConfirmar: () => void; onCancelar: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-6 shadow-2xl fade-up">
        <h3 className="font-display font-bold text-base text-white mb-2">{titulo}</h3>
        <p className="text-[#737373] text-sm mb-6">{mensaje}</p>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-[#aaa] font-semibold py-2.5 rounded-xl text-sm transition">Cancelar</button>
          <button onClick={() => { onConfirmar(); onCancelar(); }} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2.5 rounded-xl text-sm transition">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ── useToast ──────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const mostrar = useCallback((texto: string, tipo: ToastMsg['tipo'] = 'ok') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, tipo, texto }]);
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);
  const descartar = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  return { toasts, mostrar, descartar };
}

// ── App ───────────────────────────────────────────────────────────────
export default function App() {
  const { usuario, cargando: authCargando, registrar, iniciarSesion, cerrarSesion } = useAuth();

  if (authCargando) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="text-center">
        <span className="text-5xl">🔧</span>
        <p className="text-[#737373] text-sm mt-4">Cargando Fixer...</p>
      </div>
    </div>
  );

  if (!usuario) return <AuthPage onIniciarSesion={iniciarSesion} onRegistrar={registrar} />;
  return <AppPrincipal usuarioId={usuario.id} email={usuario.email ?? ''} onCerrarSesion={cerrarSesion} />;
}

// ── App Principal ─────────────────────────────────────────────────────
function AppPrincipal({ usuarioId, email, onCerrarSesion }: { usuarioId: string; email: string; onCerrarSesion: () => void }) {
  const { toasts, mostrar: toast, descartar } = useToast();
  const [confirm, setConfirm] = useState<{ titulo: string; mensaje: string; fn: () => void } | null>(null);
  const confirmar = (titulo: string, mensaje: string, fn: () => void) => setConfirm({ titulo, mensaje, fn });

  const {
    propiedades, areas, danos, inventario, tareas, cargando,
    agregarPropiedad, eliminarPropiedad,
    agregarArea, eliminarArea,
    agregarDano, actualizarEstadoDano, eliminarDano,
    agregarItem, actualizarCantidad, eliminarItem,
    agregarTarea, toggleTarea, eliminarTarea,
  } = useFixer(usuarioId);

  const [vista,        setVista]        = useState<'dashboard'|'propiedades'|'danos'|'inventario'|'limpieza'>('dashboard');
  const [propActiva,   setPropActiva]   = useState<Propiedad | null>(null);
  const [areaActiva,   setAreaActiva]   = useState<Area | null>(null);

  // Modales
  const [modalProp,    setModalProp]    = useState(false);
  const [modalArea,    setModalArea]    = useState(false);
  const [modalDano,    setModalDano]    = useState(false);
  const [modalItem,    setModalItem]    = useState(false);
  const [modalTarea,   setModalTarea]   = useState(false);

  // Forms
  const [fNombreProp,  setFNombreProp]  = useState('');
  const [fDirProp,     setFDirProp]     = useState('');
  const [fNombreArea,  setFNombreArea]  = useState('');
  const [fTipoArea,    setFTipoArea]    = useState('Sala');
  const [fTituloDano,  setFTituloDano]  = useState('');
  const [fDescDano,    setFDescDano]    = useState('');
  const [fCostoDano,   setFCostoDano]   = useState('');
  const [fPrioDano,    setFPrioDano]    = useState<PrioridadDano>('Media');
  const [fProducto,    setFProducto]    = useState('');
  const [fCantidad,    setFCantidad]    = useState('1');
  const [fCantMin,     setFCantMin]     = useState('1');
  const [fCategoria,   setFCategoria]   = useState('Herramientas');
  const [fTituloTarea, setFTituloTarea] = useState('');
  const [fFrecuencia,  setFFrecuencia]  = useState<FrecuenciaLimpieza>('Semanal');

  const areasDeProp   = areas.filter(a => a.propiedad_id === propActiva?.id);
  const danosDeProp   = danos.filter(d => d.propiedad_id === propActiva?.id);
  const danosPendientes = danos.filter(d => d.estado !== 'Resuelto').length;
  const itemsBajos    = inventario.filter(i => i.cantidad <= i.cantidad_minima).length;
  const tareasHoy     = tareas.filter(t => !t.completada).length;

  const TIPOS_AREA = ['Sala','Cocina','Dormitorio','Baño','Garaje','Jardín','Terraza','Depósito','Otro'];
  const CATS_INV   = ['Herramientas','Limpieza','Electricidad','Plomería','Pintura','Jardinería','Otro'];

  const guardarPropiedad = async () => {
    if (!fNombreProp.trim()) return;
    try { await agregarPropiedad({ nombre: fNombreProp.trim(), direccion: fDirProp.trim() }); toast('Propiedad agregada', 'ok'); setModalProp(false); setFNombreProp(''); setFDirProp(''); }
    catch { toast('Error al guardar', 'error'); }
  };

  const guardarArea = async () => {
    if (!fNombreArea.trim() || !propActiva) return;
    try { await agregarArea({ propiedad_id: propActiva.id, nombre: fNombreArea.trim(), tipo: fTipoArea }); toast('Área agregada', 'ok'); setModalArea(false); setFNombreArea(''); }
    catch { toast('Error al guardar', 'error'); }
  };

  const guardarDano = async () => {
    if (!fTituloDano.trim() || !propActiva) return;
    try {
      await agregarDano({
        area_id: areaActiva?.id || areasDeProp[0]?.id || '',
        propiedad_id: propActiva.id,
        titulo: fTituloDano.trim(),
        descripcion: fDescDano.trim(),
        costo_estimado: fCostoDano ? parseFloat(fCostoDano) : undefined,
        estado: 'Pendiente',
        prioridad: fPrioDano,
      });
      toast('Daño registrado', 'ok'); setModalDano(false);
      setFTituloDano(''); setFDescDano(''); setFCostoDano('');
    } catch { toast('Error al guardar', 'error'); }
  };

  const guardarItem = async () => {
    if (!fProducto.trim() || !propActiva) return;
    try {
      await agregarItem({
        area_id: areaActiva?.id || areasDeProp[0]?.id || '',
        propiedad_id: propActiva.id,
        producto: fProducto.trim(),
        cantidad: parseInt(fCantidad) || 1,
        cantidad_minima: parseInt(fCantMin) || 1,
        categoria: fCategoria,
      });
      toast('Ítem agregado', 'ok'); setModalItem(false);
      setFProducto(''); setFCantidad('1'); setFCantMin('1');
    } catch { toast('Error al guardar', 'error'); }
  };

  const guardarTarea = async () => {
    if (!fTituloTarea.trim() || !propActiva) return;
    try {
      await agregarTarea({ propiedad_id: propActiva.id, titulo: fTituloTarea.trim(), frecuencia: fFrecuencia, completada: false });
      toast('Tarea agregada', 'ok'); setModalTarea(false); setFTituloTarea('');
    } catch { toast('Error al guardar', 'error'); }
  };

  const COLOR_ESTADO: Record<EstadoDano, string> = {
    'Pendiente':    'bg-rose-950/50 text-rose-400 border-rose-800/40',
    'En progreso':  'bg-amber-950/50 text-amber-400 border-amber-800/40',
    'Resuelto':     'bg-emerald-950/50 text-emerald-400 border-emerald-800/40',
  };
  const COLOR_PRIO: Record<PrioridadDano, string> = {
    'Baja':    'bg-slate-800 text-slate-400',
    'Media':   'bg-amber-900/40 text-amber-400',
    'Alta':    'bg-orange-900/40 text-orange-400',
    'Urgente': 'bg-rose-900/40 text-rose-400',
  };

  if (cargando) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="text-center"><span className="text-5xl">🔧</span><p className="text-[#737373] text-sm mt-4">Cargando tu hogar...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col md:flex-row font-sans">
      <ToastContainer toasts={toasts} onDismiss={descartar} />
      {confirm && <ConfirmModal titulo={confirm.titulo} mensaje={confirm.mensaje} onConfirmar={confirm.fn} onCancelar={() => setConfirm(null)} />}

      {/* ── SIDEBAR ── */}
      <nav className="w-full md:w-60 bg-[#141414] border-b md:border-b-0 md:border-r border-[#2a2a2a] p-5 flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-base">🔧</div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none">FIXER</h1>
            <p className="text-[10px] text-[#737373] truncate max-w-[130px]">{email}</p>
          </div>
        </div>

        {([
          { id: 'dashboard',   label: 'Dashboard',   ico: '📊' },
          { id: 'propiedades', label: 'Propiedades', ico: '🏠' },
          { id: 'danos',       label: 'Daños',       ico: '🔴' },
          { id: 'inventario',  label: 'Inventario',  ico: '📦' },
          { id: 'limpieza',    label: 'Limpieza',    ico: '🧹' },
        ] as const).map(({ id, label, ico }) => (
          <button key={id} onClick={() => setVista(id)}
            className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
              vista === id ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-[#737373] hover:bg-[#1f1f1f] hover:text-white'
            }`}>
            <span>{ico}</span>{label}
            {id === 'danos' && danosPendientes > 0 && <span className="ml-auto bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{danosPendientes}</span>}
            {id === 'inventario' && itemsBajos > 0 && <span className="ml-auto bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{itemsBajos}</span>}
            {id === 'limpieza' && tareasHoy > 0 && <span className="ml-auto bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{tareasHoy}</span>}
          </button>
        ))}

        <button onClick={() => confirmar('Cerrar sesión', '¿Seguro que quieres salir?', onCerrarSesion)}
          className="mt-auto text-[#404040] hover:text-rose-400 text-sm py-2.5 px-3 rounded-xl transition text-left">
          🚪 Cerrar sesión
        </button>
      </nav>

      {/* ── CONTENIDO ── */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">

        {/* DASHBOARD */}
        {vista === 'dashboard' && (
          <div className="space-y-8 fade-up max-w-4xl">
            <div>
              <h2 className="font-display font-bold text-2xl mb-1">Dashboard</h2>
              <p className="text-[#737373] text-sm">Resumen de tus propiedades</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Propiedades', value: propiedades.length, color: 'text-orange-400', border: 'border-orange-500/20' },
                { label: 'Daños activos', value: danosPendientes, color: 'text-rose-400', border: 'border-rose-500/20' },
                { label: 'Stock bajo', value: itemsBajos, color: 'text-amber-400', border: 'border-amber-500/20' },
                { label: 'Tareas pend.', value: tareasHoy, color: 'text-blue-400', border: 'border-blue-500/20' },
              ].map(({ label, value, color, border }) => (
                <div key={label} className={`bg-[#1a1a1a] border ${border} rounded-2xl p-5 text-center`}>
                  <div className={`text-3xl font-display font-bold ${color}`}>{value}</div>
                  <div className="text-[#737373] text-xs mt-1">{label}</div>
                </div>
              ))}
            </div>

            {propiedades.length === 0 ? (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-dashed rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">🏠</div>
                <h3 className="font-display font-bold text-lg mb-2">Sin propiedades aún</h3>
                <p className="text-[#737373] text-sm mb-6">Agrega tu primera propiedad para empezar</p>
                <button onClick={() => { setVista('propiedades'); setModalProp(true); }}
                  className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition">
                  + Agregar propiedad
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {propiedades.map(p => {
                  const danosProp = danos.filter(d => d.propiedad_id === p.id && d.estado !== 'Resuelto').length;
                  const areasProp = areas.filter(a => a.propiedad_id === p.id).length;
                  return (
                    <div key={p.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 cursor-pointer hover:border-orange-500/40 transition"
                      onClick={() => { setPropActiva(p); setVista('danos'); }}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-display font-bold text-base">{p.nombre}</h3>
                          {p.direccion && <p className="text-[#737373] text-xs mt-0.5">{p.direccion}</p>}
                        </div>
                        <span className="text-2xl">🏠</span>
                      </div>
                      <div className="flex gap-3 text-xs text-[#737373]">
                        <span>{areasProp} áreas</span>
                        {danosProp > 0 && <span className="text-rose-400 font-semibold">{danosProp} daños activos</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PROPIEDADES */}
        {vista === 'propiedades' && (
          <div className="space-y-6 fade-up max-w-4xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-display font-bold text-2xl">Propiedades</h2>
                <p className="text-[#737373] text-sm">{propiedades.length} registradas</p>
              </div>
              <button onClick={() => setModalProp(true)} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition">+ Nueva</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {propiedades.map(p => (
                <div key={p.id} className={`bg-[#1a1a1a] border rounded-2xl p-5 transition ${propActiva?.id === p.id ? 'border-orange-500/50' : 'border-[#2a2a2a] hover:border-[#3a3a3a]'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-display font-bold text-base">{p.nombre}</h3>
                      {p.direccion && <p className="text-[#737373] text-xs mt-0.5">{p.direccion}</p>}
                    </div>
                    <button onClick={() => confirmar('Eliminar propiedad', `¿Eliminar "${p.nombre}"?`, async () => { await eliminarPropiedad(p.id); toast('Propiedad eliminada', 'info'); if (propActiva?.id === p.id) setPropActiva(null); })}
                      className="text-[#404040] hover:text-rose-400 transition text-sm">🗑</button>
                  </div>

                  {/* Áreas */}
                  <div className="space-y-1.5 mb-3">
                    {areas.filter(a => a.propiedad_id === p.id).map(a => (
                      <div key={a.id} className={`flex justify-between items-center px-3 py-1.5 rounded-lg text-xs ${areaActiva?.id === a.id ? 'bg-orange-500/20 text-orange-300' : 'bg-[#0f0f0f] text-[#aaa]'}`}
                        onClick={() => { setPropActiva(p); setAreaActiva(a); }}>
                        <span className="cursor-pointer">{a.tipo} — {a.nombre}</span>
                        <button onClick={e => { e.stopPropagation(); confirmar('Eliminar área', `¿Eliminar "${a.nombre}"?`, async () => { await eliminarArea(a.id); toast('Área eliminada', 'info'); }); }}
                          className="text-[#404040] hover:text-rose-400 transition ml-2">✕</button>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => { setPropActiva(p); setModalArea(true); }}
                    className="w-full border border-dashed border-[#2a2a2a] hover:border-orange-500/40 text-[#737373] hover:text-orange-400 text-xs py-2 rounded-xl transition">
                    + Agregar área
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DAÑOS */}
        {vista === 'danos' && (
          <div className="space-y-6 fade-up max-w-4xl">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="font-display font-bold text-2xl">Daños y Reparaciones</h2>
                <p className="text-[#737373] text-sm">{danosPendientes} pendientes</p>
              </div>
              <div className="flex gap-2">
                <select value={propActiva?.id || ''} onChange={e => setPropActiva(propiedades.find(p => p.id === e.target.value) || null)}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition">
                  <option value="">Todas las propiedades</option>
                  {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <button onClick={() => setModalDano(true)} disabled={propiedades.length === 0}
                  className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-sm transition">+ Nuevo</button>
              </div>
            </div>

            <div className="space-y-3">
              {(propActiva ? danosDeProp : danos).map(d => (
                <div key={d.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{d.titulo}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${COLOR_PRIO[d.prioridad]}`}>{d.prioridad}</span>
                    </div>
                    {d.descripcion && <p className="text-[#737373] text-xs mb-2">{d.descripcion}</p>}
                    <div className="flex gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${COLOR_ESTADO[d.estado]}`}>{d.estado}</span>
                      {d.costo_estimado && <span className="text-[10px] text-[#737373] bg-[#0f0f0f] px-2 py-1 rounded-lg">S/{d.costo_estimado}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <select value={d.estado} onChange={async e => { await actualizarEstadoDano(d.id, e.target.value as EstadoDano); toast('Estado actualizado', 'ok'); }}
                      className="bg-[#0f0f0f] border border-[#2a2a2a] text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-orange-500 transition">
                      <option>Pendiente</option><option>En progreso</option><option>Resuelto</option>
                    </select>
                    <button onClick={() => confirmar('Eliminar daño', `¿Eliminar "${d.titulo}"?`, async () => { await eliminarDano(d.id); toast('Daño eliminado', 'info'); })}
                      className="text-[#404040] hover:text-rose-400 transition px-2">🗑</button>
                  </div>
                </div>
              ))}
              {(propActiva ? danosDeProp : danos).length === 0 && (
                <div className="text-center py-12 text-[#737373] text-sm">Sin daños registrados 🎉</div>
              )}
            </div>
          </div>
        )}

        {/* INVENTARIO */}
        {vista === 'inventario' && (
          <div className="space-y-6 fade-up max-w-4xl">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="font-display font-bold text-2xl">Inventario</h2>
                <p className="text-[#737373] text-sm">{itemsBajos > 0 ? `⚠️ ${itemsBajos} ítems con stock bajo` : 'Todo en orden'}</p>
              </div>
              <div className="flex gap-2">
                <select value={propActiva?.id || ''} onChange={e => setPropActiva(propiedades.find(p => p.id === e.target.value) || null)}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition">
                  <option value="">Todas</option>
                  {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <button onClick={() => setModalItem(true)} disabled={propiedades.length === 0}
                  className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-sm transition">+ Agregar</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(propActiva ? inventario.filter(i => i.propiedad_id === propActiva.id) : inventario).map(item => {
                const bajo = item.cantidad <= item.cantidad_minima;
                return (
                  <div key={item.id} className={`bg-[#1a1a1a] border rounded-2xl p-4 ${bajo ? 'border-amber-500/40' : 'border-[#2a2a2a]'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">{item.producto}</h3>
                        <span className="text-[10px] text-[#737373] bg-[#0f0f0f] px-2 py-0.5 rounded mt-1 inline-block">{item.categoria}</span>
                      </div>
                      {bajo && <span className="text-amber-400 text-xs font-bold">⚠️ Bajo</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => actualizarCantidad(item.id, Math.max(0, item.cantidad - 1))}
                          className="w-7 h-7 bg-[#2a2a2a] hover:bg-[#333] rounded-lg text-sm font-bold transition">−</button>
                        <span className={`text-lg font-display font-bold w-8 text-center ${bajo ? 'text-amber-400' : 'text-white'}`}>{item.cantidad}</span>
                        <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                          className="w-7 h-7 bg-[#2a2a2a] hover:bg-[#333] rounded-lg text-sm font-bold transition">+</button>
                      </div>
                      <button onClick={() => confirmar('Eliminar ítem', `¿Eliminar "${item.producto}"?`, async () => { await eliminarItem(item.id); toast('Ítem eliminado', 'info'); })}
                        className="text-[#404040] hover:text-rose-400 transition text-sm">🗑</button>
                    </div>
                    <p className="text-[10px] text-[#737373] mt-2">Mínimo: {item.cantidad_minima}</p>
                  </div>
                );
              })}
              {(propActiva ? inventario.filter(i => i.propiedad_id === propActiva.id) : inventario).length === 0 && (
                <p className="text-[#737373] text-sm italic col-span-full text-center py-12">Sin ítems en inventario.</p>
              )}
            </div>
          </div>
        )}

        {/* LIMPIEZA */}
        {vista === 'limpieza' && (
          <div className="space-y-6 fade-up max-w-3xl">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="font-display font-bold text-2xl">Tareas de Limpieza</h2>
                <p className="text-[#737373] text-sm">{tareasHoy} pendientes</p>
              </div>
              <div className="flex gap-2">
                <select value={propActiva?.id || ''} onChange={e => setPropActiva(propiedades.find(p => p.id === e.target.value) || null)}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition">
                  <option value="">Todas</option>
                  {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <button onClick={() => setModalTarea(true)} disabled={propiedades.length === 0}
                  className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-sm transition">+ Nueva</button>
              </div>
            </div>

            <div className="space-y-3">
              {(propActiva ? tareas.filter(t => t.propiedad_id === propActiva.id) : tareas).map(t => (
                <div key={t.id} className={`bg-[#1a1a1a] border rounded-2xl p-4 flex items-center gap-4 transition ${t.completada ? 'border-emerald-500/20 opacity-60' : 'border-[#2a2a2a]'}`}>
                  <button onClick={async () => { await toggleTarea(t.id, !t.completada); toast(t.completada ? 'Tarea pendiente' : 'Tarea completada ✓', 'ok'); }}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${t.completada ? 'bg-emerald-500 border-emerald-500' : 'border-[#404040] hover:border-orange-500'}`}>
                    {t.completada && <span className="text-white text-xs font-bold">✓</span>}
                  </button>
                  <div className="flex-1">
                    <h3 className={`text-sm font-semibold ${t.completada ? 'line-through text-[#737373]' : ''}`}>{t.titulo}</h3>
                    <span className="text-[10px] text-[#737373] bg-[#0f0f0f] px-2 py-0.5 rounded mt-1 inline-block">{t.frecuencia}</span>
                  </div>
                  <button onClick={() => confirmar('Eliminar tarea', `¿Eliminar "${t.titulo}"?`, async () => { await eliminarTarea(t.id); toast('Tarea eliminada', 'info'); })}
                    className="text-[#404040] hover:text-rose-400 transition text-sm">🗑</button>
                </div>
              ))}
              {(propActiva ? tareas.filter(t => t.propiedad_id === propActiva.id) : tareas).length === 0 && (
                <p className="text-[#737373] text-sm italic text-center py-12">Sin tareas registradas.</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── MODALES ── */}

      {/* Modal Propiedad */}
      {modalProp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 fade-up">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display font-bold text-lg">Nueva Propiedad</h3>
              <button onClick={() => setModalProp(false)} className="text-[#737373] hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Nombre *</label>
                <input value={fNombreProp} onChange={e => setFNombreProp(e.target.value)} placeholder="Mi casa, Departamento 201..."
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Dirección</label>
                <input value={fDirProp} onChange={e => setFDirProp(e.target.value)} placeholder="Jr. Las Flores 123, Lima"
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalProp(false)} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-[#aaa] font-semibold py-2.5 rounded-xl text-sm transition">Cancelar</button>
                <button onClick={guardarPropiedad} className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 rounded-xl text-sm transition">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Área */}
      {modalArea && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 fade-up">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display font-bold text-lg">Nueva Área</h3>
              <button onClick={() => setModalArea(false)} className="text-[#737373] hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Tipo</label>
                <select value={fTipoArea} onChange={e => setFTipoArea(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500 transition">
                  {TIPOS_AREA.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Nombre *</label>
                <input value={fNombreArea} onChange={e => setFNombreArea(e.target.value)} placeholder="Sala principal, Baño 1..."
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalArea(false)} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-[#aaa] font-semibold py-2.5 rounded-xl text-sm transition">Cancelar</button>
                <button onClick={guardarArea} className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 rounded-xl text-sm transition">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Daño */}
      {modalDano && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 fade-up">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display font-bold text-lg">Registrar Daño</h3>
              <button onClick={() => setModalDano(false)} className="text-[#737373] hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Propiedad</label>
                <select value={propActiva?.id || ''} onChange={e => setPropActiva(propiedades.find(p => p.id === e.target.value) || null)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500 transition">
                  {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Título *</label>
                <input value={fTituloDano} onChange={e => setFTituloDano(e.target.value)} placeholder="Gotera en techo, Puerta rota..."
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Descripción</label>
                <textarea value={fDescDano} onChange={e => setFDescDano(e.target.value)} rows={2} placeholder="Detalles del problema..."
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Prioridad</label>
                  <select value={fPrioDano} onChange={e => setFPrioDano(e.target.value as PrioridadDano)}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500 transition">
                    <option>Baja</option><option>Media</option><option>Alta</option><option>Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Costo est. (S/)</label>
                  <input type="number" value={fCostoDano} onChange={e => setFCostoDano(e.target.value)} placeholder="0.00"
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalDano(false)} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-[#aaa] font-semibold py-2.5 rounded-xl text-sm transition">Cancelar</button>
                <button onClick={guardarDano} className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 rounded-xl text-sm transition">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inventario */}
      {modalItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 fade-up">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display font-bold text-lg">Agregar Ítem</h3>
              <button onClick={() => setModalItem(false)} className="text-[#737373] hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Propiedad</label>
                <select value={propActiva?.id || ''} onChange={e => setPropActiva(propiedades.find(p => p.id === e.target.value) || null)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500 transition">
                  {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Producto *</label>
                <input value={fProducto} onChange={e => setFProducto(e.target.value)} placeholder="Foco LED, Llave inglesa..."
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Categoría</label>
                <select value={fCategoria} onChange={e => setFCategoria(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500 transition">
                  {CATS_INV.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Cantidad</label>
                  <input type="number" value={fCantidad} onChange={e => setFCantidad(e.target.value)} min="0"
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Stock mínimo</label>
                  <input type="number" value={fCantMin} onChange={e => setFCantMin(e.target.value)} min="0"
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalItem(false)} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-[#aaa] font-semibold py-2.5 rounded-xl text-sm transition">Cancelar</button>
                <button onClick={guardarItem} className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 rounded-xl text-sm transition">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tarea */}
      {modalTarea && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 fade-up">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display font-bold text-lg">Nueva Tarea</h3>
              <button onClick={() => setModalTarea(false)} className="text-[#737373] hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Propiedad</label>
                <select value={propActiva?.id || ''} onChange={e => setPropActiva(propiedades.find(p => p.id === e.target.value) || null)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500 transition">
                  {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Tarea *</label>
                <input value={fTituloTarea} onChange={e => setFTituloTarea(e.target.value)} placeholder="Limpiar cocina, Barrer jardín..."
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#737373] mb-1.5">Frecuencia</label>
                <select value={fFrecuencia} onChange={e => setFFrecuencia(e.target.value as FrecuenciaLimpieza)}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500 transition">
                  <option>Diaria</option><option>Semanal</option><option>Mensual</option><option>Anual</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalTarea(false)} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-[#aaa] font-semibold py-2.5 rounded-xl text-sm transition">Cancelar</button>
                <button onClick={guardarTarea} className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 rounded-xl text-sm transition">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
