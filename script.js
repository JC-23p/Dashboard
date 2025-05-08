// Datos simulados (puedes reemplazar con fetch('data.json') luego
const data = {
    months: ['Ene-23', 'Feb-23', 'Mar-23', 'Abr-23', 'May-23', 'Jun-23'],
    totals: [85, 92, 98, 105, 110, 115],
    hired: [6, 5, 7, 8, 4, 6],
    exits: [3, 2, 4, 3, 5, 4],
    clients: ['Cliente A', 'Cliente B', 'Cliente C', 'Otros'],
    clientsData: [32, 28, 25, 27]
};

// Gráfico de Evolución
const ctxEvolution = document.getElementById('evolution-chart').getContext('2d');
new Chart(ctxEvolution, {
    type: 'line',
    data: {
        labels: data.months,
        datasets: [{
            label: 'Total de desarrolladores',
            data: data.totals,
            borderColor: '#2E86AB',
            tension: 0.3,
            fill: true
        }]
    }
});

// Gráfico de Distribución
const ctxDistribution = document.getElementById('distribution-chart').getContext('2d');
new Chart(ctxDistribution, {
    type: 'bar',
    data: {
        labels: data.clients,
        datasets: [{
            label: 'Desarrolladores',
            data: data.clientsData,
            backgroundColor: ['#2E86AB', '#4CB944', '#E94F64', '#FFD166']
        }]
    }
});

// Variables globales
let currentData = {};
let charts = {}; // Almacena instancias de gráficos

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar datos
  const response = await fetch('data.json');
  currentData = await response.json();
  
  // Inicializar gráficos
  initCharts();
  
  // Configurar event listeners para filtros
  document.getElementById('client-filter').addEventListener('change', updateDashboard);
  document.getElementById('year-filter').addEventListener('change', updateDashboard);
});

// Función para actualizar todo el dashboard
function updateDashboard() {
  const client = document.getElementById('client-filter').value;
  const year = document.getElementById('year-filter').value;
  
  // Filtrar datos
  const filteredData = currentData[client][year];
  
  // Actualizar KPIs
  updateKPIs(filteredData);
  
  // Actualizar gráficos
  updateCharts(filteredData);
}

// Actualiza los números de las tarjetas
function updateKPIs(data) {
  const lastMonthIndex = data.totals.length - 1;
  
  document.getElementById('total').textContent = data.totals[lastMonthIndex];
  document.getElementById('hired').textContent = data.hired[lastMonthIndex];
  document.getElementById('exits').textContent = data.exits[lastMonthIndex];
  
  // Calcular rotación
  const avg = (data.totals[lastMonthIndex] + data.totals[lastMonthIndex - 1]) / 2;
  const rotation = ((data.exits[lastMonthIndex] / avg) * 100).toFixed(1);
  document.getElementById('rotation').textContent = `${rotation}%`;
}

// Función para inicializar gráficos
function initCharts() {
  const ctxEvolution = document.getElementById('evolution-chart');
  const ctxDistribution = document.getElementById('distribution-chart');
  
  charts.evolution = new Chart(ctxEvolution, {
    type: 'line',
    options: { responsive: true, maintainAspectRatio: false }
  });
  
  charts.distribution = new Chart(ctxDistribution, {
    type: 'bar',
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// Actualiza gráficos con nuevos datos
function updateCharts(data) {
  // Gráfico de evolución
  charts.evolution.data = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [{
      label: 'Total desarrolladores',
      data: data.totals,
      borderColor: '#2E86AB',
      fill: true
    }]
  };
  
  // Gráfico de distribución (ejemplo estático)
  charts.distribution.data = {
    labels: ['Cliente A', 'Cliente B', 'Cliente C', 'Otros'],
    datasets: [{
      label: 'Desarrolladores',
      data: [32, 28, 25, 27],
      backgroundColor: ['#2E86AB', '#4CB944', '#E94F64', '#FFD166']
    }]
  };
  
  // Actualizar ambos gráficos
  charts.evolution.update();
  charts.distribution.update();
}