# Kaskroot - Application Full-Stack de Quiz en Temps Réel

Application complète de gestion et de participation à des quiz interactifs en temps réel, développée avec Next.js (frontend) et Node.js/Express (backend), utilisant WebSockets pour la synchronisation en temps réel.

## Auteurs
* Loris Nève
* Léo Langlois

## Prérequis

Avant de lancer le projet, assurez-vous d’avoir les éléments suivants installés :

* **Node.js** version 18 ou supérieure
* **PostgreSQL** version 14 ou supérieure
* **npm** (installé automatiquement avec Node.js)
* **pnpm**

Installation de pnpm :

```bash
npm install -g pnpm
```

Cloner le projet 
```bash
git clone https://github.com/LeoLgls/quiz.git
cd quiz
```

---

## Configuration des fichiers d'environnement

### Backend (`.env`)

Créer un fichier `.env` dans `./apps/backend/` avec le contenu suivant :

```env
DATABASE_URL="postgresql://postgres:votre_mot_de_passe_postgres@localhost:5432/quiz_app_db"
JWT_SECRET="cle-secrete-a-definir"
JWT_EXPIRES_IN="7d"
PORT=5000
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

### Frontend (`.env.local`)

Créer un fichier `.env.local` dans `./apps/frontend/` avec le contenu suivant :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=http://localhost:5000/
```

---

## Lancer le projet

### 1. Configuration du backend

```bash
cd ./apps/backend/

pnpm i

pnpm add -D prisma
pnpm add @prisma/client

pnpm prisma generate
pnpm prisma migrate dev --name init

pnpm dev
```

---

### 2. Configuration du frontend

```bash
cd ./apps/frontend/

pnpm i
pnpm dev
```

## Architecture

### Structure du Projet (Monorepo)
```
quiz/
├── apps/
│   ├── backend/            # API Node.js + Express + Socket.IO
│   │   ├── src/
│   │   │   ├── controllers/    # Logique métier
│   │   │   ├── routes/         # Définition des routes API
│   │   │   ├── middleware/     # Auth, erreurs
│   │   │   ├── socket/         # Gestion WebSocket
│   │   │   ├── lib/            # Utilitaires (JWT, Prisma)
│   │   │   └── server.ts       # Point d'entrée
│   │   └── prisma/
│   │       └── schema.prisma   # Schéma de base de données
│   │
│   └── frontend/           # Application Next.js
│       ├── app/                # Pages (App Router)
│       ├── components/         # Composants réutilisables
│       ├── hooks/              # Custom hooks
│       ├── lib/                # API client + interceptors
│       └── store/              # State management (Zustand)
│
└── shared/                 # Types TypeScript partagés
    └── index.ts                # Interfaces communes
```


## Technologies Utilisées

### Backend
- **Node.js + Express** : API REST
- **Socket.IO** : Communication bidirectionnelle temps réel
- **Prisma** : ORM pour PostgreSQL
- **JWT** : Authentification sécurisée
- **bcryptjs** : Hachage des mots de passe
- **TypeScript** : Typage statique

### Frontend
- **Next.js 15** : Framework React avec App Router
- **React 19** : Bibliothèque UI
- **Socket.IO Client** : Client WebSocket
- **Axios** : Client HTTP avec interceptors
- **Zustand** : State management léger
- **TanStack Query** : Gestion des requêtes
- **Tailwind CSS** : Styling
- **TypeScript** : Typage statique

### Base de données
- **PostgreSQL** : Base de données relationnelle


## Utilisation

### 1. Créer un compte Enseignant
1. Aller sur http://localhost:3000
2. Cliquer sur "Inscription"
3. Remplir le formulaire en choisissant le rôle "Enseignant"

### 2. Créer un Quiz
1. Se connecter en tant qu'enseignant
2. Aller dans "Mes Quiz"
3. Cliquer sur "Créer un quiz"
4. Ajouter des questions avec leurs options et réponses correctes
5. Définir les points et le temps limite

### 3. Lancer une Session
1. Depuis la liste des quiz, cliquer sur l'icône Play
2. Une session est créée avec un code d'accès unique (ex: ABC123)
3. Partager ce code avec les étudiants
4. Attendre que les participants rejoignent
5. Cliquer sur "Démarrer le quiz"

