import { useGalleryDisplayConfig } from '@/hooks/useSectionConfig';
import { SectionDisplayEditor } from './SectionDisplayEditor';

const FIELDS = [
  { key: 'section_eyebrow', label: 'Eyebrow Text', type: 'text' as const, placeholder: 'Our Work' },
  { key: 'section_title', label: 'Section Title', type: 'text' as const, placeholder: 'Gallery' },
  { key: 'section_description', label: 'Section Description', type: 'textarea' as const, placeholder: 'Describe your gallery...' },
  { key: 'grid_columns', label: 'Grid Columns', type: 'slider' as const, min: 2, max: 5, step: 1, description: 'Number of columns in the gallery grid' },
  { key: 'max_images', label: 'Max Images', type: 'slider' as const, min: 4, max: 24, step: 2, description: 'Maximum images displayed on the homepage' },
];

export function GalleryDisplayEditor() {
  const { data, isLoading, isSaving, update } = useGalleryDisplayConfig();

  return (
    <SectionDisplayEditor
      title="Gallery Display Section"
      description="Configure how the gallery section appears on the homepage. To manage individual images, go to Gallery under Site Content."
      data={data}
      isLoading={isLoading}
      isSaving={isSaving}
      update={update}
      fields={FIELDS}
    />
  );
}
