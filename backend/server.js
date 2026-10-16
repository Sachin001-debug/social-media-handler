import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import db from "./models/index.js";
import { config as dbConfig } from "./config/sequelize.js";
import authRoutes from "./routes/authRoutes.js";
import fbRoutes from "./routes/fbRoutes.js";
import fbScheduledPostRoutes from "./routes/fbScheduledPostRoutes.js";
import fbPostRoute from "./routes/fbPostRoute.js";
import { startFbPostScheduler } from "./services/fbPostService.js";
import { registerMessengerWebhook } from "./services/fbServices.js";
import instaRoutes from "./routes/instagramRoutes.js";
import instaScheduledPostRoutes from "./routes/instaScheduledPostRoutes.js";
import fbMessengerRoutes from "./routes/fbMessengerRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js"; // NEW
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    name: "socially.sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Routes
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/webhook", webhookRoutes);

app.use("/api", authRoutes);
app.use("/api", fbRoutes);
app.use("/api/facebook", fbScheduledPostRoutes);
app.use("/api/facebook", fbPostRoute);
app.use("/api", instaRoutes);
app.use("/api/instagram", instaScheduledPostRoutes);
app.use("/api/messenger", fbMessengerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/auth", fbRoutes);

// Unknown API route
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ message: "Internal server error" });
});

// Start server
const start = async () => {
  try {
    await db.sequelize.authenticate();
  } catch (error) {
    console.error(
      `MySQL connection failed (${dbConfig.host}:${dbConfig.port}/${dbConfig.database}): ${error.message}`
    );
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startFbPostScheduler();
    void registerMessengerWebhook();
  });
};

start();