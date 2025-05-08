// Variables globales
let currentData = {};
let charts = {
    evolution: null,
    distribution: null
};

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Cargar datos
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error('Error al cargar data.json');
        currentData = await response.json();
        console.log('Datos cargados:', currentData);

        // 2. Inicializar gráficos
        initCharts();
        
        // 3. Configurar eventos de filtros
        document.getElementById('client-filter').addEventListener('change', updateDashboard);
        document.getElementById('year-filter').addEventListener('change', updateDashboard);
        
        // 4. Primera carga
        updateDashboard();

    } catch (error) {
        console.error('Error inicial:', error);
        alert('Error al cargar los datos. Revisa la consola para más detalles.');
    }
});

// Función para inicializar gráficos
function initCharts() {
    const ctxEvolution = document.getElementById('evolution-chart');
    const ctxDistribution = document.getElementById('distribution-chart');

    charts.evolution = new Chart(ctxEvolution, {
        type: 'line',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolución Mensual de Desarrolladores'
                }
            }
        }
    });

    charts.distribution = new Chart(ctxDistribution, {
        type: 'bar',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución por Cliente'
                }
            }
        }
    });
}

// Actualiza todo el dashboard con los filtros
function updateDashboard() {
    try {
        const client = document.getElementById('client-filter').value;
        const year = document.getElementById('year-filter').value;
        
        console.log(`Filtrando por: ${client}, ${year}`);
        
        if (!currentData[client] || !currentData[client][year]) {
            throw new Error(`No hay datos para ${client} en ${year}`);
        }
        
        const filteredData = currentData[client][year];
        updateKPIs(filteredData);
        updateCharts(filteredData, client, year);
        
    } catch (error) {
        console.error('Error en updateDashboard:', error);
    }
}

// Actualiza las tarjetas de KPIs
function updateKPIs(data) {
    const lastIndex = data.totals.length - 1;
    
    document.getElementById('total').textContent = data.totals[lastIndex];
    document.getElementById('hired').textContent = data.hired[lastIndex];
    document.getElementById('exits').textContent = data.exits[lastIndex];
    
    // Calcular tasa de rotación
    const prevMonth = data.totals[lastIndex - 1] || data.totals[lastIndex];
    const avg = (data.totals[lastIndex] + prevMonth) / 2;
    const rotation = ((data.exits[lastIndex] / avg) * 100).toFixed(1);
    document.getElementById('rotation').textContent = `${rotation}%`;
}

// Actualiza los gráficos
function updateCharts(data, client, year) {
    // Gráfico de evolución
    charts.evolution.data = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].slice(0, data.totals.length),
        datasets: [{
            label: `Total desarrolladores (${client}, ${year})`,
            data: data.totals,
            borderColor: '#2E86AB',
            backgroundColor: 'rgba(46, 134, 171, 0.1)',
            fill: true,
            tension: 0.3
        }]
    };
    
    // Gráfico de distribución (solo para "all")
    if (client === 'all' && data.clients && data.clientsData) {
        charts.distribution.data = {
            labels: data.clients,
            datasets: [{
                label: 'Desarrolladores por cliente',
                data: data.clientsData,
                backgroundColor: [
                    '#2E86AB',
                    '#4CB944',
                    '#E94F64',
                    '#FFD166'
                ]
            }]
        };
    }
    
    // Actualizar ambos gráficos
    charts.evolution.update();
    charts.distribution.update();
}