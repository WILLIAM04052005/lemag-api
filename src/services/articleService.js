const prisma = require("../prisma");
const Revision = require("../models/Revision");
const { AppError, traduirePrisma } = require("./erreurs");
const { exigerConnexion } = require("./authService");

// Règle 4 : un visiteur ne voit que les articles publiés
const visibles = (user) => (user ? {} : { publie: true });

function verifierId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new AppError("Article introuvable", "NOT_FOUND");
  return n;
}

// Lecture : un brouillon demandé par un visiteur → 404 (on ne révèle même pas qu'il existe)
async function trouver(id, user) {
  const article = await prisma.article.findUnique({ where: { id: verifierId(id) } });
  if (!article || (!article.publie && !user)) throw new AppError("Article introuvable", "NOT_FOUND");
  return article;
}

// Règle 3 : écriture réservée à l'auteur ou à un admin
// Ordre des vérifications : 401 (pas connecté) → 404 (introuvable) → 403 (pas le sien)
async function trouverPourEcriture(id, user) {
  exigerConnexion(user);
  const article = await prisma.article.findUnique({ where: { id: verifierId(id) } });
  if (!article) throw new AppError("Article introuvable", "NOT_FOUND");
  if (user.role !== "admin" && article.auteurId !== user.id) {
    throw new AppError("Réservé à l'auteur ou à un admin", "FORBIDDEN");
  }
  return article;
}

async function lister({ page = 1, limite = 10, recherche } = {}, user) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(50, Math.max(1, Number(limite) || 10));

  const where = {
    ...visibles(user),
    ...(recherche && { titre: { contains: recherche, mode: "insensitive" } }),
  };

  const [articles, total] = await prisma.$transaction([
    prisma.article.findMany({ where, orderBy: { creeLe: "desc" }, skip: (p - 1) * l, take: l }),
    prisma.article.count({ where }),
  ]);

  return { page: p, limite: l, total, articles };
}

// Pour les resolvers de champ Utilisateur.articles et Categorie.articles
function listerParAuteur(auteurId, user) {
  return prisma.article.findMany({ where: { auteurId, ...visibles(user) }, orderBy: { creeLe: "desc" } });
}

function listerParCategorie(categorieId, user) {
  return prisma.article.findMany({ where: { categorieId, ...visibles(user) }, orderBy: { creeLe: "desc" } });
}

// Règle 2 : connecté, et l'auteur est TOUJOURS l'utilisateur connecté
async function creer({ titre, contenu }, user) {
  exigerConnexion(user);
  if (!titre || !titre.trim() || !contenu || !contenu.trim()) {
    throw new AppError("Titre et contenu obligatoires", "BAD_USER_INPUT");
  }
  try {
    return await prisma.article.create({
      data: { titre: titre.trim(), contenu, auteurId: user.id },
    });
  } catch (err) {
    throw traduirePrisma(err);
  }
}

async function modifier(id, { titre, contenu }, user) {
  const article = await trouverPourEcriture(id, user);

  if (titre === undefined && contenu === undefined) {
    throw new AppError("Rien à modifier : titre ou contenu attendu", "BAD_USER_INPUT");
  }

  const nb = await Revision.countDocuments({ articleId: article.id });
  await Revision.create({
    articleId: article.id,
    version: nb + 1,
    titre: article.titre,
    contenu: article.contenu,
    modifiePar: user.id,
  });

  return prisma.article.update({
    where: { id: article.id },
    data: {
      ...(titre !== undefined && { titre }),
      ...(contenu !== undefined && { contenu }),
    },
  });
}

async function publier(id, user) {
  const article = await trouverPourEcriture(id, user);
  return prisma.article.update({ where: { id: article.id }, data: { publie: true } });
}

async function supprimer(id, user) {
  const article = await trouverPourEcriture(id, user);
  await prisma.article.delete({ where: { id: article.id } });
  await Revision.deleteMany({ articleId: article.id });
  return true;
}

async function historique(id, user) {
  const article = await trouverPourEcriture(id, user);
  return Revision.find({ articleId: article.id }).sort({ version: -1 }).select("-__v").lean();
}

async function restaurer(id, version, user) {
  const article = await trouverPourEcriture(id, user);

  const v = Number(version);
  const revision = Number.isInteger(v)
    ? await Revision.findOne({ articleId: article.id, version: v })
    : null;
  if (!revision) throw new AppError("Version introuvable", "NOT_FOUND");

  return modifier(article.id, { titre: revision.titre, contenu: revision.contenu }, user);
}

module.exports = {
  trouver, lister, listerParAuteur, listerParCategorie,
  creer, modifier, publier, supprimer, historique, restaurer,
};