/**
 * VisualEngine - Moteur de rendu graphique AIDA
 * Centralise la logique Chart.js pour l'ensemble de l'application.
 */
const VisualEngine = {

    getCSSVariable: function(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    },

    getTheme: function() {
        return {
            cyan: this.getCSSVariable('--cyan'),
            cyanGradation1: this.getCSSVariable('--cyan-gradation_1'),
            cyanGradation2: this.getCSSVariable('--cyan-gradation_2'),
            cyanGradation3: this.getCSSVariable('--cyan-gradation_3'),
            cyanGradation4: this.getCSSVariable('--cyan-gradation_4'),
            cyanDark: this.getCSSVariable('--cyan-dark'),
            borderColor: this.getCSSVariable('--border-color'),
            text: '#a0aec0',
            grid: 'rgba(255, 255, 255, 0.05)',
            highContrastPalette:  [
                '#00f2ff', // Cyan (Zone 1)
                '#0047ff', // Bleu Cobalt (Zone 2)
                '#9d00ff', // Violet Néon (Zone 3)
                '#ffffff', // Blanc (Zone 4)
                '#4a5568', // Gris Acier (Zone 5)
                '#2e008b'  // Indigo (Zone 6)
            ],
            colorH: '#ff0055',
            colorF:'#00f2ff'
        };
    },

    render: function(canvasId, visualConfig, targets, categories = null) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const visual_type = visualConfig.visual_config.type;

        if (visual_type === 'horizontalBar') {
            return this.drawAgePyramid(ctx, targets, visualConfig.visual_config);
        }else if (visual_type === 'doughnut'){
            return this.drawDoughnut(ctx, targets, visualConfig.visual_config);
        }else if (visual_type === 'radar'){
            return this.drawRadar(ctx, targets, visualConfig.visual_config);
        }else if (visual_type === 'stackedBar'){
            return this.drawStackedBar(ctx, targets, visualConfig.visual_config, categories);
        }
        
        console.warn(`VisualEngine : Rendu non défini pour ${visualId}`);
    },


    drawAgePyramid: function(ctx, targets, config) {
        const theme = this.getTheme();

        const labels = targets.map(t => t.short_label).reverse();
        const maleData = targets.map(t => -t.split.m).reverse(); 
        const femaleData = targets.map(t => t.split.f).reverse(); 

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'H',
                        data: maleData,
                        backgroundColor: theme.colorH,
                        borderColor: theme.borderColor,
                        borderWidth: 1,
                        borderRadius: 2
                    },
                    {
                        label: 'F',
                        data: femaleData,
                        backgroundColor: theme.colorF,
                        borderColor: '#fff',
                        borderWidth: 1,
                        borderRadius: 2
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        grid: { color: theme.grid },
                        ticks: {
                            color: theme.text,
                            callback: (value) => Math.abs(value) + '%'
                        }
                    },
                    y: {
                        stacked: true,
                        grid: { display: false },
                        ticks: { color: theme.text }
                    }
                },
                plugins: {
                    legend: {
                        display: config.show_legend,
                        labels: { 
                            color: theme.text, 
                            font: { family: 'Orbitron' },
                            boxWidth: 12
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                label += Math.abs(context.parsed.x) + '%';
                                return label;
                            }
                        }
                    }
                }
            }
        });
    },

    drawDoughnut: function(ctx, targets, config) {
        const theme = this.getTheme();
        
        const colors = config.color_type === "h_f" ? [theme.colorF, theme.colorH] : theme.highContrastPalette;

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: targets.map(t => t.label),
                datasets: [{
                    data: targets.map(t => t.percentage),
                    backgroundColor: colors,
                    borderColor: theme.borderColor,
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: config.cutout,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: theme.text,
                            font: { family: 'Orbitron', size: 12 },
                            padding: 20,
                            boxWidth: 10
                        }
                    },
                    title: {
                        display: true,
                        padding: { bottom: 20 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ' : ';
                                }
                                const value = context.parsed;
                                return label + value + ' %';
                            }
                        }
                    }
                }
            }
        });
    },

    drawRadar: function(ctx, targets, config) {
        const theme = this.getTheme();

        return new Chart(ctx, {
            type: 'radar',
            data: {
                labels: targets.map(t => t.label),
                datasets: [{
                    data: targets.map(t => t.percentage),
                    backgroundColor: 'rgba(0, 242, 255, 0.2)', // Fond cyan transparent
                    borderColor: '#00f2ff',
                    borderWidth: 2,
                    pointBackgroundColor: '#00f2ff',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#00f2ff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: config.cutout,
                scales: {
                    r: { // Configuration de l'axe radial
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: theme.text,
                            font: { family: 'Orbitron', size: 10 }
                        },
                        ticks: {
                            display: false,
                            stepSize: 20
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    drawStackedBar: function(ctx, targets, config, categories) {
        const theme = this.getTheme();

        console.log(categories);
        console.log(targets);
        
        // Palette de couleurs (du gris/sombre au cyan/violet intense)
        const paletteHard = [
            'rgba(255, 255, 255, 0.05)', // 0: Nul (presque invisible)
            '#1a3a3a',                  // 1: Notions (Gris-bleu sombre)
            '#005f66',                  // 2: Pratique
            '#00b8c2',                  // 3: Autonome
            '#00f2ff',                  // 4: Avancé (Cyan vif)
            '#ffffff'                   // 5: Expert (Blanc pur - éclate dans le noir)
        ];

        const paletteSoft = [
            'rgba(255, 255, 255, 0.05)', // 0: Nul
            '#2d1a3a',                  // 1: Notions
            '#5a2d8a',                  // 2: Pratique
            '#8a3ffc',                  // 3: Autonome
            '#be95ff',                  // 4: Avancé
            '#ffffff'                   // 5: Expert
        ];
        const palette = config.color_scheme === "paletteSoft" ? paletteSoft : paletteHard;

        const datasets = Object.entries(categories).map(([key, label]) => {
        return {
            label: label,
            data: targets.map(t => t.distribution[key] || 0),
            backgroundColor: palette[parseInt(key)], 
            borderWidth: 0,
            stack: 'stack0'
        };
    });

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: targets.map(t => t.label),
                datasets: datasets
            },
            options: {
                indexAxis: 'y', 
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        max: 100, 
                        grid: { color: theme.grid },
                        ticks: { color: theme.text, callback: value => value + '%' }
                    },
                    y: {
                        stacked: true,
                        grid: { display: false },
                        ticks: { 
                            color: theme.text, 
                            font: { family: 'Orbitron', size: 10 } 
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: theme.text, font: { family: 'Orbitron', size: 9 } }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }
};