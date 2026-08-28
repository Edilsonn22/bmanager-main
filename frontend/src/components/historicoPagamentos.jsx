import { useEffect, useState } from "react";
import { API_URL } from "../api/authenticatedFetch";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function HistoricoPagamentos() {
  const [pagamentos, setPagamentos] = useState([]);
  const [fatura, setFatura] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/historico-pagamentos`).then(async (resposta) => {
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar o histórico.");
      setPagamentos(dados.pagamentos || []);
    }).catch((error) => setErro(error.message));
  }, []);

  const verFatura = async (id) => {
    setErro("");
    try {
      const resposta = await fetch(`${API_URL}/historico-pagamentos/${id}/fatura`);
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar a fatura.");
      setFatura(dados.fatura);
    } catch (error) {
      setErro(error.message);
    }
  };

  const baixarPdf = () => {
    if (!fatura) return;
    const doc = new jsPDF();
    doc.setFillColor(79, 70, 229); doc.roundedRect(14, 12, 24, 24, 4, 4, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.text("BM", 18, 28);
    doc.setTextColor(15, 23, 42); doc.setFontSize(20); doc.text("FATURA", 45, 22);
    doc.setFontSize(10); doc.text(`Nº fiscal: ${fatura.numero_fiscal}`, 45, 30);
    doc.text(`Emitida em: ${new Date(fatura.created_at).toLocaleDateString("pt-MZ")}`, 45, 36);
    doc.setFontSize(11); doc.text("Emitente", 14, 52); doc.setFontSize(10);
    doc.text([fatura.empresa_nome, fatura.empresa_nuit ? `NUIT: ${fatura.empresa_nuit}` : "NUIT: não informado", fatura.empresa_endereco || "Endereço não informado", fatura.empresa_email || ""], 14, 59);
    autoTable(doc, { startY: 90, margin: { left: 14, right: 14 }, tableWidth: 182, head: [["Descrição", "Referência", "Total"]], body: [[`Assinatura ${fatura.plano_nome}`, fatura.referencia, `${fatura.valor} ${fatura.moeda}`]], theme: "grid", styles: { fontSize: 9, overflow: "linebreak" }, headStyles: { fillColor: [79, 70, 229] }, columnStyles: { 0: { cellWidth: 78 }, 1: { cellWidth: 64 }, 2: { cellWidth: 40, halign: "right" } } });
    const y = doc.lastAutoTable.finalY + 14; doc.setFontSize(12); doc.text(`Total pago: ${fatura.valor} ${fatura.moeda}`, 196, y, { align: "right" });
    doc.setFontSize(9); doc.text(`Transação: ${fatura.transaction_id || "Pendente"}`, 14, y + 16);
    doc.text("Documento gerado eletronicamente pela Vendai.", 14, 280);
    doc.save(`Fatura-${fatura.numero_fiscal}.pdf`);
  };

  return <main className="flex-1 overflow-auto p-7">
    <h1 className="text-2xl font-bold">Histórico de pagamentos</h1>
    {erro && <p className="mt-4 rounded bg-red-50 p-3 text-red-700">{erro}</p>}
    <div className="mt-6 overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Referência</th><th className="p-3">Plano</th><th className="p-3">Valor</th><th className="p-3">Estado</th><th className="p-3">Fatura</th></tr></thead><tbody>{pagamentos.map((pagamento) => <tr key={pagamento.id} className="border-b"><td className="p-3">{pagamento.referencia}</td><td className="p-3">{pagamento.plano_nome}</td><td className="p-3">{pagamento.valor} {pagamento.moeda}</td><td className="p-3 capitalize">{pagamento.estado}</td><td className="p-3"><button type="button" onClick={() => verFatura(pagamento.id)} className="text-indigo-600 underline">Ver fatura</button></td></tr>)}</tbody></table></div>
    {fatura && <section className="mt-6 max-w-xl rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Fatura {fatura.numero_fiscal}</h2><button type="button" onClick={baixarPdf} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Baixar PDF</button></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><dt>Empresa</dt><dd>{fatura.empresa_nome}</dd><dt>NUIT</dt><dd>{fatura.empresa_nuit || "Não informado"}</dd><dt>Plano</dt><dd>{fatura.plano_nome}</dd><dt>Referência</dt><dd>{fatura.referencia}</dd><dt>Estado</dt><dd className="capitalize">{fatura.estado}</dd><dt>Transação</dt><dd>{fatura.transaction_id || "-"}</dd><dt>Total</dt><dd className="font-bold">{fatura.valor} {fatura.moeda}</dd></dl></section>}
  </main>;
}
