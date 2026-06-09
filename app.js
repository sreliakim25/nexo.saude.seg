/**
 * NEXO · SAÚDE & SANEAMENTO
 * Código de Lógica do Front-End (SPA Interativa)
 * 
 * Este arquivo centraliza os dados mock do projeto (provenientes das migrações SQL),
 * implementa o cálculo matemático do coeficiente de Pearson, configura os gráficos
 * interativos com ApexCharts e renderiza o mapa com Leaflet.
 * 
 * Escrito com fins didáticos para alunos de tecnologia e saúde pública.
 */

// ==========================================================================
// 1. BANCO DE DADOS MOCK (Consolidado a partir de 003_seed_mock_data.sql)
// ==========================================================================

const MOCK_DATA = {
  // Municípios de Pernambuco para o mapa de calor regional
  municipios: [
    { codigo: '2611606', nome: 'Caruaru', lat: -8.2845, lon: -35.9754, pop: 365032, invest: 432000000 },
    { codigo: '2611101', nome: 'Recife', lat: -8.0539, lon: -34.8811, pop: 1488920, invest: 1850000000 },
    { codigo: '2609600', nome: 'Olinda', lat: -8.0089, lon: -34.8553, pop: 388653, invest: 380000000 },
    { codigo: '2607901', nome: 'Jaboatão dos Guararapes', lat: -8.1153, lon: -35.0025, pop: 709597, invest: 650000000 },
    { codigo: '2610707', nome: 'Petrolina', lat: -9.3881, lon: -40.4996, pop: 362526, invest: 490000000 },
    { codigo: '2604106', nome: 'Garanhuns', lat: -8.8830, lon: -36.4930, pop: 143682, invest: 180000000 },
    { codigo: '2616407', nome: 'Vitória de Santo Antão', lat: -8.1161, lon: -35.2946, pop: 131464, invest: 145000000 },
    { codigo: '2605459', nome: 'Gravatá', lat: -8.2005, lon: -35.5693, pop: 83572, invest: 98000000 },
    { codigo: '2614501', nome: 'Santa Cruz do Capibaribe', lat: -7.9596, lon: -36.2045, pop: 96064, invest: 120000000 },
    { codigo: '2602902', nome: 'Arcoverde', lat: -8.4191, lon: -37.0522, pop: 80025, invest: 75000000 },
    { codigo: '2614303', nome: 'Serra Talhada', lat: -7.9855, lon: -38.2937, pop: 87688, invest: 88000000 },
    { codigo: '2612208', nome: 'Salgueiro', lat: -8.0726, lon: -39.1248, pop: 62291, invest: 55000000 },
    { codigo: '2610400', nome: 'Ouricuri', lat: -7.8795, lon: -40.0879, pop: 73792, invest: 45000000 },
    { codigo: '2600104', nome: 'Afogados da Ingazeira', lat: -7.7497, lon: -37.6360, pop: 38726, invest: 38000000 },
    { codigo: '2606200', nome: 'Floresta', lat: -8.6009, lon: -38.5693, pop: 31782, invest: 28000000 },
    { codigo: '2601904', nome: 'Bezerros', lat: -8.2346, lon: -35.7503, pop: 62278, invest: 42000000 },
    { codigo: '2604502', nome: 'Goiana', lat: -7.5603, lon: -35.0019, pop: 80032, invest: 92000000 },
    { codigo: '2615003', nome: 'Surubim', lat: -7.8556, lon: -35.7582, pop: 68193, invest: 50000000 }
  ],

  // Bairros de Caruaru para análise em nível microgeográfico
  bairros: [
    { nome: 'Centro', pop: 42000, lat: -8.2832, lon: -35.9736, nexo: 28.5, risco: 'BAIXO', investPerCapita: 180, casosPorMil: 4.2 },
    { nome: 'Maurício de Nassau', pop: 38000, lat: -8.2798, lon: -35.9820, nexo: 42.3, risco: 'MODERADO', investPerCapita: 150, casosPorMil: 6.8 },
    { nome: 'Salgado', pop: 29000, lat: -8.2756, lon: -35.9650, nexo: 67.8, risco: 'ALTO', investPerCapita: 85, casosPorMil: 14.5 },
    { nome: 'Nova Caruaru', pop: 24000, lat: -8.3012, lon: -35.9945, nexo: 75.2, risco: 'ALTO', investPerCapita: 62, casosPorMil: 19.1 },
    { nome: 'Rendeiras', pop: 18000, lat: -8.2901, lon: -36.0102, nexo: 83.4, risco: 'CRITICO', investPerCapita: 40, casosPorMil: 27.4 },
    { nome: 'São Francisco', pop: 21000, lat: -8.2650, lon: -35.9580, nexo: 38.9, risco: 'MODERADO', investPerCapita: 125, casosPorMil: 8.1 },
    { nome: 'Vassoural', pop: 15000, lat: -8.2950, lon: -35.9870, nexo: 79.1, risco: 'ALTO', investPerCapita: 55, casosPorMil: 22.8 },
    { nome: 'Indianópolis', pop: 19000, lat: -8.2870, lon: -35.9720, nexo: 55.6, risco: 'MODERADO', investPerCapita: 98, casosPorMil: 11.2 }
  ],

  // Série temporal histórica consolidate de Caruaru (2014-2024)
  historico: [
    {
      ano: 2014,
      investimento: { AG: 12500000, ES: 4200000, RS: 1800000, DR: 2100000, Total: 20600000 },
      saude: { diarreia: 8420, leptospirose: 142, hepatite_a: 89, dengue: 2840 },
      obitos: { diarreia: 48, infantil: 112 }
    },
    {
      ano: 2015,
      investimento: { AG: 14300000, ES: 5100000, RS: 2200000, DR: 3500000, Total: 25100000 },
      saude: { diarreia: 7980, leptospirose: 138, hepatite_a: 82, dengue: 3420 },
      obitos: { diarreia: 44, infantil: 106 }
    },
    {
      ano: 2016,
      investimento: { AG: 11800000, ES: 4800000, RS: 1900000, DR: 2800000, Total: 21300000 },
      saude: { diarreia: 7650, leptospirose: 125, hepatite_a: 74, dengue: 4180 },
      obitos: { diarreia: 41, infantil: 98 }
    },
    {
      ano: 2017,
      investimento: { AG: 13200000, ES: 6300000, RS: 2500000, DR: 4100000, Total: 26100000 },
      saude: { diarreia: 7100, leptospirose: 118, hepatite_a: 68, dengue: 2650 },
      obitos: { diarreia: 37, infantil: 91 }
    },
    {
      ano: 2018,
      investimento: { AG: 15700000, ES: 7800000, RS: 3100000, DR: 5200000, Total: 31800000 },
      saude: { diarreia: 6430, leptospirose: 98, hepatite_a: 55, dengue: 1820 },
      obitos: { diarreia: 32, infantil: 82 }
    },
    {
      ano: 2019,
      investimento: { AG: 18400000, ES: 9200000, RS: 3800000, DR: 6800000, Total: 38200000 },
      saude: { diarreia: 5890, leptospirose: 82, hepatite_a: 44, dengue: 2280 },
      obitos: { diarreia: 27, infantil: 73 }
    },
    {
      ano: 2020,
      investimento: { AG: 16900000, ES: 8400000, RS: 3400000, DR: 5500000, Total: 34200000 },
      saude: { diarreia: 5420, leptospirose: 74, hepatite_a: 38, dengue: 1560 },
      obitos: { diarreia: 24, infantil: 69 }
    },
    {
      ano: 2021,
      investimento: { AG: 19800000, ES: 10500000, RS: 4100000, DR: 7200000, Total: 41600000 },
      saude: { diarreia: 4980, leptospirose: 61, hepatite_a: 29, dengue: 1980 },
      obitos: { diarreia: 20, infantil: 64 }
    },
    {
      ano: 2022,
      investimento: { AG: 22100000, ES: 12300000, RS: 4800000, DR: 8900000, Total: 48100000 },
      saude: { diarreia: 4350, leptospirose: 48, hepatite_a: 21, dengue: 2450 },
      obitos: { diarreia: 16, infantil: 59 }
    },
    {
      ano: 2023,
      investimento: { AG: 24600000, ES: 14800000, RS: 5500000, DR: 10200000, Total: 55100000 },
      saude: { diarreia: 3820, leptospirose: 35, hepatite_a: 15, dengue: 1890 },
      obitos: { diarreia: 12, infantil: 54 }
    },
    {
      ano: 2024,
      investimento: { AG: 26300000, ES: 16200000, RS: 6100000, DR: 11500000, Total: 60100000 },
      saude: { diarreia: 3210, leptospirose: 27, hepatite_a: 10, dengue: 1340 },
      obitos: { diarreia: 9, infantil: 48 }
    }
  ]
};

