# Exam Hub — Backend

Ce guide permet d'installer et de lancer le projet en local sans autre information.

## Prérequis

- [Node.js](https://nodejs.org/) version 18 ou supérieure(plus présisément 20.20.2)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré
- npm (fourni avec Node.js)

## 1. Installation des dépendances

```bash
npm install
```

<details>
<summary>Dépendances installées par ce projet (pour référence)</summary>

```bash
npm install express pg dotenv bcryptjs jsonwebtoken cors
npm install -D typescript @types/express @types/node @types/pg @types/bcryptjs @types/jsonwebtoken @types/cors tsx
```
</details>

## 2. Configuration de l'environnement

Copier le fichier d'exemple puis l'adapter si besoin (les valeurs par défaut fonctionnent pour un lancement local) :

```bash
cp .env.example .env
```

Le fichier `.env` doit contenir :

PORT=3001
```
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=exam_hub_db
DB_PORT=5433
DB_HOST=localhost
JWT_SECRET=super_secret_key_pour_les_tokens_jwt
JWT_EXPIRES_IN=24h
```
## 3. Démarrage de la base de données (Docker)

Le conteneur PostgreSQL est défini dans `docker-compose.yaml`.

```bash
docker compose up -d
```

Vérifier que le conteneur tourne :
```bash
docker ps
```
Tu dois voir un conteneur nommé `exam_hub_postgres` avec le statut `Up`.

> **En cas d'erreur "container name already in use"** (conflit avec un ancien conteneur) :
> ```bash
> docker rm -f exam_hub_postgres
> docker compose up -d
> ```
> Si les tables ont déjà été modifiées entre deux versions du projet, repartir d'une base propre :
> ```bash
> docker compose down -v
> docker compose up -d
> ```

## 4. Exécution des migrations

Crée les tables (`users`, `courses`, `exams`, `questions`, `choices`, `attempts`, `student_answers`) :

```bash
npm run migrate
```

## 5. Compilation et lancement du serveur

```bash
npm run build
npm run start
```

Le serveur écoute par défaut sur `http://localhost:3000`, toutes les routes sont préfixées par `/api`.

> Pour le développement (rechargement automatique), utiliser plutôt :
> ```bash
> npm run dev
> ```

## 6. Création du compte administrateur

Aucune auto-inscription n'est possible (RG-01) : le premier compte admin est créé via un script.

```bash
npm run create:admin -- "Admin Test" admin@example.com 123456789
```
Arguments : `"Nom complet" email motDePasse`

## Comptes de test

| Rôle           | Email               | Mot de passe |
|--------------------------------------------------------
| Administrateur | `admin@example.com` | `123456789`  |
| Étudiant | *(à créer depuis l'espace admin une fois connecté)* | — |

Les comptes étudiants ne peuvent être créés que par un administrateur, depuis `POST /api/students` (ou via l'interface `/admin/students` du frontend). de même pour les cours, examen, question, choix

## Example d'etudiant
nom: Example Test
email: example@test.com
mot de passe: 123456789

## Cours d'etudiant
Code du cours : WEB2

Nom du cours : WEB fullstack

Description : Architecture Fullstack avec Node.js, Express, TypeScript et React

## Examen d'etudiant
Titre de l'examen : Examen Final - API REST Express

Cours associé : Sélectionner le cours créé juste avant

Date de début : 28/08/2026 00:00

Date de fin : 30/08/2026 12:00

## Question d'etudiant
Qu'est ce que react?
framework
repository

Qu'est ce que express?
framework
repository


## Structure du projet

```
migrations/ # Un fichier .sql par table, exécutés dans l'ordre numérique

src/
├── controller/     
├── services/       
├── repositories/   
├── models/         
├── security/       
├── scripts/        
├── configurations/ 
└── index.ts        
       
```

## Dépannage

                                                                                                 |
`container name already in use` 
    `docker rm -f exam_hub_postgres` puis relancer `docker compose up -d` 

`daemon not running` / erreur de pipe Docker 
    Vérifier que Docker Desktop est bien lancé et complètement démarré avant toute commande `docker` 

Erreur SQL après un changement de schéma 
    Repartir d'une base vide : `docker compose down -v && docker compose up -d && npm run migrate` 

`401 Unauthorized` sur une route protégée
    Vérifier que l'en-tête `Authorization: Bearer <token>` est bien présent et que le token n'a  pas expiré


# Exam Hub — Frontend


## Comment ce projet a été initialisé
bash
```
npm create vite@latest
```
. Nom du projet : exam-hub
. Framework: React
. Variante: JavaScript + React Compiler
. Linter: ESLint

## Configuration de l'environnement
VITE_API_URL=http://localhost:3001/api

## Lancement

```
npm run dev
```
ou

```
npm run build

npm run preview
```

## Structure du projet
src/
├── api/            
├── components/     
├── pages/
│   ├── Login.jsx   
│   ├── admin/      
│   └── student/    
├── App.jsx         
└── main.jsx        
