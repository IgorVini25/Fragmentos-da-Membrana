// GET /api/admin/dia/AAAA-MM-DD: ajustes e data inicial, para o painel
const core = require('../../_lib/core');
module.exports = (req, res) => core.handleAdminDay(req, res, String(req.query.date || ''));
