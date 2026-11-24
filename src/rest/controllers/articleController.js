const articles = require("../../services/articleService");

const lire = async (req, res) => res.json(await articles.trouver(req.params.id, req.user));
const historique = async (req, res) => res.json(await articles.historique(req.params.id, req.user));
const restaurer = async (req, res) =>
  res.json(await articles.restaurer(req.params.id, req.params.version, req.user));

module.exports = { lire, historique, restaurer };