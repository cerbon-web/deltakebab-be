import { prisma } from '../database/prisma';

export type MenuCategoryInput = {
  id: string;
  name: string;
  icon?: string | null;
  displayOrder?: number;
  items?: Array<{
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    active?: boolean;
    available?: boolean;
    displayOrder?: number;
    featured?: boolean;
    basePrice?: number | null;
    sizes?: Array<{
      id: string;
      name: string;
      price: number;
      available: boolean;
      modifierGroups?: Array<any>;
    }>;
    modifierGroups?: Array<any>;
  }>;
};

export const buildMenuCategoryViews = (categories: MenuCategoryInput[]) => {
  const sortedCategories = categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      displayOrder: category.displayOrder ?? 0,
      items: (category.items || [])
        .map((menuItem) => ({
          id: menuItem.id,
          name: menuItem.name,
          description: menuItem.description,
          imageUrl: menuItem.imageUrl,
          active: menuItem.active ?? true,
          displayOrder: menuItem.displayOrder ?? 0,
          featured: menuItem.featured ?? false,
          available: menuItem.available ?? true,
          basePrice: menuItem.basePrice ?? 0,
          sizes: menuItem.sizes ?? [],
          modifierGroups: menuItem.modifierGroups ?? []
        }))
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name))
    }))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name));

  const featuredItems = sortedCategories.flatMap((category) =>
    (category.items || [])
      .filter((item) => item.featured && item.active !== false)
      .map((item) => ({
        ...item,
        category_id: category.id,
        category_name: category.name,
        categoryDisplayOrder: category.displayOrder ?? 0,
        itemDisplayOrder: item.displayOrder ?? 0
      }))
  );

  const uniqueFeaturedItems = Array.from(
    featuredItems.reduce((map, item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
      return map;
    }, new Map<string, any>())
      .values()
  );

  const featuredCategory = uniqueFeaturedItems.length > 0 ? {
    id: 'featured',
    name: 'Top ones',
    icon: null,
    displayOrder: Number.MIN_SAFE_INTEGER,
    isFeatured: true,
    items: uniqueFeaturedItems
      .slice()
      .sort((a, b) => (a.categoryDisplayOrder ?? 0) - (b.categoryDisplayOrder ?? 0) || (a.itemDisplayOrder ?? 0) - (b.itemDisplayOrder ?? 0) || a.name.localeCompare(b.name))
  } : null;

  return featuredCategory ? [featuredCategory, ...sortedCategories] : sortedCategories;
};

export const resolveMenuPricesFromDatabase = ({
  branchMenuItemBasePrice,
  sizePrices
}: {
  branchMenuItemBasePrice?: number | null;
  sizePrices?: Array<{ sizeName: string; price: number | null | undefined }>;
}) => {
  const normalizedSizePrices = (sizePrices || [])
    .filter((size) => size?.sizeName)
    .map((size) => ({
      name: size.sizeName,
      price: Number(size.price ?? 0)
    }));

  const sizePriceList = normalizedSizePrices.length > 0 ? normalizedSizePrices : [];
  const basePrice = Number(branchMenuItemBasePrice ?? 0);
  const displayPrice = sizePriceList.length > 0 ? (sizePriceList[0]?.price ?? 0) : basePrice;

  return {
    basePrice,
    displayPrice,
    sizePrices: sizePriceList
  };
};

