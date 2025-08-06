import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import stackingRoutes from "./routes/stackingRoutes.js";

dotenv.config();
const app = express();

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.use("/staking", stackingRoutes);
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB Connected"))
  .catch((err) => console.error(err));

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
