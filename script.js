// Variables globales
let currentData = {};
let charts = {
    evolution: null,
    distribution: null
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log("Cargando datos...");
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error('Error al cargar data.json');
        currentData = await response.json();
        console.log("Datos cargados:", currentData);
        
        // Configurar eventos
        ['client-filter', 'year-from', 'month-from', 'year-to', 'month-to'].forEach(id => {
            document.getElementById(id).addEventListener('change', updateDashboard);
        });
        
        // Carga inicial
        updateDashboard();
    } catch (error) {
        console.error('Error inicial:', error);
        alert('Error al cargar los datos. Ver consola.');
    }
});

// Función para filtrar por rango de fechas
function filterByDateRange(clientData, yearFrom, monthFrom, yearTo, monthTo) {
    const result = {
        totals: [],
        hired: [],
        exits: [],
        clients: clientData[yearFrom]?.clients || [],
        clientsData: clientData[yearFrom]?.clientsData || []
    };

    // Convertir a números
    yearFrom = parseInt(yearFrom);
    monthFrom = parseInt(monthFrom) - 1; // Ajustar a índice 0-based
    yearTo = parseInt(yearTo);
    monthTo = parseInt(monthTo) - 1;

    // Validar rango
    if (yearFrom > yearTo || (yearFrom === yearTo && monthFrom > monthTo)) {
        alert("La fecha de inicio debe ser anterior a la fecha de fin");
        return result;
    }

    // Iterar por cada año y mes en el rango
    for (let year = yearFrom; year <= yearTo; year++) {
        if (!clientData[year]) continue;
        
        const startMonth = (year === yearFrom) ? monthFrom : 0;
        const endMonth = (year === yearTo) ? monthTo : 11;
        
        for (let month = startMonth; month <= endMonth; month++) {
            if (clientData[year].totals[month] !== undefined) {
                result.totals.push(clientData[year].totals[month]);
                result.hired.push(clientData[year].hired[month]);
                result.exits.push(clientData[year].exits[month]);
            }
        }
    }

    return result;
}

// Actualizar dashboard completo
function updateDashboard() {
    try {
        const client = document.getElementById('client-filter').value;
        const yearFrom = document.getElementById('year-from').value;
        const monthFrom = document.getElementById('month-from').value;
        const yearTo = document.getElementById('year-to').value;
        const monthTo = document.getElementById('month-to').value;

        console.log(`Filtrando por: ${client}, ${yearFrom}-${monthFrom} a ${yearTo}-${monthTo}`);
        
        const clientData = currentData[client];
        if (!clientData) throw new Error(`No hay datos para ${client}`);
        
        const filteredData = filterByDateRange(clientData, yearFrom, monthFrom, yearTo, monthTo);
        
        console.log("Datos finales:", filteredData);
        updateKPIs(filteredData);
        updateCharts(filteredData, client, yearFrom, yearTo);
        
    } catch (error) {
        console.error('Error en updateDashboard:', error);
    }
}

// Actualizar KPIs
function updateKPIs(data) {
    if (data.totals.length === 0) {
        document.getElementById('total').textContent = '-';
        document.getElementById('hired').textContent = '-';
        document.getElementById('exits').textContent = '-';
        document.getElementById('rotation').textContent = '-';
        return;
    }

    const lastIndex = data.totals.length - 1;
    const total = data.totals[lastIndex];
    const hired = data.hired[lastIndex];
    const exits = data.exits[lastIndex];
    
    // Calcular rotación
    let rotation = '-';
    if (data.totals.length > 1) {
        const prevTotal = data.totals[lastIndex - 1] || total;
        rotation = ((exits / ((total + prevTotal) / 2)) * 100).toFixed(1) + '%';
    }
    
    // Actualizar DOM
    document.getElementById('total').textContent = total;
    document.getElementById('hired').textContent = hired;
    document.getElementById('exits').textContent = exits;
    document.getElementById('rotation').textContent = rotation;
    
    console.log("KPIs actualizados:", {total, hired, exits, rotation});
}

// Actualizar gráficos
function updateCharts(data, client, yearFrom, yearTo) {
    console.log("Actualizando gráficos...");
    const ctxEvolution = document.getElementById('evolution-chart');
    const ctxDistribution = document.getElementById('distribution-chart');
    console.log("Datos para gráfico:", data); // Verifica que los datos lleguen bien

    // Destruir gráficos existentes
    if (charts.evolution) charts.evolution.destroy();
    if (charts.distribution) charts.distribution.destroy();
    
    // Preparar labels para el eje X (se mantiene igual)
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const labels = [];
    
    if (data.totals.length <= 1) {
        const monthIndex = parseInt(document.getElementById('month-from').value) - 1;
        labels.push(`${monthLabels[monthIndex]} ${yearFrom}`);
    } else {
        let currentYear = parseInt(yearFrom);
        let currentMonth = parseInt(document.getElementById('month-from').value) - 1;
        
        for (let i = 0; i < data.totals.length; i++) {
            labels.push(`${monthLabels[currentMonth]} ${currentYear}`);
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
        }
    }
    function adjustChartHeight() {
    const container = document.querySelector('#evolution-container');
    const aspectRatio = 16 / 9; // Proporción deseada (16:9)
    const width = container.clientWidth;
    container.style.height = `${width / aspectRatio}px`;
    
    if (charts.evolution) {
        charts.evolution.resize();
    }
}

  // 1. Gráfico de evolución con 3 series y UN SOLO EJE
    charts.evolution = new Chart(ctxEvolution, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Totales',
                    data: data.totals,
                    borderColor: '#2E86AB',
                    backgroundColor: 'rgba(46, 134, 171, 0.1)',
                    tension: 0.3,
                    borderWidth: 3,
                    fill: true
                },
                {
                    label: 'Entradas',
                    data: data.hired,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 3],
                    tension: 0
                },
                {
                    label: 'Salidas',
                    data: data.exits,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    tension: 0
                }
            ]
        },
        
    });
    
    // 2. Gráfico de torta para distribución (solo para "all")
    if (client === "all" && data.clients && data.clientsData) {
        charts.distribution = new Chart(ctxDistribution, {
            type: 'doughnut',
            data: {
                labels: data.clients,
                datasets: [{
                    data: data.clientsData,
                    backgroundColor: [
                        '#2E86AB', '#4CB944', '#E94F64', '#FFD166'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20
                        }
                    },
                    title: {
                        display: true,
                        text: `Distribución ${labels[labels.length-1]}`,
                        font: { size: 14 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw} (${Math.round(context.parsed)}%)`;
                            }
                        }
                    }
                },
                cutout: '70%',
                scales: {} // Sin ejes
            }
        });
        document.querySelector('.chart-message').style.display = 'none';
    } else {
        document.querySelector('.chart-message').style.display = 'block';
    }
    
    console.log("Gráficos actualizados");
}

// Redimensionar al cambiar ventana
window.addEventListener('resize', () => {
    if (charts.evolution) charts.evolution.resize();
    if (charts.distribution) charts.distribution.resize();
});