import { useStylistsDisplayConfig } from '@/hooks/useSectionConfig';
import { SectionDisplayEditor } from './SectionDisplayEditor';

const FIELDS = [
  { key: 'section_eyebrow', label: 'Eyebrow Text', type: 'text' as const, placeholder: 'Meet The Team' },
  { key: 'section_title', label: 'Section Title', type: 'text' as const, placeholder: 'Our Stylists' },
  { key: 'section_description', label: 'Section Description', type: 'textarea' as const, placeholder: 'Describe your team...' },
  {
    key: 'card_style', label: 'Card Style', type: 'select' as const,
    options: [
      { value: 'detailed', label: 'Detailed (photo, bio, specialties)' },
      { value: 'minimal', label: 'Minimal (photo and name only)' },
    ],
  },
  { key: 'max_visible', label: 'Max Visible Stylists', type: 'slider' as const, min: 3, max: 16, step: 1, description: 'Number of stylists shown on the homepage' },
];

export function StylistsDisplayEditor() {
  const { data, isLoading, isSaving, update } = useStylistsDisplayConfig();

  return (
    <SectionDisplayEditor
      title="Stylists Display Section"
      description="Configure how the stylists section appears on the homepage. To manage individual team profiles, go to Stylists under Site Content."
      data={data}
      isLoading={isLoading}
      isSaving={isSaving}
      update={update}
      fields={FIELDS}
    />
  );
}
