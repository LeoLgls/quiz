# Kaskroot

## Prérequis

Avant de lancer le projet, assurez-vous d’avoir les éléments suivants installés :

* **Node.js** version 18 ou supérieure
* **npm** (installé automatiquement avec Node.js)
* **pnpm**

Installation de pnpm :

```bash
npm install -g pnpm
```

---

## Configuration des fichiers d'environnement

### Backend (`.env`)

Créer un fichier `.env` dans `./apps/backend/` avec le contenu suivant :

```env
DATABASE_URL="postgresql://postgres:votre_mot_de_passe_postgres@localhost:5432/quiz_app_db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
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
