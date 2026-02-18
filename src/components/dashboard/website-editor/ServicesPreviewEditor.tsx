import { useServicesPreviewConfig } from '@/hooks/useSectionConfig';
import { SectionDisplayEditor } from './SectionDisplayEditor';

const FIELDS = [
  { key: 'section_eyebrow', label: 'Eyebrow Text', type: 'text' as const, placeholder: 'What We Do' },
  { key: 'section_title', label: 'Section Title', type: 'text' as const, placeholder: 'Our Services' },
  { key: 'section_description', label: 'Section Description', type: 'textarea' as const, placeholder: 'Describe your services...' },
  {
    key: 'layout', label: 'Layout Style', type: 'select' as const,
    options: [
      { value: 'accordion', label: 'Accordion (expandable categories)' },
      { value: 'grid', label: 'Grid (card layout)' },
      { value: 'list', label: 'List (simple rows)' },
    ],
  },
  { key: 'max_categories_visible', label: 'Max Categories Visible', type: 'slider' as const, min: 3, max: 20, step: 1, description: 'How many categories to show before "View All"' },
];

export function ServicesPreviewEditor() {
  const { data, isLoading, isSaving, update } = useServicesPreviewConfig();

  return (
    <SectionDisplayEditor
      title="Services Preview Section"
      description="Configure how the services section appears on the homepage. To manage individual services, go to Services under Site Content."
      data={data}
      isLoading={isLoading}
      isSaving={isSaving}
      update={update}
      fields={FIELDS}
    />
  );
}
