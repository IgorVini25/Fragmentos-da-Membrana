// ==========================================================================
// TODOS os textos do jogo, organizados por tela. Edite os valores aqui
// (ou pelo painel na página) para reescrever qualquer texto exibido.
// Templates usam {chaves} que são substituídas na pré-visualização.
// ==========================================================================
const CONTENT = {
    intro: {
        mainTitle: "FRAGMENTOS DA MEMBRANA",
        subtitleSelectCampaign: "Selecione uma Campanha",
        subtitleNeedOne: "Selecione ao menos uma temporada",
        subtitleAllSeasons: "TODAS AS TEMPORADAS",
        subtitleMultiTemplate: "{count} TEMPORADAS SELECIONADAS",
        descAllCampaigns: "Assista a um trecho de <strong>10 segundos</strong> de um episódio de cada temporada e adivinhe qual é o episódio.",
        descSingleCampaignTemplate: "Assista a um trecho de <strong>10 segundos</strong> retirado aleatoriamente de qualquer episódio da campanha de <strong>{campaign}</strong> e adivinhe qual é o episódio.",
        descMultiCampaigns: "Assista a trechos de <strong>10 segundos</strong> retirados aleatoriamente das temporadas selecionadas e adivinhe qual é o episódio.",
        descNoneSelected: "Selecione ao menos uma temporada para iniciar a investigação.",
        campaignsSectionTitle: "Escolha as Temporadas",
        campaignHintDefault: "Todas as temporadas começam selecionadas. Clique para remover as que não quiser na investigação.",
        campaignHintMustKeepOne: "Você precisa manter ao menos uma temporada na investigação.",
        modeSectionTitle: "Escolha o Modo de Jogo",
        historyBtn: "Histórico de Desafios",
        dailyBadge: "RECOMENDADO",
        dailyTitle: "Modo Diário",
        dailyDesc: "6 cenas por dia, uma de cada temporada. As cenas são as mesmas para todos os agentes.",
        btnShowOtherModes: "Ver Outros Modos de Jogo",
        btnBackToDaily: "← Voltar ao Modo Diário",
        classicTitle: "Modo Clássico",
        classicDesc: "10 cenas de temporadas aleatórias. Seu rank depende de quantas você acertar.",
        infiniteTitle: "Modo Infinito",
        infiniteDesc: "Cenas sem limite. Encerre quando quiser: o rank é calculado pela proporção de acertos.",
        duelBadge: "EM DESENVOLVIMENTO",
        duelTitle: "Modo Duelo (Multiplayer)",
        duelDesc: "Dispute as mesmas cenas em tempo real contra outro agente.",
        multiplayerTitle: "Conexão do Duelo Paranormal",
        createRoomTitle: "Criar uma Sala (Host)",
        createRoomInfo: "Você inicia o lobby. As cenas e tempos de início serão sincronizados a partir da sua tela.",
        btnCreateLobby: "Criar Sala",
        orDivider: "ou",
        joinRoomTitle: "Entrar em uma Sala (Convidado)",
        joinRoomInfo: "Insira o código de 4 dígitos fornecido pelo Host para conectar-se.",
        codeInputPlaceholder: "Código",
        btnJoinLobby: "Entrar",
        lobbyCodeLabel: "CÓDIGO DA SALA:",
        opponentStatusLabel: "Status:",
        opponentStatusConnected: "Conectado",
        btnStartGame: "INICIAR INVESTIGAÇÃO",
        calendarDoneTemplate: "<strong>Investigação Concluída ({date})!</strong> Você já jogou as cenas desse dia. Clique abaixo para ver o relatório.",
        calendarPendingTemplate: "<strong>Cenas do Dia {date}:</strong> descubra de qual episódio é cada uma das 6 cenas.",
        volumeLabel: "Volume Geral:"
    },

    campaigns: [
        { id: "osnf", title: "O SEGREDO NA FLORESTA", episodes: "16 Episódios", introName: "O Segredo na Floresta" },
        { id: "deconjuracao", title: "DESCONJURAÇÃO", episodes: "20 Episódios", introName: "Desconjuração" },
        { id: "calamidade", title: "CALAMIDADE", episodes: "13 Episódios", introName: "Calamidade" },
        { id: "osni", title: "O SEGREDO NA ILHA", episodes: "8 Episódios", introName: "O Segredo na Ilha" },
        { id: "sdol", title: "SINAIS DO OUTRO LADO", episodes: "7 Episódios", introName: "Sinais do Outro Lado" },
        { id: "hexatombe", title: "HEXATOMBE", episodes: "10 Episódios", introName: "Hexatombe" }
    ],

    lobby: {
        roomCreated: "Lobby criado com sucesso! Compartilhe o código com o oponente...",
        roomJoined: "Você entrou na sala do duelo.",
        opponentConnectedWithTemplate: "Conectado com {name}",
        opponentReady: "Oponente conectado. O duelo pode começar.",
        opponentTagTemplate: "Oponente: {name}",
        btnWaitingHost: "AGUARDANDO HOST...",
        btnStartDuel: "INICIAR DUELO PARANORMAL",
        connectingTemplate: "Conectando ao servidor na porta {port}...",
        channelOpenTemplate: "Conectado na porta {port}. Aguardando sala...",
        connectionFailedTemplate: "Falha ao conectar na porta {port}.",
        connectionLostAlert: "Conexão com o oponente perdida."
    },

    game: {
        labelRoundType: "CENA",
        labelScore: "ACERTOS",
        labelSanity: "SANIDADE",
        labelStreak: "SEQUÊNCIA",
        loadingText: "SINTONIZANDO FITA...",
        statusDefault: "Processando momento caótico do Outro Lado",
        statusMonitoring: "Monitorando frequência do Outro Lado",
        statusPaused: "Transmissão pausada",
        statusReady: "Monitor paranormal calibrado",
        statusError: "Erro no monitor. Buscando sinal de backup",
        statusCorrupted: "Monitor local corrompido. Corrigindo",
        statusTuning: "Ajustando sintonizador de fita",
        statusTuningMystic: "Sintonizando transmissão",
        statusReplay: "Reassistindo sinal de vídeo (+1 vez)",
        statusHintActive: "Recurso de dica ainda não disponível.",
        statusSignalCut: "Sinal de vídeo cortado, escolha um episódio!",
        signalLostTitle: "SINAL DE VÍDEO CORTADO",
        btnHint: "Obter Dica",
        hintTemplate: "Este recurso é um trabalho manual da equipe de desenvolvimento e estará disponível a partir de <strong>{date}</strong>.",
        quizInstruction: "Identifique o Episódio correspondente:",
        btnQuit: "Abandonar Investigação",
        btnReplayTitle: "Reassistir a cena (+1 vez)"
    },

    reveal: {
        detailsTitle: "Detalhes",
        contextLabel: "Contexto da Cena",
        contextExample: "Momento em que o grupo encontra o símbolo na parede da igreja.",
        btnWatchYoutube: "Assistir este Episódio completo no YouTube",
        btnNext: "AVANÇAR NA INVESTIGAÇÃO",
        btnNextLast: "VER RESULTADOS",
        correctTitle: "SANIDADE PRESERVADA",
        correctSubtitleTemplate: "Streak {streak}x",
        wrongTitle: "Resposta Errada",
        duel: {
            tieTitle: "EMPATE",
            tieSubtitle: "AMBOS ERRARAM A RODADA",
            timeoutTitle: "TEMPO ESGOTADO",
            timeoutSubtitle: "NENHUM AGENTE RESPONDEU A TEMPO",
            winTitle: "SANIDADE PRESERVADA",
            winSubtitleTemplate: "VOCÊ ACERTOU PRIMEIRO (+{points} PONTOS!)",
            loseTitle: "OPONENTE ACERTOU",
            btnWaitingHost: "AGUARDANDO HOST...",
            btnAdvanceDuel: "AVANÇAR RODADA DE DUELO",
            btnWaitingResults: "AGUARDANDO RESULTADOS...",
            btnDuelReport: "VER RELATÓRIO DO DUELO"
        }
    },

    gameover: {
        title: "RELATÓRIO DE INVESTIGAÇÃO",
        causeCompleted: "A investigação foi concluída! Relatório arquivado pela Ordo Realitas.",
        causeInfinite: "Investigação infinita interrompida. Relatório do medo arquivado pela Ordo Realitas.",
        causeDuel: "Duelo encerrado. Relatório arquivado pela Ordo Realitas.",
        lblAccuracy: "Acertos",
        lblStreak: "Maior Sequência",
        lblAvgTime: "Tempo Médio",
        rankSectionLabel: "Rank Paranormal Obtido:",
        btnRetry: "NOVA INVESTIGAÇÃO",
        btnHome: "MENU INICIAL",

        // Rank proporcional aos acertos — mesma escala para Diário, Clássico e Infinito.
        // O sistema de pontuação foi removido; 2 acertos em 6 rodadas = 6 acertos em 18 (mesma %).
        ranks: [
            { label: "0% de acertos", rank: "Mundano", desc: "Você nunca presenciou ou teve contato com o paranormal." },
            { label: "~17% de acertos", rank: "Conspiracionista", desc: "Você acredita já ter visto coisas estranhas, mas não sabe se é real ou coisa da sua cabeça." },
            { label: "~33% de acertos", rank: "Recruta", desc: "Novato recém-chegado, ainda sem experiência em campo." },
            { label: "50% de acertos", rank: "Operador", desc: "A patente mais comum da Ordem; possui experiência prática e alguns casos resolvidos." },
            { label: "~67% de acertos", rank: "Agente Especial", desc: "Veterano designado para missões complexas. Já possui autoridade para indicar novos recrutas." },
            { label: "~83% de acertos", rank: "Oficial de Operações", desc: "Especialista focado em missões de alto risco, com acesso a arquivos restritos e itens amaldiçoados." },
            { label: "100% de acertos", rank: "Agente de Elite", desc: "As lendas vivas da Ordem; os melhores combatentes, acionados exclusivamente para conter ameaças de escala global." }
        ],

        // Duelo tem seu próprio resultado (baseado em placar contra o oponente, não em acertos)
        duelOutcomes: {
            win: { rank: "VITÓRIA", descTemplate: "Você venceu {opponent} por {my} a {op}." },
            tie: { rank: "EMPATE", descTemplate: "Empate em {my} a {op}." },
            lose: { rank: "DERROTA", descTemplate: "{opponent} venceu o duelo por {op} a {my}." }
        }
    },

    modals: {
        dailyResultTitle: "Relatório de Hoje",
        dailyResultHeader: "Investigação Diária Concluída",
        dailyResultDefaultRank: "Sem registro",
        dailyResultDefaultDesc: "Nenhum relatório encontrado para este dia.",
        dailyStatAccuracy: "Acertos",
        dailyStatStreak: "Streak Máx",
        dailyStatAvgTime: "Tempo Médio",
        calendarTitle: "Histórico de Casos Paranormais"
    }
};
