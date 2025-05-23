// Variables globales
let currentData = {};
let charts = {
    evolution: null,
    distribution: null
};

// NUEVA FUNCIÓN: Actualizar opciones de mes según año seleccionado
function updateMonthOptions(yearSelectId, monthSelectId) {
    const yearSelect = document.getElementById(yearSelectId);
    const monthSelect = document.getElementById(monthSelectId);
    const selectedYear = parseInt(yearSelect.value);
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
    
    // Definir todos los meses
    const allMonths = [
        { value: 1, name: 'Enero' },
        { value: 2, name: 'Febrero' },
        { value: 3, name: 'Marzo' },
        { value: 4, name: 'Abril' },
        { value: 5, name: 'Mayo' },
        { value: 6, name: 'Junio' },
        { value: 7, name: 'Julio' },
        { value: 8, name: 'Agosto' },
        { value: 9, name: 'Septiembre' },
        { value: 10, name: 'Octubre' },
        { value: 11, name: 'Noviembre' },
        { value: 12, name: 'Diciembre' }
    ];
    
    // Guardar mes seleccionado actualmente
    const currentSelectedMonth = parseInt(monthSelect.value);
    
    // Limpiar opciones existentes
    monthSelect.innerHTML = '';
    
    // Determinar qué meses mostrar
    let maxMonth = 12;
    if (selectedYear === currentYear) {
        maxMonth = currentMonth; // Solo mostrar hasta el mes actual
    } else if (selectedYear > currentYear) {
        maxMonth = 0; // No mostrar ningún mes para años futuros
    }
    
    // Agregar opciones válidas
    for (let i = 0; i < maxMonth; i++) {
        const month = allMonths[i];
        const option = document.createElement('option');
        option.value = month.value;
        option.textContent = month.name;
        monthSelect.appendChild(option);
    }
    
    // Restaurar selección si es válida, sino seleccionar el último mes disponible
    if (maxMonth > 0) {
        if (currentSelectedMonth <= maxMonth) {
            monthSelect.value = currentSelectedMonth;
        } else {
            monthSelect.value = maxMonth; // Seleccionar el último mes disponible
        }
    }
    
    console.log(`Mes actualizado para ${selectedYear}: máximo mes ${maxMonth} (actual: ${currentMonth}/${currentYear})`);
}

// NUEVA FUNCIÓN: Actualizar opciones de año (solo mostrar años válidos)
function updateYearOptions() {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    const yearFromSelect = document.getElementById('year-from');
    const yearToSelect = document.getElementById('year-to');
    
    // Años disponibles en los datos (ajustar según tus datos)
    const availableYears = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    
    // Filtrar solo años <= año actual
    const validYears = availableYears.filter(year => year <= currentYear);
    
    // Actualizar selector "desde"
    const currentFromYear = parseInt(yearFromSelect.value);
    yearFromSelect.innerHTML = '';
    validYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentFromYear || (currentFromYear > currentYear && year === currentYear)) {
            option.selected = true;
        }
        yearFromSelect.appendChild(option);
    });
    
    // Actualizar selector "hasta"
    const currentToYear = parseInt(yearToSelect.value);
    yearToSelect.innerHTML = '';
    validYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentToYear || (currentToYear > currentYear && year === currentYear)) {
            option.selected = true;
        }
        yearToSelect.appendChild(option);
    });
    
    console.log(`Años actualizados: disponibles hasta ${currentYear}`);
}

// NUEVA FUNCIÓN: Inicializar selectores dinámicos
function initializeDynamicSelectors() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    console.log(`Inicializando selectores dinámicos para: ${currentMonth}/${currentYear}`);
    
    // Actualizar años válidos
    updateYearOptions();
    
    // Actualizar meses para ambos selectores
    updateMonthOptions('year-from', 'month-from');
    updateMonthOptions('year-to', 'month-to');
    
    // Configurar eventos de cambio de año
    document.getElementById('year-from').addEventListener('change', () => {
        updateMonthOptions('year-from', 'month-from');
        updateDashboard(); // Actualizar dashboard después del cambio
    });
    
    document.getElementById('year-to').addEventListener('change', () => {
        updateMonthOptions('year-to', 'month-to');
        updateDashboard(); // Actualizar dashboard después del cambio
    });
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

