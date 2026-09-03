import { Response } from "express";
import * as denialService from "../services/denialService";
import { AuthedRequest } from "../middleware/auth";

export async function getDenials(req: AuthedRequest, res: Response) {
  const { payer, procedure, reason } = req.query as { payer?: string; procedure?: string; reason?: string };
  const data = await denialService.getDenialAnalytics({ payer, procedure, reason });
  res.json(data);
}
