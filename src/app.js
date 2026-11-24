require("dotenv/config");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { createYoga, createSchema } = require("graphql-yoga");
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");
const { lireToken } = require("./services/authService");
const { lireUtilisateur } = require("./rest/middlewares/auth");

const app = express();

const trop = (req, res) =>
  res.status(429).json({ erreur: "Trop de requêtes, réessaie plus tard", code: "TOO_MANY_REQUESTS" });

// Durcissement global
app.disable("x-powered-by");
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 100, standardHeaders: "draft-7", legacyHeaders: false, handler: trop }));

// GraphQL : l'utilisateur arrive dans le contexte
const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  context: ({ request }) => ({ user: lireToken(request.headers.get("authorization")) }),
});
// GraphiQL charge des scripts que la CSP par défaut de helmet bloquerait
app.use(yoga.graphqlEndpoint, helmet({ contentSecurityPolicy: false }), yoga);

// REST
app.use(express.json({ limit: "100kb" }));
app.use("/api", helmet(), lireUtilisateur);

app.use("/api/auth", require("./rest/routes/auth.routes"));
app.use("/api/articles", require("./rest/routes/articles.routes"));
app.use("/api/admin", require("./rest/routes/admin.routes"));

// Documentation : Swagger UI charge des scripts que la CSP par défaut de helmet bloquerait
app.get("/docs.json", (req, res) => res.json(swaggerSpec));
app.use("/docs", helmet({ contentSecurityPolicy: false }), swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Toujours en dernier
app.use(require("./rest/middlewares/erreurs").gestionErreurs);

module.exports = app;