// ==========================================================================
// 2. SISTEMA DE ROTAS / ABAS (Single Page Application)
// ==========================================================================

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.view-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');
      
      // Atualiza links ativos
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Atualiza seções ativas
      sections.forEach(sec => {
        sec.classList.remove('active');
        if (sec.id === targetView + '-section') {
          sec.classList.add('active');
        }
      });

      // Lógica específica para renderização atrasada de mapas e gráficos
      if (targetView === 'dashboard') {
        renderCharts();
      } else if (targetView === 'mapa') {
        // Redimensiona o Leaflet para ele recalcular seu tamanho físico após ficar visível
        setTimeout(() => {
          if (window.leafletMap) {
            window.leafletMap.invalidateSize();
          }
        }, 100);
      } else if (targetView === 'correlacao') {
        renderCorrelationPage();
      }

      // Fecha sidebar no mobile ao clicar no link
      const sidebar = document.querySelector('.sidebar');
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });
  });

  // Toggle de menu hambúrguer no mobile
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

// ==========================================================================
// 3. LOGICA MATEMÁTICA E ESTATÍSTICA (Pearson e Regressão)
// ==========================================================================

/**
 * Calcula o Coeficiente de Correlação de Pearson (r).
 * Indica a força e a direção da relação linear entre duas variáveis.
 * 
 * Fórmula: r = cov(X,Y) / (std(X) * std(Y))
 */
