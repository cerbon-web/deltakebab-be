import { prisma } from '../database/prisma';

export const getMenuByRestaurant = async (restaurantId: string) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      branches: {
        where: { active: true },
        orderBy: { name: 'asc' },
        take: 1
      }
    }
  });

  const branchId = restaurant?.branches?.[0]?.id;

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    include: {
      items: {
        where: { active: true },
        orderBy: { name: 'asc' },
        include: {
          prices: {
            where: branchId ? { branchId } : undefined,
            orderBy: { validFrom: 'desc' }
          }
        }
      }
    }
  });

  const items = categories.flatMap((category) =>
    (category.items || []).map((item) => ({
      ...item,
      category_name: category.name,
      price: Number(item.prices?.[0]?.price ?? 0),
      ingredients: item.description ?? ''
    }))
  );

  return {
    restaurantId,
    categories,
    items
  };
};
