const router = require("express").Router();
const ctrl = require("../controllers/articleController");

router.get("/:id", ctrl.lire);

module.exports = router;