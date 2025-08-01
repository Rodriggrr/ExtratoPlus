
window.addEventListener('DOMContentLoaded', () => {
  const uploadButton = document.getElementById('upload');
  if (uploadButton) {
    uploadButton.addEventListener('change', handleFile);
  }
});

async function handleFile(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  let fullText = '';

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let allPagesText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const strings = content.items.map(item => item.str);
      const pageText = strings.join(' ').replace(/\s+/g, ' ').trim();

      allPagesText += pageText + '\n\n'; // junta todas as páginas
    }

    // Detecta e extrai blocos com base nas datas
    const dateRegex = /\d{2} [a-zA-Z]{3} \d{4}/g;
    const matches = [];
    let match;
    let lastIndex = 0;
    let lastDate = null;

    while ((match = dateRegex.exec(allPagesText)) !== null) {
      if (lastDate !== null) {
        const entryText = allPagesText.slice(lastIndex, match.index).trim();
        if (entryText) matches.push(`${lastDate}\n${entryText}`);
      }
      lastDate = match[0];
      lastIndex = match.index + match[0].length;
    }

    if (lastDate && lastIndex < allPagesText.length) {
      const entryText = allPagesText.slice(lastIndex).trim();
      if (entryText) matches.push(`${lastDate}\n${entryText}`);
    }

    if (matches.length) {
      entries.push(...matches);
      fullText += matches.join('\n\n') + '\n\n';
    }
  }

  dias = separarPorValor(fullText);  
  saveToSessionStorage();

  window.location.href = '/view';
}
// async function renderItemsFromPDF() {
//   const main = document.getElementById('main-content');
//   main.innerHTML = ''; // limpa conteúdo anterior

//   // Carrega os templates HTML
//   const [itemHTML, transactionHTML] = await Promise.all([
//     fetch('/src/item/item.html').then(res => res.text()),
//     fetch('/src/item/transaction.html').then(res => res.text())
//   ]);

//   for (const [data, transacoes] of transacoesPix.entries()) {
//     // Cria o item
//     const tempDiv = document.createElement('div');
//     tempDiv.innerHTML = itemHTML;
//     const itemEl = tempDiv.firstElementChild;

//     // Define a data no título
//     const dayEl = itemEl.querySelector('.day-title .day strong');
//     if (dayEl) dayEl.textContent = data;

//     const container = itemEl.querySelector('.transactions');

//     // Cria transações para esse dia
//     transacoes.forEach(transacao => {
//       const txDiv = document.createElement('div');
//       txDiv.innerHTML = transactionHTML;
//       const txEl = txDiv.firstElementChild;

//       const nome = txEl.querySelector('.transaction-name');
//       const valor = txEl.querySelector('.transaction-amount');

//       nome.textContent = transacao.nome || 'Desconhecido';
//       valor.textContent = `${transacao.perda ? '- ' : '+ '}R$ ${transacao.valor.toFixed(2)}`;
//       valor.style.color = transacao.perda ? 'red' : 'green';

//       container.appendChild(txEl);
//     });

//     // Adiciona ao DOM
//     main.appendChild(itemEl);
//     handleItemClick(itemEl.querySelector('.day-title'));
//   }
// }