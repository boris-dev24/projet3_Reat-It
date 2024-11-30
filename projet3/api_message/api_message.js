const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const app = express();

app.listen(3002, () => {
    console.log("API server is listening on port 3002");
});

app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const uri = "mongodb+srv://theligener15:admin@cluster0.e217n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db;
let messagesCollection;

async function connectDB() {
    try {
        await client.connect();
        console.log('Connected to Database');
        db = client.db("content");
        messagesCollection = db.collection("messages");
    } catch (error) {
        console.error('Database connection error:', error);
    }
}
connectDB();

// // Middleware pour vérifier l'authentification
// const checkAuth = (req, res, next) => {
//     const token = req.headers['authorization']?.split(' ')[1];
//     if (!token) {
//         return res.status(401).json({ message: 'Unauthorized, please login' });
//     }
    
//     try {
//         const decoded = jwt.verify(token, 'votre_clé_secrète');
//         req.user = decoded;
//         next();
//     } catch (err) {
//         return res.status(401).json({ message: 'Invalid token' });
//     }
// };
const checkAuth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized, please login' });
    }
    
    try {
        const decoded = jwt.verify(token, 'votre_clé_secrète');
        req.user = { userId: decoded.userId, username: decoded.username }; // Ajouter le nom
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};


// Route pour créer un message
// app.post('/message', checkAuth, async (req, res) => {
//     const { title, text } = req.body;
    
//     try {
//         const newMessage = {
//             title,
//             text,
//             user: req.user.userId,  // Ajouter l'ID de l'utilisateur
//             date: new Date(),
//             likes: 0,
//             dislikes: 0,
//             answers: []
//         };
        
//         const result = await messagesCollection.insertOne(newMessage);
//         res.status(200).json({ 
//             status: 'ok', 
//             id: result.insertedId, 
//             message: newMessage 
//         });
//     } catch (err) {
//         res.status(500).json({ message: 'Error saving message', error: err });
//     }
// });


// app.post('/message', checkAuth, async (req, res) => {
//     const { title, text,} = req.body;
    
//     try {
//         const date = new Date().toLocaleDateString('fr-CA');
//         const newMessage = {
//             title,
//             text,
//             user: req.user.username,
//             createdAt: date,
//             likes: 0,
//             dislikes: 0,
//             answers: []
//         };
        
//         const result = await messagesCollection.insertOne(newMessage);
//         res.status(200).json({ 
//             status: 'ok', 
//             id: result.insertedId, 
//             message: newMessage 
//         });
//     } catch (err) {
//         res.status(500).json({ message: 'Error saving message', error: err.toString() });
//     }
// });
app.post('/message', checkAuth, async (req, res) => {
    const { title, text } = req.body;
    
    console.log('Requête de création de message reçue');
    console.log('User ID:', req.user.userId);
    console.log('Titre:', title);
    console.log('Texte:', text);
    
    try {
        // Modification importante : connexion à la collection utilisateurs
        const usersCollection = client.db("administration").collection("users");
        
        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
        
        console.log('Utilisateur trouvé:', user);
        
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const newMessage = {
            title,
            text,
            userId: req.user.userId,
            user: user.username, // Utiliser le username de la base de données
            createdAt: new Date(),
            likes: 0,
            dislikes: 0,
            answers: []
        };
        
        const result = await messagesCollection.insertOne(newMessage);
        
        console.log('Message créé avec succès:', result);
        
        res.status(200).json({ 
            status: 'ok', 
            id: result.insertedId, 
            message: newMessage 
        });
    } catch (err) {
        console.error('Erreur détaillée lors de la création du message:', err);
        res.status(500).json({ 
            message: 'Error saving message', 
            error: err.toString(),
            stack: err.stack 
        });
    }
});

// // Route pour récupérer les messages publics
// app.get('/messages', async (req, res) => {
//     const { search } = req.query;
    
