import { Request, Response } from "express";
import { z } from "zod";
import * as authService from "../services/authService";
import { ApiError } from "../middleware/errorHandler";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const googleSchema = z.object({
  idToken: z.string().min(1, "Missing Google credential"),
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

export async function signup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid signup details");
  }
  const result = await authService.registerUser(parsed.data.name, parsed.data.email, parsed.data.password);
  res.status(201).json(result);
}

export async function google(req: Request, res: Response) {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Missing Google credential");
  const result = await authService.googleLogin(parsed.data.idToken);
  res.json(result);
}
