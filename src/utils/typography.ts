import { Language, FontFamily, FontSize } from '../types';

export interface FontFamilyOption {
  id: FontFamily;
  nameEn: string;
  nameAr: string;
  categoryEn: string;
  categoryAr: string;
  sampleEn: string;
  sampleAr: string;
  fontFamilyLatin: string;
  fontFamilyArabic: string;
}

export interface FontSizeOption {
  id: FontSize;
  nameEn: string;
  nameAr: string;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  scalePercent: number; // Applied to html font-size
  basePx: number;
}

export const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
  {
    id: 'default',
    nameEn: 'Plus Jakarta & Tajawal',
    nameAr: 'بلس جاكرتا & تاجاوال',
    categoryEn: 'Modern Sans',
    categoryAr: 'عصري ناعم',
    sampleEn: 'Clean, elegant, modern design',
    sampleAr: 'تصميم أنيق وعصري ومريح',
    fontFamilyLatin: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyArabic: "'Tajawal', 'Noto Sans Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: 'inter',
    nameEn: 'Inter & Noto Sans',
    nameAr: 'إنتر & نوتو سانز',
    categoryEn: 'UI Neutral',
    categoryAr: 'واجهة واضحة',
    sampleEn: 'Optimized for high readability & clarity',
    sampleAr: 'خط عالي الوضوح والدقة لجميع الشاشات',
    fontFamilyLatin: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyArabic: "'Noto Sans Arabic', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: 'cairo',
    nameEn: 'Outfit & Cairo',
    nameAr: 'آوتفت & كايرو',
    categoryEn: 'Geometric',
    categoryAr: 'هندسي حيوي',
    sampleEn: 'Bold geometry with friendly curves',
    sampleAr: 'خط عربي هندسي بارز وجميل',
    fontFamilyLatin: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyArabic: "'Cairo', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: 'alexandria',
    nameEn: 'Poppins & Alexandria',
    nameAr: 'بوبنز & الإسكندرية',
    categoryEn: 'Rounded Display',
    categoryAr: 'دائري جذاب',
    sampleEn: 'Soft rounded geometry with personality',
    sampleAr: 'انسيابي متوازن ومميز للقراءة',
    fontFamilyLatin: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyArabic: "'Alexandria', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: 'serif',
    nameEn: 'Playfair & Amiri',
    nameAr: 'بلايفير & أميري',
    categoryEn: 'Editorial Serif',
    categoryAr: 'كلاسيكي أصيل',
    sampleEn: 'Refined editorial character & elegance',
    sampleAr: 'خط تقليدي كلاسيكي بلمسة فنية راقية',
    fontFamilyLatin: "'Playfair Display', Georgia, Cambria, 'Amiri', serif",
    fontFamilyArabic: "'Amiri', 'Playfair Display', Georgia, serif",
  },
  {
    id: 'mono',
    nameEn: 'JetBrains Mono',
    nameAr: 'جيت برينز مونو',
    categoryEn: 'Monospace',
    categoryAr: 'أحادي المسافة',
    sampleEn: 'Technical precision with aligned glyphs',
    sampleAr: 'دقة تقنية وحروف متساوية المسافات',
    fontFamilyLatin: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontFamilyArabic: "'JetBrains Mono', 'Tajawal', ui-monospace, monospace",
  },
  {
    id: 'system',
    nameEn: 'System Native',
    nameAr: 'خط النظام الأصلي',
    categoryEn: 'Native OS',
    categoryAr: 'افتراضي الجهاز',
    sampleEn: 'Fastest rendering with zero download',
    sampleAr: 'الخط الافتراضي الأصلي لجهازك',
    fontFamilyLatin: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontFamilyArabic: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
];

export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  {
    id: 'small',
    nameEn: 'Compact',
    nameAr: 'مدمج',
    labelEn: 'Small (14px)',
    labelAr: 'صغير (14 بكسل)',
    descEn: 'Shows more items on screen with tighter layout',
    descAr: 'يعرض عناصر أكثر على الشاشة بمساحة أصغر',
    scalePercent: 87.5,
    basePx: 14,
  },
  {
    id: 'medium',
    nameEn: 'Default',
    nameAr: 'افتراضي',
    labelEn: 'Standard (16px)',
    labelAr: 'قياسي (16 بكسل)',
    descEn: 'Standard balanced size for all devices',
    descAr: 'المقاس القياسي المتوازن لجميع الشاشات',
    scalePercent: 100,
    basePx: 16,
  },
  {
    id: 'large',
    nameEn: 'Large',
    nameAr: 'كبير',
    labelEn: 'Large (18px)',
    labelAr: 'كبير (18 بكسل)',
    descEn: 'Comfortable reading for tasks and notes',
    descAr: 'قراءة مريحة للعناصر والتفاصيل',
    scalePercent: 112.5,
    basePx: 18,
  },
  {
    id: 'xlarge',
    nameEn: 'Extra Large',
    nameAr: 'كبير جداً',
    labelEn: 'X-Large (20px)',
    labelAr: 'كبير جداً (20 بكسل)',
    descEn: 'Maximum legibility and enhanced accessibility',
    descAr: 'أقصى درجات الوضوح وسهولة القراءة الفائقة',
    scalePercent: 125,
    basePx: 20,
  },
];

export const getFontFamilyOption = (id?: FontFamily | string): FontFamilyOption => {
  return FONT_FAMILY_OPTIONS.find((f) => f.id === id) || FONT_FAMILY_OPTIONS[0];
};

export const getFontSizeOption = (id?: FontSize | string): FontSizeOption => {
  return FONT_SIZE_OPTIONS.find((s) => s.id === id) || FONT_SIZE_OPTIONS[1];
};

export const getFontFamilyName = (id?: FontFamily | string, lang: Language = 'en'): string => {
  const opt = getFontFamilyOption(id);
  return lang === 'ar' ? opt.nameAr : opt.nameEn;
};

export const getFontSizeName = (id?: FontSize | string, lang: Language = 'en'): string => {
  const opt = getFontSizeOption(id);
  return lang === 'ar' ? opt.nameAr : opt.nameEn;
};

export const applyTypographyToDOM = (
  font: FontFamily = 'default',
  size: FontSize = 'medium'
) => {
  if (typeof document === 'undefined') return;
  const fontOpt = getFontFamilyOption(font);
  const sizeOpt = getFontSizeOption(size);
  const root = document.documentElement;

  root.setAttribute('data-font', fontOpt.id);
  root.setAttribute('data-font-size', sizeOpt.id);

  root.style.setProperty('--font-latin', fontOpt.fontFamilyLatin);
  root.style.setProperty('--font-arabic', fontOpt.fontFamilyArabic);

  // Scaling root html font-size scales all rem units smoothly in Tailwind
  root.style.fontSize = `${sizeOpt.scalePercent}%`;
};
