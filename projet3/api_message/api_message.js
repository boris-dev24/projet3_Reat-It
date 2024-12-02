
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 3002;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'clé_secrète_temporaire';
const uri = process.env.MONGODB_URI || "mongodb+srv://theligener15:admin@cluster0.e217n.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);
let messagesCollection;
let usersCollection;

async function connectDB() {
    try {
        await client.connect();
        const contentDB = client.db("content");
        const adminDB = client.db("administration");
        messagesCollection = contentDB.collection("messages");
        usersCollection = adminDB.collection("users");
        console.log("Connecté à la base de données MongoDB");
    } catch (error) {
        console.error("Erreur de connexion à la base de données", error);
    }
}

connectDB();

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

// Créer un message
app.post('/message', checkAuth, async (req, res) => {
    try {
        const { title, text } = req.body;
        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });

        if (!title || !text) {
            return res.status(400).json({ message: 'Titre et contenu requis' });
        }

        const newMessage = {
            title,
            text,
            userId: req.user.userId,
            user: user.username,
            createdAt: new Date(),
            likes: 0,
            dislikes: 0,
            answers: []
        };
        
        const result = await messagesCollection.insertOne(newMessage);
        
        res.status(201).json({ 
            message: newMessage, 
            id: result.insertedId 
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur de création de message' });
    }
});

// Récupérer les messages avec pagination et recherche
app.get('/messages', async (req, res) => {
    try {
        const { search, page = 1 } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { text: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        const messages = await messagesCollection
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Erreur de récupération des messages' });
    }
});

// Voter sur un message
app.post('/message/:messageId/vote', checkAuth, async (req, res) => {
    try {
        const { type } = req.body;
        const messageId = new ObjectId(req.params.messageId);

        if (!['like', 'dislike'].includes(type)) {
            return res.status(400).json({ message: 'Type de vote invalide' });
        }

        const updateOperation = type === 'like' 
            ? { $inc: { likes: 1 } }
            : { $inc: { dislikes: 1 } };
        
        await messagesCollection.updateOne(
            { _id: messageId },
            updateOperation
        );
        
        res.status(200).json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur de vote' });
    }
});

// Supprimer un message (réservé aux administrateurs)
app.delete('/message/:messageId', checkAuth, async (req, res) => {
    try {
        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
        
        if (user.profil !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const result = await messagesCollection.deleteOne({ 
            _id: new ObjectId(req.params.messageId) 
        });
        
        res.status(200).json({ 
            message: 'Message supprimé', 
            deletedCount: result.deletedCount 
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur de suppression de message' });
    }
});

// Récupérer les messages de l'utilisateur
app.get('/user-messages', checkAuth, async (req, res) => {
    try {
        const messages = await messagesCollection
            .find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .toArray();
        
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Erreur de récupération des messages' });
    }
});

app.listen(PORT, () => console.log(`Service de messages sur http://localhost:${PORT}`));