// ==========================================================================
// Motor do mockup/editor: gera o formulário a partir de CONTENT e renderiza
// a pré-visualização das telas do jogo com os textos atuais.
// ==========================================================================

const ORIGINAL_CONTENT = JSON.parse(JSON.stringify(CONTENT));

const STORAGE_KEY = 'ordem-paranormal-mockup-textos-v1';

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        // Mescla profunda: campos novos do content.js continuam aparecendo mesmo com edições antigas salvas
        const merge = (target, source) => {
            Object.keys(source).forEach(key => {
                const value = source[key];
                if (value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                    merge(target[key], value);
                } else {
                    target[key] = value;
                }
            });
        };
        merge(CONTENT, saved);
    } catch (e) {
        console.warn('Não foi possível carregar os textos salvos do navegador:', e);
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(CONTENT));
        setSaveIndicator('Salvo no navegador ' + new Date().toLocaleTimeString('pt-BR'));
    } catch (e) {
        console.warn('Não foi possível salvar os textos no navegador:', e);
        setSaveIndicator('Falha ao salvar no navegador');
    }
}

function setSaveIndicator(text) {
    const el = document.getElementById('save-indicator');
    if (el) el.textContent = text;
}

const state = {
    screen: 'intro',
    revealVariant: 'correct',
    gameStatus: 'statusDefault',
    gameLoading: 'none',
    gameoverMode: 'daily',
    gameoverTier: '2', // índice em gameover.ranks (não-duelo) ou 'win'/'tie'/'lose' (duelo)
    introCampaignCount: 'all',
    introModeView: 'daily'
};

// ---------------------------------------------------------------- utilidades

