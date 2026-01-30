import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  DollarSign, 
  History, 
  Users, 
  Settings,
  Play
} from 'lucide-react';
import { usePayrollConnection } from '@/hooks/usePayrollConnection';
import { PayrollProviderSelector } from '@/components/dashboard/payroll/PayrollProviderSelector';
import { PayrollConnectionCard } from '@/components/dashboard/payroll/PayrollConnectionCard';
import { PayrollHistoryTable } from '@/components/dashboard/payroll/PayrollHistoryTable';
import { EmployeePayrollList } from '@/components/dashboard/payroll/EmployeePayrollList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Payroll() {
  const { connection, isLoading, isConnected } = usePayrollConnection();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  // If not connected, show provider selector
  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Payroll</h1>
            <p className="text-muted-foreground">
              Connect a payroll provider to manage employee payments and taxes.
            </p>
          </div>
          <PayrollProviderSelector />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payroll</h1>
            <p className="text-muted-foreground">
              Manage employee compensation, run payroll, and view reports.
            </p>
          </div>
        </div>

        <Tabs defaultValue="run" className="space-y-6">
          <TabsList>
            <TabsTrigger value="run" className="flex items-center gap-1.5">
              <Play className="h-4 w-4" />
              Run Payroll
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="run">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Run Payroll
                </CardTitle>
                <CardDescription>
                  Create and submit a new payroll run for your team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Payroll wizard coming soon</p>
                  <p className="text-sm">
                    The step-by-step payroll submission flow will be available once API keys are configured.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Payroll History
                </CardTitle>
                <CardDescription>
                  View past payroll runs and their details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PayrollHistoryTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <EmployeePayrollList />
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              <PayrollConnectionCard />
              
              <Card>
                <CardHeader>
                  <CardTitle>Pay Schedules</CardTitle>
                  <CardDescription>
                    Configure when employees get paid.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Pay schedule configuration will be synced from your payroll provider.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
