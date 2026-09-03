import bcrypt from "bcryptjs";
import prisma from "../database/prisma";
import { ApiError } from "../middleware/errorHandler";
import { signToken } from "../middleware/auth";

export const DEMO_EMAIL = "sarah.chen@preclaim.ai";
export const DEMO_PASSWORD = "demo1234";

export async function ensureDemoUser() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.create({
    data: {
      name: "Sarah Chen",
      email: DEMO_EMAIL,
      passwordHash,
      role: "RCM_MANAGER",
    },
  });
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, "Invalid email or password");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid email or password");
  const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

export async function demoLogin() {
  const user = await ensureDemoUser();
  const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}
