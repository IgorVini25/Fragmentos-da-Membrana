// GET /api/daily/AAAA-MM-DD: ajustes do /admin para as cenas do dia (algoritmo secundário e contexto)
const core = require('../_lib/core');
module.exports = (req, res) => core.handleDaily(req, res, String(req.query.date || ''));
