/**
 * Painel /admin: revisão das cenas do Modo Diário.
 * As cenas são calculadas com o mesmo código do jogo (episodes.js -> buildDailyScenes),
 * então o que aparece aqui é exatamente o que os jogadores vão ver naquele dia.
 */
// Token de sessão (8h) devolvido pelo servidor no login. A senha nunca fica guardada.
const TOKEN_KEY = 'ordem_admin_token';
const MOTIVO_LABELS = { abertura: 'abertura', intervalo: 'intervalo', encerramento: 'encerramento' };

const state = {
    day: todayStr(),
    dataInicio: null,
    ajustes: {},
    loading: false
};

const el = {
    loginScreen: document.getElementById('login-screen'),
    loginForm: document.getElementById('login-form'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    panel: document.getElementById('panel'),
    panelError: document.getElementById('panel-error'),
    logout: document.getElementById('btn-logout'),
    startDateStatus: document.getElementById('start-date-status'),
    startDateInput: document.getElementById('start-date-input'),
    saveStartDate: document.getElementById('btn-save-start-date'),
    clearStartDate: document.getElementById('btn-clear-start-date'),
    dayInput: document.getElementById('day-input'),
    prevDay: document.getElementById('btn-prev-day'),
    nextDay: document.getElementById('btn-next-day'),
    today: document.getElementById('btn-today'),
    dayTag: document.getElementById('day-tag'),
    grid: document.getElementById('scenes-grid'),
    template: document.getElementById('scene-card-template'),
    openStats: document.getElementById('btn-open-stats'),
    statsModal: document.getElementById('stats-modal'),
    closeStats: document.getElementById('btn-close-stats'),
    statsFrom: document.getElementById('stats-from'),
    statsTo: document.getElementById('stats-to'),
    statsError: document.getElementById('stats-error'),
    statsBody: document.getElementById('stats-table-body')
};

// ==========================================
// Utilitários
// ==========================================
function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
}

function setToken(value) {
    try {
        if (value) sessionStorage.setItem(TOKEN_KEY, value);
        else sessionStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* sessão sem storage: pede a senha de novo ao recarregar */ }
}

class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

async function api(path, { method = 'GET', body, isLogin = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token && !isLogin) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: 'no-store'
    });
    let data = null;
    try { data = await response.json(); } catch (e) { /* 204 sem corpo */ }
    if (!response.ok) {
        const message = (data && data.erro) || `Erro ${response.status}`;
        if (response.status === 401 && !isLogin) showLogin(message);
        throw new ApiError(response.status, message);
    }
    return data;
}

// ==========================================
// Login
// ==========================================
function showLogin(message = '') {
    setToken('');
    destroyScenePlayers();
    el.panel.hidden = true;
    el.loginScreen.hidden = false;
    el.loginError.textContent = message;
    el.loginPassword.value = '';
    el.loginPassword.focus();
}

function showPanel() {
    el.loginScreen.hidden = true;
    el.panel.hidden = false;
    loadDay(state.day);
}

el.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = el.loginPassword.value;
    el.loginError.textContent = '';
    try {
        const result = await api('/api/admin/login', { method: 'POST', body: { senha: password }, isLogin: true });
        setToken(result.token);
        el.loginPassword.value = '';
        showPanel();
    } catch (err) {
        el.loginError.textContent = err.message;
    }
});

el.logout.addEventListener('click', () => {
    if (hasUnsavedContext() && !confirm('Há contexto não salvo. Sair mesmo assim?')) return;
    showLogin();
});

// ==========================================
// Data inicial do Diário
// ==========================================
function renderStartDate() {
    if (state.dataInicio) {
        el.startDateStatus.textContent = `O calendário do Diário começa em ${formatDate(state.dataInicio)}. Dias anteriores ficam bloqueados para os jogadores.`;
        el.startDateInput.value = state.dataInicio;
    } else {
        el.startDateStatus.textContent = 'Sem data inicial: todos os dias até hoje podem ser jogados.';
        el.startDateInput.value = '';
    }
    el.clearStartDate.disabled = !state.dataInicio;
}

async function saveStartDate(data) {
    el.panelError.textContent = '';
    el.saveStartDate.disabled = el.clearStartDate.disabled = true;
    try {
        const result = await api('/api/admin/data-inicio', { method: 'POST', body: { data } });
        state.dataInicio = result.dataInicio;
    } catch (err) {
        el.panelError.textContent = err.message;
    }
    el.saveStartDate.disabled = false;
    renderStartDate();
    renderDayTag();
}

el.saveStartDate.addEventListener('click', () => {
    const value = el.startDateInput.value;
    if (!value) {
        el.panelError.textContent = 'Escolha uma data antes de salvar.';
        return;
    }
    if (!confirm(`Definir ${formatDate(value)} como data inicial do Modo Diário?\nDias anteriores ficarão bloqueados para os jogadores.`)) return;
    saveStartDate(value);
});

