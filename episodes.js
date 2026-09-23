/**
 * Episódios de cada temporada e sorteio das cenas do Modo Diário.
 * Compartilhado entre o jogo (index.html) e o painel /admin, para que os dois
 * calculem exatamente as mesmas cenas de cada dia.
 */

// ==========================================
// BANCOS DE DADOS DAS CAMPANHAS
// =======================================
const HEXATOMBE_DATABASE = [
    {
        "title": "Episódio 1 - \"Receptáculo\"",
        "episodeNum": "Episódio 1",
        "youtubeId": "DMzwnM6gwBY"
    },
    {
        "title": "Episódio 2 - \"Portal\"",
        "episodeNum": "Episódio 2",
        "youtubeId": "OOLM72CU84w"
    },
    {
        "title": "Episódio 3 - \"Um Novo Começo\"",
        "episodeNum": "Episódio 3",
        "youtubeId": "trLRev31rQ8"
    },
    {
        "title": "Episódio 4 - \"Máscara\"",
        "episodeNum": "Episódio 4",
        "youtubeId": "yh_J363Ork4"
    },
    {
        "title": "Episódio 5 - \"Encontro\"",
        "episodeNum": "Episódio 5",
        "youtubeId": "zsOSZ_r9mhg"
    },
    {
        "title": "Episódio 6 - \"Decisão\"",
        "episodeNum": "Episódio 6",
        "youtubeId": "J55mRb1n5L4"
    },
    {
        "title": "Episódio 7 - \"Consequências\"",
        "episodeNum": "Episódio 7",
        "youtubeId": "K_c2VdmPuLg"
    },
    {
        "title": "Episódio 8 - \"Culpa\"",
        "episodeNum": "Episódio 8",
        "youtubeId": "-7prXUHT8OM"
    },
    {
        "title": "Episódio 9 - \"Banho de Sangue\"",
        "episodeNum": "Episódio 9",
        "youtubeId": "p5alZam12ss"
    },
    {
        "title": "Episódio 10 - \"Renascimento\"",
        "episodeNum": "Episódio 10",
        "youtubeId": "g53ZfYHUQOw"
    }
];

const CALAMIDADE_DATABASE = [
    {
        "title": "Episódio 0 - \"Calamidade\"",
        "episodeNum": "Episódio 0",
        "youtubeId": "d7TleOmBKg4"
    },
    {
        "title": "Episódio 1 - \"O Começo do Fim\"",
        "episodeNum": "Episódio 1",
        "youtubeId": "TRSlNehdWzs"
    },
    {
        "title": "Episódio 2 - \"Vingança\"",
        "episodeNum": "Episódio 2",
        "youtubeId": "YN4QATSyahs"
    },
    {
        "title": "Episódio 3 - \"Pacto\"",
        "episodeNum": "Episódio 3",
        "youtubeId": "P6Bc3pJ1qrY"
    },
    {
        "title": "Episódio 4 - \"Anfiteatro\"",
        "episodeNum": "Episódio 4",
        "youtubeId": "OsWeJVcojjg"
    },
    {
        "title": "Episódio 5 - \"Ordo Calamitas\"",
        "episodeNum": "Episódio 5",
        "youtubeId": "2sxn1WyqMq0"
    },
    {
        "title": "Episódio 6 - \"Jogos\"",
        "episodeNum": "Episódio 6",
        "youtubeId": "ev5YLg7AJqY"
    },
    {
        "title": "Episódio 7 - \"Traição\"",
        "episodeNum": "Episódio 7",
        "youtubeId": "VtElALnxnF0"
    },
    {
        "title": "Episódio 8 - \"Escolha\"",
        "episodeNum": "Episódio 8",
        "youtubeId": "Dh1sYN68vOE"
    },
    {
        "title": "Episódio 9 - \"Síntese\"",
        "episodeNum": "Episódio 9",
        "youtubeId": "dcYEBL45Pdw"
    },
    {
        "title": "Episódio 10 - \"Tempo\"",
        "episodeNum": "Episódio 10",
        "youtubeId": "gxjhNekQ0l4"
    },
    {
        "title": "Episódio 11 - \"Guerreiro\"",
        "episodeNum": "Episódio 11",
        "youtubeId": "9TGMsocV_bw"
    },
    {
        "title": "Episódio 12 - \"Olhos\"",
        "episodeNum": "Episódio 12",
        "youtubeId": "tdb8jng7qwQ"
    }
];

