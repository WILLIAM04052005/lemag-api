const prisma = require("../prisma");

function lister() {
  return prisma.categorie.findMany({ orderBy: { libelle: "asc" } });
}

module.exports = { lister };