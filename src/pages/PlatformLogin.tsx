import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Terminal, ArrowRight, Sparkles } from 'lucide-react';
import { PlatformButton } from '@/components/platform/ui/PlatformButton';
import { PlatformInput } from '@/components/platform/ui/PlatformInput';
import { PlatformLabel } from '@/components/platform/ui/PlatformLabel';
import { PlatformCard } from '@/components/platform/ui/PlatformCard';

export default function PlatformLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  // Check if already logged in as platform user
  useEffect(() => {
    const checkPlatformAccess = async () => {
      if (user) {
        setCheckingAccess(true);
        const { data } = await supabase
          .from('platform_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1);

        if (data && data.length > 0) {
          navigate('/dashboard/platform/overview', { replace: true });
        }
        setCheckingAccess(false);
      }
    };

    checkPlatformAccess();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: 'Login failed',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check if user has platform role
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { data: roles } = await supabase
          .from('platform_roles')
          .select('role')
          .eq('user_id', session.session.user.id)
          .limit(1);

        if (!roles || roles.length === 0) {
          // Sign out and show error
          await supabase.auth.signOut();
          toast({
            title: 'Access Denied',
            description: 'You do not have platform access. Contact your administrator.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        toast({
          title: 'Welcome back',
          description: 'Redirecting to Platform Admin Hub...',
        });

        navigate('/dashboard/platform/overview', { replace: true });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen platform-gradient-radial platform-theme flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          <p className="text-slate-400 text-sm">Checking access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen platform-gradient-radial platform-theme flex flex-col relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-right glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl platform-animate-float" />
        {/* Bottom-left glow */}
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" style={{ animationDelay: '3s' }} />
        {/* Center accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-violet-500/5 via-transparent to-purple-500/5 rounded-full blur-3xl" />
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl shadow-lg platform-button-glow">
                  <Terminal className="w-8 h-8 text-white" />
                </div>
                {/* Decorative sparkle */}
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-medium text-white tracking-tight">
              Platform Administration
            </h1>
            <p className="text-slate-400">
              Internal access for development and support teams
            </p>
          </div>

          {/* Login Form Card */}
          <PlatformCard variant="glass" glow className="p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <PlatformLabel htmlFor="email">Email</PlatformLabel>
                <PlatformInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                />
              </div>

              <div className="space-y-2">
                <PlatformLabel htmlFor="password">Password</PlatformLabel>
                <PlatformInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <PlatformButton
                type="submit"
                loading={loading}
                variant="glow"
                className="w-full h-12 text-base"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </PlatformButton>
            </form>
          </PlatformCard>

          {/* Footer link */}
          <div className="text-center">
            <Link
              to="/staff-login"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-violet-400 text-sm transition-colors group"
            >
              Salon staff? Login here
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="py-6 text-center relative z-10">
        <p className="text-slate-600 text-sm">
          © {new Date().getFullYear()} Platform Admin • Internal Use Only
        </p>
      </div>
    </div>
  );
}
