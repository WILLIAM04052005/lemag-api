const router = require("express").Router();
const ctrl = require("../controllers/articleController");

/**
 * @openapi
 * /api/articles/{id}:
 *   get:
 *     tags: [Articles]
 *     summary: Lire un article (même service que la query GraphQL article)
 *     description: Ouvert à tous. Un brouillon n'est visible que par un utilisateur connecté ; pour un visiteur il renvoie 404.
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdArticle'
 *     responses:
 *       200:
 *         description: L'article
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Article' }
 *       404: { $ref: '#/components/responses/Introuvable' }
 */
router.get("/:id", ctrl.lire);

/**
 * @openapi
 * /api/articles/{id}/revisions:
 *   get:
 *     tags: [Articles]
 *     summary: Historique d'un article, de la version la plus récente à la plus ancienne
 *     description: Réservé à l'auteur de l'article ou à un admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdArticle'
 *     responses:
 *       200:
 *         description: Les versions précédentes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Revision' }
 *       401: { $ref: '#/components/responses/NonAuthentifie' }
 *       403: { $ref: '#/components/responses/Interdit' }
 *       404: { $ref: '#/components/responses/Introuvable' }
 */
router.get("/:id/revisions", ctrl.historique);

/**
 * @openapi
 * /api/articles/{id}/revisions/{version}/restaurer:
 *   post:
 *     tags: [Articles]
 *     summary: Restaurer une ancienne version
 *     description: La version actuelle est d'abord sauvegardée dans l'historique. Réservé à l'auteur ou à un admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdArticle'
 *       - in: path
 *         name: version
 *         required: true
 *         schema: { type: integer }
 *         description: Numéro de la version à restaurer
 *     responses:
 *       200:
 *         description: L'article restauré
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Article' }
 *       401: { $ref: '#/components/responses/NonAuthentifie' }
 *       403: { $ref: '#/components/responses/Interdit' }
 *       404: { $ref: '#/components/responses/Introuvable' }
 */
router.post("/:id/revisions/:version/restaurer", ctrl.restaurer);

module.exports = router;