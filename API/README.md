# API Vendai

Base local: `http://localhost:3000/api`. As rotas protegidas exigem `Authorization: Bearer <token>`.

## Configuração

Copie `.env.example` para `.env` e configure banco, JWT, e-mail e Débito. Em produção, use um `JWT_SECRET` longo e HTTPS.

Para e-mail transacional, configure `RESEND_API_KEY` e `EMAIL_FROM` com um domínio validado no Resend. A API envia boas-vindas, recuperação de senha, confirmação de pagamento e avisos de expiração. Sem essas variáveis, o e-mail é apenas registado como não configurado e os fluxos principais continuam a funcionar.

```bash
npm install
npm run dev
```

## Qualidade e publicação

```bash
npm run check:encoding
npm test
npm run test:integration
```

O workflow [CI/CD](../.github/workflows/ci-cd.yml) executa estas verificações com MySQL e também gera o build do frontend em cada pull request e push para `main`. Para publicar automaticamente após a aprovação, configure o secret `DEPLOY_WEBHOOK_URL` no repositório com o webhook do seu provedor de hospedagem.

## Migrações do banco

Para uma base existente que já possui o esquema atual, registre o estado inicial uma única vez:

```bash
npm run migrate:baseline
```

O baseline valida as tabelas e colunas esperadas e não executa os arquivos SQL. Depois, consulte e aplique apenas migrações novas com:

```bash
npm run migrate:status
npm run migrate
```

O controle fica na tabela `schema_migrations`. Uma migração aplicada nunca deve ser editada; crie sempre um novo arquivo numerado em `sql/`. Faça backup antes de migrar uma base de produção. O arquivo `bmanager.sql` é exclusivo para instalações novas e testes, pois remove e recria a base.

## Autenticação

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/auth/register` | Cria empresa, administrador e assinatura de teste. |
| POST | `/auth/login` | Retorna `token` e utilizador. |
| GET | `/auth/perfil` | Retorna dados do utilizador autenticado. |
| GET | `/auth/minha-conta` | Retorna perfil e dados legais da empresa. |
| PUT | `/auth/perfil` | Atualiza nome e e-mail do utilizador. |
| PUT | `/auth/senha` | Altera senha. Campos: `senhaAtual`, `novaSenha`. |
| PUT | `/auth/empresa` | Atualiza empresa; somente `admin`. |
| POST | `/auth/recuperar-senha` | Solicita recuperação de senha. |
| POST | `/auth/redefinir-senha` | Redefine senha usando o token recebido. |
| GET/POST | `/auth/usuarios` | Lista/cria utilizadores da empresa; somente `admin`. |

Exemplo de login:

```json
POST /api/auth/login
{ "email": "edilson@gmail", "senha": "e12345678E" }
```

## Operação

| Recurso | Rotas |
| --- | --- |
| Produtos | `GET, POST /produtos`; `GET, PUT, DELETE /produtos/:id` |
| Categorias | `GET, POST /categorias`; `PUT, DELETE /categorias/:id` |
| Fornecedores | `GET, POST /fornecedores`; `PUT, DELETE /fornecedores/:id` |
| Movimentos | `GET, POST /movimentos` |
| Financeiro | `GET /financeiro/resumo` |
| Notificações | `GET /notificacoes`; `POST /notificacoes/:id/lida` |
| Suporte | `POST, GET /suporte/tickets` |

Todas as consultas são isoladas por `empresa_id`; nunca envie esse campo a partir do frontend.

## Comercial

| Método | Rota | Regra |
| --- | --- | --- |
| GET | `/planos` | Lista planos ativos. |
| GET | `/assinaturas/minha` | Plano atual, expiração e alterações agendadas. |
| POST | `/pagamentos` | Inicia cobrança Débito C2B. Campos: `planoId`, `method` (`mpesa` ou `emola`) e `phone`. |
| GET | `/pagamentos/:id` | Consulta a transação Débito e reconcilia o estado local. |
| POST | `/assinaturas/downgrade` | Agenda plano mais barato para a próxima renovação. |
| POST | `/assinaturas/cancelar` | Cancela a renovação, sem remover o acesso do período pago. |
| POST | `/assinaturas/reativar` | Desfaz o cancelamento agendado. |
| GET | `/historico-pagamentos` | Lista pagamentos da empresa. |
| GET | `/historico-pagamentos/:id/fatura` | Dados da fatura da empresa autenticada. |
| POST | `/webhooks/debito` | Webhook público; valida HMAC SHA-256 no cabeçalho `x-debitopay-signature`. |

Um upgrade ou renovação é confirmado apenas pelo webhook `payment.success`. Não marque pagamentos como pagos pelo frontend.

## Rotina diária de assinaturas

Com `ASSINATURAS_JOB_ATIVO=true`, a API executa a rotina todos os dias à hora definida por `ASSINATURAS_JOB_HORA` (padrão: `3`). Ela envia avisos de expiração, aplica downgrades pendentes ao terminar o ciclo e marca assinaturas vencidas; cancelamentos agendados tornam-se `cancelada` no fim do período.

Para executar manualmente, por exemplo em testes ou num agendador externo:

```bash
npm run processar-assinaturas
```

`POST /notificacoes/admin/processar-avisos` continua disponível para o administrador da plataforma e processa a rotina completa.

## Faturas e dados legais

A fatura é consultada em `GET /historico-pagamentos/:id/fatura` e o frontend gera o PDF. O número fiscal estável segue o formato `BM-ANO-000001`. Preencha nome, NUIT, e-mail, telefone e endereço em **Perfil e empresa** para que apareçam no documento.

Em uma base existente, aplique `sql/007_perfil_empresa.sql` antes de usar esses campos.

Para ativar os estados completos das solicitações de suporte, execute `node scripts/aplicarMigracaoSuporte.js`.

## Permissões e respostas

- `admin`: administra utilizadores e pode excluir recursos.
- `gestor`: cria e edita recursos operacionais.
- `operador`: consulta estoque e registra movimentos.
- `platform_owner`: administra planos e empresas da plataforma.

Erros seguem `{ "sucesso": false, "erro": "..." }` em rotas de domínio ou `{ "message": "..." }` em autenticação. Os principais estados HTTP são `401` (sessão), `403` (permissão), `402` (assinatura inativa), `404` e `409`.
