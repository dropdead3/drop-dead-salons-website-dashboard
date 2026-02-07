import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { ArrowLeft, Video, UserPlus, BarChart3 } from 'lucide-react';
import { VideoLibraryManager } from '@/components/training/VideoLibraryManager';
import { IndividualAssignments } from '@/components/training/IndividualAssignments';
import { TeamProgressDashboard } from '@/components/training/TeamProgressDashboard';

export default function TrainingHub() {
  const [activeTab, setActiveTab] = useState('library');

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
            <Link to="/dashboard/admin/management">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl lg:text-4xl">Training Hub</h1>
            <p className="text-muted-foreground mt-1">
              Manage training library, assignments, and track team progress
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="library" className="gap-2">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-6">
            <VideoLibraryManager />
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            <IndividualAssignments />
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <TeamProgressDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
