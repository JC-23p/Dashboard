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
        document.getElementById('client-filter').addEventListener('change', updateDashboard);
        document.getElementById('year-filter').addEventListener('change', updateDashboard);
        document.getElementById('month-filter').addEventListener('change', updateDashboard);
        
        // Carga inicial
        updateDashboard();
    } catch (error) {
        console.error('Error inicial:', error);
        alert('Error al cargar los datos. Ver consola.');
    }
});

// Función para cargar meses disponibles
function loadMonthFilter(monthsData) {
    const monthSelect = document.getElementById('month-filter');
    monthSelect.innerHTML = '<option value="all">Todos los meses</option>';
    
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthsWithData = monthNames.slice(0, monthsData.totals.length);
    
    monthsWithData.forEach((month, index) => {
        monthSelect.innerHTML += `<option value="${index}">${month}</option>`;
    });
    
    monthSelect.disabled = false;
    console.log("Meses cargados:", monthsWithData);
}

// Actualizar dashboard completo
function updateDashboard() {
    try {
        const client = document.getElementById('client-filter').value;
        const year = document.getElementById('year-filter').value;
        const monthSelect = document.getElementById('month-filter');
        
        console.log(`Filtrando por: ${client}, ${year}`);
        
        const filteredData = currentData[client]?.[year];
        if (!filteredData) throw new Error(`No hay datos para ${client} en ${year}`);
        
        // Actualizar selector de meses si es necesario
        if (monthSelect.disabled || monthSelect.dataset.currentYear !== year) {
            loadMonthFilter(filteredData);
            monthSelect.dataset.currentYear = year;
        }
        
        const month = monthSelect.value;
        const finalData = month === "all" ? filteredData : filterDataByMonth(filteredData, parseInt(month));
        
        console.log("Datos finales:", finalData);
        updateKPIs(finalData);
        updateCharts(finalData, client, year, month);
        
    } catch (error) {
        console.error('Error en updateDashboard:', error);
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
    
    console.log("KPIs actualizados:", {total, hired, exits, rotation});
}

// Actualizar gráficos
function updateCharts(data, client, year, month) {
    console.log("Actualizando gráficos...");
    const ctxEvolution = document.getElementById('evolution-chart');
    const ctxDistribution = document.getElementById('distribution-chart');
    
    // Destruir gráficos existentes
    if (charts.evolution) charts.evolution.destroy();
    if (charts.distribution) charts.distribution.destroy();
    
    // Preparar labels
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const labels = month === "all" 
        ? monthLabels.slice(0, data.totals.length)
        : [`${monthLabels[month]} ${year}`];
    
    // 1. Gráfico de evolución
    charts.evolution = new Chart(ctxEvolution, {
        type: month === "all" ? 'line' : 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: client === "all" ? `Total (${year})` : `Total (${client})`,
                data: month === "all" ? data.totals : [data.totals[0]],
                borderColor: '#2E86AB',
                backgroundColor: month === "all" ? 'rgba(46, 134, 171, 0.1)' : '#2E86AB',
                fill: month === "all",
                tension: 0.3,
                borderWidth: 2
            }]
        },
        options: getChartOptions('Evolución de desarrolladores')
    });
    
    // 2. Gráfico de distribución (solo para "all")
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
            options: getChartOptions('Distribución por cliente')
        });
        document.querySelector('.chart-message').style.display = 'none';
    } else {
        document.querySelector('.chart-message').style.display = 'block';
    }
    
    console.log("Gráficos actualizados");
}

// Función auxiliar: Filtrar datos por mes
function filterDataByMonth(data, monthIndex) {
    return {
        totals: [data.totals[monthIndex]],
        hired: [data.hired[monthIndex]],
        exits: [data.exits[monthIndex]],
        clients: data.clients,
        clientsData: data.clientsData
    };
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
                font: { size: 14 }
            }
        },
        scales: {
            y: { beginAtZero: false }
        },
        layout: {
            padding: { top: 10, bottom: 10, left: 10, right: 10 }
        }
    };
}

// Redimensionar al cambiar ventana
window.addEventListener('resize', () => {
    if (charts.evolution) charts.evolution.resize();
    if (charts.distribution) charts.distribution.resize();
});

function filterByDateRange(data, yearFrom, monthFrom, yearTo, monthTo) {
    const result = {
        totals: [],
        hired: [],
        exits: [],
        clients: data.clients,
        clientsData: data.clientsData
    };

    // Convertir fechas a índices
    const startIndex = (parseInt(yearFrom) - 2023) * 12 + parseInt(monthFrom);
    const endIndex = (parseInt(yearTo) - 2023) * 12 + parseInt(monthTo);

    // Filtrar datos
    for (let year in data) {
        for (let month = 0; month < 12; month++) {
            const currentIndex = (parseInt(year) - 2023) * 12 + month;
            if (currentIndex >= startIndex && currentIndex <= endIndex) {
                if (data[year].totals[month] !== undefined) {
                    result.totals.push(data[year].totals[month]);
                    result.hired.push(data[year].hired[month]);
                    result.exits.push(data[year].exits[month]);
                }
            }
        }
    }

    return result;
}

function updateDashboard() {
    const client = document.getElementById('client-filter').value;
    const yearFrom = document.getElementById('year-from').value;
    const monthFrom = document.getElementById('month-from').value;
    const yearTo = document.getElementById('year-to').value;
    const monthTo = document.getElementById('month-to').value;

    const filteredData = filterByDateRange(currentData[client], yearFrom, monthFrom, yearTo, monthTo);
    
    updateKPIs(filteredData);
    updateCharts(filteredData, client, yearFrom, yearTo);
}