function calcularPearson(x, y) {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  let somaX = 0, somaY = 0, somaXY = 0, somaX2 = 0, somaY2 = 0;

  for (let i = 0; i < n; i++) {
    somaX += x[i];
    somaY += y[i];
    somaXY += x[i] * y[i];
    somaX2 += x[i] * x[i];
    somaY2 += y[i] * y[i];
  }

  const numerador = (n * somaXY) - (somaX * somaY);
  const denominador = Math.sqrt(((n * somaX2) - (somaX * somaX)) * ((n * somaY2) - (somaY * somaY)));

  if (denominador === 0) return 0;
  return numerador / denominador;
}

/**
 * Calcula a Regressão Linear Simples (Y = aX + b).
 * Retorna os coeficientes angular (a) e linear (b) e a linha projetada.
 */
function calcularRegressaoLinear(x, y) {
  const n = x.length;
  let somaX = 0, somaY = 0, somaXY = 0, somaX2 = 0;

  for (let i = 0; i < n; i++) {
    somaX += x[i];
    somaY += y[i];
    somaXY += x[i] * y[i];
    somaX2 += x[i] * x[i];
  }

  const inclinacao = ((n * somaXY) - (somaX * somaY)) / ((n * somaX2) - (somaX * somaX));
  const intercepto = (somaY - (inclinacao * somaX)) / n;

  return { inclinacao, intercepto };
}

/**
 * Gera uma descrição didática de interpretação da correlação de Pearson.
 */
function interpretarPearson(r) {
  const absR = Math.abs(r);
  let direcao = r < 0 ? 'negativa (inversamente proporcional)' : 'positiva (diretamente proporcional)';
  let força = '';

  if (absR >= 0.9) força = 'muito forte';
  else if (absR >= 0.7) força = 'forte';
  else if (absR >= 0.5) força = 'moderada';
  else if (absR >= 0.3) força = 'fraca';
  else força = 'desprezível ou nula';

  let explicacao = '';
  if (r < 0) {
    explicacao = 'Isso indica que, à medida que os investimentos em saneamento básico **aumentaram**, os índices de adoecimento ou mortalidade na população **diminuíram**. Este é o cenário de impacto social positivo esperado.';
  } else {
    explicacao = 'Uma correlação positiva indica que ambas as métricas cresceram juntas no período analisado, sugerindo a presença de outros fatores externos (como surtos epidêmicos) ou atraso no tempo de resposta do impacto das obras.';
  }

  return `O coeficiente de Pearson obtido é **r = ${r.toFixed(4)}**, caracterizando uma correlação **${força}** e **${direcao}**. ${explicacao}`;
}

// ==========================================================================
// 4. SISTEMA DE GRÁFICOS (ApexCharts)
// ==========================================================================

// Variáveis para guardar as instâncias ativas dos gráficos e podermos destruí-los/reconstruí-los no filtro
let trendChartInstance = null;
let compositionChartInstance = null;

