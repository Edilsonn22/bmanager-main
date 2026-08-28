import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const pastas = [
  resolve("controllers"), resolve("middlewares"), resolve("routes"), resolve("services"), resolve("src"),
  resolve("../frontend/src"),
];
const padraoQuebrado = /(?:Ã[\u0080-\u00BF]|Â[\u0080-\u00BF]|�)/u;

const listarArquivos = async (pasta) => {
  const entradas = await readdir(pasta, { withFileTypes: true });
  const grupos = await Promise.all(entradas.map((entrada) => (
    entrada.isDirectory() ? listarArquivos(join(pasta, entrada.name)) : [join(pasta, entrada.name)]
  )));
  return grupos.flat().filter((arquivo) => /\.[cm]?[jt]sx?$/.test(arquivo));
};

const arquivos = (await Promise.all(pastas.map(listarArquivos))).flat();
const quebrados = [];
for (const arquivo of arquivos) {
  const texto = await readFile(arquivo, "utf8");
  if (padraoQuebrado.test(texto)) quebrados.push(arquivo);
}

if (quebrados.length) {
  console.error("Foram encontrados textos com codificação quebrada:\n" + quebrados.join("\n"));
  process.exitCode = 1;
} else {
  console.info("Codificação UTF-8 validada.");
}
