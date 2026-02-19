import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PAGE_TEMPLATES, type PageTemplate } from '@/data/page-templates';
import { FileText, Type, Image, Video, Megaphone, Minus } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ElementType> = {
  rich_text: Type,
  image_text: Image,
  video: Video,
  custom_cta: Megaphone,
  spacer: Minus,
};

interface PageTemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: PageTemplate) => void;
}

export function PageTemplatePicker({ open, onOpenChange, onSelect }: PageTemplatePickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Page Templates</DialogTitle>
          <DialogDescription>
            Apply a pre-built page layout. This will replace the current page's sections.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-2">
          {PAGE_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => {
                onSelect(template);
                onOpenChange(false);
              }}
              className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
            >
              {/* Visual layout preview */}
              <div className="flex-shrink-0 w-12 h-16 rounded border bg-muted/50 flex flex-col gap-0.5 p-1 overflow-hidden">
                {template.sections.slice(0, 5).map((s, i) => {
                  const Icon = TYPE_ICONS[s.type] || FileText;
                  return (
                    <div key={i} className="flex items-center gap-0.5">
                      <Icon className="h-2 w-2 text-muted-foreground/60 shrink-0" />
                      <div className="h-1.5 flex-1 rounded-sm bg-muted-foreground/20" />
                    </div>
                  );
                })}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{template.name}</span>
                  <Badge variant="outline" className="text-[9px]">{template.sections.length} sections</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
