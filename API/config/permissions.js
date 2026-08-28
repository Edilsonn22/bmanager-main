export const MODULOS = {
  estoque: ["admin", "gestor", "operador"],
  financeiro: ["admin", "gestor"],
  relatorios: ["admin", "gestor"],
  administracao: ["admin"],
};

export const temPermissaoNoModulo = (role, modulo) =>
  Boolean(MODULOS[modulo]?.includes(role));
