import { Request, Response } from "express";
import {
  getPois,
  createPoi,
  updatePoi,
  deletePoi,
} from "../../../src/controllers/poiController";
import { Poi } from "../../../src/models/schemas";

jest.mock("../../../src/models/schemas", () => ({
  Poi: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

describe("PoiController - Unit Tests (Jest)", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("getPois", () => {
    it("deve retornar lista completa de POIs quando page=0 e limit=0", async () => {
      const mockPois = [{ name: "Castelo Assombrado" }];
      mockRequest = {
        query: {},
      };

      (Poi.find as jest.Mock).mockResolvedValue(mockPois);

      await getPois(mockRequest as Request, mockResponse as Response);

      expect(Poi.find).toHaveBeenCalledWith({});
      expect(mockResponse.json).toHaveBeenCalledWith(mockPois);
    });

    it("deve retornar dados paginados quando page e limit forem fornecidos", async () => {
      const mockPois = [{ name: "Mansão 1" }, { name: "Mansão 2" }];
      mockRequest = {
        query: { page: "2", limit: "10" },
      };

      const mockQueryChain = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockPois),
      };

      (Poi.find as jest.Mock).mockReturnValue(mockQueryChain);
      (Poi.countDocuments as jest.Mock).mockResolvedValue(25);

      await getPois(mockRequest as Request, mockResponse as Response);

      expect(Poi.find).toHaveBeenCalledWith({});
      expect(mockQueryChain.skip).toHaveBeenCalledWith(10); // (page - 1) * limit = (2 - 1) * 10
      expect(mockQueryChain.limit).toHaveBeenCalledWith(10);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockPois,
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3, // Math.ceil(25 / 10)
        },
      });
    });

    it("deve filtrar por tipo quando tipo for diferente de 'Todos'", async () => {
      mockRequest = {
        query: { tipo: "Fantasmas" },
      };

      (Poi.find as jest.Mock).mockResolvedValue([]);

      await getPois(mockRequest as Request, mockResponse as Response);

      expect(Poi.find).toHaveBeenCalledWith({
        "properties.type:normalized": "Fantasmas",
      });
    });

    it("não deve incluir filtro de tipo quando tipo for 'Todos'", async () => {
      mockRequest = {
        query: { tipo: "Todos" },
      };

      (Poi.find as jest.Mock).mockResolvedValue([]);

      await getPois(mockRequest as Request, mockResponse as Response);

      expect(Poi.find).toHaveBeenCalledWith({});
    });

    it("deve filtrar por nome com regex case-insensitive", async () => {
      mockRequest = {
        query: { nome: "cemitério" },
      };

      (Poi.find as jest.Mock).mockResolvedValue([]);

      await getPois(mockRequest as Request, mockResponse as Response);

      expect(Poi.find).toHaveBeenCalledWith({
        name: { $regex: "cemitério", $options: "i" },
      });
    });

    it("deve retornar status 500 se Poi.find falhar", async () => {
      mockRequest = { query: {} };
      (Poi.find as jest.Mock).mockRejectedValue(new Error("Erro no banco"));

      await getPois(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Erro no banco",
      });
    });
  });

  describe("createPoi", () => {
    it("deve criar um POI com sucesso e retornar status 201", async () => {
      const poiData = {
        name: "Casa Assombrada",
        geometry: { type: "Point", coordinates: [10, 20] },
      };
      const createdPoi = { _id: "123", ...poiData };

      mockRequest = { body: poiData };
      (Poi.create as jest.Mock).mockResolvedValue(createdPoi);

      await createPoi(mockRequest as Request, mockResponse as Response);

      expect(Poi.create).toHaveBeenCalledWith(poiData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdPoi);
    });

    it("deve retornar 500 caso a criação falhe", async () => {
      mockRequest = { body: {} };
      (Poi.create as jest.Mock).mockRejectedValue(new Error("Erro de validação"));

      await createPoi(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Erro de validação",
      });
    });
  });

  describe("updatePoi", () => {
    it("deve mesclar properties existentes e atualizar POI com sucesso", async () => {
      mockRequest = {
        params: { id: "poi_1" },
        body: {
          properties: { description: "Nova descrição" },
        },
      };

      (Poi.findById as jest.Mock).mockResolvedValue({
        properties: { origin: "1800" },
      });

      const updatedPoi = {
        _id: "poi_1",
        name: "POI 1",
        properties: { origin: "1800", description: "Nova descrição" },
      };
      (Poi.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedPoi);

      await updatePoi(mockRequest as Request, mockResponse as Response);

      expect(Poi.findById).toHaveBeenCalledWith("poi_1");
      expect(Poi.findByIdAndUpdate).toHaveBeenCalledWith(
        "poi_1",
        {
          properties: { origin: "1800", description: "Nova descrição" },
        },
        { new: true }
      );
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPoi);
    });

    it("deve retornar 404 se POI a ser atualizado não for encontrado", async () => {
      mockRequest = {
        params: { id: "poi_inexistente" },
        body: { name: "Novo Nome" },
      };

      (Poi.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await updatePoi(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "POI não encontrado",
      });
    });

    it("deve retornar 500 se ocorrer um erro na atualização", async () => {
      mockRequest = {
        params: { id: "poi_1" },
        body: {},
      };

      (Poi.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error("Erro ao atualizar")
      );

      await updatePoi(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Erro ao atualizar",
      });
    });
  });

  describe("deletePoi", () => {
    it("deve deletar POI com sucesso e retornar confirmação", async () => {
      mockRequest = {
        params: { id: "poi_1" },
      };

      (Poi.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: "poi_1" });

      await deletePoi(mockRequest as Request, mockResponse as Response);

      expect(Poi.findByIdAndDelete).toHaveBeenCalledWith("poi_1");
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "POI deletado" });
    });

    it("deve retornar 404 se o POI a ser deletado não for encontrado", async () => {
      mockRequest = {
        params: { id: "poi_inexistente" },
      };

      (Poi.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await deletePoi(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "POI não encontrado",
      });
    });

    it("deve retornar 500 se ocorrer um erro ao deletar", async () => {
      mockRequest = {
        params: { id: "poi_1" },
      };

      (Poi.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error("Erro no banco")
      );

      await deletePoi(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Erro no banco",
      });
    });
  });
});
