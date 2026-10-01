import { ImagePlus, Trash2 } from "lucide-react";
import { otimizarImagemProduto } from "../../utils/productImage";

export function ProductImageField({ preview, onChange, onRemove, onError, disabled = false, className = "sm:col-span-2" }) {
  const selecionar = async (evento) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    try {
      onChange(await otimizarImagemProduto(arquivo));
    } catch (error) {
      onError?.(error.message);
    }
  };

  return (
    <div className={className}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">Fotografia do produto</span>
      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 min-[420px]:flex-row min-[420px]:items-center">
        <div className="grid aspect-square w-full shrink-0 place-items-center overflow-hidden rounded-xl bg-white text-slate-300 ring-1 ring-slate-200 min-[420px]:size-24">
          {preview ? <img src={preview} alt="Pré-visualização do produto" className="h-full w-full object-contain p-1" /> : <ImagePlus size={30} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">Adicione uma imagem clara do produto</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">JPEG, PNG ou WebP. A imagem será otimizada automaticamente.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 ${disabled ? "pointer-events-none opacity-50" : ""}`}>
              <ImagePlus size={15} /> {preview ? "Trocar imagem" : "Escolher imagem"}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selecionar} disabled={disabled} className="sr-only" />
            </label>
            {preview && (
              <button type="button" onClick={onRemove} disabled={disabled} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                <Trash2 size={15} /> Remover
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
