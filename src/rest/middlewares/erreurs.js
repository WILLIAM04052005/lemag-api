const { STATUTS } = require("../../services/erreurs");

// eslint-disable-next-line no-unused-vars
function gestionErreurs(err, req, res, next) {
  const code = err.extensions && err.extensions.code;
  if (STATUTS[code]) return res.status(STATUTS[code]).json({ erreur: err.message, code });

  // Erreur inconnue : détail dans le terminal, message neutre pour le client
  console.error(err);
  res.status(500).json({ erreur: "Erreur interne", code: "INTERNAL_SERVER_ERROR" });
}

module.exports = { gestionErreurs };