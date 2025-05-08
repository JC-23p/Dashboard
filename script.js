// Variables globales
let currentData = {};
let charts = {
    evolution: null,
    distribution: null
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Cargar datos
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error('Error al cargar datos');
        currentData = await response.json();
        
        // 2. Configurar eventos
        document.getElementById('client-filter').addEventListener('change', updateDashboard);
        document.getElementById('year-filter').addEventListener('change', updateDashboard);
        
        // 3. Carga inicial
        updateDashboard();
    } catch (error) {
        console.error('Error:', error);
    }
});

// Actualizar dashboard
function updateDashboard() {
    try {
        const client = document.getElementById('client-filter').value;
        const year = document.getElementById('year-filter').value;
        const filteredData = currentData[client]?.[year];
        
        if (!filteredData) return;
        
        // 1. Actualizar KPIs
        updateKPIs(filteredData);
        
        // 2. Actualizar gráficos
        updateCharts(filteredData, client, year);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Actualizar KPIs
function updateKPIs(data) {
    const lastIndex = data.totals.length - 1;
    const total = data.totals[lastIndex];
    const hired = data.hired[lastIndex];
    const exits = data.exits[lastIndex];
    
    // Calcular rotación
    const prevTotal = data.totals[lastIndex - 1] || total;
    const rotation = ((exits / ((total + prevTotal) / 2)) * 100).toFixed(1);
    
    // Actualizar DOM
    document.getElementById('total').textContent = total;
    document.getElementById('hired').textContent = hired;
    document.getElementById('exits').textContent = exits;
    document.getElementById('rotation').textContent = `${rotation}%`;
}

// Actualizar gráficos
function updateCharts(data, client, year) {
    const ctxEvolution = document.getElementById('evolution-chart');
    const ctxDistribution = document.getElementById('distribution-chart');
    
    // Destruir gráficos existentes
    if (charts.evolution) charts.evolution.destroy();
    if (charts.distribution) charts.distribution.destroy();
    
    // 1. Gráfico de evolución (siempre visible)
    charts.evolution = new Chart(ctxEvolution, {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].slice(0, data.totals.length),
            datasets: [{
                label: `Total (${client}, ${year})`,
                data: data.totals,
                borderColor: '#2E86AB',
                backgroundColor: 'rgba(46, 134, 171, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // 2. Gráfico de distribución (solo para "all")
    if (client === 'all' && data.clients && data.clientsData) {
        charts.distribution = new Chart(ctxDistribution, {
            type: 'bar',
            data: {
                labels: data.clients,
                datasets: [{
                    label: 'Desarrolladores',
                    data: data.clientsData,
                    backgroundColor: ['#2E86AB', '#4CB944', '#E94F64', '#FFD166']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
        document.querySelector('.chart-message').style.display = 'none';
    } else {
        document.querySelector('.chart-message').style.display = 'block';
    }
}