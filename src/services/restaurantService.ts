import { db } from '../database/knex';

export const getRestaurants = async () => {
  return db('restaurant_info').select('*');
};

export const getNearestRestaurants = async (lat: string, lng: string) => {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return [];
  }

  const restaurants = await db('restaurant_info').select('*');

  return restaurants.map((restaurant: any) => ({
    ...restaurant,
    distance_km: null
  }));
};

export const getRestaurantById = async (id: number) => {
  const restaurant = await db('restaurant_info').where('id', id).first();
  return restaurant;
};
