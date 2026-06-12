{
  "name": "pcs3643-grupo7-spooky",
  "version": "1.0.0",
  "description": "- **Tema/Domínio**: Turismo  \r - **Objetivo**: Desenvolver um GIS web para visualização e análise de dados georreferenciados baseado em lendas urbanas e mitos.  \r - **Funcionalidades principais**:  \r   - Visualização de POIs no mapa (mapas simples, de calor, coropléticos)  \r   - Filtros por áreas, tipos de POIs e atributos  \r   - Cadastro e edição de POIs  \r   - Geração de gráficos analíticos",
  "main": "index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "test": "jest --passWithNoTests"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/LabEngSoftware2025/pcs3643-grupo7-Spooky.git"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/LabEngSoftware2025/pcs3643-grupo7-Spooky/issues"
  },
  "homepage": "https://github.com/LabEngSoftware2025/pcs3643-grupo7-Spooky#readme",
  "dependencies": {
    "@turf/turf": "^7.3.1",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "mongoose": "^8.19.1"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.3",
    "@types/jest": "^30.0.0",
    "@types/node": "^24.8.1",
    "@types/supertest": "^6.0.3",
    "jest": "^30.2.0",
    "mongodb-memory-server": "^10.2.3",
    "supertest": "^7.1.4",
    "ts-jest": "^29.4.5",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.9.3"
  }
}