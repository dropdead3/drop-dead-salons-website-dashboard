import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Upload,
  Loader2,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Edit2,
  X,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WeekResource {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  week_id: string | null;
  assignment_id: string | null;
  display_order: number;
  is_active: boolean;
}

interface WeekResourcesManagerProps {
  weekId: string;
  resources: WeekResource[];
  onResourcesChange: () => void;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
    return ImageIcon;
  }
  return FileText;
};

const getFileTypeDisplay = (fileType: string): string => {
  if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
    return 'Image';
  }
  if (fileType === 'application/pdf' || fileType === 'pdf') {
    return 'PDF';
  }
  return fileType.toUpperCase();
};

export function WeekResourcesManager({ weekId, resources, onResourcesChange }: WeekResourcesManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingResource, setEditingResource] = useState<WeekResource | null>(null);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    file_url: '',
    file_type: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only images (JPG, PNG, GIF, WebP) and PDFs are allowed');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const fileName = `program-resources/${weekId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { error: uploadError } = await supabase.storage
      .from('proof-uploads')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error('Failed to upload file');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('proof-uploads')
      .getPublicUrl(fileName);

    setNewResource({
      ...newResource,
      file_url: urlData.publicUrl,
      file_type: fileExt,
      title: newResource.title || file.name.replace(/\.[^/.]+$/, ''),
    });

    setUploading(false);
    toast.success('File uploaded');
  };

  const handleAddResource = async () => {
    if (!newResource.title || !newResource.file_url) {
      toast.error('Title and file are required');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('program_resources')
      .insert({
        title: newResource.title,
        description: newResource.description || null,
        file_url: newResource.file_url,
        file_type: newResource.file_type,
        week_id: weekId,
        display_order: resources.length + 1,
        is_active: true,
      });

    if (error) {
      console.error('Error adding resource:', error);
      toast.error('Failed to add resource');
    } else {
      toast.success('Resource added');
      setNewResource({ title: '', description: '', file_url: '', file_type: '' });
      setIsAdding(false);
      onResourcesChange();
    }

    setSaving(false);
  };

  const handleUpdateResource = async () => {
    if (!editingResource) return;

    setSaving(true);

    const { error } = await supabase
      .from('program_resources')
      .update({
        title: editingResource.title,
        description: editingResource.description,
      })
      .eq('id', editingResource.id);

    if (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
    } else {
      toast.success('Resource updated');
      setEditingResource(null);
      onResourcesChange();
    }

    setSaving(false);
  };

  const handleDeleteResource = async (id: string) => {
    const { error } = await supabase
      .from('program_resources')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } else {
      toast.success('Resource deleted');
      onResourcesChange();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('program_resources')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update resource');
    } else {
      onResourcesChange();
    }
  };

  const weekResources = resources.filter(r => r.week_id === weekId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          Resources & Assets
          {weekResources.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{weekResources.length}</Badge>
          )}
        </h4>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setIsAdding(true)} 
          disabled={isAdding}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Resource
        </Button>
      </div>

      {/* Add Resource Form */}
      {isAdding && (
        <div className="p-4 border rounded-lg bg-primary/5 border-primary/20 space-y-4">
          <div className="space-y-2">
            <Label>Upload File (Image or PDF)</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                onChange={handleFileUpload}
                className="flex-1"
                disabled={uploading}
              />
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            {newResource.file_url && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="w-4 h-4" />
                File uploaded successfully
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                placeholder="Resource title..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                placeholder="Brief description..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setIsAdding(false);
                setNewResource({ title: '', description: '', file_url: '', file_type: '' });
              }}
            >
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleAddResource} 
              disabled={saving || !newResource.file_url || !newResource.title}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              Save Resource
            </Button>
          </div>
        </div>
      )}

      {/* Resource List */}
      {weekResources.length > 0 ? (
        <div className="space-y-2">
          {weekResources.map((resource) => {
            const FileIcon = getFileIcon(resource.file_type);
            const isImage = resource.file_type.startsWith('image/') || 
              ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(resource.file_type);

            return (
              <div
                key={resource.id}
                className={`flex items-center gap-3 p-3 border rounded-lg bg-muted/30 ${!resource.is_active ? 'opacity-50' : ''}`}
              >
                {/* Thumbnail/Icon */}
                {isImage ? (
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                    <img 
                      src={resource.file_url} 
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <FileIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{resource.title}</p>
                  {resource.description && (
                    <p className="text-xs text-muted-foreground truncate">{resource.description}</p>
                  )}
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {getFileTypeDisplay(resource.file_type)}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <a
                    href={resource.file_url}
                    download
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <Switch
                    checked={resource.is_active}
                    onCheckedChange={(checked) => handleToggleActive(resource.id, checked)}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setEditingResource(resource)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{resource.title}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteResource(resource.id)} 
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      ) : !isAdding && (
        <p className="text-sm text-muted-foreground italic py-2">
          No resources added yet. Add images or PDFs for enrollees to view.
        </p>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingResource} onOpenChange={() => setEditingResource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          {editingResource && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingResource.title}
                  onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingResource.description || ''}
                  onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingResource(null)}>Cancel</Button>
            <Button onClick={handleUpdateResource} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
