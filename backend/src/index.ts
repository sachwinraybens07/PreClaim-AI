import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { ensureDemoUser } from "./services/authService";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "preclaim-ai-backend" }));

app.use("/api", router);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await ensureDemoUser();
  app.listen(PORT, () => {
    console.log(`PreClaim AI backend listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to initialize server:", err);
  process.exit(1);
});
