const { Schema, model } = require("mongoose");

const revisionSchema = new Schema({
  articleId: { type: Number, required: true, index: true }, // id PostgreSQL de l'article
  version: { type: Number, required: true },
  titre: { type: String, required: true },
  contenu: { type: String, required: true },
  modifiePar: { type: Number, required: true }, // id de l'utilisateur qui a remplacé cette version
  modifieLe: { type: Date, default: Date.now },
});

revisionSchema.index({ articleId: 1, version: 1 }, { unique: true });

module.exports = model("Revision", revisionSchema);