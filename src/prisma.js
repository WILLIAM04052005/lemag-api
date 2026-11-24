require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({
  adapter,
  // Le haché du mot de passe n'est jamais lu, sauf demande explicite (omit: { motDePasse: false })
  omit: { utilisateur: { motDePasse: true } },
});

module.exports = prisma;