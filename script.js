// NUEVA FUNCIÓN: Crear indicador de tendencia
function createTrendIndicator(currentValue, previousValue, kpiType) {
    // Si no hay valor anterior o son iguales, no mostrar indicador
    if (previousValue === null || previousValue === undefined || currentValue === previousValue) {
        return '';
    }
    
    let isPositiveTrend = false;
    
    // Determinar si la tendencia es positiva según el tipo de KPI
    switch (kpiType) {
        case 'total':
        case 'hired':
            // Para totales y altas: subir es bueno
            isPositiveTrend = currentValue > previousValue;
            break;
        case 'exits':
        case 'rotation':
            // Para bajas y rotación: bajar es bueno
            isPositiveTrend = currentValue < previousValue;
            break;
        default:
            return '';
    }
    
    // Crear el HTML del indicador
    if (isPositiveTrend) {
        return `<span class="trend-indicator trend-up" title="Mejora respecto al mes anterior">▲</span>`;
    } else {
        return `<span class="trend-indicator trend-down" title="Empeora respecto al mes anterior">▼</span>`;
    }
}

// NUEVA FUNCIÓN: Obtener valor del mes anterior
function getPreviousMonthValue(data, dataType, currentIndex) {
    if (currentIndex <= 0 || !data[dataType]) {
        return null;
    }
    
    // Buscar el valor del mes anterior (índice anterior)
    return data[dataType][currentIndex - 1];
}

// NUEVA FUNCIÓN: Obtener nombre del mes
function getMonthName(monthNumber) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthNumber - 1] || 'Enero';
}

// NUEVA FUNCIÓN: Actualizar títulos de KPIs con mes/año actual
function updateKpiTitles() {
    const monthTo = document.getElementById('month-to').value;
    const yearTo = document.getElementById('year-to').value;
    const monthName = getMonthName(parseInt(monthTo));
    
    // Obtener todos los títulos de KPIs
    const kpiTitles = document.querySelectorAll('.kpi-card .kpi-title');
    
    if (kpiTitles.length >= 5) {
        // Total Activos
        kpiTitles[0].textContent = `👥 Total Activos ${monthName} ${yearTo}`;
        
        // Altas (mes)
        kpiTitles[1].textContent = `📥 Altas ${monthName} ${yearTo}`;
        
        // Bajas (mes)
        kpiTitles[2].textContent = `📤 Bajas ${monthName} ${yearTo}`;
        
        // Rotación Mensual
        kpiTitles[3].textContent = `🔄 Rotación ${monthName} ${yearTo}`;
        
        // Rotación Anual
        kpiTitles[4].textContent = `📈 Rotación Anual ${yearTo}`;
    }
    
    console.log(`Títulos KPI actualizados para: ${monthName} y año ${yearTo}`);
}