//     try {
//         let query = {};
//         if (search) {
//             query = {
//                 $or: [
//                     { title: { $regex: search, $options: 'i' } },
//                     { text: { $regex: search, $options: 'i' } }
//                 ]
//             };
//         }
        
//         const messages = await messagesCollection
//             .find(query)
//             .limit(10)
//             .toArray();
        
//         res.status(200).json(messages);
//     } catch (err) {
//         res.status(500).json({ message: 'Error retrieving messages', error: err });
//     }
// });
app.get('/messages', async (req, res) => {
    const { search } = req.query;
    
    try {
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
            .limit(10)
            .toArray();
        
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving messages', error: err });
    }
});




// // Route pour récupérer les messages d'un utilisateur
// app.get('/user-messages', checkAuth, async (req, res) => {
//     try {
//         const messages = await messagesCollection
//             .find({ userId: req.user.userId })
//             .toArray();
        
//         res.status(200).json(messages);
//     } catch (err) {
//         res.status(500).json({ message: 'Error retrieving user messages', error: err });
//     }
// });
app.get('/user-messages', checkAuth, async (req, res) => {
    try {
        const messages = await messagesCollection
            .find({ userId: req.user.userId })
            .toArray();
        
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving user messages', error: err });
    }
});


// Route pour ajouter une réponse à un message
app.post('/message/:messageId/answer', checkAuth, async (req, res) => {
    const { messageId } = req.params;
    const { text } = req.body;
    
    try {
        const answer = {
            text,
            user: req.user.userId,
            date: new Date(),
            likes: 0,
            dislikes: 0
        };
        
        const result = await messagesCollection.updateOne(
            { _id: new ObjectId(messageId) },
            { $push: { answers: answer } }
        );
        
        res.status(200).json({ status: 'ok', answer });
    } catch (err) {
        res.status(500).json({ message: 'Error adding answer', error: err });
    }
});

// Route pour récupérer les messages
app.get('/messages', async (req, res) => {
    const { search } = req.query;
    
    try {
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
            .limit(10)
            .toArray();
        
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving messages', error: err });
    }
});

// Route pour liker/disliker un message ou une réponse
app.post('/message/:messageId/vote', checkAuth, async (req, res) => {
    const { messageId } = req.params;
    const { type, answerId } = req.body;
    
    try {
        let updateOperation;
        if (answerId !== undefined) {
            // Voter pour une réponse spécifique
            updateOperation = type === 'like' 
                ? { $inc: { 'answers.$.likes': 1 } }
                : { $inc: { 'answers.$.dislikes': 1 } };
            
            await messagesCollection.updateOne(
                { _id: new ObjectId(messageId), 'answers._id': new ObjectId(answerId) },
                updateOperation
            );
        } else {
            // Voter pour le message principal
            updateOperation = type === 'like' 
                ? { $inc: { likes: 1 } }
                : { $inc: { dislikes: 1 } };
            
            await messagesCollection.updateOne(
                { _id: new ObjectId(messageId) },
                updateOperation
            );
        }
        
        res.status(200).json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ message: 'Error voting', error: err });
    }
});

// Route pour supprimer/modifier un message (réservé aux administrateurs)
app.delete('/message/:messageId', checkAuth, async (req, res) => {
    const { messageId } = req.params;
    
    try {
        // Vérifier si l'utilisateur est un administrateur
        if (req.user.profil !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        await messagesCollection.deleteOne({ _id: new ObjectId(messageId) });
        
        res.status(200).json({ status: 'ok', message: 'Message supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting message', error: err });
    }
});

// API affiches des messages utilisateurs au chargement du site
app.get('/messages', checkAuth, async (req, res) => {
    try {
        // Ici, vous récupérez tous les messages depuis votre base de données ou autre source
        const messages = await getMessagesFromDatabase(); // Remplacez par votre logique
        res.status(200).json(messages);
    } catch (err) {
        console.error('Erreur lors de la récupération des messages:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
