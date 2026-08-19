import { AppList, ListGroup, ListItem, Language, Theme, ThemeColor } from '../types';

const STORAGE_KEYS = {
  LISTS: 'taskflow_app_lists_v3',
  ACTIVE_LIST_ID: 'taskflow_active_list_id_v3',
  GROUPS: 'taskflow_grocery_groups_v3',
  ITEMS: 'taskflow_grocery_items_v3',
  LANGUAGE: 'taskflow_language_v1',
  THEME: 'taskflow_theme_v1',
  THEME_COLOR: 'taskflow_theme_color_v1',
  SOUND: 'taskflow_sound_v1',
  GRID_COLUMNS: 'taskflow_grid_columns_v1',
};

export const SEED_LISTS: Record<Language, AppList[]> = {
  en: [
    {
      id: 'list-groceries',
      title: 'Weekly Groceries',
      color: '#10b981', // Emerald
      icon: 'check-square',
      description: 'Weekly food essentials, fresh produce, and pantry staples',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'list-work',
      title: 'Work Sprint',
      color: '#6366f1', // Indigo
      icon: 'briefcase',
      description: 'Sprint milestones, client deliverables, and design tasks',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'list-personal',
      title: 'Personal Goals',
      color: '#f59e0b', // Amber
      icon: 'sparkles',
      description: 'Daily routines, reading list, and wellness tracking',
      createdAt: new Date().toISOString(),
    },
  ],
  ar: [
    {
      id: 'list-groceries',
      title: 'مقاضي الأسرة الأسبوعية',
      color: '#10b981',
      icon: 'check-square',
      description: 'المستلزمات الأسبوعية والخضار والمؤونة',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'list-work',
      title: 'مهام العمل والمشاريع',
      color: '#6366f1',
      icon: 'briefcase',
      description: 'مراحل المشروع ومهام البرمجة والتصميم',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'list-personal',
      title: 'الأهداف والعادات الشخصية',
      color: '#f59e0b',
      icon: 'sparkles',
      description: 'العادات اليومية والرياضة وتطوير الذات',
      createdAt: new Date().toISOString(),
    },
  ],
};

export type TemplateKey = 'weekly' | 'freshMarket' | 'bbq' | 'pantry';

export interface TemplateDefinition {
  name: Record<Language, string>;
  icon: string;
  desc: Record<Language, string>;
  groups: Record<Language, ListGroup[]>;
  items: Record<Language, ListItem[]>;
}

