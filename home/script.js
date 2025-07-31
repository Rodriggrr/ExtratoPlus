const entries = [];
const transacoesPix = new Map();
const transacoesDebito = new Map();
const transacoesCredito = [];

window.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');

  const items = document.querySelectorAll('.day-title');
  items.forEach(item => handleItemClick(item));

  // Espera o conteúdo do header ser carregado
  const observer = new MutationObserver(() => {
    const dropArea = document.getElementById('drop-label');
    const fileInput = document.getElementById('upload');
    document.getElementById('upload').addEventListener('change', handleFile);


    if (!dropArea || !fileInput) return;

    // Já existe, podemos parar de observar
    observer.disconnect();

    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.classList.add('dragover');
    });

    dropArea.addEventListener('dragleave', () => {
      dropArea.classList.remove('dragover');
    });

    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.classList.remove('dragover');

      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;

        // Dispara evento manualmente
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
        console.log('Arquivo arrastado e solto:', fileInput.files[0].name);
      }
    });
  });



  observer.observe(header, { childList: true, subtree: true });
  

});


function handleItemClick(item) {
  const parent = item.parentElement;
  parent.addEventListener('click', () => {
    parent.classList.toggle('expanded');
    const biChild = item.querySelector('.bi');
    if (biChild) {
      biChild.classList.toggle('rotated');
    }
  });
}

async function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const strings = content.items.map(item => item.str);
    const pageText = strings.join(' ').replace(/\s+/g, ' ').trim();

    const dateRegex = /\d{2} [a-zA-Z]{3} \d{4}/g;
    const matches = [];
    let match;
    let lastIndex = 0;
    let lastDate = null;

    while ((match = dateRegex.exec(pageText)) !== null) {
      if (lastDate !== null) {
        const entryText = pageText.slice(lastIndex, match.index).trim();
        if (entryText) matches.push(`${lastDate}\n${entryText}`);
      }
      lastDate = match[0];
      lastIndex = match.index + match[0].length;
    }

    if (lastDate && lastIndex < pageText.length) {
      const entryText = pageText.slice(lastIndex).trim();
      if (entryText) matches.push(`${lastDate}\n${entryText}`);
    }

    if (matches.length) {
      entries.push(...matches);
      fullText += matches.join('\n\n') + '\n\n';
    }
  }

  const dias = separarPorValor(fullText);
  renderItemsFromPDF();
}

async function renderItemsFromPDF() {
  const main = document.getElementById('main-content');
  main.innerHTML = ''; // limpa conteúdo anterior

  // Carrega os templates HTML
  const [itemHTML, transactionHTML] = await Promise.all([
    fetch('/src/item/item.html').then(res => res.text()),
    fetch('/src/item/transaction.html').then(res => res.text())
  ]);

  for (const [data, transacoes] of transacoesPix.entries()) {
    // Cria o item
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = itemHTML;
    const itemEl = tempDiv.firstElementChild;

    // Define a data no título
    const dayEl = itemEl.querySelector('.day-title .day strong');
    if (dayEl) dayEl.textContent = data;

    const container = itemEl.querySelector('.transactions');

    // Cria transações para esse dia
    transacoes.forEach(transacao => {
      const txDiv = document.createElement('div');
      txDiv.innerHTML = transactionHTML;
      const txEl = txDiv.firstElementChild;

      const nome = txEl.querySelector('.transaction-name');
      const valor = txEl.querySelector('.transaction-amount');

      nome.textContent = transacao.nome || 'Desconhecido';
      valor.textContent = `${transacao.perda ? '- ' : '+ '}R$ ${transacao.valor.toFixed(2)}`;
      valor.style.color = transacao.perda ? 'red' : 'green';

      container.appendChild(txEl);
    });

    // Adiciona ao DOM
    main.appendChild(itemEl);
    handleItemClick(itemEl.querySelector('.day-title'));
  }
}


