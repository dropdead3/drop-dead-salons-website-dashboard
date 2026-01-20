import { useState, useEffect, useRef } from 'react';
import type { Json } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Mail,
  Pencil,
  Trash2,
  Eye,
  Save,
  Loader2,
  Send,
  Copy,
  Plus,
} from 'lucide-react';
import {
  useEmailTemplates,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  useCreateEmailTemplate,
  EmailTemplate,
} from '@/hooks/useEmailTemplates';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { EmailTemplateEditor } from './EmailTemplateEditor';

// Default HTML for new templates
function getDefaultEmailHtml() {
  return `<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
    <h1 style="color: #f5f0e8; margin: 0; font-size: 24px;">Email Title</h1>
  </div>
  <div style="background-color: #f5f0e8; padding: 24px;">
    <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6;">
      Your email content goes here. Use the visual editor to customize this template.
    </p>
  </div>
  <div style="background-color: #f5f0e8; padding: 24px; text-align: center;">
    <a href="{{dashboard_url}}" style="display: inline-block; background-color: #1a1a1a; color: #f5f0e8; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Click Here
    </a>
  </div>
</div>`;
}

export function EmailTemplatesManager() {
  const { data: templates, isLoading } = useEmailTemplates();
  const updateTemplate = useUpdateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();
  const createTemplate = useCreateEmailTemplate();
  const { user } = useAuth();

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [testEmailTemplate, setTestEmailTemplate] = useState<EmailTemplate | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    subject: '',
    html_body: '',
    blocks_json: null as Json | null,
    description: '',
    is_active: true,
  });
  const [createForm, setCreateForm] = useState({
    template_key: '',
    name: '',
    subject: '',
    html_body: getDefaultEmailHtml(),
    description: '',
    variables: [] as string[],
  });
  const [newVariable, setNewVariable] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialEditFormRef = useRef<typeof editForm | null>(null);
  const hasShownUnsavedToastRef = useRef(false);

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    const formData = {
      name: template.name,
      subject: template.subject,
      html_body: template.html_body,
      blocks_json: template.blocks_json,
      description: template.description || '',
      is_active: template.is_active,
    };
    setEditForm(formData);
    initialEditFormRef.current = formData;
    setHasUnsavedChanges(false);
    hasShownUnsavedToastRef.current = false;
  };

  // Track unsaved changes in edit form
  useEffect(() => {
    if (!editingTemplate || !initialEditFormRef.current) return;
    
    const hasChanges = 
      editForm.name !== initialEditFormRef.current.name ||
      editForm.subject !== initialEditFormRef.current.subject ||
      editForm.html_body !== initialEditFormRef.current.html_body ||
      editForm.description !== initialEditFormRef.current.description ||
      editForm.is_active !== initialEditFormRef.current.is_active ||
      JSON.stringify(editForm.blocks_json) !== JSON.stringify(initialEditFormRef.current.blocks_json);
    
    setHasUnsavedChanges(hasChanges);
    
    // Show toast once when changes are first detected
    if (hasChanges && !hasShownUnsavedToastRef.current) {
      toast.info('You have unsaved changes', { 
        id: 'unsaved-changes',
        duration: 3000 
      });
      hasShownUnsavedToastRef.current = true;
    }
  }, [editForm, editingTemplate]);

  const openTestEmailDialog = (template: EmailTemplate) => {
    setTestEmailTemplate(template);
    // Pre-fill with user's email if available
    setTestEmailAddress(user?.email || '');
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

  const handleDuplicate = async (template: EmailTemplate) => {
    setIsDuplicating(template.id);
    try {
      // Generate a unique template key
      const baseKey = template.template_key.replace(/_copy(_\d+)?$/, '');
      const existingKeys = templates?.map(t => t.template_key) || [];
      let newKey = `${baseKey}_copy`;
      let counter = 1;
      while (existingKeys.includes(newKey)) {
        newKey = `${baseKey}_copy_${counter}`;
        counter++;
      }

      await createTemplate.mutateAsync({
        template_key: newKey,
        name: `${template.name} (Copy)`,
        subject: template.subject,
        html_body: template.html_body,
        description: template.description || undefined,
        variables: template.variables,
      });
      
      toast.success(`Template duplicated as "${template.name} (Copy)"`);
    } catch (error) {
      console.error('Error duplicating template:', error);
    } finally {
      setIsDuplicating(null);
    }
  };

  const openCreateDialog = () => {
    setCreateForm({
      template_key: '',
      name: '',
      subject: '',
      html_body: getDefaultEmailHtml(),
      description: '',
      variables: ['dashboard_url'],
    });
    setNewVariable('');
    setIsCreating(true);
  };

  const handleCreate = async () => {
    if (!createForm.template_key || !createForm.name || !createForm.subject) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check for duplicate template key
    const existingKeys = templates?.map(t => t.template_key) || [];
    if (existingKeys.includes(createForm.template_key)) {
      toast.error('Template key already exists. Please use a unique key.');
      return;
    }

    try {
      await createTemplate.mutateAsync({
        template_key: createForm.template_key,
        name: createForm.name,
        subject: createForm.subject,
        html_body: createForm.html_body,
        description: createForm.description || undefined,
        variables: createForm.variables,
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const addVariable = () => {
    if (!newVariable.trim()) return;
    const formatted = newVariable.trim().toLowerCase().replace(/\s+/g, '_');
    if (createForm.variables.includes(formatted)) {
      toast.error('Variable already exists');
      return;
    }
    setCreateForm(prev => ({
      ...prev,
      variables: [...prev.variables, formatted],
    }));
    setNewVariable('');
  };

  const removeVariable = (variable: string) => {
    setCreateForm(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable),
    }));
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTemplate || !testEmailAddress) return;

    setIsSendingTest(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await supabase.functions.invoke('send-test-email', {
        body: {
          template_id: testEmailTemplate.id,
          recipient_email: testEmailAddress,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send test email');
      }

      toast.success(`Test email sent to ${testEmailAddress}`);
      setTestEmailTemplate(null);
      setTestEmailAddress('');
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(error.message || 'Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
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
        <Button onClick={openCreateDialog} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {templates?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No email templates configured.</p>
            <Button onClick={openCreateDialog} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Template
            </Button>
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
                    <p className="text-sm font-sans bg-muted px-2 py-1 rounded truncate">
                      Subject: {template.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTestEmailDialog(template)}
                      title="Send Test Email"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                      disabled={isDuplicating === template.id}
                      title="Duplicate"
                    >
                      {isDuplicating === template.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          title="Delete"
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
        onOpenChange={(open) => {
          if (!open && hasUnsavedChanges) {
            toast.warning('You have unsaved changes. Click Cancel to discard or Save to keep them.');
            return;
          }
          if (!open) setEditingTemplate(null);
        }}
      >
        <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit Email Template
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                  Unsaved Changes
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Use the visual editor to design your email template, or switch to HTML code for full control.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 px-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Advanced Visual Editor - key forces remount when template changes */}
            <EmailTemplateEditor
              key={editingTemplate?.id}
              initialHtml={editForm.html_body}
              initialBlocks={editForm.blocks_json as any}
              variables={editingTemplate?.variables || []}
              onHtmlChange={(html) => setEditForm(prev => ({ ...prev, html_body: html }))}
              onBlocksChange={(blocks) => setEditForm(prev => ({ ...prev, blocks_json: blocks as unknown as Json }))}
            />
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-background border-t mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {hasUnsavedChanges && 'Remember to save your changes'}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingTemplate(null);
                  setHasUnsavedChanges(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={updateTemplate.isPending || !hasUnsavedChanges}
                className={cn(hasUnsavedChanges && 'animate-pulse')}
              >
                {updateTemplate.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
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

      {/* Send Test Email Dialog */}
      <Dialog
        open={!!testEmailTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setTestEmailTemplate(null);
            setTestEmailAddress('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email for "{testEmailTemplate?.name}" with sample data to preview how it will look in your inbox.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Recipient Email</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="Enter email address..."
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
              />
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="text-muted-foreground">
                <strong>Note:</strong> The test email will include a banner indicating it's a test, and all template variables will be replaced with sample data.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTestEmailTemplate(null);
                setTestEmailAddress('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={isSendingTest || !testEmailAddress}
            >
              {isSendingTest ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Test Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Template Dialog */}
      <Dialog
        open={isCreating}
        onOpenChange={(open) => !open && setIsCreating(false)}
      >
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Email Template</DialogTitle>
            <DialogDescription>
              Design a new email template from scratch using the visual editor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Key *</Label>
                <Input
                  value={createForm.template_key}
                  onChange={(e) => setCreateForm({ ...createForm, template_key: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '') })}
                  placeholder="e.g., welcome_email, password_reset"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier used in code to reference this template
                </p>
              </div>
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Welcome Email, Password Reset"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject Line *</Label>
              <Input
                value={createForm.subject}
                onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                placeholder="e.g., Welcome to Drop Dead Gorgeous!"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Brief description of when this email is sent..."
              />
            </div>

            <div className="space-y-2">
              <Label>Template Variables</Label>
              <div className="flex gap-2">
                <Input
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  placeholder="Add a variable (e.g., user_name)"
                  className="font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addVariable();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addVariable}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {createForm.variables.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {createForm.variables.map((variable) => (
                    <Badge
                      key={variable}
                      variant="secondary"
                      className="text-xs font-mono cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => removeVariable(variable)}
                      title="Click to remove"
                    >
                      {`{{${variable}}}`} ×
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Variables can be inserted into the email content. Click a variable to remove it.
              </p>
            </div>

            {/* Visual Editor */}
            <EmailTemplateEditor
              initialHtml={createForm.html_body}
              variables={createForm.variables}
              onHtmlChange={(html) => setCreateForm({ ...createForm, html_body: html })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={createTemplate.isPending || !createForm.template_key || !createForm.name || !createForm.subject}
            >
              {createTemplate.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
