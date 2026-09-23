/**
 * Servidor local: arquivos do jogo, API (mesma lógica das funções da Vercel, em api/_lib/core.js)
 * e o WebSocket do Modo Duelo (que só funciona aqui; a Vercel não mantém conexões abertas).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const core = require('./api/_lib/core');

const PORT = Number(process.env.PORT) || 3001; // hospedagens (Render, Railway...) definem PORT

// ==========================================
// ARQUIVOS PÚBLICOS (lista em core.PUBLIC_FILES / core.PUBLIC_DIRS)
// ==========================================
const PUBLIC_FILES = new Set(core.PUBLIC_FILES.map(f => '/' + f));
const PUBLIC_DIRS = core.PUBLIC_DIRS.map(d => '/' + d + '/');

const CONTENT_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.ttf': 'font/ttf',
    '.woff2': 'font/woff2'
};

// Caminho absoluto do arquivo para uma URL pública, ou null se não for pública
function resolvePublicFile(pathname) {
    if (pathname === '/') return path.join(core.ROOT_DIR, 'index.html');
    if (pathname === '/admin') return path.join(core.ROOT_DIR, 'admin', 'index.html');
    if (pathname === '/admin/index.html') return null; // o painel só existe em /admin
    if (PUBLIC_FILES.has(pathname)) return path.join(core.ROOT_DIR, pathname.slice(1));

    const dir = PUBLIC_DIRS.find(d => pathname.startsWith(d));
    if (!dir) return null;
    let decoded;
    try {
        decoded = decodeURIComponent(pathname);
    } catch (e) {
        return null; // URL malformada
    }
    // O arquivo precisa continuar dentro da pasta pública (bloqueia "..%2f" e arquivos ocultos)
    const dirPath = path.join(core.ROOT_DIR, dir);
    const filePath = path.join(core.ROOT_DIR, decoded);
    if (!filePath.startsWith(dirPath) || decoded.split('/').some(part => part.startsWith('.'))) return null;
    return filePath;
}

// ==========================================
// HTTP
// ==========================================
const server = http.createServer(async (req, res) => {
    let pathname;
    try {
        pathname = new URL(req.url, 'http://localhost').pathname;
    } catch (e) {
        res.writeHead(400);
        return res.end();
    }

    try {
        if (await core.handleRoutes(req, res, pathname)) return;
    } catch (e) {
        console.error('Erro na rota ' + pathname + ':', e);
        if (!res.headersSent) core.sendJson(res, 500, { erro: 'Erro interno do servidor.' });
        return;
    }

    core.applySecurityHeaders(res);

    // /admin/ (com barra) vira /admin, que é a única rota do painel
    if (pathname === '/admin/') {
        res.writeHead(301, { 'Location': '/admin' });
        return res.end();
    }

    const filePath = resolvePublicFile(pathname);
    if (!filePath) {
        res.writeHead(404);
        return res.end('Arquivo Não Encontrado');
    }

    const ext = path.extname(filePath);
    const headers = { 'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream' };
    if (ext === '.html') {
        headers['Content-Security-Policy'] = pathname === '/admin' ? core.CSP_ADMIN : core.CSP_GAME;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(err.code === 'ENOENT' ? 404 : 500);
            res.end(err.code === 'ENOENT' ? 'Arquivo Não Encontrado' : 'Erro Interno de Servidor');
        } else {
            res.writeHead(200, headers);
            res.end(content);
        }
    });
});

// ==========================================
// WEBSOCKET DO MODO DUELO
// O servidor não confia no que o cliente diz sobre acerto e pontos: ele mesmo compara
// a resposta com a cena da rodada, e a cena só pode ser um episódio da base (episodes.js).
// ==========================================
const MAX_NAME_LENGTH = 24;
const MAX_ROUND_POINTS = 1500; // 500 base + até 1000 de bônus de tempo (ver handleAnswer no index.js)

// Salas por código de 4 dígitos (Map evita chaves como "__proto__" poluírem objetos)
const rooms = new Map();

function cleanName(value, fallback) {
    const name = typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_NAME_LENGTH) : '';
    return name || fallback;
}

// Reconstrói a cena a partir da base de episódios; ignora qualquer outro dado vindo do host
function sanitizeTrack(track) {
    if (!track || typeof track !== 'object') return null;
    const episode = core.findEpisodeByYoutubeId(track.youtubeId);
    const start = Number(track.startSeconds);
    if (!episode || !Number.isFinite(start) || start < 0 || start > 6 * 60 * 60) return null;
    return {
        title: episode.title,
        episodeNum: episode.episodeNum,
        youtubeId: episode.youtubeId,
        campaignId: episode.campaignId,
        startSeconds: Math.floor(start)
    };
}

function send(ws, data) {
    if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(data));
}

function sendToRoom(room, data) {
    send(room.host, data);
    send(room.guest, data);
}

const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 });

wss.on('connection', (ws) => {
    let userRoom = null;
    let userRole = null; // 'host' or 'guest'

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (!data || typeof data !== 'object') return;
            const room = userRoom ? rooms.get(userRoom) : null;

            switch (data.type) {
                // Host cria a sala
                case 'CREATE_ROOM': {
                    if (userRoom) return; // já está numa sala
                    let code;
                    do {
                        code = Math.floor(1000 + Math.random() * 9000).toString();
                    } while (rooms.has(code));

                    userRoom = code;
                    userRole = 'host';
                    rooms.set(code, {
                        host: ws,
                        guest: null,
                        hostName: cleanName(data.name, 'Host Agente'),
                        guestName: null,
                        state: 'lobby',
                        currentTrack: null,
                        scores: { host: 0, guest: 0 },
                        lockedOut: { host: false, guest: false },
                        round: 0
                    });

                    send(ws, { type: 'ROOM_CREATED', code });
                    console.log(`Lobby ${code} criado pelo Host.`);
                    break;
                }

                // Convidado entra na sala
                case 'JOIN_ROOM': {
                    if (userRoom) return;
                    const code = typeof data.code === 'string' ? data.code.trim() : '';
                    const target = /^\d{4}$/.test(code) ? rooms.get(code) : null;
                    if (!target) {
                        send(ws, { type: 'ERROR', message: 'Sala não encontrada. Verifique o código.' });
                        return;
                    }
                    if (target.guest) {
                        send(ws, { type: 'ERROR', message: 'Sala já está cheia (limite de 2 jogadores).' });
                        return;
                    }

                    userRoom = code;
                    userRole = 'guest';
                    target.guest = ws;
                    target.guestName = cleanName(data.name, 'Convidado Agente');
                    target.state = 'lobby';

                    send(ws, { type: 'ROOM_JOINED', code, opponentName: target.hostName });
                    send(target.host, { type: 'OPPONENT_CONNECTED', opponentName: target.guestName });
                    console.log(`Jogador entrou no Lobby ${code}. Duelo pronto.`);
                    break;
                }

                // Iniciar o jogo (sincronizado pelo Host)
                case 'START_GAME': {
                    if (!room || userRole !== 'host' || !room.guest) return;
                    room.state = 'playing';
                    room.scores = { host: 0, guest: 0 };
                    room.round = 0;

                    // Lista de temporadas separadas por vírgula; só ids conhecidos
                    const campaigns = typeof data.campaign === 'string'
                        ? data.campaign.split(',').filter(id => core.CAMPAIGN_IDS.includes(id))
                        : [];
                    sendToRoom(room, { type: 'GAME_STARTED', campaign: campaigns.length ? campaigns.join(',') : 'hexatombe' });
                    break;
                }

                // Host seleciona a próxima cena (episódio e ponto de início sorteado)
                case 'SYNC_PLAY_TRACK': {
                    if (!room || userRole !== 'host' || room.state !== 'playing') return;
                    const track = sanitizeTrack(data.track);
                    if (!track) return;

                    room.currentTrack = track;
                    room.lockedOut.host = false;
                    room.lockedOut.guest = false;
                    room.round++;
                    sendToRoom(room, { type: 'PLAY_TRACK', track, round: room.round, scores: room.scores });
                    break;
                }

                // Jogador envia sua resposta
                case 'SUBMIT_ANSWER': {
                    if (!room || room.state !== 'playing' || !room.currentTrack || !room.guest) return;
                    if (userRole !== 'host' && userRole !== 'guest') return;
                    if (room.lockedOut[userRole]) return; // já errou nesta rodada

                    const me = userRole;
                    const other = me === 'host' ? 'guest' : 'host';
                    const myName = me === 'host' ? room.hostName : room.guestName;

                    // O servidor decide se acertou comparando com a cena da rodada
                    const chosen = typeof data.chosenSeason === 'string' ? data.chosenSeason.toLowerCase() : '';
                    const isCorrect = chosen !== '' && chosen === room.currentTrack.episodeNum.toLowerCase();

                    if (isCorrect) {
                        const points = Math.min(Math.max(Math.floor(Number(data.points) || 0), 0), MAX_ROUND_POINTS);
                        room.scores[me] += points;
                        sendRoundOver(room, me, room.currentTrack, points);
                    } else {
                        room.lockedOut[me] = true;

                        // Penalidade se errou com dica: perde 100 pontos
                        const penalty = data.usedHint === true ? 100 : 0;
                        if (penalty) room.scores[me] = Math.max(0, room.scores[me] - penalty);

                        send(room[me], {
                            type: 'ANSWER_LOCKED',
                            message: penalty > 0
                                ? `Resposta errada! Você usou dica (-${penalty} pts).`
                                : 'Resposta errada! Você está bloqueado nesta rodada.'
                        });

                        // Se ambos erraram, a rodada acaba em empate
                        if (room.lockedOut[other]) {
                            sendRoundOver(room, 'draw', room.currentTrack, 0);
                        } else {
                            send(room[other], {
                                type: 'OPPONENT_ERRED',
                                message: penalty > 0
                                    ? `${myName} errou usando dica (-${penalty} pts)! Você ainda pode responder.`
                                    : `${myName} errou! Você ainda pode responder.`
                            });
                        }
                    }
                    break;
                }

                // Rodada acabou em timeout (sem respostas)
                case 'TIMEOUT': {
                    if (room && userRole === 'host' && room.guest && room.currentTrack) {
                        sendRoundOver(room, 'timeout', room.currentTrack, 0);
                    }
                    break;
                }

                // Dica ativada por um jogador
                case 'ACTIVATE_HINT': {
                    if (room) send(room[userRole], { type: 'HINT_ACTIVATED' });
                    break;
                }

                // Avançar para a próxima rodada (Host comanda)
                case 'NEXT_ROUND': {
                    if (room && userRole === 'host') sendToRoom(room, { type: 'NEXT_ROUND' });
                    break;
                }

                // Sair do jogo
                case 'QUIT_GAME': {
                    cleanRoom(userRoom, ws);
                    userRoom = null;
                    userRole = null;
                    break;
                }
            }
        } catch (e) {
            console.error('Erro processando mensagem WebSocket:', e.message);
        }
    });

    ws.on('close', () => {
        cleanRoom(userRoom, ws);
    });

    // Sem este handler, uma mensagem inválida ou grande demais derrubaria o servidor inteiro.
    // O ws já fecha a conexão com problema; aqui só registramos.
    ws.on('error', (err) => {
        console.warn('Conexão WebSocket encerrada por erro:', err.message);
    });
});

wss.on('error', (err) => {
    console.error('Erro no servidor WebSocket:', err.message);
});

// Finaliza a rodada e envia o veredito para ambos
function sendRoundOver(room, winnerRole, track, pointsGained) {
    const winnerName = winnerRole === 'host' ? room.hostName : (winnerRole === 'guest' ? room.guestName : null);
    sendToRoom(room, {
        type: 'ROUND_OVER',
        winner: winnerRole, // 'host', 'guest', 'draw', 'timeout'
        winnerName,
        points: pointsGained,
        scores: room.scores,
        track
    });
}

// Limpa recursos da sala e notifica encerramento
function cleanRoom(code, closingSocket) {
    const room = code ? rooms.get(code) : null;
    if (!room) return;

    const opponent = closingSocket === room.host ? room.guest : room.host;
    send(opponent, { type: 'DISCONNECTED', message: 'Oponente desconectou. O Duelo foi encerrado.' });

    rooms.delete(code);
    console.log(`Lobby ${code} removido/encerrado.`);
}

// Iniciar o Servidor
server.listen(PORT, '0.0.0.0', () => {
    console.log(`=============================================================`);
    console.log(`🎬 ORDEM PARANORMAL: HEXATOMBE QUIZ DE CENAS - SERVIDOR 🎬`);
    console.log(`Servidor rodando localmente na porta ${PORT}!`);
    console.log(`Acesse localmente em: http://localhost:${PORT}`);
    console.log(`Seu amigo no Radmin VPN pode conectar no seu IP de rede:`);
    console.log(`Exemplo: http://<seu-ip-do-radmin>:${PORT}`);
    console.log(`=============================================================`);
});
