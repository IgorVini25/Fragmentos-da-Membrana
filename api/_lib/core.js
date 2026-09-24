/**
 * Lógica do servidor compartilhada entre o server.js (rodando local) e as funções da Vercel (pasta api/).
 * Arquivos em api/ que começam com "_" não viram rotas na Vercel.
 *
 * Configuração (variáveis de ambiente ou .env na raiz do projeto):
 *   HINT_AVAILABLE_DATE, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DAILY_CAMPAIGNS } = require('../../episodes.js');

const ROOT_DIR = path.join(__dirname, '..', '..');
const TIME_ZONE = 'America/Sao_Paulo'; // "hoje" do Diário é o dia no Brasil, não o do servidor (a Vercel roda em UTC)

// ==========================================
// CONFIGURAÇÃO
// Variáveis do sistema (ex.: painel da Vercel) valem; o .env (só local) tem prioridade.
// O .env é lido a cada chamada: editar e recarregar a página já basta.
// ==========================================
const ENV_KEYS = ['HINT_AVAILABLE_DATE', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_PASSWORD'];

function readEnv() {
    const result = {};
    ENV_KEYS.forEach(key => {
        if (process.env[key]) result[key] = process.env[key];
    });

    const envPath = path.join(ROOT_DIR, '.env');
    if (!fs.existsSync(envPath)) return result;

    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;

        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if (!value) continue; // chave vazia no .env não apaga a do sistema
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        result[key] = value;
    }
    return result;
}

// ==========================================
// EPISÓDIOS (mesma base do jogo, episodes.js)
// ==========================================
const CAMPAIGN_IDS = DAILY_CAMPAIGNS.map(c => c.id);
const SCENE_ISSUES = ['abertura', 'intervalo', 'encerramento'];
const EPISODES_BY_CAMPAIGN = {};
const EPISODE_BY_YOUTUBE_ID = {};
DAILY_CAMPAIGNS.forEach(c => {
    EPISODES_BY_CAMPAIGN[c.id] = new Set(c.db.map(ep => ep.episodeNum));
    c.db.forEach(ep => {
        EPISODE_BY_YOUTUBE_ID[ep.youtubeId] = { ...ep, campaignId: c.id };
    });
});

function findEpisodeByYoutubeId(youtubeId) {
    return typeof youtubeId === 'string' && Object.prototype.hasOwnProperty.call(EPISODE_BY_YOUTUBE_ID, youtubeId)
        ? EPISODE_BY_YOUTUBE_ID[youtubeId]
        : null;
}

// ==========================================
// SUPABASE (REST com a chave secreta; nunca exposta ao navegador)
// ==========================================
let warnedSupabaseMissing = false;
let warnedPublicKey = false;

function getSupabaseEnv(env = readEnv()) {
    const url = (env.SUPABASE_URL || '').replace(/\/+$/, '');
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        if (!warnedSupabaseMissing) {
            console.log('[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados; estatísticas e /admin desativados.');
            warnedSupabaseMissing = true;
        }
        return null;
    }
    warnedSupabaseMissing = false;
    if (key.startsWith('sb_publishable_') && !warnedPublicKey) {
        console.error('[supabase] SUPABASE_SERVICE_ROLE_KEY está com a chave PÚBLICA (sb_publishable_...). Use a chave secreta (sb_secret_...) de Project Settings > API Keys.');
        warnedPublicKey = true;
    }
    return { url, key };
}

// Chamada REST ao Supabase. Nunca lança: retorna { ok, status, data }.
async function supabaseRequest(pathAndQuery, { method = 'GET', body } = {}) {
    const conf = getSupabaseEnv();
    if (!conf) return { ok: false, status: 503, data: null };
    try {
        const headers = { 'apikey': conf.key, 'Content-Type': 'application/json' };
        // Chave antiga "service_role" é um JWT (começa com eyJ) e vai também no Authorization.
        // A chave nova "Secret key" (sb_secret_...) não é JWT e vai só no apikey.
        if (conf.key.startsWith('eyJ')) headers['Authorization'] = `Bearer ${conf.key}`;
        const response = await fetch(`${conf.url}/rest/v1/${pathAndQuery}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(5000)
        });
        const text = await response.text();
        if (!response.ok) {
            console.error(`[supabase] ${method} ${pathAndQuery.split('?')[0]} respondeu ${response.status}: ${text}`);
        }
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { /* resposta sem JSON */ }
        return { ok: response.ok, status: response.status, data };
    } catch (e) {
        console.error(`[supabase] Falha ao falar com o Supabase (${pathAndQuery.split('?')[0]}):`, e.message);
        return { ok: false, status: 502, data: null };
    }
}

