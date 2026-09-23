/**
 * Build da Vercel: copia para public/ só os arquivos que o jogo e o painel usam
 * (mesma lista que o server.js serve localmente, em api/_lib/core.js).
 * Assim server.js, supabase/, testes/, .env etc. nunca ficam públicos.
 */
const fs = require('fs');
const path = require('path');
const { ROOT_DIR, PUBLIC_FILES, PUBLIC_DIRS } = require('../api/_lib/core');

const OUT_DIR = path.join(ROOT_DIR, 'public');

fs.rmSync(OUT_DIR, { recursive: true, force: true });

for (const file of PUBLIC_FILES) {
    const target = path.join(OUT_DIR, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(ROOT_DIR, file), target);
}

for (const dir of PUBLIC_DIRS) {
    // Arquivos ocultos (começando com ".") ficam de fora
    fs.cpSync(path.join(ROOT_DIR, dir), path.join(OUT_DIR, dir), {
        recursive: true,
        filter: src => !path.basename(src).startsWith('.')
    });
}

console.log(`public/ gerada com ${PUBLIC_FILES.length} arquivos e as pastas ${PUBLIC_DIRS.join(', ')}.`);