function separarPorValor(texto) {
  texto = texto.replace(/(\d{2} [a-z]{3} \d{4})(?!\n)/gi, '$1\n');
  texto = texto.replace(/(\d{1,3}(?:\.\d{3})*,\d{2})(?![\d/])/g, '$1\n');
  texto = texto.replace(/ +/g, ' ')
    .replace(/\n+/g, '\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim();

  const blocos = texto.split(/\n(?=\d{2} [a-z]{3} \d{4})/i);
  const dias = [];

  for (const bloco of blocos) {
    const linhas = bloco.split('\n');
    const data = linhas[0].trim();

    let entradas = null;
    let saidas = null;
    const transacoes = [];

    let buffer = '';
    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i];

      if (/^Total de entradas \+/.test(linha)) {
        entradas = linha.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/)?.[1] || null;
        continue;
      }

      if (/^Total de saídas -/.test(linha)) {
        saidas = linha.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/)?.[1] || null;
        continue;
      }

      buffer += (buffer ? ' ' : '') + linha;

      if (/\d{1,3}(?:\.\d{3})*,\d{2}$/.test(linha)) {
        buffer = buffer.trim();
        if (buffer.includes('débito')) {
          const obj = serializarTransacaoDebito(buffer);
          if (obj && typeof obj === 'object') {
            obj.data = data;
            if (!transacoesDebito.has(data)) transacoesDebito.set(data, []);
            transacoesDebito.get(data).push(obj);
          }
        } else if (buffer.includes('Pix')) {
          const obj = serializarTransacaoPix(buffer);
          if (obj && typeof obj === 'object') {
            obj.data = data;
            if (!transacoesPix.has(data)) transacoesPix.set(data, []);
            transacoesPix.get(data).push(obj);
          }
        }
        transacoes.push(buffer);
        buffer = '';
      }
    }

    dias.push({ data, entradas, saidas, transacoes });
  }

  return dias;
}

function serializarTransacaoPix(transacao) {
  const regexCompleto = /Transferência (recebida|enviada) pelo Pix (.+?) - (.+?) - (.+?) Agência: (.+?) Conta: (.+?) (\d{1,3}(?:\.\d{3})*,\d{2})/;
  const regexSemConta = /Transferência (recebida|enviada) pelo Pix (.+?) - (.+?) Agência: (.+?) Conta: (\d{1,3}(?:\.\d{3})*,\d{2})/;
  const regexSemBanco = /Transferência (recebida|enviada) pelo Pix (.+?) - (.+?) - BANCO (\d{1,3}(?:\.\d{3})*,\d{2})/;
  const regexSimples = /Transferência enviada pelo Pix\s+(\d{1,3}(?:\.\d{3})*,\d{2})/;

  const perda = transacao.includes('enviada');
  let match;

  if ((match = transacao.match(regexCompleto))) {
    const [, , nome, cpf_cnpj, banco, agencia, conta, valor] = match;
    return { nome, cpf_cnpj, banco, agencia, conta, valor: parseFloat(valor.replace(/\./g, '').replace(',', '.')), perda };
  }

  if ((match = transacao.match(regexSemConta))) {
    const [, , nome, cpf_cnpj, agencia, valor] = match;
    return { nome, cpf_cnpj, banco: null, agencia, conta: null, valor: parseFloat(valor.replace(/\./g, '').replace(',', '.')), perda };
  }

  if ((match = transacao.match(regexSemBanco))) {
    const [, , nome, cpf_cnpj, valor] = match;
    return { nome, cpf_cnpj, banco: null, agencia: null, conta: null, valor: parseFloat(valor.replace(/\./g, '').replace(',', '.')), perda };
  }

  if ((match = transacao.match(regexSimples))) {
    const [, valor] = match;
    return { nome: null, cpf_cnpj: null, banco: null, agencia: null, conta: null, valor: parseFloat(valor.replace(/\./g, '').replace(',', '.')), perda };
  }

  return transacao;
}

function serializarTransacaoDebito(transacao) {
  const regex = /Compra no débito(?: via \w+)? (.+?) (\d{1,3}(?:\.\d{3})*,\d{2})/;
  const match = transacao.match(regex);

  if (match) {
    const [, estabelecimento, valor] = match;
    return { estabelecimento, valor: parseFloat(valor.replace(/\./g, '').replace(',', '.')), perda: true };
  }

  return transacao;
}

function debugPrintTransacoesDebito() {
  const linhas = [];
  for (const [data, lista] of transacoesDebito.entries()) {
    for (const transacao of lista) {
      if (!transacao.valor) {
        linhas.push(transacao);
        continue;
      }
      linhas.push(`Data: ${data}, Estabelecimento: ${transacao.estabelecimento}, Valor: R$ ${transacao.valor.toFixed(2)}, Perda: ${transacao.perda ? 'Sim' : 'Não'}`);
    }
  }
  return linhas.join('\n');
}

function debugPrintTransacoesPix() {
  const linhas = [];
  for (const [data, lista] of transacoesPix.entries()) {
    for (const transacao of lista) {
      if (!transacao.valor) {
        linhas.push(transacao);
        continue;
      }
      linhas.push(`Data: ${data}, Nome: ${transacao.nome || 'Não informado'}, CPF/CNPJ: ${transacao.cpf_cnpj || 'Não informado'}, Banco: ${transacao.banco || 'Não informado'}, Agência: ${transacao.agencia || 'Não informado'}, Conta: ${transacao.conta || 'Não informado'}, Valor: R$ ${transacao.valor.toFixed(2)}, Perda: ${transacao.perda ? 'Sim' : 'Não'}`);
    }
  }
  return linhas.join('\n');
}