// ==========================================
// DATAS DO MODO DIÁRIO
// ==========================================
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

// AAAA-MM-DD no fuso do Brasil
function todayStr(date = new Date()) {
    return dateFormatter.format(date);
}

function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

// AAAA-MM-DD de um dia que existe (recusa 2026-02-31, por exemplo)
function isValidDateStr(value) {
    return typeof value === 'string' && DATE_RE.test(value) && !isNaN(Date.parse(value))
        && new Date(value).toISOString().slice(0, 10) === value;
}

// Data inicial do Diário (definida no /admin). Cache de 30s para não consultar o banco a cada página.
const dailyStartCache = { value: null, expires: 0 };
async function getDailyStartDate() {
    if (Date.now() < dailyStartCache.expires) return dailyStartCache.value;
    const r = await supabaseRequest('config?chave=eq.data_inicio_diario&select=valor');
    if (r.ok) {
        const row = Array.isArray(r.data) ? r.data[0] : null;
        dailyStartCache.value = row && isValidDateStr(row.valor) ? row.valor : null;
    }
    // Se o banco falhar, mantém o último valor conhecido e tenta de novo depois
    dailyStartCache.expires = Date.now() + 30 * 1000;
    return dailyStartCache.value;
}

// Dia que pode ser jogado: da data inicial até hoje (+1 dia de folga para jogadores em fusos à frente)
async function isDailyDateAllowed(dateStr) {
    if (!isValidDateStr(dateStr)) return false;
    if (dateStr > addDays(todayStr(), 1)) return false;
    const start = await getDailyStartDate();
    return !start || dateStr >= start;
}

// ==========================================
// HTTP
// ==========================================
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
};

// Política de conteúdo: só scripts do próprio site e do player do YouTube
const CSP_GAME = [
    "default-src 'self'",
    "script-src 'self' https://www.youtube.com https://s.ytimg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://i.ytimg.com",
    "frame-src https://www.youtube.com",
    "connect-src 'self' ws: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
].join('; ');

// O painel não precisa de estilos inline nem de WebSocket
const CSP_ADMIN = CSP_GAME
    .replace("style-src 'self' 'unsafe-inline'", "style-src 'self'")
    .replace("connect-src 'self' ws: wss:", "connect-src 'self'");

function applySecurityHeaders(res) {
    Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
}

function sendJson(res, status, data) {
    applySecurityHeaders(res);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
}

function sendEmpty(res, status) {
    applySecurityHeaders(res);
    res.writeHead(status, { 'Cache-Control': 'no-store' });
    res.end();
}

function requireMethod(req, res, method) {
    if (req.method === method) return true;
    res.setHeader('Allow', method);
    sendJson(res, 405, { erro: 'Método não permitido.' });
    return false;
}

