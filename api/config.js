// GET /config.js (via rewrite no vercel.json): configuração lida pelo jogo
const core = require('./_lib/core');
module.exports = (req, res) => core.handleConfig(req, res);