function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setPath(obj, path, value) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
    o[keys[keys.length - 1]] = value;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setHtml(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

function fillTemplate(tpl, vars) {
    return tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

// ---------------------------------------------------------- geração do form

const formRoot = document.getElementById('editor-form');

function addSection(title) {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = title;
    const body = document.createElement('div');
    body.className = 'details-body';
    details.appendChild(summary);
    details.appendChild(body);
    formRoot.appendChild(details);
    return body;
}

function addSubheading(container, text) {
    const div = document.createElement('div');
    div.className = 'field-group subheading';
    div.textContent = text;
    container.appendChild(div);
}

function addField(container, path, labelText) {
    const val = getPath(CONTENT, path);
    const wrap = document.createElement('div');
    wrap.className = 'field-group';

    const label = document.createElement('label');
    label.textContent = labelText;
    wrap.appendChild(label);

    const isLong = typeof val === 'string' && (val.length > 55 || val.includes('<'));
    const input = document.createElement(isLong ? 'textarea' : 'input');
    if (!isLong) input.type = 'text';
    else input.rows = Math.min(6, Math.max(2, Math.ceil(val.length / 45)));
    input.value = val;
    input.dataset.path = path;

    input.addEventListener('input', () => {
        setPath(CONTENT, path, input.value);
        renderPreview();
        saveToStorage();
    });

    wrap.appendChild(input);
    container.appendChild(wrap);
    return input;
}

function buildForm() {
    formRoot.innerHTML = '';

    // ---------------- TELA INICIAL ----------------
    const intro = addSection('Tela Inicial');
    addField(intro, 'intro.mainTitle', 'Título Principal');
    addField(intro, 'intro.subtitleSelectCampaign', 'Subtítulo estático inicial (antes do JS calcular)');
    addField(intro, 'intro.subtitleNeedOne', 'Subtítulo — nenhuma temporada selecionada');
    addField(intro, 'intro.subtitleAllSeasons', 'Subtítulo — todas as temporadas selecionadas');
    addField(intro, 'intro.subtitleMultiTemplate', 'Subtítulo — várias selecionadas (use {count})');
    addField(intro, 'intro.descAllCampaigns', 'Descrição — todas as campanhas (HTML)');
    addField(intro, 'intro.descSingleCampaignTemplate', 'Descrição — 1 campanha (use {campaign})');
    addField(intro, 'intro.descMultiCampaigns', 'Descrição — várias campanhas');
    addField(intro, 'intro.descNoneSelected', 'Descrição — nenhuma selecionada');

    addSubheading(intro, 'Seleção de Temporadas');
    addField(intro, 'intro.campaignsSectionTitle', 'Título da seção');
    addField(intro, 'intro.campaignHintDefault', 'Texto de dica padrão');
    addField(intro, 'intro.campaignHintMustKeepOne', 'Texto de dica — precisa manter 1 selecionada');
    CONTENT.campaigns.forEach((camp, i) => {
        addSubheading(intro, `Campanha: ${camp.title}`);
        addField(intro, `campaigns.${i}.title`, 'Nome exibido no botão');
        addField(intro, `campaigns.${i}.episodes`, 'Subtexto (nº de episódios)');
        addField(intro, `campaigns.${i}.introName`, 'Nome curto (usado na descrição "campanha de ___")');
    });

    addSubheading(intro, 'Modos de Jogo');
    addField(intro, 'intro.modeSectionTitle', 'Título da seção');
    addField(intro, 'intro.historyBtn', 'Botão — Histórico de Desafios');
    addField(intro, 'intro.dailyBadge', 'Selo do Modo Diário');
    addField(intro, 'intro.dailyTitle', 'Título — Modo Diário');
    addField(intro, 'intro.dailyDesc', 'Descrição — Modo Diário');
    addField(intro, 'intro.btnShowOtherModes', 'Botão — Ver Outros Modos');
    addField(intro, 'intro.btnBackToDaily', 'Botão — Voltar ao Modo Diário');
    addField(intro, 'intro.classicTitle', 'Título — Modo Clássico');
    addField(intro, 'intro.classicDesc', 'Descrição — Modo Clássico');
    addField(intro, 'intro.infiniteTitle', 'Título — Modo Infinito');
    addField(intro, 'intro.infiniteDesc', 'Descrição — Modo Infinito');
    addField(intro, 'intro.duelBadge', 'Selo — Modo Duelo (bloqueado)');
    addField(intro, 'intro.duelTitle', 'Título — Modo Duelo');
    addField(intro, 'intro.duelDesc', 'Descrição — Modo Duelo');

    addSubheading(intro, 'Painel de Duelo / Multiplayer');
    addField(intro, 'intro.multiplayerTitle', 'Título do painel');
    addField(intro, 'intro.createRoomTitle', 'Título — Criar Sala');
    addField(intro, 'intro.createRoomInfo', 'Texto — Criar Sala');
    addField(intro, 'intro.btnCreateLobby', 'Botão — Criar Sala');
    addField(intro, 'intro.orDivider', 'Divisor ("ou")');
    addField(intro, 'intro.joinRoomTitle', 'Título — Entrar em Sala');
    addField(intro, 'intro.joinRoomInfo', 'Texto — Entrar em Sala');
    addField(intro, 'intro.codeInputPlaceholder', 'Placeholder do código');
    addField(intro, 'intro.btnJoinLobby', 'Botão — Entrar');
    addField(intro, 'intro.lobbyCodeLabel', 'Rótulo — Código da Sala');
    addField(intro, 'intro.opponentStatusLabel', 'Rótulo — Status');
    addField(intro, 'intro.opponentStatusConnected', 'Texto — Conectado');
    addField(intro, 'lobby.roomCreated', 'Mensagem — Sala criada (host)');
    addField(intro, 'lobby.roomJoined', 'Mensagem — Você entrou na sala (guest)');
    addField(intro, 'lobby.opponentConnectedWithTemplate', 'Mensagem guest — oponente conectado (use {name})');
    addField(intro, 'lobby.opponentReady', 'Mensagem host — oponente pronto');
    addField(intro, 'lobby.opponentTagTemplate', 'Tag do oponente (use {name})');
    addField(intro, 'lobby.btnWaitingHost', 'Botão — Aguardando Host');
    addField(intro, 'lobby.btnStartDuel', 'Botão — Iniciar Duelo');
    addField(intro, 'lobby.connectingTemplate', 'Status conexão — conectando (use {port})');
    addField(intro, 'lobby.channelOpenTemplate', 'Status conexão — canal aberto (use {port})');
    addField(intro, 'lobby.connectionFailedTemplate', 'Status conexão — falhou (use {port})');
    addField(intro, 'lobby.connectionLostAlert', 'Alerta — conexão perdida');

    addSubheading(intro, 'Outros');
    addField(intro, 'intro.btnStartGame', 'Botão principal — Iniciar Investigação');
    addField(intro, 'intro.calendarDoneTemplate', 'Painel diário — já concluído (use {date})');
    addField(intro, 'intro.calendarPendingTemplate', 'Painel diário — pendente (use {date})');
    addField(intro, 'intro.volumeLabel', 'Rótulo do volume');

    // ---------------- TELA DE JOGO ----------------
    const game = addSection('Tela de Jogo');
    addField(game, 'game.labelRoundType', 'Rótulo HUD — Tipo de Rodada');
    addField(game, 'game.labelScore', 'Rótulo HUD — Pontuação');
    addField(game, 'game.labelSanity', 'Rótulo HUD — Sanidade');
    addField(game, 'game.labelStreak', 'Rótulo HUD — Sequência');
    addField(game, 'game.loadingText', 'Overlay — Carregando vídeo');
    addField(game, 'game.signalLostTitle', 'Overlay — Sinal cortado (fim do tempo)');
    addSubheading(game, 'Mensagens de Status do Player');
    addField(game, 'game.statusDefault', 'Inicial');
    addField(game, 'game.statusTuning', 'Ajustando sintonizador');
    addField(game, 'game.statusTuningMystic', 'Sintonizando transmissão');
    addField(game, 'game.statusMonitoring', 'Tocando / monitorando');
    addField(game, 'game.statusReady', 'Calibrado / pronto');
    addField(game, 'game.statusPaused', 'Pausado');
    addField(game, 'game.statusReplay', 'Reassistindo');
    addField(game, 'game.statusHintActive', 'Dica ativa (placar penalizado)');
    addField(game, 'game.statusSignalCut', 'Sinal cortado / tempo esgotado');
    addField(game, 'game.statusError', 'Erro no monitor');
    addField(game, 'game.statusCorrupted', 'Monitor corrompido (backup)');
    addSubheading(game, 'Dica e Controles');
    addField(game, 'game.btnHint', 'Botão — Obter Dica');
    addField(game, 'game.hintTemplate', 'Texto do tooltip da dica (botão fica desativado; recurso não funcional — use {date}, vem do .env HINT_AVAILABLE_DATE)');
    addField(game, 'game.btnReplayTitle', 'Tooltip — Reassistir cena');
    addField(game, 'game.quizInstruction', 'Instrução acima das opções');
    addField(game, 'game.btnQuit', 'Botão — Abandonar Investigação');

    // ---------------- REVELAÇÃO ----------------
    const reveal = addSection('Revelação (Resultado da Rodada)');
    addField(reveal, 'reveal.detailsTitle', 'Título — Detalhes da Revelação');
    addField(reveal, 'reveal.contextLabel', 'Rótulo — Contexto da Cena (só no Diário, quando o admin escreveu)');
    addField(reveal, 'reveal.contextExample', 'Exemplo de contexto (só para a pré-visualização; o texto real vem do /admin)');
    addField(reveal, 'reveal.btnWatchYoutube', 'Link — Assistir no YouTube');
    addField(reveal, 'reveal.btnNext', 'Botão — Avançar (rodada normal)');
    addField(reveal, 'reveal.btnNextLast', 'Botão — Avançar (última rodada)');
    addSubheading(reveal, 'Modo Solo');
    addField(reveal, 'reveal.correctTitle', 'Título — Acertou');
    addField(reveal, 'reveal.correctSubtitleTemplate', 'Subtítulo — Acertou (use {streak}; sem pontos, removidos)');
    addField(reveal, 'reveal.wrongTitle', 'Título — Errou');
    addSubheading(reveal, 'Modo Duelo');
    addField(reveal, 'reveal.duel.winTitle', 'Título — Você venceu a rodada');
    addField(reveal, 'reveal.duel.winSubtitleTemplate', 'Subtítulo — Você venceu (use {points})');
    addField(reveal, 'reveal.duel.loseTitle', 'Título — Oponente venceu');
    addField(reveal, 'reveal.duel.tieTitle', 'Título — Empate (ambos erraram)');
    addField(reveal, 'reveal.duel.tieSubtitle', 'Subtítulo — Empate');
    addField(reveal, 'reveal.duel.timeoutTitle', 'Título — Tempo esgotado');
    addField(reveal, 'reveal.duel.timeoutSubtitle', 'Subtítulo — Tempo esgotado');
    addField(reveal, 'reveal.duel.btnWaitingHost', 'Botão — Aguardando Host');
    addField(reveal, 'reveal.duel.btnAdvanceDuel', 'Botão — Avançar Rodada de Duelo');
    addField(reveal, 'reveal.duel.btnWaitingResults', 'Botão — Aguardando Resultados');
    addField(reveal, 'reveal.duel.btnDuelReport', 'Botão — Ver Relatório do Duelo');

    // ---------------- FIM DE JOGO ----------------
    const over = addSection('Fim de Jogo (Relatório Final)');
    addField(over, 'gameover.title', 'Título da tela');
    addSubheading(over, 'Causa / Motivo do Fim');
    addField(over, 'gameover.causeCompleted', 'Investigação concluída (Clássico/Campanha)');
    addField(over, 'gameover.causeInfinite', 'Modo Infinito encerrado');
    addField(over, 'gameover.causeDuel', 'Duelo encerrado');
    addSubheading(over, 'Estatísticas (card de Acertos é destacado no topo; Pontuação Final foi removida de todos os modos)');
    addField(over, 'gameover.lblAccuracy', 'Rótulo — Acertos (card em destaque)');
    addField(over, 'gameover.lblStreak', 'Rótulo — Maior Sequência');
    addField(over, 'gameover.lblAvgTime', 'Rótulo — Tempo Médio');
    addField(over, 'gameover.rankSectionLabel', 'Rótulo — Rank Obtido');
    addField(over, 'gameover.btnRetry', 'Botão — Nova Investigação');
    addField(over, 'gameover.btnHome', 'Botão — Menu Inicial');

    addSubheading(over, 'Ranks — Diário, Clássico e Infinito (mesma escala, proporcional aos acertos — sem pontuação)');
    CONTENT.gameover.ranks.forEach((item, i) => {
        addField(over, `gameover.ranks.${i}.rank`, `${item.label} — Rank`);
        addField(over, `gameover.ranks.${i}.desc`, `${item.label} — Descrição`);
    });

    addSubheading(over, 'Resultado do Duelo (baseado em placar contra o oponente, não em acertos)');
    addField(over, 'gameover.duelOutcomes.win.rank', 'Vitória — Rank');
    addField(over, 'gameover.duelOutcomes.win.descTemplate', 'Vitória — Descrição (use {opponent}, {my}, {op})');
    addField(over, 'gameover.duelOutcomes.tie.rank', 'Empate — Rank');
    addField(over, 'gameover.duelOutcomes.tie.descTemplate', 'Empate — Descrição (use {my}, {op})');
    addField(over, 'gameover.duelOutcomes.lose.rank', 'Derrota — Rank');
    addField(over, 'gameover.duelOutcomes.lose.descTemplate', 'Derrota — Descrição (use {opponent}, {my}, {op})');

    // ---------------- MODAIS ----------------
    const modals = addSection('Modais (Resultado do Dia / Calendário)');
    addField(modals, 'modals.dailyResultTitle', 'Título do modal de resultado');
    addField(modals, 'modals.dailyResultHeader', 'Cabeçalho interno');
    addField(modals, 'modals.dailyResultDefaultRank', 'Rank padrão (sem resultado salvo)');
    addField(modals, 'modals.dailyResultDefaultDesc', 'Descrição padrão (sem resultado salvo)');
    addField(modals, 'modals.dailyStatAccuracy', 'Rótulo — Acertos (card em destaque; Pontuação foi removida)');
    addField(modals, 'modals.dailyStatStreak', 'Rótulo — Streak Máx');
    addField(modals, 'modals.dailyStatAvgTime', 'Rótulo — Tempo Médio');
    addField(modals, 'modals.calendarTitle', 'Título do modal de calendário');
}

// -------------------------------------------------------------- toolbar UI

function populateToolbar() {
    document.getElementById('sel-screen').value = state.screen;
    document.getElementById('sel-reveal-variant').value = state.revealVariant;
    document.getElementById('sel-game-status').value = state.gameStatus;
    document.getElementById('sel-game-loading').value = state.gameLoading;
    document.getElementById('sel-gameover-mode').value = state.gameoverMode;
    document.getElementById('sel-intro-campaign-count').value = state.introCampaignCount;
    document.getElementById('sel-intro-mode-view').value = state.introModeView;

    refreshTierOptions();
    refreshToolbarVisibility();
}

function refreshTierOptions() {
    const tierSel = document.getElementById('sel-gameover-tier');
    tierSel.innerHTML = '';
    let options = [];

    if (state.gameoverMode === 'duel') {
        options = [
            { value: 'win', label: 'Você venceu o duelo' },
            { value: 'tie', label: 'Empate' },
            { value: 'lose', label: 'Você perdeu o duelo' }
        ];
    } else {
        options = CONTENT.gameover.ranks.map((item, i) => ({ value: String(i), label: item.label }));
    }

    options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        tierSel.appendChild(opt);
    });

    tierSel.value = options.some(o => o.value === state.gameoverTier) ? state.gameoverTier : options[0].value;
    state.gameoverTier = tierSel.value;
}

