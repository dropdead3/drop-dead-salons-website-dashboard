import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { ChatPermissionsTab } from '@/components/team-chat/settings/ChatPermissionsTab';

interface ChatPermissionsHubTabProps {
  canManage: boolean;
}

export function ChatPermissionsHubTab({ canManage }: ChatPermissionsHubTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Team Chat Permissions
          </CardTitle>
          <CardDescription>
            Control which roles can perform specific actions in Team Chat channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatPermissionsTab embedded />
        </CardContent>
      </Card>
    </div>
  );
}
