(async () => {
  const headerElement = document.getElementById("header");

  // Caminhos relativos a /home/
  const htmlPath = "/src/item/item.html";
  const cssPath = "/src/item/item.css";

  // Carrega e insere o CSS
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = cssPath;
  document.head.appendChild(link);

  // Carrega e insere o HTML
  const response = await fetch(htmlPath);
  const html = await response.text();

})();
async function renderItemsFromArray(array) {
  const main = document.getElementById('main-content');
  main.innerHTML = ''; // limpa conteúdo anterior

  // Pré-carrega o HTML do item uma vez
  const res = await fetch('/src/item/item.html');
  const html = await res.text();

  array.forEach(item => {
    // Cria um elemento temporário para manipular o HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Preenche os dados do item nos <strong> correspondentes
    tempDiv.querySelector('.item-nome strong').textContent = item.nome;
    tempDiv.querySelector('.item-entradas strong').textContent = "+ " + Number(item.entradas).toFixed(2);
    tempDiv.querySelector('.item-saidas strong').textContent = "- " + Number(item.saidas).toFixed(2);

    // Adiciona ao main
    main.appendChild(tempDiv.firstElementChild);
  });

  return Array.from(main.children);
}

async function renderTransactionsFromArray(array) {
  const main = document.getElementById('main-content');
  main.innerHTML = ''; // limpa conteúdo anterior

  // Pré-carrega o HTML da transação uma vez
  const res = await fetch('/src/item/transaction.html');
  const html = await res.text();

  array.forEach(transacao => {
    // Cria um elemento temporário para manipular o HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const transactionEl = tempDiv.firstElementChild;

    // Preenche os dados
    transactionEl.querySelector('.transaction-name').textContent = transacao.nome || 'Desconhecido';
    transactionEl.querySelector('.transaction-amount').textContent = `${transacao.perda ? '- ' : '+ '}R$ ${transacao.valor.toFixed(2)}`;
    transactionEl.querySelector('.transaction-amount').classList.add(transacao.perda ? 'saida' : 'entrada');

    // Define imagem com base no tipo
    const imgEl = transactionEl.querySelector('.transaction-type img');
    if (transacao.tipo === 'pix') {
      imgEl.src = '/src/img/logo-pix.png';
      imgEl.alt = 'Pix';
    }
    // Você pode adicionar outros tipos aqui:
    // else if (transacao.tipo === 'debito') {
    //   imgEl.src = '/src/img/logo-debito.png';
    //   imgEl.alt = 'Débito';
    // }

    // Adiciona ao DOM
    main.appendChild(transactionEl);
  });

  return Array.from(main.children);
}
