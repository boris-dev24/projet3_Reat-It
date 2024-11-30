const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.static(__dirname + '/public'));

// Middleware pour parser le JSON
app.use(bodyParser.json());
app.use(cors());

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
    let fileName = __dirname + '/public/main.html';
    res.sendFile(fileName);
});

// Middleware pour vérifier si l'utilisateur est authentifié
const checkAuth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized, please login' });
    }
    jwt.verify(token, 'votre_clé_secrète', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

// // Route pour créer un message
// app.post('/newMessage', checkAuth, async (req, res) => {
//     const { title, text } = req.body;

//     // Appel à l'API du backend (localhost:3001)
//     try {
//         const response = await fetch('http://localhost:3002/message', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ title, text })
//         });

//         const data = await response.json();
//         if (data.status === 'ok') {
//             res.status(200).json({ status: 'ok', message: { id: data.id, title: data.title, text: data.text } });
//         } else {
//             res.status(500).json({ message: 'Error saving message' });
//         }
//     } catch (err) {
//         console.error('Erreur lors de l\'appel à l\'API backend:', err);
//         res.status(500).json({ message: 'Server error', error: err });
//     }
// });

// app.post('/newMessage', checkAuth, async (req, res) => {
//     const { title, text } = req.body;

//     try {
//         const response = await fetch('http://localhost:3002/message', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': req.headers['authorization'] // Forward the token
//             },
//             body: JSON.stringify({ 
//                 title, 
//                 text,
//                 userId: req.user.userId // Include user ID
//             })
//         });

//         const data = await response.json();
        
//         if (response.ok) {
//             res.status(200).json(data);
//         } else {
//             res.status(response.status).json(data);
//         }
//     } catch (err) {
//         console.error('Error calling backend API:', err);
//         res.status(500).json({ message: 'Server error', error: err.message });
//     }
// });
app.post('/newMessage', checkAuth, async (req, res) => {
    const { title, text } = req.body;

    try {
        // Récupérer le token JWT pour le transmettre
        const token = req.headers['authorization'];

        const response = await fetch('http://localhost:3001/get-username', {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });

        const userData = await response.json();

        const backendResponse = await fetch('http://localhost:3002/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ 
                title, 
                text,
                username: userData.username // Transmettre explicitement le username
            })
        });

        const data = await backendResponse.json();
        
        if (backendResponse.ok) {
            res.status(200).json(data);
        } else {
            res.status(backendResponse.status).json(data);
        }
    } catch (err) {
        console.error('Error calling backend API:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});