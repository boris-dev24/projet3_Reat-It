
document.addEventListener('DOMContentLoaded', () => {
    // Configuration initiale des éléments DOM
    const homeSection = document.getElementById('home');
    const searchInput = document.querySelector('.search');
    const loadMoreBtn = document.createElement('button');
    const userBtn = document.getElementById('activeUser');
    loadMoreBtn.textContent = 'Voir plus';
    loadMoreBtn.classList.add('load-more-btn', 'hidden');


    // Sélection des éléments DOM
    const welcomeMessage = document.getElementById('welcome');
    const logInBtn = document.getElementById('logIn');
    const registerBtn = document.getElementById('register');
    const logOutBtn = document.getElementById('logOut');
    const newMessageBtn = document.getElementById('newMessage');
    const newMessageForm = document.getElementById('newMessageForm');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const cancelMessageButton = document.getElementById('cancelMessageButton');
    const logInPage = document.getElementById('logInPage');
    const registerPage = document.getElementById('registerPage');



    // Zone pour profil utilisateur
    const userProfileDropdown = document.createElement('div');
    userProfileDropdown.classList.add('user-profile-dropdown', 'hidden');
    userProfileDropdown.innerHTML = `
        <button id="userProfileBtn">Profil</button>
        <button id="userMessagesBtn">Mes Messages</button>
    `;
    welcomeMessage.appendChild(userProfileDropdown);


    // Pages de profil et mes messages
    const userProfilePage = document.createElement('div');
    userProfilePage.id = 'userProfilePage';
    userProfilePage.classList.add('hidden');
    document.body.appendChild(userProfilePage);

    const userMessagesPage = document.createElement('div');
    userMessagesPage.id = 'userMessagesPage';
    userMessagesPage.classList.add('hidden');
    document.body.appendChild(userMessagesPage);


    // Variables globales pour le token et l'utilisateur
    window.currentToken = null;
    window.currentUser = null;

    // Fonction pour formater la date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    function updateUIBasedOnAuthStatus() {
        if (!currentToken) {
            // Utilisateur non connecté
            logInBtn.classList.remove('hidden');
            registerBtn.classList.remove('hidden');
            logOutBtn.classList.add('hidden');
            newMessageBtn.classList.add('hidden');
            welcomeMessage.textContent = '';
            userProfileDropdown.classList.add('hidden');
        } else {
            // Utilisateur connecté
            logInBtn.classList.add('hidden');
            registerBtn.classList.add('hidden');
            logOutBtn.classList.remove('hidden');
            newMessageBtn.classList.remove('hidden');
            userBtn.classList.remove('hidden');
            
            // Afficher le nom d'utilisateur comme bouton
            welcomeMessage.textContent = `Bienvenue, ${currentUser.username}!`;
            welcomeMessage.classList.add('user-button');
        }
    }

    // Gestion du menu déroulant utilisateur
    welcomeMessage.addEventListener('click', () => {
        userProfileDropdown.classList.toggle('hidden');
    });

    // Bouton Profil
    userProfileDropdown.querySelector('#userProfileBtn').addEventListener('click', async () => {
        try {
            const response = await fetch('/user-profile', {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            const userData = await response.json();
            
            userProfilePage.innerHTML = `
                <h2>Profil de ${userData.username}</h2>
                <p>Nom : ${userData.name}</p>
                <p>Nom d'utilisateur : ${userData.username}</p>
                <p>Date d'inscription : ${new Date(userData.createdAt).toLocaleDateString()}</p>
                <p>Nombre de messages : ${userData.messagesCount}</p>
                <p>Total de likes : ${userData.totalLikes}</p>
                <p>Total de dislikes : ${userData.totalDislikes}</p>
                <button id="closeProfileBtn">Fermer</button>
            `;
            
            userProfilePage.classList.remove('hidden');
            
            document.getElementById('closeProfileBtn').addEventListener('click', () => {
                userProfilePage.classList.add('hidden');
            });
        } catch (error) {
            console.error('Erreur de récupération du profil:', error);
        }
    });

    // Bouton Mes messages
    userProfileDropdown.querySelector('#userMessagesBtn').addEventListener('click', () => {
        fetchUserMessages();
    });

    // Nouvelle fonction pour récupérer les messages de l'utilisateur
    async function fetchUserMessages() {
        try {
            const response = await fetch('/user-messages', {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            const messages = await response.json();
            
            userMessagesPage.innerHTML = `
                <h2>Mes Messages</h2>
                <div id="userMessagesList"></div>
                <button id="closeUserMessagesBtn">Fermer</button>
            `;
            
            const userMessagesList = userMessagesPage.querySelector('#userMessagesList');
            displayMessages(messages, false, userMessagesList);
            
            userMessagesPage.classList.remove('hidden');
            
            document.getElementById('closeUserMessagesBtn').addEventListener('click', () => {
                userMessagesPage.classList.add('hidden');
            });
        } catch (error) {
            console.error('Erreur de récupération des messages:', error);
        }
    }

    // Événements pour afficher les pages de connexion et inscription
    logInBtn.addEventListener('click', () => {
        logInPage.classList.remove('hidden');
    });

    registerBtn.addEventListener('click', () => {
        registerPage.classList.remove('hidden');
    });

    // Inscription
    document.querySelector('#registerPage button[type="submit"]').addEventListener('click', async () => {
        const name = document.getElementById('registerName').value;
        const username = document.getElementById('registerUserName').value;
        const password = document.getElementById('registerPassword').value;
        const profil = document.querySelector('input[name="profile"]:checked').value;

        try {
            const response = await fetch('/register', {
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
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                currentToken = data.token;
                currentUser = { username, profil: data.profil };
                updateUIBasedOnAuthStatus();
                logInPage.classList.add('hidden');
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
            const response = await fetch('/newMessage', {
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

    // Fonction pour afficher les messages
    function displayMessages(messages, append = false) {
        if (!append) {
            homeSection.innerHTML = '';
        }
        if (messages.length === 0) {
            targetElement.innerHTML = '<p>Aucun message trouvé.</p>';
            return;
        }

        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.dataset.messageId = message._id;

            const truncatedText = message.text.length > 250 
                ? message.text.substring(0, 250) + '...'
                : message.text;

            messageElement.innerHTML = `
                <div class="message-header">
                    <h3>${message.title}</h3>
                    <div class="message-meta">
                        <span>${message.user}</span>
                        <span>${formatDate(message.createdAt)}</span>
                    </div>
                </div>
                <div class="message-content">
                    <p>${truncatedText}</p>
                    ${message.text.length > 250 ? 
                        '<button class="expand-message">Voir plus</button>' : ''}
                </div>
                <div class="message-interactions">
                    ${currentToken ? `
                        <div class="vote-section">
                            <button class="like-btn" data-message-id="${message._id}">👍 ${message.likes || 0}</button>
                            <button class="dislike-btn" data-message-id="${message._id}">👎 ${message.dislikes || 0}</button>
                            <span>Solde: ${(message.likes || 0) - (message.dislikes || 0)}</span>
                        </div>
                        <button class="add-answer-btn">Ajouter une réponse</button>
                    ` : ''}
                    ${currentUser && currentUser.profil === 'admin' ? 
                        '<button class="delete-message-btn">🗑️</button>' : ''}
                </div>
                <div class="answers-section"></div>
            `;

            // Gestion de "Voir plus"
            const expandBtn = messageElement.querySelector('.expand-message');
            if (expandBtn) {
                expandBtn.addEventListener('click', () => {
                    messageElement.querySelector('.message-content p').textContent = message.text;
                    expandBtn.remove();
                });
            }

            // Gestion des likes/dislikes
            const likeBtn = messageElement.querySelector('.like-btn');
            const dislikeBtn = messageElement.querySelector('.dislike-btn');

            if (likeBtn) {
                likeBtn.addEventListener('click', () => voteOnMessage(message._id, 'like'));
            }
            if (dislikeBtn) {
                dislikeBtn.addEventListener('click', () => voteOnMessage(message._id, 'dislike'));
            }

            // Gestion suppression par admin
            const deleteBtn = messageElement.querySelector('.delete-message-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => deleteMessage(message._id));
            }

            homeSection.appendChild(messageElement);
        });

        // Gestion du bouton "Voir plus"
        loadMoreBtn.classList.toggle('hidden', messages.length < 10);
        if (!append) {
            homeSection.appendChild(loadMoreBtn);
        }
    }

    // Variables pour la pagination
    let currentPage = 1;

    // Fonction de gestion de like
    async function voteOnMessage(messageId, type) {
        try {
            const response = await fetch(`/message/${messageId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ type })
            });

            if (response.ok) {
                await fetchMessages(searchInput.value);
            }
        } catch (error) {
            console.error('Erreur lors du vote:', error);
        }
    }

    // Fonction de suppression de message
    async function deleteMessage(messageId) {
        try {
            const response = await fetch(`/message/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (response.ok) {
                await fetchMessages(searchInput.value);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    }

    
    async function fetchMessages(searchTerm = '', page = 1) {
        if (!searchTerm) return;
    
        try {
            const url = `/messages?search=${encodeURIComponent(searchTerm)}&page=${page}`;
    
            const response = await fetch(url, {
                headers: currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const messages = await response.json();
            
            // Vérifier que messages est bien un tableau
            if (Array.isArray(messages)) {
                displayMessages(messages);
            } else {
                console.error('La réponse n\'est pas un tableau', messages);
            }
        } catch (error) {
            console.error('Erreur de récupération des messages:', error);
        }
    }

    // Événement de recherche
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        currentPage = 1;
        fetchMessages(searchTerm);
    });

    // Événement "Voir plus"
    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        fetchMessages(searchInput.value, currentPage);
    });

    // Initialisation
    updateUIBasedOnAuthStatus();
    fetchMessages();
});