const OSNF_DATABASE = [
    {
        "title": "Episódio 1 - \"Equipe Kelvin\"",
        "episodeNum": "Episódio 1",
        "youtubeId": "23z-tCHgMGI"
    },
    {
        "title": "Episódio 2 - \"O Sanatório\"",
        "episodeNum": "Episódio 2",
        "youtubeId": "sq37bBDs8vk"
    },
    {
        "title": "Episódio 3 - \"Aracnofobia\"",
        "episodeNum": "Episódio 3",
        "youtubeId": "qzUD-387XhM"
    },
    {
        "title": "Episódio 4 - \"Despedida\"",
        "episodeNum": "Episódio 4",
        "youtubeId": "NhhnGF1Lpx4"
    },
    {
        "title": "Episódio 5 - \"A Casa\"",
        "episodeNum": "Episódio 5",
        "youtubeId": "mtXiwMX0K-c"
    },
    {
        "title": "Episódio 6 - \"Virgulino\"",
        "episodeNum": "Episódio 6",
        "youtubeId": "03Led-EYcA8"
    },
    {
        "title": "Episódio 7 - \"Cemitério\"",
        "episodeNum": "Episódio 7",
        "youtubeId": "VldAD6_DMgw"
    },
    {
        "title": "Episódio 8 - \"O Segredo\"",
        "episodeNum": "Episódio 8",
        "youtubeId": "gYdRp7eohyQ"
    },
    {
        "title": "Episódio 9 - \"Santo Berço\"",
        "episodeNum": "Episódio 9",
        "youtubeId": "En2JC9n66bo"
    },
    {
        "title": "Episódio 10 - \"Hotel\"",
        "episodeNum": "Episódio 10",
        "youtubeId": "ZCY9Ez6gzfY"
    },
    {
        "title": "Episódio 11 - \"Símbolo\"",
        "episodeNum": "Episódio 11",
        "youtubeId": "lPEH0PmDA9M"
    },
    {
        "title": "Episódio 12 - \"Torre\"",
        "episodeNum": "Episódio 12",
        "youtubeId": "Rjkt4KpNpBM"
    },
    {
        "title": "Episódio 13 - \"A Caverna\"",
        "episodeNum": "Episódio 13",
        "youtubeId": "cOTLH2R_iiE"
    },
    {
        "title": "Episódio 14 - \"A Porta\"",
        "episodeNum": "Episódio 14",
        "youtubeId": "jVJkjOOFIyw"
    },
    {
        "title": "Episódio 15 - \"Manancial\"",
        "episodeNum": "Episódio 15",
        "youtubeId": "o6_N14zB80s"
    },
    {
        "title": "Episódio Final - \"Equipe E\"",
        "episodeNum": "Episódio Final",
        "youtubeId": "BH-yFQo882w"
    }
];

