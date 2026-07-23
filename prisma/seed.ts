import * as path from "path";
import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import * as bcryptjs from "bcryptjs";
import { buildDatabaseUrlFromEnv } from "../src/config/databaseUrl";

const selectedEnvFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), selectedEnvFile) });

const ensureDatabaseUrl = (): void => {
  const resolvedDatabaseUrl = buildDatabaseUrlFromEnv(process.env);
  if (resolvedDatabaseUrl) {
    process.env.DATABASE_URL = resolvedDatabaseUrl;
  }
};

ensureDatabaseUrl();

const prisma = new PrismaClient();

type MenuSeedModifierOption = {
  name: string;
  price: number;
};

type MenuSeedModifierGroup = {
  name: string;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: MenuSeedModifierOption[];
};

type MenuSeedItem = {
  name: string;
  description: string;
  featured?: boolean;
  basePrice?: number;
  prices?: Record<string, number>;
  hasSizes?: boolean;
  modifierGroups?: MenuSeedModifierGroup[];
  modifierGroupsBySize?: Record<string, MenuSeedModifierGroup[]>;
};

type MenuSeedCategory = {
  category: string;
  items: MenuSeedItem[];
};

type LanguageCode = 'pl' | 'en' | 'uk';

type MenuItemTranslationPayload = string | { name: string; description?: string | null };

const languages: Array<{ code: LanguageCode; name: string; isActive: boolean }> = [
  { code: 'pl', name: 'Polish', isActive: true },
  { code: 'en', name: 'English', isActive: true },
  { code: 'uk', name: 'Ukrainian', isActive: true },
];

const sizeOptionLabels: Record<string, Record<LanguageCode, string>> = {
  STANDARD: { pl: 'Standard', en: 'Standard', uk: 'Стандарт' },
  MEDIUM: { pl: 'Średnie', en: 'Medium', uk: 'Середній' },
  MEGA: { pl: 'Mega', en: 'Mega', uk: 'Мега' },
  CLASSIC: { pl: 'Classic', en: 'Classic', uk: 'Класичний' },
  XXL: { pl: 'XXL', en: 'XXL', uk: 'XXL' },
  SMALL: { pl: 'Małe', en: 'Small', uk: 'Мале' },
  LARGE: { pl: 'Duże', en: 'Large', uk: 'Велике' },
  SIZE_033: { pl: '0,33L', en: '0.33L', uk: '0,33л' },
  SIZE_05: { pl: '0,5L', en: '0.5L', uk: '0,5л' },
};

const categoryTranslations: Record<string, Partial<Record<LanguageCode, string>>> = {
  ROLLO: { en: 'ROLLO', uk: 'РОЛЛО' },
  TORTILLA: { en: 'TORTILLA', uk: 'ТОРТИЛЯ' },
  BUŁKA: { en: 'BUN', uk: 'Булка' },
  BOX: { en: 'BOX', uk: 'БОКС' },
  'KEBAB NA TALERZU': { en: 'KEBAB ON A PLATE', uk: 'КЕБАБ НА ТАРІЛЬЦІ' },
  SAŁATKI: { en: 'SALADS', uk: 'САЛАТИ' },
  KAPSALON: { en: 'KAPSALON', uk: 'КАПСАЛОН' },
  DODATKI: { en: 'EXTRAS', uk: 'ДОДАТКИ' },
  'O KURCZĘ!': { en: 'OH CHICKEN!', uk: 'О КУРЧАТІ!' },
  NAPOJE: { en: 'DRINKS', uk: 'НАПОЇ' },
};

const menuItemTranslations: Record<string, Partial<Record<LanguageCode, MenuItemTranslationPayload>>> = {
  'DELTA ROLLO': { en: { name: 'DELTA ROLLO', description: 'pita, meat, slaw, sauce' }, uk: { name: 'DELTA ROLLO', description: 'піта, м’ясо, салат, соус' } },
  'ROLLO DELTA Z SEREM': { en: 'DELTA ROLLO WITH CHEESE', uk: 'DELTA ROLLO З СИРОМ' },
  AMERYKAŃSKIE: { en: 'AMERICAN', uk: 'АМЕРИКАНСЬКЕ' },
  'AMERYKAŃSKIE Z SEREM': { en: 'AMERICAN WITH CHEESE', uk: 'АМЕРИКАНСЬКЕ З СИРОМ' },
  'ROLLO SAMO MIĘSO': { en: 'ROLLO WITH ONLY MEAT', uk: 'РОЛЛО ЛИШЕ З М’ЯСОМ' },
  'SUPER MEGA AMERYKAŃSKIE': { en: 'SUPER MEGA AMERICAN', uk: 'СУПЕР МЕГА АМЕРИКАНСЬКЕ' },
  'SUPER MEGA Z SEREM': { en: 'SUPER MEGA WITH CHEESE', uk: 'СУПЕР МЕГА З СИРОМ' },
  'SUPER DELTA': { en: 'SUPER DELTA', uk: 'СУПЕР DELTA' },
  'DELTA GREKO': { en: 'DELTA GREKO', uk: 'DELTA GREKO' },
  'DELTA HOT SPICY': { en: 'DELTA HOT SPICY', uk: 'DELTA HOT SPICY' },
  'DELTA SZPINAK': { en: 'DELTA SPINACH', uk: 'DELTA З ШПИНАТОМ' },
  'TORTILLA DELTA': { en: 'DELTA TORTILLA', uk: 'DELTA ТОРТИЛЯ' },
  'TORTILLA DELTA Z SEREM': { en: 'DELTA TORTILLA WITH CHEESE', uk: 'DELTA ТОРТИЛЯ З СИРОМ' },
  'TORTILLA AMERYKAŃSKA': { en: 'AMERICAN TORTILLA', uk: 'АМЕРИКАНСЬКА ТОРТИЛЯ' },
  'TORTILLA SAMO MIĘSO': { en: 'TORTILLA WITH ONLY MEAT', uk: 'ТОРТИЛЯ ЛИШЕ З М’ЯСОМ' },
  'TORTILLA WRAP': { en: 'TORTILLA WRAP', uk: 'ТОРТИЛЯ WRAP' },
  'TORTILLA WEGE': { en: 'VEGGIE TORTILLA', uk: 'ВЕГЕТАРІАНСЬКА ТОРТИЛЯ' },
  'KEBAB W BUŁCE': { en: 'KEBAB IN A BUN', uk: 'КЕБАБ В БУЛЦІ' },
  'BUŁKA AMERYKAŃSKA': { en: 'AMERICAN BUN', uk: 'АМЕРИКАНСЬКА БУЛКА' },
  'DELTA SUPER BUŁKA': { en: 'DELTA SUPER BUN', uk: 'DELTA СУПЕР БУЛКА' },
  'BUŁKA SAMO MIĘSO': { en: 'BUN WITH ONLY MEAT', uk: 'БУЛКА ЛИШЕ З М’ЯСОМ' },
  'BUŁKA WEGE': { en: 'VEGGIE BUN', uk: 'ВЕГЕТАРІАНСЬКА БУЛКА' },
  'BUŁKA BERLIN': { en: 'BERLIN BUN', uk: 'БЕРЛІНСЬКА БУЛКА' },
  'KEBAB BOX': { en: 'KEBAB BOX', uk: 'KEBAB BOX' },
  'BOX AMERYKAŃSKI': { en: 'AMERICAN BOX', uk: 'АМЕРИКАНСЬКИЙ BOX' },
  'KIDS BOX': { en: 'KIDS BOX', uk: 'KIDS BOX' },
  'KEBAB NA TALERZU': { en: 'KEBAB ON A PLATE', uk: 'KEBAB НА ТАРІЛЬЦІ' },
  'MEGA TALERZ': { en: 'MEGA PLATE', uk: 'МЕГА ТАРІЛЬ' },
  'SUPER TALERZ': { en: 'SUPER PLATE', uk: 'СУПЕР ТАРІЛЬ' },
  'TALERZ AMERYKAŃSKI': { en: 'AMERICAN PLATE', uk: 'АМЕРИКАНСЬКА ТАРІЛЬ' },
  'TALERZ WEGE': { en: 'VEGGIE PLATE', uk: 'ВЕГЕТАРІАНСЬКА ТАРІЛЬ' },
  'SAŁATKA KEBAB': { en: 'KEBAB SALAD', uk: 'КЕБАБ САЛАТ' },
  'CRISPY SALAD': { en: 'CRISPY SALAD', uk: 'CRISPY SALAD' },
  'SAŁATKA GRECKA': { en: 'GREEK SALAD', uk: 'ГРЕЦЬКИЙ САЛАТ' },
  KAPSALON: { en: 'KAPSALON', uk: 'КАПСАЛОН' },
  FRYTKI: { en: 'FRIES', uk: 'КАРТОПЛЯ ФРИТ' },
  'FRYTKI Z SEREM': { en: 'FRIES WITH CHEESE', uk: 'КАРТОПЛЯ ФРИТ З СИРОМ' },
  DELTOPYCHA: { en: 'DELTOPYCHA', uk: 'DELTOPYCHA' },
  'CHICKEN STRIPS': { en: 'CHICKEN STRIPS', uk: 'CHICKEN STRIPS' },
  'CHICKEN POPSY': { en: 'CHICKEN POPSY', uk: 'CHICKEN POPSY' },
  'CHICKEN WINGS': { en: 'CHICKEN WINGS', uk: 'CHICKEN WINGS' },
  'CHICKEN NUGGETS': { en: 'CHICKEN NUGGETS', uk: 'CHICKEN NUGGETS' },
  AYRAN: { en: 'AYRAN', uk: 'AYRAN' },
  'MANGO DIMES': { en: 'MANGO DIMES', uk: 'MANGO DIMES' },
  PEPSI: { en: 'PEPSI', uk: 'PEPSI' },
  PIERROT: { en: 'PIERROT', uk: 'PIERROT' },
  MIRINDA: { en: 'MIRINDA', uk: 'MIRINDA' },
  LIPTON: { en: 'LIPTON', uk: 'LIPTON' },
  'MOUNTAIN DEW': { en: 'MOUNTAIN DEW', uk: 'MOUNTAIN DEW' },
  WODA: { en: 'WATER', uk: 'ВОДА' },
};

