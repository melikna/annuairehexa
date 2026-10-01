# Intervention mémoire — 1er octobre 2026

## Diagnostic observé

- VPS Ubuntu : 3,768 Gio de RAM, aucun swap au début de l'intervention.
- OOM global le 29 septembre : processus `next-server`, mémoire anonyme résidente 2 442 772 Kio.
- OOM global le 1er octobre : même processus, 2 648 968 Kio.
- Conteneur applicatif sans limite mémoire. Redémarrage du VPS à 13:21 UTC le 1er octobre, antérieur aux modifications.
- Next.js 15.3.4 ; `DATABASE_URL` et `DATABASE_URL_READONLY` absentes. La correction des pools PostgreSQL est préventive et ne constitue pas une explication des OOM actuels.
- Deux caches Map sans éviction. Des réponses SOCKS interrompues pouvaient laisser une promesse non résolue ; aucun plafond de taille de réponse ou de concurrence globale.

Les journaux prouvent l'épuisement mémoire du processus, mais ne permettent pas d'attribuer précisément les 2,5 Gio à chaque défaut. Aucun heap dump historique disponible.

## Modifications

- Caches LRU : 64 entrées et 4 Mio de données sérialisées maximum par service ; éviction des entrées expirées. Le poids réel des objets JavaScript peut dépasser leur taille sérialisée.
- Chargements créations/procédures : déduplication par clé, quatre chargements distincts simultanés par service, sans file d'attente illimitée.
- Appels externes : seize simultanés, réponse limitée à 4 Mio, délai global de huit secondes (ou délai plus court fourni par l'appelant).
- SOCKS : rejet effectif sur annulation, fermeture prématurée, réponse surdimensionnée et expiration ; nettoyage des écouteurs, timers et sockets.
- Pools PostgreSQL réutilisés en production, cinq connexions par pool ; lecture et écriture partagent le pool quand l'URL est identique.
- Cache Next.js limité à 16 Mio. Compilation avec un seul worker et optimisations mémoire Webpack.
- Next.js 15.5.27 et React/React DOM 19.0.8.
- Heap Node en production : 1 024 Mio. Limite conteneur : 1 536 Mio ; réservation souple : 768 Mio ; RAM + swap maximum : 2 048 Mio.
- Swap système : fichier `/swapfile-annuairehexa` de 2 Gio, activé et déclaré dans `/etc/fstab`.
- Limites également enregistrées dans la fiche de l'application Coolify.

La limite de heap ne couvre pas toute la mémoire du processus. La limite du conteneur protège le VPS ; si elle est atteinte, Docker peut tuer puis redémarrer l'application. Cela ne garantit pas une disponibilité absolue sous toute charge.

## Sauvegarde et déploiements futurs

Sauvegarde privée sur le VPS : `/root/annuairehexa-backup-20261001/` (sources initiales, description du conteneur, compose, fstab, configuration applicative Coolify). Ne pas publier ce répertoire : sa configuration peut contenir des secrets.

Sources corrigées préparées dans `/root/annuairehexa-memory-fix/` et dans le dossier local `recovered/`.

Le projet Coolify est relié à `melikna/annuairehexa`, branche `main`. Cette synchronisation reporte les sources corrigées et les évolutions déjà présentes sur le VPS dans le dépôt. Coolify utilise le Dockerfile versionné, avec les limites mémoire persistantes de la fiche applicative. Les futurs déploiements suivent la branche main.

Ne pas versionner les anciens scripts de déploiement contenant des identifiants intégrés ; ils ne sont pas inclus dans cette synchronisation et sont exclus du versionnement.

## Vérifications et exploitation

Résultats de l'intervention :

- TypeScript validé et 26 tests passants sur Linux avant compilation ; un test supplémentaire de déduplication/concurrence validé localement (27 tests au total).
- Compilation de production Linux réussie dans un conteneur limité à 2 Gio, sans OOM.
- Image déployée : `annuairehexa:memory-fix-20261001` ; précédente : `5fvsm3jva2jvpeo39yjijjdt:e761219` (conservée).
- 100 requêtes HTTP de contrôle en préproduction et 100 sur le domaine HTTPS après déploiement : toutes en 200, concurrence quatre.
- Recherche, autocomplétion, procédures et créations contrôlées en préproduction ; recherche, procédures et créations renvoient des résultats.
- Préproduction après tests : environ 113 Mio, pic du cgroup environ 150 Mio. Production après vérifications : environ 122 Mio. Ces essais courts ne sont pas une preuve de stabilité sur plusieurs jours.
- Limites Docker vérifiées en production, Next.js 15.5.27 vérifié dans le conteneur, heap V8 plafonné (limite totale rapportée 1 048 Mio pour 1 024 Mio de old space).
- À la fin des contrôles : environ 2,4 Gio de RAM disponible sur le VPS ; aucun OOM dans le journal du démarrage actuel. Conteneurs de compilation et de préproduction supprimés.

Le patch initial correspond aux sources récupérées du VPS. Le dépôt Git constitue désormais la source de référence pour les déploiements futurs ; le nom exact du conteneur peut changer à chaque déploiement Coolify.

Pour revenir à l'ancienne application tout en gardant les protections mémoire, remplacer uniquement l'image par `5fvsm3jva2jvpeo39yjijjdt:e761219` dans `/data/coolify/applications/5fvsm3jva2jvpeo39yjijjdt/docker-compose.yaml`, puis exécuter `docker compose up -d --no-deps --pull never` pour le service applicatif depuis ce dossier. Ne pas supprimer le swap ni les limites pour effectuer ce retour arrière. L'ancienne application conserve ses défauts ; ce retour est un dépannage temporaire.

Exécuter `npm ci`, `npm run typecheck`, `npm test -- --runInBand`, puis `npm run build`.

Les tests couvrent l'éviction sous milliers de clés, la limite de taille des caches, leur expiration, la réutilisation des pools, les connexions SOCKS interrompues/bloquées et les réponses trop volumineuses.

Sur le VPS :

```sh
free -h
swapon --show
docker stats --no-stream
journalctl -k --since '1 hour ago' | grep -Ei 'oom-kill|Out of memory|Killed process'
```

Surveiller l'évolution sur plusieurs jours de trafic réel pour confirmer l'absence de croissance durable. Aucun suivi automatique distant n'est installé par cette intervention.

## Références techniques

- [Postgres.js — pools et timeouts](https://github.com/porsager/postgres)
- [Next.js — mémoire](https://nextjs.org/docs/app/guides/memory-usage)
- [Next.js — hébergement et caches](https://nextjs.org/docs/app/guides/self-hosting)
- [Annonce de la version corrective de septembre](https://nextjs.org/blog/upcoming-nextjs-security-release-september-2026)
