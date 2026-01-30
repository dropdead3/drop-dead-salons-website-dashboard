import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import type { ServiceFormRequirement } from '@/hooks/useServiceFormRequirements';
import { useRecordSignature } from '@/hooks/useClientFormSignatures';
import { useAuth } from '@/contexts/AuthContext';

interface FormSigningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forms: ServiceFormRequirement[];
  clientId: string;
  appointmentId?: string;
  onComplete?: () => void;
}

export function FormSigningDialog({
  open,
  onOpenChange,
  forms,
  clientId,
  appointmentId,
  onComplete,
}: FormSigningDialogProps) {
  const { user } = useAuth();
  const recordSignature = useRecordSignature();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');
  const [signedForms, setSignedForms] = useState<Set<string>>(new Set());

  const currentForm = forms[currentIndex];
  const template = currentForm?.form_template;
  const progress = ((signedForms.size) / forms.length) * 100;

  const resetForm = () => {
    setAgreed(false);
    setTypedSignature('');
  };

  const handleSign = async () => {
    if (!template || !agreed || !typedSignature.trim()) return;

    await recordSignature.mutateAsync({
      client_id: clientId,
      form_template_id: template.id,
      form_version: template.version,
      typed_signature: typedSignature.trim(),
      appointment_id: appointmentId,
      collected_by: user?.id,
    });

    setSignedForms(prev => new Set([...prev, currentForm.id]));
    
    // Move to next form or complete
    if (currentIndex < forms.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetForm();
    } else {
      // All forms signed
      onComplete?.();
      onOpenChange(false);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetForm();
    }
  };

  // Render simple markdown content
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-medium mt-4 mb-2">{line.slice(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-xl font-medium mt-4 mb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-2xl font-medium mt-4 mb-2">{line.slice(2)}</h1>;
      }
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={idx} className="mb-2">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </p>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={idx} className="ml-4 mb-1">{line.slice(2)}</li>;
      }
      if (!line.trim()) {
        return <br key={idx} />;
      }
      return <p key={idx} className="mb-2">{line}</p>;
    });
  };

  if (!template) return null;

  const isAlreadySigned = signedForms.has(currentForm.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {template.name}
              <Badge variant="outline">{template.version}</Badge>
            </DialogTitle>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {forms.length}
            </span>
          </div>
          <Progress value={progress} className="h-1 mt-2" />
        </DialogHeader>

        {isAlreadySigned ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium">Form Signed!</p>
            <p className="text-muted-foreground">Moving to next form...</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[40vh] border rounded-lg p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {renderContent(template.content)}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  I have read and agree to the terms above
                </span>
              </label>

              <div className="space-y-2">
                <Label htmlFor="signature">Type your full name to sign</Label>
                <Input
                  id="signature"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type your full name"
                  className="font-serif text-lg"
                  disabled={!agreed}
                />
              </div>
            </div>
          </>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          {isAlreadySigned ? (
            <Button onClick={() => {
              if (currentIndex < forms.length - 1) {
                setCurrentIndex(currentIndex + 1);
                resetForm();
              } else {
                onComplete?.();
                onOpenChange(false);
              }
            }}>
              {currentIndex < forms.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                'Complete'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSign}
              disabled={!agreed || !typedSignature.trim() || recordSignature.isPending}
            >
              {recordSignature.isPending 
                ? 'Signing...' 
                : currentIndex < forms.length - 1 
                  ? 'Sign & Continue' 
                  : 'Sign & Complete'
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
