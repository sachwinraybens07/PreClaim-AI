import { Response } from "express";
import { z } from "zod";
import * as caseService from "../services/caseService";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

export async function updateDocument(req: AuthedRequest, res: Response) {
  const schema = z.object({ status: z.enum(["MISSING", "AVAILABLE", "PENDING_REVIEW"]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid document status");
  const doc = await caseService.updateDocumentStatus(req.params.id, parsed.data.status);
  res.json(doc);
}