function refreshToolbarVisibility() {
    const show = (id, visible) => { document.getElementById(id).style.display = visible ? 'flex' : 'none'; };
    show('group-reveal-variant', state.screen === 'reveal');
    show('group-game-status', state.screen === 'game');
    show('group-game-loading', state.screen === 'game');
    show('group-gameover-mode', state.screen === 'gameover');
    show('group-gameover-tier', state.screen === 'gameover');
    show('group-intro-campaign-count', state.screen === 'intro');
    show('group-intro-mode-view', state.screen === 'intro');
}

function wireToolbar() {
    document.getElementById('sel-screen').addEventListener('change', e => {
        state.screen = e.target.value;
        refreshToolbarVisibility();
        renderPreview();
    });
    document.getElementById('sel-reveal-variant').addEventListener('change', e => {
        state.revealVariant = e.target.value;
        renderPreview();
    });
    document.getElementById('sel-game-status').addEventListener('change', e => {
        state.gameStatus = e.target.value;
        renderPreview();
    });
    document.getElementById('sel-game-loading').addEventListener('change', e => {
        state.gameLoading = e.target.value;
        renderPreview();
    });
    document.getElementById('sel-gameover-mode').addEventListener('change', e => {
        state.gameoverMode = e.target.value;
        refreshTierOptions();
        refreshToolbarVisibility();
        renderPreview();
    });
    document.getElementById('sel-gameover-tier').addEventListener('change', e => {
        state.gameoverTier = e.target.value;
        renderPreview();
    });
    document.getElementById('sel-intro-campaign-count').addEventListener('change', e => {
        state.introCampaignCount = e.target.value;
        renderPreview();
    });
    document.getElementById('sel-intro-mode-view').addEventListener('change', e => {
        state.introModeView = e.target.value;
        renderPreview();
    });

    document.getElementById('btn-export').addEventListener('click', exportJson);
    document.getElementById('btn-reset').addEventListener('click', resetToOriginal);
}

