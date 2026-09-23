-- ==========================================================================
-- Fragmentos da Membrana — estatísticas gerais ACUMULADAS
-- Rode este arquivo inteiro no Supabase: Dashboard > SQL Editor > New query.
-- Pode rodar de novo sem problema.
--
-- Nada é guardado por jogador: cada partida só soma nos contadores abaixo.
-- As médias e porcentagens são colunas calculadas automaticamente.
-- ==========================================================================

-- Remove a versão antiga (uma linha por partida), caso tenha sido criada
drop view if exists public.daily_stats, public.daily_scene_stats, public.episode_stats, public.mode_stats;
drop table if exists public.game_results;


-- Um registro por dia do Modo Diário
create table if not exists public.stats_diario (
    dia                  date primary key,
    jogadores            int     not null default 0,
    acertos              int     not null default 0,   -- soma dos acertos de todos
    soma_tempo           numeric not null default 0,   -- soma dos tempos de resposta (s)
    soma_maior_sequencia int     not null default 0,
    gabaritaram          int     not null default 0,   -- 6/6
    zeraram              int     not null default 0,   -- 0/6
    -- quantos jogadores fizeram 0, 1, 2, 3, 4, 5 e 6 acertos (posições 1 a 7)
    distribuicao         int[]   not null default '{0,0,0,0,0,0,0}',
    media_acertos        numeric generated always as (case when jogadores > 0 then round(acertos::numeric / jogadores, 2) end) stored,
    taxa_acerto_pct      numeric generated always as (case when jogadores > 0 then round(acertos * 100.0 / (jogadores * 6), 1) end) stored,
    tempo_medio_s        numeric generated always as (case when jogadores > 0 then round(soma_tempo / (jogadores * 6), 2) end) stored,
    atualizado_em        timestamptz not null default now()
);

-- Um registro por cena de cada dia do Modo Diário (qual cena do dia foi mais difícil)
create table if not exists public.stats_diario_cenas (
    dia             date not null,
    cena            int  not null,   -- 1 a 6
    temporada       text not null,
    episodio        text not null,
    respostas       int     not null default 0,
    acertos         int     not null default 0,
    soma_tempo      numeric not null default 0,
    taxa_acerto_pct numeric generated always as (case when respostas > 0 then round(acertos * 100.0 / respostas, 1) end) stored,
    tempo_medio_s   numeric generated always as (case when respostas > 0 then round(soma_tempo / respostas, 2) end) stored,
    primary key (dia, cena)
);

-- Um registro por episódio, somando todos os modos (episódios mais fáceis/difíceis)
create table if not exists public.stats_episodios (
    temporada       text not null,
    episodio        text not null,
    vezes_sorteado  int     not null default 0,
    acertos         int     not null default 0,
    soma_tempo      numeric not null default 0,
    taxa_acerto_pct numeric generated always as (case when vezes_sorteado > 0 then round(acertos * 100.0 / vezes_sorteado, 1) end) stored,
    tempo_medio_s   numeric generated always as (case when vezes_sorteado > 0 then round(soma_tempo / vezes_sorteado, 2) end) stored,
    primary key (temporada, episodio)
);

-- Um registro por modo de jogo (daily, classic, infinite)
create table if not exists public.stats_modos (
    modo             text primary key,
    partidas         int     not null default 0,
    cenas            int     not null default 0,
    acertos          int     not null default 0,
    soma_tempo       numeric not null default 0,
    maior_sequencia  int     not null default 0,   -- recorde geral
    media_cenas      numeric generated always as (case when partidas > 0 then round(cenas::numeric / partidas, 1) end) stored,
    taxa_acerto_pct  numeric generated always as (case when cenas > 0 then round(acertos * 100.0 / cenas, 1) end) stored,
    tempo_medio_s    numeric generated always as (case when cenas > 0 then round(soma_tempo / cenas, 2) end) stored,
    atualizado_em    timestamptz not null default now()
);

-- RLS ligado e sem policies: só o servidor (service_role) lê e grava.
alter table public.stats_diario       enable row level security;
alter table public.stats_diario_cenas enable row level security;
alter table public.stats_episodios    enable row level security;
alter table public.stats_modos        enable row level security;


-- --------------------------------------------------------------------------
-- Soma uma partida finalizada nos contadores. Chamada pelo server.js via
-- POST /rest/v1/rpc/registrar_partida  { "partida": { ... } }
--
-- partida = {
--   "modo": "daily" | "classic" | "infinite",
--   "dia": "2026-09-22" (só no diário),
--   "acertos": 3, "total": 6, "maior_sequencia": 2, "soma_tempo": 34.9,
--   "cenas": [{ "cena": 1, "temporada": "osnf", "episodio": "Episódio 2", "acertou": false, "tempo": 10 }, ...]
-- }
-- --------------------------------------------------------------------------
create or replace function public.registrar_partida(partida jsonb)
returns void
language plpgsql
set search_path = public
as $$
declare
    v_modo       text    := partida ->> 'modo';
    v_dia        date    := nullif(partida ->> 'dia', '')::date;
    v_acertos    int     := (partida ->> 'acertos')::int;
    v_total      int     := (partida ->> 'total')::int;
    v_sequencia  int     := (partida ->> 'maior_sequencia')::int;
    v_soma_tempo numeric := (partida ->> 'soma_tempo')::numeric;
    c            jsonb;