// Corpo JSON da requisição. Na Vercel já vem em req.body; no servidor local é lido do stream.
// Resolve null se for inválido ou grande demais.
function readJsonBody(req, limit = 64 * 1024) {
    let preParsed;
    try {
        preParsed = req.body;
    } catch (e) {
        return Promise.resolve(null); // JSON inválido (a Vercel lança ao acessar req.body)
    }
    if (preParsed !== undefined) {
        if (typeof preParsed === 'string') {
            try { return Promise.resolve(JSON.parse(preParsed)); } catch (e) { return Promise.resolve(null); }
        }
        return Promise.resolve(preParsed && typeof preParsed === 'object' && !Buffer.isBuffer(preParsed) ? preParsed : null);
    }

    return new Promise(resolve => {
        let raw = '';
        let done = false;
        const finish = value => { if (!done) { done = true; resolve(value); } };
        const onData = chunk => {
            raw += chunk;
            if (raw.length > limit) {
                // Para de guardar (o resto é descartado) e deixa o handler responder 400
                raw = '';
                req.removeListener('data', onData);
                req.resume();
                finish(null);
            }
        };
        req.on('data', onData);
        req.on('end', () => {
            try { finish(JSON.parse(raw)); } catch (e) { finish(null); }
        });
        req.on('error', () => finish(null));
        req.on('close', () => finish(null));
    });
}

