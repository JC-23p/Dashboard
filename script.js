// Variables globales
let currentData = {};
let charts = {
    evolution: null,
    distribution: null
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error('Error al cargar datos');
        currentData = await response.json();
        
        document.getElementById('client-filter').addEventListener('change', updateDashboard);
        document.getElementById('year-filter').addEventListener('change', updateDashboard);
        document.getElementById('month-filter').addEventListener('change', updateDashboard);
        
        updateDashboard();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos. Ver consola.');
    }
});

function updateDashboard() {
    try {
        const client = document.getElementById('client-filter').value;
        const year = document.getElementById('year-filter').value;
        
        const filteredData = currentData[client]?.[year];
        if (!filteredData) throw new Error('Datos no disponibles');
        
        // Activar y cargar meses disponibles
        const monthSelect = document.getElementById('month-filter');
        monthSelect.innerHTML = '<option value="all">Todos los meses</option>';
        
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        months.slice(0, filteredData.totals.length).forEach((month, index) => {
            monthSelect.innerHTML += `<option value="${index}">${month}</option>`;
        });
        
        monthSelect.disabled = false;
        const month = monthSelect.value;
        
        // Resto de tu código...
    } catch (error) {
        console.error('Error:', error);
    }
}

function updateKPIs(data) {
    const lastIndex = data.totals.length - 1;
    const total = data.totals[lastIndex];
    const hired = data.hired[lastIndex];
    const exits = data.exits[lastIndex];
    
    const prevTotal = data.totals[lastIndex - 1] || total;
    const rotation = ((exits / ((total + prevTotal) / 2)) * 100).toFixed(1);
    
    document.getElementById('total').textContent = total;
    document.getElementById('hired').textContent = hired;
    document.getElementById('exits').textContent = exits;
    document.getElementById('rotation').textContent = `${rotation}%`;
}

function updateCharts(data, client, year, month) {
    const ctxEvolution = document.getElementById('evolution-chart');
    const ctxDistribution = document.getElementById('distribution-chart');
    
    if (charts.evolution) charts.evolution.destroy();
    if (charts.distribution) charts.distribution.destroy();
    
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const labels = month === "all" 
        ? monthLabels.slice(0, data.totals.length)
        : [`${monthLabels[month]} ${year}`];
    
    // Gráfico de evolución
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
                tension: 0.3
            }]
        },
        options: getChartOptions('Evolución')
    });
    
    // Gráfico de distribución
    if (client === "all" && data.clients && data.clientsData) {
        charts.distribution = new Chart(ctxDistribution, {
            type: 'bar',
            data: {
                labels: data.clients,
                datasets: [{
                    label: 'Distribución',
                    data: data.clientsData,
                    backgroundColor: ['#2E86AB', '#4CB944', '#E94F64', '#FFD166']
                }]
            },
            options: getChartOptions('Distribución por cliente')
        });
        document.querySelector('.chart-message').style.display = 'none';
    } else {
        document.querySelector('.chart-message').style.display = 'block';
    }
}

function filterDataByMonth(data, monthIndex) {
    return {
        totals: [data.totals[monthIndex]],
        hired: [data.hired[monthIndex]],
        exits: [data.exits[monthIndex]],
        clients: data.clients,
        clientsData: data.clientsData
    };
}

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
        }
    };
}

// Redimensionar al cambiar ventana
window.addEventListener('resize', () => {
    if (charts.evolution) charts.evolution.resize();
    if (charts.distribution) charts.distribution.resize();
});