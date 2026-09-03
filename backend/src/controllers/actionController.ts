import { Response } from "express";
import { z } from "zod";
import * as caseService from "../services/caseService";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

export async function updateAction(req: AuthedRequest, res: Response) {
  const schema = z.object({ status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid action status");
  const action = await caseService.updateActionStatus(req.params.id, parsed.data.status);
  res.json(action);
}
