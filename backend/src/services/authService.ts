import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import prisma from "../database/prisma";
import { ApiError } from "../middleware/errorHandler";
import { signToken } from "../middleware/auth";

export const DEMO_EMAIL = "sarah.chen@preclaim.ai";
export const DEMO_PASSWORD = "demo1234";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toSafeUser(user: { id: string; name: string; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

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
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.passwordHash) throw new ApiError(401, "Invalid email or password");
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

export async function registerUser(name: string, email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new ApiError(409, "An account with this email already exists.");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      provider: "LOCAL",
    },
  });

  const token = signToken(toSafeUser(user));
  return { token, user: toSafeUser(user) };
}

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export async function handleGoogleProfile(profile: GoogleProfile) {
  if (!profile.emailVerified) {
    throw new ApiError(401, "Google account email is not verified.");
  }
  const normalizedEmail = normalizeEmail(profile.email);

  const existingByGoogleId = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
  if (existingByGoogleId) {
    const token = signToken(toSafeUser(existingByGoogleId));
    return { token, user: toSafeUser(existingByGoogleId) };
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingByEmail) {
    throw new ApiError(409, "An account with this email already exists. Please sign in with your password.");
  }

  const user = await prisma.user.create({
    data: {
      name: profile.name || normalizedEmail,
      email: normalizedEmail,
      googleId: profile.googleId,
      provider: "GOOGLE",
    },
  });

  const token = signToken(toSafeUser(user));
  return { token, user: toSafeUser(user) };
}

export async function googleLogin(idToken: string) {
  if (!GOOGLE_CLIENT_ID) {
    throw new ApiError(500, "Google sign-in is not configured on the server.");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, "Invalid Google credential.");
  }

  if (!payload?.sub || !payload.email) {
    throw new ApiError(401, "Invalid Google credential.");
  }

  return handleGoogleProfile({
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    emailVerified: payload.email_verified === true,
  });
}