el.clearStartDate.addEventListener('click', () => {
    if (!confirm('Remover a data inicial? Todos os dias até hoje poderão ser jogados.')) return;
    saveStartDate(null);
});

// ==========================================
// Navegação entre dias
// ==========================================
function hasUnsavedContext() {
    return [...el.grid.querySelectorAll('.scene-card')].some(card => card.dataset.dirty === 'true');
}

function goToDay(dateStr) {
    if (!dateStr || dateStr === state.day) return;
    if (hasUnsavedContext() && !confirm('Há contexto não salvo neste dia. Trocar de dia mesmo assim?')) {
        el.dayInput.value = state.day;
        return;
    }
    loadDay(dateStr);
}

el.prevDay.addEventListener('click', () => goToDay(addDays(state.day, -1)));
el.nextDay.addEventListener('click', () => goToDay(addDays(state.day, 1)));
el.today.addEventListener('click', () => goToDay(todayStr()));
el.dayInput.addEventListener('change', () => goToDay(el.dayInput.value));

window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedContext()) {
        e.preventDefault();
        e.returnValue = '';
    }
});

function renderDayTag() {
    const today = todayStr();
    el.dayTag.className = 'day-tag';
    if (state.dataInicio && state.day < state.dataInicio) {
        el.dayTag.textContent = 'Antes da data inicial (jogadores não veem)';
        el.dayTag.classList.add('locked');
    } else if (state.day === today) {
        el.dayTag.textContent = 'Hoje';
        el.dayTag.classList.add('today');
    } else if (state.day > today) {
        el.dayTag.textContent = 'Dia futuro';
    } else {
        el.dayTag.textContent = 'Dia passado';
    }
}

async function loadDay(dateStr) {
    state.day = dateStr;
    state.loading = true;
    el.dayInput.value = dateStr;
    el.panelError.textContent = '';
    el.grid.setAttribute('aria-busy', 'true');
    try {
        const data = await api(`/api/admin/dia/${dateStr}`);
        if (state.day !== dateStr) return; // outro dia foi escolhido enquanto carregava
        state.ajustes = data.ajustes || {};
        state.dataInicio = data.dataInicio;
        renderStartDate();
        renderDayTag();
        renderScenes();
    } catch (err) {
        if (err.status !== 401) {
            el.panelError.textContent = err.message;
            el.grid.innerHTML = '';
        }
    } finally {
        state.loading = false;
        el.grid.removeAttribute('aria-busy');
    }
}

// ==========================================
// Cards das cenas
// ==========================================
// ==========================================
// Player das cenas (API do YouTube)
// Toca só o trecho de 10s, sem os controles do YouTube (que permitiriam sair do trecho).
// No fim, uma tela por cima oferece reassistir a partir do início da cena.
// ==========================================
let ytApiPromise = null;
const activePlayers = new Set(); // { player, stop }

function loadYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (!ytApiPromise) {
        ytApiPromise = new Promise((resolve, reject) => {
            window.onYouTubeIframeAPIReady = resolve;
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.onerror = () => {
                ytApiPromise = null;
                reject(new Error('API do YouTube indisponível'));
            };
            document.head.appendChild(script);
        });
    }
    return ytApiPromise;
}

