const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { AppError, traduirePrisma } = require("./erreurs");

const sansMotDePasse = ({ motDePasse, ...reste }) => reste;

// Haché factice : même temps de réponse que l'email existe ou non (on ne devine pas les comptes)
const HASH_FACTICE = bcrypt.hashSync("hash-factice-pour-le-timing", 10);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function inscription({ nom, email, motDePasse } = {}) {
  if (typeof nom !== "string" || !nom.trim()) {
    throw new AppError("Le nom est obligatoire", "BAD_USER_INPUT");
  }
  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw new AppError("Email invalide", "BAD_USER_INPUT");
  }
  if (typeof motDePasse !== "string" || motDePasse.length < 8) {
    throw new AppError("Le mot de passe doit faire au moins 8 caractères", "BAD_USER_INPUT");
  }

  const hash = await bcrypt.hash(motDePasse, 10);
  try {
    // Le rôle n'est jamais lu dans la requête : tout nouveau compte est "lecteur"
    const u = await prisma.utilisateur.create({
      data: { nom: nom.trim(), email: email.trim().toLowerCase(), motDePasse: hash },
    });
    return sansMotDePasse(u);
  } catch (err) {
    throw traduirePrisma(err); // P2002 → 409 CONFLICT (email déjà pris)
  }
}

async function connexion({ email, motDePasse } = {}) {
  if (typeof email !== "string" || typeof motDePasse !== "string" || !email || !motDePasse) {
    throw new AppError("Email et mot de passe obligatoires", "BAD_USER_INPUT");
  }

  const u = await prisma.utilisateur.findUnique({
    where: { email: email.trim().toLowerCase() },
    omit: { motDePasse: false }, // le seul endroit où on lit le haché
  });

  const ok = await bcrypt.compare(motDePasse, u ? u.motDePasse : HASH_FACTICE);
  if (!u || !ok) throw new AppError("Identifiants invalides", "UNAUTHENTICATED");

  const token = jwt.sign(
    { sub: u.id, role: u.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "2h", algorithm: "HS256" }
  );
  return { token, utilisateur: sansMotDePasse(u) };
}

// Lit l'en-tête Authorization : l'utilisateur, ou null. REST et GraphQL l'utilisent.
function lireToken(header) {
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    return { id: Number(p.sub), role: p.role };
  } catch {
    return null; // token invalide ou expiré = visiteur
  }
}

function exigerConnexion(user) {
  if (!user) throw new AppError("Connexion requise", "UNAUTHENTICATED");
}

function exigerRole(user, role) {
  exigerConnexion(user);
  if (user.role !== role) throw new AppError("Accès refusé", "FORBIDDEN");
}

module.exports = { inscription, connexion, lireToken, exigerConnexion, exigerRole };