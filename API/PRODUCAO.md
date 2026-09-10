# Preparação para produção

1. Defina `NODE_ENV=production`, um `JWT_SECRET` longo, `DEBITO_API_TOKEN`, `DEBITO_MERCHANT_ID`, `DEBITO_WALLET_CODE`, `CLIENT_URL` e `PLATFORM_ADMIN_EMAILS` no ambiente de produção. Nunca envie o arquivo `.env` ao Git.
2. Publique a API atrás de um proxy HTTPS (Nginx, Caddy ou provedor de cloud) e configure o callback público quando o provedor o exigir.
3. Agende backups diários do MySQL e teste regularmente a restauração:

```powershell
mysqldump -u $env:DB_USER -p$env:DB_PASSWORD $env:DB_NAME > backup-$(Get-Date -Format yyyy-MM-dd).sql
```

4. Ative `ASSINATURAS_JOB_ATIVO=true` e escolha `ASSINATURAS_JOB_HORA` (por padrão, 03:00). Em ambientes que não mantêm a API ativa continuamente, agende `npm run processar-assinaturas` uma vez por dia.
5. Integre um serviço de e-mail antes de produção. Em desenvolvimento, o token de recuperação aparece apenas no log da API; em produção não é entregue por log.
6. Antes do lançamento, valide: acesso sem JWT (401), acesso de outro utilizador/empresa (403/404), assinatura expirada (402), limites do plano (403), webhook sem assinatura (401) e recuperação de senha expirada (400).

## Atualizações do banco

- Instalação nova: importe `bmanager.sql` e execute uma vez `npm run migrate:baseline`.
- Atualização: crie o backup, execute `npm run migrate:status` e depois `npm run migrate` antes de iniciar a nova API.
- Nunca execute `bmanager.sql` sobre uma base existente: ele remove e recria o banco.
- Se o deploy falhar após uma migração, mantenha a API anterior e restaure o backup somente após confirmar que uma migração corretiva não é suficiente.