### 4. Participer en tant qu'Étudiant
1. Créer un compte avec le rôle "Étudiant"
2. Cliquer sur "Rejoindre un Quiz"
3. Entrer le code d'accès fourni par l'enseignant
4. Attendre le démarrage
5. Répondre aux questions en temps réel

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur (authentifié)

### Quiz (Enseignants uniquement)
- `GET /api/quizzes` - Liste des quiz
- `POST /api/quizzes` - Créer un quiz
- `GET /api/quizzes/:id` - Détails d'un quiz
- `PUT /api/quizzes/:id` - Modifier un quiz
- `DELETE /api/quizzes/:id` - Supprimer un quiz
- `POST /api/quizzes/:quizId/questions` - Ajouter une question
- `PUT /api/quizzes/questions/:questionId` - Modifier une question
- `DELETE /api/quizzes/questions/:questionId` - Supprimer une question

### Sessions
- `POST /api/sessions` - Créer une session (enseignant)
- `GET /api/sessions/:id` - Détails d'une session
- `POST /api/sessions/join` - Rejoindre une session (étudiant)
- `POST /api/sessions/:id/start` - Démarrer une session (enseignant)
- `POST /api/sessions/:id/next` - Question suivante (enseignant)
- `POST /api/sessions/:id/end` - Terminer une session (enseignant)
- `POST /api/sessions/answer` - Soumettre une réponse (étudiant)
- `GET /api/sessions/:id/leaderboard` - Classement

## 🔄 Événements WebSocket

### Client → Serveur
- `join-session` - Rejoindre une session
- `leave-session` - Quitter une session
- `start-session` - Démarrer une session (enseignant)
- `next-question` - Passer à la question suivante (enseignant)
- `end-session` - Terminer une session (enseignant)
- `submit-answer` - Soumettre une réponse (étudiant)

### Serveur → Client
- `session-state` - État initial de la session
- `session-started` - Session démarrée
- `question-broadcast` - Nouvelle question diffusée
- `question-ended` - Fin d'une question + classement
- `session-ended` - Session terminée + classement final
- `participant-joined` - Nouveau participant
- `participant-left` - Participant parti
- `answer-submitted` - Confirmation de réponse
- `error` - Erreur

## 🛡️ Sécurité

- ✅ Authentification JWT avec tokens expirables
- ✅ Mots de passe hachés avec bcryptjs
- ✅ Protection des routes par middleware
- ✅ Validation des rôles côté serveur
- ✅ Authentification WebSocket par token
- ✅ Gestion centralisée des erreurs
- ✅ CORS configuré

## 🎯 Points Forts de l'Architecture

### Integration Full-Stack
- **Types partagés** : Package `shared/` avec toutes les interfaces TypeScript communes
- **Client API centralisé** : Interceptors Axios pour JWT et gestion d'erreurs
- **State management** : Zustand pour l'authentification côté client
- **Custom hooks** : `useAuth` pour la protection des routes, `useSocket` pour WebSocket

### Communication Temps Réel
- Synchronisation instantanée entre tous les participants
- Gestion automatique des reconnexions
- Diffusion efficace des événements par room
- Timer synchronisé sur tous les clients

### Expérience Utilisateur
- Interface responsive et moderne avec Tailwind CSS
- Feedback visuel en temps réel (animations, indicateurs)
- Messages d'erreur clairs et contextuels
- Navigation intuitive

## 📝 Modèle de Données

### User
- id, email, password (haché), name, role (TEACHER/STUDENT)

### Quiz
- id, title, description, creatorId → User
- Relations : questions[], sessions[]

### Question
- id, quizId → Quiz, text, type (MULTIPLE_CHOICE/TRUE_FALSE/TEXT)
- options (JSON), correctAnswer, points, order, timeLimit

### Session
- id, code (unique), quizId → Quiz, status (WAITING/ACTIVE/FINISHED)
- currentQuestion, startedAt, finishedAt
- Relations : participations[]

### Participation
- id, sessionId → Session, userId → User, score, joinedAt
- Relations : answers[]

### Answer
- id, participationId → Participation, questionId → Question
- answer, isCorrect, answeredAt, timeToAnswer

