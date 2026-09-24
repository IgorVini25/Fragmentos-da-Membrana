// POST /api/game-start: conta um início de partida (Diário/Clássico/Infinito), para o botão
// "Estatísticas" do /admin. Independe de a partida ser concluída ou abandonada depois.
const core = require('./_lib/core');
module.exports = (req, res) => core.handleGameStart(req, res);