const descriptionTranslations: Record<string, Partial<Record<LanguageCode, string>>> = {
  'DELTA ROLLO': {
    en: 'pita, meat, slaw, sauce',
    uk: 'піта, м’ясо, салат, соус',
  },
  'ROLLO DELTA Z SEREM': {
    en: 'pita, cheese, meat, slaw, sauce',
    uk: 'піта, сир, м’ясо, салат, соус',
  },
  AMERYKAŃSKIE: {
    en: 'pita, meat, fries, sauce',
    uk: 'піта, м’ясо, картопля фрі, соус',
  },
  'AMERYKAŃSKIE Z SEREM': {
    en: 'pita, meat, fries, cheese, sauce',
    uk: 'піта, м’ясо, картопля фрі, сир, соус',
  },
  'ROLLO SAMO MIĘSO': {
    en: 'pita, meat, sauce',
    uk: 'піта, м’ясо, соус',
  },
  'SUPER MEGA AMERYKAŃSKIE': {
    en: 'pita, double meat, cheese, fries, sauce',
    uk: 'піта, подвійне м’ясо, сир, картопля фрі, соус',
  },
  'SUPER MEGA Z SEREM': {
    en: 'pita, double meat, cheese, slaw, sauce',
    uk: 'піта, подвійне м’ясо, сир, салат, соус',
  },
  'SUPER DELTA': {
    en: 'pita, meat, cheese, slaw, fries, sauce',
    uk: 'піта, м’ясо, сир, салат, картопля фрі, соус',
  },
  'DELTA GREKO': {
    en: 'pita, meat, iceberg lettuce, onion, olives, feta cheese, mild sauce',
    uk: 'піта, м’ясо, салат айсберг, цибуля, оливки, сир фета, м’який соус',
  },
  'DELTA HOT SPICY': {
    en: 'meat, mixed peppers, jalapeño, hot sauce',
    uk: 'м’ясо, суміш перців, халапеньйо, гострий соус',
  },
  'DELTA SZPINAK': {
    en: 'pita, meat, spinach, cheese, sauce',
    uk: 'піта, м’ясо, шпинат, сир, соус',
  },
  'TORTILLA DELTA': {
    en: 'tortilla, meat, slaw, sauce',
    uk: 'тортилья, м’ясо, салат, соус',
  },
  'TORTILLA DELTA Z SEREM': {
    en: 'tortilla, cheese, meat, slaw, sauce',
    uk: 'тортилья, сир, м’ясо, салат, соус',
  },
  'TORTILLA AMERYKAŃSKA': {
    en: 'tortilla, meat, fries, sauce',
    uk: 'тортилья, м’ясо, картопля фрі, соус',
  },
  'TORTILLA SAMO MIĘSO': {
    en: 'tortilla, meat, sauce',
    uk: 'тортилья, м’ясо, соус',
  },
  'TORTILLA WRAP': {
    en: 'tortilla, chicken strips, iceberg lettuce, pickles, sauce',
    uk: 'тортилья, курячі брусочки, салат айсберг, огірки, соус',
  },
  'TORTILLA WEGE': {
    en: 'tortilla, falafel, vegetables, sauce',
    uk: 'тортилья, фалафель, овочі, соус',
  },
  'KEBAB W BUŁCE': {
    en: 'bun, meat, vegetables, sauce',
    uk: 'булка, м’ясо, овочі, соус',
  },
  'BUŁKA AMERYKAŃSKA': {
    en: 'bun, meat, fries, sauce',
    uk: 'булка, м’ясо, картопля фрі, соус',
  },
  'DELTA SUPER BUŁKA': {
    en: 'bun, meat, vegetables, fries, cheese, sauce',
    uk: 'булка, м’ясо, овочі, картопля фрі, сир, соус',
  },
  'BUŁKA SAMO MIĘSO': {
    en: 'bun, meat, sauce',
    uk: 'булка, м’ясо, соус',
  },
  'BUŁKA WEGE': {
    en: 'bun, falafel, vegetables, sauce',
    uk: 'булка, фалафель, овочі, соус',
  },
  'BUŁKA BERLIN': {
    en: 'Berlin bun, meat, vegetables, sauce',
    uk: 'берлінська булка, м’ясо, овочі, соус',
  },
  'KEBAB BOX': {
    en: 'meat, vegetables, fries, sauce',
    uk: 'м’ясо, овочі, картопля фрі, соус',
  },
  'BOX AMERYKAŃSKI': {
    en: 'meat, fries, sauce',
    uk: 'м’ясо, картопля фрі, соус',
  },
  'KIDS BOX': {
    en: '2 chicken nuggets, 5 chicken popsy, 80g fries, sauce and drink',
    uk: '2 курячі нагетси, 5 курячих попсі, 80 г картоплі фрі, соус та напій',
  },
  'KEBAB NA TALERZU': {
    en: 'meat, vegetables, fries, sauce',
    uk: 'м’ясо, овочі, картопля фрі, соус',
  },
  'MEGA TALERZ': {
    en: 'double meat, vegetables, sauce + fries',
    uk: 'подвійне м’ясо, овочі, соус + картопля фрі',
  },
  'SUPER TALERZ': {
    en: 'meat, vegetables, fries, cheese, sauce',
    uk: 'м’ясо, овочі, картопля фрі, сир, соус',
  },
  'TALERZ AMERYKAŃSKI': {
    en: 'meat, fries, sauce',
    uk: 'м’ясо, картопля фрі, соус',
  },
  'TALERZ WEGE': {
    en: 'falafel, vegetables, fries, sauce',
    uk: 'фалафель, овочі, картопля фрі, соус',
  },
  'SAŁATKA KEBAB': {
    en: 'meat, vegetables, sauce',
    uk: 'м’ясо, овочі, соус',
  },
  'CRISPY SALAD': {
    en: 'chicken strips, vegetables, sauce',
    uk: 'курячі брусочки, овочі, соус',
  },
  'SAŁATKA GRECKA': {
    en: 'vegetables, feta cheese, jalapeño, olives, sauce',
    uk: 'овочі, сир фета, халапеньйо, оливки, соус',
  },
  KAPSALON: {
    en: 'meat, vegetables, fries, cheese, sauce',
    uk: 'м’ясо, овочі, картопля фрі, сир, соус',
  },
  FRYTKI: {
    en: 'fries',
    uk: 'картопля фрі',
  },
  'FRYTKI Z SEREM': {
    en: 'cheese fries',
    uk: 'картопля фрі із сиром',
  },
  DELTOPYCHA: {
    en: '2 chicken strips, 8 chicken popsy, fries, sauce',
    uk: '2 курячі брусочки, 8 курячих попсі, картопля фрі, соус',
  },
  'CHICKEN STRIPS': {
    en: '4 chicken strips, fries, sauce',
    uk: '4 курячі брусочки, картопля фрі, соус',
  },
  'CHICKEN POPSY': {
    en: '10 crispy chicken popsy, fries, sauce',
    uk: '10 хрустких курячих попсі, картопля фрі, соус',
  },
  'CHICKEN WINGS': {
    en: '4 crispy chicken wings, fries, sauce',
    uk: '4 хрусткі курячі крильця, картопля фрі, соус',
  },
  'CHICKEN NUGGETS': {
    en: '7 chicken nuggets, fries, sauce',
    uk: '7 курячих нагетсів, картопля фрі, соус',
  },
  AYRAN: {
    en: '',
    uk: '',
  },
  'MANGO DIMES': {
    en: '0.33L',
    uk: '0,33л',
  },
  PEPSI: {
    en: '',
    uk: '',
  },
  PIERROT: {
    en: '330 ml',
    uk: '330 мл',
  },
  MIRINDA: {
    en: '',
    uk: '',
  },
  LIPTON: {
    en: '',
    uk: '',
  },
  'MOUNTAIN DEW': {
    en: '',
    uk: '',
  },
  WODA: {
    en: '0.5L',
    uk: '0,5л',
  },
};