begin
    -- insert ... do nothing + update: garante a linha e incrementa com lock,
    -- então partidas simultâneas não se sobrescrevem
    insert into stats_modos (modo) values (v_modo) on conflict do nothing;
    update stats_modos set
        partidas        = partidas + 1,
        cenas           = cenas + v_total,
        acertos         = acertos + v_acertos,
        soma_tempo      = soma_tempo + v_soma_tempo,
        maior_sequencia = greatest(maior_sequencia, v_sequencia),
        atualizado_em   = now()
    where modo = v_modo;

    if v_modo = 'daily' then
        insert into stats_diario (dia) values (v_dia) on conflict do nothing;
        update stats_diario set
            jogadores            = jogadores + 1,
            acertos              = acertos + v_acertos,
            soma_tempo           = soma_tempo + v_soma_tempo,
            soma_maior_sequencia = soma_maior_sequencia + v_sequencia,
            gabaritaram          = gabaritaram + (v_acertos = v_total)::int,
            zeraram              = zeraram + (v_acertos = 0)::int,
            distribuicao[v_acertos + 1] = distribuicao[v_acertos + 1] + 1,
            atualizado_em        = now()
        where dia = v_dia;
    end if;

    for c in select * from jsonb_array_elements(partida -> 'cenas') loop
        insert into stats_episodios (temporada, episodio)
        values (c ->> 'temporada', c ->> 'episodio') on conflict do nothing;
        update stats_episodios set
            vezes_sorteado = vezes_sorteado + 1,
            acertos        = acertos + (c ->> 'acertou')::boolean::int,
            soma_tempo     = soma_tempo + (c ->> 'tempo')::numeric
        where temporada = c ->> 'temporada' and episodio = c ->> 'episodio';

        if v_modo = 'daily' then
            insert into stats_diario_cenas (dia, cena, temporada, episodio)
            values (v_dia, (c ->> 'cena')::int, c ->> 'temporada', c ->> 'episodio') on conflict do nothing;
            update stats_diario_cenas set
                respostas  = respostas + 1,
                acertos    = acertos + (c ->> 'acertou')::boolean::int,
                soma_tempo = soma_tempo + (c ->> 'tempo')::numeric
            where dia = v_dia and cena = (c ->> 'cena')::int;
        end if;
    end loop;
end;
$$;

-- Só o servidor (service_role) pode registrar partidas
revoke execute on function public.registrar_partida(jsonb) from public;
do $$
begin
    if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke execute on function public.registrar_partida(jsonb) from anon, authenticated;
    end if;
end $$;


-- ==========================================================================
-- PAINEL /admin
-- ==========================================================================

-- Configurações gerais editadas pelo /admin (ex.: data_inicio_diario = '2026-10-01')
create table if not exists public.config (
    chave         text primary key,
    valor         text,
    atualizado_em timestamptz not null default now()
);

-- Ajustes das cenas do Modo Diário. Só existem linhas para as cenas que algum admin mexeu;
-- as outras seguem o sorteio normal.
create table if not exists public.cenas_diario_ajustes (
    dia           date not null,
    temporada     text not null check (temporada in ('osnf', 'deconjuracao', 'calamidade', 'osni', 'sdol', 'hexatombe')),
    -- 0 = sorteio normal. Cada vez que a cena cai em abertura, intervalo ou encerramento,
    -- sobe 1 e o jogo sorteia outro momento do MESMO episódio (algoritmo secundário).
    tentativa     int  not null default 0 check (tentativa >= 0),
    -- motivo de cada marcação, na ordem (o último é o da tentativa atual)
    motivos       text[] not null default '{}' check (motivos <@ array['abertura', 'intervalo', 'encerramento']),
    contexto      text check (char_length(contexto) <= 1000),   -- "Contexto da Cena", opcional
    atualizado_em timestamptz not null default now(),
    primary key (dia, temporada)
);

alter table public.config               enable row level security;
alter table public.cenas_diario_ajustes enable row level security;

-- Marca que a cena caiu em abertura/intervalo/encerramento: sobe a tentativa e apaga o
-- contexto (ele descrevia o momento antigo). Retorna a nova tentativa.
create or replace function public.marcar_cena_ruim(p_dia date, p_temporada text, p_motivo text)
returns int
language sql
set search_path = public
as $$
    insert into cenas_diario_ajustes (dia, temporada, tentativa, motivos, contexto)
    values (p_dia, p_temporada, 1, array[p_motivo], null)
    on conflict (dia, temporada) do update set
        tentativa     = cenas_diario_ajustes.tentativa + 1,
        motivos       = cenas_diario_ajustes.motivos || p_motivo,
        contexto      = null,
        atualizado_em = now()
    returning tentativa;
$$;