// Actualizar KPIs - MODIFICADO con indicadores de tendencia
function updateKPIs(data, clientData, currentYear) {
    if (data.totals.length === 0) {
        document.getElementById('total').textContent = '-';
        document.getElementById('hired').textContent = '-';
        document.getElementById('exits').textContent = '-';
        document.getElementById('rotation').textContent = '-';
        document.getElementById('annual-rotation').textContent = '-';
        
        // Limpiar indicadores
        ['total', 'hired', 'exits', 'rotation'].forEach(id => {
            const indicator = document.getElementById(id + '-indicator');
            if (indicator) indicator.innerHTML = '';
        });
        
        return;
    }

    const lastIndex = data.totals.length - 1;
    const total = data.totals[lastIndex];
    const hired = data.hired[lastIndex];
    const exits = data.exits[lastIndex];
    
    // Obtener valores del mes anterior
    const prevTotal = getPreviousMonthValue(data, 'totals', lastIndex);
    const prevHired = getPreviousMonthValue(data, 'hired', lastIndex);
    const prevExits = getPreviousMonthValue(data, 'exits', lastIndex);
    
    // Calcular rotación mensual
    let rotation = '-';
    let rotationNumeric = null;
    let prevRotation = null;
    
    if (data.totals.length > 1) {
        const prevTotal = data.totals[lastIndex - 1] || total;
        rotationNumeric = (exits / ((total + prevTotal) / 2)) * 100;
        rotation = rotationNumeric.toFixed(1) + '%';
        
        // Calcular rotación del mes anterior si es posible
        if (lastIndex >= 2) {
            const prevPrevTotal = data.totals[lastIndex - 2] || prevTotal;
            const prevExitsValue = data.exits[lastIndex - 1];
            prevRotation = (prevExitsValue / ((prevTotal + prevPrevTotal) / 2)) * 100;
        }
    }
    
    // Calcular rotación anual
    const annualRotation = calculateAnnualRotation(clientData, currentYear);
    
    // Actualizar valores
    document.getElementById('total').textContent = total;
    document.getElementById('hired').textContent = hired;
    document.getElementById('exits').textContent = exits;
    document.getElementById('rotation').textContent = rotation;
    document.getElementById('annual-rotation').textContent = annualRotation;
    
    // Actualizar indicadores de tendencia
    document.getElementById('total-indicator').innerHTML = createTrendIndicator(total, prevTotal, 'total');
    document.getElementById('hired-indicator').innerHTML = createTrendIndicator(hired, prevHired, 'hired');
    document.getElementById('exits-indicator').innerHTML = createTrendIndicator(exits, prevExits, 'exits');
    document.getElementById('rotation-indicator').innerHTML = createTrendIndicator(rotationNumeric, prevRotation, 'rotation');
    
    console.log("KPIs actualizados con tendencias:", {
        total: `${total} (prev: ${prevTotal})`,
        hired: `${hired} (prev: ${prevHired})`,
        exits: `${exits} (prev: ${prevExits})`,
        rotation: `${rotation} (prev: ${prevRotation?.toFixed(1)}%)`,
        annualRotation
    });
}

// Variables globales
let currentData = {};
let charts = {
    evolution: null,
    distribution: null
};

// Actualizar opciones de mes según año seleccionado
function updateMonthOptions(yearSelectId, monthSelectId) {
    const yearSelect = document.getElementById(yearSelectId);
    const monthSelect = document.getElementById(monthSelectId);
    const selectedYear = parseInt(yearSelect.value);
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
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
    
    const currentSelectedMonth = parseInt(monthSelect.value);
    monthSelect.innerHTML = '';
    
    let maxMonth = 12;
    if (selectedYear === currentYear) {
        maxMonth = currentMonth;
    } else if (selectedYear > currentYear) {
        maxMonth = 0;
    }
    
    for (let i = 0; i < maxMonth; i++) {
        const month = allMonths[i];
        const option = document.createElement('option');
        option.value = month.value;
        option.textContent = month.name;
        monthSelect.appendChild(option);
    }
    
    if (maxMonth > 0) {
        if (currentSelectedMonth <= maxMonth) {
            monthSelect.value = currentSelectedMonth;
        } else {
            monthSelect.value = maxMonth;
        }
    }
    
    console.log(`Mes actualizado para ${selectedYear}: máximo mes ${maxMonth}`);
}

// Actualizar opciones de año
function updateYearOptions() {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    const yearFromSelect = document.getElementById('year-from');
    const yearToSelect = document.getElementById('year-to');
    
    const availableYears = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    const validYears = availableYears.filter(year => year <= currentYear);
    
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

// Inicializar selectores dinámicos
function initializeDynamicSelectors() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    console.log(`Inicializando selectores dinámicos para: ${currentMonth}/${currentYear}`);
    
    updateYearOptions();
    updateMonthOptions('year-from', 'month-from');
    updateMonthOptions('year-to', 'month-to');
    
    document.getElementById('year-from').addEventListener('change', () => {
        updateMonthOptions('year-from', 'month-from');
        updateDashboard();
    });
    
    document.getElementById('year-to').addEventListener('change', () => {
        updateMonthOptions('year-to', 'month-to');
        updateDashboard();
    });
    
    // NUEVO: Agregar listener para actualizar título cuando cambie el mes o año
    document.getElementById('month-to').addEventListener('change', () => {
        updateKpiTitles();
        updateDashboard();
    });
    
    document.getElementById('year-to').addEventListener('change', () => {
        updateKpiTitles();
        updateMonthOptions('year-to', 'month-to');
        updateDashboard();
    });
}

