import { Request, Response } from "express";
import { login } from "../../../src/controllers/userController";
import { User } from "../../../src/models/schemas";

jest.mock("../../../src/models/schemas", () => ({
  User: {
    findOne: jest.fn(),
  },
}));

describe("UserController - Unit Tests (Jest)", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it("deve retornar 401 se o usuário não for encontrado", async () => {
    mockRequest = {
      body: { username: "nao_existe", password: "123" },
    };

    (User.findOne as jest.Mock).mockResolvedValue(null);

    await login(mockRequest as Request, mockResponse as Response);

    expect(User.findOne).toHaveBeenCalledWith({ username: "nao_existe" });
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Usuário ou senha inválidos",
    });
  });

  it("deve retornar 401 se a senha estiver incorreta", async () => {
    mockRequest = {
      body: { username: "admin", password: "senha_errada" },
    };

    (User.findOne as jest.Mock).mockResolvedValue({
      username: "admin",
      password: "senha_correta",
      role: "admin",
    });

    await login(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Usuário ou senha inválidos",
    });
  });

  it("deve retornar 403 se o usuário for válido mas não tiver permissão de admin", async () => {
    mockRequest = {
      body: { username: "usuario_comum", password: "123" },
    };

    (User.findOne as jest.Mock).mockResolvedValue({
      username: "usuario_comum",
      password: "123",
      role: "user",
    });

    await login(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Acesso negado",
    });
  });

  it("deve retornar 200 com mensagem e role quando login for bem-sucedido", async () => {
    mockRequest = {
      body: { username: "admin", password: "123" },
    };

    (User.findOne as jest.Mock).mockResolvedValue({
      username: "admin",
      password: "123",
      role: "admin",
    });

    await login(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Login bem-sucedido",
      role: "admin",
    });
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it("deve retornar 500 se o banco de dados lançar um erro inesperado", async () => {
    mockRequest = {
      body: { username: "admin", password: "123" },
    };

    (User.findOne as jest.Mock).mockRejectedValue(new Error("Falha na conexão com banco"));

    await login(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Falha na conexão com banco",
    });
  });
});
