const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/authController");

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ erreur: "Trop de tentatives, réessaie dans 15 minutes", code: "TOO_MANY_REQUESTS" }),
});

router.post("/register", ctrl.register);
router.post("/login", limiteLogin, ctrl.login);

module.exports = router;