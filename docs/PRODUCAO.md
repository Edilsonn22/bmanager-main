# Preparação para produção

## Arquitetura recomendada

- Frontend React servido por CDN ou pelo `frontend/Dockerfile`.
- API Node executada com pelo menos uma instância e verificação em `/api/ready`.
- MySQL gerenciado, privado e com backups automáticos.
- HTTPS obrigatório no domínio público.

## Ordem de implantação

1. Criar o MySQL e um utilizador exclusivo com acesso somente ao banco da aplicação.
2. Restaurar o esquema inicial em instalações novas e executar o baseline conforme `API/README.md`.
3. Em atualizações, executar `npm run migrate` na API antes de trocar a versão em execução.
4. Configurar as variáveis usando `API/.env.example`, com valores reais no painel secreto da hospedagem.
5. Construir o frontend com `VITE_API_URL=https://api.seu-dominio.com/api`.
6. Publicar a API e validar `GET /api/health` e `GET /api/ready`.
7. Publicar o frontend e executar o roteiro de homologação abaixo.

Nunca copie `API/.env` para imagens Docker nem grave credenciais no Git.

## Backups

- Ativar backup automático diário do MySQL no provedor.
- Reter pelo menos 7 backups diários e 4 semanais.
- Guardar uma cópia em região ou armazenamento diferente do banco principal.
- Criptografar os backups e limitar o acesso aos administradores responsáveis.
- Fazer trimestralmente um teste de restauração em banco isolado. Backup não testado não é garantia de recuperação.

## Monitorização

- Monitorar `/api/ready` a cada minuto.
- Alertar para respostas 5xx, indisponibilidade do banco e aumento de latência.
- Centralizar logs da API sem registrar senhas, tokens, cabeçalhos de autorização ou dados completos de pagamento.
- Acompanhar utilização de CPU, memória, conexões MySQL e espaço em disco.

## Roteiro de homologação comercial

1. Criar empresa e utilizadores com papéis diferentes.
2. Cadastrar categoria, fornecedor e produto.
3. Confirmar que uma venda sem caixa aberto é recusada.
4. Abrir o caixa e realizar vendas em dinheiro e métodos digitais.
5. Testar cliente cadastrado, cliente avulso e consumidor final.
6. Conferir redução de stock, histórico, financeiro e comprovativo.
7. Testar devolução parcial, devolução total e cancelamento.
8. Conferir reposição do stock e valores do caixa.
9. Fechar o caixa e conferir o valor esperado, contado e a diferença.
10. Imprimir comprovativos A4/PDF e térmico 80 mm com nomes e listas longas.

## Pendências externas antes do lançamento público

- Validar os documentos e requisitos fiscais com um contabilista ou especialista local.
- Testar o recibo numa impressora térmica física.
- Definir termos de uso, política de privacidade, retenção de dados e canal de suporte.
- Configurar domínio, DNS, HTTPS e o serviço de hospedagem escolhido.
- Gateway de pagamento e entrega de e-mail permanecem deliberadamente fora deste ciclo.
