# Guide de Déploiement en Production

> Déploiement de l'Annuaire Entreprises France sur serveur Linux (Ubuntu 22.04 / Debian 12).

---

## 1. Prérequis Serveur

- Serveur dédié ou VPS (min. 4 vCPU, 8 Go RAM, 100 Go SSD NVMe pour le pilote / 500 Go pour le national).
- Docker et Docker Compose installés.
- Nginx ou Caddy comme reverse-proxy HTTPS avec certificat SSL Let's Encrypt.
- Domaine pointé vers l'IP du serveur.

---

## 2. Déploiement via Docker Compose

```bash
# 1. Cloner le projet sur le serveur
git clone <votre-depot> /opt/annuaire-entreprises
cd /opt/annuaire-entreprises

# 2. Configurer les variables d'environnement de production
cp .env.example .env.production
# Éditer .env.production avec vos mots de passe sécurisés et clés API

# 3. Lancer la base PostgreSQL et l'application
docker compose -f docker-compose.yml up -d --build

# 4. Vérifier les logs
docker compose logs -f app
```

---

## 3. Initialisation des données

```bash
# Entrer dans le conteneur ou exécuter depuis l'hôte :
docker compose exec app node scripts/migrate.js
docker compose exec app node workers/import/referentiels.js
docker compose exec app node workers/import/pilot.js --departement 75 --max-pages 200
```

---

## 4. Reverse-Proxy Nginx (Exemple de configuration)

```nginx
server {
    server_name annuaire-entreprises.fr www.annuaire-entreprises.fr;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/annuaire-entreprises.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/annuaire-entreprises.fr/privkey.pem;
}
```
