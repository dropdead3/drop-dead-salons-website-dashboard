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
  isPopular?: boolean;
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
    category: "New-Client Consultations",
    description: "Start your journey with a personalized consultation.",
    items: [
      { name: "Color And/Or Cut Consultation", description: "Consultation included with color service", prices: { 'new-talent': '$15', 'emerging': '$15', 'lead': '$15', 'senior': '$15', 'signature': '$15', 'icon': '$15' } },
      { name: "Extension Consultation", description: "Explore length and volume options tailored to you", prices: { 'new-talent': '$15', 'emerging': '$15', 'lead': '$15', 'senior': '$15', 'signature': '$15', 'icon': '$15' } },
    ],
  },
  {
    category: "Cutting & Styling",
    description: "Modern cuts and styles tailored to your features and lifestyle. All cuts include wash and blowout, except Maintenance Cut and Add-On Cut.",
    items: [
      { name: "Bang Trim", description: "Bang trim or men's neck clean up (wash & blowout not included)", prices: { 'new-talent': '$15', 'emerging': '$17', 'lead': '$20', 'senior': '$23', 'signature': '$26', 'icon': '$30' } },
      { name: "Add-On Cut", description: "Haircut added to any color service (wash & blowout not included)", prices: { 'new-talent': '$45', 'emerging': '$52', 'lead': '$60', 'senior': '$68', 'signature': '$79', 'icon': '$91' } },
      { name: "Signature Cut", description: "Our signature precision haircut — includes wash & blowout", isPopular: true, prices: { 'new-talent': '$65', 'emerging': '$75', 'lead': '$86', 'senior': '$99', 'signature': '$114', 'icon': '$131' } },
      { name: "Specialty Cut", description: "Advanced cutting techniques for unique styles — includes wash & blowout", prices: { 'new-talent': '$75', 'emerging': '$86', 'lead': '$99', 'senior': '$114', 'signature': '$131', 'icon': '$151' } },
      { name: "Transformation Cut", description: "Complete style overhaul for a new look — includes wash & blowout", prices: { 'new-talent': '$75', 'emerging': '$86', 'lead': '$99', 'senior': '$114', 'signature': '$131', 'icon': '$151' } },
      { name: "Buzz Cut", description: "Clean, close-cropped clipper cut — includes wash & blowout", prices: { 'new-talent': '$35', 'emerging': '$40', 'lead': '$46', 'senior': '$53', 'signature': '$61', 'icon': '$70' } },
      { name: "Clipper Cut", description: "Classic clipper work with blending — includes wash & blowout", prices: { 'new-talent': '$40', 'emerging': '$46', 'lead': '$53', 'senior': '$61', 'signature': '$70', 'icon': '$80' } },
      { name: "Fade", description: "Expertly blended fade with precision detailing — includes wash & blowout", prices: { 'new-talent': '$50', 'emerging': '$58', 'lead': '$66', 'senior': '$76', 'signature': '$87', 'icon': '$101' } },
      { name: "Combo Cut", description: "Clipper and shear work for versatile styles — includes wash & blowout", prices: { 'new-talent': '$60', 'emerging': '$69', 'lead': '$79', 'senior': '$91', 'signature': '$105', 'icon': '$121' } },
      { name: "Wash + Blowout", description: "Shampoo, condition, and professional blowdry", isPopular: true, prices: { 'new-talent': '$50', 'emerging': '$58', 'lead': '$66', 'senior': '$76', 'signature': '$87', 'icon': '$101' } },
      { name: "Extension Wash + Blowout", description: "Gentle wash and blowout for extension clients", isPopular: true, prices: { 'new-talent': '$65', 'emerging': '$75', 'lead': '$86', 'senior': '$99', 'signature': '$114', 'icon': '$131' } },
      { name: "Member Blowout", description: "Exclusive blowout pricing for members", prices: { 'new-talent': '$45', 'emerging': '$52', 'lead': '$60', 'senior': '$68', 'signature': '$79', 'icon': '$91' } },
      { name: "Member Extension Blowout", description: "Member pricing for extension blowouts", prices: { 'new-talent': '$60', 'emerging': '$69', 'lead': '$79', 'senior': '$91', 'signature': '$105', 'icon': '$121' } },
      { name: "Hot Tool Add-On", description: "Curling or flat iron styling added to service", prices: { 'new-talent': '$15', 'emerging': '$17', 'lead': '$20', 'senior': '$23', 'signature': '$26', 'icon': '$30' } },
      { name: "Stand Alone Hot Tool Style", description: "Curls, waves, or sleek styling with hot tools", prices: { 'new-talent': '$30', 'emerging': '$35', 'lead': '$40', 'senior': '$46', 'signature': '$52', 'icon': '$60' } },
    ],
  },
  {
    category: "Highlights",
    description: "Expert lightening services from dimensional highlights to full platinum transformations.",
    items: [
      { name: "Face Frame Highlight", description: "Brightening highlights around the face", isPopular: true, prices: { 'new-talent': '$115', 'emerging': '$132', 'lead': '$152', 'senior': '$175', 'signature': '$201', 'icon': '$231' } },
      { name: "Mini Highlight", description: "Subtle dimension with strategic foil placement", prices: { 'new-talent': '$135', 'emerging': '$155', 'lead': '$179', 'senior': '$205', 'signature': '$236', 'icon': '$272' } },
      { name: "Partial Highlight", description: "Crown and face-framing highlights", prices: { 'new-talent': '$185', 'emerging': '$213', 'lead': '$245', 'senior': '$281', 'signature': '$324', 'icon': '$372' } },
      { name: "Full Highlight", description: "All-over dimensional foil highlights", isPopular: true, prices: { 'new-talent': '$240', 'emerging': '$276', 'lead': '$317', 'senior': '$365', 'signature': '$420', 'icon': '$483' } },
      { name: "Transformation Highlight", description: "Dramatic lift for a major color change", prices: { 'new-talent': '$275', 'emerging': '$316', 'lead': '$364', 'senior': '$418', 'signature': '$481', 'icon': '$553' } },
      { name: "Global Blonding", description: "Full head platinum or maximum lift service", prices: { 'new-talent': '$325', 'emerging': '$374', 'lead': '$430', 'senior': '$494', 'signature': '$568', 'icon': '$654' } },
      { name: "Lightener Retouch", description: "Root touch-up for previously lightened hair", prices: { 'new-talent': '$130', 'emerging': '$150', 'lead': '$172', 'senior': '$198', 'signature': '$227', 'icon': '$261' } },
      { name: "Transformational Lightener Retouch", description: "Extended root retouch with blending", prices: { 'new-talent': '$160', 'emerging': '$184', 'lead': '$212', 'senior': '$243', 'signature': '$280', 'icon': '$322' } },
      { name: "Partial Lightener Retouch", description: "Partial root touch-up for lightened hair", prices: { 'new-talent': '$185', 'emerging': '$213', 'lead': '$245', 'senior': '$281', 'signature': '$324', 'icon': '$372' } },
      { name: "Full Lightener Retouch", description: "Full root touch-up for lightened hair", prices: { 'new-talent': '$240', 'emerging': '$276', 'lead': '$317', 'senior': '$365', 'signature': '$420', 'icon': '$483' } },
    ],
  },
  {
    category: "Balayage",
    description: "Hand-painted artistry for natural, sun-kissed dimension and lived-in color.",
    items: [
      { name: "Partial Balayage", description: "Hand-painted highlights on top layers", prices: { 'new-talent': '$265', 'emerging': '$305', 'lead': '$350', 'senior': '$403', 'signature': '$463', 'icon': '$533' } },
      { name: "Full Balayage", description: "Complete hand-painted color throughout", isPopular: true, prices: { 'new-talent': '$145', 'emerging': '$167', 'lead': '$192', 'senior': '$221', 'signature': '$254', 'icon': '$292' } },
      { name: "Singular Color Block Balayage", description: "Hand-painted color block placement", prices: { 'new-talent': '$185', 'emerging': '$213', 'lead': '$245', 'senior': '$281', 'signature': '$324', 'icon': '$372' } },
      { name: "Transformational Balayage", description: "Intensive balayage for dramatic change", prices: { 'new-talent': '$265', 'emerging': '$305', 'lead': '$350', 'senior': '$403', 'signature': '$463', 'icon': '$533' } },
    ],
  },
  {
    category: "Color Blocks & Vivids",
    description: "Bold, creative color for those who dare to stand out.",
    items: [
      { name: "Singular Color Block", description: "One bold color placement", isPopular: true, prices: { 'new-talent': '$145', 'emerging': '$167', 'lead': '$192', 'senior': '$221', 'signature': '$254', 'icon': '$292' } },
      { name: "Double Color Block", description: "Two contrasting color placements", prices: { 'new-talent': '$185', 'emerging': '$213', 'lead': '$245', 'senior': '$281', 'signature': '$324', 'icon': '$372' } },
      { name: "3+ Color Blocks / Calico Placement", description: "Multiple creative color placements", prices: { 'new-talent': '$225', 'emerging': '$259', 'lead': '$298', 'senior': '$342', 'signature': '$394', 'icon': '$453' } },
      { name: "Chunky Highlight", description: "Bold chunky highlights for dimension", prices: { 'new-talent': '$195', 'emerging': '$224', 'lead': '$258', 'senior': '$297', 'signature': '$341', 'icon': '$392' } },
      { name: "Initial Split Dye Bleach Out", description: "Create initial split dye look", prices: { 'new-talent': '$185', 'emerging': '$213', 'lead': '$245', 'senior': '$281', 'signature': '$324', 'icon': '$372' } },
      { name: "Split Lightener Retouch", description: "Root touch-up for split color designs", prices: { 'new-talent': '$100', 'emerging': '$115', 'lead': '$132', 'senior': '$152', 'signature': '$175', 'icon': '$201' } },
      { name: "Split Lightener Transformation Retouch", description: "Create or refresh a split color look", prices: { 'new-talent': '$115', 'emerging': '$132', 'lead': '$152', 'senior': '$175', 'signature': '$201', 'icon': '$231' } },
      { name: "Mini Vivid", description: "Small vivid color accent or peek-a-boo", prices: { 'new-talent': '$95', 'emerging': '$109', 'lead': '$126', 'senior': '$144', 'signature': '$166', 'icon': '$191' } },
      { name: "Partial Vivid", description: "Vivid color on top layers or sections", prices: { 'new-talent': '$105', 'emerging': '$121', 'lead': '$139', 'senior': '$160', 'signature': '$184', 'icon': '$211' } },
      { name: "Full Vivid", description: "Full head of vivid fashion color", prices: { 'new-talent': '$130', 'emerging': '$150', 'lead': '$172', 'senior': '$198', 'signature': '$227', 'icon': '$261' } },
      { name: "Specialty Vivid", description: "Complex vivid designs and blends", isPopular: true, prices: { 'new-talent': '$150', 'emerging': '$173', 'lead': '$198', 'senior': '$228', 'signature': '$262', 'icon': '$302' } },
      { name: "Custom Vivid", description: "Fully customized vivid color creation", prices: { 'new-talent': '$170', 'emerging': '$196', 'lead': '$225', 'senior': '$259', 'signature': '$297', 'icon': '$342' } },
    ],
  },
  {
    category: "Color Services",
    description: "From natural coverage to custom formulations, tailored color for every vision.",
    items: [
      { name: "Natural Root Retouch", description: "Gray coverage or natural color refresh", isPopular: true, prices: { 'new-talent': '$100', 'emerging': '$115', 'lead': '$132', 'senior': '$152', 'signature': '$175', 'icon': '$201' } },
      { name: "Single Process Color (Retouch + Pull Through)", description: "Root retouch with color refresh through ends", prices: { 'new-talent': '$140', 'emerging': '$161', 'lead': '$185', 'senior': '$213', 'signature': '$245', 'icon': '$282' } },
      { name: "Single Glaze", description: "Toning service for shine and vibrancy", prices: { 'new-talent': '$100', 'emerging': '$115', 'lead': '$132', 'senior': '$152', 'signature': '$175', 'icon': '$201' } },
      { name: "Root Smudge", description: "Soft shadow root for lived-in look", prices: { 'new-talent': '$100', 'emerging': '$115', 'lead': '$132', 'senior': '$152', 'signature': '$175', 'icon': '$201' } },
      { name: "Color Melt", description: "Seamless color transition from root to ends", prices: { 'new-talent': '$135', 'emerging': '$155', 'lead': '$179', 'senior': '$205', 'signature': '$236', 'icon': '$272' } },
      { name: "Lowlight + Root Smudge Stand Alone", description: "Depth and dimension with shadow root", prices: { 'new-talent': '$145', 'emerging': '$167', 'lead': '$192', 'senior': '$221', 'signature': '$254', 'icon': '$292' } },
      { name: "Stand Alone Tint", description: "Color application to previously colored hair", prices: { 'new-talent': '$160', 'emerging': '$184', 'lead': '$212', 'senior': '$243', 'signature': '$280', 'icon': '$322' } },
      { name: "Corrective Color (by the hour)", description: "Color correction priced by time", isPopular: true, prices: { 'new-talent': '$85', 'emerging': '$98', 'lead': '$112', 'senior': '$129', 'signature': '$149', 'icon': '$171' } },
    ],
  },
  {
    category: "Color Add-Ons",
    description: "Enhance any color service with these additions.",
    isAddOn: true,
    items: [
      { name: "Lowlight Add-On", description: "Add depth with lowlights", prices: { 'new-talent': '$50', 'emerging': '$58', 'lead': '$66', 'senior': '$76', 'signature': '$87', 'icon': '$101' } },
      { name: "Back Root Smudge Add-On", description: "Add shadow root to back sections", prices: { 'new-talent': '$50', 'emerging': '$58', 'lead': '$66', 'senior': '$76', 'signature': '$87', 'icon': '$101' } },
      { name: "Color Remover Add-On", description: "Remove previous color buildup", prices: { 'new-talent': '$45', 'emerging': '$52', 'lead': '$60', 'senior': '$68', 'signature': '$79', 'icon': '$91' } },
      { name: "CPR Add-On", description: "Color prep and repair treatment", prices: { 'new-talent': '$45', 'emerging': '$52', 'lead': '$60', 'senior': '$68', 'signature': '$79', 'icon': '$91' } },
      { name: "Vivid Toner Add-On", description: "Add vivid toner to any lightening service", prices: { 'new-talent': '$25', 'emerging': '$29', 'lead': '$33', 'senior': '$38', 'signature': '$44', 'icon': '$50' } },
      { name: "K18 Add-On", description: "Bond-building treatment", prices: { 'new-talent': '$15', 'emerging': '$17', 'lead': '$20', 'senior': '$23', 'signature': '$26', 'icon': '$30' } },
    ],
  },
  {
    category: "Extensions - Install",
    description: "Premium extensions installed with precision for natural volume and length.",
    items: [
      { name: "1 Row Initial Install", description: "Single row installation for subtle fullness", isPopular: true, prices: { 'new-talent': '$150', 'emerging': '$173', 'lead': '$198', 'senior': '$228', 'signature': '$262', 'icon': '$302' } },
      { name: "2 Row Initial Install", description: "Double row for volume and length", isPopular: true, prices: { 'new-talent': '$300', 'emerging': '$345', 'lead': '$397', 'senior': '$456', 'signature': '$525', 'icon': '$603' } },
      { name: "3 Row Initial Install", description: "Triple row for maximum fullness", isPopular: true, prices: { 'new-talent': '$450', 'emerging': '$518', 'lead': '$595', 'senior': '$684', 'signature': '$787', 'icon': '$905' } },
    ],
  },
  {
    category: "Extensions - Maintenance",
    description: "Keep your extensions looking flawless with regular maintenance.",
    items: [
      { name: "Weft Removal", description: "Safe removal of weft extensions", prices: { 'new-talent': '$50', 'emerging': '$58', 'lead': '$66', 'senior': '$76', 'signature': '$87', 'icon': '$101' } },
      { name: "Tape Removal", description: "Gentle removal of tape-in extensions", prices: { 'new-talent': '$65', 'emerging': '$75', 'lead': '$86', 'senior': '$99', 'signature': '$114', 'icon': '$131' } },
      { name: "1 Row Mini Moveup", description: "Quick adjustment for one row", prices: { 'new-talent': '$50', 'emerging': '$58', 'lead': '$66', 'senior': '$76', 'signature': '$87', 'icon': '$101' } },
      { name: "2 Row Mini Moveup", description: "Adjustment for two rows", prices: { 'new-talent': '$100', 'emerging': '$115', 'lead': '$132', 'senior': '$152', 'signature': '$175', 'icon': '$201' } },
      { name: "3 Row Mini Moveup", description: "Adjustment for three rows", prices: { 'new-talent': '$150', 'emerging': '$173', 'lead': '$198', 'senior': '$228', 'signature': '$262', 'icon': '$302' } },
      { name: "1 Row Reinstall", description: "Full reinstallation of one row", prices: { 'new-talent': '$100', 'emerging': '$115', 'lead': '$132', 'senior': '$152', 'signature': '$175', 'icon': '$201' } },
      { name: "2 Row Reinstall", description: "Full reinstallation of two rows", prices: { 'new-talent': '$200', 'emerging': '$230', 'lead': '$265', 'senior': '$304', 'signature': '$350', 'icon': '$402' } },
      { name: "3 Row Reinstall", description: "Full reinstallation of three rows", prices: { 'new-talent': '$300', 'emerging': '$345', 'lead': '$397', 'senior': '$456', 'signature': '$525', 'icon': '$603' } },
    ],
  },
  {
    category: "Extensions - Tapes",
    description: "Tape-in extension services and pricing.",
    items: [
      { name: "Side Filler Tapes Install - 18 Inch", description: "18\" side filler tape installation", prices: { 'new-talent': '$340', 'emerging': '$340', 'lead': '$340', 'senior': '$340', 'signature': '$340', 'icon': '$340' } },
      { name: "Side Filler Tapes Install - 20 Inch", description: "20\" side filler tape installation", prices: { 'new-talent': '$415', 'emerging': '$415', 'lead': '$415', 'senior': '$415', 'signature': '$415', 'icon': '$415' } },
      { name: "Side Filler Tapes Install - 22 Inch", description: "22\" side filler tape installation", prices: { 'new-talent': '$490', 'emerging': '$490', 'lead': '$490', 'senior': '$490', 'signature': '$490', 'icon': '$490' } },
      { name: "Side Filler Tapes Install - 24 Inch", description: "24\" side filler tape installation", prices: { 'new-talent': '$565', 'emerging': '$565', 'lead': '$565', 'senior': '$565', 'signature': '$565', 'icon': '$565' } },
      { name: "Half Head Tape Install - 18 Inch", description: "18\" half head tape installation", prices: { 'new-talent': '$340', 'emerging': '$340', 'lead': '$340', 'senior': '$340', 'signature': '$340', 'icon': '$340' } },
      { name: "Half Head Tape Install - 20 Inch", description: "20\" half head tape installation", prices: { 'new-talent': '$415', 'emerging': '$415', 'lead': '$415', 'senior': '$415', 'signature': '$415', 'icon': '$415' } },
      { name: "Half Head Tape Install - 22 Inch", description: "22\" half head tape installation", prices: { 'new-talent': '$490', 'emerging': '$490', 'lead': '$490', 'senior': '$490', 'signature': '$490', 'icon': '$490' } },
      { name: "Half Head Tape Install - 24 Inch", description: "24\" half head tape installation", prices: { 'new-talent': '$565', 'emerging': '$565', 'lead': '$565', 'senior': '$565', 'signature': '$565', 'icon': '$565' } },
      { name: "Full Head Tape Install - 18 Inch", description: "18\" full head tape installation", prices: { 'new-talent': '$340', 'emerging': '$340', 'lead': '$340', 'senior': '$340', 'signature': '$340', 'icon': '$340' } },
      { name: "Full Head Tape Install - 20 Inch", description: "20\" full head tape installation", prices: { 'new-talent': '$415', 'emerging': '$415', 'lead': '$415', 'senior': '$415', 'signature': '$415', 'icon': '$415' } },
      { name: "Full Head Tape Install - 22 Inch", description: "22\" full head tape installation", prices: { 'new-talent': '$490', 'emerging': '$490', 'lead': '$490', 'senior': '$490', 'signature': '$490', 'icon': '$490' } },
      { name: "Full Head Tape Install - 24 Inch", description: "24\" full head tape installation", prices: { 'new-talent': '$565', 'emerging': '$565', 'lead': '$565', 'senior': '$565', 'signature': '$565', 'icon': '$565' } },
      { name: "Half Head Tape Maintenance - 18 Inch", description: "18\" half head tape maintenance", prices: { 'new-talent': '$300', 'emerging': '$300', 'lead': '$300', 'senior': '$300', 'signature': '$300', 'icon': '$300' } },
      { name: "Half Head Tape Maintenance - 22 Inch", description: "22\" half head tape maintenance", prices: { 'new-talent': '$450', 'emerging': '$450', 'lead': '$450', 'senior': '$450', 'signature': '$450', 'icon': '$450' } },
      { name: "Full Head Tape Maintenance - 18 Inch", description: "18\" full head tape maintenance", prices: { 'new-talent': '$300', 'emerging': '$300', 'lead': '$300', 'senior': '$300', 'signature': '$300', 'icon': '$300' } },
      { name: "Full Head Tape Maintenance - 22 Inch", description: "22\" full head tape maintenance", prices: { 'new-talent': '$450', 'emerging': '$450', 'lead': '$450', 'senior': '$450', 'signature': '$450', 'icon': '$450' } },
    ],
  },
];