const DECONJURACAO_DATABASE = [
    {
        "title": "Episódio 1 - \"Ordo Realitas\"",
        "episodeNum": "Episódio 1",
        "youtubeId": "b7PvLWZR6pg"
    },
    {
        "title": "Episódio 2 - \"Sangue\"",
        "episodeNum": "Episódio 2",
        "youtubeId": "NWcpezJHlb8"
    },
    {
        "title": "Episódio 3 - \"Transcender\"",
        "episodeNum": "Episódio 3",
        "youtubeId": "NDq5ETNosdA"
    },
    {
        "title": "Episódio 4 - \"Orfanato\"",
        "episodeNum": "Episódio 4",
        "youtubeId": "sn4B_3KyzYw"
    },
    {
        "title": "Episódio 5 - \"Escriptas\"",
        "episodeNum": "Episódio 5",
        "youtubeId": "3XoyEwGk_MA"
    },
    {
        "title": "Episódio 6 - \"Elizabeth\"",
        "episodeNum": "Episódio 6",
        "youtubeId": "LepK245_uUw"
    },
    {
        "title": "Episódio 7 - \"Anfitrião\"",
        "episodeNum": "Episódio 7",
        "youtubeId": "Bi0KoBhpeCw"
    },
    {
        "title": "Episódio 8 - \"Reunião\"",
        "episodeNum": "Episódio 8",
        "youtubeId": "mrJvp64_tL4"
    },
    {
        "title": "Episódio 9 - \"Mansão Assombrada\"",
        "episodeNum": "Episódio 9",
        "youtubeId": "N0jF0svrc7w"
    },
    {
        "title": "Episódio 10 - \"Fotografias\"",
        "episodeNum": "Episódio 10",
        "youtubeId": "epdl81SKm6o"
    },
    {
        "title": "Episódio 11 - \"Lembrar\"",
        "episodeNum": "Episódio 11",
        "youtubeId": "lkjp80bSj2g"
    },
    {
        "title": "Episódio 12 - \"Mudança\"",
        "episodeNum": "Episódio 12",
        "youtubeId": "7Nticvm0PbM"
    },
    {
        "title": "Episódio 13 - \"Bruxa Arrependida\"",
        "episodeNum": "Episódio 13",
        "youtubeId": "e7UDrn-wDks"
    },
    {
        "title": "Episódio 14 - \"O Espreitador\"",
        "episodeNum": "Episódio 14",
        "youtubeId": "g9i8d-bSWRA"
    },
    {
        "title": "Episódio 15 - \"Divina Comédia\"",
        "episodeNum": "Episódio 15",
        "youtubeId": "ta4x_cV5OJw"
    },
    {
        "title": "Episódio 16 - \"Melodia\"",
        "episodeNum": "Episódio 16",
        "youtubeId": "kqF7svnqhy0"
    },
    {
        "title": "Episódio 17 - \"Sacrifício\"",
        "episodeNum": "Episódio 17",
        "youtubeId": "nAqPmCAuWxo"
    },
    {
        "title": "Episódio 18 - \"Enpap\"",
        "episodeNum": "Episódio 18",
        "youtubeId": "ZEpMspaVfDw"
    },
    {
        "title": "Episódio 19 - \"Tirigan\"",
        "episodeNum": "Episódio 19",
        "youtubeId": "reGd6QjPc9s"
    },
    {
        "title": "Episódio Final - \"Kian\"",
        "episodeNum": "Episódio Final",
        "youtubeId": "oTCZaA_cHcs"
    }
];

const OSNI_DATABASE = [
    {
        "title": "Episódio 1 - \"Tipora\"",
        "episodeNum": "Episódio 1",
        "youtubeId": "Pf4HzTdA2WE"
    },
    {
        "title": "Episódio 2 - \"Praia\"",
        "episodeNum": "Episódio 2",
        "youtubeId": "wiGlOf3mCVM"
    },
    {
        "title": "Episódio 3 - \"Pavor\"",
        "episodeNum": "Episódio 3",
        "youtubeId": "hxhsZeREpok"
    },
    {
        "title": "Episódio 4 - \"Pesadelo\"",
        "episodeNum": "Episódio 4",
        "youtubeId": "b0Rr9RPUnQ4"
    },
    {
        "title": "Episódio 5 - \"Penhasco\"",
        "episodeNum": "Episódio 5",
        "youtubeId": "6yHpP3dsaws"
    },
    {
        "title": "Episódio 6 - \"Profecia\"",
        "episodeNum": "Episódio 6",
        "youtubeId": "-ucsTx0u4Lo"
    },
    {
        "title": "Episódio 7 - \"Prosopagnosia\"",
        "episodeNum": "Episódio 7",
        "youtubeId": "pVTvxcBJzzU"
    },
    {
        "title": "Episódio Final - \"Florence\"",
        "episodeNum": "Episódio Final",
        "youtubeId": "jo426LkONNc"
    }
];

