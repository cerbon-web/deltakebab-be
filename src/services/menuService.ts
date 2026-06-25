import { db } from '../database/knex';

export const getMenuByRestaurant = async (restaurantId: number) => {
  const categories = await db('categories').select('id', 'name').orderBy('id');

  const menuItems = await db('items as i')
    .join('categories as c', 'i.category_id', 'c.id')
    .leftJoin('item_prices as ip', 'ip.item_id', 'i.id')
    .leftJoin('sizes as s', 's.id', 'ip.size_id')
    .select(
      'i.id',
      'i.name',
      'i.ingredients',
      'c.id as category_id',
      'c.name as category_name',
      'ip.id as price_id',
      'ip.size_id',
      's.name as size_name',
      'ip.price'
    )
    .orderBy('i.id');

  return {
    restaurantId,
    categories,
    items: menuItems
  };
};
