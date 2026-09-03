import { Request, Response } from "express";
import { z } from "zod";
import * as authService from "../services/authService";
import { ApiError } from "../middleware/errorHandler";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  if (req.body?.demo === true) {
    const result = await authService.demoLogin();
    return res.json(result);
  }
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid email or password");
  const result = await authService.login(parsed.data.email, parsed.data.password);
  res.json(result);
}
