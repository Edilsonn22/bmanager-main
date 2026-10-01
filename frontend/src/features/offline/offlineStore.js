const DATABASE_NAME = "vendai-offline";
const DATABASE_VERSION = 1;
const SNAPSHOTS = "snapshots";
const SALES = "sales";

let databasePromise;

const abrirBase = () => {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error("O armazenamento offline não está disponível neste navegador."));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        database.createObjectStore(SNAPSHOTS, { keyPath: "scope" });
        const sales = database.createObjectStore(SALES, { keyPath: "idempotencyKey" });
        sales.createIndex("scope", "scope", { unique: false });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Feche as outras abas do sistema para ativar o armazenamento offline."));
    }).catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
};

const scopeUtilizador = (usuario) =>
  `${Number(usuario?.empresa_id)}:${Number(usuario?.id)}`;

export async function guardarSnapshotOffline(usuario, dados) {
  const database = await abrirBase();
  const transaction = database.transaction(SNAPSHOTS, "readwrite");
  transaction.objectStore(SNAPSHOTS).put({
    scope: scopeUtilizador(usuario),
    guardadoEm: Date.now(),
    ...dados,
  });
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function carregarSnapshotOffline(usuario) {
  const database = await abrirBase();
  const transaction = database.transaction(SNAPSHOTS, "readonly");
  const request = transaction.objectStore(SNAPSHOTS).get(scopeUtilizador(usuario));
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function guardarVendaOffline(usuario, venda) {
  const database = await abrirBase();
  const transaction = database.transaction(SALES, "readwrite");
  transaction.objectStore(SALES).put({
    ...venda,
    scope: scopeUtilizador(usuario),
  });
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function listarVendasOffline(usuario) {
  const database = await abrirBase();
  const transaction = database.transaction(SALES, "readonly");
  const request = transaction
    .objectStore(SALES)
    .index("scope")
    .getAll(scopeUtilizador(usuario));
  return new Promise((resolve, reject) => {
    request.onsuccess = () =>
      resolve(request.result.sort((a, b) => a.criadaEm - b.criadaEm));
    request.onerror = () => reject(request.error);
  });
}

export async function atualizarVendaOffline(idempotencyKey, alteracoes) {
  const database = await abrirBase();
  const transaction = database.transaction(SALES, "readwrite");
  const store = transaction.objectStore(SALES);
  const request = store.get(idempotencyKey);
  request.onsuccess = () => {
    if (request.result) store.put({ ...request.result, ...alteracoes });
  };
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function removerVendaOffline(idempotencyKey) {
  const database = await abrirBase();
  const transaction = database.transaction(SALES, "readwrite");
  transaction.objectStore(SALES).delete(idempotencyKey);
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export { scopeUtilizador };