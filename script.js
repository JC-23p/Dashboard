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