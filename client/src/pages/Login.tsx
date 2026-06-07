import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, MapPin, Home, MessageSquare, Zap, BarChart3, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';

const LOGO = 'https://inmo.com.py/wp-content/uploads/2024/05/inmoLogo2.000a43bf-1.png';

function DotParticles() {
  const dots = useRef(
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    })),
  ).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={
            visible
              ? {
                  opacity: [0.15, 0.35, 0.15],
                  scale: 1,
                }
              : {}
          }
          transition={{
            delay: dot.delay,
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-primary/40" />
          </div>
        </motion.div>
      ))}
    </>
  );
}

function FloatingBlob({ className, ...props }: { className?: string; animate?: any; transition?: any }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className ?? ''}`}
      {...props}
    />
  );
}

// ─── MOBILE VERSION ───────────────────────────────────────

function MobileLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background: 'linear-gradient(180deg, hsl(353 72% 97%) 0%, #fff 40%, #fff 100%)',
      }}
    >
      {/* Logo + title */}
      <motion.div
        className="flex flex-col items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img src={LOGO} alt="Inmo" className="h-10 mb-3" />
        <h1 className="text-xl font-display font-bold">CRM Inmobiliario</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Ingresá para continuar</p>
      </motion.div>

      {/* Card */}
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="rounded-3xl shadow-xl border-border/40">
          <CardContent className="p-6 pt-8">
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {error && (
                <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-muted/40 border-0 rounded-xl focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10 bg-muted/40 border-0 rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="gradient-brand w-full h-12 rounded-xl text-white text-sm font-semibold shadow-glow-primary hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Ingresando...
                  </span>
                ) : (
                  'Ingresar'
                )}
              </button>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── DESKTOP VERSION ─────────────────────────────────────

function DesktopLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-[48%] flex flex-col justify-between p-12 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #fff 0%, hsl(353 72% 97%) 50%, hsl(353 72% 94%) 100%)',
        }}
      >
        {/* Blobs */}
        <FloatingBlob
          className="top-32 -left-16 h-64 w-64 bg-primary/5"
          animate={{ y: [-8, 8, -8], x: [-4, 4, -4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <FloatingBlob
          className="bottom-32 right-8 h-48 w-48 bg-primary/8"
          animate={{ y: [6, -6, 6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <FloatingBlob
          className="top-1/2 left-1/3 h-32 w-32 bg-primary/4"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Particles */}
        <DotParticles />

        {/* Content */}
        <div className="relative z-10">
          <motion.img
            src={LOGO}
            alt="Inmo"
            className="h-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </div>

        <div className="relative z-10 space-y-6 pb-12">
          <motion.p
            className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            CRM Inmobiliario
          </motion.p>

          <motion.h1
            className="text-4xl font-display font-bold leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Gestioná tus leads
            <br />
            <span className="text-gradient">con inteligencia.</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-sm text-muted-foreground/70 leading-relaxed max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
          >
            Centralizá leads de WhatsApp, asignalos automáticamente por zona
            y seguí cada conversación desde un solo lugar.
          </motion.p>

          {/* Feature badges */}
          <motion.div
            className="flex flex-wrap gap-x-6 gap-y-2 pt-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.75 }}
          >
            {[
              { icon: MessageSquare, label: 'Chat en tiempo real' },
              { icon: Zap, label: 'Auto-asignación' },
              { icon: BarChart3, label: 'Dashboard inteligente' },
              { icon: Users, label: 'Equipo disponible' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  className="flex items-center gap-1.5 text-muted-foreground/60 text-xs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.85 + i * 0.08 }}
                >
                  <Icon className="h-3 w-3" />
                  {item.label}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <motion.p
          className="relative z-10 text-xs text-muted-foreground/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          INMO Loteamientos &mdash; CRM Comercial
        </motion.p>
      </motion.div>

      {/* ── RIGHT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1 flex items-center justify-center p-12 bg-background"
      >
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-10">
            <motion.h2
              className="text-2xl font-display font-bold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Accedé al sistema
            </motion.h2>
            <motion.p
              className="text-sm text-muted-foreground mt-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              Ingresá tus credenciales para continuar
            </motion.p>
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {error && (
              <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-background border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-10 bg-background border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-sm font-semibold gap-2 group"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-background border-t-transparent animate-spin" />
                  Ingresando...
                </span>
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground/40 pt-1">
              Demo: <span className="font-mono text-foreground/60">admin@inmo.com</span> /{' '}
              <span className="font-mono text-foreground/60">admin123</span>
            </p>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}

// ─── EXPORT ──────────────────────────────────────────────

export function LoginPage() {
  const isMobile = useIsMobile();

  if (isMobile) return <MobileLogin />;
  return <DesktopLogin />;
}
