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
  description?: string;
  prices: Record<StylistLevel, string | null>;
};

export type ServiceCategory = {
  category: string;
  description: string;
  isAddOn?: boolean;
  items: ServiceItem[];
};

export const services: ServiceCategory[] = [
  {
    category: "Consultations",
    description: "Start your journey with a personalized consultation.",
    items: [
      { name: "Color Consultation", description: "Discuss your color goals and create a custom plan", prices: { 'new-talent': '$15', 'emerging': '$15', 'lead': '$15', 'senior': '$20', 'signature': '$25', 'icon': '$30' } },
      { name: "Cut Consultation", description: "Find the perfect cut for your face shape and lifestyle", prices: { 'new-talent': '$15', 'emerging': '$15', 'lead': '$15', 'senior': '$20', 'signature': '$25', 'icon': '$30' } },
      { name: "Extension Consultation", description: "Explore length and volume options tailored to you", prices: { 'new-talent': '$15', 'emerging': '$15', 'lead': '$15', 'senior': '$20', 'signature': '$25', 'icon': '$30' } },
    ],
  },
  {
    category: "Cutting & Styling",
    description: "Modern cuts and styles tailored to your features and lifestyle.",
    items: [
      { name: "Maintenance Cut", description: "Quick trim to maintain your current shape", prices: { 'new-talent': '$15', 'emerging': '$15', 'lead': '$20', 'senior': '$20', 'signature': '$25', 'icon': '$30' } },
      { name: "Add-On Cut", description: "Haircut added to any color service", prices: { 'new-talent': '$45', 'emerging': '$55', 'lead': '$65', 'senior': '$75', 'signature': '$85', 'icon': '$95' } },
      { name: "Signature Cut", description: "Our signature precision haircut with consultation", prices: { 'new-talent': '$65', 'emerging': '$75', 'lead': '$85', 'senior': '$95', 'signature': '$105', 'icon': '$115' } },
      { name: "Specialty Cut", description: "Advanced cutting techniques for unique styles", prices: { 'new-talent': '$75', 'emerging': '$85', 'lead': '$95', 'senior': '$115', 'signature': '$135', 'icon': '$155' } },
      { name: "Transformation Cut", description: "Complete style overhaul for a new look", prices: { 'new-talent': '$75', 'emerging': '$85', 'lead': '$95', 'senior': '$115', 'signature': '$135', 'icon': '$155' } },
      { name: "Buzz Cut", description: "Clean, close-cropped clipper cut", prices: { 'new-talent': '$35', 'emerging': '$35', 'lead': '$40', 'senior': '$40', 'signature': '$45', 'icon': '$50' } },
      { name: "Clipper Cut", description: "Classic clipper work with blending", prices: { 'new-talent': '$40', 'emerging': '$40', 'lead': '$50', 'senior': '$50', 'signature': '$55', 'icon': '$60' } },
      { name: "Fade", description: "Expertly blended fade with precision detailing", prices: { 'new-talent': '$50', 'emerging': '$50', 'lead': '$60', 'senior': '$60', 'signature': '$70', 'icon': '$80' } },
      { name: "Combo Cut", description: "Clipper and shear work for versatile styles", prices: { 'new-talent': '$60', 'emerging': '$60', 'lead': '$75', 'senior': '$75', 'signature': '$85', 'icon': '$95' } },
      { name: "Wash + Blowout", description: "Shampoo, condition, and professional blowdry", prices: { 'new-talent': '$50', 'emerging': '$50', 'lead': '$60', 'senior': '$60', 'signature': '$70', 'icon': '$80' } },
      { name: "Extension Wash + Blowout", description: "Gentle wash and blowout for extension clients", prices: { 'new-talent': '$65', 'emerging': '$65', 'lead': '$75', 'senior': '$75', 'signature': '$85', 'icon': '$95' } },
      { name: "Member Blowout", description: "Exclusive blowout pricing for members", prices: { 'new-talent': '$45', 'emerging': '$45', 'lead': '$50', 'senior': '$50', 'signature': '$55', 'icon': '$60' } },
      { name: "Member Extension Blowout", description: "Member pricing for extension blowouts", prices: { 'new-talent': '$60', 'emerging': '$60', 'lead': '$60', 'senior': '$70', 'signature': '$80', 'icon': '$90' } },
      { name: "Hot Tool Add-On", description: "Curling or flat iron styling added to service", prices: { 'new-talent': '$15', 'emerging': '$15', 'lead': '$20', 'senior': '$20', 'signature': '$25', 'icon': '$30' } },
      { name: "Stand Alone Hot Tool Style", description: "Curls, waves, or sleek styling with hot tools", prices: { 'new-talent': '$25', 'emerging': '$25', 'lead': '$35', 'senior': '$35', 'signature': '$45', 'icon': '$55' } },
    ],
  },
  {
    category: "Highlights",
    description: "Expert lightening services from dimensional highlights to full platinum transformations.",
    items: [
      { name: "Face Frame Highlight", description: "Brightening highlights around the face", prices: { 'new-talent': '$115', 'emerging': '$135', 'lead': '$145', 'senior': '$155', 'signature': '$170', 'icon': '$185' } },
      { name: "Mini Highlight", description: "Subtle dimension with strategic foil placement", prices: { 'new-talent': '$135', 'emerging': '$155', 'lead': '$165', 'senior': '$175', 'signature': '$190', 'icon': '$205' } },
      { name: "Partial Highlight", description: "Crown and face-framing highlights", prices: { 'new-talent': '$185', 'emerging': '$205', 'lead': '$245', 'senior': '$275', 'signature': '$305', 'icon': '$335' } },
      { name: "Full Highlight", description: "All-over dimensional foil highlights", prices: { 'new-talent': '$240', 'emerging': '$265', 'lead': '$300', 'senior': '$350', 'signature': '$400', 'icon': '$450' } },
      { name: "Transformation Highlight", description: "Dramatic lift for a major color change", prices: { 'new-talent': '$275', 'emerging': '$315', 'lead': '$350', 'senior': '$385', 'signature': '$420', 'icon': '$460' } },
      { name: "Global Blonding", description: "Full head platinum or maximum lift service", prices: { 'new-talent': '$325', 'emerging': '$365', 'lead': '$385', 'senior': '$400', 'signature': '$425', 'icon': '$450' } },
      { name: "Lightener Retouch", description: "Root touch-up for previously lightened hair", prices: { 'new-talent': '$130', 'emerging': '$155', 'lead': '$185', 'senior': '$210', 'signature': '$235', 'icon': '$260' } },
      { name: "Transformational Lightener Retouch", description: "Extended root retouch with blending", prices: { 'new-talent': '$160', 'emerging': '$185', 'lead': '$200', 'senior': '$225', 'signature': '$250', 'icon': '$275' } },
    ],
  },
  {
    category: "Balayage",
    description: "Hand-painted artistry for natural, sun-kissed dimension and lived-in color.",
    items: [
      { name: "Partial Balayage", description: "Hand-painted highlights on top layers", prices: { 'new-talent': '$185', 'emerging': '$220', 'lead': '$245', 'senior': '$275', 'signature': '$305', 'icon': '$335' } },
      { name: "Full Balayage", description: "Complete hand-painted color throughout", prices: { 'new-talent': '$240', 'emerging': '$285', 'lead': '$325', 'senior': '$375', 'signature': '$425', 'icon': '$475' } },
      { name: "Transformational Balayage", description: "Intensive balayage for dramatic change", prices: { 'new-talent': '$300', 'emerging': '$330', 'lead': '$370', 'senior': '$400', 'signature': '$435', 'icon': '$475' } },
    ],
  },
  {
    category: "Color Blocks & Vivids",
    description: "Bold, creative color for those who dare to stand out.",
    items: [
      { name: "Singular Color Block", description: "One bold color placement", prices: { 'new-talent': '$145', 'emerging': '$145', 'lead': '$160', 'senior': '$180', 'signature': '$200', 'icon': '$220' } },
      { name: "Double Color Block", description: "Two contrasting color placements", prices: { 'new-talent': '$185', 'emerging': '$185', 'lead': '$210', 'senior': '$235', 'signature': '$260', 'icon': '$285' } },
      { name: "3+ Color Blocks / Calico Placement", description: "Multiple creative color placements", prices: { 'new-talent': '$225', 'emerging': '$225', 'lead': '$275', 'senior': '$315', 'signature': '$355', 'icon': '$395' } },
      { name: "Split Lightener Retouch", description: "Root touch-up for split color designs", prices: { 'new-talent': '$100', 'emerging': '$125', 'lead': '$155', 'senior': '$180', 'signature': '$205', 'icon': '$230' } },
      { name: "Split Lightener Transformation", description: "Create or refresh a split color look", prices: { 'new-talent': '$105', 'emerging': '$125', 'lead': '$145', 'senior': '$165', 'signature': '$185', 'icon': '$205' } },
      { name: "Mini Vivid", description: "Small vivid color accent or peek-a-boo", prices: { 'new-talent': '$95', 'emerging': '$105', 'lead': '$115', 'senior': '$130', 'signature': '$145', 'icon': '$160' } },
      { name: "Partial Vivid", description: "Vivid color on top layers or sections", prices: { 'new-talent': '$105', 'emerging': '$120', 'lead': '$135', 'senior': '$150', 'signature': '$165', 'icon': '$180' } },
      { name: "Max Vivid", description: "Full head of vivid fashion color", prices: { 'new-talent': '$130', 'emerging': '$150', 'lead': '$170', 'senior': '$190', 'signature': '$210', 'icon': '$230' } },
      { name: "Specialty Vivid", description: "Complex vivid designs and blends", prices: { 'new-talent': '$150', 'emerging': '$165', 'lead': '$185', 'senior': '$205', 'signature': '$225', 'icon': '$250' } },
      { name: "Custom Vivid", description: "Fully customized vivid color creation", prices: { 'new-talent': '$170', 'emerging': '$185', 'lead': '$205', 'senior': '$225', 'signature': '$250', 'icon': '$275' } },
    ],
  },
  {
    category: "Color Services",
    description: "From natural coverage to custom formulations, tailored color for every vision.",
    items: [
      { name: "Natural Root Retouch", description: "Gray coverage or natural color refresh", prices: { 'new-talent': '$100', 'emerging': '$110', 'lead': '$120', 'senior': '$135', 'signature': '$150', 'icon': '$165' } },
      { name: "Single Process Color (Retouch + Pull Through)", description: "Root retouch with color refresh through ends", prices: { 'new-talent': '$140', 'emerging': '$150', 'lead': '$165', 'senior': '$180', 'signature': '$195', 'icon': '$215' } },
      { name: "Single Glaze", description: "Toning service for shine and vibrancy", prices: { 'new-talent': '$100', 'emerging': '$110', 'lead': '$120', 'senior': '$135', 'signature': '$150', 'icon': '$165' } },
      { name: "Root Smudge", description: "Soft shadow root for lived-in look", prices: { 'new-talent': '$100', 'emerging': '$110', 'lead': '$120', 'senior': '$135', 'signature': '$150', 'icon': '$165' } },
      { name: "Color Melt", description: "Seamless color transition from root to ends", prices: { 'new-talent': '$135', 'emerging': '$145', 'lead': '$160', 'senior': '$175', 'signature': '$190', 'icon': '$210' } },
      { name: "Lowlight + Root Smudge Stand Alone", description: "Depth and dimension with shadow root", prices: { 'new-talent': '$145', 'emerging': '$165', 'lead': '$185', 'senior': '$205', 'signature': '$225', 'icon': '$250' } },
      { name: "Tint Back", description: "Return to your natural or darker shade", prices: { 'new-talent': '$160', 'emerging': '$170', 'lead': '$185', 'senior': '$200', 'signature': '$220', 'icon': '$240' } },
      { name: "Corrective Color (by the hour)", description: "Color correction priced by time", prices: { 'new-talent': '$85', 'emerging': '$90', 'lead': '$100', 'senior': '$115', 'signature': '$125', 'icon': '$150' } },
    ],
  },
  {
    category: "Color Add-Ons",
    description: "Enhance any color service with these additions.",
    isAddOn: true,
    items: [
      { name: "Lowlight Add-On", description: "Add depth with lowlights", prices: { 'new-talent': '$50', 'emerging': '$50', 'lead': '$55', 'senior': '$60', 'signature': '$65', 'icon': '$75' } },
      { name: "Root Smudge Add-On", description: "Add shadow root to any service", prices: { 'new-talent': '$50', 'emerging': '$50', 'lead': '$55', 'senior': '$60', 'signature': '$65', 'icon': '$75' } },
      { name: "Color Remover Add-On", description: "Remove previous color buildup", prices: { 'new-talent': '$50', 'emerging': '$50', 'lead': '$55', 'senior': '$60', 'signature': '$65', 'icon': '$75' } },
      { name: "CPR Add-On", description: "Color prep and repair treatment", prices: { 'new-talent': '$50', 'emerging': '$50', 'lead': '$55', 'senior': '$60', 'signature': '$65', 'icon': '$75' } },
      { name: "Vivid Toner Add-On", description: "Add vivid toner to any lightening service", prices: { 'new-talent': '$25', 'emerging': '$25', 'lead': '$30', 'senior': '$35', 'signature': '$40', 'icon': '$50' } },
    ],
  },
  {
    category: "Extensions - Install",
    description: "Premium extensions installed with precision for natural volume and length.",
    items: [
      { name: "1 Row Initial Install", description: "Single row installation for subtle fullness", prices: { 'new-talent': '$125', 'emerging': '$150', 'lead': '$225', 'senior': '$300', 'signature': '$350', 'icon': '$400' } },
      { name: "2 Row Initial Install", description: "Double row for volume and length", prices: { 'new-talent': '$225', 'emerging': '$250', 'lead': '$450', 'senior': '$600', 'signature': '$750', 'icon': '$900' } },
      { name: "3 Row Initial Install", description: "Triple row for maximum fullness", prices: { 'new-talent': '$325', 'emerging': '$350', 'lead': '$625', 'senior': '$900', 'signature': '$1,125', 'icon': '$1,350' } },
    ],
  },
  {
    category: "Extensions - Maintenance",
    description: "Keep your extensions looking flawless with regular maintenance.",
    items: [
      { name: "Weft Removal", description: "Safe removal of weft extensions", prices: { 'new-talent': '$75', 'emerging': '$75', 'lead': '$85', 'senior': '$100', 'signature': '$100', 'icon': '$125' } },
      { name: "Tape Removal", description: "Gentle removal of tape-in extensions", prices: { 'new-talent': '$75', 'emerging': '$85', 'lead': '$100', 'senior': '$150', 'signature': '$175', 'icon': '$190' } },
      { name: "1 Row Mini Moveup", description: "Quick adjustment for one row", prices: { 'new-talent': '$75', 'emerging': '$75', 'lead': '$85', 'senior': '$100', 'signature': '$200', 'icon': '$300' } },
      { name: "2 Row Mini Moveup", description: "Adjustment for two rows", prices: { 'new-talent': '$125', 'emerging': '$150', 'lead': '$160', 'senior': '$175', 'signature': '$350', 'icon': '$500' } },
      { name: "3 Row Mini Moveup", description: "Adjustment for three rows", prices: { 'new-talent': '$175', 'emerging': '$225', 'lead': '$235', 'senior': '$250', 'signature': '$450', 'icon': '$600' } },
      { name: "1 Row Reinstall", description: "Full reinstallation of one row", prices: { 'new-talent': '$100', 'emerging': '$125', 'lead': '$150', 'senior': '$200', 'signature': '$300', 'icon': '$400' } },
      { name: "2 Row Reinstall", description: "Full reinstallation of two rows", prices: { 'new-talent': '$200', 'emerging': '$250', 'lead': '$300', 'senior': '$400', 'signature': '$600', 'icon': '$800' } },
      { name: "3 Row Reinstall", description: "Full reinstallation of three rows", prices: { 'new-talent': '$300', 'emerging': '$375', 'lead': '$450', 'senior': '$600', 'signature': '$900', 'icon': '$1,200' } },
    ],
  },
  {
    category: "Extensions - Hair",
    description: "Premium quality hair for your extensions.",
    isAddOn: true,
    items: [
      { name: "18 Inch SuperWeft", description: "Premium 18\" weft extension hair", prices: { 'new-talent': '$450', 'emerging': '$450', 'lead': '$450', 'senior': '$450', 'signature': '$450', 'icon': '$450' } },
      { name: "20 Inch SuperWeft", description: "Premium 20\" weft extension hair", prices: { 'new-talent': '$550', 'emerging': '$550', 'lead': '$550', 'senior': '$550', 'signature': '$550', 'icon': '$550' } },
      { name: "22 Inch SuperWeft", description: "Premium 22\" weft extension hair", prices: { 'new-talent': '$650', 'emerging': '$650', 'lead': '$650', 'senior': '$650', 'signature': '$650', 'icon': '$650' } },
      { name: "24 Inch SuperWeft", description: "Premium 24\" weft extension hair", prices: { 'new-talent': '$750', 'emerging': '$750', 'lead': '$750', 'senior': '$750', 'signature': '$750', 'icon': '$750' } },
      { name: "18 Inch SecreTapes", description: "Premium 18\" tape-in extension hair", prices: { 'new-talent': '$400', 'emerging': '$400', 'lead': '$400', 'senior': '$400', 'signature': '$400', 'icon': '$400' } },
      { name: "22 Inch SecreTapes", description: "Premium 22\" tape-in extension hair", prices: { 'new-talent': '$600', 'emerging': '$600', 'lead': '$600', 'senior': '$600', 'signature': '$600', 'icon': '$600' } },
    ],
  },
];