export const getBranchMenu = async (branchId: string) => {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      restaurant: true,
      hours: true,
      deliveryRules: true
    }
  });

  if (!branch) {
    return null;
  }

  const branchMenu = await prisma.branchMenu.findFirst({
    where: { branchId, active: true },
    include: {
      categories: {
        where: { active: true },
        orderBy: { displayOrder: 'asc' },
        include: {
          items: {
            where: { active: true },
            include: {
              sizeGroup: {
                include: {
                  options: {
                    where: { active: true },
                    orderBy: { displayOrder: 'asc' },
                    include: {
                      modifierGroups: {
                        where: { active: true },
                        include: {
                          options: {
                            where: { active: true },
                            orderBy: { displayOrder: 'asc' }
                          }
                        },
                        orderBy: { displayOrder: 'asc' }
                      }
                    }
                  }
                }
              },
              modifierGroups: {
                where: { active: true },
                include: {
                  options: {
                    where: { active: true },
                    orderBy: { displayOrder: 'asc' }
                  }
                },
                orderBy: { displayOrder: 'asc' }
              }
            }
          }
        }
      }
    }
  }) as typeof prisma.branchMenu extends { findFirst: (args: infer T) => infer R } ? any : never;

  if (!branchMenu) {
    return {
      branch,
      menu: null,
      categories: []
    };
  }

  const branchMenuItems = await prisma.branchMenuItem.findMany({
    where: { branchMenuId: branchMenu.id },
    include: {
      sizes: {
        where: { available: true },
        include: { sizeOption: true },
        orderBy: { sizeOption: { displayOrder: 'asc' } }
      }
    }
  });

  const branchMenuItemMap = new Map(branchMenuItems.map((item) => [item.menuItemId, item]));

  const categories = buildMenuCategoryViews((branchMenu.categories || []).map((category: any) => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
    displayOrder: category.displayOrder,
    items: (category.items || []).map((menuItem: any) => {
      const branchMenuItem = branchMenuItemMap.get(menuItem.id) as any;
      const sizeOptions = (menuItem.sizeGroup?.options || []).map((sizeOption: any) => {
        const sizePriceRow = (branchMenuItem?.sizes || []).find((size: any) => size.sizeOptionId === sizeOption.id);
        const resolvedPrice = Number(sizePriceRow?.price ?? 0);
        return {
          id: sizeOption.id,
          name: sizeOption.name,
          price: resolvedPrice,
          available: sizeOption.active !== false,
          modifierGroups: (sizeOption.modifierGroups || []).map((group: any) => ({
            id: group.id,
            name: group.name,
            required: group.required,
            minSelections: group.minSelections,
            maxSelections: group.maxSelections,
            options: (group.options || []).map((option: any) => ({
              id: option.id,
              name: option.name,
              price: Number(option.price ?? 0)
            }))
          }))
        };
      });

      const itemModifierGroups = (menuItem.modifierGroups || []).map((group: any) => ({
        id: group.id,
        name: group.name,
        required: group.required,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        options: (group.options || []).map((option: any) => ({
          id: option.id,
          name: option.name,
          price: Number(option.price ?? 0)
        }))
      }));

      const dbPriceResult = resolveMenuPricesFromDatabase({
        branchMenuItemBasePrice: branchMenuItem?.basePrice ?? null,
        sizePrices: sizeOptions.map((sizeOption: any) => ({
          sizeName: sizeOption.name,
          price: sizeOption.price
        }))
      });
      const basePrice = dbPriceResult.basePrice;
      const displayPrice = dbPriceResult.displayPrice;

      return {
        id: menuItem.id,
        name: branchMenuItem?.nameOverride || menuItem.name,
        description: branchMenuItem?.descriptionOverride || menuItem.description,
        imageUrl: menuItem.imageUrl,
        active: true,
        available: branchMenuItem?.available ?? true,
        displayOrder: menuItem.displayOrder,
        featured: menuItem.featured,
        basePrice: displayPrice,
        sizes: sizeOptions,
        modifierGroups: itemModifierGroups,
        price: displayPrice
      };
    })
  })));

  const items = categories.flatMap((category) =>
    category.items.map((item: any) => ({
      ...item,
      category_id: category.id,
      category_name: category.name,
      price: Number(item.price ?? 0),
      ingredients: item.description ?? ''
    }))
  );

  return {
    branch,
    menu: branchMenu,
    categories,
    items
  };
};

export const getMenuByRestaurant = getBranchMenu;