const modifierGroupTranslations: Record<string, Partial<Record<LanguageCode, string>>> = {
  'Wybierz mięso': { en: 'Choose Meat', uk: 'Оберіть м’ясо' },
  'Dodatkowe sosy (jeden sos w cenie; dodaj do 3 dodatkowych)': {
    en: 'Extra sauces (one sauce included free; add up to 3 extra)',
    uk: 'Додаткові соуси (один соус включено безкоштовно; додайте до 3 додаткових)',
  },
  Dodatki: { en: 'Extras', uk: 'Додатки' },
  Temperatura: { en: 'Temperature', uk: 'Температура' },
};

const modifierOptionTranslations: Record<string, Partial<Record<LanguageCode, string>>> = {
  KURA: { en: 'CHICKEN', uk: 'КУРКА' },
  MIESZANE: { en: 'MIX', uk: 'МІКС' },
  'WÓŁ': { en: 'BEEF', uk: 'ЯЛОВИЧИНА' },
  Czosnkowy: { en: 'Garlic', uk: 'Часниковий' },
  Łagodny: { en: 'Mild', uk: 'М’який' },
  Ketchup: { en: 'Ketchup', uk: 'Кетчуп' },
  Ostry: { en: 'Hot', uk: 'Гострий' },
  Barbecue: { en: 'Barbecue', uk: 'Барбекю' },
  Koperkowy: { en: 'Dill', uk: 'З кропом' },
  'Mix (Mieszane)': { en: 'Mix', uk: 'Мікс' },
  Warzywa: { en: 'Vegetables', uk: 'Овочі' },
  Ser: { en: 'Cheese', uk: 'Сир' },
  'Dodatkowe mięso': { en: 'Extra meat', uk: 'Додаткове м’ясо' },
  Zimny: { en: 'Cold', uk: 'Холодний' },
  'W temperaturze pokojowej': { en: 'Room Temperature', uk: 'При кімнатній температурі' },
};

type SeedSizeOptionInput = {
  id: string;
  name: string;
  value: string;
};

const sizeValueMap: Record<string, string> = {
  standard: 'STANDARD',
  'średnie': 'MEDIUM',
  medium: 'MEDIUM',
  mega: 'MEGA',
  classic: 'CLASSIC',
  xxl: 'XXL',
  'małe': 'SMALL',
  male: 'SMALL',
  'duże': 'LARGE',
  duze: 'LARGE',
  '0,33l': 'SIZE_033',
  '0.33l': 'SIZE_033',
  '0,5l': 'SIZE_05',
  '0.5l': 'SIZE_05',
};

const getStableSizeValue = (sizeName: string) => {
  return sizeValueMap[normalizeSizeOptionName(sizeName)] ?? sizeName.toUpperCase();
};

const getSizeLabel = (sizeValue: string, lang: LanguageCode) => {
  return sizeOptionLabels[sizeValue]?.[lang] ?? sizeValue;
};

const normalizeMenuItemTranslation = (translation: MenuItemTranslationPayload | undefined) => {
  if (!translation) {
    return null;
  }
  return typeof translation === 'string'
    ? { name: translation, description: undefined }
    : translation;
};

const normalizeSizeOptionName = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-");

const getSizeOptionFallbackLabel = (sizeName: string) => {
  const stableValue = getStableSizeValue(sizeName);
  return getSizeLabel(stableValue, 'pl');
};

const upsertCategoryTranslations = async (categoryId: string, categoryName: string) => {
  for (const language of languages) {
    if (language.code === "pl") {
      continue;
    }

    const translatedName = categoryTranslations[categoryName]?.[language.code];
    if (!translatedName) {
      continue;
    }

    await prisma.categoryTranslation.upsert({
      where: {
        categoryId_languageCode: {
          categoryId,
          languageCode: language.code,
        },
      },
      create: {
        categoryId,
        languageCode: language.code,
        name: translatedName,
      },
      update: {
        name: translatedName,
      },
    });
  }
};

const upsertMenuItemTranslations = async (
  menuItemId: string,
  itemName: string,
  itemDescription?: string | null
) => {
  for (const language of languages) {
    if (language.code === "pl") {
      continue;
    }

    const rawTranslation = menuItemTranslations[itemName]?.[language.code];
    const translation = normalizeMenuItemTranslation(rawTranslation);
    const translatedDescription =
      translation?.description ?? descriptionTranslations[itemName]?.[language.code] ?? null;

    if (!translation) {
      continue;
    }

    await prisma.menuItemTranslation.upsert({
      where: {
        menuItemId_languageCode: {
          menuItemId,
          languageCode: language.code,
        },
      },
      create: {
        menuItemId,
        languageCode: language.code,
        name: translation.name,
        description: translatedDescription ?? itemDescription ?? null,
      },
      update: {
        name: translation.name,
        description: translatedDescription ?? itemDescription ?? null,
      },
    });
  }
};

const upsertSizeOptionTranslations = async (sizeOptionId: string, sizeValue: string) => {
  const translations = sizeOptionLabels[sizeValue];
  if (!translations) {
    return;
  }

  for (const language of languages) {
    if (language.code === "pl") {
      continue;
    }

    const translation = translations[language.code];
    if (!translation) {
      continue;
    }

    await prisma.sizeOptionTranslation.upsert({
      where: {
        sizeOptionId_languageCode: {
          sizeOptionId,
          languageCode: language.code,
        },
      },
      create: {
        sizeOptionId,
        languageCode: language.code,
        name: translation,
      },
      update: {
        name: translation,
      },
    });
  }
};

const upsertModifierGroupTranslations = async (
  modifierGroupId: string,
  modifierGroupName: string
) => {
  for (const language of languages) {
    if (language.code === "pl") {
      continue;
    }

    const translation = modifierGroupTranslations[modifierGroupName]?.[language.code];
    if (!translation) {
      continue;
    }

    await prisma.modifierGroupTranslation.upsert({
      where: {
        modifierGroupId_languageCode: {
          modifierGroupId,
          languageCode: language.code,
        },
      },
      create: {
        modifierGroupId,
        languageCode: language.code,
        name: translation,
      },
      update: {
        name: translation,
      },
    });
  }
};

const upsertModifierOptionTranslations = async (
  modifierOptionId: string,
  modifierOptionName: string
) => {
  for (const language of languages) {
    if (language.code === "pl") {
      continue;
    }

    const translation = modifierOptionTranslations[modifierOptionName]?.[language.code];
    if (!translation) {
      continue;
    }

    await prisma.modifierOptionTranslation.upsert({
      where: {
        modifierOptionId_languageCode: {
          modifierOptionId,
          languageCode: language.code,
        },
      },
      create: {
        modifierOptionId,
        languageCode: language.code,
        name: translation,
      },
      update: {
        name: translation,
      },
    });
  }
};

