// GET /api/admin/feedbacks?tipo=: lista os feedbacks enviados pelos jogadores (só admin).
const core = require('../_lib/core');
module.exports = (req, res) => core.handleAdminFeedbacks(req, res);
