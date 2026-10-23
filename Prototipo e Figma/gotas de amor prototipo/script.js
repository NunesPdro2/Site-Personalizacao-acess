// 1. DADOS: cada objeto representa um produto.
// A posição no array é usada no select do HTML: 0, 1 e 2.
let produtos = [
    { nome: "Camiseta", preco: 59.90, icone: "👕" },
    { nome: "Caneca", preco: 39.90, icone: "☕" },
    { nome: "Moletom", preco: 119.90, icone: "🧥" }
];

// O carrinho começa vazio. Os dados existem só enquanto a página está aberta.
let carrinho = [];
let numeroPedido = 0;

// 2. FUNÇÃO AUXILIAR: transforma um número em um preço com duas casas.
function formatarPreco(valor) {
    return "R$ " + valor.toFixed(2).replace(".", ",");
}

// 3. BUSCA: percorre os cartões e mostra os que contêm o nome digitado.
function buscarProdutos() {
    let busca = document.getElementById("busca").value.toLowerCase().trim();
    let cartoes = document.getElementsByClassName("produto");
    let encontrados = 0;

    for (let i = 0; i < cartoes.length; i++) {
        let nome = cartoes[i].getAttribute("data-nome");
        if (nome.includes(busca)) {
            cartoes[i].hidden = false;
            encontrados++;
        } else {
            cartoes[i].hidden = true;
        }
    }
    document.getElementById("resultado-busca").textContent = encontrados + " produto(s) encontrado(s).";
}

// 4. SELEÇÃO: coloca o produto clicado no formulário.
function escolherProduto(indice) {
    document.getElementById("produto-escolhido").value = indice;
    atualizarPrevia();
    document.getElementById("frase").focus();
}

// 5. PRÉVIA: lê os campos e altera texto, cor e ícone na página.
function atualizarPrevia() {
    let indice = Number(document.getElementById("produto-escolhido").value);
    let frase = document.getElementById("frase").value.trim();
    let cor = document.getElementById("cor").value;

    document.getElementById("nome-previa").textContent = produtos[indice].nome;
    document.getElementById("icone-previa").textContent = produtos[indice].icone;
    document.getElementById("frase-previa").style.color = cor;

    if (frase === "") {
        document.getElementById("frase-previa").textContent = "Sua frase aparece aqui";
    } else {
        document.getElementById("frase-previa").textContent = frase;
    }

    // A caneca não utiliza os tamanhos de roupa.
    document.getElementById("tamanho").disabled = indice === 1;
    // Alterar a arte exige uma nova conferência.
    document.getElementById("aprovacao").checked = false;
}

// 6. ADIÇÃO: valida os dados e guarda uma cópia da personalização no array.
function adicionarAoCarrinho() {
    let indice = Number(document.getElementById("produto-escolhido").value);
    let frase = document.getElementById("frase").value.trim();
    let quantidade = Number(document.getElementById("quantidade").value);
    let tamanho = document.getElementById("tamanho").value;
    let cor = document.getElementById("cor").value;

    if (frase === "" || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 20) {
        alert("Digite uma frase e uma quantidade inteira entre 1 e 20.");
        return;
    }
    if (!document.getElementById("aprovacao").checked) {
        alert("Confira e aprove a personalização antes de adicionar.");
        return;
    }
    if (indice === 1) {
        tamanho = "Único";
    }

    let item = {
        nome: produtos[indice].nome,
        preco: produtos[indice].preco,
        frase: frase,
        quantidade: quantidade,
        tamanho: tamanho,
        cor: cor
    };
    carrinho.push(item);
    mostrarCarrinho();
    document.getElementById("mensagem-carrinho").textContent = "Produto adicionado ao carrinho!";
}

// 7. TOTAL: soma o preço multiplicado pela quantidade de cada item.
function calcularTotal() {
    let total = 0;
    for (let i = 0; i < carrinho.length; i++) {
        total = total + carrinho[i].preco * carrinho[i].quantidade;
    }
    return total;
}

// 8. EXIBIÇÃO: cria uma linha e um botão de remover para cada item.
function mostrarCarrinho() {
    let lista = document.getElementById("lista-carrinho");
    lista.textContent = "";

    if (carrinho.length === 0) {
        let linhaVazia = document.createElement("li");
        linhaVazia.textContent = "Seu carrinho está vazio.";
        lista.appendChild(linhaVazia);
    }

    for (let i = 0; i < carrinho.length; i++) {
        let item = carrinho[i];
        let linha = document.createElement("li");
        let botao = document.createElement("button");

        linha.textContent = item.quantidade + " x " + item.nome + " | Tamanho: " + item.tamanho
            + " | Frase: " + item.frase + " | " + formatarPreco(item.preco * item.quantidade);
        linha.style.color = item.cor;
        botao.textContent = "Remover";
        botao.type = "button";
        botao.onclick = function () {
            removerItem(i);
        };
        linha.appendChild(botao);
        lista.appendChild(linha);
    }
    document.getElementById("total").textContent = "Total: " + formatarPreco(calcularTotal());
}

// 9. REMOÇÃO: splice remove um item a partir da posição indicada.
function removerItem(indice) {
    carrinho.splice(indice, 1);
    mostrarCarrinho();
}

// 10. FINALIZAÇÃO: apenas exibe uma confirmação; não realiza uma compra real.
function finalizarPedido() {
    let nome = document.getElementById("nome-cliente").value.trim();
    let pagamento = document.getElementById("pagamento").value;

    if (carrinho.length === 0) {
        alert("Adicione um produto ao carrinho primeiro.");
        return;
    }
    if (nome === "") {
        alert("Digite um nome para o pedido.");
        return;
    }

    numeroPedido++;
    document.getElementById("pedido-finalizado").textContent = "Pedido de teste nº " + numeroPedido
        + " recebido! Cliente: " + nome + ". Total: " + formatarPreco(calcularTotal())
        + ". Pagamento escolhido: " + pagamento + ". Retirada na loja. Nenhuma cobrança foi feita.";
    carrinho = [];
    mostrarCarrinho();
    document.getElementById("mensagem-carrinho").textContent = "";
}

// Executadas uma vez, quando a página termina de carregar.
atualizarPrevia();
mostrarCarrinho();