const upsertBranchMenuItemTranslations = async (
  branchMenuItemId: string,
  nameOverride: string,
  descriptionOverride?: string | null
) => {
  for (const language of languages) {
    if (language.code === "pl") {
      continue;
    }

    const rawTranslation = menuItemTranslations[nameOverride]?.[language.code];
    const translation = normalizeMenuItemTranslation(rawTranslation);
    const translatedName = translation?.name;
    const translatedDescription =
      translation?.description ?? descriptionTranslations[nameOverride]?.[language.code] ?? null;

    if (!translatedName && !translatedDescription) {
      continue;
    }

    await prisma.branchMenuItemTranslation.upsert({
      where: {
        branchMenuItemId_languageCode: {
          branchMenuItemId,
          languageCode: language.code,
        },
      },
      create: {
        branchMenuItemId,
        languageCode: language.code,
        nameOverride: translatedName ?? nameOverride,
        descriptionOverride: translatedDescription ?? descriptionOverride,
      },
      update: {
        nameOverride: translatedName ?? nameOverride,
        descriptionOverride: translatedDescription ?? descriptionOverride,
      },
    });
  }
};

export const buildBranchMenuItemSizePayloads = ({
  branchMenuItemId,
  sizeOptions,
  prices,
}: {
  branchMenuItemId: string;
  sizeOptions: SeedSizeOptionInput[];
  prices?: Record<string, number>;
}) => {
  const payloads: Array<{
    branchMenuItemId: string;
    sizeOptionId: string;
    price: number;
    available: boolean;
  }> = [];

  for (const [sizeName, sizePrice] of Object.entries(prices ?? {})) {
    const normalizedSizeName = normalizeSizeOptionName(sizeName);
    const sizeOption = sizeOptions.find((option) => {
      const normalizedOptionName = normalizeSizeOptionName(option.name);
      const normalizedOptionValue = normalizeSizeOptionName(option.id);
      return normalizedOptionName === normalizedSizeName || normalizedOptionValue === normalizedSizeName;
    });

    if (!sizeOption) {
      continue;
    }

    payloads.push({
      branchMenuItemId,
      sizeOptionId: sizeOption.id,
      price: Number(sizePrice),
      available: true,
    });
  }

  return payloads;
};

