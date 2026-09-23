/**
 * ORDEM PARANORMAL: HEXATOMBE - SCENE QUIZ
 * Lógica do Jogo, Corte Dinâmico de Vídeo (10s), Efeitos Sonoros (Web Audio) e Partículas (Canvas)
 */

let OST_DATABASE = []; // Database ativa dinâmica

const campaignMap = {
    'osnf': {
        db: OSNF_DATABASE,
        title: "O SEGREDO NA FLORESTA",
        intro: "O Segredo na Floresta",
        particleColor: 'earth'
    },
    'deconjuracao': {
        db: DECONJURACAO_DATABASE,
        title: "DESCONJURAÇÃO",
        intro: "Desconjuração",
        particleColor: 'occult'
    },
    'calamidade': {
        db: CALAMIDADE_DATABASE,
        title: "CALAMIDADE",
        intro: "Calamidade",
        particleColor: 'calamidade'
    },
    'osni': {
        db: OSNI_DATABASE,
        title: "O SEGREDO NA ILHA",
        intro: "O Segredo na Ilha",
        particleColor: 'osni'
    },
    'sdol': {
        db: SDOL_DATABASE,
        title: "SINAIS DO OUTRO LADO",
        intro: "Sinais do Outro Lado",
        particleColor: 'sdol'
    },
    'hexatombe': {
        db: HEXATOMBE_DATABASE,
        title: "HEXATOMBE",
        intro: "Hexatombe",
        particleColor: 'hexatombe'
    }
};

// Ordem canônica das temporadas (usada nas fatias do fundo e na seleção múltipla)
const CAMPAIGN_ORDER = ['osnf', 'deconjuracao', 'calamidade', 'osni', 'sdol', 'hexatombe'];

// Cor base de cada temporada no fundo dividido (uma derrete na outra)
const CAMPAIGN_BLEND_COLORS = {
    'osnf': 'rgba(13, 31, 16, 0.6)',
    'deconjuracao': 'rgba(31, 8, 11, 0.6)',
    'calamidade': 'rgba(29, 24, 9, 0.6)',
    'osni': 'rgba(7, 28, 23, 0.6)',
    'sdol': 'rgba(6, 27, 22, 0.6)',
    'hexatombe': 'rgba(30, 5, 5, 0.6)'
};

// Famílias de tom das temporadas. Selecionar temporadas do mesmo tom mantém a cor
// do tema; misturar tons diferentes deixa a interface branca e neutra.
const CAMPAIGN_TONE_GROUPS = {
    'osnf': 'verde',
    'osni': 'verde',
    'sdol': 'verde',
    'deconjuracao': 'vermelho',
    'hexatombe': 'vermelho',
    'calamidade': 'dourado'
};

// Tema neutro para seleções que misturam tons diferentes
const NEUTRAL_THEME = {
    '--color-theme': '#d8d8dd',
    '--color-theme-glow': 'rgba(255, 255, 255, 0.3)',
    '--color-theme-alt': '#ffffff',
    '--bg-card-theme': 'rgba(9, 9, 11, 0.9)',
    '--color-theme-text-hover': '#0c0c0e'
};

// Variáveis de tema aplicadas ao body quando há mais de uma temporada selecionada
const CAMPAIGN_THEMES = {
    'osnf': {
        '--color-theme': '#1D4A22',
        '--color-theme-glow': 'rgba(29, 74, 34, 0.65)',
        '--color-theme-alt': '#4ade80',
        '--bg-card-theme': 'rgba(0, 0, 0, 0.88)',
        '--color-theme-text-hover': '#ffffff'
    },
    'deconjuracao': {
        '--color-theme': '#8C1C2A',
        '--color-theme-glow': 'rgba(140, 28, 42, 0.5)',
        '--color-theme-alt': '#FF5252',
        '--bg-card-theme': 'rgba(12, 7, 8, 0.94)',
        '--color-theme-text-hover': '#ffffff'
    },
    'calamidade': {
        '--color-theme': '#CFB53B',
        '--color-theme-glow': 'rgba(207, 181, 59, 0.45)',
        '--color-theme-alt': '#FFE082',
        '--bg-card-theme': 'rgba(15, 13, 8, 0.94)',
        '--color-theme-text-hover': '#0c0c0e'
    },
    'osni': {
        '--color-theme': '#135E4E',
        '--color-theme-glow': 'rgba(19, 94, 78, 0.65)',
        '--color-theme-alt': '#55D29C',
        '--bg-card-theme': 'rgba(8, 20, 18, 0.88)',
        '--color-theme-text-hover': '#ffffff'
    },
    'sdol': {
        '--color-theme': '#056f57',
        '--color-theme-glow': 'rgba(5, 111, 87, 0.65)',
        '--color-theme-alt': '#05cf9f',
        '--bg-card-theme': 'rgba(6, 16, 14, 0.88)',
        '--color-theme-text-hover': '#ffffff'
    },
    'hexatombe': {
        '--color-theme': '#8A0303',
        '--color-theme-glow': 'rgba(138, 3, 3, 0.65)',
        '--color-theme-alt': '#ef4444',
        '--bg-card-theme': 'rgba(16, 6, 6, 0.86)',
        '--color-theme-text-hover': '#ffffff'
    }
};

// ==========================================
// CONFIGURAÇÃO DOS EFEITOS SONOROS (WEB AUDIO)
// ==========================================
class SpookySoundSynthesizer {
    constructor() {
        this.ctx = null;
        this.enabled = false;
        this.heartbeatTimer = null;
    }

    init() {}
    setEnabled(bool) {}
    playClick() {}
    playSuccess() {}
    playError() {}
    playJumpscare() {}
    startHeartbeat() {}
    setHeartbeatSpeed() {}
    stopHeartbeat() {}
    _triggerBeat() {}
    startAtmosphere() {}
    stopAtmosphere() {}
}

const sfx = new SpookySoundSynthesizer();