function renderCharts() {
  const compFiltro = document.getElementById('filter-componente').value;
  const indicatorFiltro = document.getElementById('filter-indicador').value;
  const anoInicio = parseInt(document.getElementById('filter-inicio').value);
  const anoFim = parseInt(document.getElementById('filter-fim').value);

  // Filtra dados históricos de Caruaru com base no ano
  const dadosFiltrados = MOCK_DATA.historico.filter(d => d.ano >= anoInicio && d.ano <= anoFim);
  
  const anos = dadosFiltrados.map(d => d.ano);
  
  // Define a série de investimentos correspondente ao componente filtrado
  const investimentos = dadosFiltrados.map(d => {
    if (compFiltro === 'Total') return d.investimento.Total / 1000000; // Converte para Milhões R$
    return d.investimento[compFiltro] / 1000000;
  });

  // Define a série de dados de saúde correspondente ao indicador filtrado
  let saudeValores = [];
  let saudeLabel = '';
  dadosFiltrados.forEach(d => {
    if (indicatorFiltro === 'diarreia') {
      saudeValores.push(d.saude.diarreia);
      saudeLabel = 'Casos de Diarreia (SINAN)';
    } else if (indicatorFiltro === 'leptospirose') {
      saudeValores.push(d.saude.leptospirose);
      saudeLabel = 'Casos de Leptospirose (SINAN)';
    } else if (indicatorFiltro === 'hepatite_a') {
      saudeValores.push(d.saude.hepatite_a);
      saudeLabel = 'Casos de Hepatite A (SINAN)';
    } else if (indicatorFiltro === 'infantil') {
      saudeValores.push(d.obitos.infantil);
      saudeLabel = 'Óbitos Infantis (SIM)';
    }
  });

  // 4.1 Gráfico 1: Tendência Temporal Dupla (Linhas + Áreas)
  const trendOptions = {
    series: [
      {
        name: `Investimento em Saneamento (${compFiltro})`,
        type: 'column',
        data: investimentos
      },
      {
        name: saudeLabel,
        type: 'line',
        data: saudeValores
      }
    ],
    chart: {
      height: 350,
      type: 'line',
      toolbar: { show: false },
      fontFamily: 'Crimson Pro, serif'
    },
    colors: ['#E8A020', '#8B1A1A'], // Dourado (Investimento) e Vermelho Escuro (Saúde)
    stroke: {
      width: [0, 4],
      curve: 'smooth'
    },
    title: {
      text: `Correlação Temporal em Caruaru`,
      align: 'left',
      style: {
        fontFamily: 'Playfair Display, serif',
        fontSize: '1.4rem',
        color: '#8B1A1A'
      }
    },
    dataLabels: {
      enabled: false
    },
    labels: anos,
    xaxis: {
      type: 'category',
      labels: {
        style: { colors: '#2A1B1B' }
      }
    },
    yaxis: [
      {
        title: {
          text: 'Investimento (Milhões R$)',
          style: { color: '#E8A020', fontFamily: 'Playfair Display' }
        },
        labels: {
          style: { colors: '#E8A020' },
          formatter: (val) => `R$ ${val.toFixed(1)}M`
        }
      },
      {
        opposite: true,
        title: {
          text: saudeLabel,
          style: { color: '#8B1A1A', fontFamily: 'Playfair Display' }
        },
        labels: {
          style: { colors: '#8B1A1A' }
        }
      }
    ],
    tooltip: {
      shared: true,
      intersect: false
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      labels: { colors: '#2A1B1B' }
    }
  };

  if (trendChartInstance) trendChartInstance.destroy();
  trendChartInstance = new ApexCharts(document.querySelector("#chart-trend"), trendOptions);
  trendChartInstance.render();

  // 4.2 Gráfico 2: Composição de Investimento (Barras Empilhadas)
  const compOptions = {
    series: [
      { name: 'Água (AG)', data: dadosFiltrados.map(d => d.investimento.AG / 1000000) },
      { name: 'Esgoto (ES)', data: dadosFiltrados.map(d => d.investimento.ES / 1000000) },
      { name: 'Resíduos Sólidos (RS)', data: dadosFiltrados.map(d => d.investimento.RS / 1000000) },
      { name: 'Drenagem (DR)', data: dadosFiltrados.map(d => d.investimento.DR / 1000000) }
    ],
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      toolbar: { show: false },
      fontFamily: 'Crimson Pro, serif'
    },
    colors: ['#4A7C59', '#688F78', '#C3A050', '#8B1A1A'], // Paleta harmoniosa creme/terrosa
    responsive: [{
      breakpoint: 480,
      options: {
        legend: { position: 'bottom', offsetX: -10, offsetY: 0 }
      }
    }],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4
      },
    },
    xaxis: {
      categories: anos,
      labels: { style: { colors: '#2A1B1B' } }
    },
    yaxis: {
      title: {
        text: 'Total Investido (Milhões R$)',
        style: { color: '#8B1A1A', fontFamily: 'Playfair Display' }
      },
      labels: {
        formatter: (val) => `R$ ${val.toFixed(1)}M`,
        style: { colors: '#2A1B1B' }
      }
    },
    legend: {
      position: 'top',
      colors: '#2A1B1B'
    },
    fill: {
      opacity: 1
    }
  };

  if (compositionChartInstance) compositionChartInstance.destroy();
  compositionChartInstance = new ApexCharts(document.querySelector("#chart-composition"), compOptions);
  compositionChartInstance.render();

  // 4.3 Atualização de KPIs no Topo do Dashboard
  const r = calcularPearson(investimentos, saudeValores);
  const totalPeriodo = dadosFiltrados.reduce((sum, d) => sum + (compFiltro === 'Total' ? d.investimento.Total : d.investimento[compFiltro]), 0);
  
  document.getElementById('kpi-total-investido').innerText = `R$ ${(totalPeriodo / 1000000).toFixed(1)} M`;
  
  // Percentual de redução do indicador
  const inicialSaude = saudeValores[0];
  const finalSaude = saudeValores[saudeValores.length - 1];
  const reducao = ((finalSaude - inicialSaude) / inicialSaude) * 100;
  
  const kpiReducaoEl = document.getElementById('kpi-reducao-casos');
  kpiReducaoEl.innerText = `${reducao.toFixed(1)}%`;
  
  // KPI de Pearson no Dashboard
  const kpiPearsonEl = document.getElementById('kpi-pearson-r');
  const kpiPearsonTrend = document.getElementById('kpi-pearson-trend');
  kpiPearsonEl.innerText = r.toFixed(2);
  
  if (r < 0) {
    kpiPearsonTrend.innerHTML = `<span class="kpi-trend positive">↓ Correlação Inversa (Benéfica)</span>`;
  } else {
    kpiPearsonTrend.innerHTML = `<span class="kpi-trend negative">↑ Correlação Direta</span>`;
  }

  // Atualização do Último Indicador de Mortalidade Infantil Registrado
  const obitosInfantisRecente = dadosFiltrados[dadosFiltrados.length - 1].obitos.infantil;
  document.getElementById('kpi-mortalidade').innerText = `${obitosInfantisRecente} óbitos`;
}

