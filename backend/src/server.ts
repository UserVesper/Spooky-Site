import app from "./app";
import { connectDB } from "./db/database";

async function start() {
  await connectDB();
  app.listen(5000, () => console.log("Servidor rodando na porta 5000"));
}

start();
