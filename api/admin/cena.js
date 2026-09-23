// POST /api/admin/cena: marcar/desfazer cena ruim e salvar contexto
const core = require('../_lib/core');
module.exports = (req, res) => core.handleAdminScene(req, res);
