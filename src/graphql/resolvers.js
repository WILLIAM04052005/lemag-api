const prisma = require("../prisma");
const articles = require("../services/articleService");
const commentaires = require("../services/commentaireService");
const categories = require("../services/categorieService");

const resolvers = {
  Query: {
    articles: (parent, args, { user }) => articles.lister(args, user),
    article: (parent, args, { user }) => articles.trouver(args.id, user),
    categories: () => categories.lister(),
  },

  Mutation: {
    creerArticle: (parent, args, { user }) => articles.creer(args, user),
    modifierArticle: (parent, args, { user }) => articles.modifier(args.id, args, user),
    publierArticle: (parent, args, { user }) => articles.publier(args.id, user),
    supprimerArticle: (parent, args, { user }) => articles.supprimer(args.id, user),
    commenter: (parent, args, { user }) => commentaires.commenter(args, user),
  },

  Article: {
    auteur: (parent) => prisma.utilisateur.findUnique({ where: { id: parent.auteurId } }),
    commentaires: (parent) => prisma.commentaire.findMany({ where: { articleId: parent.id } }),
    categorie: (parent) =>
      parent.categorieId ? prisma.categorie.findUnique({ where: { id: parent.categorieId } }) : null,
  },
  // Règle 4 aussi sur les relations : sinon un visiteur verrait les brouillons via une catégorie
  Utilisateur: {
    articles: (parent, args, { user }) => articles.listerParAuteur(parent.id, user),
  },
  Categorie: {
    articles: (parent, args, { user }) => articles.listerParCategorie(parent.id, user),
  },
  Commentaire: {
    auteur: (parent) => prisma.utilisateur.findUnique({ where: { id: parent.auteurId } }),
  },
};

module.exports = resolvers;