const bcrypt = require("bcrypt");
const prisma = require("../src/prisma");

async function main() {
  await prisma.commentaire.deleteMany();
  await prisma.article.deleteMany();
  await prisma.categorie.deleteMany();
  await prisma.utilisateur.deleteMany();

  const hash = bcrypt.hashSync("motdepasse", 10);

  const lea = await prisma.utilisateur.create({
    data: { nom: "Léa Martin", email: "lea@lemag.fr", motDePasse: hash },
  });
  const hugo = await prisma.utilisateur.create({
    data: { nom: "Hugo Dubois", email: "hugo@lemag.fr", motDePasse: hash },
  });
  await prisma.utilisateur.create({
    data: { nom: "Admin", email: "admin@lemag.fr", motDePasse: bcrypt.hashSync("adminpass", 10), role: "admin" },
  });

  const vieEtudiante = await prisma.categorie.create({ data: { libelle: "Vie étudiante", description: "La vie du campus" } });
  const tech = await prisma.categorie.create({ data: { libelle: "Tech", description: "Numérique et développement" } });
  const sport = await prisma.categorie.create({ data: { libelle: "Sport", description: "Les équipes de l'école" } });

  const a1 = await prisma.article.create({
    data: { titre: "Bienvenue sur Le Mag", contenu: "Le journal est en ligne.", publie: true, auteurId: lea.id, categorieId: vieEtudiante.id },
  });
  await prisma.article.create({
    data: { titre: "Brouillon : le guide des stages", contenu: "À compléter.", auteurId: hugo.id, categorieId: vieEtudiante.id },
  });
  await prisma.article.create({
    data: { titre: "Retour sur le hackathon", contenu: "48 heures de code.", publie: true, auteurId: hugo.id, categorieId: tech.id },
  });
  await prisma.article.create({
    data: { titre: "Le tournoi de futsal", contenu: "Victoire de l'équipe B2.", publie: true, auteurId: lea.id, categorieId: sport.id },
  });

  await prisma.commentaire.createMany({
    data: [
      { contenu: "Enfin !", articleId: a1.id, auteurId: hugo.id },
      { contenu: "Bravo.", articleId: a1.id, auteurId: lea.id },
    ],
  });

  console.log("Jeu d'essai chargé");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());