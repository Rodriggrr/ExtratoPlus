loadFromSessionStorage();

var pixPorAno = new Map(Object.entries(JSON.parse(sessionStorage.getItem("pixPorAno") || "{}")));
var debitoPorAno = new Map(Object.entries(JSON.parse(sessionStorage.getItem("debitoPorAno") || "{}")));

// Get month and day from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const month = urlParams.get('month');
const day = urlParams.get('day');

console.log('teste');

const dataStr = day + " " + month + " 2025";
console.log(`Data: ${dataStr}`);

var transacoes = extrairTodasAsTransacoes(dataStr, pixPorAno);
transacoes = transacoes.concat(extrairTodasAsTransacoes(dataStr, arrayToAgrupamentoAno(debitoPorAno)));
console.log("deb:", Array.from(debitoPorAno.entries()))

console.log(`Transações: ${transacoes.length}`);

renderTransactionsFromArray(transacoes).then(items => {
    // Ensure items is an array and elements exist before adding event listeners
    if (Array.isArray(items)) {
        items.forEach(item => {
            item.addEventListener('click', () => {
                sessionStorage.setItem('lastTransaction', JSON.stringify(item));
                window.location.href = '../view/transactions';
            });
        });
    } else {
        console.error('renderTransactionsFromArray did not return an array of elements.');
    }
}).catch(error => {
    console.error('Error rendering items:', error);
});

const gridContainer = document.getElementById('main-content');
if (gridContainer) {
    gridContainer.style.gridTemplateColumns = `repeat(${transacoes.length}, 1fr)`;
}

