import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Images, 
  Plus, 
  Trash2, 
  Eye,
  EyeOff,
  Upload,
  ArrowLeftRight,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for gallery images
const initialGalleryImages = [
  { 
    id: '1', 
    src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=800&fit=crop",
    alt: "Blonde balayage transformation",
    isVisible: true,
  },
  { 
    id: '2', 
    src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&h=800&fit=crop",
    alt: "Creative color work",
    isVisible: true,
  },
  { 
    id: '3', 
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=800&fit=crop",
    alt: "Styled hair finish",
    isVisible: true,
  },
];

// Mock data for before/after transformations
const initialTransformations = [
  { 
    id: '1', 
    beforeImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=800&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=800&fit=crop",
    beforeLabel: "Before", 
    afterLabel: "Balayage",
    isVisible: true,
  },
];

type GalleryImage = typeof initialGalleryImages[0];
type Transformation = typeof initialTransformations[0];

export default function GalleryManager() {
  const [galleryImages, setGalleryImages] = useState(initialGalleryImages);
  const [transformations, setTransformations] = useState(initialTransformations);
  const [isAddImageOpen, setIsAddImageOpen] = useState(false);
  const [isAddTransformOpen, setIsAddTransformOpen] = useState(false);
  const [newImage, setNewImage] = useState({ src: '', alt: '' });
  const [newTransform, setNewTransform] = useState({ 
    beforeImage: '', 
    afterImage: '', 
    beforeLabel: 'Before', 
    afterLabel: 'After' 
  });

  const handleToggleImageVisibility = (id: string) => {
    setGalleryImages(prev => 
      prev.map(img => img.id === id ? { ...img, isVisible: !img.isVisible } : img)
    );
  };

  const handleToggleTransformVisibility = (id: string) => {
    setTransformations(prev => 
      prev.map(t => t.id === id ? { ...t, isVisible: !t.isVisible } : t)
    );
  };

  const handleDeleteImage = (id: string) => {
    setGalleryImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDeleteTransform = (id: string) => {
    setTransformations(prev => prev.filter(t => t.id !== id));
  };

  const handleAddImage = () => {
    const image: GalleryImage = {
      id: Date.now().toString(),
      ...newImage,
      isVisible: true,
    };
    setGalleryImages(prev => [...prev, image]);
    setNewImage({ src: '', alt: '' });
    setIsAddImageOpen(false);
  };

  const handleAddTransform = () => {
    const transform: Transformation = {
      id: Date.now().toString(),
      ...newTransform,
      isVisible: true,
    };
    setTransformations(prev => [...prev, transform]);
    setNewTransform({ beforeImage: '', afterImage: '', beforeLabel: 'Before', afterLabel: 'After' });
    setIsAddTransformOpen(false);
  };

  const visibleImages = galleryImages.filter(img => img.isVisible).length;
  const visibleTransforms = transformations.filter(t => t.isVisible).length;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display flex items-center gap-2">
              <Images className="w-6 h-6" />
              Gallery Manager
            </h1>
            <p className="text-muted-foreground">
              Manage gallery images and before/after transformations
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{galleryImages.length}</p>
                <p className="text-sm text-muted-foreground">Gallery Images ({visibleImages} visible)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <ArrowLeftRight className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{transformations.length}</p>
                <p className="text-sm text-muted-foreground">Before/After ({visibleTransforms} visible)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="gallery">
          <TabsList>
            <TabsTrigger value="gallery" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Gallery Images
            </TabsTrigger>
            <TabsTrigger value="transformations" className="gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              Before/After
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Dialog open={isAddImageOpen} onOpenChange={setIsAddImageOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Image
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Gallery Image</DialogTitle>
                    <DialogDescription>
                      Add a new image to the website gallery.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input 
                        placeholder="https://..."
                        value={newImage.src}
                        onChange={(e) => setNewImage(prev => ({ ...prev, src: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alt Text (Description)</Label>
                      <Input 
                        placeholder="e.g., Blonde balayage transformation"
                        value={newImage.alt}
                        onChange={(e) => setNewImage(prev => ({ ...prev, alt: e.target.value }))}
                      />
                    </div>
                    {newImage.src && (
                      <div className="space-y-2">
                        <Label>Preview</Label>
                        <div className="aspect-[3/4] w-32 rounded-lg overflow-hidden bg-muted">
                          <img src={newImage.src} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddImageOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddImage} disabled={!newImage.src || !newImage.alt}>
                      Add Image
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image) => (
                <Card 
                  key={image.id} 
                  className={cn(
                    "overflow-hidden transition-opacity",
                    !image.isVisible && "opacity-60"
                  )}
                >
                  <div className="aspect-[3/4] relative group">
                    <img 
                      src={image.src} 
                      alt={image.alt} 
                      className="w-full h-full object-cover"
                    />
                    {!image.isVisible && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary">Hidden</Badge>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleToggleImageVisibility(image.id)}
                      >
                        {image.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this image from the gallery.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteImage(image.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground truncate">{image.alt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transformations" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Dialog open={isAddTransformOpen} onOpenChange={setIsAddTransformOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Before/After
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Before/After Transformation</DialogTitle>
                    <DialogDescription>
                      Add a new before/after comparison to showcase your work.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Before Image URL</Label>
                        <Input 
                          placeholder="https://..."
                          value={newTransform.beforeImage}
                          onChange={(e) => setNewTransform(prev => ({ ...prev, beforeImage: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>After Image URL</Label>
                        <Input 
                          placeholder="https://..."
                          value={newTransform.afterImage}
                          onChange={(e) => setNewTransform(prev => ({ ...prev, afterImage: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Before Label</Label>
                        <Input 
                          value={newTransform.beforeLabel}
                          onChange={(e) => setNewTransform(prev => ({ ...prev, beforeLabel: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>After Label</Label>
                        <Input 
                          value={newTransform.afterLabel}
                          onChange={(e) => setNewTransform(prev => ({ ...prev, afterLabel: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddTransformOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddTransform} disabled={!newTransform.beforeImage || !newTransform.afterImage}>
                      Add Transformation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transformations.map((transform) => (
                <Card 
                  key={transform.id} 
                  className={cn(
                    "overflow-hidden transition-opacity",
                    !transform.isVisible && "opacity-60"
                  )}
                >
                  <div className="grid grid-cols-2 gap-1">
                    <div className="aspect-[3/4] relative">
                      <img 
                        src={transform.beforeImage} 
                        alt={transform.beforeLabel} 
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute bottom-2 left-2">{transform.beforeLabel}</Badge>
                    </div>
                    <div className="aspect-[3/4] relative">
                      <img 
                        src={transform.afterImage} 
                        alt={transform.afterLabel} 
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute bottom-2 right-2">{transform.afterLabel}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {!transform.isVisible && (
                        <Badge variant="outline">Hidden</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleTransformVisibility(transform.id)}
                      >
                        {transform.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transformation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this before/after comparison.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTransform(transform.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Image Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Coming Soon:</strong> Direct image upload from your device. For now, please use image URLs.
            </p>
            <p>
              <strong className="text-foreground">Tip:</strong> Use high-quality images with 3:4 aspect ratio for best results.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}