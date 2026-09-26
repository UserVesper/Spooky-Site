const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn, execSync } = require('child_process');

const isDbOnly = process.argv.includes('--db-only');
const backendDir = path.resolve(__dirname, '..');
const dbDir = path.join(backendDir, '.mongo-data');
const defaultPort = 27017;

function findMongod() {
  // 1. Tenta encontrar mongod no PATH
  try {
    const cmd = process.platform === 'win32' ? 'where mongod' : 'which mongod';
    const out = execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf8' }).trim();
    if (out) {
      const first = out.split(/\r?\n/)[0].trim();
      if (fs.existsSync(first)) return first;
    }
  } catch (_) {}

  // 2. Busca nos diretórios comuns de instalação no Windows
  if (process.platform === 'win32') {
    const basePaths = [
      'C:\\Program Files\\MongoDB\\Server',
      'C:\\Program Files (x86)\\MongoDB\\Server',
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'MongoDB', 'Server')
    ];

    for (const base of basePaths) {
      if (fs.existsSync(base)) {
        const versions = fs.readdirSync(base).sort().reverse();
        for (const ver of versions) {
          const candidate = path.join(base, ver, 'bin', 'mongod.exe');
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }
      }
    }
  }

  return 'mongod';
}

function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function waitForPort(port, maxRetries = 40, delayMs = 300) {
  for (let i = 0; i < maxRetries; i++) {
    const inUse = await checkPort(port);
    if (inUse) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function main() {
  let mongodProcess = null;
  let backendProcess = null;
  let didSpawnMongod = false;

  const cleanup = () => {
    if (backendProcess && !backendProcess.killed) {
      try {
        backendProcess.kill();
      } catch (_) {}
    }

    if (didSpawnMongod && mongodProcess && !mongodProcess.killed) {
      console.log('\n[MongoDB] Encerrando servidor do banco de dados...');
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /pid ${mongodProcess.pid} /t /f`, { stdio: 'ignore' });
        } else {
          mongodProcess.kill('SIGINT');
        }
      } catch (_) {}
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
  process.on('exit', cleanup);

  // 1. Verifica se o MongoDB já está rodando
  const isAlreadyRunning = await checkPort(defaultPort);

  if (isAlreadyRunning) {
    console.log(`[MongoDB] Instância do MongoDB detectada na porta ${defaultPort}.`);
  } else {
    // Garante que o diretório de dados exista
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const mongodPath = findMongod();
    console.log(`[MongoDB] Iniciando MongoDB local na porta ${defaultPort}...`);
    console.log(`[MongoDB] Binário: ${mongodPath}`);
    console.log(`[MongoDB] Diretório de dados: ${dbDir}`);

    mongodProcess = spawn(mongodPath, ['--dbpath', dbDir, '--port', String(defaultPort)], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    didSpawnMongod = true;

    mongodProcess.on('error', (err) => {
      console.error('❌ [MongoDB] Falha ao iniciar processo do mongod:', err.message);
      console.error('   Certifique-se de que o MongoDB Community Server está instalado.');
      process.exit(1);
    });

    mongodProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      if (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('fatal')) {
        console.error(`[MongoDB Error] ${msg.trim()}`);
      }
    });

    const isReady = await waitForPort(defaultPort);
    if (!isReady) {
      console.error(`❌ [MongoDB] Tempo limite esgotado aguardando MongoDB na porta ${defaultPort}.`);
      cleanup();
      process.exit(1);
    }

    console.log(`✅ [MongoDB] MongoDB pronto para conexões na porta ${defaultPort}!`);
  }

  if (isDbOnly) {
    console.log('[MongoDB] Rodando em modo --db-only. Pressione Ctrl+C para encerrar.');
    return;
  }

  // 2. Inicia o servidor backend
  console.log('[Backend] Iniciando servidor Node.js/Express...');
  backendProcess = spawn('npx', ['ts-node-dev', '--respawn', '--transpile-only', 'src/server.ts'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true
  });

  backendProcess.on('exit', (code) => {
    cleanup();
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('Erro inesperado no inicializador:', err);
  process.exit(1);
});
