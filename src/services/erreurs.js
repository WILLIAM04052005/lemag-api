const { GraphQLError } = require("graphql");

// Une erreur métier, comprise par GraphQL (code) et par REST (statut HTTP)
class AppError extends GraphQLError {
  constructor(message, code) {
    super(message, { extensions: { code } });
  }
}

const STATUTS = {
  BAD_USER_INPUT: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

// Traduit les erreurs Prisma connues
function traduirePrisma(err) {
  if (err.code === "P2002") return new AppError("Valeur déjà utilisée", "CONFLICT");
  if (err.code === "P2025") return new AppError("Ressource introuvable", "NOT_FOUND");
  if (err.code === "P2003") return new AppError("Référence inexistante", "BAD_USER_INPUT");
  return err;
}

module.exports = { AppError, STATUTS, traduirePrisma };