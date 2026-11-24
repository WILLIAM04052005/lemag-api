const prisma = require("../src/prisma");

async function main() {
  // Créer
  const lea = await prisma.utilisateur.create({ data: { nom: "Léa Martin", email: "lea@lemag.fr" } });

  // Créer avec une relation : la clé étrangère est un simple champ
  const article = await prisma.article.create({
    data: { titre: "Bienvenue sur Le Mag", contenu: "Premier article.", auteurId: lea.id },
  });

  // Lire tout / lire un seul (champ @id ou @unique)
  console.log(await prisma.article.findMany());
  console.log(await prisma.utilisateur.findUnique({ where: { email: "lea@lemag.fr" } }));

  // Avec les données liées / seulement certains champs
  console.log(await prisma.article.findMany({ include: { auteur: true } }));
  console.log(await prisma.article.findMany({ select: { id: true, titre: true } }));

  // Modifier, compter
  await prisma.article.update({ where: { id: article.id }, data: { publie: true } });
  console.log(await prisma.article.count({ where: { publie: true } }));

  // 1. Les articles publiés, du plus récent au plus ancien
  console.log("Publiés :", await prisma.article.findMany({
    where: { publie: true },
    orderBy: { creeLe: "desc" },
  }));

  // 2. Léa avec ses articles
  console.log("Léa :", await prisma.utilisateur.findUnique({
    where: { email: "lea@lemag.fr" },
    include: { articles: true },
  }));

  // 3. Le nombre de commentaires d'un article (deux façons)
  console.log("Nb commentaires :", await prisma.commentaire.count({ where: { articleId: article.id } }));
  console.log("Avec _count :", await prisma.article.findUnique({
    where: { id: article.id },
    select: { titre: true, _count: { select: { commentaires: true } } },
  }));

  // 4. Les articles dont le titre contient « mag » (sans tenir compte des majuscules)
  console.log("Titre contient mag :", await prisma.article.findMany({
    where: { titre: { contains: "mag", mode: "insensitive" } },
  }));

  // Supprimer
  await prisma.article.delete({ where: { id: article.id } });
}

main()
  .catch((err) => console.error("Erreur :", err.code, err.message))
  .finally(() => prisma.$disconnect());