function exportJson() {
    const blob = new Blob([JSON.stringify(CONTENT, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ordem-paranormal-textos.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function resetToOriginal() {
    if (!confirm('Restaurar todos os textos para os originais do jogo? Isso apaga o que está salvo no navegador.')) return;
    Object.keys(CONTENT).forEach(k => delete CONTENT[k]);
    Object.assign(CONTENT, JSON.parse(JSON.stringify(ORIGINAL_CONTENT)));
    localStorage.removeItem(STORAGE_KEY);
    setSaveIndicator('Restaurado (nada salvo no navegador)');
    buildForm();
    renderPreview();
}

// ---------------------------------------------------------------- render

function renderCampaignButtons() {
    const wrap = document.getElementById('p-campaign-selector');
    wrap.innerHTML = '';
    CONTENT.campaigns.forEach((c, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn-campaign';
        btn.setAttribute('data-campaign', c.id);
        const isSelected =
            state.introCampaignCount === 'all' ||
            (state.introCampaignCount === 'one' && i === 5) ||
            (state.introCampaignCount === 'multi' && (i === 1 || i === 4 || i === 5));
        if (isSelected) btn.classList.add('active');
        btn.innerHTML = `<div class="campaign-title">${c.title}</div><p class="campaign-desc">${c.episodes}</p>`;
        wrap.appendChild(btn);
    });
}

function renderIntro() {
    const c = CONTENT.intro;
    setText('p-intro-mainTitle', c.mainTitle);

    let selectedCount;
    if (state.introCampaignCount === 'all') selectedCount = CONTENT.campaigns.length;
    else if (state.introCampaignCount === 'one') selectedCount = 1;
    else if (state.introCampaignCount === 'multi') selectedCount = 3;
    else selectedCount = 0;

    let subtitle;
    if (selectedCount === 0) subtitle = c.subtitleNeedOne;
    else if (selectedCount === CONTENT.campaigns.length) subtitle = c.subtitleAllSeasons;
    else if (selectedCount === 1) subtitle = CONTENT.campaigns[5].title;
    else subtitle = fillTemplate(c.subtitleMultiTemplate, { count: selectedCount });
    setText('p-intro-subtitle', subtitle);

    let desc;
    if (selectedCount === 0) desc = c.descNoneSelected;
    else if (selectedCount === 1) desc = fillTemplate(c.descSingleCampaignTemplate, { campaign: CONTENT.campaigns[5].introName });
    else desc = c.descMultiCampaigns;
    setHtml('p-intro-desc', selectedCount === CONTENT.campaigns.length && state.introCampaignCount === 'all' ? c.descAllCampaigns : desc);

    setText('p-intro-campaignsSectionTitle', c.campaignsSectionTitle);
    setText('p-intro-campaignHint', selectedCount === 1 ? c.campaignHintMustKeepOne : c.campaignHintDefault);
    renderCampaignButtons();

    setText('p-intro-modeSectionTitle', c.modeSectionTitle);
    setText('p-intro-historyBtn', c.historyBtn);
    setText('p-intro-dailyBadge', c.dailyBadge);
    setText('p-intro-dailyTitle', c.dailyTitle);
    setText('p-intro-dailyDesc', c.dailyDesc);
    setText('p-intro-btnShowOtherModes', c.btnShowOtherModes);
    setText('p-intro-btnBackToDaily', c.btnBackToDaily);
    setText('p-intro-classicTitle', c.classicTitle);
    setText('p-intro-classicDesc', c.classicDesc);
    setText('p-intro-infiniteTitle', c.infiniteTitle);
    setText('p-intro-infiniteDesc', c.infiniteDesc);
    setText('p-intro-duelBadge', c.duelBadge);
    setText('p-intro-duelTitle', c.duelTitle);
    setText('p-intro-duelDesc', c.duelDesc);

    setText('p-intro-multiplayerTitle', c.multiplayerTitle);
    setText('p-intro-createRoomTitle', c.createRoomTitle);
    setText('p-intro-createRoomInfo', c.createRoomInfo);
    setText('p-intro-btnCreateLobby', c.btnCreateLobby);
    setText('p-intro-orDivider', c.orDivider);
    setText('p-intro-joinRoomTitle', c.joinRoomTitle);
    setText('p-intro-joinRoomInfo', c.joinRoomInfo);
    document.getElementById('p-intro-codeInputPlaceholder').placeholder = c.codeInputPlaceholder;
    setText('p-intro-btnJoinLobby', c.btnJoinLobby);
    setText('p-intro-lobbyCodeLabel', c.lobbyCodeLabel);
    setText('p-intro-opponentStatusLabel', c.opponentStatusLabel);
    setText('p-intro-btnStartGame', c.btnStartGame);

    // Painel de modos: qual view mostrar
    const daily = document.getElementById('p-mode-view-daily');
    const others = document.getElementById('p-mode-view-others');
    const multiPanel = document.getElementById('p-multiplayer-panel');
    const statusBox = document.getElementById('p-lobby-status-box');
    const oppTag = document.getElementById('p-lobby-opponent-tag');

    daily.style.display = 'none';
    others.style.display = 'none';
    multiPanel.style.display = 'none';

    if (state.introModeView === 'daily') {
        daily.style.display = 'block';
    } else if (state.introModeView === 'others') {
        others.style.display = 'block';
    } else if (state.introModeView === 'multiplayer-create') {
        multiPanel.style.display = 'block';
        statusBox.style.display = 'flex';
        oppTag.style.display = 'none';
        setText('p-lobby-status-msg', CONTENT.lobby.roomCreated);
    } else if (state.introModeView === 'multiplayer-join') {
        multiPanel.style.display = 'block';
        statusBox.style.display = 'flex';
        oppTag.style.display = 'block';
        setText('p-lobby-status-msg', CONTENT.lobby.opponentReady);
        setText('p-lobby-opponent-status', fillTemplate(CONTENT.lobby.opponentTagTemplate, { name: 'Investigador_7' }).replace(/^Oponente:\s*/, ''));
    }
}

function renderGame() {
    const g = CONTENT.game;
    setText('p-game-labelRoundType', g.labelRoundType);
    setText('p-game-labelScore', g.labelScore);
    setText('p-game-labelSanity', g.labelSanity);
    setText('p-game-labelStreak', g.labelStreak);
    setText('p-game-loadingText', g.loadingText);
    setText('p-game-signalLostTitle', g.signalLostTitle);
    setText('p-game-status', g[state.gameStatus] || g.statusDefault);
    setText('p-game-btnHint', g.btnHint);
    setHtml('p-game-hintText', fillTemplate(g.hintTemplate, { date: '01/12' }));
    document.getElementById('p-game-btnReplayTitle').title = g.btnReplayTitle;
    setText('p-game-quizInstruction', g.quizInstruction);
    setText('p-game-btnQuit', g.btnQuit);

    document.getElementById('p-video-loading-screen').style.display = state.gameLoading === 'loading' ? 'flex' : 'none';
    document.getElementById('p-signal-lost-screen').style.display = state.gameLoading === 'signal-lost' ? 'flex' : 'none';
}

function renderReveal() {
    const r = CONTENT.reveal;
    setText('p-reveal-detailsTitle', r.detailsTitle);
    setText('p-reveal-btnWatchYoutube', r.btnWatchYoutube);
    setText('p-reveal-contextLabel', r.contextLabel);
    setText('p-reveal-contextExample', r.contextExample);
    // Contexto da Cena só existe no Diário (modo solo); no Duelo nunca aparece
    document.getElementById('p-reveal-context').style.display = state.revealVariant.startsWith('duel') ? 'none' : 'block';

    const banner = document.getElementById('p-reveal-banner');
    const icon = document.getElementById('p-reveal-icon');
    let title, subtitle, cls, iconTxt, nextLabel = r.btnNext;

    switch (state.revealVariant) {
        case 'correct':
            cls = 'correct'; iconTxt = '✓'; title = r.correctTitle;
            subtitle = fillTemplate(r.correctSubtitleTemplate, { streak: 3 });
            break;
        case 'wrong':
            cls = 'wrong'; iconTxt = '✗'; title = r.wrongTitle;
            subtitle = ''; // Sem subtítulo — campo removido
            break;
        case 'last-round':
            cls = 'correct'; iconTxt = '✓'; title = r.correctTitle;
            subtitle = fillTemplate(r.correctSubtitleTemplate, { streak: 5 });
            nextLabel = r.btnNextLast;
            break;
        case 'duel-win':
            cls = 'correct'; iconTxt = '⚔️'; title = r.duel.winTitle;
            subtitle = fillTemplate(r.duel.winSubtitleTemplate, { points: 500 });
            nextLabel = r.duel.btnAdvanceDuel;
            break;
        case 'duel-lose':
            cls = 'wrong'; iconTxt = '🛡️'; title = r.duel.loseTitle;
            subtitle = '';
            nextLabel = r.duel.btnWaitingHost;
            break;
        case 'duel-tie':
            cls = 'wrong'; iconTxt = '✗'; title = r.duel.tieTitle;
            subtitle = r.duel.tieSubtitle;
            nextLabel = r.duel.btnWaitingResults;
            break;
        case 'duel-timeout':
            cls = 'wrong'; iconTxt = '⌛'; title = r.duel.timeoutTitle;
            subtitle = r.duel.timeoutSubtitle;
            nextLabel = r.duel.btnDuelReport;
            break;
    }

    banner.className = 'reveal-result-banner ' + cls;
    icon.textContent = iconTxt;
    setText('p-reveal-title', title);
    setText('p-reveal-subtitle', subtitle);
    document.getElementById('p-reveal-subtitle').style.display = subtitle ? 'block' : 'none';
    setText('p-reveal-btnNext', nextLabel);
}

function renderGameover() {
    const o = CONTENT.gameover;
    setText('p-gameover-title', o.title);

    let cause;
    switch (state.gameoverMode) {
        case 'infinite': cause = o.causeInfinite; break;
        case 'duel': cause = o.causeDuel; break;
        default: cause = o.causeCompleted;
    }
    setText('p-gameover-cause', cause);

    setText('p-gameover-lblAccuracy', o.lblAccuracy);
    setText('p-gameover-lblStreak', o.lblStreak);
    setText('p-gameover-lblAvgTime', o.lblAvgTime);
    setText('p-gameover-rankSectionLabel', o.rankSectionLabel);
    setText('p-gameover-btnRetry', o.btnRetry);
    setText('p-gameover-btnHome', o.btnHome);

    let rank, desc;
    if (state.gameoverMode === 'duel') {
        const outcome = o.duelOutcomes[state.gameoverTier] || o.duelOutcomes.win;
        let my = 1200, op = 900;
        if (state.gameoverTier === 'lose') { my = 900; op = 1200; }
        else if (state.gameoverTier === 'tie') { my = 1000; op = 1000; }
        rank = outcome.rank;
        desc = fillTemplate(outcome.descTemplate, { opponent: 'Investigador_7', my, op });
        setText('p-gameover-accuracyValue', `Você: ${my} · Rival: ${op}`);
    } else {
        const tierIndex = Number(state.gameoverTier);
        const item = o.ranks[tierIndex] || o.ranks[0];
        rank = item.rank; desc = item.desc;
        setText('p-gameover-accuracyValue', `${tierIndex}/6`);
    }
    setText('p-gameover-rank', rank);
    setText('p-gameover-rankDesc', desc);
}

function renderModals() {
    const m = CONTENT.modals;
    setText('p-modal-dailyResultTitle', m.dailyResultTitle);
    setText('p-modal-dailyResultHeader', m.dailyResultHeader);
    setText('p-modal-dailyStatAccuracy', m.dailyStatAccuracy);
    setText('p-modal-dailyStatStreak', m.dailyStatStreak);
    setText('p-modal-dailyStatAvgTime', m.dailyStatAvgTime);
    setText('p-modal-dailyResultRank', m.dailyResultDefaultRank);
    setText('p-modal-dailyResultDesc', m.dailyResultDefaultDesc);
    setText('p-modal-calendarTitle', m.calendarTitle);

    const grid = document.getElementById('p-calendar-days-grid');
    if (grid && !grid.dataset.built) {
        grid.dataset.built = '1';
        for (let i = 1; i <= 30; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            if (i < 15) cell.classList.add('completed');
            if (i === 15) cell.classList.add('active');
            if (i > 20) cell.classList.add('future');
            cell.textContent = i;
            grid.appendChild(cell);
        }
    }
}

function renderPreview() {
    ['screen-intro', 'screen-game', 'screen-reveal', 'screen-gameover'].forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    document.getElementById('p-daily-result-modal').style.display = 'none';
    document.getElementById('p-calendar-modal').style.display = 'none';

    if (state.screen === 'modal-daily') {
        document.getElementById('screen-intro').classList.add('active');
        document.getElementById('p-daily-result-modal').style.display = 'flex';
    } else if (state.screen === 'modal-calendar') {
        document.getElementById('screen-intro').classList.add('active');
        document.getElementById('p-calendar-modal').style.display = 'flex';
    } else {
        document.getElementById('screen-' + state.screen).classList.add('active');
    }

    renderIntro();
    renderGame();
    renderReveal();
    renderGameover();
    renderModals();
}

// ---------------------------------------------------------------- init

loadFromStorage();
buildForm();
populateToolbar();
wireToolbar();
renderPreview();
if (localStorage.getItem(STORAGE_KEY)) {
    setSaveIndicator('Carregado do que estava salvo no navegador');
} else {
    setSaveIndicator('Nada salvo ainda — edite um campo para começar a salvar');
}