const menuSeedData: MenuSeedCategory[] = [
  {
    category: "ROLLO",
    items: [
      {
        name: "DELTA ROLLO",
        description: "pita, mięso, surówka, sos",
        featured: true,
        prices: { STANDARD: 18, MEDIUM: 24, MEGA: 30 },
        modifierGroupsBySize: {
          STANDARD: [
            {
              name: "Wybierz mięso",
              required: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                { name: "KURA", price: 0 },
                { name: "MIESZANE", price: 1 },
                { name: "WÓŁ", price: 2 },
              ],
            },
            {
              name: "Dodatkowe sosy (jeden sos w cenie; dodaj do 3 dodatkowych)",
              required: false,
              minSelections: 0,
              maxSelections: 3,
              options: [
                { name: "Czosnkowy", price: 2 },
                { name: "Łagodny", price: 2 },
                { name: "Ketchup", price: 2 },
                { name: "Ostry", price: 2 },
                { name: "Barbecue", price: 3 },
                { name: "Koperkowy", price: 3 },
                { name: "Mix (Mieszane)", price: 3 },
              ],
            },
            {
              name: "Dodatki",
              required: false,
              minSelections: 0,
              maxSelections: 3,
              options: [
                { name: "Warzywa", price: 3 },
                { name: "Ser", price: 3 },
                { name: "Dodatkowe mięso", price: 8 },
              ],
            },
          ],
          MEDIUM: [
            {
              name: "Choose Meat",
              required: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                { name: "KURA", price: 0 },
                { name: "WÓŁ", price: 2 },
                { name: "MIESZANE", price: 1 },
              ],
            },
            {
              name: "Extra sauces (one sauce included free; add up to 3 extra)",
              required: false,
              minSelections: 0,
              maxSelections: 3,
              options: [
                { name: "Czosnkowy", price: 2 },
                { name: "Łagodny", price: 2 },
                { name: "Ketchup", price: 2 },
                { name: "Ostry", price: 2 },
                { name: "Barbecue", price: 3 },
                { name: "Koperkowy", price: 3 },
                { name: "Mix (Mieszane)", price: 3 },
              ],
            },
            {
              name: "Extras",
              required: false,
              minSelections: 0,
              maxSelections: 3,
              options: [
                { name: "Warzywa", price: 3 },
                { name: "Ser", price: 3 },
                { name: "Dodatkowe mięso", price: 8 },
              ],
            },
          ],
          MEGA: [
            {
              name: "Wybierz mięso",
              required: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                { name: "KURA", price: 0 },
                { name: "WÓŁ", price: 2 },
                { name: "MIESZANE", price: 1 },
              ],
            },
            {
              name: "Dodatkowe sosy (jeden sos w cenie; dodaj do 3 dodatkowych)",
              required: false,
              minSelections: 0,
              maxSelections: 3,
              options: [
                { name: "Czosnkowy", price: 2 },
                { name: "Łagodny", price: 2 },
                { name: "Ketchup", price: 2 },
                { name: "Ostry", price: 2 },
                { name: "Barbecue", price: 3 },
                { name: "Koperkowy", price: 3 },
                { name: "Mix (Mieszane)", price: 3 },
              ],
            },
            {
              name: "Extras",
              required: false,
              minSelections: 0,
              maxSelections: 3,
              options: [
                { name: "Warzywa", price: 5 },
                { name: "Ser", price: 5 },
                { name: "Dodatkowe mięso", price: 8 },
              ],
            },
          ],
        },
      },
      {
        name: "ROLLO DELTA Z SEREM",
        description: "pita, ser, mięso, surówka, sos",
        prices: { STANDARD: 20, MEDIUM: 26, MEGA: 32 },
      },
      {
        name: "AMERYKAŃSKIE",
        description: "pita, mięso, frytki, sos",
        prices: { STANDARD: 20, MEDIUM: 26, MEGA: 32 },
      },
      {
        name: "AMERYKAŃSKIE Z SEREM",
        description: "pita, mięso, frytki, ser, sos",
        prices: { STANDARD: 24, MEDIUM: 30, MEGA: 37 },
      },
      {
        name: "ROLLO SAMO MIĘSO",
        description: "pita, mięso, sos",
        prices: { STANDARD: 25, MEDIUM: 32, MEGA: 39 },
      },
      {
        name: "SUPER MEGA AMERYKAŃSKIE",
        description: "pita, 2 x mięso, ser, frytki, sos",
        prices: { MEGA: 44 },
      },
      {
        name: "SUPER MEGA Z SEREM",
        description: "pita, 2 x mięso, ser, surówka, sos",
        prices: { MEGA: 45 },
      },
      {
        name: "SUPER DELTA",
        description: "pita, mięso, ser, surówka, frytki, sos",
        prices: { STANDARD: 25, MEDIUM: 32 },
      },
      {
        name: "DELTA GREKO",
        description: "pita, mięso, sałata lodowa, cebula, oliwki, ser sałatkowy, sos łagodny",
        prices: { STANDARD: 23, MEDIUM: 29 },
      },
      {
        name: "DELTA HOT SPICY",
        description: "mięso, papryka mix, jalapeño, sos ostry",
        prices: { STANDARD: 23, MEDIUM: 29 },
      },
      {
        name: "DELTA SZPINAK",
        description: "pita, mięso, szpinak, ser, sos",
        prices: { STANDARD: 22, MEDIUM: 28 },
      },
    ],
  },
  {
    category: "TORTILLA",
    items: [
      {
        name: "TORTILLA DELTA",
        description: "tortilla, mięso, surówka, sos",
        prices: { STANDARD: 20, MEDIUM: 26, MEGA: 32 },
      },
      {
        name: "TORTILLA DELTA Z SEREM",
        description: "tortilla, ser, mięso, surówka, sos",
        prices: { STANDARD: 22, MEDIUM: 28, MEGA: 34 },
      },
      {
        name: "TORTILLA AMERYKAŃSKA",
        description: "tortilla, mięso, frytki, sos",
        prices: { STANDARD: 22, MEDIUM: 28, MEGA: 34 },
      },
      {
        name: "AMERYKAŃSKIE Z SEREM",
        description: "tortilla, mięso, frytki, ser, sos",
        prices: { STANDARD: 24, MEDIUM: 30, MEGA: 36 },
      },
      {
        name: "TORTILLA SAMO MIĘSO",
        description: "tortilla, mięso, sos",
        prices: { STANDARD: 26, MEDIUM: 33, MEGA: 40 },
      },
      {
        name: "TORTILLA WRAP",
        description: "tortilla, polędwiczki z kurczaka, sałata lodowa, pekinka, sos",
        prices: { STANDARD: 23, MEDIUM: 29 },
      },
      {
        name: "TORTILLA WEGE",
        description: "tortilla, falafele, warzywa, sos",
        prices: { STANDARD: 18, MEDIUM: 23, MEGA: 28 },
      },
    ],
  },
  {
    category: "BUŁKA",
    items: [
      {
        name: "KEBAB W BUŁCE",
        description: "bułka, mięso, warzywa, sos",
        prices: { STANDARD: 24, MEDIUM: 30, MEGA: 36 },
      },
      {
        name: "BUŁKA AMERYKAŃSKA",
        description: "bułka, mięso, frytki, sos",
        prices: { STANDARD: 26, MEDIUM: 31, MEGA: 37 },
      },
      {
        name: "DELTA SUPER BUŁKA",
        description: "bułka, mięso, warzywa, frytki, ser, sos",
        prices: { STANDARD: 30, MEDIUM: 35, MEGA: 40 },
      },
      {
        name: "BUŁKA SAMO MIĘSO",
        description: "bułka, mięso, sos",
        prices: { STANDARD: 30, MEDIUM: 35, MEGA: 40 },
      },
      {
        name: "BUŁKA WEGE",
        description: "bułka, falafele, warzywa, sos",
        prices: { STANDARD: 22 },
      },
      {
        name: "BUŁKA BERLIN",
        description: "bułka berlińska, mięso, warzywa, sos",
        prices: { STANDARD: 26 },
      },
    ],
  },
  {
    category: "BOX",
    items: [
      {
        name: "KEBAB BOX",
        description: "mięso, warzywa, frytki, sos",
        prices: { CLASSIC: 23, XXL: 29 },
      },
      {
        name: "BOX AMERYKAŃSKI",
        description: "mięso, frytki, sos",
        prices: { CLASSIC: 24, XXL: 30 },
      },
      {
        name: "KIDS BOX",
        description: "chicken nuggets 2 szt, chicken popsy 5 szt, frytki 80g, sos i napój",
        prices: { CLASSIC: 20 },
      },
    ],
  },
  {
    category: "KEBAB NA TALERZU",
    items: [
      {
        name: "KEBAB NA TALERZU",
        description: "mięso, warzywa, frytki, sos",
        prices: { STANDARD: 30 },
      },
      {
        name: "MEGA TALERZ",
        description: "2x mięso, warzywa, sos + frytki",
        prices: { STANDARD: 45 },
      },
      {
        name: "SUPER TALERZ",
        description: "mięso, warzywa, frytki, ser, sos",
        prices: { STANDARD: 35 },
      },
      {
        name: "TALERZ AMERYKAŃSKI",
        description: "mięso, frytki, sos",
        prices: { STANDARD: 36 },
      },
      {
        name: "TALERZ WEGE",
        description: "falafele, warzywa, frytki, sos",
        prices: { STANDARD: 23 },
      },
    ],
  },
  {
    category: "SAŁATKI",
    items: [
      {
        name: "SAŁATKA KEBAB",
        description: "mięso, warzywa, sos",
        prices: { STANDARD: 24 },
      },
      {
        name: "CRISPY SALAD",
        description: "chicken strips, warzywa, sos",
        prices: { STANDARD: 25 },
      },
      {
        name: "SAŁATKA GRECKA",
        description: "warzywa, ser sałatkowy, jalapeño, oliwki, sos",
        prices: { STANDARD: 18 },
      },
    ],
  },
  {
    category: "KAPSALON",
    items: [
      {
        name: "KAPSALON",
        description: "mięso, warzywa, frytki, ser, sos",
        prices: { STANDARD: 30 },
      },
    ],
  },
  {
    category: "DODATKI",
    items: [
      {
        name: "FRYTKI",
        description: "",
        prices: { SMALL: 10, LARGE: 19 },
      },
      {
        name: "FRYTKI Z SEREM",
        description: "",
        prices: { SMALL: 12, LARGE: 22 },
      },
    ]
  },
  {
    category: "O KURCZĘ!",
    items: [
      {
        name: "DELTOPYCHA",
        description: "polędwiczki z kurczaka 2 szt., chicken popsy 8 szt., frytki, sos",
        prices: { STANDARD: 28 },
      },
      {
        name: "CHICKEN STRIPS",
        description: "polędwiczki z kurczaka 4 szt., frytki, sos",
        prices: { STANDARD: 24 },
      },
      {
        name: "CHICKEN POPSY",
        description: "chrupiące popsy z kurczaka 10 szt., frytki, sos",
        prices: { STANDARD: 20 },
      },
      {
        name: "CHICKEN WINGS",
        description: "chrupiacy kurczak 4 szt., frytki, sos",
        prices: { STANDARD: 25 },
      },
      {
        name: "CHICKEN NUGGETS",
        description: "nuggetsy z kurczaka 7szt., frytki, sos",
        prices: { STANDARD: 22 },
      },
    ],
  },
  {
    category: "NAPOJE",
    items: [
      {
        name: "AYRAN",
        description: "",
        basePrice: 6,
        hasSizes: false,
        modifierGroups: [
          {
            name: "Temperatura",
            required: true,
            minSelections: 1,
            maxSelections: 1,
            options: [
              { name: "Zimny", price: 0 },
              { name: "W temperaturze pokojowej", price: 0 },
            ],
          },
        ],
      },
      {
        name: "MANGO DIMES",
        description: "0,33L",
        prices: { STANDARD: 7 },
      },
      {
        name: "PEPSI",
        description: "",
        prices: { SIZE_033: 7, SIZE_05: 9 },
      },
      {
        name: "PIERROT",
        description: "330 ml",
        prices: {
          "Cola-Cola": 7,
          "Pomarańczowy": 7,
          "Lemoniada": 7,
          "Czerwony Owoc": 7,
          "Zielony Owoc": 7,
          "Oranżada": 7,
        },
      },
      {
        name: "MIRINDA",
        description: "",
        prices: { SIZE_033: 7, SIZE_05: 9 },
      },
      {
        name: "LIPTON",
        description: "",
        prices: { SIZE_033: 7, SIZE_05: 9 },
      },
      {
        name: "MOUNTAIN DEW",
        description: "",
        prices: { SIZE_033: 7, SIZE_05: 9 },
      },
      {
        name: "WODA",
        description: "0,5L",
        prices: { STANDARD: 5 },
      },
    ],
  },
];

async function shouldSeedDatabase(): Promise<boolean> {
  const branchMenuCount = await prisma.branchMenu.count();
  return branchMenuCount === 0;
}

function findMenuSeedItem(name: string): MenuSeedItem | null {
  for (const categorySeed of menuSeedData) {
    const itemSeed = categorySeed.items.find((item) => item.name === name);
    if (itemSeed) {
      return itemSeed;
    }
  }

  return null;
}