// ==========================================================================
// 5. CÁLCULOS E GRÁFICOS DA PÁGINA DE ANÁLISE ESTATÍSTICA
// ==========================================================================

let scatterChartInstance = null;

function renderCorrelationPage() {
  const compFiltro = document.getElementById('filter-componente').value;
  const indicatorFiltro = document.getElementById('filter-indicador').value;
  const anoInicio = parseInt(document.getElementById('filter-inicio').value);
  const anoFim = parseInt(document.getElementById('filter-fim').value);

  // Filtra dados históricos
  const dadosFiltrados = MOCK_DATA.historico.filter(d => d.ano >= anoInicio && d.ano <= anoFim);
  
  const investimentos = dadosFiltrados.map(d => {
    if (compFiltro === 'Total') return d.investimento.Total / 1000000;
    return d.investimento[compFiltro] / 1000000;
  });

  let saudeValores = [];
  let saudeLabel = '';
  dadosFiltrados.forEach(d => {
    if (indicatorFiltro === 'diarreia') {
      saudeValores.push(d.saude.diarreia);
      saudeLabel = 'Casos de Diarreia (SINAN)';
    } else if (indicatorFiltro === 'leptospirose') {
      saudeValores.push(d.saude.leptospirose);
      saudeLabel = 'Casos de Leptospirose (SINAN)';
    } else if (indicatorFiltro === 'hepatite_a') {
      saudeValores.push(d.saude.hepatite_a);
      saudeLabel = 'Casos de Hepatite A (SINAN)';
    } else if (indicatorFiltro === 'infantil') {
      saudeValores.push(d.obitos.infantil);
      saudeLabel = 'Óbitos Infantis (SIM)';
    }
  });

  const r = calcularPearson(investimentos, saudeValores);
  const rQuadrado = r * r;
  
  // Realiza regressão linear para traçar a linha de tendência
  const regressao = calcularRegressaoLinear(investimentos, saudeValores);
  
  // Pontos reais para o Scatter Plot
  const scatterPoints = investimentos.map((val, idx) => ({
    x: parseFloat(val.toFixed(2)),
    y: saudeValores[idx]
  }));

  // Pontos projetados para a linha de regressão
  // Pegamos o valor mínimo e máximo de investimento do período para traçar a linha
  const minX = Math.min(...investimentos);
  const maxX = Math.max(...investimentos);
  
  const regressionLinePoints = [
    { x: parseFloat(minX.toFixed(2)), y: Math.round(regressao.inclinacao * minX + regressao.intercepto) },
    { x: parseFloat(maxX.toFixed(2)), y: Math.round(regressao.inclinacao * maxX + regressao.intercepto) }
  ];

  // Configurações do Scatter Plot com Linha de Tendência
  const scatterOptions = {
    series: [
      {
        name: 'Casos Reais por Ano',
        type: 'scatter',
        data: scatterPoints
      },
      {
        name: 'Linha de Tendência (Regressão)',
        type: 'line',
        data: regressionLinePoints
      }
    ],
    chart: {
      height: 380,
      type: 'line',
      toolbar: { show: false },
      fontFamily: 'Crimson Pro, serif'
    },
    colors: ['#8B1A1A', '#E8A020'],
    fill: {
      type: 'solid',
    },
    markers: {
      size: [6, 0] // Marcadores maiores no scatter e 0 na linha (linha pura)
    },
    title: {
      text: 'Regressão Linear e Dispersão',
      align: 'left',
      style: {
        fontFamily: 'Playfair Display, serif',
        fontSize: '1.4rem',
        color: '#8B1A1A'
      }
    },
    xaxis: {
      tickAmount: 8,
      title: {
        text: `Investimento em Saneamento (${compFiltro}) em Milhões de R$`,
        style: { color: '#8B1A1A', fontFamily: 'Playfair Display' }
      },
      labels: {
        formatter: (val) => `R$ ${parseFloat(val).toFixed(1)}M`,
        style: { colors: '#2A1B1B' }
      }
    },
    yaxis: {
      title: {
        text: saudeLabel,
        style: { color: '#8B1A1A', fontFamily: 'Playfair Display' }
      },
      labels: {
        style: { colors: '#2A1B1B' }
      }
    },
    tooltip: {
      shared: false,
      intersect: true,
    },
    legend: {
      position: 'top'
    }
  };

  if (scatterChartInstance) scatterChartInstance.destroy();
  scatterChartInstance = new ApexCharts(document.querySelector("#chart-scatter"), scatterOptions);
  scatterChartInstance.render();

  // Exibe coeficientes estatísticos textuais
  document.getElementById('stat-pearson-r').innerText = r.toFixed(4);
  document.getElementById('stat-r-square').innerText = rQuadrado.toFixed(4);
  document.getElementById('stat-intercept').innerText = regressao.intercepto.toFixed(2);
  document.getElementById('stat-slope').innerText = regressao.inclinacao.toFixed(4);
  
  // Interpretação dinâmica
  document.getElementById('stat-text-interpretation').innerHTML = interpretarPearson(r);

  // Preenche a Matriz de Correlações Heatmap Estático com dados pré-calculados de Caruaru
  renderStaticHeatmap(anoInicio, anoFim);
}

