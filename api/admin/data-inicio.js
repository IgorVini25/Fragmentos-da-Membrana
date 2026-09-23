// POST /api/admin/data-inicio: data inicial do Modo Diário
const core = require('../_lib/core');
module.exports = (req, res) => core.handleAdminStartDate(req, res);
