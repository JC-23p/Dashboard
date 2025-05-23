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
        
        // Remover listeners antiguos (si existen) antes de agregar nuevos
        ['client-filter', 'year-from', 'month-from', 'year-to', 'month-to'].forEach(id => {
            const element = document.getElementById(id);
            element.removeEventListener('change', updateDashboard); // Limpiar primero
            element.addEventListener('change', updateDashboard);
        });
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
        clientsData: [] // Se calculará dinámicamente
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
                
                // NUEVA LÓGICA: Agregar distribución por mes si existe
                if (clientData[year].clientsData && clientData[year].clientsData[month]) {
                    result.clientsData.push(clientData[year].clientsData[month]);
                }
            }
        }
    }

    return result;
}

// NUEVA FUNCIÓN: Calcular rotación anual
function calculateAnnualRotation(clientData, year) {
    if (!clientData[year]) return '-';
    
    // Sumar todas las bajas del año
    const totalExitsYear = clientData[year].exits.reduce((sum, exits) => sum + exits, 0);
    
    // Calcular promedio de activos del año (solo meses con datos > 0)
    const activeTotals = clientData[year].totals.filter(total => total > 0);
    if (activeTotals.length === 0) return '-';
    
    const avgActiveYear = activeTotals.reduce((sum, total) => sum + total, 0) / activeTotals.length;
    
    if (avgActiveYear === 0) return '-';
    
    const annualRotation = (totalExitsYear / avgActiveYear) * 100;
    
    console.log(`Rotación anual ${year}: ${totalExitsYear} bajas / ${avgActiveYear.toFixed(1)} promedio = ${annualRotation.toFixed(1)}%`);
    
    return annualRotation.toFixed(1) + '%';
}

// Actualizar dashboard completo - MODIFICADO para pasar año
function updateDashboard() {
    try {
        const client = document.getElementById('client-filter').value;
        const yearFrom = document.getElementById('year-from').value;
        const monthFrom = document.getElementById('month-from').value;
        const yearTo = document.getElementById('year-to').value;
        const monthTo = document.getElementById('month-to').value;

        console.log("Ejecutando updateDashboard...");
        console.log(`Filtrando por: ${client}, ${yearFrom}-${monthFrom} a ${yearTo}-${monthTo}`);
        
        const clientData = currentData[client];
        if (!clientData) throw new Error(`No hay datos para ${client}`);
        
        const filteredData = filterByDateRange(clientData, yearFrom, monthFrom, yearTo, monthTo);
        
        console.log("Datos finales:", filteredData);
        updateKPIs(filteredData, clientData, yearTo); // PASAR clientData y año
        updateCharts(filteredData, client, yearFrom, yearTo, monthTo);
        
    } catch (error) {
        console.error('Error en updateDashboard:', error, error.stack);
    }
}

// Actualizar KPIs - MODIFICADO para incluir rotación anual
function updateKPIs(data, clientData, currentYear) {
    if (data.totals.length === 0) {
        document.getElementById('total').textContent = '-';
        document.getElementById('hired').textContent = '-';
        document.getElementById('exits').textContent = '-';
        document.getElementById('rotation').textContent = '-';
        document.getElementById('annual-rotation').textContent = '-';
        return;
    }

    const lastIndex = data.totals.length - 1;
    const total = data.totals[lastIndex];
    const hired = data.hired[lastIndex];
    const exits = data.exits[lastIndex];
    
    // Calcular rotación mensual (EXISTENTE - sin cambios)
    let rotation = '-';
    if (data.totals.length > 1) {
        const prevTotal = data.totals[lastIndex - 1] || total;
        rotation = ((exits / ((total + prevTotal) / 2)) * 100).toFixed(1) + '%';
    }
    
    // Calcular rotación anual (NUEVA)
    const annualRotation = calculateAnnualRotation(clientData, currentYear);
    
    // Actualizar DOM - AGREGADO annual-rotation
    document.getElementById('total').textContent = total;
    document.getElementById('hired').textContent = hired;
    document.getElementById('exits').textContent = exits;
    document.getElementById('rotation').textContent = rotation;
    document.getElementById('annual-rotation').textContent = annualRotation;
    
    console.log("KPIs actualizados:", {total, hired, exits, rotation, annualRotation});
}

// FUNCIÓN NUEVA: Calcular distribución dinámicamente
function calculateDistributionForMonth(year, month) {
    if (!currentData.equifax || !currentData.honeywell) {
        console.warn("No se encontraron datos de equifax o honeywell");
        return [0, 0];
    }
    
    const equifaxTotal = currentData.equifax[year]?.totals[month] || 0;
    const honeywellTotal = currentData.honeywell[year]?.totals[month] || 0;
    
    console.log(`Distribución ${year}-${month + 1}: Equifax=${equifaxTotal}, Honeywell=${honeywellTotal}`);
    
    return [equifaxTotal, honeywellTotal];
}



// Actualizar gráficos - MODIFICADO
function updateCharts(data, client, yearFrom, yearTo, monthTo) {
    console.log("Actualizando gráficos...");
    const ctxEvolution = document.getElementById('evolution-chart');
    const ctxDistribution = document.getElementById('distribution-chart');
    
    // Destruir gráficos existentes CON VALIDACIÓN
    if (charts.evolution && typeof charts.evolution.destroy === 'function') {
        charts.evolution.destroy();
        charts.evolution = null;
    }
    if (charts.distribution && typeof charts.distribution.destroy === 'function') {
        charts.distribution.destroy();
        charts.distribution = null;
    }
    
    // Limpiar el canvas (opcional pero recomendado)
    ctxEvolution.width = ctxEvolution.offsetWidth;
    ctxEvolution.height = ctxEvolution.offsetHeight;
    
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
                    label: 'Total Activos ',
                    data: data.totals,
                    borderColor: '#2E86AB',
                    backgroundColor: 'rgba(46, 134, 171, 0.1)',
                    tension: 0.3,
                    borderWidth: 3,
                    fill: true
                },
                {
                    label: 'Altas ',
                    data: data.hired,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 3],
                    tension: 0
                },
                {
                    label: 'Bajas ',
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
            maintainAspectRatio: false, // ¡Importante! Permite ajustar altura libremente
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Evolución mensual'
                }
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 20,
                    left: 10,
                    right: 10
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        display: true
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // 2. Gráfico de torta para distribución (solo para "all") - MODIFICADO
    if (client === "all" && data.clients) {
        // CALCULAR DISTRIBUCIÓN DINÁMICAMENTE PARA EL MES FINAL
        const finalYear = parseInt(yearTo);
        const finalMonth = parseInt(monthTo) - 1; // Convertir a índice 0-based
        
        const distributionData = calculateDistributionForMonth(finalYear, finalMonth);
        
        console.log(`Usando distribución para ${finalYear}-${finalMonth + 1}:`, distributionData);
        
        charts.distribution = new Chart(ctxDistribution, {
            type: 'doughnut',
            data: {
                labels: data.clients,
                datasets: [{
                    data: distributionData, // USAR DISTRIBUCIÓN CALCULADA DINÁMICAMENTE
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
                                const total = distributionData.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : '0';
                                return `${context.label}: ${context.raw} (${percentage}%)`;
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