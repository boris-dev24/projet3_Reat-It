document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM principaux
    const homeSection = document.getElementById('home');
    const welcomeMessage = document.getElementById('welcome');
    const searchInput = document.querySelector('.search');
    
    // Boutons de navigation
    const newMessageBtn = document.getElementById('newMessage');
    const addAnswerBtn = document.getElementById('addAnswer');
    const logInBtn = document.getElementById('logIn');
    const registerBtn = document.getElementById('register');
    const logOutBtn = document.getElementById('logOut');
    const userBtn = document.getElementById('user');
    // const profilBtn = document.getElementById('profil');
    // const messagesBtn = document.getElementById('messages');

    // Formulaires
    const newMessageForm = document.getElementById('newMessageForm');
    const newAnswerForm = document.getElementById('newAnswerForm');
    const registerPage = document.getElementById('registerPage');
    const logInPage = document.getElementById('logInPage');

    // Boutons de formulaire
    const sendMessageButton = document.getElementById('sendMessageButton');
    const cancelMessageButton = document.getElementById('cancelMessageButton');
    const sendAnswerButton = document.getElementById('sendAnswerButton');
    const cancelAnswerButton = document.getElementById('cancelAnswerButton');

    // Variables globales
    let currentUser = null;
    let currentToken = null;

    // Fonction pour gérer l'authentification
    function updateUIBasedOnAuthStatus() {
        const isLoggedIn = !!currentToken;
        
        // Masquer/afficher les éléments en fonction de la connexion
        document.querySelectorAll('.navHead').forEach(el => {
            el.classList.toggle('hidden', !isLoggedIn);
        });

        logInBtn.classList.toggle('hidden', isLoggedIn);
        registerBtn.classList.toggle('hidden', isLoggedIn);
        logOutBtn.classList.toggle('hidden', !isLoggedIn);

        if (isLoggedIn) {
            document.getElementById('activeUser').textContent = currentUser.username;
        }
    }


    function showSection(sectionId) {
        // Liste de toutes les sections
        const sections = [
            'registerPage', 
            'logInPage', 
            'home', 
            'newMessageForm', 
            'profilPage',
            'messagesPage'
        ];
    
        // Masquer toutes les sections
        sections.forEach(section => {
            const sectionElement = document.getElementById(section);
            if (sectionElement) {
                sectionElement.classList.add('hidden');
            }
        });
    
        // Afficher la section demandée
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.classList.remove('hidden');
        }
    }
    
    // Ajouter des écouteurs d'événements pour chaque bouton de navigation
    document.querySelectorAll('.navHead').forEach(button => {
        button.addEventListener('click', function() {
            const sectionId = this.id.replace('Btn', 'Page');
            showSection(sectionId);
        });
    });
    
    // Écouteurs spécifiques pour inscription et connexion
    registerBtn.addEventListener('click', () => showSection('registerPage'));
    logInBtn.addEventListener('click', () => showSection('logInPage'));


    // Menu déroulant dynamique
    userBtn.addEventListener('click', (e) => {
        const subMenu = document.createElement('div');
        subMenu.classList.add('sub-menu');
        subMenu.innerHTML = `
            <button id="profilBtn">Profil</button>
            <button id="messagesBtn">Messages</button>
        `;
        
        // Position du menu
        subMenu.style.position = 'absolute';
        subMenu.style.top = `${userBtn.offsetTop + userBtn.offsetHeight}px`;
        subMenu.style.left = `${userBtn.offsetLeft}px`;
        
        document.body.appendChild(subMenu);
        
        // Fermer le menu si clic en dehors
        const closeMenu = (event) => {
            if (!userBtn.contains(event.target) && !subMenu.contains(event.target)) {
                document.body.removeChild(subMenu);
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // Délai court pour éviter que l'événement de clic ne se propage immédiatement
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    });


    // Sélectionner les vrais boutons du DOM
    const profilBtn = document.getElementById('profil');
    const messagesBtn = document.getElementById('messages');

    // Masquer initialement ces boutons
    profilBtn.classList.add('hidden');
    messagesBtn.classList.add('hidden');

    userBtn.addEventListener('click', (e) => {
        // Basculer la visibilité des boutons
        profilBtn.classList.toggle('hidden');
        messagesBtn.classList.toggle('hidden');
        
        // Fermer si clic en dehors
        const closeMenu = (event) => {
            if (!userBtn.contains(event.target) && 
                !profilBtn.contains(event.target) && 
                !messagesBtn.contains(event.target)) {
                profilBtn.classList.add('hidden');
                messagesBtn.classList.add('hidden');
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // Délai court pour éviter la propagation immédiate
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    });


    // Inscription
    document.querySelector('#registerPage button[type="submit"]').addEventListener('click', async () => {
        const name = document.getElementById('registerName').value;
        const username = document.getElementById('registerUserName').value;
        const password = document.getElementById('registerPassword').value;
        const profil = document.querySelector('input[name="profile"]:checked').value;

        try {
            const response = await fetch('http://localhost:3001/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, username, password, profil })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Inscription réussie');
                registerPage.classList.add('hidden');
                logInPage.classList.remove('hidden');
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Une erreur est survenue');
        }
    });

    // Connexion
    document.querySelector('#logInPage button[type="submit"]').addEventListener('click', async () => {
        const username = document.getElementById('logInUserName').value;
        const password = document.getElementById('logInPassword').value;

        try {
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                currentToken = data.token;
                currentUser = { username };
                updateUIBasedOnAuthStatus();
                logInPage.classList.add('hidden');
                welcomeMessage.textContent = `Bienvenue, ${username}!`;
                fetchMessages();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Une erreur est survenue');
        }
    });

    

    // Déconnexion
    logOutBtn.addEventListener('click', () => {
        currentToken = null;
        currentUser = null;
        updateUIBasedOnAuthStatus();
        homeSection.innerHTML = '';
        welcomeMessage.textContent = '';
    });

    // Nouveau message
    newMessageBtn.addEventListener('click', () => {
        newMessageForm.classList.remove('hidden');
    });

    sendMessageButton.addEventListener('click', async () => {
        if (!currentToken) {
            alert('Veuillez vous connecter');
            return;
        }

        const title = document.querySelector('.newMessageTitle').value;
        const text = document.querySelector('.newMessageContent').value;

        try {
            const response = await fetch('http://localhost:3000/newMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ title, text })
            });

            const data = await response.json();
            if (response.ok) {
                newMessageForm.classList.add('hidden');
                fetchMessages();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Une erreur est survenue');
        }
    });

    cancelMessageButton.addEventListener('click', () => {
        newMessageForm.classList.add('hidden');
    });

    // Recherche de messages
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.trim();
        if (searchTerm.length > 0) {
            await fetchMessages(searchTerm);
        } else {
            await fetchMessages();
        }
    });

    // Fonction pour récupérer les messages
    async function fetchMessages(searchTerm = '') {
        try {
            // Note: Vous devrez ajouter une route côté serveur pour récupérer les messages
            const url = searchTerm 
                ? `http://localhost:3002/messages?search=${encodeURIComponent(searchTerm)}`
                : 'http://localhost:3002/messages';

            const response = await fetch(url, {
                headers: {
                    'Authorization': currentToken ? `Bearer ${currentToken}` : ''
                }
            });

            const messages = await response.json();
            displayMessages(messages);
        } catch (error) {
            console.error('Erreur de récupération des messages:', error);
        }
    }


    // Fonction pour afficher les messages
    function displayMessages(messages) {
        homeSection.innerHTML = '';
        messages.slice(0, 10).forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.innerHTML = `
                <h3>${message.title}</h3>
                <p>${message.text.substring(0, 250)}</p>
                <div class="message-footer">
                    <span>Publié par: ${message.user}</span>
                    <span>Le: ${new Date(message.date).toLocaleString()}</span>
                    <div class="message-actions">
                        <button class="like-btn">👍 ${message.likes || 0}</button>
                        <button class="dislike-btn">👎 ${message.dislikes || 0}</button>
                        <span>: ${(message.likes || 0) - (message.dislikes || 0)}</span>
                        ${currentToken ? `<button class="add-answer-btn">Ajouter une réponse</button>` : ''}
                    </div>
                </div>
            `;
            homeSection.appendChild(messageElement);
        });
    }
      fetchMessages();

    messagesBtn.addEventListener('click', async () => {
        if (!currentToken) {
            alert('Veuillez vous connecter');
            return;
        }
    
        try {
            const response = await fetch('http://localhost:3002/user-messages', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });
    
            const userMessages = await response.json();
            displayMessages(userMessages);
        } catch (error) {
            console.error('Erreur de récupération des messages personnels:', error);
            alert('Impossible de récupérer vos messages');
        }
    });

    // Initialisation
    updateUIBasedOnAuthStatus();
});

   