async function mountScenePlayer(video, scene, title) {
    const start = scene.startSeconds;
    const end = start + 10;
    video.innerHTML = '<p class="muted">Carregando…</p>';
    try {
        await loadYouTubeApi();
    } catch (e) {
        video.innerHTML = '<p class="form-error">Não foi possível carregar o player do YouTube.</p>';
        return;
    }

    const holder = document.createElement('div');
    const overlay = document.createElement('div');
    overlay.className = 'scene-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
        <button type="button" class="btn btn-primary btn-replay">↻ Reassistir cena</button>
        <span class="scene-overlay-time">${formatTime(start)} → ${formatTime(end)}</span>`;
    video.innerHTML = '';
    video.append(holder, overlay);

    let watcher = null;
    const stopWatcher = () => {
        clearInterval(watcher);
        watcher = null;
    };
    const showEnd = () => {
        stopWatcher();
        overlay.hidden = false;
        overlay.querySelector('.btn-replay').focus();
    };

    const entry = { player: null, stop: stopWatcher };
    const player = new YT.Player(holder, {
        videoId: scene.youtubeId,
        playerVars: { start, end, autoplay: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, iv_load_policy: 3, playsinline: 1 },
        events: {
            onReady: () => { player.getIframe().title = title; },
            onStateChange: (e) => {
                if (e.data === YT.PlayerState.PLAYING) {
                    overlay.hidden = true;
                    // Só uma cena tocando por vez
                    activePlayers.forEach(other => { if (other !== entry) other.player.pauseVideo(); });
                    // Garantia extra: para no fim do trecho mesmo se o YouTube ignorar o "end"
                    stopWatcher();
                    watcher = setInterval(() => {
                        if (player.getCurrentTime() >= end) {
                            player.pauseVideo();
                            showEnd();
                        }
                    }, 200);
                } else if (e.data === YT.PlayerState.ENDED) {
                    showEnd();
                } else {
                    stopWatcher();
                }
            }
        }
    });
    entry.player = player;
    activePlayers.add(entry);

    // Reassistir: recarrega o mesmo trecho (o botão de replay do YouTube voltaria para o início do vídeo)
    overlay.querySelector('.btn-replay').addEventListener('click', () => {
        overlay.hidden = true;
        player.loadVideoById({ videoId: scene.youtubeId, startSeconds: start, endSeconds: end });
    });
}

function destroyScenePlayers() {
    activePlayers.forEach(({ player, stop }) => {
        stop();
        try { player.destroy(); } catch (e) { /* player ainda carregando */ }
    });
    activePlayers.clear();
}

function renderScenes() {
    const scenes = buildDailyScenes(state.day, state.ajustes);
    destroyScenePlayers();
    el.grid.innerHTML = '';
    scenes.forEach((scene, index) => el.grid.appendChild(buildSceneCard(scene, index)));
}

function buildSceneCard(scene, index) {
    const card = el.template.content.firstElementChild.cloneNode(true);
    const campaign = DAILY_CAMPAIGNS.find(c => c.id === scene.campaignId);
    const ajuste = state.ajustes[scene.campaignId] || {};
    const end = scene.startSeconds + 10;

    card.querySelector('.scene-number').textContent = `CENA ${index + 1}`;
    card.querySelector('.scene-season').textContent = campaign ? campaign.title : scene.campaignId;
    card.querySelector('.scene-episode').textContent = scene.title;
    card.querySelector('.scene-time').textContent = `${formatTime(scene.startSeconds)} → ${formatTime(end)}`;

    const badge = card.querySelector('.scene-badge');
    if (scene.tentativa > 0) {
        const ultimo = (ajuste.motivos || [])[scene.tentativa - 1];
        const motivo = MOTIVO_LABELS[ultimo] ? ` (caiu em ${MOTIVO_LABELS[ultimo]})` : '';
        badge.textContent = `Algoritmo secundário · tentativa ${scene.tentativa}${motivo}`;
        badge.classList.add('secondary');
    } else {
        badge.textContent = 'Sorteio normal';
    }

    card.querySelector('.scene-yt-link').href = `https://www.youtube.com/watch?v=${scene.youtubeId}&t=${scene.startSeconds}s`;

    // Vídeo só carrega sob demanda (6 players de uma vez deixariam a página pesada)
    const video = card.querySelector('.scene-video');
    card.querySelector('.btn-load-video').addEventListener('click', () => {
        mountScenePlayer(video, scene, `${scene.title} - cena ${index + 1}`);
    });

    // Marcar abertura / intervalo / encerramento -> algoritmo secundário
    card.querySelectorAll('.btn-issue').forEach(btn => {
        btn.addEventListener('click', () => markScene(card, scene, btn.dataset.motivo));
    });
    const undo = card.querySelector('.btn-undo');
    undo.hidden = scene.tentativa === 0;
    undo.addEventListener('click', () => undoMark(card, scene));

    // Contexto
    const textarea = card.querySelector('.context-input');
    const count = card.querySelector('.context-count');
    const status = card.querySelector('.context-status');
    const saveBtn = card.querySelector('.btn-save-context');
    const saved = scene.contexto || '';
    textarea.value = saved;
    card.dataset.saved = saved;
    count.textContent = `${textarea.value.length}/1000`;
    saveBtn.disabled = true;

    textarea.addEventListener('input', () => {
        count.textContent = `${textarea.value.length}/1000`;
        const dirty = textarea.value.trim() !== card.dataset.saved;
        card.dataset.dirty = String(dirty);
        saveBtn.disabled = !dirty;
        status.className = 'context-status' + (dirty ? ' dirty' : '');
        status.textContent = dirty ? 'Não salvo' : '';
    });

    saveBtn.addEventListener('click', () => saveContext(card, scene));
    return card;
}

function hasCardUnsavedContext(card) {
    return card.dataset.dirty === 'true';
}

