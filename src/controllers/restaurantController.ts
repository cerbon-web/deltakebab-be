import { Request, Response } from 'express';
import { getRestaurants, getNearestRestaurants, getRestaurantById } from '../services/restaurantService';

export const listRestaurantsController = async (_req: Request, res: Response) => {
  const restaurants = await getRestaurants();
  res.json(restaurants);
};

export const nearestRestaurantsController = async (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  const restaurants = await getNearestRestaurants(String(lat), String(lng));
  res.json(restaurants);
};

export const restaurantDetailController = async (req: Request, res: Response) => {
  const restaurant = await getRestaurantById(Number(req.params.id));
  res.json(restaurant);
};
