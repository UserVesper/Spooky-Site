import { Router } from "express";
import { User } from "../models/schemas";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user)
    return res.status(401).json({ error: "Usuário ou senha inválidos" });

  const validPassword = user.password === password;
  if (!validPassword)
    return res.status(401).json({ error: "Usuário ou senha inválidos" });

  if (user.role !== "admin")
    return res.status(403).json({ error: "Acesso negado" });

  res.json({ message: "Login bem-sucedido", role: user.role });
});

export default router;