const SDOL_DATABASE = [
    {
        "title": "Episódio 1 - \"Alheios\"",
        "episodeNum": "Episódio 1",
        "youtubeId": "k5y48mQTdpE"
    },
    {
        "title": "Episódio 2 - \"Parasita\"",
        "episodeNum": "Episódio 2",
        "youtubeId": "ouAWcImB1WY"
    },
    {
        "title": "Episódio 3 - \"Ainda Eu\"",
        "episodeNum": "Episódio 3",
        "youtubeId": "O24CGT-acoU"
    },
    {
        "title": "Episódio 4 - \"Escolhida\"",
        "episodeNum": "Episódio 4",
        "youtubeId": "uQSyXm1oMKw"
    },
    {
        "title": "Episódio 5 - \"Os Quatro\"",
        "episodeNum": "Episódio 5",
        "youtubeId": "eQ4t1ABNTrs"
    },
    {
        "title": "Episódio 6 - \"TV Varminho\"",
        "episodeNum": "Episódio 6",
        "youtubeId": "hqLilZQJA2M"
    },
    {
        "title": "Episódio Final - \"Transmissão\"",
        "episodeNum": "Episódio Final",
        "youtubeId": "kZPUmedtdf8"
    }
];


// Temporadas do Modo Diário, na ordem das 6 cenas do dia
const DAILY_CAMPAIGNS = [
    { id: 'osnf', title: 'O Segredo na Floresta', db: OSNF_DATABASE },
    { id: 'deconjuracao', title: 'Desconjuração', db: DECONJURACAO_DATABASE },
    { id: 'calamidade', title: 'Calamidade', db: CALAMIDADE_DATABASE },
    { id: 'osni', title: 'O Segredo na Ilha', db: OSNI_DATABASE },
    { id: 'sdol', title: 'Sinais do Outro Lado', db: SDOL_DATABASE },
    { id: 'hexatombe', title: 'Hexatombe', db: HEXATOMBE_DATABASE }
];

// Algoritmo FNV-1a de 32-bits para hashing + Gerador pseudo-aleatório Mulberry32
function seedRandom(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return function() {
        let z = (h += 0x6D2B79F5);
        z = Math.imul(z ^ (z >>> 15), z | 1);
        z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
        return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
}

// Momento inicial da cena: de 10 min (600s) até 1h25 (5100s) do episódio
function randomStartSeconds(rand) {
    return Math.floor(rand() * 4500) + 600;
}

/**
 * Cenas do Modo Diário de uma data (AAAA-MM-DD): uma por temporada, iguais para todos.
 * ajustes = { [temporada]: { tentativa, contexto } }, vindos do painel /admin.
 * Tentativa 0 é o sorteio normal. Quando a cena cai em abertura, intervalo ou encerramento,
 * o admin marca e a tentativa sobe: o episódio continua o mesmo e só o momento é sorteado
 * de novo pelo algoritmo secundário (semente "data|temporada|tentativa").
 */
function buildDailyScenes(dateStr, ajustes = {}) {
    const rand = seedRandom(dateStr);
    const scenes = [];

    DAILY_CAMPAIGNS.forEach(item => {
        if (!item.db || item.db.length === 0) return;

        // Sempre consome o sorteio principal, para as outras temporadas do dia não mudarem
        const idx = Math.floor(rand() * item.db.length);
        let startSeconds = randomStartSeconds(rand);

        const ajuste = ajustes[item.id] || {};
        const tentativa = Number.isInteger(ajuste.tentativa) && ajuste.tentativa > 0 ? ajuste.tentativa : 0;
        if (tentativa > 0) {
            startSeconds = randomStartSeconds(seedRandom(`${dateStr}|${item.id}|${tentativa}`));
        }

        scenes.push({
            ...item.db[idx],
            campaignId: item.id,
            startSeconds,
            tentativa,
            contexto: ajuste.contexto || ''
        });
    });

    return scenes;
}


// No servidor (Node), o mesmo arquivo é usado para validar estatísticas e o Duelo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DAILY_CAMPAIGNS, buildDailyScenes };
}
