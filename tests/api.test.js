const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/prisma");
const { mongoose, connectMongo } = require("../src/mongo");

let token;      // Léa (lecteur)
let tokenHugo;  // Hugo (lecteur, pas l'auteur des articles de Léa)
let articleId;  // brouillon créé par Léa

// Petit raccourci pour envoyer une requête GraphQL, avec ou sans jeton
const gql = (query, jeton) => {
  const req = request(app).post("/graphql");
  if (jeton) req.set("Authorization", `Bearer ${jeton}`);
  return req.send({ query });
};

beforeAll(async () => {
  await connectMongo();
  await mongoose.connection.dropDatabase();
  // On vide des enfants vers les parents (clés étrangères)
  await prisma.commentaire.deleteMany();
  await prisma.article.deleteMany();
  await prisma.categorie.deleteMany();
  await prisma.utilisateur.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
  await prisma.$disconnect();
});

// ---------- Tests du document ----------

test("inscription : 201, sans mot de passe dans la réponse", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ nom: "Léa", email: "lea@test.fr", motDePasse: "motdepasse1" });

  expect(res.status).toBe(201);
  expect(res.body.motDePasse).toBeUndefined();
  expect(res.body.role).toBe("lecteur");
});

test("connexion : renvoie un jeton", async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "lea@test.fr", motDePasse: "motdepasse1" });

  expect(res.status).toBe(200);
  expect(res.body.token).toBeDefined();
  token = res.body.token;
});

test("GraphQL : modifier un article crée une version dans l'historique", async () => {
  const creation = await gql('mutation { creerArticle(titre: "Test", contenu: "V1") { id } }', token);
  articleId = creation.body.data.creerArticle.id;

  await gql(`mutation { modifierArticle(id: "${articleId}", contenu: "V2") { id } }`, token);

  const res = await request(app)
    .get(`/api/articles/${articleId}/revisions`)
    .set("Authorization", `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body[0].contenu).toBe("V1");
});

// ---------- À toi ----------

test("inscription : email déjà utilisé → 409", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ nom: "Léa bis", email: "lea@test.fr", motDePasse: "motdepasse1" });

  expect(res.status).toBe(409);
  expect(res.body.code).toBe("CONFLICT");
});

test("route admin sans jeton → 401", async () => {
  const res = await request(app).get("/api/admin/utilisateurs");

  expect(res.status).toBe(401);
  expect(res.body.code).toBe("UNAUTHENTICATED");
});

test("route admin avec un compte lecteur → 403", async () => {
  const res = await request(app)
    .get("/api/admin/utilisateurs")
    .set("Authorization", `Bearer ${token}`);

  expect(res.status).toBe(403);
  expect(res.body.code).toBe("FORBIDDEN");
});

test("article non publié demandé par un visiteur → 404", async () => {
  // L'article créé plus haut est un brouillon (publie: false)
  const visiteur = await request(app).get(`/api/articles/${articleId}`);
  expect(visiteur.status).toBe(404);

  // ... alors que son auteur, connecté, le voit bien
  const auteur = await request(app)
    .get(`/api/articles/${articleId}`)
    .set("Authorization", `Bearer ${token}`);
  expect(auteur.status).toBe(200);
});

// ---------- Bonus ----------

test("GraphQL : modifier l'article d'un autre → FORBIDDEN", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({ nom: "Hugo", email: "hugo@test.fr", motDePasse: "motdepasse1" });
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "hugo@test.fr", motDePasse: "motdepasse1" });
  tokenHugo = login.body.token;

  const res = await gql(`mutation { modifierArticle(id: "${articleId}", contenu: "Pirate") { id } }`, tokenHugo);

  expect(res.status).toBe(200); // en GraphQL, l'erreur est dans le corps
  expect(res.body.errors[0].extensions.code).toBe("FORBIDDEN");
});

test("GraphQL : créer un article sans jeton → UNAUTHENTICATED", async () => {
  const res = await gql('mutation { creerArticle(titre: "X", contenu: "Y") { id } }');

  expect(res.body.errors[0].extensions.code).toBe("UNAUTHENTICATED");
  expect(res.body.data).toBeNull();
});