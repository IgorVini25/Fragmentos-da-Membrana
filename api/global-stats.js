// GET /api/global-stats?day=AAAA-MM-DD: média geral de um dia do Diário (agregada, sem nenhum
// dado de jogador), para o jogo comparar com o resultado do próprio jogador.
const core = require('./_lib/core');
module.exports = (req, res) => core.handleGlobalStats(req, res);
