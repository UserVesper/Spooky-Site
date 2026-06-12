import request from "supertest";
import app from "../../src/app";
import { Poi } from "../../src/models/schemas";
import { connectTestDB, disconnectTestDB, clearDB } from "../setup";

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearDB());

describe("POI CRUD", () => {
  it("cria um POI", async () => {
    const res = await request(app)
      .post("/pois")
      .send({
        name: "Casa Velha",
        tipo: "Construção",
        geometry: { type: "Point", coordinates: [0.0, 0.0] },
        properties: { old_name: "Antiga Casa" },
      })
      .expect(200);

    expect(res.body.name).toBe("Casa Velha");
  });

  it("lista POIs", async () => {
    await Poi.create({
      name: "Cemitério",
      tipo: "Construção",
      geometry: { type: "Point", coordinates: [0.0, 0.0] },
      properties: {},
    });

    const res = await request(app).get("/pois").expect(200);
    expect(res.body.length).toBe(1);
  });

  it("atualiza a descrição do POI", async () => {
    const poi = await Poi.create({
      name: "Casa Velha",
      tipo: "Construção",
      geometry: { type: "Point", coordinates: [0.0, 0.0] },
      properties: { old_name: "Casa Antiga" },
    });

    const res = await request(app)
      .put(`/pois/${poi._id}`)
      .send({ properties: { description: "Muito assombrada" } })
      .expect(200);

    expect(res.body.properties.description).toBe("Muito assombrada");
  });

  it("deleta um POI", async () => {
    const poi = await Poi.create({
      name: "Mansão Abandonada",
      tipo: "Construção",
      geometry: { type: "Point", coordinates: [0.0, 0.0] },
      properties: {},
    });

    await request(app).delete(`/pois/${poi._id}`).expect(200);
    const allPois = await Poi.find();
    expect(allPois.length).toBe(0);
  });
});
