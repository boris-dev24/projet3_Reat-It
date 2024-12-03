
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Configuration CORS sécurisée
app.use(cors({
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Services de configuration
const AUTH_SERVICE = 'http://localhost:3001';
const MESSAGE_SERVICE = 'http://localhost:3002';
const JWT_SECRET = process.env.JWT_SECRET || 'clé_secrète_temporaire';

// Middleware d'authentification centralisé
const checkAuth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentification requise' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide' });
    }
};

// Routes d'authentification
app.post('/register', async (req, res) => {
    try {
        const response = await fetch(`${AUTH_SERVICE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erreur d\'inscription' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const response = await fetch(`${AUTH_SERVICE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erreur de connexion' });
    }
});

// Routes de messages
app.post('/newMessages', checkAuth, async (req, res) => {
    try {
        const response = await fetch(`${MESSAGE_SERVICE}/message`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': req.headers['authorization']
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erreur de création de message' });
    }
});


// Routes de messages (avec authentification optionnelle)
app.get('/messages', checkAuth, async (req, res) => {
    try {
        const searchParam = req.query.search ? `?search=${encodeURIComponent(req.query.search)}` : '';
        const pageParam = req.query.page ? `&page=${req.query.page}` : '';
        
        const headers = req.user 
            ? { 'Authorization': req.headers['authorization'] } 
            : {};

        const response = await fetch(`${MESSAGE_SERVICE}/messages${searchParam}${pageParam}`, { headers });
        const messages = await response.json();
        res.status(response.status).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Erreur de récupération des messages' });
    }
});

app.post('/message/:messageId/vote', checkAuth, async (req, res) => {
    try {
        const response = await fetch(`${MESSAGE_SERVICE}/message/${req.params.messageId}/vote`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': req.headers['authorization']
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erreur de vote' });
    }
});

app.delete('/message/:messageId', checkAuth, async (req, res) => {
    try {
        const response = await fetch(`${MESSAGE_SERVICE}/message/${req.params.messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': req.headers['authorization'] }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erreur de suppression de message' });
    }
});


// route pour le profil utilisateur
app.get('/user-profile', checkAuth, async (req, res) => {
    try {
        const response = await fetch(`${AUTH_SERVICE}/user-profile`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': req.headers['authorization']
            }
        });
        const userData = await response.json();
        res.status(200).json(userData);
    } catch (error) {
        res.status(500).json({ message: 'Erreur de récupération du profil' });
    }
});

// route pour les messages de l'utilisateur
app.get('/user-messages', checkAuth, async (req, res) => {
    try {
        const response = await fetch(`${MESSAGE_SERVICE}/user-messages`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': req.headers['authorization']
            }
        });
        const messages = await response.json();
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Erreur de récupération des messages' });
    }
});

app.get('/user-profile', async (req, res) => {
    try {
        const token = req.headers.authorization;
        const response = await fetch('http://localhost:3001/user-profile', {
            method: 'GET',
            headers: { Authorization: token }
        });

        if (!response.ok) {
            return res.status(response.status).send('Erreur côté serveur principal');
        }

        const userData = await response.json();
        res.json(userData); // Renvoie les données au client
    } catch (error) {
        console.error('Erreur côté serveur intermédiaire :', error);
        res.status(500).send('Erreur interne');
    }
});

app.get('/user-messages', async (req, res) => {
    try {
        const token = req.headers.authorization;
        const response = await fetch('http://localhost:3002/user-messages', {
            method: 'GET',
            headers: { Authorization: token }
        });

        if (!response.ok) {
            return res.status(response.status).send('Erreur côté serveur principal');
        }

        const userData = await response.json();
        res.json(userData); // Renvoie les données au client
    } catch (error) {
        console.error('Erreur côté serveur intermédiaire :', error);
        res.status(500).send('Erreur interne');
    }
});

app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));