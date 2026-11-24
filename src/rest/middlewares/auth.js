const { lireToken } = require("../../services/authService");

// Dépose l'utilisateur (ou null) dans req.user, sans rien bloquer
function lireUtilisateur(req, res, next) {
  req.user = lireToken(req.headers.authorization);
  next();
}

module.exports = { lireUtilisateur };