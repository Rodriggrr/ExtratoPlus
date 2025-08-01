loadFromSessionStorage();

const urlParams = new URLSearchParams(window.location.search);
const month = urlParams.get('month');

var pixPorAno = new Map(Object.entries(JSON.parse(sessionStorage.getItem("pixPorAno") || "{}")));
var debitoPorAno = new Map(Object.entries(JSON.parse(sessionStorage.getItem("debitoPorAno") || "{}")));

console.log('teste');

console.log(`Month: ${month}`);

const allDias = extrairTodosOsDias(month, pixPorAno);
console.log(allDias);
renderItemsFromArray(allDias).then(items => {
    // Ensure items is an array and elements exist before adding event listeners
    if (Array.isArray(items)) {
        items.forEach((item, index) => {
            if (item && item.addEventListener) {
                item.addEventListener('click', () => {
                    const selectedDay = allDias[index];
                    window.location.href = `../day/index.html?day=${encodeURIComponent(selectedDay.nome)}&month=${encodeURIComponent(month)}`;
                });
            }
        });
    } else {
        console.error('renderItemsFromArray did not return an array of elements.');
    }
}).catch(error => {
    console.error('Error rendering items:', error);
});

console.log(`All days: alldias.length: ${allDias.length}`);

const gridContainer = document.getElementById('main-content');
if (gridContainer) {
    // Set a minimum and maximum number of columns for better layout
    const columns = Math.max(1, Math.min(allDias.length, 8)); // for example, max 6 columns
    gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
}