// Calcular rotación anual
function calculateAnnualRotation(clientData, year) {
    if (!clientData[year]) return '-';
    
    const totalExitsYear = clientData[year].exits.reduce((sum, exits) => sum + exits, 0);
    const activeTotals = clientData[year].totals.filter(total => total > 0);
    if (activeTotals.length === 0) return '-';
    
    const avgActiveYear = activeTotals.reduce((sum, total) => sum + total, 0) / activeTotals.length;
    if (avgActiveYear === 0) return '-';
    
    const annualRotation = (totalExitsYear / avgActiveYear) * 100;
    
    console.log(`Rotación anual ${year}: ${totalExitsYear} bajas / ${avgActiveYear.toFixed(1)} promedio = ${annualRotation.toFixed(1)}%`);
    
    return annualRotation.toFixed(1) + '%';
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log("Cargando datos...");
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error('Error al cargar data.json');
        currentData = await response.json();
        console.log("Datos cargados:", currentData);
        
        initializeDynamicSelectors();
        
        ['client-filter', 'month-from'].forEach(id => {
            document.getElementById(id).addEventListener('change', updateDashboard);
        });
        
        // Actualizar títulos iniciales
        updateKpiTitles();
        updateDashboard();
        
        // NUEVO: Agregar evento click al KPI de bajas
        const exitsKpi = document.querySelector('.kpi-card.red');
        if (exitsKpi) {
            exitsKpi.style.cursor = 'pointer';
            exitsKpi.addEventListener('click', function() {
                // Obtener el mes y año actual del filtro
                const currentMonth = document.getElementById('month-to').value;
                const currentYear = document.getElementById('year-to').value;
                const currentClient = document.getElementById('client-filter').value;
                
                // Construir URL con parámetros
                const url = `bajas-detalle.html?mes=${currentMonth}&ano=${currentYear}&cliente=${currentClient}`;
                
                // Abrir en nueva ventana
                window.open(url, '_blank');
            });
            
            // Agregar indicador visual de que es clickeable
            exitsKpi.setAttribute('title', 'Click para ver detalle de bajas');
        }
        
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
        clientsData: []
    };

    yearFrom = parseInt(yearFrom);
    monthFrom = parseInt(monthFrom) - 1;
    yearTo = parseInt(yearTo);
    monthTo = parseInt(monthTo) - 1;

    if (yearFrom > yearTo || (yearFrom === yearTo && monthFrom > monthTo)) {
        alert("La fecha de inicio debe ser anterior o igual a la fecha final");
        return result;
    }

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

// Actualizar dashboard completo
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
        
        // Actualizar títulos de KPIs
        updateKpiTitles();
        
        updateKPIs(filteredData, clientData, yearTo);
        updateCharts(filteredData, client, yearFrom, yearTo, monthTo);
        
    } catch (error) {
        console.error('Error en updateDashboard:', error, error.stack);
    }
}

// Calcular distribución dinámicamente
function calculateDistributionForMonth(year, month) {
    if (!currentData.equifax || !currentData.honeywell) {
        console.warn("No se encontraron datos de equifax o honeywell");
        return [0, 0];
    }
    
    const equifaxTotal = currentData.equifax[year]?.totals[month] || 0;
    const honeywellTotal = currentData.honeywell[year]?.totals[month] || 0;
    
    console.log(`Distribución por Clientes ${year}-${month + 1}: Equifax=${equifaxTotal}, Honeywell=${honeywellTotal}`);
    
    return [equifaxTotal, honeywellTotal];
}

// Actualizar gráficos
function updateCharts(data, client, yearFrom, yearTo, monthTo) {
    console.log("Actualizando gráficos...");
    const ctxEvolution = document.getElementById('evolution-chart');
    const ctxDistribution = document.getElementById('distribution-chart');
    
    if (charts.evolution && typeof charts.evolution.destroy === 'function') {
        charts.evolution.destroy();
        charts.evolution = null;
    }
    if (charts.distribution && typeof charts.distribution.destroy === 'function') {
        charts.distribution.destroy();
        charts.distribution = null;
    }
    
    ctxEvolution.width = ctxEvolution.offsetWidth;
    ctxEvolution.height = ctxEvolution.offsetHeight;
    
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
                    backgroundColor: ['#ba68c8', '#ffeb3b', '#E94F64', '#FFD166'],
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

window.addEventListener('resize', () => {
    if (charts.evolution) charts.evolution.resize();
    if (charts.distribution) charts.distribution.resize();
});