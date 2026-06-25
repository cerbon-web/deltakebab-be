import { Router, Request, Response } from 'express';
import { getRestaurants, getNearestRestaurants, getRestaurantById } from '../services/restaurantService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const restaurants = await getRestaurants();
  res.json(restaurants);
});

router.get('/nearest', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  const restaurants = await getNearestRestaurants(String(lat), String(lng));
  res.json(restaurants);
});

router.get('/:id', async (req: Request, res: Response) => {
  const restaurant = await getRestaurantById(Number(req.params.id));
  res.json(restaurant);
});

export default router;
