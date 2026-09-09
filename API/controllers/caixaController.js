import pool from "../config/db.js";

export async function obterCaixa(req,res){
  const [[caixa]]=await pool.query("SELECT cs.*,u.nome AS operador FROM CaixaSessao cs INNER JOIN Usuario u ON u.id=cs.usuario_id WHERE cs.empresa_id=? ORDER BY cs.id DESC LIMIT 1",[req.user.empresa_id]);
  let totais={total:0,dinheiro:0,vendas:0};
  if(caixa) [[totais]]=await pool.query("SELECT COALESCE(SUM(CASE WHEN v.estado!='cancelada' THEN p.valor ELSE 0 END),0) total, COALESCE(SUM(CASE WHEN v.estado!='cancelada' AND p.forma='dinheiro' THEN p.valor ELSE 0 END),0) dinheiro, COALESCE(SUM(v.estado!='cancelada'),0) vendas FROM Venda v INNER JOIN PagamentoVenda p ON p.venda_id=v.id WHERE v.caixa_sessao_id=?",[caixa.id]);
  res.json({sucesso:true,caixa:caixa||null,totais});
}
export async function abrirCaixa(req,res){
  const valor=Number(req.body.valor_abertura||0); if(!Number.isFinite(valor)||valor<0)return res.status(400).json({sucesso:false,erro:"Valor de abertura inválido."});
  try {
    const [[aberto]]=await pool.query("SELECT id FROM CaixaSessao WHERE empresa_id=? AND estado='aberto'",[req.user.empresa_id]); if(aberto)return res.status(409).json({sucesso:false,erro:"Já existe um caixa aberto."});
    const [result]=await pool.execute("INSERT INTO CaixaSessao (empresa_id,usuario_id,valor_abertura) VALUES (?,?,?)",[req.user.empresa_id,req.user.id,valor]); return res.status(201).json({sucesso:true,id:result.insertId});
  } catch(error) {
    if(error.code==="ER_DUP_ENTRY")return res.status(409).json({sucesso:false,erro:"Já existe um caixa aberto."});
    throw error;
  }
}
export async function fecharCaixa(req,res){
  const valor=Number(req.body.valor_fecho); if(!Number.isFinite(valor)||valor<0)return res.status(400).json({sucesso:false,erro:"Informe o valor contado no caixa."});
  const [[caixa]]=await pool.query("SELECT id, usuario_id, valor_abertura FROM CaixaSessao WHERE id=? AND empresa_id=? AND estado='aberto'",[req.params.id,req.user.empresa_id]);
  if(!caixa)return res.status(404).json({sucesso:false,erro:"Caixa aberto não encontrado."});
  if(Number(caixa.usuario_id)!==Number(req.user.id)&&!["admin","gestor"].includes(req.user.role))return res.status(403).json({sucesso:false,erro:"Apenas quem abriu o caixa, um gestor ou um administrador pode fechá-lo."});
  const [[recebimentos]]=await pool.query("SELECT COALESCE(SUM(CASE WHEN v.estado!='cancelada' AND p.forma='dinheiro' THEN p.valor ELSE 0 END),0) dinheiro FROM Venda v INNER JOIN PagamentoVenda p ON p.venda_id=v.id WHERE v.caixa_sessao_id=?",[caixa.id]);
  const esperado=Number(caixa.valor_abertura)+Number(recebimentos.dinheiro);
  await pool.execute("UPDATE CaixaSessao SET estado='fechado',valor_fecho=?,fechado_em=CURRENT_TIMESTAMP WHERE id=?",[valor,caixa.id]);
  res.json({sucesso:true,fecho:{esperado,contado:valor,diferenca:Math.round((valor-esperado)*100)/100}});
}
