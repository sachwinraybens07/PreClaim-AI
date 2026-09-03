import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "preclaim-ai-hackathon-secret";

export interface AuthedRequest extends Request {
  user?: { id: string; name: string; email: string; role: string };
}

export function signToken(payload: { id: string; name: string; email: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: true, message: "Authentication required" });
  }
  try {
    const token = header.slice("Bearer ".length);
    const decoded = jwt.verify(token, JWT_SECRET) as AuthedRequest["user"];
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: true, message: "Invalid or expired session" });
  }
}
