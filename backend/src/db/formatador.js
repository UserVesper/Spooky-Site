const fs = require("fs");
const path = require("path");

// --- Configuração ---
const CRAWLER_FILE = path.join(__dirname, "crawler_data.json");
const OCCULT_FILE = path.join(__dirname, "uk_occult_pois.geojson");
const OUTPUT_FILE = path.join(__dirname, "uk_occult_pois_universal.geojson");

// --- Normalização de Tipo (Inalterada) ---
const TYPE_NORMALIZATION_MAP = {
  Ghosts: "Fantasmas",
  "Animal Ghosts": "Fantasmas",
  Brides: "Fantasmas",
  "Headless Ghosts": "Fantasmas",
  "Royal Ghosts & Hauntings": "Fantasmas",
  "Pirate Ghosts and Treasure": "Fantasmas",
  "Shucks and Hell Hounds": "Fantasmas",
  "Hell Gates": "Fantasmas",
  "Highwaymen & Women": "Fantasmas",
  Alien: "UFOs/Criptozoologia",
  UFOs: "UFOs/Criptozoologia",
  "Big Cats": "UFOs/Criptozoologia",
  Cryptozoology: "UFOs/Criptozoologia",
  "Mermaids & Men": "Maldições/Lendas",
  Mermaids: "Maldições/Lendas",
  Curses: "Maldições/Lendas",
  "Dragons, Wyverns & Wyrms": "Maldições/Lendas",
  Giants: "Maldições/Lendas",
  "Fairies & the Little People": "Maldições/Lendas",
  "Horses & Riders": "Maldições/Lendas",
  "The Devil and All His Works": "Maldições/Lendas",
  "Spontaneous Human Combustion": "Maldições/Lendas",
  "Hidden Treasure": "Maldições/Lendas",
  Legends: "Maldições/Lendas",
  Music: "Música/Sons",
  Bells: "Música/Sons",
  Aviation: "Outros",
  Outro: "Outros",
  Outros: "Outros",
  "Environmental Hauntings": "Outros",
  Historical: "Outros",
  Uncategorised: "Outros",
};

function normalizeCityName(str) {
  if (!str || typeof str !== "string" || str.trim().length === 0) {
    return "Outra Localidade";
  }

  let area = str.trim();

  area = area.split("(")[0].split(" - ")[0].trim();

  area = area
    .replace(
      /\b(UK|GB|United Kingdom|Co\.|County|The|In|Near|North|South|East|West|New|Old)\b/gi,
      "",
    )
    .trim();

  area = area
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return "";
    })
    .join(" ");

  return area.trim() || "Outra Localidade";
}

function readJsonFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(
      `Erro ao ler ou parsear o arquivo ${filePath}:`,
      error.message,
    );
    process.exit(1);
  }
}

function transformCrawlerItemToFeature(item) {
  const originalCategory = item.category;
  const normalizedType = TYPE_NORMALIZATION_MAP[originalCategory] || "Outros";
  const rawArea = item.location_name || item.address || item.region;
  const normalizedArea = normalizeCityName(rawArea);
  const coordinates = [parseFloat(item.longitude), parseFloat(item.latitude)];

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates:
        isNaN(coordinates[0]) || isNaN(coordinates[1]) ? [0, 0] : coordinates,
    },
    properties: {
      name: item.title || "Ponto de Interesse Desconhecido",
      source: "crawler",
      "type:normalized": normalizedType,
      "area:normalized": normalizedArea, // <--- NOVO CAMPO

      "type:original_category": originalCategory,
      description: item.notes || item.description,
      link: item.link,
      date: item.datetime || item.date,
      location_name: item.location_name || item.location,
      region: item.region,
      crawler_type_field: item.type,
    },
  };
}

function normalizeOccultFeature(feature) {
  const properties = feature.properties || {};

  let normalizedFeature = {
    ...feature,
    properties: {
      ...properties,
      source: "occult_geojson",
    },
  };

  if (properties.shop === "esoteric" || properties.shop === "magic") {
    normalizedFeature.properties["type:normalized"] = "Loja";
  } else {
    normalizedFeature.properties["type:normalized"] = "Outros";
  }

  const rawCity = properties["addr:city"];
  const normalizedArea = normalizeCityName(rawCity);

  normalizedFeature.properties["area:normalized"] = normalizedArea;

  return normalizedFeature;
}

function runFormatter() {
  console.log(`Iniciando a formatação...`);
  const crawlerData = readJsonFile(CRAWLER_FILE);
  const occultData = readJsonFile(OCCULT_FILE);
  console.log(`✅ Arquivo ${CRAWLER_FILE} lido. (${crawlerData.length} itens)`);
  console.log(
    `✅ Arquivo ${OCCULT_FILE} lido. (${occultData.features.length} features)`,
  );
  console.log(
    "🔄 Transformando e normalizando dados do crawler (Tipo e Área)...",
  );
  console.log(
    "🔄 Normalizando tipos e áreas dos dados occult (esoteric/magic -> Loja)...",
  );
  const normalizedOccultFeatures = occultData.features.map(
    normalizeOccultFeature,
  );
  const combinedFeatures = [...normalizedOccultFeatures, ...newFeatures];
  const combinedGeoJSON = {
    type: "FeatureCollection",
    features: combinedFeatures,
  };

  try {
    const jsonOutput = JSON.stringify(combinedGeoJSON, null, 2);
    fs.writeFileSync(OUTPUT_FILE, jsonOutput, "utf8");
    console.log(`\n🎉 Sucesso! Arquivo combinado criado em ${OUTPUT_FILE}`);
    console.log(`Total de Features: ${combinedFeatures.length}`);
  } catch (error) {
    console.error(`Erro ao escrever o arquivo ${OUTPUT_FILE}:`, error.message);
    process.exit(1);
  }
}

runFormatter();
