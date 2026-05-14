# Import Staging Production Deploy SOP

## Preconditions

- Confirm current commit is deployed to `/opt/yzschros`.
- Confirm Postgres backup exists under `/opt/yzschros/backups`.
- Confirm API and worker are healthy before migration.

## Apply SQL Migration

Run on ECS:

```bash
cd /opt/yzschros
docker compose --env-file .env -f deploy/docker-compose.prod.yml exec -T postgres \
  psql -U yzschros -d yzschros -f /opt/yzschros/apps/api/src/migrations/004-import-staging.sql
```

## Restart Services

```bash
pm2 restart yzschros-api
```

Run on Mac mini:

```bash
cd /Users/lee/yzschros
pnpm --filter @yzschros/api build
pm2 restart yzschros-worker --update-env
pm2 save
```

## Verify

```bash
ssh root@47.97.62.57 'cd /opt/yzschros && curl -sS http://127.0.0.1:3001/api'
ssh -i ~/.ssh/id_rsa lee@192.168.3.47 'zsh -lc "export PATH=/usr/local/bin:/opt/homebrew/bin:/Users/lee/.npm-global/bin:/usr/bin:/bin:/usr/sbin:/sbin; pm2 status yzschros-worker"'
```
