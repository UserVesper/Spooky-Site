# 📍 SPOOKY - GIS de Lendas Urbanas e Mitos

## 📖 Descrição do Sistema

- **Tema/Domínio**: Turismo & Folclore
- **Objetivo**: Desenvolver um GIS web interativo para visualização e análise espacial de dados georreferenciados baseados em lendas urbanas, mitos e áreas de avistamentos.
- **Funcionalidades principais**:
  - Visualização de Pontos de Interesse (POIs) e Áreas Limítrofes no mapa interativo
  - Filtragem por categoria/tipo de lenda e busca textual por nome
  - Agrupamento de marcadores (Clustering) para alta performance
  - Cadastro, edição e remoção de novos pontos (CRUD de POIs)
  - Mapas Coropléticos e Áreas Sanitizadas servidas diretamente via Backend/GeoJSON

---

## 👥 Contribuintes

- **Rodrigo Galvez**: [GitHub](https://github.com/UserVesper)
- **Gabriel Chaves**: [GitHub](https://github.com/gabrielc02)
- **Ruan Machado**

---

## 🎨 Protótipo da Interface

- **Figma**: [Protótipo Spooky](https://www.figma.com/proto/NC2dMRqfuHHT8kUk7fj8GD/Spooky-Eng-Soft?node-id=1-6&t=6OfcjZrNVv6OHTPu-0&scaling=contain&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A6)

---

## ⚙️ Pré-requisitos

- **Node.js**: >= v18.x
- **npm**: >= v9.x
- **MongoDB**: Community Server >= 6.0 (rodando na porta padrão `27017`)
- **Git**

### 📦 Instalação do MongoDB no Windows (via Winget)

Caso ainda não possua o MongoDB instalado no Windows, execute o seguinte comando no **PowerShell como Administrador**:

```powershell
winget install --id MongoDB.Server -e --accept-source-agreements --accept-package-agreements
```

> **Nota:** Após a instalação, certifique-se de que o serviço do MongoDB esteja rodando. No Windows, ele inicia automaticamente como um serviço. Para verificar ou iniciar manualmente:
> ```powershell
> net start MongoDB
> ```

---

## 🛠️ Passo a Passo para Configurar e Rodar o Projeto

### 1. Clonar o Repositório

```bash
git clone https://github.com/UserVesper/Spooky-Site.git
cd Spooky
```

### 2. Configurar as Variáveis de Ambiente (`.env`)

Crie um arquivo chamado `.env` dentro da pasta `backend/` com as seguintes configurações:

**Caminho:** `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/spooky
NODE_ENV=development
```

### 3. Instalar as Dependências

#### Backend:
```bash
cd backend
npm install
cd ..
```

#### Frontend:
```bash
cd frontend
npm install
cd ..
```

### 4. Popular o Banco de Dados (Seed)

Com o MongoDB em execução, rode o script de seed para cadastrar os pontos e lendas iniciais:

```bash
cd backend
npx ts-node src/db/seed.ts
cd ..
```

---

## 🚀 Executando o Projeto

Para o funcionamento completo da aplicação, é necessário iniciar o **Backend** e o **Frontend** em terminais separados.

### Terminal 1: Iniciar o Backend (Porta 5000)

```bash
cd backend
npm run dev
```
*O servidor estará ativo em: `http://localhost:5000`*

### Terminal 2: Iniciar o Frontend (Porta 3000)

```bash
cd frontend
npm start
```
*A aplicação web abrirá em: `http://localhost:3000`*

---

## 💡 Dicas de Testes Rápidos da API (Endpoints REST)

- **Listar todos os POIs**:
  ```bash
  curl http://localhost:5000/pois
  ```

- **Listar Áreas (GeoJSON)**:
  ```bash
  curl http://localhost:5000/areas
  ```

- **Criar novo POI**:
  ```bash
  curl -X POST http://localhost:5000/pois \
    -H "Content-Type: application/json" \
    -d '{"name":"Fantasma da Ópera","tipo":"Lenda","geometry":{"type":"Point","coordinates":[-46.6333,-23.5505]},"properties":{"descricao":"Aparições no teatro"}}'
  ```

- **Deletar POI por ID**:
  ```bash
  curl -X DELETE http://localhost:5000/pois/<ID_DO_POI>
  ```

