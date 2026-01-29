import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Terminal, ArrowRight } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                <Terminal className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Platform Administration
            </h1>
            <p className="text-slate-400">
              Internal access for development and support teams
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </div>

          {/* Footer link */}
          <div className="text-center">
            <Link
              to="/staff-login"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm transition-colors"
            >
              Salon staff? Login here
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="py-6 text-center">
        <p className="text-slate-600 text-sm">
          © {new Date().getFullYear()} Platform Admin • Internal Use Only
        </p>
      </div>
    </div>
  );
}