export const TEMPLATES_DATA: Record<TemplateKey, TemplateDefinition> = {
  weekly: {
    name: {
      en: 'Weekly Family Groceries',
      ar: 'مقاضي الأسرة الأسبوعية',
    },
    icon: 'check-square',
    desc: {
      en: 'Complete weekly staples covering produce, dairy, bakery, meat, and pantry essentials.',
      ar: 'المستلزمات الأسبوعية الكاملة: الخضار، الألبان، المخبوزات، اللحوم، والمؤونة.',
    },
    groups: {
      en: [
        {
          id: 'g-produce',
          title: 'Fresh Produce',
          color: '#10b981',
          icon: 'apple',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-dairy',
          title: 'Dairy & Eggs',
          color: '#06b6d4',
          icon: 'milk',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-bakery',
          title: 'Bakery & Grains',
          color: '#f59e0b',
          icon: 'package',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-meat',
          title: 'Meat & Seafood',
          color: '#f43f5e',
          icon: 'beef',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-pantry',
          title: 'Pantry & Spices',
          color: '#f97316',
          icon: 'shopping-bag',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-home',
          title: 'Household & Cleaning',
          color: '#6366f1',
          icon: 'home',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      ar: [
        {
          id: 'g-ar-produce',
          title: 'الخضار والفواكه الطازجة',
          color: '#10b981',
          icon: 'apple',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-ar-dairy',
          title: 'الألبان والأجبان والبيض',
          color: '#06b6d4',
          icon: 'milk',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-ar-bakery',
          title: 'المخبوزات والحبوب',
          color: '#f59e0b',
          icon: 'package',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-ar-meat',
          title: 'اللحوم والدواجن والأسماك',
          color: '#f43f5e',
          icon: 'beef',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-ar-pantry',
          title: 'المؤونة والبهارات والزيوت',
          color: '#f97316',
          icon: 'shopping-bag',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-ar-home',
          title: 'مستلزمات المنزل والنظافة',
          color: '#6366f1',
          icon: 'home',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    },
    items: {
      en: [
        {
          id: 'item-pr-1',
          groupId: 'g-produce',
          title: 'Organic Bananas',
          quantity: 1,
          unit: 'bunch',
          notes: 'Slightly green for the week',
          completed: true,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isPinned: true,
        },
        {
          id: 'item-pr-2',
          groupId: 'g-produce',
          title: 'Ripe Avocados',
          quantity: 3,
          unit: 'pcs',
          notes: 'Ready to eat for guacamole',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-pr-3',
          groupId: 'g-produce',
          title: 'Cherry Tomatoes',
          quantity: 1,
          unit: 'box',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-pr-4',
          groupId: 'g-produce',
          title: 'Baby Spinach',
          quantity: 1,
          unit: 'bag',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-dy-1',
          groupId: 'g-dairy',
          title: 'Whole Milk',
          quantity: 2,
          unit: 'L',
          notes: 'Full cream 3.8%',
          completed: true,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isPinned: true,
        },
        {
          id: 'item-dy-2',
          groupId: 'g-dairy',
          title: 'Farm Fresh Eggs',
          quantity: 1,
          unit: 'carton',
          notes: 'Large brown 12-pack',
          completed: false,
          createdAt: new Date().toISOString(),
          isPinned: true,
        },
        {
          id: 'item-dy-3',
          groupId: 'g-dairy',
          title: 'Greek Yogurt (Plain)',
          quantity: 2,
          unit: 'pack',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bk-1',
          groupId: 'g-bakery',
          title: 'Artisan Sourdough Loaf',
          quantity: 1,
          unit: 'loaf',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bk-2',
          groupId: 'g-bakery',
          title: 'Whole Grain Pita',
          quantity: 2,
          unit: 'pack',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-mt-1',
          groupId: 'g-meat',
          title: 'Fresh Chicken Breast',
          quantity: 1,
          unit: 'kg',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-mt-2',
          groupId: 'g-meat',
          title: 'Wild Atlantic Salmon',
          quantity: 2,
          unit: 'pcs',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-pt-1',
          groupId: 'g-pantry',
          title: 'Extra Virgin Olive Oil',
          quantity: 1,
          unit: 'bottle',
          notes: 'Cold pressed',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-pt-2',
          groupId: 'g-pantry',
          title: 'Specialty Ground Coffee',
          quantity: 1,
          unit: 'bag',
          notes: 'Medium roast arabica',
          completed: false,
          createdAt: new Date().toISOString(),
          isPinned: true,
        },
        {
          id: 'item-hm-1',
          groupId: 'g-home',
          title: 'Paper Towels',
          quantity: 1,
          unit: 'pack',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      ar: [
        {
          id: 'item-ar-1',
          groupId: 'g-ar-produce',
          title: 'موز عضوي طازج',
          quantity: 1,
          unit: 'باقة',
          notes: 'أخضر خفيف ليدوم طوال الأسبوع',
          completed: true,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isPinned: true,
        },
        {
          id: 'item-ar-2',
          groupId: 'g-ar-produce',
          title: 'أفوكادو طري للسلطة',
          quantity: 3,
          unit: 'حبة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-ar-3',
          groupId: 'g-ar-produce',
          title: 'طماطم كرزية وخيار طازج',
          quantity: 1,
          unit: 'علبة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-ar-4',
          groupId: 'g-ar-produce',
          title: 'سبانخ صغيرة طازجة',
          quantity: 1,
          unit: 'كيس',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-ar-5',
          groupId: 'g-ar-dairy',
          title: 'حليب كامل الدسم طازج',
          quantity: 2,
          unit: 'لتر',
          notes: 'طازج قصير الأجل',
          completed: true,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isPinned: true,
        },
        {
          id: 'item-ar-6',
          groupId: 'g-ar-dairy',
          title: 'طبق بيض بلدي طازج',
          quantity: 1,
          unit: 'طبق 30 حبة',
          completed: false,
          createdAt: new Date().toISOString(),
          isPinned: true,
        },
        {
          id: 'item-ar-7',
          groupId: 'g-ar-dairy',
          title: 'زبادي يوناني وجبن فيتا',
          quantity: 2,
          unit: 'عبوة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-ar-8',
          groupId: 'g-ar-bakery',
          title: 'خبز بر كامل وتوست نخالة',
          quantity: 2,
          unit: 'كيس',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-ar-9',
          groupId: 'g-ar-bakery',
          title: 'خبز عربي ومفرود طازج',
          quantity: 2,
          unit: 'كيس',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-ar-10',
          groupId: 'g-ar-meat',
          title: 'صدور دجاج طازجة مبردة',
          quantity: 1.5,
          unit: 'كجم',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-ar-11',
          groupId: 'g-ar-meat',
          title: 'سمك سلمون نرويجي طازج',
          quantity: 2,
          unit: 'قطعة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-ar-12',
          groupId: 'g-ar-pantry',
          title: 'زيت زيتون بكر ممتاز معصور على البارد',
          quantity: 1,
          unit: 'زجاجة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-ar-13',
          groupId: 'g-ar-pantry',
          title: 'بن قهوة مختصة مطحونة',
          quantity: 1,
          unit: 'كيس',
          notes: 'تحميص متوسط أرابيكا',
          completed: false,
          createdAt: new Date().toISOString(),
          isPinned: true,
        },
        {
          id: 'item-ar-14',
          groupId: 'g-ar-home',
          title: 'مناديل مطبخ سميكة متعددة الاستخدام',
          quantity: 1,
          unit: 'باقة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    },
  },
  freshMarket: {
    name: {
      en: 'Fresh Farmers Market',
      ar: 'سوق الخضار والفواكه الطازجة',
    },
    icon: 'apple',
    desc: {
      en: 'Focused exclusively on seasonal organic vegetables, fruits, herbs, and fresh bakery.',
      ar: 'مخصصة للخضروات الموسمية، الفواكه الطازجة، الأعشاب، والمخبز.',
    },
    groups: {
      en: [
        {
          id: 'g-fm-fruits',
          title: 'Seasonal Fruits',
          color: '#10b981',
          icon: 'apple',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-fm-veg',
          title: 'Vegetables & Greens',
          color: '#14b8a6',
          icon: 'salad',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-fm-herbs',
          title: 'Fresh Herbs & Spices',
          color: '#8b5cf6',
          icon: 'sparkles',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      ar: [
        {
          id: 'g-fm-ar-fruits',
          title: 'فواكه موسمية طازجة',
          color: '#10b981',
          icon: 'apple',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-fm-ar-veg',
          title: 'خضار وورقيات طازجة',
          color: '#14b8a6',
          icon: 'salad',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-fm-ar-herbs',
          title: 'أعشاب وتوابل طازجة',
          color: '#8b5cf6',
          icon: 'sparkles',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    },
    items: {
      en: [
        {
          id: 'item-fm-1',
          groupId: 'g-fm-fruits',
          title: 'Honeycrisp Apples',
          quantity: 1.5,
          unit: 'kg',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-fm-2',
          groupId: 'g-fm-fruits',
          title: 'Fresh Strawberries',
          quantity: 2,
          unit: 'box',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-fm-3',
          groupId: 'g-fm-veg',
          title: 'Organic Carrots with tops',
          quantity: 1,
          unit: 'bunch',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-fm-4',
          groupId: 'g-fm-veg',
          title: 'Red Bell Peppers',
          quantity: 4,
          unit: 'pcs',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-fm-5',
          groupId: 'g-fm-herbs',
          title: 'Fresh Mint & Basil',
          quantity: 2,
          unit: 'bunch',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      ar: [
        {
          id: 'item-fm-ar-1',
          groupId: 'g-fm-ar-fruits',
          title: 'تفاح أحمر مقرمش',
          quantity: 1.5,
          unit: 'كجم',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-fm-ar-2',
          groupId: 'g-fm-ar-fruits',
          title: 'فراولة طازجة',
          quantity: 2,
          unit: 'علبة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-fm-ar-3',
          groupId: 'g-fm-ar-fruits',
          title: 'برتقال عصير طازج',
          quantity: 2,
          unit: 'كجم',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-fm-ar-4',
          groupId: 'g-fm-ar-veg',
          title: 'جزر عضوي طازج',
          quantity: 1,
          unit: 'حزمة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-fm-ar-5',
          groupId: 'g-fm-ar-veg',
          title: 'فلفل رومي ملون وخيار',
          quantity: 4,
          unit: 'حبة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-fm-ar-6',
          groupId: 'g-fm-ar-herbs',
          title: 'نعناع وريحان وبقدونس طازج',
          quantity: 2,
          unit: 'حزمة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    },
  },
  bbq: {
    name: {
      en: 'BBQ & Gathering',
      ar: 'مشاوي وعطلة الأسبوع',
    },
    icon: 'flame',
    desc: {
      en: 'Meats, buns, sauces, charcoal, beverages, and appetizers for outdoor grilling.',
      ar: 'لحوم الشواء، الخبز، الصلصات، الفحم، والمشروبات للجلسات الخارجية.',
    },
    groups: {
      en: [
        {
          id: 'g-bbq-meat',
          title: 'Grill Meats & Skewers',
          color: '#ef4444',
          icon: 'beef',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-bbq-sides',
          title: 'Buns, Dips & Sides',
          color: '#f59e0b',
          icon: 'package',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-bbq-drinks',
          title: 'Drinks & Ice',
          color: '#3b82f6',
          icon: 'soda',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      ar: [
        {
          id: 'g-bbq-ar-meat',
          title: 'لحوم الشواء وأسياخ الكباب',
          color: '#ef4444',
          icon: 'beef',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-bbq-ar-sides',
          title: 'الخبز والمقبلات والصلصات',
          color: '#f59e0b',
          icon: 'package',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-bbq-ar-drinks',
          title: 'المشروبات والثلج',
          color: '#3b82f6',
          icon: 'soda',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    },
    items: {
      en: [
        {
          id: 'item-bbq-1',
          groupId: 'g-bbq-meat',
          title: 'Prime Ribeye Steaks',
          quantity: 4,
          unit: 'pcs',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bbq-2',
          groupId: 'g-bbq-meat',
          title: 'Marinated Chicken Tawook',
          quantity: 1.5,
          unit: 'kg',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bbq-3',
          groupId: 'g-bbq-sides',
          title: 'Brioche Burger Buns',
          quantity: 2,
          unit: 'pack',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bbq-4',
          groupId: 'g-bbq-sides',
          title: 'Smoky BBQ Sauce & Garlic Dip',
          quantity: 2,
          unit: 'bottle',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bbq-5',
          groupId: 'g-bbq-drinks',
          title: 'Sparkling Mineral Water',
          quantity: 6,
          unit: 'bottle',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bbq-6',
          groupId: 'g-bbq-drinks',
          title: 'Bag of Party Ice',
          quantity: 1,
          unit: 'bag',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      ar: [
        {
          id: 'item-bbq-ar-1',
          groupId: 'g-bbq-ar-meat',
          title: 'لحم ستيك ريب آي فاخر',
          quantity: 4,
          unit: 'قطعة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bbq-ar-2',
          groupId: 'g-bbq-ar-meat',
          title: 'شيش طاووق دجاج متبل',
          quantity: 1.5,
          unit: 'كجم',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bbq-ar-3',
          groupId: 'g-bbq-ar-meat',
          title: 'كباب لحم غنم متبل وجاهز',
          quantity: 1,
          unit: 'كجم',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bbq-ar-4',
          groupId: 'g-bbq-ar-sides',
          title: 'خبز بريوش للبرجر وصامولي',
          quantity: 2,
          unit: 'كيس',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bbq-ar-5',
          groupId: 'g-bbq-ar-sides',
          title: 'صلصة باربيكيو مدخنة وثومية وطحينة',
          quantity: 2,
          unit: 'علبة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bbq-ar-6',
          groupId: 'g-bbq-ar-drinks',
          title: 'مياه غازية وعصائر مشكلة',
          quantity: 6,
          unit: 'زجاجة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bbq-ar-7',
          groupId: 'g-bbq-ar-drinks',
          title: 'كيس ثلج نقي للجلسات',
          quantity: 1,
          unit: 'كيس',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-bbq-ar-8',
          groupId: 'g-bbq-ar-sides',
          title: 'فحم شواء طبيعي ومكعبات إشعال',
          quantity: 1,
          unit: 'كيس',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    },
  },
  pantry: {
    name: {
      en: 'Pantry Restock & Spices',
      ar: 'مؤونة البيت والمخزن',
    },
    icon: 'store',
    desc: {
      en: 'Essential grains, pasta, oils, sauces, canned goods, and baking supplies.',
      ar: 'تجديد المواد الجافة: أرز، مكرونة، زيوت، بقوليات، ومستلزمات الطبخ.',
    },
    groups: {
      en: [
        {
          id: 'g-pan-grains',
          title: 'Grains & Pasta',
          color: '#f59e0b',
          icon: 'package',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-pan-oils',
          title: 'Oils, Sauces & Spices',
          color: '#f97316',
          icon: 'shopping-bag',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-pan-canned',
          title: 'Canned Goods & Beans',
          color: '#06b6d4',
          icon: 'store',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      ar: [
        {
          id: 'g-pan-ar-grains',
          title: 'الحبوب والأرز والمكرونة',
          color: '#f59e0b',
          icon: 'package',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-pan-ar-oils',
          title: 'الزيوت والصلصات والبهارات',
          color: '#f97316',
          icon: 'shopping-bag',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'g-pan-ar-canned',
          title: 'المعلبات والبقوليات',
          color: '#06b6d4',
          icon: 'store',
          isCollapsed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    },
    items: {
      en: [
        {
          id: 'item-pan-1',
          groupId: 'g-pan-grains',
          title: 'Basmati Rice (Long Grain)',
          quantity: 1,
          unit: 'bag',
          notes: '5kg bag',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-pan-2',
          groupId: 'g-pan-grains',
          title: 'Italian Penne & Spaghetti',
          quantity: 3,
          unit: 'pack',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-pan-3',
          groupId: 'g-pan-oils',
          title: 'Pure Avocado Oil & Olive Oil',
          quantity: 2,
          unit: 'bottle',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-pan-4',
          groupId: 'g-pan-canned',
          title: 'Organic Chickpeas & Kidney Beans',
          quantity: 4,
          unit: 'can',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      ar: [
        {
          id: 'item-pan-ar-1',
          groupId: 'g-pan-ar-grains',
          title: 'أرز بسمتي فاخر طويل الحبة',
          quantity: 1,
          unit: 'كيس 5 كجم',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-pan-ar-2',
          groupId: 'g-pan-ar-grains',
          title: 'مكرونة إيطالية بنّا وسباغيتي',
          quantity: 3,
          unit: 'كيس',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-pan-ar-3',
          groupId: 'g-pan-ar-oils',
          title: 'زيت زيتون بكر ممتاز وزيت ذرة',
          quantity: 2,
          unit: 'زجاجة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-pan-ar-4',
          groupId: 'g-pan-ar-oils',
          title: 'معجون طماطم وبهارات مشكلة',
          quantity: 4,
          unit: 'علبة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'item-pan-ar-5',
          groupId: 'g-pan-ar-canned',
          title: 'حمص وفول وفاصوليا معلبة',
          quantity: 4,
          unit: 'علبة',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    },
  },
};

export const getLocalizedTemplate = (
  templateKey: TemplateKey,
  language: Language
): {
  name: string;
  desc: string;
  icon: string;
  groups: ListGroup[];
  items: ListItem[];
} => {
  const tpl = TEMPLATES_DATA[templateKey];
  if (!tpl) {
    return getLocalizedTemplate('weekly', language);
  }

  const lang = language === 'ar' ? 'ar' : 'en';
  return {
    name: tpl.name[lang],
    desc: tpl.desc[lang],
    icon: tpl.icon,
    groups: tpl.groups[lang],
    items: tpl.items[lang],
  };
};

// Backward-compatibility wrapper for components using legacy SEED_TEMPLATES format
export const SEED_TEMPLATES = {
  weekly: {
    name: TEMPLATES_DATA.weekly.name,
    icon: TEMPLATES_DATA.weekly.icon,
    desc: TEMPLATES_DATA.weekly.desc,
    groups: TEMPLATES_DATA.weekly.groups.en,
    items: TEMPLATES_DATA.weekly.items.en,
  },
  freshMarket: {
    name: TEMPLATES_DATA.freshMarket.name,
    icon: TEMPLATES_DATA.freshMarket.icon,
    desc: TEMPLATES_DATA.freshMarket.desc,
    groups: TEMPLATES_DATA.freshMarket.groups.en,
    items: TEMPLATES_DATA.freshMarket.items.en,
  },
  bbq: {
    name: TEMPLATES_DATA.bbq.name,
    icon: TEMPLATES_DATA.bbq.icon,
    desc: TEMPLATES_DATA.bbq.desc,
    groups: TEMPLATES_DATA.bbq.groups.en,
    items: TEMPLATES_DATA.bbq.items.en,
  },
  pantry: {
    name: TEMPLATES_DATA.pantry.name,
    icon: TEMPLATES_DATA.pantry.icon,
    desc: TEMPLATES_DATA.pantry.desc,
    groups: TEMPLATES_DATA.pantry.groups.en,
    items: TEMPLATES_DATA.pantry.items.en,
  },
};

export const SEED_WORK_GROUPS: ListGroup[] = [
  {
    id: 'g-work-sprint',
    listId: 'list-work',
    title: 'Sprint Milestones',
    color: '#6366f1',
    icon: 'target',
    isCollapsed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g-work-design',
    listId: 'list-work',
    title: 'UI & UX Design',
    color: '#ec4899',
    icon: 'palette',
    isCollapsed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g-work-review',
    listId: 'list-work',
    title: 'Code Review & QA',
    color: '#14b8a6',
    icon: 'code',
    isCollapsed: false,
    createdAt: new Date().toISOString(),
  },
];

export const SEED_WORK_ITEMS: ListItem[] = [
  {
    id: 'item-wk-1',
    groupId: 'g-work-design',
    title: 'Design responsive multi-list selector',
    notes: 'Include smooth transitions and active pill states',
    completed: true,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isPinned: true,
  },
  {
    id: 'item-wk-2',
    groupId: 'g-work-sprint',
    title: 'Implement ListFlow data synchronization',
    notes: 'Support adding, renaming, and deleting custom lists',
    completed: false,
    createdAt: new Date().toISOString(),
    isPinned: true,
  },
  {
    id: 'item-wk-3',
    groupId: 'g-work-sprint',
    title: 'Prepare product launch slides',
    quantity: 1,
    unit: 'deck',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-wk-4',
    groupId: 'g-work-review',
    title: 'Audit component accessibility and ARIA roles',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export const SEED_PERSONAL_GROUPS: ListGroup[] = [
  {
    id: 'g-pers-habits',
    listId: 'list-personal',
    title: 'Daily Routines',
    color: '#f59e0b',
    icon: 'sparkles',
    isCollapsed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g-pers-reading',
    listId: 'list-personal',
    title: 'Books & Learning',
    color: '#3b82f6',
    icon: 'book',
    isCollapsed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g-pers-errands',
    listId: 'list-personal',
    title: 'Weekend Errands',
    color: '#10b981',
    icon: 'check-square',
    isCollapsed: false,
    createdAt: new Date().toISOString(),
  },
];

export const SEED_PERSONAL_ITEMS: ListItem[] = [
  {
    id: 'item-ps-1',
    groupId: 'g-pers-habits',
    title: 'Morning 20-min mindfulness and stretch',
    completed: true,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isPinned: true,
  },
  {
    id: 'item-ps-2',
    groupId: 'g-pers-habits',
    title: 'Drink 2.5L water throughout the day',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-ps-3',
    groupId: 'g-pers-reading',
    title: 'Read 25 pages of Atomic Habits',
    quantity: 25,
    unit: 'pages',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'item-ps-4',
    groupId: 'g-pers-errands',
    title: 'Pick up dry cleaning & packages',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

// Arabic Work & Personal Seeds
export const SEED_ARABIC_WORK_GROUPS: ListGroup[] = [
  {
    id: 'g-ar-work-1',
    listId: 'list-work',
    title: 'المراحل والإنجازات',
    color: '#6366f1',
    icon: 'target',
    isCollapsed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g-ar-work-2',
    listId: 'list-work',
    title: 'التصميم وتجربة المستخدم',
    color: '#ec4899',
    icon: 'palette',
    isCollapsed: false,
    createdAt: new Date().toISOString(),
  },
];

export const SEED_ARABIC_WORK_ITEMS: ListItem[] = [
  {
    id: 'item-ar-wk-1',
    groupId: 'g-ar-work-2',
    title: 'تصميم شريط تبديل القوائم التفاعلي',
    completed: true,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isPinned: true,
  },
  {
    id: 'item-ar-wk-2',
    groupId: 'g-ar-work-1',
    title: 'تجهيز العرض التقديمي لفريق التطوير',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export const SEED_ARABIC_PERSONAL_GROUPS: ListGroup[] = [
  {
    id: 'g-ar-pers-1',
    listId: 'list-personal',
    title: 'العادات اليومية',
    color: '#f59e0b',
    icon: 'sparkles',
    isCollapsed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g-ar-pers-2',
    listId: 'list-personal',
    title: 'القراءة والتعلم',
    color: '#3b82f6',
    icon: 'book',
    isCollapsed: false,
    createdAt: new Date().toISOString(),
  },
];

export const SEED_ARABIC_PERSONAL_ITEMS: ListItem[] = [
  {
    id: 'item-ar-ps-1',
    groupId: 'g-ar-pers-1',
    title: 'شرب 2 لتر من الماء يومياً',
    completed: true,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isPinned: true,
  },
  {
    id: 'item-ar-ps-2',
    groupId: 'g-ar-pers-2',
    title: 'قراءة 20 صفحة من كتاب تطوير الذات',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export const loadStoredLists = (lang: Language): AppList[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LISTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Failed to load lists from localStorage', err);
  }
  return SEED_LISTS[lang] || SEED_LISTS.en;
};

export const saveStoredLists = (lists: AppList[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
  } catch (err) {
    console.error('Failed to save lists', err);
  }
};

export const loadActiveListId = (lists: AppList[]): string => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_LIST_ID);
    if (raw && lists.some((l) => l.id === raw)) return raw;
  } catch {}
  return lists[0]?.id || 'list-groceries';
};

export const saveActiveListId = (id: string) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_LIST_ID, id);
  } catch {}
};

export const loadStoredGroups = (lang: Language): ListGroup[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((g) => ({
          ...g,
          listId: g.listId || 'list-groceries',
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to load groups from localStorage', err);
  }

  if (lang === 'ar') {
    const primaryGroups = TEMPLATES_DATA.weekly.groups.ar.map((g) => ({ ...g, listId: 'list-groceries' }));
    return [...primaryGroups, ...SEED_ARABIC_WORK_GROUPS, ...SEED_ARABIC_PERSONAL_GROUPS];
  }
  const primaryGroups = TEMPLATES_DATA.weekly.groups.en.map((g) => ({ ...g, listId: 'list-groceries' }));
  return [...primaryGroups, ...SEED_WORK_GROUPS, ...SEED_PERSONAL_GROUPS];
};

export const saveStoredGroups = (groups: ListGroup[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  } catch (err) {
    console.error('Failed to save groups', err);
  }
};

export const loadStoredItems = (lang: Language): ListItem[] => {
  const normalizeItems = (rawItems: any[]): ListItem[] => {
    return rawItems.map((item) => ({
      ...item,
      tags: Array.isArray(item.tags) ? item.tags : [],
      subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
      quantity: item.quantity ?? 1,
      completed: Boolean(item.completed),
      isPinned: Boolean(item.isPinned),
    }));
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return normalizeItems(parsed);
    }
  } catch (err) {
    console.warn('Failed to load items from localStorage', err);
  }

  if (lang === 'ar') {
    return normalizeItems([...TEMPLATES_DATA.weekly.items.ar, ...SEED_ARABIC_WORK_ITEMS, ...SEED_ARABIC_PERSONAL_ITEMS]);
  }
  return normalizeItems([...TEMPLATES_DATA.weekly.items.en, ...SEED_WORK_ITEMS, ...SEED_PERSONAL_ITEMS]);
};

export const saveStoredItems = (items: ListItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save items', err);
  }
};

export const loadStoredLanguage = (): Language => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (raw === 'ar' || raw === 'en') return raw;
  } catch {}
  return 'en';
};

export const saveStoredLanguage = (lang: Language) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch {}
};

export const loadStoredTheme = (): Theme => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'dark' || raw === 'light' || raw === 'system') return raw;
  } catch {}
  return 'light';
};

export const saveStoredTheme = (theme: Theme) => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {}
};

export const loadStoredThemeColor = (): ThemeColor => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME_COLOR) as ThemeColor;
    const validColors: ThemeColor[] = [
      'emerald',
      'indigo',
      'blue',
      'violet',
      'rose',
      'amber',
      'teal',
      'cyan',
      'orange',
    ];
    if (raw && validColors.includes(raw)) return raw;
  } catch {}
  return 'emerald';
};

export const saveStoredThemeColor = (color: ThemeColor) => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME_COLOR, color);
  } catch {}
};

export const loadStoredSound = (): boolean => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SOUND);
    if (raw !== null) return raw === 'true';
  } catch {}
  return true;
};

export const saveStoredSound = (sound: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SOUND, String(sound));
  } catch {}
};

export const loadStoredGridColumns = (): 1 | 2 => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GRID_COLUMNS);
    if (raw === '1') return 1;
    if (raw === '2') return 2;
  } catch {}
  return 2; // Default is 2 columns
};

export const saveStoredGridColumns = (cols: 1 | 2) => {
  try {
    localStorage.setItem(STORAGE_KEYS.GRID_COLUMNS, String(cols));
  } catch {}
};
