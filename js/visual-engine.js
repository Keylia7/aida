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

    render: function(canvasId, visualConfig, criteriaData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const visual_type = visualConfig.visual_config.type;

        if (visual_type === 'horizontalBar') {
            return this.drawAgePyramid(ctx, criteriaData[0], visualConfig.visual_config);
        }else if (visual_type === 'doughnut'){
            return this.drawDoughnut(ctx, criteriaData[0], visualConfig.visual_config);
        }
        
        console.warn(`VisualEngine : Rendu non défini pour ${visualId}`);
    },


    drawAgePyramid: function(ctx, data, config) {
        const theme = this.getTheme();

        const labels = data.targets.map(t => t.short_label).reverse();
        const maleData = data.targets.map(t => -t.split.m).reverse(); 
        const femaleData = data.targets.map(t => t.split.f).reverse(); 

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

    drawDoughnut: function(ctx, data, config) {
        const theme = this.getTheme();
        
        // Génération d'un dégradé de Cyan pour les segments
        const colors = config.color_type === "h_f" ? [theme.colorF, theme.colorH] : theme.highContrastPalette;

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.targets.map(t => t.label),
                datasets: [{
                    data: data.targets.map(t => t.percentage),
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
    }
};