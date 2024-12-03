
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 3001;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'clé_secrète_temporaire';
const uri = process.env.MONGODB_URI || "mongodb+srv://theligener15:admin@cluster0.e217n.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);
let usersCollection;

async function connectDB() {
    try {
        await client.connect();
        const db = client.db("administration");
        usersCollection = db.collection("users");
        console.log("Connecté à la base de données MongoDB");
    } catch (error) {
        console.error("Erreur de connexion à la base de données", error);
    }
}

connectDB();

// Middleware d'authentification
const checkAuth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Non autorisé' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide' });
    }
};

// Inscription
app.post('/register', async (req, res) => {
    try {
        const { username, password, name, profil } = req.body;

        if (!username || !password || !name || !profil) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }

        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Nom d\'utilisateur déjà utilisé' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = { 
            name, 
            username, 
            password: hashedPassword, 
            profil, 
            createdAt: new Date() 
        };

        await usersCollection.insertOne(newUser);

        res.status(201).json({ message: 'Inscription réussie' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Connexion
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Utilisateur non trouvé' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mot de passe incorrect' });
        }

        const token = jwt.sign({ 
            userId: user._id, 
            username: user.username,
            profil: user.profil 
        }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token, username: user.username, profil: user.profil });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour récupérer le profil utilisateur
app.get('/user-profile', checkAuth, async (req, res) => {
    try {
        // `req.user` est défini par le middleware `checkAuth`
        const { userId } = req.user;

        // Recherchez l'utilisateur dans la base de données par son ID
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Préparez les données utilisateur à retourner
        const userData = {
            username: user.username,
            name: user.name,
            profil: user.profil,
            createdAt: user.createdAt,
        };

        res.status(200).json(userData);
    } catch (err) {
        console.error('Erreur lors de la récupération du profil utilisateur :', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


app.listen(PORT, () => console.log(`Service d'authentification sur http://localhost:${PORT}`));