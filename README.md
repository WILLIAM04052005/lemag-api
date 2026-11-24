# API Le Mag
Je construire l'API du Mag, le journal de l'école, avec tout ce qu'on attend d'un back-end pro : PostgreSQL piloté par Prisma, une API GraphQL et une API REST, MongoDB, de la sécurité, une doc Swagger et des tests

## Choix de modélisation

- **Article - Categorie : `onDelete: SetNull`.** Supprimer une catégorie ne doit pas effacer les articles ni être bloqué : ils deviennent « sans catégorie » (relation facultative).
- **Commentaire - Article : `onDelete: Cascade`.** Un commentaire n'a pas de sens sans son article.
- **Article - Utilisateur : Restrict (par défaut).** Supprimer un compte ne doit pas effacer
  ses articles ni les commentaires des autres lecteurs.

## Tout les Checkpoint dans le pdf dans docs

## Checkpoint 1
- le SQL de ta migration Catégorie (ALTER TABLE "Categorie" ADD COLUMN "description" TEXT;, et le CREATE TABLE "Categorie" dans la migration init) ;
- npx prisma db seed lancé deux fois sans erreur.

## Checkpoint 2
- Dans graphql les catégories avec leurs articles et leurs auteurs, en une seule requête :
{ categories { libelle articles { titre auteur { nom } } } }
- une erreur BAD_USER_INPUT (par exemple creerArticle avec auteurId: "999").

## REST vs GraphQL : la même lecture d'article

Les deux appellent `articleService.trouver()` : même règle, deux contrats.

- **Forme** : REST renvoie toute la ligne `Article` ; GraphQL renvoie uniquement les champs demandés.
- **Auteur** : REST donne `auteurId` (il faudrait un 2e appel pour le nom) ; GraphQL résout
  `auteur { nom }` dans la même requête.
- **Erreur** : REST répond HTTP 404 avec `{ erreur, code }` ; GraphQL répond HTTP 200 avec
  `data.article = null` et `errors[0].extensions.code = "NOT_FOUND"`.

## Checkpoint 3
- le même article lu en REST (curl) et en GraphQL (GraphiQL) ;
- l'article 999 des deux côtés : 404 en REST, 200 + NOT_FOUND dans errors en GraphQL.

## Historique dans MongoDB

Une révision est un instantané complet, écrit une fois et jamais modifié, toujours lu par article, et dont le contenu pourra évoluer (images, tags) : c'est un document, d'où MongoDB.

`articleId` est un id PostgreSQL stocké dans Mongo : aucune clé étrangère ne relie les deux bases. La cohérence est assurée par le service : l'article est vérifié avant chaque écriture de révision, et son historique est supprimé avec lui.

## Checkpoint 4
- deux modifications en GraphQL, l'historique lu en REST, une restauration, puis la collection revisions dans Compass.

## Checkpoint 5
- Une même action, modifier un article de Léa, testée trois fois de chaque côté.

* un brouillon demandé par un visiteur renvoie 404, pas 403. Un 403 dirait « cet article existe mais tu n’y as pas droit », ce qui révèle déjà une information. 

## Documentation

- **REST** : Swagger UI sur http://localhost:4000/docs (spec brute : /docs.json).
  Bouton *Authorize* : coller le jeton obtenu via POST /api/auth/login (sans « Bearer »).
- **GraphQL** : GraphiQL sur http://localhost:4000/graphql, onglet Documentation.
  Les descriptions sont écrites dans le schéma (`src/graphql/typeDefs.js`).

## Checkpoint 6
- ma page /docs complète (7 routes, toutes les erreurs documentées, schémas Utilisateur et Revision) ;
- une route protégée testée depuis Swagger avec le bouton Authorize (GET /api/admin/utilisateurs : 200 avec le token admin).

## Tests

Bases séparées : `lemag_test` (PostgreSQL) et `lemag_test` (MongoDB), configurées dans `.env.test`.
Les migrations sont appliquées automatiquement avant les tests (`tests/globalSetup.js`).

    npm test

Couvert : inscription (201 sans mot de passe, 409), connexion, historique créé par une modification
GraphQL et lu en REST, route admin (401 / 403), brouillon invisible pour un visiteur (404),
modification de l'article d'un autre (FORBIDDEN), création sans jeton (UNAUTHENTICATED).

## Checkpoint 7
- npm test : tout vert
- Casse volontairement un test pour le voir échouer. Par exemple, dans le test 409, remplace toBe(409) par toBe(201)