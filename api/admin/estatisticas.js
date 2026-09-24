// GET /api/admin/estatisticas?de=AAAA-MM-DD&ate=AAAA-MM-DD: quantas vezes cada modo foi
// iniciado por dia, para o botão "Estatísticas" do painel.
const core = require('../_lib/core');
module.exports = (req, res) => core.handleAdminStats(req, res);
