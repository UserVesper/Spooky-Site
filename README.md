# 📍 SPOOKY

## 📖 Descrição do Sistema

- **Tema/Domínio**: Turismo
- **Objetivo**: Desenvolver um GIS web para visualização e análise de dados georreferenciados baseado em lendas urbanas e mitos.
- **Funcionalidades principais**:
  - Visualização de POIs no mapa (mapas simples, de calor, coropléticos)

## Contribuição

- **Rodrigo Galvez**: https://github.com/UserVesper
- **Gabriel Chaves**: https://github.com/gabrielc02
- **Ruan Machado**

## ⚙️ Requisitos de Instalação (Local)

- **Node.js**: >= 18
- **npm**: >= 9 ou **yarn** >= 3
- **MongoDB**: >= 6 (local ou Atlas)
- **Git**: para clonar o repositório

---

## 🎨 Protótipo da Interface

- **Figma**: https://www.figma.com/proto/NC2dMRqfuHHT8kUk7fj8GD/Spooky-Eng-Soft?node-id=1-6&t=6OfcjZrNVv6OHTPu-0&scaling=contain&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A6

---

## 🛠️ Inicializando o Projeto (Local)

1. Clone o repositório:

```bash
git clone <URL_DO_REPO>
cd pcs3643-grupo7-Spooky
```

2. Instale as dependências do backend:

```bash
cd backend
npm install
cd ..
```

3. Instale as dependências do frontend:

```bash
cd frontend
npm install
cd ..
```

4. Configure o arquivo `.env` na pasta `backend/` (crie se não existir):

```env
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/spooky
PORT=3001
```

5. Certifique-se de que o MongoDB está rodando localmente (ex.: `mongod` ou serviço do sistema).

6. Para popular o banco com dados iniciais, va ate a raiz do projeto e rode o comando:

```bash
npx ts-node backend/src/db/seed.ts
```

---

7. Em um terminal, inicie o backend:

```bash
cd backend
npm run dev
```

8. Acesse a aplicação em http://localhost:5000/pois

````

9. Em outro terminal, inicie o frontend:
```bash
cd frontend
npm start
````

OBS: O projeto acabou ficando um pouco pesado, entao naturalmente o front pode levar alguns minutos para subir. Seria um ponto interessante pra modificar futuramente, rever como otimizar o projeto.

## 💡 Dicas de Testes Rápidos (Postman / curl)

- Listar POIs:

```bash
curl http://localhost:5000/pois
```

- Criar POI:

```bash
curl -X POST http://localhost:5000/pois \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","tipo":"demo","geometry":{},"properties":{}}'
```

- Atualizar POI:

```bash
curl -X PUT http://localhost:5000/pois/<ID_DO_POI> \
  -H "Content-Type: application/json" \
  -d '{"name":"Atualizado"}'
```

- Deletar POI:

```bash
curl -X DELETE http://localhost:5000/pois/<ID_DO_POI>
```
