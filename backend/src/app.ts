import express from "express";
import cors from "cors";
import compression from "compression";

import poiRoutes from "./routes/pois";
import userRoutes from "./routes/users";
import geoRoutes from "./routes/geo";

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

app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

app.use("/pois", poiRoutes);
app.use("/users", userRoutes);
app.use("/geo", geoRoutes);

export default app;
