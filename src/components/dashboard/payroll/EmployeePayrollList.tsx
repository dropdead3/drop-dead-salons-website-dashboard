import { useState } from 'react';
import { 
  Users, 
  Plus, 
  MoreVertical, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Trash2,
  Edit,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  useEmployeePayrollSettings, 
  EmployeePayrollSettings,
  PayType 
} from '@/hooks/useEmployeePayrollSettings';
import { EmployeePayrollForm } from './EmployeePayrollForm';

const payTypeLabels: Record<PayType, string> = {
  hourly: 'Hourly',
  salary: 'Salary',
  commission: 'Commission Only',
  hourly_plus_commission: 'Hourly + Commission',
  salary_plus_commission: 'Salary + Commission',
};

const directDepositStatusConfig = {
  not_started: {
    label: 'Not Started',
    icon: AlertCircle,
    className: 'text-slate-500',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'text-amber-500',
  },
  verified: {
    label: 'Verified',
    icon: CheckCircle,
    className: 'text-green-500',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    className: 'text-red-500',
  },
};

function formatCurrency(amount: number | null): string {
  if (amount === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

interface EmployeeRowProps {
  settings: EmployeePayrollSettings;
  onEdit: (settings: EmployeePayrollSettings) => void;
  onToggleActive: (employeeId: string, isActive: boolean) => void;
  onDelete: (employeeId: string) => void;
}

function EmployeeRow({ settings, onEdit, onToggleActive, onDelete }: EmployeeRowProps) {
  const employee = settings.employee;
  const ddStatus = directDepositStatusConfig[settings.direct_deposit_status];
  const DDIcon = ddStatus.icon;

  const getPayDisplay = () => {
    switch (settings.pay_type) {
      case 'hourly':
      case 'hourly_plus_commission':
        return `${formatCurrency(settings.hourly_rate)}/hr`;
      case 'salary':
      case 'salary_plus_commission':
        return `${formatCurrency(settings.salary_amount)}/yr`;
      case 'commission':
        return 'Commission';
      default:
        return '-';
    }
  };

  return (
    <div className={cn(
      'flex items-center justify-between p-4 border-b last:border-b-0',
      !settings.is_payroll_active && 'opacity-50 bg-muted/30'
    )}>
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={employee?.photo_url || undefined} />
          <AvatarFallback>
            {employee?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {employee?.display_name || employee?.full_name}
            </span>
            {!settings.is_payroll_active && (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-3">
            <span>{payTypeLabels[settings.pay_type]}</span>
            <span>•</span>
            <span>{getPayDisplay()}</span>
            {settings.commission_enabled && (
              <>
                <span>•</span>
                <span className="text-violet-600">+ Commission</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Direct Deposit Status */}
        <div className={cn('flex items-center gap-1 text-sm', ddStatus.className)}>
          <DDIcon className="h-4 w-4" />
          <span>{ddStatus.label}</span>
        </div>

        {/* Active Toggle */}
        <Switch
          checked={settings.is_payroll_active}
          onCheckedChange={(checked) => onToggleActive(settings.employee_id, checked)}
        />

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(settings)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(settings.employee_id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove from Payroll
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function EmployeePayrollList() {
  const { 
    employeeSettings, 
    isLoading, 
    togglePayrollActive,
    deleteSettings,
  } = useEmployeePayrollSettings();
  
  const [editingEmployee, setEditingEmployee] = useState<EmployeePayrollSettings | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employees
            <Badge variant="secondary">{employeeSettings.length}</Badge>
          </CardTitle>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {employeeSettings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No employees in payroll</p>
              <p className="text-sm">Add employees to start managing their compensation.</p>
              <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Employee
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {employeeSettings.map((settings) => (
                <EmployeeRow
                  key={settings.id}
                  settings={settings}
                  onEdit={setEditingEmployee}
                  onToggleActive={(employeeId, isActive) => togglePayrollActive({ employeeId, isActive })}
                  onDelete={(employeeId) => deleteSettings(employeeId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee to Payroll</DialogTitle>
            <DialogDescription>
              Set up payroll settings for a team member.
            </DialogDescription>
          </DialogHeader>
          <EmployeePayrollForm 
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payroll Settings</DialogTitle>
            <DialogDescription>
              Update compensation settings for {editingEmployee?.employee?.full_name}.
            </DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <EmployeePayrollForm 
              existingSettings={editingEmployee}
              onSuccess={() => setEditingEmployee(null)}
              onCancel={() => setEditingEmployee(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
