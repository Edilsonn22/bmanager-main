

import { API_URL } from "../api/authenticatedFetch.js";

export async function deletarProduto(id) {
    const response = await fetch(`${API_URL}/produtos/${id}`, { method: "DELETE" });
    return response.json();
}

export async function atualizarProduto(id, dados) {

    const response = await fetch(`${API_URL}/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(dados),
    });
    return response.json();
}



  
