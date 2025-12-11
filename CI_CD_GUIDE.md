# 🚀 CI/CD Setup Guide

## Workflows Configurés

### 1️⃣ **ci.yml** - Tests et Qualité (Automatique)
Déclenché à chaque **push** ou **pull request** sur `main` ou `develop`

✅ **Exécute:**
- Tests npm
- Linting du code
- Vérification syntaxe JavaScript
- Vérification sécurité (npm audit)
- Statistiques du projet

### 2️⃣ **deploy.yml** - Déploiement Docker (Optionnel)
Déclenché sur **push vers main** et **tags** (v*)

✅ **Exécute:**
- Build de l'image Docker
- Push vers Docker Hub
- Cache des builds
- Versioning automatique

---

## Configuration Requise

### Pour le déploiement Docker Hub

1. **Crée un compte Docker Hub** (gratuit)
   - https://hub.docker.com

2. **Ajoute les secrets GitHub:**
   - Va à: `Settings > Secrets and variables > Actions`
   - Crée 2 secrets:
     - `DOCKER_USERNAME` = ton username Docker Hub
     - `DOCKER_PASSWORD` = ton Personal Access Token (pas le mot de passe!)

3. **Génère un Personal Access Token:**
   - Sur Docker Hub: Account Settings > Security > New Access Token
   - Copie le token → Ajoute en secret GitHub

---

## Comment Ça Marche

### 📌 Sur chaque push:
```bash
git push origin main
```
✅ GitHub Actions va automatiquement:
1. ✓ Télécharger le code
2. ✓ Installer les dépendances
3. ✓ Exécuter les tests
4. ✓ Vérifier la qualité
5. ✓ Construire l'image Docker
6. ✓ Pousser vers Docker Hub (si secrets configurés)

### 📌 Suivre l'exécution:
- Va à: `GitHub > Actions > Workflows`
- Clique sur le dernier push
- Vois les logs en temps réel

---

## Commandes Locales

### Exécuter les tests:
```bash
npm test
```

### Linter le code:
```bash
npx eslint . --ext .js
```

### Construire l'image Docker localement:
```bash
docker build -t dockerapp:latest .
```

### Lancer le container:
```bash
docker run -p 3000:3000 --env-file .env dockerapp:latest
```

---

## Variables d'Environnement

Le Dockerfile charge automatiquement `.env` au runtime.

**Exemple .env:**
```
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
PORT=3000
```

---

## Prochaines Étapes Optionnelles

### 🔄 Déploiement automatique
- Ajoute un serveur (Render, Railway, Heroku)
- Configure le CD pour déployer après les tests

### 📊 Couverture de tests
- Intègre `nyc` ou `c8` pour la couverture
- Ajoute un badge dans le README

### 🛡️ Code scanning
- Ajoute GitHub's CodeQL scanning
- Intègre SonarQube pour l'analyse avancée

### 📦 Versioning
- Utilise les tags Git: `git tag v1.0.0 && git push --tags`
- Workflows utiliseront les tags pour versionner les images Docker

---

## Status Badge dans README

Ajoute ceci dans ton README.md:

```markdown
![CI/CD](https://github.com/ton-username/DockerApp/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/ton-username/DockerApp/actions/workflows/deploy.yml/badge.svg)
```

Remplace `ton-username` par ton username GitHub!

---

## Dépannage

### ❌ Workflow échoue?
1. Clique sur le workflow
2. Voir les logs détaillés
3. Erreurs communes:
   - **Secrets manquants** → Ajoute dans Settings > Secrets
   - **Tests échouent** → Vérifie `npm test`
   - **Docker échoue** → Vérifie Dockerfile et .dockerignore

### ❌ Docker Hub push échoue?
- Vérifie les secrets DOCKER_USERNAME et DOCKER_PASSWORD
- Assure-toi que tu utilises un Personal Access Token, pas le password

---

## 💡 Tips

✅ **Bonnes pratiques:**
- Utilise des branches pour les features: `git checkout -b feature/xyz`
- Fais des PRs avant de merger sur main
- Les tests et lint doivent passer avant merge
- Tag les releases: `git tag v1.0.0 && git push --tags`

✅ **Optimisations:**
- Les caches sont utilisés pour faire les builds plus rapides
- Les dépendances sont cachées (npm ci)
- Les builds Docker utilisent le cache de Buildx

---

**👉 Maintenant, fais un `git push` et va voir les workflows en action sur GitHub!**
