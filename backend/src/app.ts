import express from "express";
import cors from "cors";

import poiRoutes from "./routes/pois";
import userRoutes from "./routes/users";

const app = express();
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/pois", poiRoutes);
app.use("/users", userRoutes);

export default app;
