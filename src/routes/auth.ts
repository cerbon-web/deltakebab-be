import { Router, Request, Response } from 'express';
import { registerUser, loginUser } from '../services/authService';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/schemas';

const router = Router();

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  res.status(201).json(result);
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.status(200).json(result);
});

export default router;
