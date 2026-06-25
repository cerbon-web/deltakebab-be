import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser } from '../services/authService';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(5),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(5).optional(),
  password: z.string().min(6)
}).refine(data => Boolean(data.email || data.phone), {
  message: 'Email or phone is required'
});

router.post('/register', async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const result = await registerUser(data);
  res.status(201).json(result);
});

router.post('/login', async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const result = await loginUser(data);
  res.status(200).json(result);
});

export default router;
