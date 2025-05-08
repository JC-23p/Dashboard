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
        
        // 3. Redimensionar al cambiar ventana
        window.addEventListener('resize', () => {
            if (charts.evolution) charts.evolution.resize();
            if (charts.distribution) charts.distribution.resize();
        });
        
        // 4. Carga inicial
        updateDashboard();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos. Ver consola.');
    }
});

// Actualizar dashboard
function updateDashboard() {
    try {
        const client = document.getElementById('client-filter').value;
        const year = document.getElementById('year-filter').value;
        const month = document.getElementById('month-filter').value;
        
        const filteredData = currentData[client]?.[year];
        if (!filteredData) throw new Error('Datos no disponibles');
        
        // Actualizar selector de meses
        if (month === "all") {
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                          .slice(0, filteredData.totals.length);
            populateMonthFilter(months);
        }
        
        // Filtrar por mes si es necesario
        const finalData = month === "all" ? filteredData : filterDataByMonth(filteredData, month);
        
        updateKPIs(finalData);
        updateCharts(finalData, client, year, month);
        
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
function updateCharts(data, client, year, month) {
    
    function updateCharts(data, client, year, month) {
        const ctxEvolution = document.getElementById('evolution-chart');
        const ctxDistribution = document.getElementById('distribution-chart');
        
        // Destruir gráficos existentes
        if (charts.evolution) charts.evolution.destroy();
        if (charts.distribution) charts.distribution.destroy();
        
        // Configurar labels según filtro
        const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const labels = month === "all" 
            ? monthLabels.slice(0, data.totals.length)
            : [`${monthLabels[month]} ${year}`];
        
        // 1. Gráfico de evolución
        charts.evolution = new Chart(ctxEvolution, {
            type: month === "all" ? 'line' : 'bar', // Cambia a barra para un solo mes
            data: {
                labels: labels,
                datasets: [{
                    label: client === "all" ? `Total (${year})` : `Total (${client})`,
                    data: month === "all" ? data.totals : [data.totals[0]],
                    borderColor: '#2E86AB',
                    backgroundColor: month === "all" 
                        ? 'rgba(46, 134, 171, 0.1)' 
                        : '#2E86AB',
                    fill: month === "all",
                    tension: 0.3,
                    borderWidth: month === "all" ? 2 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
        
        // 2. Gráfico de distribución (solo para "all" y si hay datos)
        if (client === "all" && data.clients && data.clientsData) {
            charts.distribution = new Chart(ctxDistribution, {
                type: 'bar',
                data: {
                    labels: data.clients,
                    datasets: [{
                        label: 'Distribución',
                        data: data.clientsData,
                        backgroundColor: ['#2E86AB', '#4CB944', '#E94F64', '#FFD166'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw} devs (${Math.round(context.raw/data.totals[0]*100)}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
            document.querySelector('.chart-message').style.display = 'none';
        } else {
            document.querySelector('.chart-message').style.display = 'block';
        }
        
        // Ajuste final para gráfico de un solo mes
        if (month !== "all") {
            charts.evolution.options.scales.x.ticks = {
                callback: function() { return monthLabels[month] + ' ' + year; }
            };
            charts.evolution.update();
        }
    } 

// Configuración común de gráficos
function getChartOptions(title) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: title,
                font: { size: 14 },
                padding: { top: 10, bottom: 15 }
            }
        },
        scales: {
            y: { beginAtZero: false }
        },
        layout: {
            padding: { top: 5, bottom: 5, left: 10, right: 10 }
        }
    };
}