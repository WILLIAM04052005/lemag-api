const { execSync } = require("child_process");
require("dotenv").config({ path: ".env.test", quiet: true });

// La base de test reçoit les migrations
module.exports = () => {
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
};