// IP do cliente. Na Vercel vem no x-real-ip (a própria Vercel preenche; não dá para forjar).
// Local, cabeçalhos podem ser forjados, então usa o socket.
function getClientIp(req) {
    if (process.env.VERCEL) {
        return req.headers['x-real-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconhecido';
    }
    return req.socket.remoteAddress || 'desconhecido';
}

// ==========================================
// /config.js (lido pelo jogo antes do index.js)
// ==========================================
async function handleConfig(req, res) {
    if (!requireMethod(req, res, 'GET')) return;
    const env = readEnv();
    const config = {
        hintAvailableDate: env.HINT_AVAILABLE_DATE || 'em breve',
        dailyStartDate: await getDailyStartDate(),
        today: todayStr()
    };
    applySecurityHeaders(res);
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(`window.APP_CONFIG = ${JSON.stringify(config)};`);
}

// ==========================================
// ESTATÍSTICAS GERAIS
// O jogo manda o resultado da partida e o servidor soma nos contadores acumulados
// (função registrar_partida). Nada é guardado por jogador.
// ==========================================

// Valida o corpo enviado pelo jogo e monta a partida no formato da função SQL. Retorna null se for inválido.
function buildStatsPayload(body) {
    if (!body || typeof body !== 'object') return null;
    const { mode, dailyDate, rounds, maxStreak } = body;

    if (!['daily', 'classic', 'infinite'].includes(mode)) return null;
    if (mode === 'daily' && !isValidDateStr(dailyDate)) return null;
    if (!Array.isArray(rounds) || rounds.length === 0 || rounds.length > 500) return null;
    if (mode === 'daily' && rounds.length !== DAILY_CAMPAIGNS.length) return null;
    if (mode === 'classic' && rounds.length !== 10) return null;

    const cenas = [];
    for (const r of rounds) {
        if (!r || typeof r !== 'object') return null;
        if (!CAMPAIGN_IDS.includes(r.campaign)) return null;
        // No Diário, a ordem das temporadas é fixa (uma cena de cada)
        if (mode === 'daily' && r.campaign !== CAMPAIGN_IDS[cenas.length]) return null;
        // O episódio precisa existir naquela temporada
        if (typeof r.episode !== 'string' || !EPISODES_BY_CAMPAIGN[r.campaign].has(r.episode)) return null;
        const time = Number(r.time);
        if (!Number.isFinite(time) || time < 0 || time > 60) return null;
        cenas.push({
            cena: cenas.length + 1,
            temporada: r.campaign,
            episodio: r.episode,
            acertou: r.correct === true,
            tempo: Math.round(time * 10) / 10
        });
    }

    const acertos = cenas.filter(c => c.acertou).length;
    return {
        modo: mode,
        dia: mode === 'daily' ? dailyDate : null,
        acertos,
        total: cenas.length,
        maior_sequencia: Number.isInteger(maxStreak) ? Math.min(Math.max(maxStreak, 0), acertos) : 0,
        soma_tempo: Math.round(cenas.reduce((sum, c) => sum + c.tempo, 0) * 10) / 10,
        cenas
    };
}

async function handleStats(req, res) {
    if (!requireMethod(req, res, 'POST')) return;
    const partida = buildStatsPayload(await readJsonBody(req));
    if (!partida || (partida.modo === 'daily' && !(await isDailyDateAllowed(partida.dia)))) {
        return sendEmpty(res, 400);
    }
    const r = await supabaseRequest('rpc/registrar_partida', { method: 'POST', body: { partida } });
    sendEmpty(res, r.ok ? 204 : (r.status === 503 ? 503 : 502));
}

// Conta um clique em "Iniciar Investigação" que passou nas checagens do jogo (independe de a
// partida ser concluída ou abandonada). Usado só pelo botão "Estatísticas" do /admin.
const SOLO_MODES = ['daily', 'classic', 'infinite'];
async function handleGameStart(req, res) {
    if (!requireMethod(req, res, 'POST')) return;
    const body = await readJsonBody(req);
    const mode = body && body.mode;
    if (!SOLO_MODES.includes(mode)) return sendEmpty(res, 400);
    const r = await supabaseRequest('rpc/registrar_inicio', { method: 'POST', body: { p_modo: mode } });
    sendEmpty(res, r.ok ? 204 : (r.status === 503 ? 503 : 502));
}

// Ajustes públicos de um dia do Diário (usados pelo jogo): { temporada: { tentativa, contexto } }
async function handleDaily(req, res, dateStr) {
    if (!requireMethod(req, res, 'GET')) return;
    if (!(await isDailyDateAllowed(dateStr))) {
        return sendJson(res, 403, { erro: 'Dia indisponível.' });
    }
    const r = await supabaseRequest(`cenas_diario_ajustes?dia=eq.${dateStr}&select=temporada,tentativa,contexto`);
    const ajustes = {};
    if (r.ok && Array.isArray(r.data)) {
        r.data.forEach(row => {
            if (CAMPAIGN_IDS.includes(row.temporada)) {
                ajustes[row.temporada] = { tentativa: row.tentativa, contexto: row.contexto || '' };
            }
        });
    }
    // Sem banco, o jogo segue com o sorteio normal
    sendJson(res, 200, ajustes);
}

// Média geral de um dia do Diário (agregada, nenhum dado de jogador), para o jogo mostrar ao lado
// do resultado do próprio jogador. GET /api/global-stats?day=AAAA-MM-DD
// Só o Diário: é o único modo em que todos jogam as mesmas cenas, então a comparação é justa.
// Lê a query direto de req.url (em vez de req.query) para funcionar igual no server.js local e na Vercel.
async function handleGlobalStats(req, res) {
    if (!requireMethod(req, res, 'GET')) return;
    const dia = new URL(req.url, 'http://x').searchParams.get('day') || '';
    if (!(await isDailyDateAllowed(dia))) return sendJson(res, 403, { erro: 'Dia indisponível.' });
    const r = await supabaseRequest(`stats_diario?dia=eq.${dia}&select=jogadores,media_acertos`);
    if (!r.ok) return supabaseError(res, r);
    const row = Array.isArray(r.data) ? r.data[0] : null;
    sendJson(res, 200, {
        jogadores: row ? Number(row.jogadores) : 0,
        mediaAcertos: row ? Number(row.media_acertos) : 0
    });
}

// ==========================================
// PAINEL /admin
// Login com a senha fixa ADMIN_PASSWORD -> o servidor devolve um token de sessão assinado
// (HMAC) que vale 8 horas. A senha não fica guardada no navegador.
// Tentativas erradas ficam registradas no Supabase (funciona com várias instâncias na Vercel).
// ==========================================
const ADMIN_MAX_FAILURES = 10;          // por IP, a cada 15 minutos (a janela fica no SQL)
const SESSION_MS = 8 * 60 * 60 * 1000;

// Configuração do admin ou mensagem de erro
function getAdminConfig() {
    const env = readEnv();
    if (!env.ADMIN_PASSWORD) return { erro: 'ADMIN_PASSWORD não configurada no servidor.' };
    if (!getSupabaseEnv(env)) return { erro: 'Supabase não configurado no servidor (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' };
    return { password: env.ADMIN_PASSWORD, secret: env.SUPABASE_SERVICE_ROLE_KEY };
}

// Chave das sessões: depende da senha E da chave secreta do Supabase. Trocar qualquer uma
// derruba todas as sessões, e um token vazado não permite adivinhar a senha offline.
function sessionKey(conf) {
    return crypto.createHmac('sha256', conf.secret).update('admin-session|' + conf.password).digest();
}

function signSession(conf, exp) {
    return crypto.createHmac('sha256', sessionKey(conf)).update(String(exp)).digest('hex');
}

function createSessionToken(conf) {
    const exp = Date.now() + SESSION_MS;
    return { token: `${exp}.${signSession(conf, exp)}`, exp };
}

function isValidSessionToken(conf, token) {
    if (typeof token !== 'string') return false;
    const match = token.match(/^(\d{13})\.([0-9a-f]{64})$/);
    if (!match) return false;
    const exp = Number(match[1]);
    if (exp < Date.now() || exp > Date.now() + SESSION_MS) return false;
    const expected = Buffer.from(signSession(conf, exp), 'hex');
    return crypto.timingSafeEqual(expected, Buffer.from(match[2], 'hex'));
}

function safeEqual(a, b) {
    const ha = crypto.createHash('sha256').update(String(a)).digest();
    const hb = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
}

// O IP não é guardado: só um hash dele com a chave secreta como "tempero"
function failureKey(conf, req) {
    return crypto.createHmac('sha256', conf.secret).update('login|' + getClientIp(req)).digest('hex');
}

async function handleAdminLogin(req, res) {
    if (!requireMethod(req, res, 'POST')) return;
    const conf = getAdminConfig();
    if (conf.erro) return sendJson(res, 503, { erro: conf.erro });

    const chave = failureKey(conf, req);
    const falhas = await supabaseRequest('rpc/falhas_login', { method: 'POST', body: { p_chave: chave } });
    if (!falhas.ok) return sendJson(res, 502, { erro: 'Falha ao falar com o Supabase. Veja os logs do servidor.' });
    if (falhas.data >= ADMIN_MAX_FAILURES) {
        return sendJson(res, 429, { erro: 'Muitas tentativas erradas. Tente de novo em 15 minutos.' });
    }

    const body = await readJsonBody(req);
    const senha = body && typeof body.senha === 'string' ? body.senha : '';
    if (!safeEqual(senha, conf.password)) {
        await supabaseRequest('rpc/registrar_falha_login', { method: 'POST', body: { p_chave: chave } });
        return sendJson(res, 401, { erro: 'Senha incorreta.' });
    }

    await supabaseRequest('rpc/limpar_falhas_login', { method: 'POST', body: { p_chave: chave } });
    const session = createSessionToken(conf);
    sendJson(res, 200, { token: session.token, expiraEm: session.exp });
}

// Confere o token de sessão (Authorization: Bearer ...). Se falhar, já responde e retorna false.
function requireAdmin(req, res) {
    const conf = getAdminConfig();
    if (conf.erro) {
        sendJson(res, 503, { erro: conf.erro });
        return false;
    }
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!isValidSessionToken(conf, token)) {
        sendJson(res, 401, { erro: 'Sessão expirada. Entre de novo.' });
        return false;
    }
    return true;
}

