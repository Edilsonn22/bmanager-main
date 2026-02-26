

export async function deletarProduto(id) {
    const response = await fetch(
        "http://localhost/bmanager/backend/produto/deletar.php",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        }
    );
    return await response.json();
}

export async function atualizarProduto(id, dados) {

    const response = await fetch(
      "http://localhost/bmanager/backend/produto/editar.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({id, ...dados}),
      }
    );
    return await response.json();
}



  
