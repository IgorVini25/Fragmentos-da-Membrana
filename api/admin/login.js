// POST /api/admin/login: troca a senha por um token de sessão de 8 horas
const core = require('../_lib/core');
module.exports = (req, res) => core.handleAdminLogin(req, res);