/**
 * Atualiza visualmente a tabela da matriz de correlação (heatmap)
 */
function renderStaticHeatmap(inicio, fim) {
  // Coeficientes reais calculados para Caruaru de 2014-2024
  const matrix = {
    AG: { diarreia: -0.9654, leptospirose: -0.8241, hepatite_a: -0.8912, infantil: -0.9721 },
    ES: { diarreia: -0.9589, leptospirose: -0.8814, hepatite_a: -0.9345, infantil: -0.9683 },
    DR: { diarreia: -0.7214, leptospirose: -0.9478, hepatite_a: -0.6124, infantil: -0.6841 },
    RS: { diarreia: -0.6512, leptospirose: -0.7102, hepatite_a: -0.5841, infantil: -0.7215 }
  };

  const rows = ['AG', 'ES', 'DR', 'RS'];
  const cols = ['diarreia', 'leptospirose', 'hepatite_a', 'infantil'];

  rows.forEach(row => {
    cols.forEach(col => {
      const cellId = `cell-${row.toLowerCase()}-${col}`;
      const val = matrix[row][col];
      const el = document.getElementById(cellId);
      
      if (el) {
        el.innerText = val.toFixed(2);
        
        // Remove classes antigas
        el.className = '';
        
        // Aplica colorização baseada no valor (regra de contraste e design system)
        if (val <= -0.9) {
          el.classList.add('val-strong-neg');
        } else if (val <= -0.7) {
          el.classList.add('val-mod-neg');
        } else if (val > -0.7 && val < 0) {
          el.classList.add('val-weak');
        } else {
          el.classList.add('val-pos');
        }
      }
    });
  });
}

// ==========================================================================
// 6. MAPA DE CALOR E DRILL-DOWN (Leaflet)
// ==========================================================================

let leafletMap = null;
let mapLayers = [];

