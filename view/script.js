console.log(document.body);
console.log(sessionStorage.getItem("particlesEnabled"));



loadFromSessionStorage();
console.log("transacoesPix:", transacoesPix);

// Para agrupar Pix por ano e imprimir:
const pixPorAno = agruparTransacoesPorAno(transacoesPix);
console.log(imprimirAgrupamentoAno(pixPorAno));

// Para agrupar Débito por ano e imprimir:
const debitoPorAno = agruparTransacoesPorAno(transacoesDebito);
console.log(imprimirAgrupamentoAno(debitoPorAno));

function saveToSessionStorage(pixPorAno, debitoPorAno) {
    sessionStorage.setItem("pixPorAno", JSON.stringify(mapToObject(pixPorAno)));
    sessionStorage.setItem("debitoPorAno", JSON.stringify(mapToObject(debitoPorAno)));
}

function mapToObject(map) {
    if (!(map instanceof Map)) return map;
    const obj = {};
    for (const [key, value] of map.entries()) {
        obj[key] = mapToObject(value);
    }
    return obj;
}

function objectToMap(obj) {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return obj;
    const map = new Map();
    for (const key of Object.keys(obj)) {
        map.set(key, objectToMap(obj[key]));
    }
    return map;
}



// Salva os agrupamentos no sessionStorage
saveToSessionStorage(pixPorAno, debitoPorAno);

function decideRedirecionamento(pixPorAno, debitoPorAno) {
  const anosPix = [...pixPorAno.keys()];
  const anosDebito = [...debitoPorAno.keys()];

  const anosUnicos = [...new Set([...anosPix, ...anosDebito])].filter(a => a != null && a !== '');

  if (anosUnicos.length > 1) {
    window.location.href = "/view/year";
    return;
  }

  if (anosUnicos.length === 1) {
    const ano = anosUnicos[0];

    const mesesPixMap = pixPorAno.get(ano);
    const mesesDebitoMap = debitoPorAno.get(ano);

    const mesesPix = mesesPixMap ? [...mesesPixMap.keys()] : [];
    const mesesDebito = mesesDebitoMap ? [...mesesDebitoMap.keys()] : [];

    const mesesUnicos = [...new Set([...mesesPix, ...mesesDebito])].filter(m => m != null && m !== '');

    if (mesesUnicos.length > 1) {
      window.location.href = "/view/month";
      return;
    }

    if (mesesUnicos.length === 1) {
      const mes = mesesUnicos[0];

      const diasPixMap = mesesPixMap?.get(mes);
      const diasDebitoMap = mesesDebitoMap?.get(mes);

      const diasPix = diasPixMap ? [...diasPixMap.keys()] : [];
      const diasDebito = diasDebitoMap ? [...diasDebitoMap.keys()] : [];

      const diasUnicos = [...new Set([...diasPix, ...diasDebito])].filter(d => d != null && d !== '');

      if (diasUnicos.length === 1) {
        window.location.href = "/view/day";
      } else if (diasUnicos.length > 1) {
        window.location.href = "/view/days/index.html?month=" + encodeURIComponent(mes);
      } else {
        // Sem dias encontrados — fallback
        window.location.href = "/view/month";
      }
      return;
    }

    // Sem meses encontrados — fallback
    window.location.href = "/view/year";
    return;
  }

  // Nenhum ano — fallback
  window.location.href = "/view/year";
}

decideRedirecionamento(pixPorAno, debitoPorAno);