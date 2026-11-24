const router = require("express").Router();
const ctrl = require("../controllers/adminController");

router.get("/utilisateurs", ctrl.lister);
router.patch("/utilisateurs/:id/role", ctrl.changerRole);

module.exports = router;