import { Response } from "express";
import { z } from "zod";
import * as copilotService from "../services/copilotService";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

export async function ask(req: AuthedRequest, res: Response) {
  const schema = z.object({ message: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Message cannot be empty");
  const response = await copilotService.askCopilot(req.params.id, req.user?.id, parsed.data.message);
  res.json(response);
}

export async function history(req: AuthedRequest, res: Response) {
  const messages = await copilotService.getCopilotHistory(req.params.id);
  res.json(messages);
}
