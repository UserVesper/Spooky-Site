import { Request, Response } from "express";
import { User } from "../models/schemas";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    const validPassword = user.password === password;
    if (!validPassword) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    return res.json({ message: "Login bem-sucedido", role: user.role });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Erro interno no login",
    });
  }
};
