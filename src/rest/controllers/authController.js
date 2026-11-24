const auth = require("../../services/authService");

const register = async (req, res) => res.status(201).json(await auth.inscription(req.body));
const login = async (req, res) => res.json(await auth.connexion(req.body));

module.exports = { register, login };