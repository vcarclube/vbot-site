const express = require('express');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const router = express.Router();

const { validateOrigin } = require('../middlewares/CorsMiddleware');
const { validateToken } = require('../middlewares/AuthMiddleware');

router.get('/auth', validateToken, async (req, res) => {
    try {
        return res.status(200).json({ message: "Token válido", data: req.user.id });
    } catch (err) {
        return res.status(401).json({ message: "Erro ao recuperar o token", data: null });
    }
})

router.get('/get', validateToken, async (req, res) => {
    try {
        let id = req.user.id;
        const user = await User.findOne({ where: { id } });
        if (!user || user == null) {
            return res.status(404).json({ message: "Cliente não encontrado.", data: null });
        }
        return res.status(200).json({
            message: "Cliente recuperado com sucesso!", data: {
                id: user?.id,
                email: user?.email,
                name: user?.name,
                phone: user?.phone,
                role: user?.role,
                cpf: user?.cpf,
            }
        });
    } catch (error) {
        return res.status(400).json({ message: error.message, data: null });
    }
});

router.post('/login', validateOrigin, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!Utils.validateEmail(email)) {
            return res.status(401).json({ message: "Email inválido" });
        }

        const user = await User.findOne({ where: { email } });

        if (user?.role != "parceiro") {
            return res.status(401).json({ message: "E-mail de parceiro não encontrado." });
        }

        if (!user) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        const isPasswordValid = await bcrypt.compare(password, user?.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);

        return res.status(201).json({ message: "Login realizado com sucesso.", token });
    } catch (error) {
        return res.status(500).json({ message: "Erro no servidor. Tente novamente mais tarde." });
    }
})

module.exports = router;