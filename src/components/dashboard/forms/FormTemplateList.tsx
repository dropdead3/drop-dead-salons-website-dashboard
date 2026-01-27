import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileCheck, 
  Camera, 
  ClipboardList, 
  FileText, 
  MoreVertical,
  Pencil,
  Eye,
  Trash2,
  Link2,
  Plus,
} from 'lucide-react';
import { useFormTemplates, useDeleteFormTemplate, type FormTemplate } from '@/hooks/useFormTemplates';
import { FormTemplateEditor } from './FormTemplateEditor';
import { FormPreviewDialog } from './FormPreviewDialog';
import { ServiceFormLinkDialog } from './ServiceFormLinkDialog';
import { Skeleton } from '@/components/ui/skeleton';

const FORM_TYPE_ICONS = {
  service_agreement: FileCheck,
  model_release: Camera,
  consultation: ClipboardList,
  custom: FileText,
} as const;

const FORM_TYPE_LABELS = {
  service_agreement: 'Service Agreement',
  model_release: 'Model Release',
  consultation: 'Consultation',
  custom: 'Custom',
} as const;

export function FormTemplateList() {
  const { data: templates, isLoading } = useFormTemplates();
  const deleteTemplate = useDeleteFormTemplate();
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);
  const [linkingTemplate, setLinkingTemplate] = useState<FormTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleEdit = (template: FormTemplate) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleNew = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteTemplate.mutateAsync(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {templates?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No form templates yet</p>
            <p className="text-sm">Create your first template to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates?.map((template) => {
            const Icon = FORM_TYPE_ICONS[template.form_type] || FileText;
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {template.version}
                          </Badge>
                          {!template.is_active && (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {FORM_TYPE_LABELS[template.form_type]}
                          {template.description && ` • ${template.description}`}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(template)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLinkingTemplate(template)}>
                          <Link2 className="h-4 w-4 mr-2" />
                          Link to Services
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirmId(template.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <FormTemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
      />

      <FormPreviewDialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        template={previewTemplate}
      />

      <ServiceFormLinkDialog
        open={!!linkingTemplate}
        onOpenChange={(open) => !open && setLinkingTemplate(null)}
        template={linkingTemplate}
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. Any services linked to this form will 
              no longer require it. Existing signatures will be preserved for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