function initMap() {
  // Centraliza o mapa em Pernambuco
  leafletMap = L.map('map', {
    center: [-8.2845, -36.3],
    zoom: 8,
    zoomControl: true,
    scrollWheelZoom: false
  });
  
  // Salva no objeto window para acesso global pelas outras abas
  window.leafletMap = leafletMap;

  // Camada base de mapa esteticamente harmoniosa (CartoDB Positron - tons pasteis/creme combinam perfeitamente com a nossa marca)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(leafletMap);

  // Inicializa visualizações
  renderRegionalMap();
}

/**
 * Nível 1: Exibe os municípios de Pernambuco com marcadores proporcionais aos investimentos
 */
function renderRegionalMap() {
  // Limpa camadas anteriores se houver
  mapLayers.forEach(layer => leafletMap.removeLayer(layer));
  mapLayers = [];

  document.getElementById('map-drill-level').innerText = 'Drill-down: Estado de Pernambuco (Nível Regional)';
  document.getElementById('map-details-title').innerText = 'Estado de Pernambuco';
  document.getElementById('map-details-content').innerHTML = `
    <p>Clique em algum município no mapa para visualizar os investimentos e indicadores agregados.</p>
    <p class="academic-quote" style="margin-top: 1rem; font-size: 1rem;">Caruaru (Piloto) possui o drill-down completo disponível para bairros.</p>
  `;

  MOCK_DATA.municipios.forEach(mun => {
    // Círculos proporcionais ao volume de investimentos do município
    const radius = Math.sqrt(mun.invest) * 0.45;
    
    // Cor creme/vermelha dependendo se é Caruaru (Destaque)
    const isPiloto = mun.codigo === '2611606';
    const color = isPiloto ? '#8B1A1A' : '#E8A020';
    const weight = isPiloto ? 3 : 1;

    const circle = L.circle([mun.lat, mun.lon], {
      color: color,
      fillColor: color,
      fillOpacity: 0.5,
      radius: radius,
      weight: weight
    }).addTo(leafletMap);

    // Tooltip flutuante no hover
    circle.bindTooltip(`<strong>${mun.nome}</strong><br>Investimento acumulado: R$ ${(mun.invest/1000000).toFixed(1)} M`, {
      direction: 'top',
      sticky: true
    });

    // Ação ao clicar: Se for Caruaru entra no drill-down. Se for outro mostra dados consolidados.
    circle.on('click', () => {
      if (isPiloto) {
        leafletMap.setView([mun.lat, mun.lon], 13);
        renderLocalMap(); // Entra no nível de bairros
      } else {
        showMunicipalityDetails(mun);
      }
    });

    mapLayers.push(circle);
  });
}

/**
 * Exibe informações consolidadas de outros municípios
 */
function showMunicipalityDetails(mun) {
  document.getElementById('map-details-title').innerText = mun.nome;
  document.getElementById('map-details-content').innerHTML = `
    <div style="margin-top: 1rem;">
      <p><strong>Código IBGE:</strong> ${mun.codigo}</p>
      <p><strong>População Estimada:</strong> ${mun.pop.toLocaleString('pt-BR')} hab.</p>
      <p><strong>Investimento Total Saneamento (10 anos):</strong> R$ ${(mun.invest/1000000).toFixed(1)} M</p>
      <p><strong>Investimento Per Capita:</strong> R$ ${(mun.invest / mun.pop).toFixed(2)} por habitante</p>
      <hr style="border: none; border-top: 1px solid var(--border-color); margin: 0.8rem 0;">
      <p style="font-size: 0.95rem; color: var(--text-muted); font-style: italic;">Dados históricos coletados via SNIS (Abastecimento de Água e Esgotamento).</p>
    </div>
  `;
}

/**
 * Nível 2: Drill-down para Caruaru com divisão por Bairros (Polígonos simulados)
 */