async function ensureBranchMenuItemSizes(branchMenuId: string) {
  const branchMenuItems = await prisma.branchMenuItem.findMany({
    where: { branchMenuId },
    include: {
      menuItem: true,
    },
  });

  for (const branchMenuItem of branchMenuItems) {
    const itemSeed = findMenuSeedItem(branchMenuItem.menuItem.name);
    if (!itemSeed || !branchMenuItem.menuItem.sizeGroupId) {
      continue;
    }

    const sizeOptions = await prisma.sizeOption.findMany({
      where: {
        sizeGroupId: branchMenuItem.menuItem.sizeGroupId,
        active: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    const sizeRows = sizeOptions
      .map((sizeOption) => ({
        branchMenuItemId: branchMenuItem.id,
        sizeOptionId: sizeOption.id,
        price: Number(
          itemSeed.prices?.[sizeOption.name] ??
            itemSeed.prices?.[sizeOption.value ?? ""] ??
            itemSeed.basePrice ??
            0
        ),
        available: true,
      }))
      .filter((row) => Number.isFinite(row.price));

    if (sizeRows.length === 0) {
      continue;
    }

    try {
      await prisma.branchMenuItemSize.deleteMany({
        where: { branchMenuItemId: branchMenuItem.id },
      });

      for (const sizeRow of sizeRows) {
        await prisma.branchMenuItemSize.upsert({
          where: {
            branchMenuItemId_sizeOptionId: {
              branchMenuItemId: sizeRow.branchMenuItemId,
              sizeOptionId: sizeRow.sizeOptionId,
            },
          },
          update: {
            price: sizeRow.price,
            available: sizeRow.available,
          },
          create: sizeRow,
        });
      }

    } catch (error) {
      console.error("[seed-size-debug] upsert failed", branchMenuItem.id, error);
      throw error;
    }
  }
}

async function ensureBranchMenuSeed(branchId: string, branchName: string) {
  const existingBranchMenu = await prisma.branchMenu.findFirst({
    where: { branchId, name: "Main Menu" },
  });

  const branchMenu = existingBranchMenu
    ? await prisma.branchMenu.update({
        where: { id: existingBranchMenu.id },
        data: { active: true, name: "Main Menu" },
      })
    : await prisma.branchMenu.create({
        data: {
          branchId,
          name: "Main Menu",
          active: true,
        },
      });

  for (let categoryIndex = 0; categoryIndex < menuSeedData.length; categoryIndex++) {
    const categorySeed = menuSeedData[categoryIndex];
    let category = await prisma.category.findFirst({
      where: { menuId: branchMenu.id, name: categorySeed.category },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          menuId: branchMenu.id,
          name: categorySeed.category,
          icon: "restaurant",
          displayOrder: categoryIndex,
          active: true,
        },
      });
    } else {
      await prisma.category.update({
        where: { id: category.id },
        data: {
          displayOrder: categoryIndex,
          active: true,
        },
      });
    }

    await upsertCategoryTranslations(category.id, categorySeed.category);

    for (let itemIndex = 0; itemIndex < categorySeed.items.length; itemIndex++) {
      const itemSeed = categorySeed.items[itemIndex];
      const hasSizes = itemSeed.hasSizes ?? Boolean(itemSeed.prices && Object.keys(itemSeed.prices).length > 0);
      let sizeGroup = null as any;

      if (hasSizes) {
        const sizeGroupName = `Sizes - ${itemSeed.name}`;
        sizeGroup = await prisma.sizeGroup.findFirst({ where: { name: sizeGroupName } });
        if (!sizeGroup) {
          sizeGroup = await prisma.sizeGroup.create({
            data: {
              name: sizeGroupName,
              unit: "pcs",
              active: true,
            },
          });
        }
      }

      let menuItem = await prisma.menuItem.findFirst({
        where: { categoryId: category.id, name: itemSeed.name },
      });

      const menuItemData = {
        categoryId: category.id,
        name: itemSeed.name,
        description: itemSeed.description ?? null,
        displayOrder: itemIndex,
        featured: itemSeed.featured ?? false,
        active: true,
        sizeGroupId: sizeGroup?.id ?? null,
      };

      if (!menuItem) {
        menuItem = await prisma.menuItem.create({ data: menuItemData });
      } else {
        await prisma.menuItem.update({
          where: { id: menuItem.id },
          data: menuItemData,
        });
      }

      await upsertMenuItemTranslations(menuItem.id, itemSeed.name, itemSeed.description);

      if (hasSizes && sizeGroup) {
        const priceEntries = Object.entries(itemSeed.prices ?? {});

        for (let sizeIndex = 0; sizeIndex < priceEntries.length; sizeIndex++) {
          const [sizeName] = priceEntries[sizeIndex];
          const stableSizeValue = getStableSizeValue(sizeName);
          const fallbackSizeName = getSizeOptionFallbackLabel(sizeName);

          const existingSize = await prisma.sizeOption.findFirst({
            where: {
              sizeGroupId: sizeGroup.id,
              value: stableSizeValue,
            },
          });

          if (existingSize) {
            await prisma.sizeOption.update({
              where: { id: existingSize.id },
              data: {
                name: fallbackSizeName,
                value: stableSizeValue,
                displayOrder: sizeIndex,
                active: true,
              },
            });
            await upsertSizeOptionTranslations(existingSize.id, stableSizeValue);
          } else {
            const createdSizeOption = await prisma.sizeOption.create({
              data: {
                sizeGroupId: sizeGroup.id,
                name: fallbackSizeName,
                value: stableSizeValue,
                displayOrder: sizeIndex,
                active: true,
              },
            });
            await upsertSizeOptionTranslations(createdSizeOption.id, stableSizeValue);
          }
        }
      }

      let branchMenuItem = await prisma.branchMenuItem.findFirst({
        where: { branchMenuId: branchMenu.id, menuItemId: menuItem.id },
      });

      if (!branchMenuItem) {
        branchMenuItem = await prisma.branchMenuItem.create({
          data: {
            branchMenuId: branchMenu.id,
            menuItemId: menuItem.id,
            available: true,
            nameOverride: itemSeed.name,
            descriptionOverride: itemSeed.description ?? null,
            basePrice: itemSeed.basePrice != null ? Number(itemSeed.basePrice) : null,
          },
        });
      } else {
        await prisma.branchMenuItem.update({
          where: { id: branchMenuItem.id },
          data: {
            available: true,
            nameOverride: itemSeed.name,
            descriptionOverride: itemSeed.description ?? null,
            basePrice: itemSeed.basePrice != null ? Number(itemSeed.basePrice) : null,
          },
        });
      }

      if (hasSizes && sizeGroup) {
        let sizeOptions = await prisma.sizeOption.findMany({
          where: { sizeGroupId: sizeGroup.id, active: true },
          orderBy: { displayOrder: "asc" },
        });

  
        if (sizeOptions.length === 0) {
          const fallbackSizeNames = Object.keys(itemSeed.prices ?? {});
          for (let sizeIndex = 0; sizeIndex < fallbackSizeNames.length; sizeIndex++) {
            const sizeName = fallbackSizeNames[sizeIndex];
            const createdSizeOption = await prisma.sizeOption.create({
              data: {
                sizeGroupId: sizeGroup.id,
                name: sizeName,
                value: sizeName,
                displayOrder: sizeIndex,
                active: true,
              },
            });
            sizeOptions.push(createdSizeOption as any);
          }
        }

        const targetSizeOptionIds = new Set(sizeOptions.map((sizeOption) => sizeOption.id));
        const existingBranchSizes = await prisma.branchMenuItemSize.findMany({
          where: { branchMenuItemId: branchMenuItem.id },
        });

        for (const existingSize of existingBranchSizes) {
          if (!targetSizeOptionIds.has(existingSize.sizeOptionId)) {
            await prisma.branchMenuItemSize.delete({ where: { id: existingSize.id } });
          }
        }

        for (const sizeOption of sizeOptions) {
          const price = Number(itemSeed.prices?.[sizeOption.name] ?? itemSeed.prices?.[sizeOption.value ?? ""] ?? itemSeed.basePrice ?? 0);
          await prisma.branchMenuItemSize.upsert({
            where: {
              branchMenuItemId_sizeOptionId: {
                branchMenuItemId: branchMenuItem.id,
                sizeOptionId: sizeOption.id,
              },
            },
            update: {
              price,
              available: true,
            },
            create: {
              branchMenuItemId: branchMenuItem.id,
              sizeOptionId: sizeOption.id,
              price,
              available: true,
            },
          });
        }
      }

      const modifierAttachmentTarget = hasSizes ? null : { menuItemId: menuItem.id };
      if (!hasSizes) {
        const existingModifierGroups = await prisma.modifierGroup.findMany({
          where: { menuItemId: menuItem.id },
        });

        for (const existingGroup of existingModifierGroups) {
          await prisma.modifierGroup.delete({ where: { id: existingGroup.id } });
        }

        const modifierGroups = itemSeed.modifierGroups ?? [];
        for (let groupIndex = 0; groupIndex < modifierGroups.length; groupIndex++) {
          const modifierGroupSeed = modifierGroups[groupIndex];
          const modifierGroup = await prisma.modifierGroup.create({
            data: {
              menuItemId: menuItem.id,
              name: modifierGroupSeed.name,
              displayOrder: groupIndex,
              required: modifierGroupSeed.required ?? false,
              minSelections: modifierGroupSeed.minSelections ?? 0,
              maxSelections: modifierGroupSeed.maxSelections ?? 1,
              active: true,
            },
          });

          await upsertModifierGroupTranslations(modifierGroup.id, modifierGroupSeed.name);

          for (let optionIndex = 0; optionIndex < modifierGroupSeed.options.length; optionIndex++) {
            const optionSeed = modifierGroupSeed.options[optionIndex];
            const modifierOption = await prisma.modifierOption.create({
              data: {
                modifierGroupId: modifierGroup.id,
                name: optionSeed.name,
                price: Number(optionSeed.price),
                displayOrder: optionIndex,
                active: true,
              },
            });
            await upsertModifierOptionTranslations(modifierOption.id, optionSeed.name);
          }
        }
      } else if (sizeGroup) {
        const sizeOptions = await prisma.sizeOption.findMany({
          where: { sizeGroupId: sizeGroup.id },
          orderBy: { displayOrder: "asc" },
        });

        for (const sizeOption of sizeOptions) {
          const existingModifierGroups = await prisma.modifierGroup.findMany({
            where: { sizeOptionId: sizeOption.id },
          });

          for (const existingGroup of existingModifierGroups) {
            await prisma.modifierGroup.delete({ where: { id: existingGroup.id } });
          }

          const modifierGroupsForSize =
            itemSeed.modifierGroupsBySize?.[sizeOption.value ?? sizeOption.name] ??
            itemSeed.modifierGroupsBySize?.[getStableSizeValue(sizeOption.name)] ??
            itemSeed.modifierGroups ?? [];

          for (let groupIndex = 0; groupIndex < modifierGroupsForSize.length; groupIndex++) {
            const modifierGroupSeed = modifierGroupsForSize[groupIndex];
            const modifierGroup = await prisma.modifierGroup.create({
              data: {
                sizeOptionId: sizeOption.id,
                name: modifierGroupSeed.name,
                displayOrder: groupIndex,
                required: modifierGroupSeed.required ?? false,
                minSelections: modifierGroupSeed.minSelections ?? 0,
                maxSelections: modifierGroupSeed.maxSelections ?? 1,
                active: true,
              },
            });

            await upsertModifierGroupTranslations(modifierGroup.id, modifierGroupSeed.name);

            for (let optionIndex = 0; optionIndex < modifierGroupSeed.options.length; optionIndex++) {
              const optionSeed = modifierGroupSeed.options[optionIndex];
              const modifierOption = await prisma.modifierOption.create({
                data: {
                  modifierGroupId: modifierGroup.id,
                  name: optionSeed.name,
                  price: Number(optionSeed.price),
                  displayOrder: optionIndex,
                  active: true,
                },
              });
              await upsertModifierOptionTranslations(modifierOption.id, optionSeed.name);
            }
          }
        }
      }
    }
  }

  await ensureBranchMenuItemSizes(branchMenu.id);

  console.log(`  ✓ Seeded branch menu for ${branchName}`);
}

async function main() {
  const shouldSeed = await shouldSeedDatabase();

  if (!shouldSeed) {
    console.log("ℹ️ Database already contains seed data. Updating existing seed records.");
  } else {
    console.log("🌱 Applying database seed...");
  }

  // ============================================================================
  // ROLES
  // ============================================================================
  console.log("📋 Creating roles...");
  const roleNames = [
    "SUPER_ADMIN",
    "RESTAURANT_ADMIN",
    "KITCHEN",
    "DRIVER",
    "REPORTER",
    "CUSTOMER",
  ];
  const roles: Record<string, string> = {};

  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    roles[name] = role.id;
    console.log(`  ✓ Created role: ${name}`);
  }

  console.log("🌐 Creating languages...");
  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: {
        name: language.name,
        isActive: language.isActive,
      },
      create: language,
    });
    console.log(`  ✓ Created language: ${language.code}`);
  }

  // ============================================================================
  // USERS
  // ============================================================================
  console.log("👥 Creating test users...");

  // Super Admin
  const adminPasswordHash = await bcryptjs.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@delta.local" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@delta.local",
      phone: "+48 739 659 985",
      passwordHash: adminPasswordHash,
      authProvider: "NATIVE",
      roles: {
        create: {
          roleId: roles["SUPER_ADMIN"],
        },
      },
    },
    include: { roles: true },
  });
  console.log(`  ✓ Created super admin: ${admin.email}`);

  // Kitchen Staff
  const kitchenPasswordHash = await bcryptjs.hash("kitchen123", 10);
  const kitchenStaff = await prisma.user.upsert({
    where: { email: "kitchen@delta.local" },
    update: {},
    create: {
      name: "Kitchen Staff",
      email: "kitchen@delta.local",
      phone: "+48 111 222 333",
      passwordHash: kitchenPasswordHash,
      authProvider: "NATIVE",
      roles: {
        create: {
          roleId: roles["KITCHEN"],
        },
      },
    },
  });
  console.log(`  ✓ Created kitchen staff: ${kitchenStaff.email}`);

  // Driver
  const driverPasswordHash = await bcryptjs.hash("driver123", 10);
  const driver = await prisma.user.upsert({
    where: { email: "driver@delta.local" },
    update: {},
    create: {
      name: "Test Driver",
      email: "driver@delta.local",
      phone: "+48 444 555 666",
      passwordHash: driverPasswordHash,
      authProvider: "NATIVE",
      roles: {
        create: {
          roleId: roles["DRIVER"],
        },
      },
    },
  });
  console.log(`  ✓ Created driver: ${driver.email}`);

  // Customer
  const customerPasswordHash = await bcryptjs.hash("customer123", 10);
  const customer = await prisma.user.upsert({
    where: { email: "customer@delta.local" },
    update: {},
    create: {
      name: "Test Customer",
      email: "customer@delta.local",
      phone: "+48 777 888 999",
      passwordHash: customerPasswordHash,
      authProvider: "NATIVE",
      roles: {
        create: {
          roleId: roles["CUSTOMER"],
        },
      },
    },
  });
  console.log(`  ✓ Created customer: ${customer.email}`);

  // ============================================================================
  // RESTAURANTS & BRANCHES
  // ============================================================================
  console.log("🍽️ Creating restaurants and branches...");

  const branchSeedData = [
    {
      id: "delta-kebab-branch-1",
      name: "Delta Kebab - Cieplewo",
      street: "Długa",
      buildingNumber: "101a/Lokal 7",
      city: "Cieplewo",
      postalCode: "83-031",
      latitude: 54.232071,
      longitude: 18.643799,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-2",
      name: "Delta Kebab - Kowale",
      street: "Apollina",
      buildingNumber: "16/2",
      city: "Kowale",
      postalCode: "80-180",
      latitude: 54.306059,
      longitude: 18.569809,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-3",
      name: "Delta Kebab - Pruszcz Gdański",
      street: "Chopina",
      buildingNumber: "2",
      city: "Pruszcz Gdański",
      postalCode: "83-000",
      latitude: 54.261974,
      longitude: 18.636377,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-4",
      name: "Delta Kebab - Starogard Gdański (Rynek)",
      street: "Rynek",
      buildingNumber: "38",
      city: "Starogard Gdański",
      postalCode: "83-200",
      latitude: 53.967822,
      longitude: 18.532756,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-5",
      name: "Delta Kebab - Starogard Gdański (Nowowiejska)",
      street: "Droga Nowowiejska",
      buildingNumber: "1A",
      city: "Starogard Gdański",
      postalCode: "83-200",
      latitude: 53.965418,
      longitude: 18.515419,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-tczew-main",
      name: "Delta Kebab - Tczew (Jodłowa)",
      street: "Jodłowa",
      buildingNumber: "11A",
      city: "Tczew",
      postalCode: "83-110",
      latitude: 54.097471,
      longitude: 18.768975,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-7",
      name: "Delta Kebab - Tczew (Wojska Polskiego)",
      street: "Wojska Polskiego",
      buildingNumber: "28",
      city: "Tczew",
      postalCode: "83-110",
      latitude: 54.088359,
      longitude: 18.787189,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-8",
      name: "Delta Kebab - Tuchola",
      street: "Świecka",
      buildingNumber: "26",
      city: "Tuchola",
      postalCode: "89-500",
      latitude: 53.586364,
      longitude: 17.861473,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-9",
      name: "Delta Kebab - Lidzbark",
      street: "Plac Generała Józefa Hallera",
      buildingNumber: "2",
      city: "Lidzbark",
      postalCode: "13-230",
      latitude: 53.262713,
      longitude: 19.822296,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-10",
      name: "Delta Kebab - Olsztynek",
      street: "Warszawska",
      buildingNumber: "8",
      city: "Olsztynek",
      postalCode: "11-015",
      latitude: 53.582472,
      longitude: 20.283026,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-11",
      name: "Delta Kebab - Kętrzyn",
      street: "Adama Mickiewicza",
      buildingNumber: "2",
      city: "Kętrzyn",
      postalCode: "11-400",
      latitude: 54.076653,
      longitude: 21.374531,
      phone: null,
      active: true,
    },
    {
      id: "delta-kebab-branch-12",
      name: "Delta Kebab - Wrzeszcz",
      street: "Klonowa",
      buildingNumber: "1/43",
      city: "Gdańsk",
      postalCode: "80-264",
      latitude: 54.380591,
      longitude: 18.603988,
      phone: null,
      active: true,
    },
  ];
  // branches.json is no longer used and can be removed from the project

  const restaurant = await prisma.restaurant.upsert({
    where: { id: "delta-kebab-tczew" },
    update: {},
    create: {
      id: "delta-kebab-tczew",
      name: "Delta Kebab",
      active: true,
    },
  });
  console.log(`  ✓ Created restaurant: ${restaurant.name}`);

  const branch = await prisma.branch.upsert({
    where: { id: "delta-kebab-tczew-main" },
    update: {},
    create: {
      id: "delta-kebab-tczew-main",
      restaurantId: restaurant.id,
      name: "Tczew - Main Branch",
      street: "ul. Jodłowa",
      buildingNumber: "11A",
      city: "Tczew",
      postalCode: "83-110",
      latitude: 54.097471,
      longitude: 18.768975,
      phone: "739 659 985",
      active: true,
    },
  });
  console.log(`  ✓ Created branch: ${branch.name}`);

  for (const branchData of branchSeedData) {
    const seededBranch = await prisma.branch.upsert({
      where: { id: branchData.id },
      update: {},
      create: {
        restaurantId: restaurant.id,
        ...branchData,
      },
    });
    console.log(`  ✓ Created branch: ${seededBranch.name}`);
  }

  const createdBranches = [{ id: branch.id, name: branch.name }];
  for (const seededBranch of branchSeedData) {
    createdBranches.push({ id: seededBranch.id, name: seededBranch.name });
  }

  for (const branchSeed of createdBranches) {
    await ensureBranchMenuSeed(branchSeed.id, branchSeed.name);
  }

  // ============================================================================
  // RESTAURANT CONFIGURATION
  // ============================================================================
  console.log("⚙️  Creating restaurant configuration...");

  const info = await prisma.restaurantInfo.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      packagingFee: 1.5,
      plasticBagFee: 1.0,
    },
  });
  console.log("  ✓ Created restaurant info");

  const hours = [
    { dayOfWeek: 0, openTime: "10:00", closeTime: "24:00" },
    { dayOfWeek: 1, openTime: "10:00", closeTime: "24:00" },
    { dayOfWeek: 2, openTime: "10:00", closeTime: "24:00" },
    { dayOfWeek: 3, openTime: "10:00", closeTime: "24:00" },
    { dayOfWeek: 4, openTime: "10:00", closeTime: "02:00" },
    { dayOfWeek: 5, openTime: "10:00", closeTime: "02:00" },
    { dayOfWeek: 6, openTime: "10:00", closeTime: "24:00" },
  ];

  for (const branchSeed of createdBranches) {
    for (const hour of hours) {
      await prisma.branchHours.upsert({
        where: { branchId_dayOfWeek: { branchId: branchSeed.id, dayOfWeek: hour.dayOfWeek } },
        update: { openTime: hour.openTime, closeTime: hour.closeTime },
        create: {
          branchId: branchSeed.id,
          ...hour,
        },
      });
    }

    await prisma.branchDeliveryRule.upsert({
      where: { branchId: branchSeed.id },
      update: {},
      create: {
        branchId: branchSeed.id,
        minimumOrderValue: 40.0,
        maximumDeliveryDistance: 20.0,
        baseDeliveryFee: 5.0,
        perKmFee: 2.0,
      },
    });
  }
  console.log("  ✓ Created branch hours and delivery rules");

  // ============================================================================
  // STAFF ASSIGNMENTS
  // ============================================================================
  console.log("👨‍💼 Assigning staff to branches...");

  await prisma.restaurantStaff.upsert({
    where: {
      userId_branchId: {
        userId: kitchenStaff.id,
        branchId: branch.id,
      },
    },
    update: {},
    create: {
      userId: kitchenStaff.id,
      branchId: branch.id,
    },
  });
  console.log("  ✓ Assigned kitchen staff to branch");

  // ============================================================================
  // DRIVER PROFILE
  // ============================================================================
  console.log("🚗 Creating driver profile...");

  const driverProfile = await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    update: {},
    create: {
      userId: driver.id,
      active: true,
      vehicleInfo: {
        type: "motorcycle",
        plate: "DLT-001",
        color: "black",
      },
    },
  });
  console.log("  ✓ Created driver profile");

  // ============================================================================
  // CUSTOMER ADDRESS
  // ============================================================================
  console.log("📍 Creating customer addresses...");

  const address = await prisma.customerAddress.upsert({
    where: { id: "customer-addr-1" },
    update: {},
    create: {
      id: "customer-addr-1",
      userId: customer.id,
      label: "Home",
      street: "ul. Główna",
      buildingNumber: "42",
      apartmentNumber: "5",
      floor: "2",
      city: "Tczew",
      postalCode: "83-110",
      latitude: 54.089456,
      longitude: 18.777129,
      accessNotes: "Ring intercom number 25, entrance from back side",
      active: true,
    },
  });
  console.log("  ✓ Created customer address");

  // ============================================================================
  // SAMPLE ORDER (Optional - for testing)
  // ============================================================================
  console.log("📦 Creating sample order...");

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      branchId: branch.id,
      orderType: "DELIVERY",
      status: "NEW",
      totalPrice: 85.5,
      deliveryFee: 5.0,
      customerName: customer.name,
      customerPhone: customer.phone || "",
      street: address.street,
      buildingNumber: address.buildingNumber,
      apartmentNumber: address.apartmentNumber,
      floor: address.floor,
      city: address.city,
      postalCode: address.postalCode,
      latitude: address.latitude,
      longitude: address.longitude,
      accessNotes: address.accessNotes,
    },
  });
  console.log(`  ✓ Created sample order: ${order.id}`);

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order.id,
        itemName: "ROLLO DELTA KEBAB",
        sizeName: "Średnie",
        quantity: 2,
        unitPrice: 24.0,
        notes: "Extra sauce",
      },
      {
        orderId: order.id,
        itemName: "FRYTKI",
        sizeName: "Duże",
        quantity: 1,
        unitPrice: 17.0,
        notes: "",
      },
    ],
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: "NEW",
      changedByUserId: admin.id,
      changedByRole: "SUPER_ADMIN",
      reason: "Order created from seed script",
    },
  });

  console.log("  ✓ Added order items and status history");

  // ============================================================================
  // COMPLETION
  // ============================================================================
  console.log("\n✅ Database seed completed successfully!");
  console.log("\n📊 Seed Summary:");
  console.log(`   - Roles: ${roleNames.length}`);
  console.log("   - Users: 4 (admin, kitchen, driver, customer)");
  console.log("   - Restaurant & Branch: 1 each");
  console.log("   - Branch menus: seeded from the embedded menu catalog");
  console.log("   - Sample Order: 1");

  console.log("\n🔐 Test Credentials:");
  console.log("   Admin: admin@delta.local / admin123");
  console.log("   Kitchen: kitchen@delta.local / kitchen123");
  console.log("   Driver: driver@delta.local / driver123");
  console.log("   Customer: customer@delta.local / customer123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
