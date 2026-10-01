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

## Vendas offline

- O uso offline exige HTTPS (exceto localhost), uma sessão ainda válida e que a página de nova venda tenha carregado os produtos, clientes, categorias e estado do caixa enquanto havia ligação.
- Vendas offline aceitam qualquer método de pagamento e ficam guardadas no IndexedDB até a API confirmar a sincronização. O sistema regista o método escolhido, mas não confirma pagamentos externos (M-Pesa, e-Mola ou cartão) sem ligação; valide-os diretamente no respetivo serviço. Não limpe os dados do navegador enquanto houver vendas pendentes.
- Divergências de stock, preço ou estado do caixa ficam para revisão de um administrador/gestor na página de vendas; confirme os dados antes de reprocessar.
- Atualize o banco com `npm run migrate` antes de publicar a API que suporta a fila offline.

## Atualizações do banco

- Instalação nova: importe `bmanager.sql` e execute uma vez `npm run migrate:baseline`.
- Atualização: crie o backup, execute `npm run migrate:status` e depois `npm run migrate` antes de iniciar a nova API.
- Nunca execute `bmanager.sql` sobre uma base existente: ele remove e recria o banco.
- Se o deploy falhar após uma migração, mantenha a API anterior e restaure o backup somente após confirmar que uma migração corretiva não é suficiente.

## Railway

- Configure o serviço da API com `Root Directory` igual a `API` e use o Dockerfile dessa pasta.
- `railway.json` define `npm run migrate` como `preDeployCommand`. O Railway só inicia a nova versão quando a migração termina com sucesso.
- Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` como referências às variáveis do serviço MySQL Railway. A API não lê automaticamente os nomes `MYSQLHOST`/`MYSQLUSER`.
- Faça backup antes do primeiro deploy com migrações automáticas e confirme nos logs que `npm run migrate` terminou sem erro.
