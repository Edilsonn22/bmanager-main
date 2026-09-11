import express from "express";
import cors from "cors";
import produtoRoutes from "./routes/produtoRoutes.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";
import fornecedorRoutes from "./routes/fornecedorRoutes.js";
import movimentoRoutes from "./routes/movimentoRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import financeiroRoutes from "./routes/financeiroRoutes.js";
import pagamentoRoutes from "./routes/pagamentoRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import planosRoutes from "./routes/planosRoutes.js";
import assinaturaRoutes from "./routes/assinaturaRoutes.js";
import historicoPagamentoRoutes from "./routes/historicoPagamentoRoutes.js";
import notificacaoRoutes from "./routes/notificacaoRoutes.js";
import plataformaRoutes from "./routes/plataformaRoutes.js";
import suporteRoutes from "./routes/suporteRoutes.js";
import vendaRoutes from "./routes/vendaRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import caixaRoutes from "./routes/caixaRoutes.js";
import scannerRoutes from "./routes/scannerRoutes.js";
import dotenv from "dotenv";
import helmet from "helmet";
import { validarCorpoJson } from "./middlewares/validation.js";
import { agendarRotinaAssinaturas } from "./services/rotinaAssinaturasService.js";
import pool from "./config/db.js";
import { validarAmbienteProducao } from "./config/validarAmbiente.js";

dotenv.config();

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
  // Registre antes do express.json para preservar o corpo assinado do webhook.
  app.use("/api/webhooks", webhookRoutes);
  app.use(express.json({ limit: "100kb" }));
  app.use(validarCorpoJson);

  app.get("/api/health", (_req, res) => res.json({ status: "ok", uptime: Math.round(process.uptime()) }));
  app.get("/api/ready", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ready", database: "connected" });
    } catch {
      res.status(503).json({ status: "unavailable", database: "disconnected" });
    }
  });
  app.use("/api/auth", authRoutes);
  app.use("/api/financeiro", financeiroRoutes);
  app.use("/api/pagamentos", pagamentoRoutes);
  app.use("/api/planos", planosRoutes);
  app.use("/api/assinaturas", assinaturaRoutes);
  app.use("/api/historico-pagamentos", historicoPagamentoRoutes);
  app.use("/api/notificacoes", notificacaoRoutes);
  app.use("/api/plataforma", plataformaRoutes);
  app.use("/api/suporte", suporteRoutes);
  app.use("/api/produtos", produtoRoutes);
  app.use("/api/categorias", categoriaRoutes);
  app.use("/api/fornecedores", fornecedorRoutes);
  app.use("/api/movimentos", movimentoRoutes);
  app.use("/api/vendas", vendaRoutes);
  app.use("/api/clientes", clienteRoutes);
  app.use("/api/caixa", caixaRoutes);
  app.use("/api/scanner", scannerRoutes);

  app.use((error, _req, res, _next) => {
    console.error("Erro não tratado na API:", error);
    res.status(500).json({
      message: "Ocorreu um erro interno ao processar a solicitação.",
    });
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  validarAmbienteProducao();
  const port = process.env.PORT || 3000;
  const server = createApp().listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
  agendarRotinaAssinaturas();

  const encerrar = (signal) => {
    console.log(`${signal} recebido. A encerrar servidor...`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once("SIGTERM", () => encerrar("SIGTERM"));
  process.once("SIGINT", () => encerrar("SIGINT"));
}


