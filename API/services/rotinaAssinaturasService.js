import pool from "../config/db.js";
import { criarAvisosDeExpiracao, criarNotificacao } from "./notificacaoService.js";

const dataHora = (valor) => new Date(valor).toLocaleString("pt-PT");

export const processarRotinaAssinaturas = async () => {
  const resumo = { avisos: 0, cancelamentos: 0, downgrades: 0, expiradas: 0 };

  // Os avisos são idempotentes por empresa/dia no notificacaoService.
  resumo.avisos = await criarAvisosDeExpiracao();

  // Cancelamento agendado tem precedência sobre um eventual downgrade pendente.
  const [cancelamentos] = await pool.query(
    `SELECT id, empresa_id, expira_em FROM assinaturas
     WHERE estado = 'ativa' AND cancelamento_agendado_em IS NOT NULL
       AND cancelamento_agendado_em <= NOW()`,
  );
  for (const assinatura of cancelamentos) {
    const [resultado] = await pool.execute(
      `UPDATE assinaturas SET estado = 'cancelada', plano_pendente_id = NULL
       WHERE id = ? AND estado = 'ativa' AND cancelamento_agendado_em <= NOW()`,
      [assinatura.id],
    );
    if (!resultado.affectedRows) continue;
    resumo.cancelamentos += 1;
    await criarNotificacao({
      empresaId: assinatura.empresa_id,
      tipo: "assinatura_cancelada",
      titulo: "Assinatura cancelada",
      mensagem: `A assinatura terminou em ${dataHora(assinatura.expira_em)} conforme o cancelamento agendado.`,
    });
  }

  // Sem cobrança recorrente, o downgrade entra em vigor ao término do ciclo
  // e a empresa renova/paga já com o plano novo.
  const [downgrades] = await pool.query(
    `SELECT a.id, a.empresa_id, p.nome AS plano_nome
     FROM assinaturas a INNER JOIN planos p ON p.id = a.plano_pendente_id
     WHERE a.estado = 'ativa' AND a.plano_pendente_id IS NOT NULL
       AND a.cancelamento_agendado_em IS NULL
       AND a.expira_em IS NOT NULL AND a.expira_em <= NOW()`,
  );
  for (const assinatura of downgrades) {
    const [resultado] = await pool.execute(
      `UPDATE assinaturas SET plano_id = plano_pendente_id, plano_pendente_id = NULL
       WHERE id = ? AND estado = 'ativa' AND plano_pendente_id IS NOT NULL
         AND cancelamento_agendado_em IS NULL AND expira_em <= NOW()`,
      [assinatura.id],
    );
    if (!resultado.affectedRows) continue;
    resumo.downgrades += 1;
    await criarNotificacao({
      empresaId: assinatura.empresa_id,
      tipo: "downgrade_aplicado",
      titulo: "Alteração de plano aplicada",
      mensagem: `O plano ${assinatura.plano_nome} foi aplicado para a próxima renovação.`,
    });
  }

  const [expiracao] = await pool.execute(
    `UPDATE assinaturas SET estado = 'expirada'
     WHERE estado = 'ativa' AND expira_em IS NOT NULL AND expira_em <= NOW()`,
  );
  resumo.expiradas = expiracao.affectedRows;
  return resumo;
};

export const agendarRotinaAssinaturas = () => {
  if (process.env.NODE_ENV === "test" || process.env.ASSINATURAS_JOB_ATIVO === "false") return null;
  const hora = Number(process.env.ASSINATURAS_JOB_HORA || 3);
  const horaValida = Number.isInteger(hora) && hora >= 0 && hora <= 23 ? hora : 3;
  const proxima = new Date();
  proxima.setHours(horaValida, 0, 0, 0);
  if (proxima <= new Date()) proxima.setDate(proxima.getDate() + 1);

  const executar = () => processarRotinaAssinaturas()
    .then((resumo) => console.info("Rotina diária de assinaturas concluída:", resumo))
    .catch((erro) => console.error("Erro na rotina diária de assinaturas:", erro));
  const temporizador = setTimeout(() => {
    executar();
    setInterval(executar, 24 * 60 * 60 * 1000);
  }, proxima.getTime() - Date.now());
  return temporizador;
};
