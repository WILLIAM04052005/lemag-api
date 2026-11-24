const app = require("./app");
const { connectMongo } = require("./mongo");

const PORT = process.env.PORT || 4000;

connectMongo()
  .then(() => app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`)))
  .catch((err) => {
    console.error("Connexion MongoDB impossible :", err.message);
    process.exit(1);
  });