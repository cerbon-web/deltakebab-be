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
    sizes?: Array<{
      id: string;
      name: string;
      price: number;
      available: boolean;
    }>;
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
          sizes: menuItem.sizes ?? []
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
            where: { active: true }
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
      const branchMenuItem = branchMenuItemMap.get(menuItem.id);
      const sizes = (branchMenuItem?.sizes || []).map((size: any) => ({
        id: size.id,
        name: size.sizeOption.name,
        price: Number(size.price),
        available: size.available
      }));

      return {
        id: menuItem.id,
        name: branchMenuItem?.nameOverride || menuItem.name,
        description: branchMenuItem?.descriptionOverride || menuItem.description,
        imageUrl: menuItem.imageUrl,
        active: true,
        available: branchMenuItem?.available ?? true,
        displayOrder: menuItem.displayOrder,
        featured: menuItem.featured,
        sizes
      };
    })
  })));

  const items = categories.flatMap((category) =>
    category.items.map((item: any) => ({
      ...item,
      category_id: category.id,
      category_name: category.name,
      price: Number(item.sizes?.[0]?.price ?? 0),
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
