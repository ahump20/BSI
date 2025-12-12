# /bsi-migrate — database migration workflow

When making database schema changes:

## Pre-migration checklist
1. What tables are affected?
2. Is this additive or destructive?
3. Can we roll back if needed?
4. Is there data to migrate?

## Migration types

### Additive (safe)
- Add new table
- Add new column (nullable or with default)
- Add new index

### Destructive (careful)
- Drop column
- Change column type
- Drop table
- Rename anything

## D1 migration steps
1. Write migration SQL in `migrations/`
2. Test locally: `wrangler d1 execute bsi-db --local --file=migrations/XXX.sql`
3. Verify local data
4. Deploy: `wrangler d1 execute bsi-db --file=migrations/XXX.sql`
5. Verify production

## Rollback plan
For destructive changes, always have:
1. Backup of affected data
2. Reverse migration SQL ready
3. Plan for data restoration

## Naming convention
```
migrations/
├── 001_initial_schema.sql
├── 002_add_players_table.sql
├── 003_add_game_status_index.sql
```

## Scripts
```bash
# Setup/migrate database
node scripts/setup-database.js

# Run specific migration
./scripts/deploy-d1-schema.sh

# Backup before migration
./scripts/backup-database.sh
```

## Output
- Migration SQL
- Before/after schema diff
- Rollback plan
- Verification steps