-- Volta uma tentativa (marcação feita por engano). Também apaga o contexto. Retorna a nova tentativa.
create or replace function public.desfazer_marcacao(p_dia date, p_temporada text)
returns int
language sql
set search_path = public
as $$
    update cenas_diario_ajustes set
        tentativa     = greatest(tentativa - 1, 0),
        motivos       = motivos[1:greatest(tentativa - 1, 0)],
        contexto      = null,
        atualizado_em = now()
    where dia = p_dia and temporada = p_temporada
    returning tentativa;
$$;

-- Salva o contexto da cena. p_tentativa é a tentativa que o admin estava vendo: se outro admin
-- trocou a cena nesse meio-tempo, não salva (retorna false) para o texto não ir para a cena errada.
create or replace function public.salvar_contexto(p_dia date, p_temporada text, p_tentativa int, p_contexto text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
    v_atual int;
begin
    select tentativa into v_atual
    from cenas_diario_ajustes
    where dia = p_dia and temporada = p_temporada
    for update;

    if coalesce(v_atual, 0) <> p_tentativa then
        return false;
    end if;

    insert into cenas_diario_ajustes (dia, temporada, tentativa, contexto)
    values (p_dia, p_temporada, p_tentativa, nullif(btrim(p_contexto), ''))
    on conflict (dia, temporada) do update set
        contexto      = excluded.contexto,
        atualizado_em = now();
    return true;
end;
$$;

-- Data inicial do Modo Diário (null remove a trava)
create or replace function public.salvar_data_inicio(p_data date)
returns void
language sql
set search_path = public
as $$
    insert into config (chave, valor) values ('data_inicio_diario', p_data::text)
    on conflict (chave) do update set valor = excluded.valor, atualizado_em = now();
$$;

-- Só o servidor (service_role) pode chamar as funções do admin
revoke execute on function public.marcar_cena_ruim(date, text, text)       from public;
revoke execute on function public.desfazer_marcacao(date, text)            from public;
revoke execute on function public.salvar_contexto(date, text, int, text)   from public;
revoke execute on function public.salvar_data_inicio(date)                 from public;
do $$
begin
    if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke execute on function public.marcar_cena_ruim(date, text, text)     from anon, authenticated;
        revoke execute on function public.desfazer_marcacao(date, text)          from anon, authenticated;
        revoke execute on function public.salvar_contexto(date, text, int, text) from anon, authenticated;
        revoke execute on function public.salvar_data_inicio(date)               from anon, authenticated;
    end if;
end $$;


-- ==========================================================================
-- LOGIN DO /admin: limite de tentativas erradas
-- Guarda só um hash do IP (nunca o IP), e as linhas somem sozinhas depois de 15 minutos.
-- Fica no banco porque na Vercel cada requisição pode cair numa instância diferente.
-- ==========================================================================
create table if not exists public.admin_login_falhas (
    chave      text primary key,          -- HMAC do IP
    tentativas int not null default 0,
    desde      timestamptz not null default now()
);
alter table public.admin_login_falhas enable row level security;

-- Tentativas erradas nos últimos 15 minutos
create or replace function public.falhas_login(p_chave text)
returns int
language sql
stable
set search_path = public
as $$
    select coalesce((
        select tentativas from admin_login_falhas
        where chave = p_chave and desde >= now() - interval '15 minutes'
    ), 0);
$$;

-- Registra uma tentativa errada (a janela de 15 minutos começa na primeira)
create or replace function public.registrar_falha_login(p_chave text)
returns int
language sql
set search_path = public
as $$
    delete from admin_login_falhas where desde < now() - interval '15 minutes';
    insert into admin_login_falhas (chave, tentativas, desde) values (p_chave, 1, now())
    on conflict (chave) do update set tentativas = admin_login_falhas.tentativas + 1
    returning tentativas;
$$;

-- Login certo zera as tentativas daquele IP
create or replace function public.limpar_falhas_login(p_chave text)
returns void
language sql
set search_path = public
as $$
    delete from admin_login_falhas where chave = p_chave;
$$;

revoke execute on function public.falhas_login(text)          from public;
revoke execute on function public.registrar_falha_login(text) from public;
revoke execute on function public.limpar_falhas_login(text)   from public;


-- ==========================================================================
-- PERMISSÕES
-- O Supabase dá acesso às tabelas e funções novas para as chaves públicas (anon/authenticated).
-- O RLS sem policies já bloqueia os dados, mas aqui tiramos também as permissões:
-- só o servidor (service_role) usa este banco.
-- ==========================================================================
do $$
begin
    if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke all on table
            public.stats_diario, public.stats_diario_cenas, public.stats_episodios, public.stats_modos,
            public.config, public.cenas_diario_ajustes, public.admin_login_falhas
        from anon, authenticated;

        revoke execute on function public.registrar_partida(jsonb)               from anon, authenticated;
        revoke execute on function public.falhas_login(text)                     from anon, authenticated;
        revoke execute on function public.registrar_falha_login(text)            from anon, authenticated;
        revoke execute on function public.limpar_falhas_login(text)              from anon, authenticated;
    end if;
end $$;
