// GET /api/global-stats?mode=daily&day=AAAA-MM-DD (ou mode=classic|infinite): estatísticas agregadas,
// sem nenhum dado de jogador, para o jogo comparar com o resultado do próprio jogador.
const core = require('./_lib/core');
module.exports = (req, res) => core.handleGlobalStats(req, res);