function supabaseError(res, r) {
    if (r.status === 503) {
        return sendJson(res, 503, { erro: 'Supabase não configurado no servidor (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' });
    }
    return sendJson(res, 502, { erro: 'Falha ao falar com o Supabase. Veja os logs do servidor.' });
}

async function handleAdminDay(req, res, dateStr) {
    if (!requireMethod(req, res, 'GET') || !requireAdmin(req, res)) return;
    if (!isValidDateStr(dateStr)) return sendJson(res, 400, { erro: 'Data inválida.' });
    const r = await supabaseRequest(`cenas_diario_ajustes?dia=eq.${dateStr}&select=temporada,tentativa,motivos,contexto,atualizado_em`);
    if (!r.ok) return supabaseError(res, r);

    dailyStartCache.expires = 0; // o admin sempre vê a data inicial atual
    const ajustes = {};
    r.data.forEach(row => {
        if (CAMPAIGN_IDS.includes(row.temporada)) ajustes[row.temporada] = row;
    });
    sendJson(res, 200, { dataInicio: await getDailyStartDate(), hoje: todayStr(), ajustes });
}

async function handleAdminScene(req, res) {
    if (!requireMethod(req, res, 'POST') || !requireAdmin(req, res)) return;
    const body = await readJsonBody(req);
    if (!body || !isValidDateStr(body.dia) || !CAMPAIGN_IDS.includes(body.temporada)) {
        return sendJson(res, 400, { erro: 'Dia ou temporada inválidos.' });
    }
    const { dia, temporada, acao } = body;

    if (acao === 'marcar') {
        if (!SCENE_ISSUES.includes(body.motivo)) return sendJson(res, 400, { erro: 'Motivo inválido.' });
        const r = await supabaseRequest('rpc/marcar_cena_ruim', { method: 'POST', body: { p_dia: dia, p_temporada: temporada, p_motivo: body.motivo } });
        if (!r.ok) return supabaseError(res, r);
        return sendJson(res, 200, { tentativa: r.data });
    }

    if (acao === 'desfazer') {
        const r = await supabaseRequest('rpc/desfazer_marcacao', { method: 'POST', body: { p_dia: dia, p_temporada: temporada } });
        if (!r.ok) return supabaseError(res, r);
        return sendJson(res, 200, { tentativa: r.data || 0 });
    }

    if (acao === 'contexto') {
        const contexto = typeof body.contexto === 'string' ? body.contexto.trim() : '';
        if (contexto.length > 1000) return sendJson(res, 400, { erro: 'O contexto pode ter no máximo 1000 caracteres.' });
        if (!Number.isInteger(body.tentativa) || body.tentativa < 0) return sendJson(res, 400, { erro: 'Tentativa inválida.' });
        const r = await supabaseRequest('rpc/salvar_contexto', {
            method: 'POST',
            body: { p_dia: dia, p_temporada: temporada, p_tentativa: body.tentativa, p_contexto: contexto }
        });
        if (!r.ok) return supabaseError(res, r);
        if (r.data !== true) {
            return sendJson(res, 409, { erro: 'Outro admin trocou esta cena enquanto você editava. Recarregue o dia.' });
        }
        return sendJson(res, 200, { contexto });
    }

    sendJson(res, 400, { erro: 'Ação inválida.' });
}

