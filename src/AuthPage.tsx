import { useState } from 'react';

interface Props {
  onIniciarSesion: (email: string, password: string) => Promise<void>;
  onRegistrar:     (email: string, password: string) => Promise<void>;
}

export default function AuthPage({ onIniciarSesion, onRegistrar }: Props) {
  const [modo,        setModo]        = useState<'login' | 'registro'>('login');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [verPass,     setVerPass]     = useState(false);
  const [error,       setError]       = useState('');
  const [ok,          setOk]          = useState('');
  const [cargando,    setCargando]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setOk('');
    if (!email.trim() || !password.trim()) { setError('Completa todos los campos.'); return; }
    if (password.length < 6) { setError('Mínimo 6 caracteres.'); return; }
    setCargando(true);
    try {
      if (modo === 'login') {
        await onIniciarSesion(email.trim(), password);
      } else {
        await onRegistrar(email.trim(), password);
        setOk('¡Cuenta creada! Ahora inicia sesión.');
        setModo('login'); setEmail(''); setPassword('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg.includes('Invalid login'))       setError('Email o contraseña incorrectos.');
      else if (msg.includes('already'))        setError('Ya existe una cuenta con ese email.');
      else if (msg.includes('rate limit'))     setError('Demasiados intentos. Espera unos minutos.');
      else setError(msg);
    } finally { setCargando(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      {/* Fondo con textura */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, #f97316 40px, #f97316 41px),
                          repeating-linear-gradient(90deg, transparent, transparent 40px, #f97316 40px, #f97316 41px)`
      }} />

      <div className="relative w-full max-w-sm fade-up">
        {/* Logo */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">🔧</span>
            </div>
            <h1 className="font-display text-3xl font-800 text-white tracking-tight">FIXER</h1>
          </div>
          <p className="text-[#737373] text-sm font-light">Gestión inteligente del hogar</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex mb-6 bg-[#0f0f0f] rounded-xl p-1 gap-1">
            {(['login','registro'] as const).map(m => (
              <button key={m} onClick={() => { setModo(m); setError(''); setOk(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  modo === m ? 'bg-orange-500 text-white' : 'text-[#737373] hover:text-white'
                }`}>
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#737373] mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none transition" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#737373] mb-1.5">Contraseña</label>
              <div className="relative">
                <input type={verPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : '••••••••'}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 pr-11 text-sm focus:border-orange-500 outline-none transition" />
                <button type="button" onClick={() => setVerPass(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white transition text-base">
                  {verPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && <div className="bg-rose-950/40 border border-rose-800/40 text-rose-400 text-xs rounded-xl px-4 py-2.5">❌ {error}</div>}
            {ok    && <div className="bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs rounded-xl px-4 py-2.5">✅ {ok}</div>}

            <button type="submit" disabled={cargando}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition mt-2 shadow-lg shadow-orange-500/20">
              {cargando ? 'Cargando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#404040] text-xs mt-6">Fixer © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
