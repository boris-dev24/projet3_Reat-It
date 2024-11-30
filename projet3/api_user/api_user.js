const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// URI MongoDB
const uri = "mongodb+srv://theligener15:admin@cluster0.e217n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Configuration MongoDB
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Connecter à MongoDB une seule fois
let PositionModel;
async function connectToDB() {
    try {
        await client.connect();
        console.log("Connexion réussie à MongoDB!");
        const myDB = client.db("administration");
        PositionModel = myDB.collection("users");
    } catch (error) {
        console.error("Erreur lors de la connexion à MongoDB", error);
    }
}

// Démarrer le serveur après la connexion à MongoDB
connectToDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
});


const checkAuth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized, please login' });
    }
    
    try {
        const decoded = jwt.verify(token, 'votre_clé_secrète');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};


app.post('/register', async (req, res) => {
    try {
        const { username, password, name, profil } = req.body;

        // Vérification si l'utilisateur existe déjà
        const existingUser = await PositionModel.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Nom d\'utilisateur déjà pris' });
        }

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Création d'un nouvel utilisateur
        const newUser = { name, username, password: hashedPassword, profil, createdAt: new Date()};

        // Sauvegarde dans la base de données
        await PositionModel.insertOne(newUser);

        res.status(201).json({ message: 'Utilisateur enregistré avec succès' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err });
    }
});

// Route pour la connexion des utilisateurs (log-in)
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Recherche de l'utilisateur par son nom d'utilisateur
        const user = await PositionModel.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Utilisateur non trouvé' });
        }

        // Vérification du mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mot de passe incorrect' });
        }

        // Création d'un token JWT
        const token = jwt.sign({ userId: user._id }, 'votre_clé_secrète', { expiresIn: '1h' });

        res.status(200).json({ message: 'Connexion réussie', token });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err });
    }
});



// Route pour récupérer le username de l'utilisateur connecté
app.get('/get-username', checkAuth, async (req, res) => {
    try {
        const user = await PositionModel.findOne({ _id: new ObjectId(req.user.userId) });
        
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        res.status(200).json({ username: user.username });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err });
    }
});