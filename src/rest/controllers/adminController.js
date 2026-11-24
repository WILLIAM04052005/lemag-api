const utilisateurs = require("../../services/utilisateurService");

const lister = async (req, res) => res.json(await utilisateurs.lister(req.user));
const changerRole = async (req, res) =>
  res.json(await utilisateurs.changerRole(req.params.id, req.body && req.body.role, req.user));

module.exports = { lister, changerRole };