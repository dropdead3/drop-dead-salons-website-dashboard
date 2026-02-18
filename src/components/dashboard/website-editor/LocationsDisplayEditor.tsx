import { useLocationsDisplayConfig } from '@/hooks/useSectionConfig';
import { SectionDisplayEditor } from './SectionDisplayEditor';

const FIELDS = [
  { key: 'section_eyebrow', label: 'Eyebrow Text', type: 'text' as const, placeholder: 'Visit Us' },
  { key: 'section_title', label: 'Section Title', type: 'text' as const, placeholder: 'Our Locations' },
  { key: 'section_description', label: 'Section Description', type: 'textarea' as const, placeholder: 'Describe your locations...' },
  {
    key: 'show_map', label: 'Show Map', type: 'toggle' as const,
    description: 'Display an interactive map alongside location cards',
  },
  {
    key: 'layout', label: 'Layout Style', type: 'select' as const,
    options: [
      { value: 'cards', label: 'Cards (rich layout with images)' },
      { value: 'list', label: 'List (compact rows)' },
    ],
  },
];

export function LocationsDisplayEditor() {
  const { data, isLoading, isSaving, update } = useLocationsDisplayConfig();

  return (
    <SectionDisplayEditor
      title="Locations Display Section"
      description="Configure how locations appear on the homepage. To manage individual locations, go to Locations under Site Content."
      data={data}
      isLoading={isLoading}
      isSaving={isSaving}
      update={update}
      fields={FIELDS}
    />
  );
}
