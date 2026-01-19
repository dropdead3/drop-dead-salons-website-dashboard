// Stylist levels in order of experience
export const stylistLevels = [
  { id: 'new-talent', label: 'New Talent', clientLabel: 'Level 1' },
  { id: 'emerging', label: 'Emerging Artist', clientLabel: 'Level 2' },
  { id: 'lead', label: 'Lead Artist', clientLabel: 'Level 3' },
  { id: 'senior', label: 'Senior Artist', clientLabel: 'Level 4' },
  { id: 'signature', label: 'Signature Artist', clientLabel: 'Level 5' },
  { id: 'icon', label: 'Icon Artist', clientLabel: 'Level 6' },
] as const;

export type StylistLevel = typeof stylistLevels[number]['id'];

export type ServiceItem = {
  name: string;
  prices: Record<StylistLevel, string | null>;
};

export type ServiceCategory = {
  category: string;
  description: string;
  items: ServiceItem[];
};

export const services: ServiceCategory[] = [
  {
    category: "Consultations",
    description: "Start your journey with a personalized consultation.",
    items: [
      { name: "Color Consultation", prices: { 'new-talent': '$15', 'emerging': '$15', 'lead': '$15', 'senior': '$20', 'signature': null, 'icon': null } },
      { name: "Cut Consultation", prices: { 'new-talent': '$15', 'emerging': '$15', 'lead': '$15', 'senior': '$20', 'signature': null, 'icon': null } },
      { name: "Extension Consultation", prices: { 'new-talent': '$15', 'emerging': '$15', 'lead': '$15', 'senior': '$20', 'signature': null, 'icon': null } },
    ],
  },
  {
    category: "Cutting & Styling",
    description: "Modern cuts and styles tailored to your features and lifestyle.",
    items: [
      { name: "Maintenance Cut", prices: { 'new-talent': '$15', 'emerging': '$15', 'lead': '$20', 'senior': '$20', 'signature': null, 'icon': null } },
      { name: "Add-On Cut", prices: { 'new-talent': '$45', 'emerging': '$55', 'lead': '$65', 'senior': '$75', 'signature': null, 'icon': null } },
      { name: "Signature Cut", prices: { 'new-talent': '$65', 'emerging': '$75', 'lead': '$85', 'senior': '$95', 'signature': null, 'icon': null } },
      { name: "Specialty Cut", prices: { 'new-talent': '$75', 'emerging': '$85', 'lead': '$95', 'senior': '$115', 'signature': null, 'icon': null } },
      { name: "Transformation Cut", prices: { 'new-talent': '$75', 'emerging': '$85', 'lead': '$95', 'senior': '$115', 'signature': null, 'icon': null } },
      { name: "Buzz Cut", prices: { 'new-talent': '$35', 'emerging': '$35', 'lead': '$40', 'senior': '$40', 'signature': null, 'icon': null } },
      { name: "Clipper Cut", prices: { 'new-talent': '$40', 'emerging': '$40', 'lead': '$50', 'senior': '$50', 'signature': null, 'icon': null } },
      { name: "Fade", prices: { 'new-talent': '$50', 'emerging': '$50', 'lead': '$60', 'senior': '$60', 'signature': null, 'icon': null } },
      { name: "Combo Cut", prices: { 'new-talent': '$60', 'emerging': '$60', 'lead': '$75', 'senior': '$75', 'signature': null, 'icon': null } },
      { name: "Wash + Blowout", prices: { 'new-talent': '$50', 'emerging': '$50', 'lead': '$60', 'senior': '$60', 'signature': null, 'icon': null } },
      { name: "Extension Wash + Blowout", prices: { 'new-talent': '$65', 'emerging': '$65', 'lead': '$75', 'senior': '$75', 'signature': null, 'icon': null } },
      { name: "Member Blowout", prices: { 'new-talent': '$45', 'emerging': '$45', 'lead': '$50', 'senior': '$50', 'signature': null, 'icon': null } },
      { name: "Member Extension Blowout", prices: { 'new-talent': '$60', 'emerging': '$60', 'lead': '$60', 'senior': '$70', 'signature': null, 'icon': null } },
      { name: "Hot Tool Add-On", prices: { 'new-talent': '$15', 'emerging': '$15', 'lead': '$20', 'senior': '$20', 'signature': null, 'icon': null } },
      { name: "Stand Alone Hot Tool Style", prices: { 'new-talent': '$25', 'emerging': '$25', 'lead': '$35', 'senior': '$35', 'signature': null, 'icon': null } },
    ],
  },
  {
    category: "Highlights",
    description: "Expert lightening services from dimensional highlights to full platinum transformations.",
    items: [
      { name: "Face Frame Highlight", prices: { 'new-talent': '$115', 'emerging': '$135', 'lead': '$145', 'senior': '$155', 'signature': null, 'icon': null } },
      { name: "Mini Highlight", prices: { 'new-talent': '$135', 'emerging': '$155', 'lead': '$165', 'senior': '$175', 'signature': null, 'icon': null } },
      { name: "Partial Highlight", prices: { 'new-talent': '$185', 'emerging': '$205', 'lead': '$245', 'senior': '$275', 'signature': null, 'icon': null } },
      { name: "Full Highlight", prices: { 'new-talent': '$240', 'emerging': '$265', 'lead': '$300', 'senior': '$350', 'signature': null, 'icon': null } },
      { name: "Transformation Highlight", prices: { 'new-talent': '$275', 'emerging': '$315', 'lead': '$350', 'senior': '$385', 'signature': null, 'icon': null } },
      { name: "Global Blonding", prices: { 'new-talent': '$325', 'emerging': '$365', 'lead': '$385', 'senior': '$400', 'signature': null, 'icon': null } },
      { name: "Lightener Retouch", prices: { 'new-talent': '$130', 'emerging': '$155', 'lead': '$185', 'senior': '$210', 'signature': null, 'icon': null } },
      { name: "Transformational Lightener Retouch", prices: { 'new-talent': '$160', 'emerging': '$185', 'lead': '$200', 'senior': '$225', 'signature': null, 'icon': null } },
    ],
  },
  {
    category: "Balayage",
    description: "Hand-painted artistry for natural, sun-kissed dimension and lived-in color.",
    items: [
      { name: "Partial Balayage", prices: { 'new-talent': '$185', 'emerging': '$220', 'lead': '$245', 'senior': '$275', 'signature': null, 'icon': null } },
      { name: "Full Balayage", prices: { 'new-talent': '$240', 'emerging': '$285', 'lead': '$325', 'senior': '$375', 'signature': null, 'icon': null } },
      { name: "Transformational Balayage", prices: { 'new-talent': '$300', 'emerging': '$330', 'lead': '$370', 'senior': '$400', 'signature': null, 'icon': null } },
    ],
  },
  {
    category: "Color Blocks & Vivids",
    description: "Bold, creative color for those who dare to stand out.",
    items: [
      { name: "Singular Color Block", prices: { 'new-talent': '$145', 'emerging': '$145', 'lead': '$160', 'senior': '$180', 'signature': null, 'icon': null } },
      { name: "Double Color Block", prices: { 'new-talent': '$185', 'emerging': '$185', 'lead': '$210', 'senior': '$235', 'signature': null, 'icon': null } },
      { name: "3+ Color Blocks / Calico Placement", prices: { 'new-talent': '$225', 'emerging': '$225', 'lead': '$275', 'senior': '$315', 'signature': null, 'icon': null } },
      { name: "Split Lightener Retouch", prices: { 'new-talent': '$100', 'emerging': '$125', 'lead': '$155', 'senior': '$180', 'signature': null, 'icon': null } },
      { name: "Split Lightener Transformation", prices: { 'new-talent': '$105', 'emerging': '$125', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Mini Vivid", prices: { 'new-talent': '$95', 'emerging': '$105', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Partial Vivid", prices: { 'new-talent': '$105', 'emerging': '$120', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Max Vivid", prices: { 'new-talent': '$130', 'emerging': '$150', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Specialty Vivid", prices: { 'new-talent': '$150', 'emerging': '$165', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Custom Vivid", prices: { 'new-talent': '$170', 'emerging': '$185', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
    ],
  },
  {
    category: "Color Services",
    description: "From natural coverage to custom formulations, tailored color for every vision.",
    items: [
      { name: "Natural Root Retouch", prices: { 'new-talent': '$100', 'emerging': '$110', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Single Process Color (Retouch + Pull Through)", prices: { 'new-talent': '$140', 'emerging': '$150', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Single Glaze", prices: { 'new-talent': '$100', 'emerging': '$110', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Root Smudge", prices: { 'new-talent': '$100', 'emerging': '$110', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Color Melt", prices: { 'new-talent': '$135', 'emerging': '$145', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Lowlight + Root Smudge Stand Alone", prices: { 'new-talent': '$145', 'emerging': '$165', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Tint Back", prices: { 'new-talent': '$160', 'emerging': '$170', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Corrective Color (by the hour)", prices: { 'new-talent': '$85', 'emerging': '$90', 'lead': '$100', 'senior': '$115', 'signature': '$125', 'icon': '$150' } },
    ],
  },
  {
    category: "Color Add-Ons",
    description: "Enhance any color service with these additions.",
    items: [
      { name: "Lowlight Add-On", prices: { 'new-talent': '$50', 'emerging': '$50', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Root Smudge Add-On", prices: { 'new-talent': '$50', 'emerging': '$50', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Color Remover Add-On", prices: { 'new-talent': '$50', 'emerging': '$50', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "CPR Add-On", prices: { 'new-talent': '$50', 'emerging': '$50', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
      { name: "Vivid Toner Add-On", prices: { 'new-talent': '$25', 'emerging': '$25', 'lead': null, 'senior': null, 'signature': null, 'icon': null } },
    ],
  },
  {
    category: "Extensions - Install",
    description: "Premium extensions installed with precision for natural volume and length.",
    items: [
      { name: "1 Row Initial Install", prices: { 'new-talent': '$125', 'emerging': '$150', 'lead': '$225', 'senior': '$300', 'signature': '$350', 'icon': '$400' } },
      { name: "2 Row Initial Install", prices: { 'new-talent': '$225', 'emerging': '$250', 'lead': '$450', 'senior': '$600', 'signature': '$750', 'icon': '$900' } },
      { name: "3 Row Initial Install", prices: { 'new-talent': '$325', 'emerging': '$350', 'lead': '$625', 'senior': '$900', 'signature': '$1,125', 'icon': '$1,350' } },
    ],
  },
  {
    category: "Extensions - Maintenance",
    description: "Keep your extensions looking flawless with regular maintenance.",
    items: [
      { name: "Weft Removal", prices: { 'new-talent': '$75', 'emerging': '$75', 'lead': '$85', 'senior': '$100', 'signature': '$100', 'icon': '$125' } },
      { name: "Tape Removal", prices: { 'new-talent': '$75', 'emerging': '$85', 'lead': '$100', 'senior': '$150', 'signature': '$175', 'icon': '$190' } },
      { name: "1 Row Mini Moveup", prices: { 'new-talent': '$75', 'emerging': '$75', 'lead': '$85', 'senior': '$100', 'signature': null, 'icon': '$300' } },
      { name: "2 Row Mini Moveup", prices: { 'new-talent': '$125', 'emerging': '$150', 'lead': '$160', 'senior': '$175', 'signature': null, 'icon': '$500' } },
      { name: "3 Row Mini Moveup", prices: { 'new-talent': '$175', 'emerging': '$225', 'lead': '$235', 'senior': '$250', 'signature': null, 'icon': '$600' } },
      { name: "1 Row Reinstall", prices: { 'new-talent': '$100', 'emerging': '$125', 'lead': '$150', 'senior': '$200', 'signature': null, 'icon': '$400' } },
      { name: "2 Row Reinstall", prices: { 'new-talent': '$200', 'emerging': '$250', 'lead': '$300', 'senior': '$400', 'signature': null, 'icon': '$800' } },
      { name: "3 Row Reinstall", prices: { 'new-talent': '$300', 'emerging': '$375', 'lead': '$450', 'senior': '$600', 'signature': null, 'icon': '$1,200' } },
    ],
  },
  {
    category: "Extensions - Hair",
    description: "Premium quality hair for your extensions.",
    items: [
      { name: "18 Inch SuperWeft", prices: { 'new-talent': '$450', 'emerging': '$450', 'lead': '$450', 'senior': '$450', 'signature': '$450', 'icon': '$450' } },
      { name: "20 Inch SuperWeft", prices: { 'new-talent': '$550', 'emerging': '$550', 'lead': '$550', 'senior': '$550', 'signature': '$550', 'icon': '$550' } },
      { name: "22 Inch SuperWeft", prices: { 'new-talent': '$650', 'emerging': '$650', 'lead': '$650', 'senior': '$650', 'signature': '$650', 'icon': '$650' } },
      { name: "24 Inch SuperWeft", prices: { 'new-talent': '$750', 'emerging': '$750', 'lead': '$750', 'senior': '$750', 'signature': '$750', 'icon': '$750' } },
      { name: "18 Inch SecreTapes", prices: { 'new-talent': '$400', 'emerging': '$400', 'lead': '$400', 'senior': '$400', 'signature': '$400', 'icon': '$400' } },
      { name: "22 Inch SecreTapes", prices: { 'new-talent': '$600', 'emerging': '$600', 'lead': '$600', 'senior': '$600', 'signature': '$600', 'icon': '$600' } },
    ],
  },
];