// Inicialización - MODIFICADA
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log("Cargando datos...");
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error('Error al cargar data.json');
        currentData = await response.json();
        console.log("Datos cargados:", currentData);
        
        // NUEVA: Inicializar selectores dinámicos
        initializeDynamicSelectors();
        
        // Configurar eventos (sin year-from y year-to porque ya están configurados arriba)
        ['client-filter', 'month-from', 'month-to'].forEach(id => {
            document.getElementById(id).addEventListener('change', updateDashboard);
        });
        
        // Carga inicial
        updateDashboard();
    } catch (error) {
        console.error('Error inicial:', error);
        alert('Error al cargar los datos. Ver consola.');
    }
});

// Función para filtrar por rango de fechas - SIN CAMBIOS
function filterByDateRange(clientData, yearFrom, monthFrom, yearTo, monthTo) {
    const result = {
        totals: [],
        hired: [],
        exits: [],
        clients: clientData[yearFrom]?.clients || [],
        clientsData: []
    };

    // Convertir a números
    yearFrom = parseInt(yearFrom);
    monthFrom = parseInt(monthFrom) - 1;
    yearTo = parseInt(yearTo);
    monthTo = parseInt(monthTo) - 1;

    // Validar rango básico (ya no necesitamos validar fechas futuras)
    if (yearFrom > yearTo || (yearFrom === yearTo && monthFrom > monthTo)) {
        alert("La fecha de inicio debe ser anterior o igual a la fecha final");
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
                
                if (clientData[year].clientsData && clientData[year].clientsData[month]) {
                    result.clientsData.push(clientData[year].clientsData[month]);
                }
            }
        }
    }

    return result;
}

// Actualizar dashboard completo - SIMPLIFICADO (sin validación manual)
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
        updateKPIs(filteredData, clientData, yearTo);
        updateCharts(filteredData, client, yearFrom, yearTo, monthTo);
        
    } catch (error) {
        console.error('Error en updateDashboard:', error, error.stack);
    }
}

// Actualizar KPIs - CON ROTACIÓN ANUAL
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
    
    // Calcular rotación mensual
    let rotation = '-';
    if (data.totals.length > 1) {
        const prevTotal = data.totals[lastIndex - 1] || total;
        rotation = ((exits / ((total + prevTotal) / 2)) * 100).toFixed(1) + '%';
    }
    
    // Calcular rotación anual
    const annualRotation = calculateAnnualRotation(clientData, currentYear);
    
    // Actualizar DOM
    document.getElementById('total').textContent = total;
    document.getElementById('hired').textContent = hired;
    document.getElementById('exits').textContent = exits;
    document.getElementById('rotation').textContent = rotation;
    document.getElementById('annual-rotation').textContent = annualRotation;
    
    console.log("KPIs actualizados:", {total, hired, exits, rotation, annualRotation});
}

// Calcular distribución dinámicamente - SIN CAMBIOS
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

// Actualizar gráficos - SIN CAMBIOS
function updateCharts(data, client, yearFrom, yearTo, monthTo) {
    console.log("Actualizando gráficos...");
    const ctxEvolution = document.getElementById('evolution-chart');
    const ctxDistribution = document.getElementById('distribution-chart');
    
    // Destruir gráficos existentes
    if (charts.evolution && typeof charts.evolution.destroy === 'function') {
        charts.evolution.destroy();
        charts.evolution = null;
    }
    if (charts.distribution && typeof charts.distribution.destroy === 'function') {
        charts.distribution.destroy();
        charts.distribution = null;
    }
    
    // Limpiar canvas
    ctxEvolution.width = ctxEvolution.offsetWidth;
    ctxEvolution.height = ctxEvolution.offsetHeight;
    
    // Preparar labels para el eje X
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

    // Gráfico de evolución
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
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Evolución mensual' }
            },
            layout: {
                padding: { top: 10, bottom: 20, left: 10, right: 10 }
            },
            scales: {
                y: { beginAtZero: false, grid: { display: true } },
                x: { grid: { display: false } }
            }
        }
    });
    
    // Gráfico de distribución (solo para "all")
    if (client === "all" && data.clients) {
        const finalYear = parseInt(yearTo);
        const finalMonth = parseInt(monthTo) - 1;
        const distributionData = calculateDistributionForMonth(finalYear, finalMonth);
        
        console.log(`Usando distribución para ${finalYear}-${finalMonth + 1}:`, distributionData);
        
        charts.distribution = new Chart(ctxDistribution, {
            type: 'doughnut',
            data: {
                labels: data.clients,
                datasets: [{
                    data: distributionData,
                    backgroundColor: ['#2E86AB', '#4CB944', '#E94F64', '#FFD166'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 }
                    },
                    title: { display: true, text: `Distribución ${labels[labels.length-1]}`, font: { size: 14 } },
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
                scales: {}
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