async function handleAdminStartDate(req, res) {
    if (!requireMethod(req, res, 'POST') || !requireAdmin(req, res)) return;
    const body = await readJsonBody(req);
    const data = body ? body.data : undefined;
    if (data !== null && !isValidDateStr(data)) return sendJson(res, 400, { erro: 'Data inválida.' });
    const r = await supabaseRequest('rpc/salvar_data_inicio', { method: 'POST', body: { p_data: data } });
    if (!r.ok) return supabaseError(res, r);
    dailyStartCache.expires = 0; // vale na hora para o jogo
    sendJson(res, 200, { dataInicio: await getDailyStartDate() });
}

// Quantas vezes cada modo foi iniciado por dia, num intervalo (botão "Estatísticas" do /admin).
// Limita o intervalo a 366 dias para a consulta não crescer sem limite.
async function handleAdminStats(req, res) {
    if (!requireMethod(req, res, 'GET') || !requireAdmin(req, res)) return;
    const params = new URL(req.url, 'http://x').searchParams;
    const de = params.get('de') || '';
    const ate = params.get('ate') || '';
    if (!isValidDateStr(de) || !isValidDateStr(ate) || de > ate || addDays(de, 366) < ate) {
        return sendJson(res, 400, { erro: 'Intervalo de datas inválido (máximo de 366 dias).' });
    }

    const r = await supabaseRequest(`stats_inicios?dia=gte.${de}&dia=lte.${ate}&select=dia,modo,vezes&order=dia.desc`);
    if (!r.ok) return supabaseError(res, r);

    // Uma linha por dia com as três colunas (modo com 0 partidas nem aparece na tabela)
    const porDia = new Map();
    (r.data || []).forEach(row => {
        const dia = String(row.dia).slice(0, 10);
        if (!porDia.has(dia)) porDia.set(dia, { dia, daily: 0, classic: 0, infinite: 0 });
        if (SOLO_MODES.includes(row.modo)) porDia.get(dia)[row.modo] = Number(row.vezes) || 0;
    });
    const dias = [...porDia.values()].sort((a, b) => b.dia.localeCompare(a.dia));
    sendJson(res, 200, { dias });
}

