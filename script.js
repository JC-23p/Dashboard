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
    monthFrom = parseInt(monthFrom) - 1;
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
}

// Actualizar gráficos
function updateCharts(data, client, yearFrom, yearTo) {
    console.log("Actualizando gráficos...");
    const ctxEvolution = document.getElementById('evolution-chart');
    const ctxDistribution = document.getElementById('distribution-chart');
    
    // Destruir gráficos existentes
    if (charts.evolution) charts.evolution.destroy();
    if (charts.distribution) charts.distribution.destroy();
    
    // Preparar labels para el eje X
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const labels = [];
    
    // Generar labels para el rango seleccionado
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
    // En la función updateCharts, modifica las opciones del gráfico evolutivo:
charts.evolution = new Chart(ctxEvolution, {
    type: 'line',
    data: { /* ... tus datos ... */ },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 20,
                bottom: 30,
                left: 20,
                right: 20
            }
        },
        plugins: {
            legend: {
                position: 'top',
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                ticks: {
                    precision: 0
                }
            },
            x: {
                ticks: {
                    autoSkip: false,
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        }
    }
});
    
    // 1. Gráfico de evolución con 3 series
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
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 20,
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: 'Evolución mensual',
                    font: { size: 14 }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Cantidad de desarrolladores'
                    }
                }
            }
        }
    });
    
    // 2. Gráfico de torta para distribución
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
                cutout: '70%'
            }
        });
        document.querySelector('.chart-message').style.display = 'none';
    } else {
        document.querySelector('.chart-message').style.display = 'block';
    }
}

// Función para ajustar dinámicamente la altura
function adjustChartHeight() {
    const container = document.querySelector('#evolution-container');
    const aspectRatio = 16 / 9; // Proporción deseada
    const width = container.clientWidth;
    container.style.height = `${width / aspectRatio}px`;
    
    if (charts.evolution) {
        charts.evolution.resize();
    }
}

// Ejecutar al cargar y al redimensionar
window.addEventListener('load', adjustChartHeight);
window.addEventListener('resize', adjustChartHeight);