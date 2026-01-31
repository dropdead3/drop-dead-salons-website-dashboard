import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, PowerOff, Trash2, Loader2, Clock } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { 
  usePromotionalServices, 
  useDeactivatePromotionalService,
  useDeletePromotionalService,
  type PromotionalService 
} from '@/hooks/usePromotionalServices';
import { PromotionalServiceFormDialog } from './PromotionalServiceFormDialog';

interface PromotionalServicesManagerProps {
  organizationId?: string;
}

export function PromotionalServicesManager({ organizationId }: PromotionalServicesManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: promoServices, isLoading } = usePromotionalServices(organizationId);
  const deactivate = useDeactivatePromotionalService();
  const deleteService = useDeletePromotionalService();

  const getStatus = (ps: PromotionalService) => {
    if (ps.deactivated_at) return { label: 'Deactivated', variant: 'secondary' as const };
    if (isPast(new Date(ps.expires_at))) return { label: 'Expired', variant: 'destructive' as const };
    
    const daysLeft = differenceInDays(new Date(ps.expires_at), new Date());
    if (daysLeft <= 3) return { label: `${daysLeft}d left`, variant: 'outline' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  const handleDeactivate = async (ps: PromotionalService) => {
    if (!organizationId) return;
    await deactivate.mutateAsync({ 
      id: ps.id, 
      serviceId: ps.service_id, 
      organizationId 
    });
  };

  const handleDelete = async (ps: PromotionalService) => {
    if (!organizationId) return;
    if (!confirm(`Delete this promotional service? This cannot be undone.`)) return;
    await deleteService.mutateAsync({ 
      id: ps.id, 
      serviceId: ps.service_id, 
      organizationId 
    });
  };

  if (!organizationId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Select an organization to manage promotional services
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Promotional Services</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Time-limited service offerings that auto-expire
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Promo Service
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !promoServices?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No promotional services yet</p>
              <p className="text-sm mt-1">Create a temporary discounted service for special offers</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Based On</TableHead>
                  <TableHead>Original Price</TableHead>
                  <TableHead>Promo Price</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoServices.map((ps) => {
                  const status = getStatus(ps);
                  const isExpiredOrDeactivated = ps.deactivated_at || isPast(new Date(ps.expires_at));
                  
                  return (
                    <TableRow key={ps.id} className={isExpiredOrDeactivated ? 'opacity-60' : ''}>
                      <TableCell>
                        <div className="font-medium">
                          {ps.service?.name || 'Unknown Service'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ps.original_service?.name || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ps.original_price ? (
                          <span className="line-through text-muted-foreground">
                            ${ps.original_price}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-primary">
                          ${ps.promotional_price}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(ps.expires_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isExpiredOrDeactivated && (
                              <DropdownMenuItem onClick={() => handleDeactivate(ps)}>
                                <PowerOff className="h-4 w-4 mr-2" />
                                Deactivate Now
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDelete(ps)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PromotionalServiceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        organizationId={organizationId}
      />
    </>
  );
}
