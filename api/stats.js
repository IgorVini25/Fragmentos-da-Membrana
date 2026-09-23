// POST /api/stats: soma o resultado de uma partida nas estatísticas gerais
const core = require('./_lib/core');
module.exports = (req, res) => core.handleStats(req, res);
