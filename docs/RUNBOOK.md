# Runbook d'Exploitation & Maintenance

> Manuel des opérations courantes et procédures d'urgence pour l'administrateur.

---

## 1. Sauvegardes & Restauration (PostgreSQL)

### Sauvegarde quotidienne automatisée
```bash
# Export compressé de la base de données
pg_dump -h localhost -U aef_user -d annuaire_prod -Fc -f /backups/annuaire_$(date +%Y%m%d).dump
```

### Procédure de restauration
```bash
# 1. Recréer la base vide
dropdb -h localhost -U aef_user annuaire_prod
createdb -h localhost -U aef_user annuaire_prod

# 2. Restaurer le dump
pg_restore -h localhost -U aef_user -d annuaire_prod -v /backups/annuaire_YYYYMMDD.dump

# 3. Réappliquer impérativement les blocages permanents
psql -h localhost -U aef_user -d annuaire_prod -c "
  UPDATE legal_units SET statut_diffusion = 'N' WHERE siren IN (SELECT entity_id FROM suppression_requests WHERE permanent_block = true AND entity_type = 'unite_legale');
  UPDATE establishments SET statut_diffusion = 'N' WHERE siret IN (SELECT entity_id FROM suppression_requests WHERE permanent_block = true AND entity_type = 'etablissement');
"
```

---

## 2. Automatisation de la synchronisation (Crontab)

Pour maintenir la base de données à jour quotidiennement avec l'INSEE :

```cron
# Synchronisation incrémentale tous les matins à 4h00
0 4 * * * cd /opt/annuaire-entreprises && node workers/sync/incremental.js --flux unites_legales >> /var/log/aef_sync.log 2>&1
30 4 * * * cd /opt/annuaire-entreprises && node workers/sync/incremental.js --flux etablissements >> /var/log/aef_sync.log 2>&1
```

---

## 3. Gestion d'une demande de déréférencement / RGPD urgente

1. Se connecter sur l'interface d'administration : `https://annuaire-entreprises.fr/admin`
2. Consulter la ligne correspondante dans **Demandes de correction & oppositions**.
3. En cas de demande par email ou courrier, insérer directement dans PostgreSQL :
   ```sql
   INSERT INTO suppression_requests (entity_type, entity_id, request_type, status, permanent_block, description)
   VALUES ('unite_legale', '123456789', 'opposition', 'applied', true, 'Demande d\'opposition directe');
   ```
4. L'entité disparaît immédiatement de la recherche publique et des fiches.
