import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Star, 
  Plus, 
  Pencil, 
  Trash2, 
  Quote,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data - this would come from the database
const initialTestimonials = [
  {
    id: '1',
    title: "Love this place!",
    author: "Lexi V.",
    text: "I love Drop Dead! The owner picks literally THE BEST hair stylist and lash and brow artists. You really can't go wrong with going to anyone inside the studio, everyone is so welcoming and friendly.",
    rating: 5,
    isVisible: true,
  },
  {
    id: '2',
    title: "You won't be disappointed",
    author: "Melissa C.",
    text: "The salon itself is beautiful and so unique. The atmosphere is comforting and fun!! Never have I loved my hair this much!! Definitely recommend to anyone wanting to a new salon!! You won't be disappointed.",
    rating: 5,
    isVisible: true,
  },
  {
    id: '3',
    title: "Best wefts ever!!",
    author: "Lexi K.",
    text: "I have loved every product from Drop Dead so far. I wear them myself and I also use them on my clients. My clients love everything too!! These new SuperWefts are amazing. So comfortable, flat, customizable and easy to color!",
    rating: 5,
    isVisible: true,
  },
  {
    id: '4',
    title: "Best extensions",
    author: "Darian F.",
    text: "These extensions were so easily filled my clients hair long. It took very little cutting with the hair and I'm obsessed with the product.",
    rating: 5,
    isVisible: true,
  },
  {
    id: '5',
    title: "Absolutely stunning results",
    author: "Morgan S.",
    text: "I've been going to Drop Dead for over a year now and every single visit has been incredible. The attention to detail and care they put into every service is unmatched.",
    rating: 5,
    isVisible: true,
  },
  {
    id: '6',
    title: "Hair transformation goals",
    author: "Jamie L.",
    text: "Went from damaged, over-processed hair to the healthiest it's ever been. The team really knows their stuff and takes the time to educate you on proper hair care.",
    rating: 5,
    isVisible: true,
  },
];

type Testimonial = typeof initialTestimonials[0];

export default function TestimonialsManager() {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    title: '',
    author: '',
    text: '',
    rating: 5,
  });

  const handleToggleVisibility = (id: string) => {
    setTestimonials(prev => 
      prev.map(t => t.id === id ? { ...t, isVisible: !t.isVisible } : t)
    );
  };

  const handleDelete = (id: string) => {
    setTestimonials(prev => prev.filter(t => t.id !== id));
  };

  const handleAdd = () => {
    const testimonial: Testimonial = {
      id: Date.now().toString(),
      ...newTestimonial,
      isVisible: true,
    };
    setTestimonials(prev => [...prev, testimonial]);
    setNewTestimonial({ title: '', author: '', text: '', rating: 5 });
    setIsAddDialogOpen(false);
  };

  const handleUpdate = () => {
    if (!editingTestimonial) return;
    setTestimonials(prev => 
      prev.map(t => t.id === editingTestimonial.id ? editingTestimonial : t)
    );
    setEditingTestimonial(null);
  };

  const visibleCount = testimonials.filter(t => t.isVisible).length;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Quote className="w-6 h-6" />
              Testimonials
            </h1>
            <p className="text-muted-foreground">
              Manage customer reviews displayed on the website
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Testimonial
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Testimonial</DialogTitle>
                <DialogDescription>
                  Add a new customer review to display on the website.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    placeholder="e.g., Amazing experience!"
                    value={newTestimonial.title}
                    onChange={(e) => setNewTestimonial(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Author Name</Label>
                  <Input 
                    placeholder="e.g., Jane D."
                    value={newTestimonial.author}
                    onChange={(e) => setNewTestimonial(prev => ({ ...prev, author: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Review Text</Label>
                  <Textarea 
                    placeholder="What did they say?"
                    value={newTestimonial.text}
                    onChange={(e) => setNewTestimonial(prev => ({ ...prev, text: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewTestimonial(prev => ({ ...prev, rating: star }))}
                        className="p-1"
                      >
                        <Star 
                          className={cn(
                            "w-6 h-6 transition-colors",
                            star <= newTestimonial.rating 
                              ? "fill-amber-400 text-amber-400" 
                              : "text-muted-foreground"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd} disabled={!newTestimonial.title || !newTestimonial.author || !newTestimonial.text}>
                  Add Testimonial
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{testimonials.length}</p>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{visibleCount}</p>
                <p className="text-sm text-muted-foreground">Visible on Website</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Testimonials List */}
        <div className="space-y-3">
          {testimonials.map((testimonial) => (
            <Card 
              key={testimonial.id} 
              className={cn(
                "transition-opacity",
                !testimonial.isVisible && "opacity-60"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-1 cursor-grab text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium">{testimonial.title}</h3>
                      <span className="text-sm text-muted-foreground">— {testimonial.author}</span>
                      {!testimonial.isVisible && (
                        <Badge variant="outline" className="text-xs">Hidden</Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "w-3 h-3",
                            i < testimonial.rating 
                              ? "fill-amber-400 text-amber-400" 
                              : "text-muted-foreground"
                          )} 
                        />
                      ))}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {testimonial.text}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleVisibility(testimonial.id)}
                    >
                      {testimonial.isVisible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTestimonial(testimonial)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Testimonial</DialogTitle>
                        </DialogHeader>
                        {editingTestimonial && (
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input 
                                value={editingTestimonial.title}
                                onChange={(e) => setEditingTestimonial(prev => prev ? { ...prev, title: e.target.value } : null)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Author Name</Label>
                              <Input 
                                value={editingTestimonial.author}
                                onChange={(e) => setEditingTestimonial(prev => prev ? { ...prev, author: e.target.value } : null)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Review Text</Label>
                              <Textarea 
                                value={editingTestimonial.text}
                                onChange={(e) => setEditingTestimonial(prev => prev ? { ...prev, text: e.target.value } : null)}
                                rows={4}
                              />
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingTestimonial(null)}>Cancel</Button>
                          <Button onClick={handleUpdate}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Testimonial?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the testimonial from "{testimonial.author}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(testimonial.id)}
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

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Quote className="w-4 h-4" />
              About Testimonials
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Visibility:</strong> Toggle the eye icon to show or hide testimonials on the website.
            </p>
            <p>
              <strong className="text-foreground">Order:</strong> Drag and drop to reorder testimonials (coming soon).
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}