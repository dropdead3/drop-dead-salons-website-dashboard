import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Logo from '@/assets/drop-dead-logo.svg';
import { z } from 'zod';

const emailSchema = z.string().trim().email({ message: 'Please enter a valid email address' });

type AppRole = 'admin' | 'manager' | 'stylist' | 'receptionist' | 'assistant';

const roleOptions: { value: AppRole; label: string; description: string }[] = [
  { value: 'stylist', label: 'Stylist', description: 'Hair stylist or extension specialist' },
  { value: 'assistant', label: 'Assistant', description: 'Stylist assistant' },
  { value: 'receptionist', label: 'Receptionist', description: 'Front desk staff' },
  { value: 'manager', label: 'Manager', description: 'Salon manager or coach' },
  { value: 'admin', label: 'Admin', description: 'Full system access' },
];

export default function StaffLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AppRole>('stylist');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      setEmailError(emailValidation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Reset failed',
            description: error.message,
          });
        } else {
          toast({
            title: 'Check your email',
            description: 'We sent you a password reset link.',
          });
          setIsForgotPassword(false);
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Login failed',
            description: error.message,
          });
        } else {
          navigate(from, { replace: true });
        }
      } else {
        if (password !== confirmPassword) {
          toast({
            variant: 'destructive',
            title: 'Passwords do not match',
            description: 'Please make sure your passwords match.',
          });
          return;
        }
        const { error } = await signUp(email, password, fullName, role);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign up failed',
            description: error.message,
          });
        } else {
          toast({
            title: 'Account created',
            description: `Welcome! You've been registered as ${roleOptions.find(r => r.value === role)?.label}.`,
          });
          navigate('/dashboard', { replace: true });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Back link */}
      <div className="p-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to website
        </Link>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo */}
          <div className="text-center">
            <img 
              src={Logo} 
              alt="Drop Dead" 
              className="h-6 w-auto mx-auto mb-8"
            />
            <h1 className="font-display text-2xl tracking-wide">
              {isForgotPassword ? 'RESET PASSWORD' : isLogin ? 'STAFF LOGIN' : 'CREATE ACCOUNT'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-sans">
              {isForgotPassword
                ? 'Enter your email to receive a reset link'
                : isLogin 
                  ? 'Access your employee dashboard' 
                  : 'Use your preferred email for all employment software and apps'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && !isForgotPassword && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs uppercase tracking-wider">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required={!isLogin}
                    className="h-12 bg-card border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider">
                    Your Role
                  </Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)} required>
                    <SelectTrigger className="h-12 bg-card border-border">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                placeholder="you@dropdeadsalon.com"
                required
                className={`h-12 bg-card border-border ${emailError ? 'border-destructive' : ''}`}
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs uppercase tracking-wider">
                    Password
                  </Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="h-12 bg-card border-border pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {!isLogin && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="h-12 bg-card border-border pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {isLogin && !isForgotPassword && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsLogin(false)}
                  className="flex-1 h-12 font-display text-sm tracking-wide bg-secondary hover:bg-secondary/80 text-foreground border-2 border-foreground/20"
                >
                  SIGN UP
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 font-display text-sm tracking-wide"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isForgotPassword ? (
                  'SEND RESET LINK'
                ) : isLogin ? (
                  'SIGN IN'
                ) : (
                  'CREATE ACCOUNT'
                )}
              </Button>
            </div>
          </form>

          {/* Toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setIsLogin(!isLogin);
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-sans"
            >
              {isForgotPassword
                ? 'Back to sign in'
                : isLogin 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
