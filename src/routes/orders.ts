import { Router } from 'express';
import {
  createOrderController,
  getMyOrdersController,
  getOrderController,
  updateOrderStatusController,
  restaurantOrdersController,
  driverOrdersController
} from '../controllers/orderController';
import { validate } from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/schemas';

const router = Router();

router.post('/', validate(createOrderSchema), createOrderController);
router.get('/my', getMyOrdersController);
router.get('/:id', getOrderController);
router.patch('/:id/status', validate(updateOrderStatusSchema), updateOrderStatusController);
router.get('/restaurant/list', restaurantOrdersController);
router.get('/driver/list', driverOrdersController);

export default router;
