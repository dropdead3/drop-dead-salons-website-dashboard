import { useState } from 'react';
import { Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTeamChatSettings } from '@/hooks/team-chat/useTeamChatSettings';
import { ChannelPermissionsTab } from './settings/ChannelPermissionsTab';
import { DisplaySettingsTab } from './settings/DisplaySettingsTab';
import { MessagingPermissionsTab } from './settings/MessagingPermissionsTab';
import { AutoJoinRulesTab } from './settings/AutoJoinRulesTab';
import { SmartActionsSettingsTab } from './settings/SmartActionsSettingsTab';
import { WelcomeDMsTab } from './settings/WelcomeDMsTab';
import { TeamMembersTab } from './settings/TeamMembersTab';
import { Skeleton } from '@/components/ui/skeleton';

interface TeamChatAdminSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamChatAdminSettingsSheet({ open, onOpenChange }: TeamChatAdminSettingsSheetProps) {
  const { settings, isLoading, updateSettings } = useTeamChatSettings();
  const [activeTab, setActiveTab] = useState('channels');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Team Chat Settings
          </SheetTitle>
          <SheetDescription>
            Configure permissions, display options, and auto-join rules for your team chat
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="permissions">Perms</TabsTrigger>
              <TabsTrigger value="auto-join">Auto</TabsTrigger>
              <TabsTrigger value="welcome">Welcome</TabsTrigger>
              <TabsTrigger value="smart-actions">AI</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[calc(100vh-220px)] mt-4 pr-4">
              <TabsContent value="channels" className="mt-0">
                <ChannelPermissionsTab settings={settings} onUpdate={updateSettings} />
              </TabsContent>

              <TabsContent value="display" className="mt-0">
                <DisplaySettingsTab settings={settings} onUpdate={updateSettings} />
              </TabsContent>

              <TabsContent value="permissions" className="mt-0">
                <MessagingPermissionsTab settings={settings} onUpdate={updateSettings} />
              </TabsContent>

              <TabsContent value="auto-join" className="mt-0">
                <AutoJoinRulesTab />
              </TabsContent>

              <TabsContent value="welcome" className="mt-0">
                <WelcomeDMsTab settings={settings} onUpdate={updateSettings} />
              </TabsContent>

              <TabsContent value="smart-actions" className="mt-0">
                <SmartActionsSettingsTab settings={settings} onUpdate={updateSettings} />
              </TabsContent>

              <TabsContent value="team" className="mt-0">
                <TeamMembersTab />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Trigger button component for use in sidebar
export function TeamChatSettingsTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={onClick}
      title="Team Chat Settings"
    >
      <Settings className="h-4 w-4" />
    </Button>
  );
}
