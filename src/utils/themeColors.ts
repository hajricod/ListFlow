import { Language, ThemeColor } from '../types';

export interface ThemeColorOption {
  id: ThemeColor;
  nameEn: string;
  nameAr: string;
  hex: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  textLight: string;
  textDark: string;
  ring: string;
  solidBg: string;
  solidHover: string;
}

export const THEME_COLOR_OPTIONS: ThemeColorOption[] = [
  {
    id: 'emerald',
    nameEn: 'Emerald Green',
    nameAr: 'أخضر زمردي',
    hex: '#10b981',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/60',
    borderLight: 'border-emerald-200/90',
    borderDark: 'dark:border-emerald-800/60',
    textLight: 'text-emerald-700',
    textDark: 'dark:text-emerald-300',
    ring: 'ring-emerald-500/20',
    solidBg: 'bg-emerald-600',
    solidHover: 'hover:bg-emerald-700',
  },
  {
    id: 'indigo',
    nameEn: 'Royal Indigo',
    nameAr: 'نيلي ملكي',
    hex: '#6366f1',
    bgLight: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-950/60',
    borderLight: 'border-indigo-200/90',
    borderDark: 'dark:border-indigo-800/60',
    textLight: 'text-indigo-700',
    textDark: 'dark:text-indigo-300',
    ring: 'ring-indigo-500/20',
    solidBg: 'bg-indigo-600',
    solidHover: 'hover:bg-indigo-700',
  },
  {
    id: 'blue',
    nameEn: 'Ocean Blue',
    nameAr: 'أزرق محيطي',
    hex: '#3b82f6',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/60',
    borderLight: 'border-blue-200/90',
    borderDark: 'dark:border-blue-800/60',
    textLight: 'text-blue-700',
    textDark: 'dark:text-blue-300',
    ring: 'ring-blue-500/20',
    solidBg: 'bg-blue-600',
    solidHover: 'hover:bg-blue-700',
  },
  {
    id: 'violet',
    nameEn: 'Electric Violet',
    nameAr: 'بنفسجي زاهي',
    hex: '#8b5cf6',
    bgLight: 'bg-violet-50',
    bgDark: 'dark:bg-violet-950/60',
    borderLight: 'border-violet-200/90',
    borderDark: 'dark:border-violet-800/60',
    textLight: 'text-violet-700',
    textDark: 'dark:text-violet-300',
    ring: 'ring-violet-500/20',
    solidBg: 'bg-violet-600',
    solidHover: 'hover:bg-violet-700',
  },
  {
    id: 'rose',
    nameEn: 'Crimson Rose',
    nameAr: 'وردي قرمزي',
    hex: '#f43f5e',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/60',
    borderLight: 'border-rose-200/90',
    borderDark: 'dark:border-rose-800/60',
    textLight: 'text-rose-700',
    textDark: 'dark:text-rose-300',
    ring: 'ring-rose-500/20',
    solidBg: 'bg-rose-600',
    solidHover: 'hover:bg-rose-700',
  },
  {
    id: 'amber',
    nameEn: 'Golden Amber',
    nameAr: 'عنبري ذهبي',
    hex: '#f59e0b',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/60',
    borderLight: 'border-amber-200/90',
    borderDark: 'dark:border-amber-800/60',
    textLight: 'text-amber-700',
    textDark: 'dark:text-amber-300',
    ring: 'ring-amber-500/20',
    solidBg: 'bg-amber-600',
    solidHover: 'hover:bg-amber-700',
  },
  {
    id: 'teal',
    nameEn: 'Alpine Teal',
    nameAr: 'تركوازي بحري',
    hex: '#14b8a6',
    bgLight: 'bg-teal-50',
    bgDark: 'dark:bg-teal-950/60',
    borderLight: 'border-teal-200/90',
    borderDark: 'dark:border-teal-800/60',
    textLight: 'text-teal-700',
    textDark: 'dark:text-teal-300',
    ring: 'ring-teal-500/20',
    solidBg: 'bg-teal-600',
    solidHover: 'hover:bg-teal-700',
  },
  {
    id: 'cyan',
    nameEn: 'Glacier Cyan',
    nameAr: 'سماوي منعش',
    hex: '#06b6d4',
    bgLight: 'bg-cyan-50',
    bgDark: 'dark:bg-cyan-950/60',
    borderLight: 'border-cyan-200/90',
    borderDark: 'dark:border-cyan-800/60',
    textLight: 'text-cyan-700',
    textDark: 'dark:text-cyan-300',
    ring: 'ring-cyan-500/20',
    solidBg: 'bg-cyan-600',
    solidHover: 'hover:bg-cyan-700',
  },
  {
    id: 'orange',
    nameEn: 'Sunset Orange',
    nameAr: 'برتقالي غروب',
    hex: '#f97316',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-950/60',
    borderLight: 'border-orange-200/90',
    borderDark: 'dark:border-orange-800/60',
    textLight: 'text-orange-700',
    textDark: 'dark:text-orange-300',
    ring: 'ring-orange-500/20',
    solidBg: 'bg-orange-600',
    solidHover: 'hover:bg-orange-700',
  },
];

export const THEME_COLOR_PALETTES: Record<
  ThemeColor,
  {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
    rgb: string;
  }
> = {
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
    rgb: '16, 185, 129',
  },
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
    rgb: '99, 102, 241',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
    rgb: '59, 130, 246',
  },
  violet: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
    rgb: '139, 92, 246',
  },
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
    rgb: '244, 63, 94',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
    rgb: '245, 158, 11',
  },
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
    rgb: '20, 184, 166',
  },
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
    rgb: '6, 182, 212',
  },
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
    rgb: '249, 115, 22',
  },
};

export const getThemeColorOption = (id?: ThemeColor | string): ThemeColorOption => {
  return THEME_COLOR_OPTIONS.find((c) => c.id === id) || THEME_COLOR_OPTIONS[0];
};

export const getThemeColorName = (id?: ThemeColor | string, lang: Language = 'en'): string => {
  const opt = getThemeColorOption(id);
  return lang === 'ar' ? opt.nameAr : opt.nameEn;
};

export const applyThemeColorToDOM = (color?: ThemeColor | string) => {
  if (typeof document === 'undefined') return;
  const opt = getThemeColorOption(color);
  const palette = THEME_COLOR_PALETTES[opt.id] || THEME_COLOR_PALETTES.emerald;
  const root = document.documentElement;

  root.setAttribute('data-theme-color', opt.id);
  root.style.setProperty('--primary-color', opt.hex);
  root.style.setProperty('--primary-rgb', palette.rgb);
  root.style.setProperty('--color-emerald-50', palette[50]);
  root.style.setProperty('--color-emerald-100', palette[100]);
  root.style.setProperty('--color-emerald-200', palette[200]);
  root.style.setProperty('--color-emerald-300', palette[300]);
  root.style.setProperty('--color-emerald-400', palette[400]);
  root.style.setProperty('--color-emerald-500', palette[500]);
  root.style.setProperty('--color-emerald-600', palette[600]);
  root.style.setProperty('--color-emerald-700', palette[700]);
  root.style.setProperty('--color-emerald-800', palette[800]);
  root.style.setProperty('--color-emerald-900', palette[900]);
  root.style.setProperty('--color-emerald-950', palette[950]);
};
