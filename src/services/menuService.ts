import { prisma } from '../database/prisma';

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
            orderBy: { name: 'asc' }
          }
        }
      }
    }
  });

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

  const categories = (branchMenu.categories || []).map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
    items: (category.items || []).map((menuItem) => {
      const branchMenuItem = branchMenuItemMap.get(menuItem.id);
      const sizes = (branchMenuItem?.sizes || []).map((size) => ({
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
        available: branchMenuItem?.available ?? true,
        sizes
      };
    })
  }));

  const items = categories.flatMap((category) =>
    category.items.map((item) => ({
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