// ==========================================
// PARTÍCULAS AMBIENTAIS DE FUNDO (CANVAS)
// ==========================================
class AmbientParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 40;
        this.colorType = 'normal'; // normal (purple/gray), tension (red/vermillion), success (cyan glow)
        this.animationId = null;

        this.resize = this.resize.bind(this);
        this.animate = this.animate.bind(this);
    }

    init() {
        window.addEventListener('resize', this.resize);
        this.resize();
        this.createParticles();
        // Animação desativada para máxima performance e visual limpo estático
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.newParticle(true));
        }
    }

    newParticle(randomY = false) {
        return {
            x: Math.random() * this.canvas.width,
            y: randomY ? Math.random() * this.canvas.height : this.canvas.height + 20,
            size: Math.random() * 3 + 1,
            speedY: -(Math.random() * 0.5 + 0.15),
            speedX: (Math.random() - 0.5) * 0.2,
            opacity: Math.random() * 0.4 + 0.1,
            fadeSpeed: Math.random() * 0.0015 + 0.0005
        };
    }

    setColorType(type) {
        this.colorType = type;
        if (type === 'tension') {
            this.maxParticles = 65;
        } else {
            this.maxParticles = 40;
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const activeCamp = (typeof quizApp !== 'undefined' && quizApp) ? quizApp.activeCampaign : 'hexatombe';
        
        this.particles.forEach((p, idx) => {
            p.y += p.speedY;
            p.x += p.speedX;
            
            if (this.colorType === 'tension') {
                p.speedY = -(Math.random() * 1.5 + 0.7);
                p.speedX += (Math.random() - 0.5) * 0.15;
            } else if (this.colorType === 'success') {
                p.speedY = -(Math.random() * 0.6 + 0.25);
                p.speedX = (Math.random() - 0.5) * 0.2;
            } else {
                p.speedY = -(Math.random() * 0.35 + 0.1);
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            
            let color = 'rgba(138, 3, 3, '; // Padrão Hexatombe Escarlate
            let shadowColor = '#8A0303';
            
            if (this.colorType === 'success') {
                // Sucesso dinâmico por campanha
                if (activeCamp === 'osnf') {
                    color = 'rgba(74, 222, 128, ';
                    shadowColor = '#4ade80';
                } else if (activeCamp === 'deconjuracao') {
                    color = 'rgba(192, 132, 252, ';
                    shadowColor = '#c084fc';
                } else if (activeCamp === 'calamidade') {
                    color = 'rgba(207, 181, 59, ';
                    shadowColor = '#CFB53B';
                } else if (activeCamp === 'osni') {
                    color = 'rgba(85, 210, 156, ';
                    shadowColor = '#55D29C';
                } else if (activeCamp === 'sdol') {
                    color = 'rgba(5, 207, 159, ';
                    shadowColor = '#05cf9f';
                } else { // hexatombe
                    color = 'rgba(239, 68, 68, ';
                    shadowColor = '#ef4444';
                }
            } else if (this.colorType === 'tension') {
                // Tensão dinâmica por campanha
                if (activeCamp === 'osnf') {
                    if (Math.random() > 0.4) {
                        color = 'rgba(20, 20, 20, '; // Cinzas pretas de morte
                        shadowColor = '#000000';
                    } else {
                        color = 'rgba(239, 68, 68, ';
                        shadowColor = '#ef4444';
                    }
                } else if (activeCamp === 'deconjuracao') {
                    if (Math.random() > 0.6) {
                        color = 'rgba(140, 28, 42, '; // Vermelho vinho rico
                        shadowColor = '#8C1C2A';
                    } else {
                        color = 'rgba(255, 82, 82, '; // Vermelho carmesim brilhante
                        shadowColor = '#FF5252';
                    }
                } else if (activeCamp === 'calamidade') {
                    color = 'rgba(139, 0, 0, '; // Vermelho escuro Kian/Diabo
                    shadowColor = '#8B0000';
                } else if (activeCamp === 'osni') {
                    if (Math.random() > 0.5) {
                        color = 'rgba(19, 94, 78, ';
                        shadowColor = '#135E4E';
                    } else {
                        color = 'rgba(239, 68, 68, ';
                        shadowColor = '#ef4444';
                    }
                } else if (activeCamp === 'sdol') {
                    if (Math.random() > 0.5) {
                        color = 'rgba(5, 111, 87, ';
                        shadowColor = '#056f57';
                    } else {
                        color = 'rgba(239, 68, 68, ';
                        shadowColor = '#ef4444';
                    }
                } else { // hexatombe
                    color = 'rgba(102, 0, 0, '; // Vermelho Sangue Profundo
                    shadowColor = '#660000';
                }
            } else {
                // Idle states
                if (this.colorType === 'earth') {
                    color = 'rgba(29, 74, 34, ';
                    shadowColor = '#1D4A22';
                } else if (this.colorType === 'occult') {
                    color = 'rgba(140, 28, 42, '; // Vinho rico
                    shadowColor = '#8C1C2A';
                } else if (this.colorType === 'calamidade') {
                    if (Math.random() > 0.85) {
                        color = 'rgba(139, 0, 0, ';
                        shadowColor = '#8B0000';
                    } else {
                        color = 'rgba(207, 181, 59, ';
                        shadowColor = '#CFB53B';
                    }
                } else if (this.colorType === 'osni') {
                    color = 'rgba(19, 94, 78, ';
                    shadowColor = '#135E4E';
                } else if (this.colorType === 'sdol') {
                    if (Math.random() > 0.5) {
                        color = 'rgba(5, 111, 87, ';
                        shadowColor = '#056f57';
                    } else {
                        color = 'rgba(5, 207, 159, ';
                        shadowColor = '#05cf9f';
                    }
                } else if (this.colorType === 'hexatombe') {
                    color = 'rgba(138, 3, 3, ';
                    shadowColor = '#8A0303';
                } else { // Fallback standard
                    color = 'rgba(138, 3, 3, ';
                    shadowColor = '#8A0303';
                }
            }
            
            this.ctx.fillStyle = color + p.opacity + ')';
            this.ctx.fill();

            if (p.y < -10 || p.x < -10 || p.x > this.canvas.width + 10) {
                this.particles[idx] = this.newParticle(false);
            }
        });

        this.animationId = requestAnimationFrame(this.animate);
    }
}

const particles = new AmbientParticleSystem('ambient-particles');

// ==========================================
// GERENCIADOR DE ESTADO E LÓGICA DO QUIZ
// ==========================================
class OrdemSceneQuiz {
    constructor() {
        this.screens = {
            intro: document.getElementById('screen-intro'),
            game: document.getElementById('screen-game'),
            reveal: document.getElementById('screen-reveal'),
            gameover: document.getElementById('screen-gameover')
        };
        
        this.buttons = {
            start: document.getElementById('btn-start-game'),
            playPause: document.getElementById('btn-play-pause'),
            replay: document.getElementById('btn-replay'),
            nextRound: document.getElementById('btn-next-round'),
            retry: document.getElementById('btn-retry'),
            home: document.getElementById('btn-home'),
            quit: document.getElementById('btn-quit-game'),
            hint: document.getElementById('btn-hint'),
            createLobby: document.getElementById('btn-create-lobby'),
            joinLobby: document.getElementById('btn-join-lobby')
        };

        this.hud = {
            round: document.getElementById('hud-round'),
            score: document.getElementById('hud-score'),
            streak: document.getElementById('hud-streak'),
            heartsContainer: document.getElementById('hud-sanity-container'),
            hearts: document.getElementById('hud-sanity-hearts'),
            roundType: document.getElementById('label-round-type')
        };

        this.player = {
            status: document.getElementById('player-status'),
            currentVal: document.getElementById('track-time-current'),
            totalVal: document.getElementById('track-time-total'),
            progressFill: document.getElementById('track-progress-fill')
        };

        this.timer = {
            box: document.getElementById('timer-box'),
            bar: document.getElementById('timer-bar')
        };

        this.reveal = {
            banner: document.getElementById('reveal-banner'),
            icon: document.getElementById('reveal-banner-icon'),
            title: document.getElementById('reveal-banner-title'),
            subtitle: document.getElementById('reveal-banner-subtitle'),
            ytLink: document.getElementById('btn-youtube-link'),
            context: document.getElementById('reveal-context'),
            contextText: document.getElementById('reveal-context-text'),
            elementBg: document.getElementById('reveal-element-bg')
        };

        this.gameover = {
            accuracy: document.getElementById('stat-accuracy'),
            streak: document.getElementById('stat-max-streak'),
            avgTime: document.getElementById('stat-avg-time'),
            rank: document.getElementById('stat-rank'),
            rankDesc: document.getElementById('stat-rank-desc'),
            cause: document.getElementById('gameover-cause')
        };

        // Estado do Jogo
        this.gameMode = 'daily'; // daily, classic, infinite, duel
        this.activeCampaign = null; // Temporada da cena atual (muda a cada rodada)
        this.selectedCampaigns = []; // Temporadas marcadas no menu (seleção múltipla)
        this.dailyAdjustments = {}; // Ajustes do /admin por dia: { 'AAAA-MM-DD': { temporada: { tentativa, contexto } } }
        this.isStartingGame = false;
        
        // Estado do Modo Diário com Histórico (Calendário)
        const today = new Date();
        this.selectedDailyDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        this.calendarYear = today.getFullYear();
        this.calendarMonth = today.getMonth(); // 0-indexed
        this.currentRound = 0;
        this.totalRounds = 10;
        this.streak = 0;
        this.maxStreak = 0;
        this.totalAcertos = 0;
        this.totalTempoResposta = 0;
        this.roundLog = []; // Resultado de cada cena respondida, enviado para as estatísticas gerais

        this.gamePlaylist = [];
        this.currentTrackIndex = -1;
        this.currentTrack = null;

        // Player YouTube & Temporizadores
        this.ytPlayer = null;
        this.ytPlayerReady = false;
        this.isPlaying = false;
        this.progressInterval = null;

        this.roundTimerDuration = 10; // Cenas duram exatamente 10s no quiz
        this.roundTimeRemaining = 10;
        this.roundTimerInterval = null;
        this.roundTimerStarted = false; // Já contou nesta cena? (evita zerar ao despausar)
        this.hasAnswered = false;

        this.cuedStartSeconds = 0;
        this.sceneEnded = false;
        this.replaysUsed = 0;
        this.isSeeking = false;
        
        // Recurso de Dica: desativado, apenas exibe um aviso ao passar o mouse no ícone "?"
        const hintTooltipEl = document.getElementById('hint-tooltip');
        if (hintTooltipEl) {
            const hintAvailableDate = (window.APP_CONFIG && window.APP_CONFIG.hintAvailableDate) || 'em breve';
            hintTooltipEl.innerHTML = `Este recurso é um trabalho manual da equipe de desenvolvimento e estará disponível a partir de <strong>${hintAvailableDate}</strong>.`;
        }
        this.usedHint = false;

        // Estado Multiplayer (Modo Duelo)
        this.socket = null;
        this.roomId = null;
        this.role = null; // 'host' or 'guest'
        this.opponentName = null;
        this.duelScores = { host: 0, guest: 0 };
        this.isLockedOut = false;
        this.playerName = "";

        // Controles de Volume In-game
        this.gameVolumeSlider = document.getElementById('game-volume-slider');
        this.gameVolumeDisplay = document.getElementById('game-volume-display');
        this.gameMuteToggle = document.getElementById('game-mute-toggle');

        document.body.className = "menu-active"; // Inicia com o fundo neutro de cimento queimado
        this.setupEventListeners();
        
        // Inicializa o subtítulo da temporada de forma estática
        const subtitleEl = document.getElementById('app-season-subtitle');
        if (subtitleEl) subtitleEl.innerText = "Selecione uma Campanha";
        
        this.checkDailyStatus();
    }

    setupEventListeners() {
        const fixedSeal = document.getElementById('fixed-seal-logo');
        if (fixedSeal) {
            fixedSeal.addEventListener('click', () => {
                if (typeof sfx !== 'undefined') sfx.playClick();
                if (this.screens.game.classList.contains('active') || this.screens.reveal.classList.contains('active')) {
                    if (confirm("Deseja mesmo abandonar a investigação e voltar ao menu?")) {
                        window.location.reload();
                    }
                } else {
                    this.showScreen('intro');
                    if (typeof particles !== 'undefined') {
                        particles.setColorType(this.getActiveCampaignParticleColor());
                    }
                    if (this.socket) {
                        this.socket.send(JSON.stringify({ type: 'QUIT_GAME' }));
                        this.socket.close();
                    }
                }
            });
        }

        const volumeSlider = document.getElementById('volume-slider');
        const volumeDisplay = document.getElementById('volume-display');
        const muteToggle = document.getElementById('btn-mute-toggle');

        volumeSlider.addEventListener('input', (e) => {
            const vol = e.target.value;
            volumeDisplay.innerText = `${vol}%`;
            this.gameVolumeSlider.value = vol;
            this.gameVolumeDisplay.innerText = `${vol}%`;
            if (this.ytPlayer && this.ytPlayerReady) {
                this.ytPlayer.setVolume(vol);
            }
            this.updateVolumeIcons(vol);
        });

        muteToggle.addEventListener('click', () => {
            const vol = volumeSlider.value > 0 ? 0 : 80;
            volumeSlider.value = vol;
            volumeDisplay.innerText = `${vol}%`;
            this.gameVolumeSlider.value = vol;
            this.gameVolumeDisplay.innerText = `${vol}%`;
            if (this.ytPlayer && this.ytPlayerReady) {
                this.ytPlayer.setVolume(vol);
            }
            this.updateVolumeIcons(vol);
        });

        this.gameVolumeSlider.addEventListener('input', (e) => {
            const vol = e.target.value;
            this.gameVolumeDisplay.innerText = `${vol}%`;
            volumeSlider.value = vol;
            volumeDisplay.innerText = `${vol}%`;
            if (this.ytPlayer && this.ytPlayerReady) {
                this.ytPlayer.setVolume(vol);
            }
            this.updateVolumeIcons(vol);
        });

        this.gameMuteToggle.addEventListener('click', () => {
            const vol = this.gameVolumeSlider.value > 0 ? 0 : 80;
            this.gameVolumeSlider.value = vol;
            this.gameVolumeDisplay.innerText = `${vol}%`;
            volumeSlider.value = vol;
            volumeDisplay.innerText = `${vol}%`;
            if (this.ytPlayer && this.ytPlayerReady) {
                this.ytPlayer.setVolume(vol);
            }
            this.updateVolumeIcons(vol);
        });

        // Seletores de Modo
        const modeButtons = document.querySelectorAll('.btn-mode');
        const mPanel = document.getElementById('multiplayer-panel');
        const setupContainer = document.querySelector('.setup-container');
        const campSelectorContainer = document.getElementById('campaign-selection-container');

        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnClicked = e.currentTarget;
                sfx.playClick();
                modeButtons.forEach(b => b.classList.remove('active'));
                btnClicked.classList.add('active');
                this.gameMode = btnClicked.getAttribute('data-mode');
                
                // Mostrar/ocultar seletor de temporadas com base no modo
                if (this.gameMode === 'daily') {
                    if (campSelectorContainer) campSelectorContainer.style.display = 'none';
                } else {
                    if (campSelectorContainer) campSelectorContainer.style.display = 'block';
                    // Ao entrar em qualquer modo livre, todas as temporadas vêm selecionadas
                    if (this.selectedCampaigns.length === 0) {
                        this.selectAllCampaigns();
                    }
                    document.body.className = "menu-active";
                }

                if (this.gameMode === 'duel') {
                    mPanel.style.display = 'block';
                    setupContainer.style.display = 'none';
                } else {
                    mPanel.style.display = 'none';
                    setupContainer.style.display = 'block';
                    if (this.socket) {
                        this.socket.close();
                    }
                }
                
                this.checkDailyStatus();
            });
        });

        // Controles de Transição de Visualização de Modos
        const btnShowOtherModes = document.getElementById('btn-show-other-modes');
        const btnBackToDaily = document.getElementById('btn-back-to-daily');
        const modeViewDaily = document.getElementById('mode-view-daily');
        const modeViewOthers = document.getElementById('mode-view-others');

        if (btnShowOtherModes) {
            btnShowOtherModes.addEventListener('click', () => {
                sfx.playClick();
                if (modeViewDaily) modeViewDaily.style.display = 'none';
                if (modeViewOthers) modeViewOthers.style.display = 'block';
                
                // Seleciona o modo clássico por padrão ao ver outros modos
                const classicBtn = document.getElementById('btn-mode-classic');
                if (classicBtn) {
                    modeButtons.forEach(b => b.classList.remove('active'));
                    classicBtn.classList.add('active');
                    this.gameMode = 'classic';
                    if (campSelectorContainer) campSelectorContainer.style.display = 'block';
                    // Modo Clássico começa com todas as temporadas selecionadas
                    document.body.className = "menu-active";
                    this.selectAllCampaigns();
                }
                this.checkDailyStatus();
            });
        }

        if (btnBackToDaily) {
            btnBackToDaily.addEventListener('click', () => {
                sfx.playClick();
                if (modeViewOthers) modeViewOthers.style.display = 'none';
                if (modeViewDaily) modeViewDaily.style.display = 'block';
                
                // Seleciona o modo diário de volta
                const dailyBtn = document.getElementById('btn-mode-daily');
                if (dailyBtn) {
                    modeButtons.forEach(b => b.classList.remove('active'));
                    dailyBtn.classList.add('active');
                    this.gameMode = 'daily';
                    if (campSelectorContainer) campSelectorContainer.style.display = 'none';
                    
                    // Reset da estilização visual para o estado neutro/Modo Diário
                    this.setSelectedCampaigns([]);
                    document.body.className = "menu-active";
                    particles.setColorType('normal');

                    const descEl = document.getElementById('intro-description');
                    if (descEl) {
                        descEl.innerHTML = `Assista a um trecho de <strong>10 segundos</strong> de um episódio de cada temporada e adivinhe qual é o episódio.`;
                    }

                    const subtitleEl = document.getElementById('app-season-subtitle');
                    if (subtitleEl) {
                        subtitleEl.className = "subtitle";
                        subtitleEl.innerText = "Selecione uma Campanha";
                    }

                    // Esconde painel de duelo e garante socket fechado
                    mPanel.style.display = 'none';
                    setupContainer.style.display = 'block';
                    if (this.socket) {
                        this.socket.close();
                    }
                }
                this.checkDailyStatus();
            });
        }

        // Botões Multiplayer
        this.buttons.createLobby.addEventListener('click', () => {
            sfx.playClick();
            this.playerName = prompt("Insira seu nome de Agente (Host):", "Host Agente") || "Host Agente";
            this.connectWebSocket();
            setTimeout(() => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({ type: 'CREATE_ROOM', name: this.playerName }));
                }
            }, 500);
        });

        this.buttons.joinLobby.addEventListener('click', () => {
            sfx.playClick();
            const code = document.getElementById('lobby-code-input').value.trim();
            if (code.length !== 4) {
                alert("Por favor, insira o código de 4 dígitos da sala do seu oponente.");
                return;
            }
            this.playerName = prompt("Insira seu nome de Agente (Convidado):", "Convidado Agente") || "Convidado Agente";
            this.connectWebSocket();
            setTimeout(() => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({ type: 'JOIN_ROOM', code, name: this.playerName }));
                }
            }, 500);
        });

        // Seletores de Temporada (seleção múltipla: clicar tira/coloca a temporada)
        const campaignButtons = document.querySelectorAll('.btn-campaign');
        const campaignHint = document.getElementById('campaign-hint');

        campaignButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnClicked = e.currentTarget;
                const campId = btnClicked.getAttribute('data-campaign');
                sfx.playClick();

                document.body.className = "menu-active";
                const changed = this.toggleCampaign(campId);

                if (!changed && campaignHint) {
                    // Bloqueio: não dá para tirar a última temporada da investigação
                    campaignHint.innerText = "Você precisa manter ao menos uma temporada na investigação.";
                    clearTimeout(this.campaignHintTimer);
                    this.campaignHintTimer = setTimeout(() => {
                        campaignHint.innerText = "Todas as temporadas começam selecionadas. Clique para remover as que não quiser na investigação.";
                    }, 2600);
                }
            });
        });

        // Botões de Navegação
        this.buttons.start.addEventListener('click', () => {
            sfx.playClick();
            if (this.gameMode === 'daily') {
                const dateStr = this.selectedDailyDate;
                if (this.isDailyCompleted(dateStr)) {
                    // Abre a modal com os resultados salvos!
                    this.openDailyResultModal(dateStr);
                    return;
                }
            }

            if (this.gameMode === 'duel') {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({
                        type: 'START_GAME',
                        // Lista de temporadas selecionadas (compatível com o campo antigo)
                        campaign: this.selectedCampaigns.join(',')
                    }));
                }
            } else {
                this.startGame();
            }
        });

        // Controles de fechamento da modal diária
        const modal = document.getElementById('daily-result-modal');
        const closeBtn = document.getElementById('modal-close-btn');
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                sfx.playClick();
                modal.style.display = 'none';
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    sfx.playClick();
                    modal.style.display = 'none';
                }
            });
        }

        // Controles do Calendário Diário
        const btnOpenCalendar = document.getElementById('btn-open-calendar');
        const calendarModal = document.getElementById('calendar-modal');
        const calendarCloseBtn = document.getElementById('calendar-modal-close-btn');
        const btnPrevMonth = document.getElementById('btn-calendar-prev');
        const btnNextMonth = document.getElementById('btn-calendar-next');

        if (btnOpenCalendar && calendarModal) {
            btnOpenCalendar.addEventListener('click', () => {
                sfx.playClick();
                // Reseta a visualização do calendário para o mês de hoje ao abrir
                const today = new Date();
                this.calendarYear = today.getFullYear();
                this.calendarMonth = today.getMonth();
                this.renderCalendar();
                calendarModal.style.display = 'flex';
            });
        }

        if (calendarCloseBtn && calendarModal) {
            calendarCloseBtn.addEventListener('click', () => {
                sfx.playClick();
                calendarModal.style.display = 'none';
            });
            calendarModal.addEventListener('click', (e) => {
                if (e.target === calendarModal) {
                    sfx.playClick();
                    calendarModal.style.display = 'none';
                }
            });
        }

        if (btnPrevMonth) {
            btnPrevMonth.addEventListener('click', () => {
                const prevYear = this.calendarMonth === 0 ? this.calendarYear - 1 : this.calendarYear;
                const prevMonth = this.calendarMonth === 0 ? 11 : this.calendarMonth - 1;
                if (!this.isCalendarMonthAllowed(prevYear, prevMonth)) return;
                sfx.playClick();
                this.calendarYear = prevYear;
                this.calendarMonth = prevMonth;
                this.renderCalendar();
            });
        }

        if (btnNextMonth) {
            btnNextMonth.addEventListener('click', () => {
                const nextYear = this.calendarMonth === 11 ? this.calendarYear + 1 : this.calendarYear;
                const nextMonth = this.calendarMonth === 11 ? 0 : this.calendarMonth + 1;
                if (!this.isCalendarMonthAllowed(nextYear, nextMonth)) return;
                sfx.playClick();
                this.calendarYear = nextYear;
                this.calendarMonth = nextMonth;
                this.renderCalendar();
            });
        }

        this.buttons.playPause.addEventListener('click', () => {
            sfx.playClick();
            this.togglePlayPause();
        });

        if (this.buttons.replay) {
            this.buttons.replay.addEventListener('click', () => {
                sfx.playClick();
                this.replayScene();
            });
        }

        this.buttons.nextRound.addEventListener('click', () => {
            sfx.playClick();
            if (this.gameMode === 'duel') {
                if (this.socket && this.socket.readyState === WebSocket.OPEN && this.role === 'host') {
                    this.socket.send(JSON.stringify({ type: 'NEXT_ROUND' }));
                }
            } else {
                this.advanceGameFlow();
            }
        });

        this.buttons.retry.addEventListener('click', () => {
            sfx.playClick();
            if (this.gameMode === 'duel') {
                alert("Em modo de Duelo, crie um novo lobby para recomeçar!");
                this.showScreen('intro');
            } else {
                this.startGame();
            }
        });

        this.buttons.home.addEventListener('click', () => {
            sfx.playClick();
            this.showScreen('intro');
            particles.setColorType(this.getActiveCampaignParticleColor());
            if (this.socket) {
                this.socket.send(JSON.stringify({ type: 'QUIT_GAME' }));
                this.socket.close();
            }
        });

        this.buttons.quit.addEventListener('click', () => {
            sfx.playClick();
            const msg = this.gameMode === 'infinite'
                ? "Encerrar a investigação infinita e ver o seu relatório?"
                : "Deseja mesmo abandonar a investigação?";

            if (confirm(msg)) {
                if (this.socket) {
                    this.socket.send(JSON.stringify({ type: 'QUIT_GAME' }));
                    this.socket.close();
                }
                // No modo infinito não existe fim natural: encerrar mostra o relatório
                this.endGame(this.gameMode !== 'infinite');
            }
        });

        // Botão de Dica: permanece desativado (recurso em desenvolvimento, ver tooltip do ícone "?")
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
        
        if (screenName === 'gameover') {
            document.body.className = "menu-active";
            this.clearSeasonThemeVars();
            this.hideSeasonBackground();
            particles.setColorType('normal');
        } else if (screenName === 'intro') {
            // Volta ao fundo dividido das temporadas selecionadas
            this.restoreMenuBackground();
        } else {
            document.body.classList.remove('menu-active');
        }
    }

    // ==========================================
    // SELEÇÃO MÚLTIPLA DE TEMPORADAS
    // ==========================================
    sortCampaigns(list) {
        return CAMPAIGN_ORDER.filter(id => list.includes(id));
    }

    selectAllCampaigns() {
        this.setSelectedCampaigns([...CAMPAIGN_ORDER]);
    }

    toggleCampaign(id) {
        const isSelected = this.selectedCampaigns.includes(id);
        // Pelo menos uma temporada precisa continuar na investigação
        if (isSelected && this.selectedCampaigns.length === 1) return false;

        const next = isSelected
            ? this.selectedCampaigns.filter(c => c !== id)
            : [...this.selectedCampaigns, id];

        this.setSelectedCampaigns(next);
        return true;
    }

    setSelectedCampaigns(list) {
        this.selectedCampaigns = this.sortCampaigns(list);

        // A primeira temporada da seleção comanda o tema dos cards e das partículas
        this.activeCampaign = this.selectedCampaigns[0] || null;
        OST_DATABASE = this.activeCampaign ? campaignMap[this.activeCampaign].db : [];

        document.querySelectorAll('.btn-campaign').forEach(btn => {
            btn.classList.toggle('active', this.selectedCampaigns.includes(btn.getAttribute('data-campaign')));
        });

        this.applySeasonTheme();
        this.renderSeasonBackground();
        this.updateCampaignTexts();

        if (typeof particles !== 'undefined') {
            particles.setColorType(this.getActiveCampaignParticleColor());
        }
    }

    // Todas as temporadas selecionadas pertencem à mesma família de tom?
    hasSingleTone() {
        if (this.selectedCampaigns.length === 0) return false;
        const tone = CAMPAIGN_TONE_GROUPS[this.selectedCampaigns[0]];
        return this.selectedCampaigns.every(id => CAMPAIGN_TONE_GROUPS[id] === tone);
    }

    applySeasonTheme() {
        // Tons iguais mantêm a cor da temporada; tons misturados deixam a UI branca
        const theme = this.selectedCampaigns.length === 0
            ? null
            : (this.hasSingleTone() ? CAMPAIGN_THEMES[this.selectedCampaigns[0]] : NEUTRAL_THEME);

        Object.keys(NEUTRAL_THEME).forEach(varName => {
            if (theme) {
                document.body.style.setProperty(varName, theme[varName]);
            } else {
                document.body.style.removeProperty(varName);
            }
        });
    }

    clearSeasonThemeVars() {
        Object.keys(NEUTRAL_THEME).forEach(varName => {
            document.body.style.removeProperty(varName);
        });
    }

    // Degradê contínuo com a cor de cada temporada: cada cor domina a sua faixa
    // e derrete na vizinha no meio do caminho, sem emenda visível
    buildBlendGradient(list) {
        if (list.length === 0) return 'none';

        const colors = list.map(id => CAMPAIGN_BLEND_COLORS[id]);
        if (colors.length === 1) {
            return `linear-gradient(var(--blend-angle, 90deg), ${colors[0]} 0%, ${colors[0]} 100%)`;
        }

        const n = colors.length;
        const stops = [`${colors[0]} 0%`];
        colors.forEach((color, i) => {
            stops.push(`${color} ${(100 * (i + 0.5) / n).toFixed(2)}%`);
        });
        stops.push(`${colors[n - 1]} 100%`);

        return `linear-gradient(var(--blend-angle, 90deg), ${stops.join(', ')})`;
    }

    // Troca a camada de cor com um crossfade, no mesmo tempo da animação das fatias
    updateBlendUnderlay(layer, list) {
        const gradient = this.buildBlendGradient(list);
        const current = layer.querySelector('.blend-underlay.visible');
        if (current && current.dataset.gradient === gradient) return;

        layer.querySelectorAll('.blend-underlay').forEach(old => {
            old.classList.remove('visible');
            setTimeout(() => old.remove(), 900);
        });

        if (list.length === 0) return;

        const underlay = document.createElement('div');
        underlay.className = 'blend-underlay';
        underlay.dataset.gradient = gradient;
        underlay.style.backgroundImage = gradient;
        layer.appendChild(underlay);
        requestAnimationFrame(() => requestAnimationFrame(() => underlay.classList.add('visible')));
    }

    // Monta o fundo dividido: uma fatia por temporada selecionada
    renderSeasonBackground() {
        const layer = document.getElementById('season-blend-bg');
        if (!layer) return;

        const list = this.selectedCampaigns;

        this.updateBlendUnderlay(layer, list);

        // Cria as fatias que faltam (entram encolhidas e crescem)
        list.forEach(id => {
            if (!layer.querySelector(`.season-slice[data-campaign="${id}"]`)) {
                const slice = document.createElement('div');
                slice.className = 'season-slice removing';
                slice.setAttribute('data-campaign', id);
                layer.appendChild(slice);
            }
        });

        // Mantém as fatias na ordem canônica das temporadas
        CAMPAIGN_ORDER.forEach(id => {
            const slice = layer.querySelector(`.season-slice[data-campaign="${id}"]`);
            if (slice) layer.appendChild(slice);
        });

        // Estado final: quem ficou ocupa o espaço, quem saiu encolhe e some
        requestAnimationFrame(() => requestAnimationFrame(() => {
            layer.querySelectorAll('.season-slice').forEach(slice => {
                const id = slice.getAttribute('data-campaign');
                if (list.includes(id)) {
                    slice.classList.remove('removing');
                } else if (!slice.classList.contains('removing')) {
                    slice.classList.add('removing');
                    setTimeout(() => {
                        if (slice.classList.contains('removing')) slice.remove();
                    }, 900);
                }
            });
        }));

        layer.classList.toggle('active', list.length > 0);
    }

    hideSeasonBackground() {
        const layer = document.getElementById('season-blend-bg');
        if (layer) layer.classList.remove('active');
    }

    updateCampaignTexts() {
        const subtitleEl = document.getElementById('app-season-subtitle');
        const descEl = document.getElementById('intro-description');
        const count = this.selectedCampaigns.length;

        if (subtitleEl) {
            subtitleEl.className = "subtitle" + (this.selectedCampaigns[0] ? " " + this.selectedCampaigns[0] : "");
            if (count === 0) {
                subtitleEl.innerText = "Selecione ao menos uma temporada";
            } else if (count === 1) {
                subtitleEl.innerText = campaignMap[this.selectedCampaigns[0]].title;
            } else if (count === CAMPAIGN_ORDER.length) {
                subtitleEl.innerText = "TODAS AS TEMPORADAS";
            } else {
                subtitleEl.innerText = `${count} TEMPORADAS SELECIONADAS`;
            }
        }

        if (descEl) {
            if (count === 1) {
                descEl.innerHTML = `Assista a um trecho de <strong>10 segundos</strong> retirado aleatoriamente de qualquer episódio da campanha de <strong>${campaignMap[this.selectedCampaigns[0]].intro}</strong> e adivinhe qual é o episódio.`;
            } else if (count > 1) {
                descEl.innerHTML = `Assista a trechos de <strong>10 segundos</strong> retirados aleatoriamente das temporadas selecionadas e adivinhe qual é o episódio.`;
            } else {
                descEl.innerHTML = `Selecione ao menos uma temporada para iniciar a investigação.`;
            }
        }
    }

    // Playlist de cenas somente das temporadas selecionadas
    getSelectedPlaylist() {
        const playlist = [];
        this.selectedCampaigns.forEach(id => {
            const camp = campaignMap[id];
            if (!camp || !camp.db) return;
            camp.db.forEach(ep => {
                const track = { ...ep };
                track.campaignId = id;
                playlist.push(track);
            });
        });
        return playlist;
    }

    // Aplica a temporada da cena da rodada atual (tema, fundo, opções)
    applyRoundCampaign(campId) {
        const campData = campaignMap[campId];
        if (!campData) return;

        this.activeCampaign = campId;
        OST_DATABASE = campData.db;
        this.clearSeasonThemeVars();
        this.hideSeasonBackground();
        document.body.className = "bg-" + campId;
        if (typeof particles !== 'undefined') {
            particles.setColorType(campData.particleColor);
        }
        this.renderOptionsGrid();
    }

    // Devolve o menu ao visual da seleção de temporadas
    restoreMenuBackground() {
        document.body.className = "menu-active";
        if (this.gameMode === 'daily' || this.selectedCampaigns.length === 0) {
            this.clearSeasonThemeVars();
            this.hideSeasonBackground();
            if (typeof particles !== 'undefined') particles.setColorType('normal');
        } else {
            this.applySeasonTheme();
            this.renderSeasonBackground();
            if (typeof particles !== 'undefined') {
                particles.setColorType(this.getActiveCampaignParticleColor());
            }
        }
    }

    // Cenas do Diário: sorteio compartilhado com o /admin (episodes.js), já com os ajustes do dia
    getSeededPlaylist() {
        const dateStr = this.selectedDailyDate;
        return buildDailyScenes(dateStr, this.dailyAdjustments[dateStr] || {});
    }

    // Busca no servidor os ajustes do /admin para o dia (algoritmo secundário e contexto das cenas).
    // Se o servidor não responder, o Diário segue com o sorteio normal.
    async loadDailyAdjustments(dateStr) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const response = await fetch(`/api/daily/${dateStr}`, { signal: controller.signal, cache: 'no-store' });
            clearTimeout(timeout);
            if (response.ok) {
                this.dailyAdjustments[dateStr] = await response.json();
            }
        } catch (e) {
            console.warn('Ajustes do Diário indisponíveis, usando o sorteio normal.', e.message);
        }
    }

    checkDailyStatus() {
        // Se a data selecionada saiu do período permitido (ex.: data inicial mudou), volta para hoje
        if (!this.isDailyDateAllowed(this.selectedDailyDate)) {
            this.selectedDailyDate = this.getTodayStr();
        }

        const dateStr = this.selectedDailyDate;
        const [yr, mo, dy] = dateStr.split('-');
        const formattedDate = `${dy}/${mo}/${yr}`;

        const startBtn = document.getElementById('btn-start-game');
        const dailyBtn = document.getElementById('btn-mode-daily');

        // Verifica se a data selecionada está concluída
        const isCompleted = this.isDailyCompleted(dateStr);

        // Antes da data inicial definida no /admin, o Diário ainda não abriu
        const notLaunched = !this.isDailyDateAllowed(dateStr);
        if (startBtn) startBtn.disabled = this.gameMode === 'daily' && notLaunched;
        if (notLaunched) {
            const [sy, sm, sd] = this.getDailyStartDate().split('-');
            if (dailyBtn) {
                dailyBtn.classList.remove('completed');
                const badge = dailyBtn.querySelector('.mode-badge');
                const desc = dailyBtn.querySelector('.mode-desc');
                if (badge) {
                    badge.innerText = 'EM BREVE';
                    badge.style.background = 'rgba(255, 255, 255, 0.08)';
                    badge.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    badge.style.color = '#ffffff';
                }
                if (desc) {
                    desc.innerHTML = `<strong>O Modo Diário começa em ${sd}/${sm}/${sy}.</strong> Até lá, jogue os outros modos.`;
                }
            }
            if (startBtn && this.gameMode === 'daily') {
                startBtn.querySelector('span').innerText = `DISPONÍVEL EM ${sd}/${sm}`;
                startBtn.classList.remove('pulse-btn');
            }
            return;
        }

        if (dailyBtn) {
            const badge = dailyBtn.querySelector('.mode-badge');
            const desc = dailyBtn.querySelector('.mode-desc');
            
            if (isCompleted) {
                dailyBtn.classList.add('completed');
                if (badge) {
                    badge.innerText = '✓ CONCLUÍDO';
                    badge.style.background = 'rgba(74, 222, 128, 0.15)';
                    badge.style.borderColor = '#4ade80';
                    badge.style.color = '#4ade80';
                }
                if (desc) {
                    desc.innerHTML = `<strong>Investigação Concluída (${dy}/${mo})!</strong> Você já jogou as cenas desse dia. Clique abaixo para ver o relatório.`;
                }
            } else {
                dailyBtn.classList.remove('completed');
                if (badge) {
                    badge.innerText = `DIA ${dy}/${mo}`;
                    badge.style.background = 'rgba(255, 255, 255, 0.08)';
                    badge.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    badge.style.color = '#ffffff';
                }
                if (desc) {
                    desc.innerHTML = `<strong>Cenas do Dia ${formattedDate}:</strong> descubra de qual episódio é cada uma das 6 cenas.`;
                }
            }
        }

        // Toggles do texto do botão com base no modo de jogo e na conclusão
        if (startBtn) {
            if (this.gameMode === 'daily') {
                if (isCompleted) {
                    startBtn.querySelector('span').innerText = 'VER RESULTADO';
                    startBtn.classList.remove('pulse-btn');
                } else {
                    startBtn.querySelector('span').innerText = 'INICIAR INVESTIGAÇÃO';
                    startBtn.classList.add('pulse-btn');
                }
            } else {
                // Outros modos mostram sempre o botão "JOGAR"
                startBtn.querySelector('span').innerText = 'JOGAR';
                startBtn.classList.add('pulse-btn');
            }
        }
    }

    getTodayStr() {
        const today = new Date();
        return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    }

    // Data inicial do Modo Diário, definida no /admin (vem do servidor em /config.js). null = sem trava.
    getDailyStartDate() {
        const start = window.APP_CONFIG && window.APP_CONFIG.dailyStartDate;
        return /^\d{4}-\d{2}-\d{2}$/.test(start || '') ? start : null;
    }

    // Dias jogáveis no Diário: da data inicial até hoje. Usada no calendário, na navegação
    // entre meses e no início da partida (o servidor também confere a mesma regra).
    isDailyDateAllowed(dateStr) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || '')) return false;
        const start = this.getDailyStartDate();
        return dateStr <= this.getTodayStr() && (!start || dateStr >= start);
    }

    // Mês pode ser exibido no calendário? Entre o mês da data inicial e o mês atual.
    isCalendarMonthAllowed(year, month) {
        const key = year + '-' + String(month + 1).padStart(2, '0');
        const start = this.getDailyStartDate();
        return key <= this.getTodayStr().slice(0, 7) && (!start || key >= start.slice(0, 7));
    }

    getDailyHistory() {
        let history = {};
        try {
            const historyJson = localStorage.getItem('ordem_daily_history');
            if (historyJson) {
                history = JSON.parse(historyJson);
            }
        } catch (e) {
            console.error("Erro ao carregar histórico diário consolidado:", e);
        }

        // Migração Retrocompatível de Chaves Antigas
        let migrated = false;
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const match = key.match(/^daily_completed_(\d{4}-\d{2}-\d{2})$/);
                if (match) {
                    const dateStr = match[1];
                    if (!history[dateStr]) {
                        history[dateStr] = { completed: true };
                        
                        // Tenta puxar o resultado detalhado correspondente
                        const resultJson = localStorage.getItem('daily_result_' + dateStr);
                        if (resultJson) {
                            try {
                                history[dateStr].result = JSON.parse(resultJson);
                            } catch (err) {
                                console.error("Erro ao migrar resultado para " + dateStr, err);
                            }
                        }
                        migrated = true;
                    }
                    keysToRemove.push(key);
                    keysToRemove.push('daily_result_' + dateStr);
                }
            }
        }

        // Se migrou algum registro, salva o novo histórico consolidado e remove as chaves antigas
        if (migrated) {
            try {
                localStorage.setItem('ordem_daily_history', JSON.stringify(history));
                keysToRemove.forEach(key => localStorage.removeItem(key));
                console.log("Migração de histórico diário consolidado concluída com sucesso!");
            } catch (err) {
                console.error("Erro ao salvar histórico migrado:", err);
            }
        }

        return history;
    }

    saveDailyResult(dateStr, resultData) {
        const history = this.getDailyHistory();
        history[dateStr] = {
            completed: true,
            result: resultData
        };
        try {
            localStorage.setItem('ordem_daily_history', JSON.stringify(history));
        } catch (e) {
            console.error("Erro ao salvar histórico diário:", e);
        }
    }

    isDailyCompleted(dateStr) {
        const history = this.getDailyHistory();
        return history[dateStr] && history[dateStr].completed === true;
    }

    getDailyResult(dateStr) {
        const history = this.getDailyHistory();
        return history[dateStr] ? history[dateStr].result : null;
    }

    renderCalendar() {
        const monthsNames = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        
        const headerEl = document.getElementById('calendar-month-year');
        if (headerEl) {
            headerEl.innerText = `${monthsNames[this.calendarMonth]} ${this.calendarYear}`;
        }
        
        const prevBtn = document.getElementById('btn-calendar-prev');
        const nextBtn = document.getElementById('btn-calendar-next');
        if (prevBtn) {
            const py = this.calendarMonth === 0 ? this.calendarYear - 1 : this.calendarYear;
            prevBtn.disabled = !this.isCalendarMonthAllowed(py, this.calendarMonth === 0 ? 11 : this.calendarMonth - 1);
        }
        if (nextBtn) {
            const ny = this.calendarMonth === 11 ? this.calendarYear + 1 : this.calendarYear;
            nextBtn.disabled = !this.isCalendarMonthAllowed(ny, this.calendarMonth === 11 ? 0 : this.calendarMonth + 1);
        }

        const gridEl = document.getElementById('calendar-days-grid');
        if (!gridEl) return;
        gridEl.innerHTML = '';
        
        const today = new Date();
        const realTodayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        
        // Primeiro dia do mês selecionado
        const firstDay = new Date(this.calendarYear, this.calendarMonth, 1);
        const startingDay = firstDay.getDay(); // 0 (Dom) a 6 (Sáb)
        
        // Número de dias no mês
        const totalDays = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();
        
        // Espaços em branco antes do dia 1
        for (let i = 0; i < startingDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            gridEl.appendChild(emptyCell);
        }
        
        // Dias do mês
        for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            cell.innerText = dayNum;
            
            const currentCellDateStr = this.calendarYear + '-' + String(this.calendarMonth + 1).padStart(2, '0') + '-' + String(dayNum).padStart(2, '0');
            
            // Verifica se o dia é futuro comparando a data real de hoje
            const cellDate = new Date(this.calendarYear, this.calendarMonth, dayNum);
            // Zera as horas para comparação exata de data
            const todayCompare = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            if (cellDate > todayCompare) {
                cell.classList.add('future');
            } else if (!this.isDailyDateAllowed(currentCellDateStr)) {
                // Antes da data inicial do Diário
                cell.classList.add('locked');
            } else {
                // Seleção Ativa
                if (currentCellDateStr === this.selectedDailyDate) {
                    cell.classList.add('active');
                }
                
                // Concluído
                if (this.isDailyCompleted(currentCellDateStr)) {
                    cell.classList.add('completed');
                }
                
                // Evento de Clique para Selecionar Dia
                cell.addEventListener('click', () => {
                    if (!this.isDailyDateAllowed(currentCellDateStr)) return;
                    sfx.playClick();
                    this.selectedDailyDate = currentCellDateStr;
                    this.checkDailyStatus();
                    
                    // Fecha modal
                    const calendarModal = document.getElementById('calendar-modal');
                    if (calendarModal) calendarModal.style.display = 'none';
                });
            }
            
            gridEl.appendChild(cell);
        }
    }

    openDailyResultModal(dateStr) {
        let result = this.getDailyResult(dateStr);
        if (!result) {
            result = {
                accuracy: "0/6",
                streak: "0x 🔥",
                avgTime: "10.0s",
                rank: "Sem registro",
                desc: "Nenhum relatório encontrado para este dia."
            };
        }

        // Os valores vêm do localStorage: escapados antes de entrar no HTML
        const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
        const fireIcon = '<span class="material-symbols-outlined" style="color: #ef4444; font-size: 1.2rem;">local_fire_department</span>';

        const modal = document.getElementById('daily-result-modal');
        const content = document.getElementById('modal-body-content');
        if (modal && content) {
            content.innerHTML = `
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <img src="assets/img/medo.png" alt="Símbolo do Medo" style="width: 55px; height: 55px; object-fit: contain; filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.85)); margin-bottom: 0.5rem; animation: pulse-glow-skull 2.5s infinite alternate;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 2px;">Investigação Diária Concluída</div>
                </div>
                <div style="background: rgba(139,92,246,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 1rem; text-align: center; margin-bottom: 0.75rem;">
                    <div style="font-size: 1.75rem; font-weight: 800; color: #fff;">${esc(result.accuracy)}</div>
                    <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Acertos</div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.5rem;">
                    <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 0.75rem; text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 800; color: #fff; display: flex; align-items: center; justify-content: center; gap: 4px;">${esc(result.streak).replace('🔥', fireIcon)}</div>
                        <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Streak Máx</div>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 0.75rem; text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 800; color: #fff;">${esc(result.avgTime)}</div>
                        <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Tempo Médio</div>
                    </div>
                </div>
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 1rem; text-align: center; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
                    <div style="font-family: var(--font-primary); font-weight: 800; font-size: 0.95rem; color: #fff; letter-spacing: 1px; margin-bottom: 0.5rem;">${esc(result.rank)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">${esc(result.desc)}</div>
                </div>
            `;
            modal.style.display = 'flex';
        }
    }

    decipherTitle(targetText, callback) {
        const titleEl = document.getElementById('app-main-title');
        if (!titleEl) return;
        
        if (this.decipherInterval) {
            clearInterval(this.decipherInterval);
        }
        
        titleEl.classList.remove('sigil-font');
        titleEl.innerText = targetText;
        if (callback) callback();
    }

    renderOptionsGrid() {
        const grid = document.getElementById('options-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        OST_DATABASE.forEach((ep, index) => {
            const btn = document.createElement('button');
            btn.className = 'btn-option';
            btn.setAttribute('data-episode', ep.episodeNum);
            
            let numStr = ep.episodeNum.replace('Episódio ', '');
            let btnText = ep.title.replace(/Episódio /g, "Ep ").replace(/"/g, "").replace(/“|”/g, "").replace(/\\/g, "");
            
            if (ep.episodeNum === "Episódio 10" && this.activeCampaign === 'hexatombe') {
                btnText = "Ep Final - Renascimento";
            }
            
            btn.innerHTML = `
                <span class="opt-num">${numStr}</span>
                <span class="opt-text">${btnText}</span>
            `;
            
            btn.addEventListener('click', (e) => {
                if (this.hasAnswered) return;
                const chosenEpisode = btn.getAttribute('data-episode');
                this.handleAnswer(chosenEpisode);
            });
            
            grid.appendChild(btn);
        });
    }

    // Inicialização da API do YouTube
    initYouTubePlayer() {
        if (this.ytPlayerReady) return;
        
        this.ytPlayer = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: 'DMzwnM6gwBY', // Episódio 1 inicial cued
            playerVars: {
                playsinline: 1,
                controls: 0,
                showinfo: 0,
                rel: 0,
                cc_load_policy: 0,
                origin: window.location.origin
            },
            events: {
                onReady: (event) => {
                    this.ytPlayerReady = true;
                    const vol = document.getElementById('volume-slider').value;
                    event.target.setVolume(vol);
                    this.buttons.playPause.disabled = false;
                    try {
                        event.target.unloadModule('captions');
                        event.target.unloadModule('cc');
                    } catch (e) {}
                },
                onStateChange: (event) => {
                    this.onPlayerStateChange(event);
                },
                onError: (event) => {
                    this.onPlayerError(event);
                }
            }
        });
    }

    onPlayerStateChange(event) {
        const state = event.data;
        if (!this.currentTrack) return;
        
        if (state === YT.PlayerState.PLAYING) {
            this.isPlaying = true;
            this.buttons.playPause.innerText = 'pause';
            this.player.status.innerText = "Monitorando frequência do Outro Lado";
            
            // Oculta tela de sintonização
            document.getElementById('video-loading-screen').style.display = 'none';
            
            try {
                event.target.unloadModule('captions');
                event.target.unloadModule('cc');
            } catch (e) {}
            
            // Inicia o timer e progresso
            this.startRoundTimer();
            this.startProgressTracking();
        } else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED) {
            this.isPlaying = false;
            this.buttons.playPause.innerText = 'play_arrow';
            this.stopProgressTracking();
            // Vídeo parado, cronômetro parado: o tempo restante fica congelado
            this.stopRoundTimer();
            if (!this.hasAnswered && !this.sceneEnded && this.roundTimeRemaining > 0) {
                this.player.status.innerText = "Transmissão pausada";
            }
        }
    }

    onPlayerError(event) {
        console.warn("YouTube Player error encountered:", event.data);
        document.getElementById('video-loading-screen').style.display = 'none';
        if (!this.currentTrack) {
            this.player.status.innerText = "Monitor paranormal calibrado";
            return;
        }
        
        this.player.status.innerText = "Erro no monitor. Buscando sinal de backup";
        sfx.playError();
        
        if (this.gameMode === 'duel') {
            if (this.role === 'host') {
                let nextIndex = Math.floor(Math.random() * OST_DATABASE.length);
                this.currentTrack = OST_DATABASE[nextIndex];
                
                // Escolhe um segundo seguro no host de 10 minutos (600s) a 1h30 (5400s) de fallback
                const durationFallback = 4800; 
                const startSecs = Math.floor(Math.random() * durationFallback) + 600;
                this.currentTrack.startSeconds = startSecs;

                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({ type: 'SYNC_PLAY_TRACK', track: this.currentTrack }));
                }
            } else {
                sfx.startAtmosphere();
                this.player.status.innerText = "Monitor local corrompido. Corrigindo";
            }
            return;
        }

        // Singleplayer: escolhe outro episódio de backup
        let nextIndex;
        if (this.gameMode === 'daily') {
            // Em caso de erro no diário, usamos um fallback determinístico baseado na ID do vídeo que falhou
            let hash = 0;
            const failedId = this.currentTrack.youtubeId || "";
            for (let i = 0; i < failedId.length; i++) {
                hash = failedId.charCodeAt(i) + ((hash << 5) - hash);
            }
            nextIndex = Math.abs(hash) % OST_DATABASE.length;
        } else {
            nextIndex = Math.floor(Math.random() * OST_DATABASE.length);
        }
        
        this.currentTrack = { ...OST_DATABASE[nextIndex] };
        // O backup vem da mesma temporada da cena que falhou
        this.currentTrack.campaignId = this.activeCampaign;

        if (this.gameMode === 'daily') {
            this.currentTrack.campaignId = this.gamePlaylist[this.currentRound - 1].campaignId;
            // Tempo de início fixo para o backup baseado no hash da nova ID
            let hashBackup = 0;
            const backupId = this.currentTrack.youtubeId || "";
            for (let i = 0; i < backupId.length; i++) {
                hashBackup = backupId.charCodeAt(i) + ((hashBackup << 5) - hashBackup);
            }
            this.currentTrack.startSeconds = (Math.abs(hashBackup) % 4500) + 600;
        }
        
        this.gamePlaylist[this.currentRound - 1] = this.currentTrack;
        
        setTimeout(() => {
            this.setupTrack(this.currentTrack);
        }, 1200);
    }

    // ==========================================
    // FLUXO DO JOGO
    // ==========================================
    async startGame() {
        if (this.isStartingGame) return;
        if (this.gameMode === 'daily') {
            const dateStr = this.selectedDailyDate;
            if (!this.isDailyDateAllowed(dateStr)) {
                alert("As cenas desse dia não estão disponíveis.");
                return;
            }
            if (this.isDailyCompleted(dateStr)) {
                alert("Você já realizou a investigação desse dia!");
                return;
            }
        }
        if (this.gameMode !== 'daily' && this.selectedCampaigns.length === 0) {
            alert("Por favor, escolha ao menos uma temporada antes de iniciar a investigação.");
            return;
        }
        if (this.gameMode === 'daily') {
            this.isStartingGame = true;
            await this.loadDailyAdjustments(this.selectedDailyDate);
            this.isStartingGame = false;
        }
        this.currentRound = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.totalAcertos = 0;
        this.totalTempoResposta = 0;
        this.roundLog = [];
        this.hasAnswered = false;

        const nextRoundSpan = this.buttons.nextRound.querySelector('span');
        if (nextRoundSpan) {
            nextRoundSpan.innerText = "AVANÇAR NA INVESTIGAÇÃO";
        }

        // Configuração visual baseada no modo
        if (this.gameMode === 'daily') {
            this.totalRounds = 6;
            this.hud.heartsContainer.style.display = 'none';
            this.hud.roundType.innerText = 'RODADA';
            this.timer.box.style.display = 'block';
        } else if (this.gameMode === 'classic') {
            this.totalRounds = 10;
            this.hud.heartsContainer.style.display = 'none';
            this.hud.roundType.innerText = 'RODADA';
            this.timer.box.style.display = 'block';
        } else if (this.gameMode === 'duel') {
            this.totalRounds = 10;
            this.hud.heartsContainer.style.display = 'none';
            this.hud.roundType.innerText = 'DUELO';
            this.timer.box.style.display = 'block';
        } else { // infinite
            this.totalRounds = Infinity;
            this.hud.heartsContainer.style.display = 'none';
            this.hud.roundType.innerText = 'CENA';
            this.timer.box.style.display = 'block';
        }

        // Mistura a playlist (só das temporadas selecionadas) ou busca a seeded diária
        if (this.gameMode === 'daily') {
            this.gamePlaylist = this.getSeededPlaylist();
        } else {
            this.gamePlaylist = this.getSelectedPlaylist();
            this.shuffleArray(this.gamePlaylist);
        }
        this.currentTrackIndex = -1;

        sfx.stopHeartbeat();
        sfx.stopAtmosphere();

        // Mostrar tela de jogo
        this.showScreen('game');
        this.renderOptionsGrid();
        
        if (this.gameMode !== 'duel' || this.role === 'host') {
            this.nextRound();
        }
    }

    nextRound() {
        this.currentRound++;
        this.hasAnswered = false;
        this.sceneEnded = false;
        
        if (this.currentRound > this.gamePlaylist.length) {
            if (this.gameMode !== 'daily') {
                this.shuffleArray(this.gamePlaylist);
            }
            this.currentRound = 1;
        }

        this.currentTrack = this.gamePlaylist[this.currentRound - 1];

        // A cena manda no visual: cada rodada assume a temporada da própria cena
        if (this.currentTrack && this.currentTrack.campaignId) {
            this.applyRoundCampaign(this.currentTrack.campaignId);
        }

        // Atualizar HUD
        if (this.gameMode === 'classic') {
            this.hud.round.innerText = `${this.currentRound}/${this.totalRounds}`;
        } else {
            this.hud.round.innerText = `${this.currentRound}`;
        }
        
        const scoreLabel = document.getElementById('hud-score-label');
        if (scoreLabel) {
            scoreLabel.innerText = this.gameMode === 'duel' ? "PLACAR" : "ACERTOS";
        }
        
        if (this.gameMode !== 'duel') {
            this.hud.score.innerText = `${this.totalAcertos}`;
        }
        this.hud.streak.innerHTML = `${this.streak}x <span class="material-symbols-outlined" style="color: #ef4444; vertical-align: text-bottom; font-size: 1.15rem;">local_fire_department</span>`;

        // Desbloquear botões de opção
        const optionButtons = document.querySelectorAll('.btn-option');
        optionButtons.forEach(btn => {
            btn.classList.remove('correct', 'wrong');
            btn.disabled = false;
        });

        // Resetar Dicas e Bezel
        this.usedHint = false;
        this.isLockedOut = false;
        this.buttons.hint.disabled = true;
        if (this.gameMode === 'daily') {
            this.buttons.hint.style.display = 'none';
        } else {
            this.buttons.hint.style.display = 'block';
        }
        document.getElementById('signal-lost-screen').style.display = 'none';

        // Configurar e tocar a cena
        if (this.gameMode === 'duel') {
            if (this.role === 'host') {
                // Host escolhe o ponto de partida de forma síncrona
                // Para cenários curtos e longos, sorteamos de 10 min (600s) a 1h30 (5400s)
                const startSecs = Math.floor(Math.random() * 4500) + 600;
                this.currentTrack.startSeconds = startSecs;

                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({ type: 'SYNC_PLAY_TRACK', track: this.currentTrack }));
                }
            }
        } else {
            // No singleplayer, sorteamos o tempo ao carregar a faixa
            this.setupTrack(this.currentTrack);
        }
    }

    setupTrack(track) {
        if (!this.ytPlayerReady) {
            this.player.status.innerText = "Ajustando sintonizador de fita";
            this.initYouTubePlayer();
            setTimeout(() => this.setupTrack(track), 1500);
            return;
        }

        this.isPlaying = false;
        this.sceneEnded = false;
        this.replaysUsed = 0;
        this.isSeeking = false;
        
        document.getElementById('video-loading-screen').style.display = 'flex';
        
        if (this.buttons.replay) {
            this.buttons.replay.disabled = false;
            this.buttons.replay.style.opacity = '1';
            this.buttons.replay.title = "Reassistir a cena (+1 vez)";
        }

        const shieldStatus = document.getElementById('shield-countdown');
        if (shieldStatus) {
            shieldStatus.innerText = '10.0s';
        }

        this.player.status.innerText = "Sintonizando transmissão";
        document.getElementById('signal-lost-screen').style.display = 'none';
        
        this.stopRoundTimer();
        this.roundTimerStarted = false; // Cena nova: o cronômetro volta aos 10s
        this.timer.bar.style.width = '100%';
        this.timer.bar.classList.remove('warning');

        // Ponto de início: ou já está síncrono (duelo) ou sorteamos localmente
        const startSecs = track.startSeconds || Math.floor(Math.random() * 4500) + 600;
        this.cuedStartSeconds = startSecs;
        
        try {
            this.ytPlayer.loadVideoById({
                videoId: track.youtubeId,
                startSeconds: startSecs
            });
            this.ytPlayer.playVideo();
        } catch (e) {
            console.error("Error loading scene video:", e);
            this.onPlayerError(e);
        }
    }

    togglePlayPause() {
        if (!this.ytPlayerReady || this.sceneEnded) return;
        
        if (this.isPlaying) {
            this.ytPlayer.pauseVideo();
        } else {
            this.ytPlayer.playVideo();
        }
    }

    replayScene() {
        if (!this.currentTrack || this.hasAnswered || this.replaysUsed >= 1) return;
        
        this.replaysUsed++;
        if (this.buttons.replay) {
            this.buttons.replay.disabled = true;
            this.buttons.replay.style.opacity = '0.3';
            this.buttons.replay.title = "Limite de replay atingido";
        }
        document.getElementById('signal-lost-screen').style.display = 'none';
        this.sceneEnded = true; // temporário até o seek completar
        this.isSeeking = true;
        this.isPlaying = true;
        this.player.status.innerText = "Reassistindo sinal de vídeo (+1 vez)";
        if (this.ytPlayerReady) {
            this.ytPlayer.seekTo(this.cuedStartSeconds, true);
            this.ytPlayer.playVideo();
        }
        // Reassistir dá 10 segundos cheios de novo
        this.stopRoundTimer();
        this.roundTimerStarted = false;

        this.startProgressTracking();
        this.startRoundTimer();
    }

    // Temporizador do Quiz de Cenas (Exatamente 10s)
    startRoundTimer() {
        if (this.roundTimerInterval) return; // já ativo
        if (this.hasAnswered) return;

        // Só zera o relógio numa cena nova; ao despausar, retoma de onde parou
        if (!this.roundTimerStarted) {
            this.roundTimeRemaining = this.roundTimerDuration;
            this.roundTimerStarted = true;
        } else if (this.roundTimeRemaining <= 0) {
            return; // Tempo desta cena já esgotou: não reinicia a contagem
        }

        sfx.startHeartbeat(1000);
        particles.setColorType(this.getActiveCampaignParticleColor());

        this.roundTimerInterval = setInterval(() => {
            this.roundTimeRemaining -= 0.1;
            
            const shieldStatus = document.getElementById('shield-countdown');
            if (shieldStatus) {
                shieldStatus.innerText = `${Math.max(0, this.roundTimeRemaining).toFixed(1)}s`;
            }

            // Atualiza barra do timer
            const percent = (this.roundTimeRemaining / this.roundTimerDuration) * 100;
            this.timer.bar.style.width = `${percent}%`;

            // Tensão: menos de 3.5 segundos
            if (this.roundTimeRemaining <= 3.5) {
                this.timer.bar.classList.add('warning');
                particles.setColorType('tension');
                
                const speed = 300 + (this.roundTimeRemaining * 100);
                sfx.setHeartbeatSpeed(speed);
            }

            if (this.roundTimeRemaining <= 0) {
                this.handleTimeout();
            }
        }, 100);
    }

    stopRoundTimer() {
        if (this.roundTimerInterval) {
            clearInterval(this.roundTimerInterval);
            this.roundTimerInterval = null;
        }
        sfx.stopHeartbeat();
    }

    // Monitoramento do progresso dos 10s de cena no player de vídeo
    startProgressTracking() {
        this.stopProgressTracking();

        this.player.totalVal.innerText = '0:10';
        // Ao despausar, mantém a barra onde estava em vez de piscar de volta ao zero
        if (!this.roundTimerStarted) {
            this.player.currentVal.innerText = '0:00';
            this.player.progressFill.style.width = '0%';
        }

        this.progressInterval = setInterval(() => {
            if (this.isPlaying && this.ytPlayerReady) {
                const currentSecs = this.ytPlayer.getCurrentTime();
                const elapsed = currentSecs - this.cuedStartSeconds;
                
                if (this.isSeeking) {
                    if (elapsed < 2) {
                        this.isSeeking = false;
                        this.sceneEnded = false;
                    }
                    return;
                }

                const capElapsed = Math.max(0, Math.min(elapsed, 10));
                
                this.player.currentVal.innerText = `0:${this.padZero(Math.floor(capElapsed), 2)}`;
                this.player.progressFill.style.width = `${(capElapsed / 10) * 100}%`;
                
                // Se completou os 10s da cena, corta o sinal!
                if (elapsed >= 10 && !this.sceneEnded) {
                    this.cutSignal();
                }
            }
        }, 100);
    }

    stopProgressTracking() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    // Corta o sinal do monitor CRT após 10 segundos
    cutSignal() {
        this.sceneEnded = true;
        this.isPlaying = false;
        this.stopProgressTracking();
        this.stopRoundTimer(); // Para o cronômetro da rodada para permitir responder após o sinal cortar
        
        if (this.ytPlayerReady) {
            this.ytPlayer.pauseVideo();
        }
        
        // Exibe o overlay de SINAL DE VÍDEO CORTADO com scanlines
        document.getElementById('signal-lost-screen').style.display = 'flex';
        this.player.status.innerText = "Sinal de vídeo cortado, escolha um episódio!";
        sfx.playError(); // efeito sonoro de buzzer estático
    }

    handleTimeout() {
        this.stopRoundTimer();
        if (this.gameMode === 'duel') {
            this.handleAnswer(null); // No duelo, estouro de tempo é erro imediato
        } else {
            if (this.ytPlayerReady) {
                this.ytPlayer.pauseVideo();
            }
            // Não chamamos handleAnswer(null) para permitir que o usuário ainda clique e responda!
        }
    }

    handleAnswer(chosenEpisode) {
        if (!this.currentTrack) return;
        this.hasAnswered = true;
        this.stopRoundTimer();
        this.buttons.hint.disabled = true;
        if (this.buttons.replay) {
            this.buttons.replay.disabled = true;
            this.buttons.replay.style.opacity = '0.3';
        }
        
        if (this.ytPlayerReady) {
            this.ytPlayer.pauseVideo();
        }

        const isCorrect = chosenEpisode && this.currentTrack.episodeNum.toLowerCase() === chosenEpisode.toLowerCase();
        
        if (this.gameMode === 'duel') {
            if (this.isLockedOut) return;
            
            let timeBonus = Math.floor((this.roundTimeRemaining / this.roundTimerDuration) * 1000);
            let roundScore = 500 + timeBonus;
            if (this.usedHint) {
                roundScore = Math.floor(roundScore * 0.5);
            }

            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'SUBMIT_ANSWER',
                    isCorrect: isCorrect,
                    points: roundScore,
                    chosenSeason: chosenEpisode,
                    usedHint: this.usedHint
                }));
            }
            return;
        }

        // Colorir botões
        const optionButtons = document.querySelectorAll('.btn-option');
        optionButtons.forEach(btn => {
            btn.disabled = true;
            const btnEpisode = btn.getAttribute('data-episode');
            if (btnEpisode.toLowerCase() === this.currentTrack.episodeNum.toLowerCase()) {
                btn.classList.add('correct');
            } else if (chosenEpisode && btnEpisode.toLowerCase() === chosenEpisode.toLowerCase() && !isCorrect) {
                btn.classList.add('wrong');
            }
        });

        // Configura tela de revelação
        this.reveal.elementBg.innerText = "skull"; // Hexatombe / Morte

        this.reveal.ytLink.href = `https://www.youtube.com/watch?v=${this.currentTrack.youtubeId}&t=${this.cuedStartSeconds}s`;

        // Contexto da Cena: escrito pelos admins no /admin (só existe no Diário, e é opcional)
        const contexto = this.gameMode === 'daily' ? (this.currentTrack.contexto || '') : '';
        this.reveal.contextText.textContent = contexto;
        this.reveal.context.style.display = contexto ? 'block' : 'none';

        // Pontos e efeitos
        if (isCorrect) {
            sfx.playSuccess();
            particles.setColorType('success');
            this.totalAcertos++;
            this.streak++;
            if (this.streak > this.maxStreak) {
                this.maxStreak = this.streak;
            }

            const remaining = Math.max(0, this.roundTimeRemaining);
            this.totalTempoResposta += this.roundTimerDuration - remaining;

            this.reveal.banner.className = "reveal-result-banner correct";
            this.reveal.icon.innerText = "✓";
            this.reveal.title.innerText = "SANIDADE PRESERVADA";
            this.reveal.subtitle.style.display = 'block';
            this.reveal.subtitle.innerText = `Streak ${this.streak}x`;
        } else {
            sfx.playError();
            particles.setColorType('tension');
            this.streak = 0;

            this.totalTempoResposta += this.roundTimerDuration;

            this.reveal.banner.className = "reveal-result-banner wrong";
            this.reveal.icon.innerText = "✗";
            this.reveal.title.innerText = "Resposta Errada";
            this.reveal.subtitle.style.display = 'none';
            this.reveal.subtitle.innerText = '';
        }

        this.roundLog.push({
            campaign: this.currentTrack.campaignId,
            episode: this.currentTrack.episodeNum,
            correct: !!isCorrect,
            time: isCorrect ? this.roundTimerDuration - Math.max(0, this.roundTimeRemaining) : this.roundTimerDuration
        });

        // Se for a última rodada, altera o texto do botão de avançar para "VER RESULTADOS"
        const isLastRound = (this.gameMode === 'classic' || this.gameMode === 'daily' || this.gameMode === 'duel') && (this.currentRound >= this.totalRounds);
        const nextRoundSpan = this.buttons.nextRound.querySelector('span');
        if (nextRoundSpan) {
            if (isLastRound) {
                nextRoundSpan.innerText = "VER RESULTADOS";
            } else {
                nextRoundSpan.innerText = "AVANÇAR NA INVESTIGAÇÃO";
            }
        }

        setTimeout(() => {
            this.showScreen('reveal');
        }, 1400);
    }

    advanceGameFlow() {
        if ((this.gameMode === 'classic' || this.gameMode === 'daily') && this.currentRound >= this.totalRounds) {
            this.endGame();
        } else {
            this.showScreen('game');
            particles.setColorType(this.getActiveCampaignParticleColor());
            this.nextRound();
        }
    }

    endGame(aborted = false) {
        this.stopRoundTimer();
        sfx.stopHeartbeat();
        
        if (this.ytPlayerReady) {
            this.ytPlayer.pauseVideo();
        }

        if (aborted) {
            this.showScreen('intro');
            particles.setColorType(this.getActiveCampaignParticleColor());
            return;
        }

        // Estatísticas finais
        const totalRespondidas = this.gameMode === 'classic' ? this.totalRounds : this.currentRound;
        this.gameover.accuracy.innerText = `${this.totalAcertos}/${totalRespondidas}`;
        this.gameover.streak.innerHTML = `${this.maxStreak}x <span class="material-symbols-outlined" style="color: #ef4444; vertical-align: text-bottom; font-size: 1.15rem;">local_fire_department</span>`;

        const avgTime = this.totalTempoResposta / totalRespondidas;
        this.gameover.avgTime.innerText = `${avgTime.toFixed(1)}s`;

        // Rank: proporcional aos acertos (mesma escala do Modo Diário) para Diário, Clássico e Infinito.
        // Ex: 2 acertos em 6 rodadas equivale a 6 acertos em 18 — ambos caem no mesmo degrau.
        const dailyRanks = [
            { rank: "Mundano", desc: "Você nunca presenciou ou teve contato com o paranormal." },
            { rank: "Conspiracionista", desc: "Você acredita já ter visto coisas estranhas, mas não sabe se é real ou coisa da sua cabeça." },
            { rank: "Recruta", desc: "Novato recém-chegado, ainda sem experiência em campo." },
            { rank: "Operador", desc: "A patente mais comum da Ordem; possui experiência prática e alguns casos resolvidos." },
            { rank: "Agente Especial", desc: "Veterano designado para missões complexas. Já possui autoridade para indicar novos recrutas." },
            { rank: "Oficial de Operações", desc: "Especialista focado em missões de alto risco, com acesso a arquivos restritos e itens amaldiçoados." },
            { rank: "Agente de Elite", desc: "As lendas vivas da Ordem; os melhores combatentes, acionados exclusivamente para conter ameaças de escala global." }
        ];

        const accuracy = totalRespondidas > 0 ? this.totalAcertos / totalRespondidas : 0;
        const rankIndex = Math.min(6, Math.max(0, Math.round(accuracy * 6)));
        const rank = dailyRanks[rankIndex].rank;
        const desc = dailyRanks[rankIndex].desc;

        if (accuracy >= 5 / 6) {
            particles.setColorType('success');
        } else if (accuracy >= 3 / 6) {
            particles.setColorType('normal');
        } else {
            particles.setColorType('tension');
        }

        this.gameover.rank.innerText = rank;
        this.gameover.rankDesc.innerText = desc;

        this.submitGlobalStats();

        if (this.gameMode === 'infinite') {
            this.gameover.cause.innerText = "Investigação infinita interrompida. Relatório do medo arquivado pela Ordo Realitas.";
        } else {
            this.gameover.cause.innerText = "A investigação foi concluída! Relatório arquivado pela Ordo Realitas.";
        }

        if (this.gameMode === 'daily' && !aborted) {
            const dateStr = this.selectedDailyDate;
            const resultData = {
                accuracy: `${this.totalAcertos}/${this.totalRounds}`,
                streak: `${this.maxStreak}x 🔥`,
                avgTime: `${(this.totalTempoResposta / this.totalRounds).toFixed(1)}s`,
                rank: rank,
                desc: desc
            };
            this.saveDailyResult(dateStr, resultData);

            this.checkDailyStatus();
            // Oculta o botão de nova investigação no final do diário
            this.buttons.retry.style.display = 'none';
        } else {
            // Garante que o botão está visível nos outros modos
            this.buttons.retry.style.display = 'block';
        }

        this.showScreen('gameover');
    }

    // Envia o resultado da partida para o servidor, que soma nas estatísticas acumuladas do Supabase
    // (ver supabase/schema.sql). Nada identifica o jogador. Falhas são ignoradas: o jogo funciona sem o banco.
    submitGlobalStats() {
        if (this.roundLog.length === 0) return;
        const payload = {
            mode: this.gameMode,
            dailyDate: this.gameMode === 'daily' ? this.selectedDailyDate : null,
            rounds: this.roundLog,
            maxStreak: this.maxStreak
        };
        fetch('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(() => {});
    }

    // ==========================================
    // MULTIPLAYER WEBSOCKET BROKER (PORTA 3000)
    // ==========================================
    connectWebSocket() {
        if (this.socket) return;
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Se o app rodar localmente ou via Radmin, conecta na porta servida na URL (ou fallback 3001)
        const port = window.location.port || '3001';
        const wsUrl = `${protocol}//${window.location.hostname}:${port}`;
        
        this.player.status.innerText = `Conectando ao servidor na porta ${port}...`;
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            console.log(`WebSocket do Duelo conectado na porta ${port}.`);
            this.player.status.innerText = `Conectado na porta ${port}. Aguardando sala...`;
        };
        
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleSocketMessage(data);
            } catch (e) {
                console.error("Erro interpretando WebSocket:", e);
            }
        };
        
        this.socket.onclose = () => {
            console.log("WebSocket do Duelo encerrado.");
            this.socket = null;
            if (this.gameMode === 'duel' && this.screens.game.classList.contains('active')) {
                alert("Conexão com o oponente perdida.");
                this.endGame(true);
            }
        };
        
        this.socket.onerror = (err) => {
            console.error("Erro WebSocket:", err);
            this.player.status.innerText = `Falha ao conectar na porta ${port}.`;
        };
    }

    handleSocketMessage(data) {
        const statusMsg = document.getElementById('lobby-status-msg');
        const codeDisplay = document.getElementById('display-room-code');
        const opponentStatus = document.getElementById('opponent-status');
        const opponentTag = document.getElementById('opponent-name-tag');
        
        switch (data.type) {
            case 'ROOM_CREATED':
                this.role = 'host';
                this.roomId = data.code;
                
                document.getElementById('lobby-status-box').style.display = 'flex';
                statusMsg.innerText = "Lobby criado com sucesso! Compartilhe o código com o oponente...";
                codeDisplay.innerText = data.code;
                opponentTag.style.display = 'none';
                
                this.buttons.start.disabled = true;
                break;
                
            case 'ROOM_JOINED':
                this.role = 'guest';
                this.roomId = data.code;
                this.opponentName = data.opponentName;
                
                document.getElementById('lobby-status-box').style.display = 'flex';
                statusMsg.innerText = "Você entrou na sala do duelo.";
                codeDisplay.innerText = data.code;
                opponentTag.style.display = 'block';
                opponentStatus.innerText = `Conectado com ${this.opponentName}`;
                
                this.buttons.start.disabled = true;
                this.buttons.start.innerText = "AGUARDANDO HOST...";
                break;
                
            case 'OPPONENT_CONNECTED':
                this.opponentName = data.opponentName;
                
                statusMsg.innerText = "Oponente conectado. O duelo pode começar.";
                opponentTag.style.display = 'block';
                opponentStatus.innerText = `Oponente: ${this.opponentName}`;
                
                this.buttons.start.disabled = false;
                this.buttons.start.innerText = "INICIAR DUELO PARANORMAL";
                sfx.playSuccess();
                break;
                
            case 'GAME_STARTED':
                if (data.campaign) {
                    // O host envia a lista de temporadas do duelo separada por vírgula
                    const duelCampaigns = String(data.campaign)
                        .split(',')
                        .map(c => c.trim())
                        .filter(c => campaignMap[c]);

                    if (duelCampaigns.length > 0) {
                        document.body.className = "menu-active";
                        this.setSelectedCampaigns(duelCampaigns);

                        const titleEl = document.getElementById('app-main-title');
                        if (titleEl) {
                            titleEl.className = "main-title " + this.selectedCampaigns[0];
                            this.decipherTitle(
                                this.selectedCampaigns.length === 1
                                    ? campaignMap[this.selectedCampaigns[0]].title
                                    : "FRAGMENTOS DA MEMBRANA"
                            );
                        }
                    }
                }
                this.startGame();
                break;
                
            case 'PLAY_TRACK':
                this.currentTrack = data.track;
                this.currentRound = data.round;
                this.duelScores = data.scores;
                this.isLockedOut = false;
                
                // Mapeamento do tempo sincronizado de início da cena
                this.cuedStartSeconds = this.currentTrack.startSeconds;

                // Sincroniza a temporada da cena enviada pelo host (opções + visual)
                if (this.currentTrack.campaignId && this.currentTrack.campaignId !== this.activeCampaign) {
                    this.applyRoundCampaign(this.currentTrack.campaignId);
                }

                this.hud.round.innerText = `${this.currentRound}/10`;
                
                const pName = this.playerName.substring(0, 8);
                const oName = this.opponentName.substring(0, 8);
                if (this.role === 'host') {
                    this.hud.score.innerText = `${pName}: ${this.duelScores.host} | ${oName}: ${this.duelScores.guest}`;
                } else {
                    this.hud.score.innerText = `${pName}: ${this.duelScores.guest} | ${oName}: ${this.duelScores.host}`;
                }
                
                const optionButtons = document.querySelectorAll('.btn-option');
                optionButtons.forEach(btn => {
                    btn.classList.remove('correct', 'wrong');
                    btn.disabled = false;
                });
                
                this.usedHint = false;
                this.buttons.hint.disabled = true;
                this.buttons.hint.style.display = 'block';
                document.getElementById('signal-lost-screen').style.display = 'none';
                
                this.setupTrack(this.currentTrack);
                break;
                
            case 'ANSWER_LOCKED':
                this.isLockedOut = true;
                this.buttons.hint.disabled = true;
                this.player.status.innerText = data.message;
                
                const opts = document.querySelectorAll('.btn-option');
                opts.forEach(btn => btn.disabled = true);
                break;
                
            case 'OPPONENT_ERRED':
                this.player.status.innerText = data.message;
                sfx.playClick();
                break;
                
            case 'HINT_ACTIVATED':
                break;
                
            case 'ROUND_OVER':
                this.stopRoundTimer();
                sfx.stopHeartbeat();
                
                if (this.ytPlayerReady) {
                    this.ytPlayer.pauseVideo();
                }
                
                this.endDuelGame(data.winner, data.winnerName, data.points, data.scores, data.track);
                break;
                
            case 'NEXT_ROUND':
                this.showScreen('game');
                particles.setColorType(this.getActiveCampaignParticleColor());
                this.nextRound();
                break;
                
            case 'DISCONNECTED':
                alert(data.message);
                this.endGame(true);
                break;
                
            case 'ERROR':
                alert(data.message);
                if (this.socket) {
                    this.socket.close();
                }
                break;
        }
    }

    endDuelGame(winner, winnerName, points, scores, track) {
        this.hasAnswered = true;
        this.duelScores = scores;
        this.buttons.hint.disabled = true;
        
        const optionButtons = document.querySelectorAll('.btn-option');
        optionButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.getAttribute('data-episode').toLowerCase() === track.episodeNum.toLowerCase()) {
                btn.classList.add('correct');
            }
        });
        
        this.reveal.ytLink.href = `https://www.youtube.com/watch?v=${track.youtubeId}&t=${this.cuedStartSeconds}s`;
        this.reveal.context.style.display = 'none';
        this.reveal.subtitle.style.display = 'block'; // Duelo sempre mostra subtítulo (garante visibilidade após um round solo ter ocultado)

        const isMeWinner = (winner === this.role);
        
        if (winner === 'draw') {
            sfx.playError();
            particles.setColorType('tension');
            this.reveal.banner.className = "reveal-result-banner wrong";
            this.reveal.icon.innerText = "✗";
            this.reveal.title.innerText = "EMPATE";
            this.reveal.subtitle.innerText = "AMBOS ERRARAM A RODADA";
        } else if (winner === 'timeout') {
            sfx.playError();
            particles.setColorType('tension');
            this.reveal.banner.className = "reveal-result-banner wrong";
            this.reveal.icon.innerText = "⌛";
            this.reveal.title.innerText = "TEMPO ESGOTADO";
            this.reveal.subtitle.innerText = "NENHUM AGENTE RESPONDEU A TEMPO";
        } else if (isMeWinner) {
            sfx.playSuccess();
            particles.setColorType('success');
            this.reveal.banner.className = "reveal-result-banner correct";
            this.reveal.icon.innerText = "⚔️";
            this.reveal.title.innerText = "SANIDADE PRESERVADA";
            this.reveal.subtitle.innerText = `VOCÊ ACERTOU PRIMEIRO (+${points} PONTOS!)`;
        } else {
            sfx.playError();
            particles.setColorType('tension');
            this.reveal.banner.className = "reveal-result-banner wrong";
            this.reveal.icon.innerText = "🛡️";
            this.reveal.title.innerText = "OPONENTE ACERTOU";
            this.reveal.subtitle.innerText = `${winnerName} pontuou primeiro nesta rodada (+${points} pts)`;
        }
        
        if (this.role === 'guest') {
            this.buttons.nextRound.disabled = true;
            this.buttons.nextRound.querySelector('span').innerText = "AGUARDANDO HOST...";
        } else {
            this.buttons.nextRound.disabled = false;
            this.buttons.nextRound.querySelector('span').innerText = "AVANÇAR RODADA DE DUELO";
        }
        
        if (this.currentRound >= 10) {
            this.buttons.nextRound.onclick = () => {
                this.declareDuelWinner();
            };
            if (this.role === 'guest') {
                this.buttons.nextRound.querySelector('span').innerText = "AGUARDANDO RESULTADOS...";
            } else {
                this.buttons.nextRound.querySelector('span').innerText = "VER RELATÓRIO DO DUELO";
            }
        } else {
            this.buttons.nextRound.onclick = null;
        }
        
        setTimeout(() => {
            this.showScreen('reveal');
        }, 1400);
    }

    declareDuelWinner() {
        this.stopRoundTimer();
        sfx.stopHeartbeat();
        
        if (this.ytPlayerReady) {
            this.ytPlayer.pauseVideo();
        }

        const myScore = this.role === 'host' ? this.duelScores.host : this.duelScores.guest;
        const opScore = this.role === 'host' ? this.duelScores.guest : this.duelScores.host;

        this.gameover.accuracy.innerText = `Você: ${myScore} · Rival: ${opScore}`;
        this.gameover.streak.style.display = 'none';
        this.gameover.avgTime.style.display = 'none';
        
        let rank = "DERROTA";
        let desc = `${this.opponentName} venceu o duelo por ${opScore} a ${myScore}.`;
        
        if (myScore > opScore) {
            sfx.playSuccess();
            particles.setColorType('success');
            rank = "VITÓRIA";
            desc = `Você venceu ${this.opponentName} por ${myScore} a ${opScore}.`;
        } else if (myScore === opScore) {
            sfx.playClick();
            rank = "EMPATE";
            desc = `Empate em ${myScore} a ${opScore}.`;
        } else {
            sfx.playError();
            particles.setColorType('tension');
        }

        this.gameover.rank.innerText = rank;
        this.gameover.rankDesc.innerText = desc;
        this.gameover.cause.innerText = "Duelo encerrado. Relatório arquivado pela Ordo Realitas.";
        
        this.showScreen('gameover');
    }

    updateVolumeIcons(vol) {
        const muteToggle = document.getElementById('btn-mute-toggle');
        const gameMute = document.getElementById('game-mute-toggle');
        
        let icon = 'volume_up';
        if (vol == 0) {
            icon = 'volume_off';
        } else if (vol < 50) {
            icon = 'volume_down';
        }
        
        if (muteToggle) muteToggle.innerText = icon;
        if (gameMute) gameMute.innerText = icon;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    getActiveCampaignParticleColor() {
        const campData = campaignMap[this.activeCampaign];
        return campData ? campData.particleColor : 'hexatombe';
    }

    padZero(num, size) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }
}

// Inicia o Quiz e as partículas ao carregar a página
let quizApp;
window.addEventListener('DOMContentLoaded', () => {
    particles.init();
    quizApp = new OrdemSceneQuiz();
    window.quizApp = quizApp; // Expor globalmente para acesso nas partículas
});

// A API do YouTube chama esta função global quando estiver pronta
window.onYouTubeIframeAPIReady = function() {
    if (quizApp) {
        quizApp.initYouTubePlayer();
    } else {
        setTimeout(window.onYouTubeIframeAPIReady, 200);
    }
};
