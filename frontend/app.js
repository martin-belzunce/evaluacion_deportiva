/**
 * Sistema de Evaluación Deportiva
 * Implementa un sistema de ranking con decaimiento exponencial
 */

class SportsEvaluationSystem {
    constructor() {
        this.teams = new Map();
        this.lambda = 0.95;
        this.chart = null;
        // Use production API URL when deployed, localhost for development
        this.apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8000/api'
            : '/api';
        this.init();
        // Make addTeam globally accessible
        window.addTeam = this.addTeam.bind(this);
    }

    async init() {
        await this.loadConfiguration();
        await this.loadTeamsFromAPI();
        this.setupEventListeners();
        this.updateUI();
        this.setCurrentDate();
        this.initChart();
    }

    async setupEventListeners() {
        // Lambda global control
        const lambdaSlider = document.getElementById('lambdaGlobal');
        lambdaSlider.addEventListener('input', async (e) => {
            this.lambda = parseFloat(e.target.value);
            document.getElementById('lambdaValue').textContent = this.lambda;
            await this.saveConfiguration();
            this.updateRankings();
        });

        // Team selection for chart
        document.getElementById('equipoGrafico').addEventListener('change', (e) => {
            if (e.target.value) {
                if (e.target.value === 'all_teams') {
                    this.updateMultiTeamChart();
                } else {
                    this.updateChart(e.target.value);
                }
            }
        });

        // File import
        document.getElementById('archivoImportar').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        // Enter key support for forms
        document.getElementById('nombreEquipo').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTeam(document.getElementById('nombreEquipo').value);
        });
        
        document.getElementById('puntajePrueba').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') agregarPuntaje();
        });
        
        // Discipline input field enter key support
        const disciplineInput = document.getElementById('nombreDisciplina');
        if (disciplineInput) {
            disciplineInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    // Trigger the existing agregarDisciplina function
                    if (window.agregarDisciplina) {
                        window.agregarDisciplina();
                    }
                }
            });
        }

        // Load disciplines
        await this.loadDisciplines();
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('fechaPrueba').value = today;
    }

    // API Methods
    async loadConfiguration() {
        try {
            const response = await fetch(`${this.apiUrl}/config`);
            if (response.ok) {
                const config = await response.json();
                this.lambda = config.global_lambda || 0.95;
                
                // Update UI
                document.getElementById('lambdaGlobal').value = this.lambda;
                document.getElementById('lambdaValue').textContent = this.lambda;
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
            this.showStatus('Error al cargar configuración', 'error');
        }
    }

    async saveConfiguration() {
        try {
            const response = await fetch(`${this.apiUrl}/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    global_lambda: this.lambda
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save configuration');
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
            this.showStatus('Error al guardar configuración', 'error');
        }
    }

    async loadTeamsFromAPI() {
        try {
            const response = await fetch(`${this.apiUrl}/teams`);
            if (response.ok) {
                const teams = await response.json();
                this.teams.clear();
                
                for (const team of teams) {
                    // Get team tests
                    const testsResponse = await fetch(`${this.apiUrl}/teams/${team.id}/tests`);
                    if (testsResponse.ok) {
                        const teamData = await testsResponse.json();
                        this.teams.set(team.name, {
                            id: team.id,
                            name: team.name,
                            tests: teamData.tests.map(test => ({
                                score: test.score,
                                date: test.test_date,
                                lambda: test.lambda_value,
                                timestamp: test.created_at
                            })),
                            createdAt: team.created_at
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error loading teams:', error);
            this.showStatus('Error al cargar equipos', 'error');
        }
    }

    async addTeam(name) {
        if (!name || name.trim() === '') {
            alert('Por favor ingresa un nombre válido para el equipo.');
            return false;
        }

        const teamName = name.trim();
        if (this.teams.has(teamName)) {
            alert('Este equipo ya existe.');
            return false;
        }

        try {
            const response = await fetch(`${this.apiUrl}/teams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: teamName
                })
            });

            if (response.ok) {
                const team = await response.json();
                this.teams.set(teamName, {
                    id: team.id,
                    name: teamName,
                    tests: [],
                    createdAt: team.created_at
                });

                this.updateUI();
                this.showStatus('Equipo agregado correctamente', 'success');
                return true;
            } else {
                const error = await response.json();
                alert(error.error || 'Error al agregar equipo');
                return false;
            }
        } catch (error) {
            console.error('Error adding team:', error);
            this.showStatus('Error al agregar equipo', 'error');
            return false;
        }
    }

    async removeTeam(teamName) {
        if (!confirm(`¿Estás seguro de que quieres eliminar el equipo "${teamName}"?`)) {
            return;
        }

        const team = this.teams.get(teamName);
        if (!team || !team.id) {
            alert('Error: No se puede eliminar el equipo');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/teams/${team.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.teams.delete(teamName);
                this.updateUI();
                this.showStatus('Equipo eliminado', 'success');
            } else {
                const error = await response.json();
                alert(error.error || 'Error al eliminar equipo');
            }
        } catch (error) {
            console.error('Error removing team:', error);
            this.showStatus('Error al eliminar equipo', 'error');
        }
    }

    async addTest(teamName, score, date, disciplineId) {
        if (!teamName || !this.teams.has(teamName)) {
            alert('Por favor selecciona un equipo válido.');
            return false;
        }

        if (isNaN(score) || score < 0) {
            alert('Por favor ingresa un puntaje válido.');
            return false;
        }

        if (!date) {
            alert('Por favor selecciona una fecha.');
            return false;
        }

        if (!disciplineId) {
            alert('Por favor selecciona una disciplina.');
            return false;
        }

        const team = this.teams.get(teamName);
        
        try {
            const response = await fetch(`${this.apiUrl}/tests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    team_id: team.id,
                    discipline_id: disciplineId,
                    score: parseFloat(score),
                    test_date: date
                })
            });

            if (response.ok) {
                const test = await response.json();
                
                // Update local data
                const localTest = {
                    score: test.score,
                    date: test.test_date,
                    lambda: test.lambda_value,
                    timestamp: test.created_at,
                    discipline_id: disciplineId
                };

                team.tests.push(localTest);
                team.tests.sort((a, b) => new Date(a.date) - new Date(b.date));

                this.updateUI();
                this.showStatus('Puntaje agregado correctamente', 'success');
                this.clearTestForm();
                return true;
            // Clear discipline selection after successful submission
            document.getElementById('disciplinaSeleccionada').value = '';
            } else {
                const error = await response.json();
                alert(error.error || 'Error al agregar puntaje');
                return false;
            }
        } catch (error) {
            console.error('Error adding test:', error);
            this.showStatus('Error al agregar puntaje', 'error');
            return false;
        }
    }

    calculateWeightedScore(teamName) {
        const team = this.teams.get(teamName);
        if (!team || team.tests.length === 0) return 0;

        const tests = team.tests;
        let weightedSum = 0;
        const today = new Date();

        // Sort tests by date
        const sortedTests = [...tests].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        for (const test of sortedTests) {
            const testDate = new Date(test.date);
            const daysDiff = Math.floor((today - testDate) / (1000 * 60 * 60 * 24)); // Days difference
            
            // Weekly decay factor (same as backend)
            const decayFactor = daysDiff / 7;
            const lambda = test.lambda || this.lambda;
            const weight = Math.pow(lambda, decayFactor);
            
            weightedSum += weight * test.score;
        }

        const normalizer = 1 - this.lambda;
        return normalizer * weightedSum;
    }

    getDisciplineName(disciplineId) {
        const discipline = this.disciplines.find(d => d.id === disciplineId);
        return discipline ? discipline.name : 'Desconocida.';
    }

    showTeamHistory(teamName) {
        const team = this.teams.get(teamName);
        if (!team || team.tests.length === 0) {
            alert('No hay historial disponible para este equipo');
            return;
        }

        // Create modal if it doesn't exist
        let modal = document.getElementById('teamHistoryModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'teamHistoryModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-btn" onclick="document.getElementById('teamHistoryModal').style.display='none'">&times;</span>
                    <h2>Historial de ${teamName}</h2>
                    <table class="history-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Disciplina</th>
                                <th>Puntaje</th>
                                <th>λ usado</th>
                            </tr>
                        </thead>
                        <tbody id="teamHistoryBody">
                        </tbody>
                    </table>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Update table content
        const tbody = document.getElementById('teamHistoryBody');
        tbody.innerHTML = '';

        team.tests.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(test => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${test.date}</td>
                <td>${test.discipline_id}</td>
                <td>${this.getDisciplineName(test.discipline_id)}</td>
                <td>${test.score}</td>
                <td>${this.lambda.toFixed(2)}</td>
                `;
            tbody.appendChild(row);
        });

        // Show modal
        modal.style.display = 'block';
    }

    updateRankings() {
        const rankings = Array.from(this.teams.keys())
            .map(teamName => ({
                name: teamName,
                score: this.calculateWeightedScore(teamName),
                tests: this.teams.get(teamName).tests.length
            }))
            .sort((a, b) => b.score - a.score);

        this.renderRankingsTable(rankings);
    }

    renderRankingsTable(rankings) {
        const tbody = document.querySelector('#tablaResultados tbody');
        tbody.innerHTML = '';

        rankings.forEach((team, index) => {
            const row = document.createElement('tr');
            const position = index + 1;
            
            // Add medal classes for top 3
            if (position === 1) row.classList.add('gold');
            else if (position === 2) row.classList.add('silver');
            else if (position === 3) row.classList.add('bronze');

            row.innerHTML = `
                <td class="position">${position}</td>
                <td class="team-name">${team.name}</td>
                <td class="score">${team.score.toFixed(3)}</td>
                <td class="test-count">${team.tests}</td>
                <td class="actions">
                    <button class="btn btn-small btn-info" onclick="mostrarHistorico('${team.name}')">
                        📊 Ver
                    </button>
                    <button class="btn btn-small btn-danger" onclick="eliminarEquipo('${team.name}')">
                        🗑️
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadDisciplines() {
        try {
            const response = await fetch(`${this.apiUrl}/disciplines`);
            if (response.ok) {
                this.disciplines = await response.json();
                this.updateDisciplineSelector();
                this.renderDisciplinesList();
            }
        } catch (error) {
            console.error('Error loading disciplines:', error);
            this.showStatus('Error al cargar disciplinas', 'error');
        }
    }

    async addDiscipline(name = '') {
        if (!name || name.trim() === '') {
            alert('Por favor ingresa un nombre válido para la disciplina.');
            return false;
        }

        const disciplineName = name.trim();
        if (this.disciplines.some(d => d.name === disciplineName)) {
            alert('Esta disciplina ya existe.');
            return false;
        }

        try {
            const response = await fetch(`${this.apiUrl}/disciplines`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: disciplineId,
                    name: disciplineName
                })
            });

            if (response.ok) {
                const discipline = await response.json();
                this.disciplines.push(discipline);
                this.updateDisciplineSelector();
                this.renderDisciplinesList();
                this.showStatus('Disciplina agregada correctamente', 'success');
                return true;
            } else {
                const error = await response.json();
                alert(error.error || 'Error al agregar disciplina');
                return false;
            }
        } catch (error) {
            console.error('Error adding discipline:', error);
            this.showStatus('Error al agregar disciplina', 'error');
            return false;
        }
    }

    async removeDiscipline(disciplineName) {
        if (!confirm(`¿Estás seguro de que quieres eliminar la disciplina "${disciplineName}"?`)) {
            return;
        }

        const discipline = this.disciplines.find(d => d.name === disciplineName);
        if (!discipline || !discipline.id) {
            alert('Error: No se puede eliminar la disciplina');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/disciplines/${discipline.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.disciplines = this.disciplines.filter(d => d.id !== discipline.id);
                this.updateDisciplineSelector();
                this.renderDisciplinesList();
                this.showStatus('Disciplina eliminada', 'success');
            } else {
                const error = await response.json();
                alert(error.error || 'Error al eliminar disciplina');
            }
        } catch (error) {
            console.error('Error removing discipline:', error);
            this.showStatus('Error al eliminar disciplina', 'error');
        }
    }

    renderDisciplinesList() {
        const container = document.getElementById('listaDisciplinas');
        container.innerHTML = '';

        if (this.disciplines.length === 0) {
            container.innerHTML = '<p class="empty-state">No hay disciplinas registradas</p>';
            return;
        }

        this.disciplines.sort((a, b) => a.name.localeCompare(b.name)).forEach(discipline => {
            const disciplineCard = document.createElement('div');
            disciplineCard.className = 'discipline-card';
            disciplineCard.innerHTML = `
                <span class="discipline-name">${discipline.name}</span>
                <button class="btn btn-small btn-danger" onclick="sportsSystem.removeDiscipline('${discipline.name}')">
                    🗑️
                </button>
            `;
            container.appendChild(disciplineCard);
        });
    }

    updateDisciplineSelector() {
        const select = document.getElementById('disciplinaSeleccionada');
        if (!select) return;

        // Clear existing options
        select.innerHTML = '<option value="">Seleccionar disciplina</option>';

        // Add discipline options
        this.disciplines.forEach(discipline => {
            const option = document.createElement('option');
            option.value = discipline.id;
            option.textContent = discipline.name;
            select.appendChild(option);
        });
    }

    updateTeamSelectors() {
        const selectors = ['equipoSeleccionado', 'equipoGrafico'];
        
        selectors.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            const currentValue = select.value;
            
            // Clear options except the first one
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }

            // Add team options
            Array.from(this.teams.keys()).sort().forEach(teamName => {
                const option = document.createElement('option');
                option.value = teamName;
                option.textContent = teamName;
                select.appendChild(option);
            });

            // Restore previous selection if still valid
            if (this.teams.has(currentValue)) {
                select.value = currentValue;
            }
        });
    }

    renderTeamsList() {
        const container = document.getElementById('listaEquipos');
        container.innerHTML = '';

        if (this.teams.size === 0) {
            container.innerHTML = '<p class="empty-state">No hay equipos registrados</p>';
            return;
        }

        Array.from(this.teams.keys()).sort().forEach(teamName => {
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card';
            teamCard.innerHTML = `
                <span class="team-name">${teamName}</span>
                <span class="test-count">${this.teams.get(teamName).tests.length} pruebas</span>
                <button class="btn btn-small btn-danger" onclick="eliminarEquipo('${teamName}')">
                    🗑️
                </button>
            `;
            container.appendChild(teamCard);
        });
    }

    // showTeamHistory(teamName) {
    //     const team = this.teams.get(teamName);
    //     if (!team) return;

    //     const content = document.getElementById('contenidoHistorico');
    //     content.innerHTML = `
    //         <h4>${teamName}</h4>
    //         <div class="history-stats">
    //             <div class="stat">
    //                 <strong>Pruebas realizadas:</strong> ${team.tests.length}
    //             </div>
    //             <div class="stat">
    //                 <strong>Puntaje ponderado actual:</strong> ${this.calculateWeightedScore(teamName).toFixed(3)}
    //             </div>
    //         </div>
    //         <div class="history-table">
    //             <table>
    //                 <thead>
    //                     <tr>
    //                         <th>Fecha</th>
    //                         <th>Puntaje</th>
    //                         <th>λ usado</th>
    //                     </tr>
    //                 </thead>
    //                 <tbody>
    //                     ${team.tests.map(test => `
    //                         <tr>
    //                             <td>${new Date(test.date).toLocaleDateString('es-ES')}</td>
    //                             <td>${test.score}</td>
    //                             <td>${(test.lambda || this.lambda).toFixed(2)}</td>
    //                         </tr>
    //                     `).join('')}
    //                 </tbody>
    //             </table>
    //         </div>
    //     `;

    //     document.getElementById('modalHistorico').style.display = 'block';
    // }

    initChart() {
        const ctx = document.getElementById('graficoEvolucion');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Puntaje Ponderado',
                    data: [],
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Puntaje'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Fecha'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    },
                    title: {
                        display: true,
                        text: 'Evolución del Puntaje Ponderado'
                    }
                }
            }
        });
    }

    updateChart(teamName) {
        if (!this.chart || !this.teams.has(teamName)) return;

        const team = this.teams.get(teamName);
        const labels = [];
        const data = [];

        // Calculate cumulative weighted scores
        for (let i = 0; i < team.tests.length; i++) {
            const testsUpToI = team.tests.slice(0, i + 1);
            let weightedSum = 0;
            const n = testsUpToI.length;

            for (let j = 0; j < n; j++) {
                const test = testsUpToI[j];
                const lambda = test.lambda || this.lambda;
                const power = n - j - 1;
                const weight = Math.pow(lambda, power);
                weightedSum += weight * test.score;
            }

            const normalizer = 1 - this.lambda;
            const weightedScore = normalizer * weightedSum;

            labels.push(new Date(team.tests[i].date).toLocaleDateString('es-ES'));
            data.push(weightedScore);
        }

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.data.datasets[0].label = `${teamName} - Puntaje Ponderado`;
        this.chart.update();
    }

    updateMultiTeamChart() {
        if (!this.chart) return;

        // Get all unique dates from all teams
        const allDates = new Set();
        this.teams.forEach(team => {
            team.tests.forEach(test => allDates.add(test.date));
        });

        // Sort dates chronologically
        const sortedDates = Array.from(allDates).sort();
        
        // Colors for different teams
        const colors = [
            '#2196F3', '#FF9800', '#4CAF50', '#F44336', '#9C27B0',
            '#00BCD4', '#795548', '#607D8B', '#FF5722', '#3F51B5'
        ];

        // Create datasets for each team
        const datasets = [];
        let colorIndex = 0;

        this.teams.forEach((team, teamName) => {
            if (team.tests.length === 0) return; // Skip teams with no tests

            const teamData = [];
            
            // For each date, calculate the weighted score up to that date
            sortedDates.forEach(date => {
                const testsUpToDate = team.tests.filter(test => test.date <= date);
                
                if (testsUpToDate.length === 0) {
                    teamData.push(null); // No data for this team at this date
                } else {
                    // Calculate weighted score for tests up to this date
                    const n = testsUpToDate.length;
                    let weightedSum = 0;

                    for (let i = 0; i < n; i++) {
                        const test = testsUpToDate[i];
                        const lambda = test.lambda || this.lambda;
                        const power = n - i - 1;
                        const weight = Math.pow(lambda, power);
                        weightedSum += weight * test.score;
                    }

                    const normalizer = 1 - this.lambda;
                    teamData.push(normalizer * weightedSum);
                }
            });

            // Add dataset for this team
            datasets.push({
                label: teamName,
                data: teamData,
                borderColor: colors[colorIndex % colors.length],
                backgroundColor: colors[colorIndex % colors.length] + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                spanGaps: false // Don't connect across null values
            });
            colorIndex++;
        });

        // Format dates for display
        const formattedDates = sortedDates.map(date => 
            new Date(date).toLocaleDateString('es-ES')
        );

        // Update chart
        this.chart.data.labels = formattedDates;
        this.chart.data.datasets = datasets;
        this.chart.options.plugins.title.text = 'Evolución Comparativa de Todos los Equipos';
        this.chart.update();
    }

    clearTestForm() {
        document.getElementById('puntajePrueba').value = '';
        document.getElementById('equipoSeleccionado').value = '';
        // Keep the date persistent - don't reset it to today
        // this.setCurrentDate();
    }

    updateUI() {
        this.renderTeamsList();
        this.updateTeamSelectors();
        this.updateRankings();
        this.updateLastModified();
    }

    updateLastModified() {
        const timestamp = new Date().toLocaleString('es-ES');
        document.getElementById('ultimaActualizacion').textContent = `Última actualización: ${timestamp}`;
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('estadoGuardado');
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
        
        setTimeout(() => {
            statusEl.textContent = '💾 Datos guardados automáticamente';
            statusEl.className = 'status';
        }, 3000);
    }

    saveToLocalStorage() {
        try {
            const data = {
                teams: Array.from(this.teams.entries()),
                lambda: this.lambda,
                lastModified: new Date().toISOString()
            };
            localStorage.setItem('sportsEvaluation', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showStatus('Error al guardar datos', 'error');
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('sportsEvaluation');
            if (saved) {
                const data = JSON.parse(saved);
                this.teams = new Map(data.teams);
                this.lambda = data.lambda || 0.95;
                
                // Update lambda slider
                document.getElementById('lambdaGlobal').value = this.lambda;
                document.getElementById('lambdaValue').textContent = this.lambda;
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.showStatus('Error al cargar datos guardados', 'error');
        }
    }

    exportData() {
        try {
            const data = {
                teams: Array.from(this.teams.entries()),
                lambda: this.lambda,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `evaluacion-deportiva-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showStatus('Datos exportados correctamente', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showStatus('Error al exportar datos', 'error');
        }
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.teams && Array.isArray(data.teams)) {
                    this.teams = new Map(data.teams);
                    this.lambda = data.lambda || 0.95;
                    
                    // Update UI
                    document.getElementById('lambdaGlobal').value = this.lambda;
                    document.getElementById('lambdaValue').textContent = this.lambda;
                    
                    this.saveToLocalStorage();
                    this.updateUI();
                    this.showStatus('Datos importados correctamente', 'success');
                } else {
                    throw new Error('Formato de archivo inválido');
                }
            } catch (error) {
                console.error('Error importing file:', error);
                this.showStatus('Error al importar archivo', 'error');
            }
        };
        
        reader.readAsText(file);
        // Clear the input so the same file can be imported again
        event.target.value = '';
    }
}

// Global instance
let sportsSystem;

// Global functions called from HTML
async function agregarEquipo() {
    const input = document.getElementById('nombreEquipo');
    const name = input.value.trim();
    
    if (await sportsSystem.addTeam(name)) {
        input.value = '';
    }
}

async function eliminarEquipo(teamName) {
    await sportsSystem.removeTeam(teamName);
}

async function agregarDisciplina() {
    const input = document.getElementById('nombreDisciplina');
    const name = input.value.trim();

    if (await sportsSystem.addDiscipline(name)) {
        input.value = '';
    }
}

async function eliminarDisciplina(name) {
    await sportsSystem.removeDiscipline(name);
}

async function agregarPuntaje() {
    const date = document.getElementById('fechaPrueba').value;
    const discipline = document.getElementById('disciplinaSeleccionada').value;
    const team = document.getElementById('equipoSeleccionado').value;
    const score = parseFloat(document.getElementById('puntajePrueba').value);
    
    await sportsSystem.addTest(team, score, date, discipline);
}

function mostrarHistorico(teamName) {
    sportsSystem.showTeamHistory(teamName);
}

function cerrarModalHistorico() {
    document.getElementById('modalHistorico').style.display = 'none';
}

function importarDatos() {
    document.getElementById('archivoImportar').click();
}

function exportarDatos() {
    sportsSystem.exportData();
}

// Initialize the system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    sportsSystem = new SportsEvaluationSystem();
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('modalHistorico');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});
