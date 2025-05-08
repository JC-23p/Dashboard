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
        
        // 2. Configurar eventos de filtros
        document.getElementById('client-filter').addEventListener('change', updateDashboard);
        document.getElementById('year-filter').addEventListener('change', updateDashboard);
        
        // 3. Primera carga (esto inicializará los gráficos)
        updateDashboard();

    } catch (error) {
        console.error('Error inicial:', error);
        alert('Error al cargar los datos. Revisa la consola para más detalles.');
    }
});

// Función para actualizar todo el dashboard
function updateDashboard() {
    try {
        const client = document.getElementById('client-filter').value;
        const year = document.getElementById('year-filter').value;
        
        if (!currentData[client] || !currentData[client][year]) {
            throw new Error(`No hay datos para ${client} en ${year}`);
        }
        
        const filteredData = currentData[client][year];
        
        // Destruir gráficos existentes si hay
        if (charts.evolution) charts.evolution.destroy();
        if (charts.distribution) charts.distribution.destroy();
        
        // Crear nuevos gráficos
        initCharts(filteredData, client, year);
        updateKPIs(filteredData);
        
    } catch (error) {
        console.error('Error en updateDashboard:', error);
    }
}

// Función para inicializar gráficos (ahora recibe parámetros)
function initCharts(data, client, year) {
    const ctxEvolution = document.getElementById('evolution-chart').getContext('2d');
    const ctxDistribution = document.getElementById('distribution-chart').getContext('2d');
    
    // Gráfico de evolución
    charts.evolution = new Chart(ctxEvolution, {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].slice(0, data.totals.length),
            datasets: [{
                label: `Total desarrolladores (${client}, ${year})`,
                data: data.totals,
                borderColor: '#2E86AB',
                backgroundColor: 'rgba(46, 134, 171, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Gráfico de distribución (solo para "all")
    if (client === 'all' && data.clients && data.clientsData) {
        charts.distribution = new Chart(ctxDistribution, {
            type: 'bar',
            data: {
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
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// Actualiza las tarjetas de KPIs (igual que antes)
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