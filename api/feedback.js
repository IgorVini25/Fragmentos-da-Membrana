// POST /api/feedback: recebe feedback, recomendação ou reporte de bug enviado pelo jogo.
const core = require('./_lib/core');
module.exports = (req, res) => core.handleFeedback(req, res);
