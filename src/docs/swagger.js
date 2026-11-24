const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

// Réponse d'erreur réutilisable, avec un exemple
const erreur = (description, code, message) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Erreur" },
      example: { erreur: message, code },
    },
  },
});

module.exports = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "API Le Mag",
      version: "1.0.0",
      description:
        "Partie REST : authentification, administration et historique des articles. " +
        "Le contenu du journal (articles, catégories, commentaires) passe par GraphQL sur /graphql.\n\n" +
        "Limite globale : 100 requêtes par minute et par IP (au-delà : 429).",
    },
    servers: [{ url: "http://localhost:4000" }],
    tags: [
      { name: "Auth", description: "Inscription et connexion" },
      { name: "Articles", description: "Lecture d'un article et historique (MongoDB)" },
      { name: "Admin", description: "Gestion des utilisateurs (rôle admin)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Article: {
          type: "object",
          properties: {
            id: { type: "integer", example: 14 },
            titre: { type: "string", example: "Bienvenue sur Le Mag" },
            contenu: { type: "string", example: "Le journal est en ligne." },
            publie: { type: "boolean", example: true },
            creeLe: { type: "string", format: "date-time" },
            auteurId: { type: "integer", example: 7 },
            categorieId: { type: "integer", nullable: true, example: 3 },
          },
        },
        Utilisateur: {
          type: "object",
          description: "Un compte. Le mot de passe n'est jamais renvoyé.",
          properties: {
            id: { type: "integer", example: 7 },
            nom: { type: "string", example: "Léa Martin" },
            email: { type: "string", format: "email", example: "lea@lemag.fr" },
            role: { type: "string", enum: ["lecteur", "admin"], example: "lecteur" },
            creeLe: { type: "string", format: "date-time" },
          },
        },
        Revision: {
          type: "object",
          description: "Ancienne version d'un article, stockée dans MongoDB.",
          properties: {
            _id: { type: "string", example: "672a1f9c8e4b2a0012345678" },
            articleId: { type: "integer", example: 14 },
            version: { type: "integer", example: 1 },
            titre: { type: "string" },
            contenu: { type: "string" },
            modifiePar: { type: "integer", description: "Id de l'utilisateur qui a remplacé cette version", example: 7 },
            modifieLe: { type: "string", format: "date-time" },
          },
        },
        Inscription: {
          type: "object",
          required: ["nom", "email", "motDePasse"],
          properties: {
            nom: { type: "string", example: "Carl Petit" },
            email: { type: "string", format: "email", example: "carl@lemag.fr" },
            motDePasse: { type: "string", minLength: 8, example: "motdepasse" },
          },
        },
        Connexion: {
          type: "object",
          required: ["email", "motDePasse"],
          properties: {
            email: { type: "string", format: "email", example: "lea@lemag.fr" },
            motDePasse: { type: "string", example: "motdepasse" },
          },
        },
        ReponseConnexion: {
          type: "object",
          properties: {
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            utilisateur: { $ref: "#/components/schemas/Utilisateur" },
          },
        },
        ChangementRole: {
          type: "object",
          required: ["role"],
          properties: { role: { type: "string", enum: ["lecteur", "admin"], example: "admin" } },
        },
        Erreur: {
          type: "object",
          properties: {
            erreur: { type: "string" },
            code: { type: "string" },
          },
        },
      },
      responses: {
        NonAuthentifie: erreur("Jeton absent, invalide ou expiré", "UNAUTHENTICATED", "Connexion requise"),
        Interdit: erreur("Droits insuffisants", "FORBIDDEN", "Accès refusé"),
        Introuvable: erreur("Ressource introuvable", "NOT_FOUND", "Article introuvable"),
        Conflit: erreur("Valeur déjà utilisée", "CONFLICT", "Valeur déjà utilisée"),
        Invalide: erreur("Données invalides", "BAD_USER_INPUT", "Email invalide"),
        TropDeRequetes: erreur("Trop de requêtes", "TOO_MANY_REQUESTS", "Trop de tentatives, réessaie dans 15 minutes"),
      },
      parameters: {
        IdArticle: {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "integer" },
          description: "Id de l'article (PostgreSQL)",
        },
      },
    },
  },
  // Chemin absolu : fonctionne quel que soit le dossier d'où l'on lance node
  apis: [path.join(__dirname, "../rest/routes/*.js")],
});