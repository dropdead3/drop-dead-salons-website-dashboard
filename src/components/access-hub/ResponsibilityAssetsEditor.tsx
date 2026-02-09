import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Link, FileText, CheckSquare, GraduationCap } from 'lucide-react';
import { useResponsibilityAssets, useCreateResponsibilityAsset, useDeleteResponsibilityAsset } from '@/hooks/useResponsibilities';
import { cn } from '@/lib/utils';

interface ResponsibilityAssetsEditorProps {
  responsibilityId: string;
  canManage: boolean;
}

const ASSET_TYPE_ICONS: Record<string, typeof Link> = {
  link: Link,
  document: FileText,
  checklist: CheckSquare,
  training: GraduationCap,
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  link: 'External Link',
  document: 'Document',
  checklist: 'Checklist',
  training: 'Training Resource',
};

export function ResponsibilityAssetsEditor({ responsibilityId, canManage }: ResponsibilityAssetsEditorProps) {
  const { data: assets = [], isLoading } = useResponsibilityAssets(responsibilityId);
  const createAsset = useCreateResponsibilityAsset();
  const deleteAsset = useDeleteResponsibilityAsset();
  const [isAdding, setIsAdding] = useState(false);
  const [newAsset, setNewAsset] = useState({ title: '', type: 'link', url: '' });

  const handleAdd = () => {
    const content: Record<string, any> = {};
    if (newAsset.type === 'link') content.url = newAsset.url;
    if (newAsset.type === 'training') content.url = newAsset.url;

    createAsset.mutate(
      { responsibility_id: responsibilityId, title: newAsset.title, type: newAsset.type, content },
      { onSuccess: () => { setIsAdding(false); setNewAsset({ title: '', type: 'link', url: '' }); } }
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-2">
      {assets.length === 0 && !isAdding && (
        <p className="text-xs text-muted-foreground py-2">No helper assets yet.</p>
      )}

      {assets.map(asset => {
        const Icon = ASSET_TYPE_ICONS[asset.type] || FileText;
        return (
          <div key={asset.id} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md bg-muted/50">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate">{asset.title}</span>
            {asset.content && (asset.content as any).url && (
              <a href={(asset.content as any).url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">
                Open
              </a>
            )}
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => deleteAsset.mutate({ id: asset.id, responsibilityId })}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      })}

      {isAdding ? (
        <Card className="border-dashed">
          <CardContent className="p-3 space-y-2">
            <Input
              placeholder="Asset title"
              value={newAsset.title}
              onChange={(e) => setNewAsset(prev => ({ ...prev, title: e.target.value }))}
              className="h-8 text-sm"
            />
            <Select value={newAsset.type} onValueChange={(v) => setNewAsset(prev => ({ ...prev, type: v }))}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(newAsset.type === 'link' || newAsset.type === 'training') && (
              <Input
                placeholder="URL"
                value={newAsset.url}
                onChange={(e) => setNewAsset(prev => ({ ...prev, url: e.target.value }))}
                className="h-8 text-sm"
              />
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={!newAsset.title.trim() || createAsset.isPending}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : canManage ? (
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setIsAdding(true)}>
          <Plus className="h-3 w-3" /> Add Asset
        </Button>
      ) : null}
    </div>
  );
}