// ==========================================
// ROTEADOR (usado pelo server.js local; na Vercel cada rota é um arquivo em api/)
// Retorna true se a requisição foi tratada.
// ==========================================
async function handleRoutes(req, res, pathname) {
    let match;
    if (pathname === '/config.js') await handleConfig(req, res);
    else if (pathname === '/api/stats') await handleStats(req, res);
    else if (pathname === '/api/game-start') await handleGameStart(req, res);
    else if ((match = pathname.match(/^\/api\/daily\/([^/]+)$/))) await handleDaily(req, res, match[1]);
    else if (pathname === '/api/global-stats') await handleGlobalStats(req, res);
    else if (pathname === '/api/admin/login') await handleAdminLogin(req, res);
    else if ((match = pathname.match(/^\/api\/admin\/dia\/([^/]+)$/))) await handleAdminDay(req, res, match[1]);
    else if (pathname === '/api/admin/cena') await handleAdminScene(req, res);
    else if (pathname === '/api/admin/data-inicio') await handleAdminStartDate(req, res);
    else if (pathname === '/api/admin/estatisticas') await handleAdminStats(req, res);
    else if (pathname.startsWith('/api/')) sendJson(res, 404, { erro: 'Rota não encontrada.' });
    else return false;
    return true;
}

// ==========================================
// ARQUIVOS PÚBLICOS
// Só o que o jogo e o painel usam. Todo o resto (server.js, .env, supabase/, testes/,
// node_modules/...) não é servido. Na Vercel, scripts/build-public.js copia exatamente
// esta lista para a pasta public/.
// ==========================================
const PUBLIC_FILES = ['index.html', 'index.css', 'index.js', 'episodes.js', 'admin/index.html', 'admin/admin.css', 'admin/admin.js'];
const PUBLIC_DIRS = ['assets'];

module.exports = {
    ROOT_DIR,
    CAMPAIGN_IDS,
    PUBLIC_FILES,
    PUBLIC_DIRS,
    CSP_GAME,
    CSP_ADMIN,
    readEnv,
    findEpisodeByYoutubeId,
    applySecurityHeaders,
    sendJson,
    handleRoutes,
    handleConfig,
    handleStats,
    handleGameStart,
    handleDaily,
    handleGlobalStats,
    handleAdminLogin,
    handleAdminDay,
    handleAdminScene,
    handleAdminStartDate,
    handleAdminStats
};
