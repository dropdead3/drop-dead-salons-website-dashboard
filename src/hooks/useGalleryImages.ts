import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface GalleryTransformation {
  id: string;
  before_image: string;
  after_image: string;
  before_label: string;
  after_label: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Gallery Images Hooks
export function useGalleryImages() {
  return useQuery({
    queryKey: ['gallery-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as GalleryImage[];
    },
  });
}

export function useAddGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: { src: string; alt: string }) => {
      // Get max display_order
      const { data: existing } = await supabase
        .from('gallery_images')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

      const { data, error } = await supabase
        .from('gallery_images')
        .insert({
          src: image.src,
          alt: image.alt,
          display_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      toast.success('Image added to gallery');
    },
    onError: (error) => {
      console.error('Error adding gallery image:', error);
      toast.error('Failed to add image');
    },
  });
}

export function useUpdateGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GalleryImage> }) => {
      const { data, error } = await supabase
        .from('gallery_images')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    },
    onError: (error) => {
      console.error('Error updating gallery image:', error);
      toast.error('Failed to update image');
    },
  });
}

export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      toast.success('Image removed from gallery');
    },
    onError: (error) => {
      console.error('Error deleting gallery image:', error);
      toast.error('Failed to remove image');
    },
  });
}

// Gallery Transformations Hooks
export function useGalleryTransformations() {
  return useQuery({
    queryKey: ['gallery-transformations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_transformations')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as GalleryTransformation[];
    },
  });
}

export function useAddGalleryTransformation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transformation: {
      before_image: string;
      after_image: string;
      before_label?: string;
      after_label?: string;
    }) => {
      // Get max display_order
      const { data: existing } = await supabase
        .from('gallery_transformations')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

      const { data, error } = await supabase
        .from('gallery_transformations')
        .insert({
          before_image: transformation.before_image,
          after_image: transformation.after_image,
          before_label: transformation.before_label || 'Before',
          after_label: transformation.after_label || 'After',
          display_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-transformations'] });
      toast.success('Before/After added');
    },
    onError: (error) => {
      console.error('Error adding transformation:', error);
      toast.error('Failed to add transformation');
    },
  });
}

export function useUpdateGalleryTransformation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GalleryTransformation> }) => {
      const { data, error } = await supabase
        .from('gallery_transformations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-transformations'] });
    },
    onError: (error) => {
      console.error('Error updating transformation:', error);
      toast.error('Failed to update transformation');
    },
  });
}

export function useDeleteGalleryTransformation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gallery_transformations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-transformations'] });
      toast.success('Transformation removed');
    },
    onError: (error) => {
      console.error('Error deleting transformation:', error);
      toast.error('Failed to remove transformation');
    },
  });
}