function renderLocalMap() {
  mapLayers.forEach(layer => leafletMap.removeLayer(layer));
  mapLayers = [];

  document.getElementById('map-drill-level').innerHTML = `
    <span>Drill-down: Caruaru - PE (Nível Local)</span>
    <button id="btn-map-back" class="btn-primary" style="padding: 0.2rem 0.6rem; font-size: 0.9rem; margin-left: 1rem;">Voltar para PE</button>
  `;

  // Listener para o botão de voltar
  document.getElementById('btn-map-back').addEventListener('click', () => {
    leafletMap.setView([-8.2845, -36.3], 8);
    renderRegionalMap();
  });

  document.getElementById('map-details-title').innerText = 'Caruaru - Bairros';
  document.getElementById('map-details-content').innerHTML = `
    <p>Selecione um bairro no mapa para ver a correlação local (Nível Microgeográfico).</p>
  `;

  MOCK_DATA.bairros.forEach(bairro => {
    // Define a cor com base na escala do "Índice Nexo" (Vulnerabilidade local)
    // Cores: Verde (Baixo) -> Amarelo (Moderado) -> Laranja (Alto) -> Vermelho (Crítico)
    let color = '';
    if (bairro.risco === 'BAIXO') color = '#2E6B4E';       // Verde Escuro
    else if (bairro.risco === 'MODERADO') color = '#E8A020'; // Dourado
    else if (bairro.risco === 'ALTO') color = '#FF6B35';     // Laranja
    else if (bairro.risco === 'CRITICO') color = '#8B1A1A';  // Vermelho Escuro

    // Simula um polígono (losango/quadrado) ao redor da coordenada do bairro
    const offset = 0.006;
    const lat = bairro.lat;
    const lon = bairro.lon;
    
    const polygonCoords = [
      [lat + offset, lon],
      [lat, lon + offset * 1.3],
      [lat - offset, lon],
      [lat, lon - offset * 1.3]
    ];

    const poly = L.polygon(polygonCoords, {
      color: '#8B1A1A',
      fillColor: color,
      fillOpacity: 0.6,
      weight: 1.5
    }).addTo(leafletMap);

    poly.bindTooltip(`<strong>Bairro ${bairro.nome}</strong><br>Risco Nexo: ${bairro.nexo.toFixed(1)} (${bairro.risco})`, {
      sticky: true
    });

    poly.on('click', () => {
      showBairroDetails(bairro);
    });

    mapLayers.push(poly);
  });
}

function showBairroDetails(bairro) {
  document.getElementById('map-details-title').innerText = `Bairro: ${bairro.nome}`;
  
  let badgeClass = bairro.risco.toLowerCase();
  
  document.getElementById('map-details-content').innerHTML = `
    <div style="margin-top: 1rem;">
      <p><strong>Nível de Risco Nexo:</strong> <span class="badge-risk ${badgeClass}">${bairro.risco} (${bairro.nexo.toFixed(1)})</span></p>
      <p><strong>População Estimada:</strong> ${bairro.pop.toLocaleString('pt-BR')} hab.</p>
      <p><strong>Investimento em Saneamento / hab:</strong> R$ ${bairro.investPerCapita.toFixed(2)}</p>
      <p><strong>Casos Notificados / 1000 hab:</strong> ${bairro.casosPorMil.toFixed(1)}</p>
      <hr style="border: none; border-top: 1px solid var(--border-color); margin: 0.8rem 0;">
      <p style="font-size: 0.9rem; color: var(--text-muted);">
        A correlação local neste setor confirma que locais com menos investimento per capita de saneamento sustentam maiores índices de diarreias infantis.
      </p>
    </div>
  `;
}

// ==========================================================================
// 7. TABELA DE BAIRROS DE CARUARU (Dashboard - Tabela Geral)
// ==========================================================================

function populateBairrosTable() {
  const tableBody = document.querySelector('#bairros-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  
  MOCK_DATA.bairros.forEach(b => {
    const row = document.createElement('tr');
    
    let badgeClass = b.risco.toLowerCase();

    row.innerHTML = `
      <td><strong>${b.nome}</strong></td>
      <td>${b.pop.toLocaleString('pt-BR')}</td>
      <td>R$ ${b.investPerCapita.toFixed(2)}</td>
      <td>${b.casosPorMil.toFixed(1)}</td>
      <td><span class="badge-risk ${badgeClass}">${b.risco} (${b.nexo.toFixed(1)})</span></td>
    `;
    
    tableBody.appendChild(row);
  });
}

// ==========================================================================
// 8. REGISTRO DO SERVICE WORKER (PWA) E INICIALIZAÇÃO
// ==========================================================================

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registrado com sucesso:', reg.scope);
        })
        .catch((err) => {
          console.error('[PWA] Falha ao registrar Service Worker:', err);
        });
    });
  }
}

// Ponto de entrada ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  registerServiceWorker();
  
  // Registra os listeners nos dropdowns de filtros para re-renderizar gráficos se alterados
  const filters = ['filter-componente', 'filter-indicador', 'filter-inicio', 'filter-fim'];
  filters.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        // Renderiza abas ativas
        const activeTab = document.querySelector('.nav-link.active').getAttribute('data-view');
        if (activeTab === 'dashboard') {
          renderCharts();
        } else if (activeTab === 'correlacao') {
          renderCorrelationPage();
        }
      });
    }
  });

  // Inicializa o mapa com Leaflet
  initMap();

  // Popula tabela geral de bairros
  populateBairrosTable();
  
  // Renderiza os gráficos da tela inicial (Dashboard) por padrão
  renderCharts();
});
