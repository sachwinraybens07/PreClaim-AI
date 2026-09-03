import { Response } from "express";
import * as dashboardService from "../services/dashboardService";
import { AuthedRequest } from "../middleware/auth";

export async function getDashboard(_req: AuthedRequest, res: Response) {
  const data = await dashboardService.getDashboardData();
  res.json(data);
}
