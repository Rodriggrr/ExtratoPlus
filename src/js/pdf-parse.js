const entries = [];
const transacoesPix = new Map();
const transacoesDebito = new Map();
const outrasTransacoes = [];
const transacoesCredito = [];
var dias;

const regexOutrasTransacoes = /^([\s\S]+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})$/;


function descricaoValida(descricao) {
    if (descricao.length > 100) return false;

    const palavrasDescartadas = [
        'atendimento', 'chat do app', 'ouvidoria', 'extrato gerado',
        'ligue', 'mensagem', 'horário', 'contato', 'capital', 'localidade',
        'cpf', 'agência'
    ];

    const descMinuscula = descricao.toLowerCase();
    for (const palavra of palavrasDescartadas) {
        if (descMinuscula.includes(palavra)) {
            return false;
        }
    }

    return true;
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
                } else if (/Transferência Recebida/.test(buffer) && !buffer.includes('Pix')) {
                    const obj = serializarTransferenciaRecebida(buffer);
                    if (obj) {
                        obj.data = data;
                        outrasTransacoes.push(obj);
                    } else {
                        // Caso não consiga serializar, guarda como texto simples, se válido
                        if (descricaoValida(buffer)) {
                            outrasTransacoes.push({ data, descricao: buffer, valor: null });
                        } else {
                        console.log("Transação não reconhecida:", buffer);

                        }
                    }
                } else if (regexOutrasTransacoes.test(buffer)) {
                    
                    const match = buffer.match(regexOutrasTransacoes);
                    if (match) {
                        const descricao = match[1];
                        const valorStr = match[2];
                        const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
                        if (descricaoValida(descricao)) {
                            const transacao = serializarDiversos(data, descricao, valor);
                            outrasTransacoes.push(transacao);
                        } else {
                        console.log("Transação não reconhecida:", buffer);

                        }
                    }
                } else {
                    
                    if (descricaoValida(buffer)) {
                        const transacao = serializarDiversos(data, buffer, null);
                        outrasTransacoes.push(transacao);
                    } else {
                        console.log("Transação não reconhecida:", buffer);

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

function serializarTransferenciaRecebida(buffer, data) {
    const nomeRegex = /Transferência Recebida (.+?) -/;
    const agenciaContaRegex = /Agência:\s*(\d+)\s+Conta:\s*([\d\-]+)/;
    const valorRegex = /(\d{1,3}(?:\.\d{3})*,\d{2})$/;

    const nomeMatch = buffer.match(nomeRegex);
    const agenciaContaMatch = buffer.match(agenciaContaRegex);
    const valorMatch = buffer.match(valorRegex);

    if (nomeMatch && valorMatch) {
        const nome = nomeMatch[1].trim();
        const agencia = agenciaContaMatch ? agenciaContaMatch[1] : 'Desconhecida';
        const conta = agenciaContaMatch ? agenciaContaMatch[2] : 'Desconhecida';
        const valor = parseFloat(valorMatch[1].replace(/\./g, '').replace(',', '.'));

        const transacao = {
            data,
            tipo: 'transferenciaRecebida',
            nome,
            agencia,
            conta,
            valor,
            perda: false // 👈 claramente é uma entrada, então marcamos como ganho
        };

        return transacao;
    }

    return null;
}

function extrairTodosOsMeses(agrupamentoAno) {
  const mesesSet = new Set();
  // será: {nome}, {entradas}, {saidas}
  // use calcularEntradasESaidasMes(mes, ano) para calcular entradas e saídas de cada mês
for (const [ano, mesesMap] of agrupamentoAno.entries()) {
    for (const [mes, diasMap] of (mesesMap instanceof Map ? mesesMap.entries() : Object.entries(mesesMap))) {
        // Calcular entradas e saídas do mês usando dias globais
        const [entradas, saidas] = calcularEntradasESaidasMes(mes, ano);
        mesesSet.add({
            nome: `${mes}`,
            entradas,
            saidas
        });
    }
}
return Array.from(mesesSet);
}

function extrairTodosOsDias(mes, agrupamentoAno) {
    //month will be like: JUN, JUL, etc.
    const diasDoMes = [];
    let diasMap = null;
    if (agrupamentoAno instanceof Map) {
        // Procurar pelo mês em todos os anos
        for (const mesesMap of agrupamentoAno.values()) {
            console.log("ENTREI");
            // Tenta encontrar o mês tanto em Map quanto em objeto comum
            if (mesesMap instanceof Map) {
                if (mesesMap.has(mes)) {
                    diasMap = mesesMap.get(mes);
                    break;
                }
            } else if (typeof mesesMap === 'object' && mesesMap !== null && mesesMap[mes]) {
                diasMap = mesesMap[mes];
                break;
            }
        }
    } else if (agrupamentoAno && agrupamentoAno[mes]) {
        diasMap = agrupamentoAno[mes];
    }

    if (!diasMap) return diasDoMes;

    for (const [data, transacoes] of (diasMap instanceof Map ? diasMap.entries() : Object.entries(diasMap))) {
        // Calcular entradas e saídas do dia usando dias globais
        const [entradas, saidas] = calcularEntradasESaidasDia(data);
        diasDoMes.push({
            nome: data.split(' ')[0], // Only the day number
            entradas,
            saidas,
            transacoes
        });
    }
    return diasDoMes;
}

function extrairTodasAsTransacoes(dataStr, agrupamentoAno) {
    // dataStr: "01 JUN 2025"
    // agrupamentoAno: Map(ano -> Map(mes -> Map(data -> transacoes[])) ou objeto)
    const partes = dataStr.trim().split(/\s+/);
    if (partes.length < 3) {
        return [];
    }

    const mes = partes[1].toUpperCase();
    const ano = partes[2];

    let diasMap = null;
    if (agrupamentoAno instanceof Map && agrupamentoAno.has(ano)) {
        const mesesMap = agrupamentoAno.get(ano);
        if (mesesMap instanceof Map && mesesMap.has(mes)) {
            diasMap = mesesMap.get(mes);
        } else if (typeof mesesMap === 'object' && mesesMap !== null && mesesMap[mes]) {
            diasMap = mesesMap[mes];
        }
    } else if (typeof agrupamentoAno === 'object' && agrupamentoAno !== null && agrupamentoAno[ano]) {
        const mesesMap = agrupamentoAno[ano];
        if (mesesMap[mes]) {
            diasMap = mesesMap[mes];
        }
    }

    if (!diasMap) {
        return [];
    }

    // Tenta encontrar a chave exata (normalizando espaços e maiúsculas/minúsculas)
    const normalize = s => s.replace(/\s+/g, ' ').trim().toUpperCase();
    const targetKey = normalize(dataStr);

    if (diasMap instanceof Map) {
        for (const [dataKey, transacoes] of diasMap.entries()) {
            if (normalize(dataKey) === targetKey) {
                return transacoes;
            }
        }
    } else if (typeof diasMap === 'object' && diasMap !== null) {
        for (const dataKey in diasMap) {
            if (normalize(dataKey) === targetKey) {
                return diasMap[dataKey];
            }
        }
    }

    return [];
}

// Função utilitária para transformar o array de arrays (como deb) em Map aninhado igual ao agrupamentoAno
function arrayToAgrupamentoAno(arr) {
    // arr: [ [ano, { JUN: { "01 JUN 2025": [...] }, ... }], ... ]
    const agrupamentoAno = new Map();
    for (const [ano, mesesObj] of arr) {
        const mesesMap = new Map();
        for (const mes in mesesObj) {
            const diasObj = mesesObj[mes];
            const diasMap = new Map();
            for (const data in diasObj) {
                diasMap.set(data, diasObj[data]);
            }
            mesesMap.set(mes, diasMap);
        }
        agrupamentoAno.set(ano, mesesMap);
    }
    return agrupamentoAno;
}

function serializarDiversos(data, descricao, valor) {
  const perdaPalavras = [
    'pagamento de fatura',
    'compra de criptomoedas',
    'aplicação rdb',
    'tarifa',
    'taxa'
  ];

  const ganhoPalavras = [
    'resgate rdb',
    'venda de criptomoedas',
    'reembolso',
    'crédito em conta'
  ];

  const descLower = descricao.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Detecta perda (saída)
  const isPerda = perdaPalavras.some(palavra =>
    descLower.includes(palavra.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim())
  );

  // Detecta ganho (entrada)
  const isGanho = ganhoPalavras.some(palavra =>
    descLower.includes(palavra.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim())
  );

  // Define perda: true se for perda, false se ganho, true como default para evitar null
  const perda = isPerda ? true : (isGanho ? false : true);

  return {
    tipo: 'diverso',
    data,
    descricao,
    valor,
    perda
  };
}
function serializarTransacaoPix(transacao) {
  const regexCompleto = /Transferência (recebida|enviada) pelo Pix (.+?) - (.+?) - (.+?) Agência: (.+?) Conta: (.+?) (\d{1,3}(?:\.\d{3})*,\d{2})/;
  const regexSemConta = /Transferência (recebida|enviada) pelo Pix (.+?) - (.+?) Agência: (.+?) Conta: (\d{1,3}(?:\.\d{3})*,\d{2})/;
  const regexSemBanco = /Transferência (recebida|enviada) pelo Pix (.+?) - (.+?) - BANCO (\d{1,3}(?:\.\d{3})*,\d{2})/;
  const regexSimples = /Transferência enviada pelo Pix\s+(\d{1,3}(?:\.\d{3})*,\d{2})/;

  // Novo regex para valor adicionado via cartão de crédito ou Pix no Crédito
  const regexValorAdicionadoCredito = /Valor adicionado (?:na conta por cartão de crédito|para Pix no Crédito) (\d{1,3}(?:\.\d{3})*,\d{2})/i;

  // Novo regex para reembolso recebido pelo Pix
  const regexReembolsoRecebido = /Reembolso recebido pelo Pix (.+?) - ([\d\.\/\-]+) - (.+?) (\d{1,3}(?:\.\d{3})*,\d{2})/i;

  let perda = transacao.includes('enviada');
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

  if ((match = transacao.match(regexValorAdicionadoCredito))) {
    const [, valor] = match;
    return { nome: null, cpf_cnpj: null, banco: null, agencia: null, conta: null, valor: parseFloat(valor.replace(/\./g, '').replace(',', '.')), perda: false };
  }

  // Novo caso para reembolso recebido
  if ((match = transacao.match(regexReembolsoRecebido))) {
    const [, nome, cpf_cnpj, banco, valor] = match;
    return { nome, cpf_cnpj, banco, agencia: null, conta: null, valor: parseFloat(valor.replace(/\./g, '').replace(',', '.')), perda: false };
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
    if (!transacoesPix.size) {
        return "Nenhuma transação Pix encontrada.";
    }
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

function debugPrintOutrasTransacoes() {
    if (outrasTransacoes.length === 0) {
        return "Nenhuma outra transação encontrada.";
    }

    const linhas = outrasTransacoes.map(t => {
        if (!t) {
            return "Transação inválida ou não definida.";
        }
        if (t.tipo === 'transferenciaRecebida') {
            return `Data: ${t.data}, Transferência Recebida, Nome: ${t.nome}, Agência: ${t.agencia}, Conta: ${t.conta}, Valor: R$ ${t.valor.toFixed(2)} Perda: ${t.perda ? 'Sim' : 'Não'}`;
        }

        // Transação genérica com descrição e valor (ou sem valor)
        const valorFormatado = (typeof t.valor === 'number')
            ? `R$ ${t.valor.toFixed(2)}`
            : "Valor não informado";

        return `Data: ${t.data}, Descrição: ${t.descricao}, Valor: ${valorFormatado} Perda: ${t.perda ? 'Sim' : 'Não'}`;
    });

    return linhas.join('\n');
}

function saveToSessionStorage() {
    // Converte Maps para arrays para JSON
    const transacoesPixArray = [...transacoesPix.entries()];
    const transacoesDebitoArray = [...transacoesDebito.entries()];

    sessionStorage.setItem("entries", JSON.stringify(entries));
    sessionStorage.setItem("transacoesPix", JSON.stringify(transacoesPixArray));
    sessionStorage.setItem("transacoesDebito", JSON.stringify(transacoesDebitoArray));
    sessionStorage.setItem("dias", JSON.stringify(dias));
}

function loadFromSessionStorage() {
    // Recupera arrays e converte para Maps
    const entriesStored = sessionStorage.getItem("entries");
    const transacoesPixStored = sessionStorage.getItem("transacoesPix");
    const transacoesDebitoStored = sessionStorage.getItem("transacoesDebito");
    const transacoesCreditoStored = sessionStorage.getItem("transacoesCredito");
    const diasStored = sessionStorage.getItem("dias");

    if (diasStored) {
        dias = JSON.parse(diasStored);
    } else {
        dias = [];
    }

    if (entriesStored) {
        entries.length = 0;
        entries.push(...JSON.parse(entriesStored));
    }

    if (transacoesPixStored) {
        transacoesPix.clear();
        const pixArray = JSON.parse(transacoesPixStored);
        for (const [key, value] of pixArray) {
            transacoesPix.set(key, value);
        }
    }

    if (transacoesDebitoStored) {
        transacoesDebito.clear();
        const debitoArray = JSON.parse(transacoesDebitoStored);
        for (const [key, value] of debitoArray) {
            transacoesDebito.set(key, value);
        }
    }

    if (transacoesCreditoStored) {
        transacoesCredito.length = 0;
        transacoesCredito.push(...JSON.parse(transacoesCreditoStored));
    }
}

function parseAnoMesDia(dataStr) {
    // Espera "01 JUN 2025"
    const partes = dataStr.split(' ');
    return {
        dia: partes[0],
        mes: partes[1],
        ano: parseInt(partes[2], 10)
    };
}

function agruparTransacoesPorAno(transacoesMap) {
  const agrupamentoAno = new Map();

  for (const [data, listaTransacoes] of transacoesMap.entries()) {
    // data exemplo: "30 JUN 2025"
    const partes = data.trim().split(/\s+/);
    if (partes.length < 3) continue;

    const dia = partes[0];
    const mes = partes[1].toUpperCase();
    const ano = partes[2];

    if (!agrupamentoAno.has(ano)) {
      agrupamentoAno.set(ano, new Map());
    }

    const mesesMap = agrupamentoAno.get(ano);

    if (!mesesMap.has(mes)) {
      mesesMap.set(mes, new Map());
    }

    const diasMap = mesesMap.get(mes);

    if (!diasMap.has(data)) {
      diasMap.set(data, []);
    }

    diasMap.get(data).push(...listaTransacoes);
  }

  return agrupamentoAno;
}


function agruparTransacoesPorMes(transacoesMap) {
    const agrupamentoMes = new Map();

    for (const [data, listaTransacoes] of transacoesMap.entries()) {
        const partes = data.split(' ');
        if (partes.length < 3) continue;

        const mes = partes[1].toUpperCase();
        const ano = partes[2];

        const chaveMesAno = `${mes}/${ano}`;

        if (!agrupamentoMes.has(chaveMesAno)) {
            agrupamentoMes.set(chaveMesAno, []);
        }
        agrupamentoMes.get(chaveMesAno).push(...listaTransacoes);
    }

    return agrupamentoMes;
}

function imprimirAgrupamentoAno(agrupamentoAno) {
    let resultado = '';

    for (const [ano, mesesMap] of agrupamentoAno.entries()) {
        resultado += `--- Ano: ${ano} ---\n`;
        for (const [mes, diasMap] of mesesMap.entries()) {
            resultado += `  Mês: ${mes}\n`;
            for (const [data, transacoes] of diasMap.entries()) {
                resultado += `    Data: ${data}\n`;
                for (const transacao of transacoes) {
                    // Supondo que transacao tenha propriedades nome e valor, adapte conforme seu objeto
                    if (transacao.nome) {
                        resultado += `      Nome: ${transacao.nome}, Valor: R$ ${transacao.valor.toFixed(2)}, Perda: ${transacao.perda ? 'Sim' : 'Não'}\n`;
                    } else if (transacao.estabelecimento) {
                        resultado += `      Estabelecimento: ${transacao.estabelecimento}, Valor: R$ ${transacao.valor.toFixed(2)}, Perda: ${transacao.perda ? 'Sim' : 'Não'}\n`;
                    } else {
                        resultado += `      Transação genérica: ${JSON.stringify(transacao)}\n`;
                    }
                }
            }
        }
    }

    return resultado;
}

function calcularEntradasESaidasAno(ano) {
  let entradas = 0;
  let saidas = 0;

  for (const dia of dias) {
    if (!dia.data.endsWith(ano)) continue;

    if (dia.entradas) {
      const valorEntrada = parseFloat(dia.entradas.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(valorEntrada)) entradas += valorEntrada;
    }

    if (dia.saidas) {
      const valorSaida = parseFloat(dia.saidas.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(valorSaida)) saidas += valorSaida;
    }
  }

  return [entradas, saidas];
}


function calcularEntradasESaidasMes(mes, ano) {
  let entradas = 0;
  let saidas = 0;

  for (const dia of dias) {
    if (!dia.data.includes(`${mes.toUpperCase()} ${ano}`)) continue;

    // Convertendo strings como "1.234,56" em número
    if (dia.entradas) {
      const valorEntrada = parseFloat(dia.entradas.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(valorEntrada)) entradas += valorEntrada;
    }

    if (dia.saidas) {
      const valorSaida = parseFloat(dia.saidas.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(valorSaida)) saidas += valorSaida;
    }
  }

  return [entradas, saidas];
}


function calcularEntradasESaidasDia(dataStr) {
  let entradas = 0;
  let saidas = 0;

  const dia = dias.find(d => d.data === dataStr);
  if (!dia) return [entradas, saidas];

  if (dia.entradas) {
    const valorEntrada = parseFloat(dia.entradas.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(valorEntrada)) entradas += valorEntrada;
  }

  if (dia.saidas) {
    const valorSaida = parseFloat(dia.saidas.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(valorSaida)) saidas += valorSaida;
  }

  return [entradas, saidas];
}
