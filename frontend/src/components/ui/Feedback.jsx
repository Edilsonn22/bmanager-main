import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const estilos = {
  erro: "border-red-200 bg-red-50 text-red-800",
  sucesso: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

const icones = { erro: AlertCircle, sucesso: CheckCircle2, info: Info };

export function Feedback({ tipo = "info", children, onClose, className = "" }) {
  if (!children) return null;
  const Icon = icones[tipo] || Info;
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      aria-live="polite"
      className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${estilos[tipo]} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar mensagem"
          className="rounded p-0.5 hover:bg-black/5"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  confirmarLabel = "Excluir",
  ocupada = false,
  onConfirmar,
  onCancelar,
}) {
  if (!aberto) return null;
  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/50 p-4"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 id="confirm-title" className="text-lg font-bold text-slate-900">
          {titulo}
        </h2>
        <p
          id="confirm-description"
          className="mt-2 text-sm leading-6 text-slate-600"
        >
          {descricao}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancelar}
            disabled={ocupada}
            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={ocupada}
            autoFocus
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {ocupada ? "A processar..." : confirmarLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
