# BManager

SaaS de gestão de estoque, fornecedores, movimentos, finanças e assinaturas por empresa.

## Estrutura

- `frontend/`: React + Vite.
- `API/`: API Express + MySQL.
- `bmanager.sql`: banco completo para uma instalação nova.

## Início rápido

1. Crie o banco executando `bmanager.sql`. **O arquivo remove e recria a base `bmanager`.**
2. Copie `API/.env.example` para `API/.env` e preencha as variáveis.
3. Copie `frontend/.env.example` para `frontend/.env`.
4. Instale e execute a API:

```bash
cd API
npm install
npm run dev
```

5. Em outro terminal, execute o frontend:

```bash
cd frontend
npm install
npm run dev
```

O utilizador de demonstração criado pelo schema é `edilson@gmail`, com a senha `e12345678E`.

## Banco de dados

`bmanager.sql` contém todo o schema atual e dados iniciais de planos. Para uma base já existente, aplique as migrações de `API/sql/` em ordem, incluindo `006_gestao_comercial.sql` e `007_perfil_empresa.sql`.

## Testes

```bash
cd API
npm test
npm run test:integration
```

O teste de integração cria e remove exclusivamente a base `bmanager_test`. Pode escolher outro nome com `TEST_DB_NAME`.

## Regras comerciais

- Upgrade: cria um pagamento; a mudança vale apenas quando o webhook confirma o pagamento.
- Downgrade: fica agendado para a próxima renovação e o acesso atual é preservado.
- Cancelamento: interrompe a renovação, mantendo o acesso até a data de expiração.
- Um pagamento confirmado reativa a assinatura e remove cancelamentos ou downgrades pendentes.

Veja a referência em [API/README.md](API/README.md).
