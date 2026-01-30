import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { PlatformPageContainer } from '@/components/platform/ui/PlatformPageContainer';
import { PlatformButton } from '@/components/platform/ui/PlatformButton';
import { PlatformPermissionsMatrix } from '@/components/platform/PlatformPermissionsMatrix';

export default function PlatformPermissions() {
  const navigate = useNavigate();

  return (
    <PlatformPageContainer className="space-y-8">
      {/* Header */}
      <div>
        <PlatformButton
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/platform/settings')}
          className="text-slate-400 hover:text-white mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Settings
        </PlatformButton>
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-500/20">
            <Shield className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-white">Permission Configurator</h1>
            <p className="text-slate-400 mt-1">
              Manage what each platform role can access and modify
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <PlatformPermissionsMatrix />
    </PlatformPageContainer>
  );
}
