const typeDefs = /* GraphQL */ `
  """
  Un membre du Mag. L'email et le mot de passe ne sont jamais exposés par l'API GraphQL.
  """
  type Utilisateur {
    id: ID!
    nom: String!
    "Ses articles. Un visiteur ne voit que les articles publiés."
    articles: [Article!]!
  }

  """
  Une rubrique du journal (Vie étudiante, Tech, Sport...).
  """
  type Categorie {
    id: ID!
    "Libellé unique de la catégorie"
    libelle: String!
    description: String
    "Articles de la catégorie. Un visiteur ne voit que les articles publiés."
    articles: [Article!]!
  }

  """
  Un article du journal. Chaque modification archive l'ancienne version dans l'historique (REST).
  """
  type Article {
    id: ID!
    titre: String!
    contenu: String!
    "false tant que l'article est un brouillon"
    publie: Boolean!
    auteur: Utilisateur!
    "Peut être null : un article n'a pas forcément de catégorie"
    categorie: Categorie
    commentaires: [Commentaire!]!
  }

  """
  Un commentaire laissé par un utilisateur connecté sous un article.
  """
  type Commentaire {
    id: ID!
    contenu: String!
    auteur: Utilisateur!
  }

  """
  Une page de résultats de la liste des articles.
  """
  type PageArticles {
    "Numéro de la page renvoyée (à partir de 1)"
    page: Int!
    "Nombre d'articles par page (50 maximum)"
    limite: Int!
    "Nombre total d'articles correspondant à la recherche"
    total: Int!
    articles: [Article!]!
  }

  type Query {
    """
    Liste paginée des articles, du plus récent au plus ancien.
    Les visiteurs ne voient que les articles publiés.
    """
    articles(
      "Page à afficher"
      page: Int = 1
      "Articles par page, plafonné à 50"
      limite: Int = 10
      "Recherche dans le titre, sans tenir compte des majuscules"
      recherche: String
    ): PageArticles!

    """
    Un article par son id. Brouillons réservés aux utilisateurs connectés.
    Erreur : NOT_FOUND.
    """
    article(id: ID!): Article

    "Toutes les catégories, par ordre alphabétique."
    categories: [Categorie!]!
  }

  type Mutation {
    creerArticle(titre: String!, contenu: String!): Article!
    modifierArticle(id: ID!, titre: String, contenu: String): Article!
    publierArticle(id: ID!): Article!
    supprimerArticle(id: ID!): Boolean!
    commenter(articleId: ID!, contenu: String!): Commentaire!
  }
`;

module.exports = typeDefs;