import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Pencil,
  Trash2,
  Eye,
  Save,
  Loader2,
  Code,
  Variable,
  Plus,
} from 'lucide-react';
import {
  useEmailTemplates,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  EmailTemplate,
} from '@/hooks/useEmailTemplates';
import { cn } from '@/lib/utils';

export function EmailTemplatesManager() {
  const { data: templates, isLoading } = useEmailTemplates();
  const updateTemplate = useUpdateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    html_body: '',
    description: '',
    is_active: true,
  });

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject,
      html_body: template.html_body,
      description: template.description || '',
      is_active: template.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    await updateTemplate.mutateAsync({
      id: editingTemplate.id,
      updates: editForm,
    });
    setEditingTemplate(null);
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate.mutateAsync(id);
  };

  const renderPreviewHtml = (html: string, variables: string[]) => {
    let preview = html;
    variables.forEach((variable) => {
      const placeholder = `[Sample ${variable}]`;
      preview = preview.replace(new RegExp(`{{${variable}}}`, 'g'), placeholder);
    });
    return preview;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-sans">
          Customize email templates for automated notifications.
        </p>
      </div>

      {templates?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No email templates configured.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates?.map((template) => (
            <Card
              key={template.id}
              className={cn(!template.is_active && 'opacity-60')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{template.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {template.template_key}
                      </Badge>
                      {!template.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {template.description}
                      </p>
                    )}
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">
                      Subject: {template.subject}
                    </p>
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.variables.map((variable) => (
                          <Badge
                            key={variable}
                            variant="secondary"
                            className="text-xs font-mono"
                          >
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the "{template.name}" email
                            template. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Customize the email template. Use {`{{variable}}`} syntax for dynamic content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Label>Active</Label>
                <Switch
                  checked={editForm.is_active}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, is_active: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Brief description of when this email is sent..."
              />
            </div>

            {editingTemplate?.variables && editingTemplate.variables.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Variable className="w-4 h-4" />
                  <span className="text-sm font-medium">Available Variables</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {editingTemplate.variables.map((variable) => (
                    <Badge
                      key={variable}
                      variant="secondary"
                      className="text-xs font-mono cursor-pointer hover:bg-primary/20"
                      onClick={() => {
                        setEditForm({
                          ...editForm,
                          html_body: editForm.html_body + `{{${variable}}}`,
                        });
                      }}
                    >
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Tabs defaultValue="code">
              <TabsList>
                <TabsTrigger value="code" className="gap-2">
                  <Code className="w-4 h-4" />
                  HTML Code
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="code">
                <Textarea
                  value={editForm.html_body}
                  onChange={(e) =>
                    setEditForm({ ...editForm, html_body: e.target.value })
                  }
                  className="font-mono text-xs min-h-[400px]"
                  placeholder="HTML email body..."
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="border rounded-lg p-4 bg-white min-h-[400px]">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderPreviewHtml(
                        editForm.html_body,
                        editingTemplate?.variables || []
                      ),
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name} Preview</DialogTitle>
            <DialogDescription>
              Subject: {previewTemplate?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            {previewTemplate && (
              <div
                dangerouslySetInnerHTML={{
                  __html: renderPreviewHtml(
                    previewTemplate.html_body,
                    previewTemplate.variables
                  ),
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