async function markScene(card, scene, motivo) {
    const campaign = DAILY_CAMPAIGNS.find(c => c.id === scene.campaignId);
    const lostContext = scene.contexto || hasCardUnsavedContext(card) ? '\nO contexto desta cena será apagado, porque ele descreve o momento atual.' : '';
    const msg = `Marcar que a cena de ${campaign ? campaign.title : scene.campaignId} (${formatDate(state.day)}) caiu em ${motivo}?\n` +
        `Um novo momento do mesmo episódio será sorteado para todos os jogadores.${lostContext}`;
    if (!confirm(msg)) return;
    await runSceneAction(card, { acao: 'marcar', motivo, dia: state.day, temporada: scene.campaignId });
}

async function undoMark(card, scene) {
    const lostContext = scene.contexto || hasCardUnsavedContext(card) ? '\nO contexto desta cena será apagado.' : '';
    if (!confirm(`Voltar para a tentativa ${scene.tentativa - 1}? O momento anterior volta a valer para os jogadores.${lostContext}`)) return;
    await runSceneAction(card, { acao: 'desfazer', dia: state.day, temporada: scene.campaignId });
}

async function runSceneAction(card, body) {
    card.querySelectorAll('button').forEach(b => { b.disabled = true; });
    try {
        await api('/api/admin/cena', { method: 'POST', body });
        card.dataset.dirty = 'false';
        await loadDay(state.day);
    } catch (err) {
        el.panelError.textContent = err.message;
        card.querySelectorAll('button').forEach(b => { b.disabled = false; });
    }
}

async function saveContext(card, scene) {
    const textarea = card.querySelector('.context-input');
    const status = card.querySelector('.context-status');
    const saveBtn = card.querySelector('.btn-save-context');
    saveBtn.disabled = true;
    status.className = 'context-status';
    status.textContent = 'Salvando…';
    try {
        const result = await api('/api/admin/cena', {
            method: 'POST',
            body: { acao: 'contexto', dia: state.day, temporada: scene.campaignId, tentativa: scene.tentativa, contexto: textarea.value }
        });
        card.dataset.saved = result.contexto;
        card.dataset.dirty = 'false';
        scene.contexto = result.contexto;
        textarea.value = result.contexto;
        state.ajustes[scene.campaignId] = { ...(state.ajustes[scene.campaignId] || {}), tentativa: scene.tentativa, contexto: result.contexto };
        status.className = 'context-status ok';
        status.textContent = result.contexto ? 'Salvo' : 'Contexto removido';
    } catch (err) {
        status.className = 'context-status error';
        status.textContent = err.message;
        saveBtn.disabled = false;
    }
}

// ==========================================
// Modal de Estatísticas: partidas iniciadas por dia
// ==========================================
function openStatsModal() {
    const ate = todayStr();
    const de = addDays(ate, -29); // últimos 30 dias
    el.statsFrom.value = de;
    el.statsTo.value = ate;
    el.statsError.textContent = '';
    el.statsModal.hidden = false;
    loadStats();
}

function closeStatsModal() {
    el.statsModal.hidden = true;
}

async function loadStats() {
    const de = el.statsFrom.value;
    const ate = el.statsTo.value;
    el.statsError.textContent = '';

    if (!de || !ate || de > ate) {
        el.statsError.textContent = 'Intervalo de datas inválido.';
        el.statsBody.innerHTML = '';
        return;
    }

    el.statsBody.innerHTML = '<tr><td colspan="5" class="muted">Carregando…</td></tr>';
    try {
        const result = await api(`/api/admin/estatisticas?de=${de}&ate=${ate}`);
        renderStatsTable(result.dias || []);
    } catch (err) {
        el.statsError.textContent = err.message;
        el.statsBody.innerHTML = '';
    }
}

function renderStatsTable(dias) {
    if (dias.length === 0) {
        el.statsBody.innerHTML = '<tr><td colspan="5" class="muted">Nenhuma partida iniciada neste período.</td></tr>';
        return;
    }
    el.statsBody.innerHTML = dias.map(d => {
        const total = d.daily + d.classic + d.infinite;
        return `<tr><td>${formatDate(d.dia)}</td><td>${d.daily}</td><td>${d.classic}</td><td>${d.infinite}</td><td><strong>${total}</strong></td></tr>`;
    }).join('');
}

el.openStats.addEventListener('click', openStatsModal);
el.closeStats.addEventListener('click', closeStatsModal);
el.statsModal.addEventListener('click', (e) => { if (e.target === el.statsModal) closeStatsModal(); });
el.statsFrom.addEventListener('change', loadStats);
el.statsTo.addEventListener('change', loadStats);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !el.statsModal.hidden) closeStatsModal(); });

// ==========================================
// Início
// ==========================================
// A versão anterior guardava a senha na aba; apaga se ainda existir
try { sessionStorage.removeItem('ordem_admin_password'); } catch (e) { /* sem storage */ }

if (getToken()) {
    showPanel();
} else {
    showLogin();
}
