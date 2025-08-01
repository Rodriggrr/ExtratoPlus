loadFromSessionStorage();

var pixPorAno = new Map(Object.entries(JSON.parse(sessionStorage.getItem("pixPorAno") || "{}")));
var debitoPorAno = new Map(Object.entries(JSON.parse(sessionStorage.getItem("debitoPorAno") || "{}")));

console.log('teste');

const meses = extrairTodosOsMeses(pixPorAno);

renderItemsFromArray(meses).then(items => {
    // Ensure items is an array and elements exist before adding event listeners
    if (Array.isArray(items)) {
        items.forEach((item, index) => {
            if (item && item.addEventListener) {
                item.addEventListener('click', () => {
                    const selectedMonth = meses[index];
                    window.location.href = `../days/index.html?month=${encodeURIComponent(selectedMonth.nome)}`;
                });
            }
        });
    } else {
        console.error('renderItemsFromArray did not return an array of elements.');
    }
}).catch(error => {
    console.error('Error rendering items:', error);
});

const gridContainer = document.getElementById('main-content');
if (gridContainer) {
    gridContainer.style.gridTemplateColumns = `repeat(${meses.length}, 1fr)`;
}

