export const permissoesPorModulo = {
  estoque: ["admin", "gestor", "operador"],
  financeiro: ["admin", "gestor"],
  relatorios: ["admin", "gestor"],
  administracao: ["admin"],
};

export const podeAceder = (role, modulo) => Boolean(permissoesPorModulo[modulo]?.includes(role));
