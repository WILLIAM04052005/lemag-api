const prisma = require("../prisma");
const { AppError, traduirePrisma } = require("./erreurs");
const { exigerConnexion } = require("./authService");
const articles = require("./articleService");

async function commenter({ articleId, contenu }, user) {
  exigerConnexion(user);
  if (!contenu || !contenu.trim()) throw new AppError("Commentaire vide", "BAD_USER_INPUT");

  const article = await articles.trouver(articleId, user); // 404 si inexistant
  try {
    return await prisma.commentaire.create({
      data: { contenu: contenu.trim(), articleId: article.id, auteurId: user.id },
    });
  } catch (err) {
    throw traduirePrisma(err);
  }
}

module.exports = { commenter };