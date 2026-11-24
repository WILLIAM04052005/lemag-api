const prisma = require("../prisma");
const { AppError, traduirePrisma } = require("./erreurs");
const { exigerRole } = require("./authService");

const ROLES = ["lecteur", "admin"];

async function lister(user) {
  exigerRole(user, "admin");
  return prisma.utilisateur.findMany({
    omit: { motDePasse: true }, // déjà omis globalement, on l'écrit pour être explicite
    orderBy: { id: "asc" },
  });
}

async function changerRole(id, role, user) {
  exigerRole(user, "admin");                       // 401 / 403
  if (!ROLES.includes(role)) {                     // 422
    throw new AppError(`Rôle invalide (attendu : ${ROLES.join(" ou ")})`, "BAD_USER_INPUT");
  }
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new AppError("Utilisateur introuvable", "NOT_FOUND");

  try {
    return await prisma.utilisateur.update({
      where: { id: n },
      data: { role },
      omit: { motDePasse: true },
    });
  } catch (err) {
    throw traduirePrisma(err);                      // P2025 → 404
  }
}

module.exports = { lister, changerRole };