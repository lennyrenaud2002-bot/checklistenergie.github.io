// Application Checklist Commerciale Selectra
// Gestion des forfaits AXA et Offset avec menus déroulants

class SelectraChecklist {
    constructor() {
        // Données des forfaits selon le JSON fourni
        this.axaForfaits = {
            "none": { label: "Aucune", price: 0 },
            "formule1": { label: "Formule 1", price: "3,99€/mois" },
            "formule2": { label: "Formule 2", price: "6,99€/mois" }
        };

        this.offsetPaliers = {
            "none": { label: "Aucune", price: 0, tonnes: 0 },
            "electricite": { label: "Électricité", price: "2,99€/mois", tonnes: "2,24t" },
            "gaz": { label: "Gaz", price: "3,99€/mois", tonnes: "2,98t" },
            "maison": { label: "Maison Nourriture", price: "4,99€/mois", tonnes: "3,59t" },
            "elec_gaz": { label: "Électricité + Gaz", price: "5,99€/mois", tonnes: "4,49t" },
            "perso": { label: "Perso", price: "7,50€/mois", tonnes: "5,4t" },
            "foyer": { label: "Foyer", price: "14,99€/mois", tonnes: "11,34t" }
        };

        // Configuration des sections
        this.sectionsConfig = {
            client: { total: 8, id: 'client' },
            accords: { total: 6, id: 'accords' },
            mentions: { total: 5, id: 'mentions' },
            sms: { total: 3, id: 'sms' },
            etapes: { total: 7, id: 'etapes' }
        };

        // État de l'application
        this.state = {
            formData: {},
            servicesPayants: {
                axa: false,
                offset: false,
                mcp: false
            },
            timer: {
                isRunning: false,
                startTime: null,
                elapsed: 0
            },
            autoSave: {
                enabled: true,
                lastSave: null
            }
        };

        this.init();
    }

    init() {
        console.log('🚀 Initialisation Selectra Checklist avec menus déroulants');
        this.setupEventListeners();
        this.setupTimer();
        this.setupAutoSave();
        this.loadSavedData();
        this.updateAllCounters();
        this.updateServicesStatus();
        this.updateValidateButton(); // S'assurer que le bouton est initialisé
        console.log('✅ Application initialisée avec forfaits AXA et Offset');
    }

    // === GESTION DES ÉVÉNEMENTS ===
    setupEventListeners() {
        // Sélecteurs de forfaits
        const axaSelect = document.getElementById('axa-select');
        const offsetSelect = document.getElementById('offset-select');
        
        if (axaSelect) {
            axaSelect.addEventListener('change', (e) => this.handleAxaSelection(e.target.value));
        }
        
        if (offsetSelect) {
            offsetSelect.addEventListener('change', (e) => this.handleOffsetSelection(e.target.value));
        }

        // Checkbox MCP
        const mcpCheckbox = document.querySelector('input[name="service_mcp"]');
        if (mcpCheckbox) {
            mcpCheckbox.addEventListener('change', (e) => this.handleMCPSelection(e.target.checked));
        }

        // Tous les autres inputs pour sauvegarde auto
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.handleInputChange(e.target);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('input[type="checkbox"]:not([name^="service_"])')) {
                this.handleInputChange(e.target);
            }
        });

        // Boutons d'action
        const saveBtn = document.getElementById('btn-save');
        const exportBtn = document.getElementById('btn-export');
        const validateBtn = document.getElementById('btn-validate');
        const timerBtn = document.getElementById('timer-toggle');

        if (saveBtn) saveBtn.addEventListener('click', () => this.saveData(true));
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());
        if (validateBtn) validateBtn.addEventListener('click', () => this.validateAndFinalize());
        if (timerBtn) timerBtn.addEventListener('click', () => this.toggleTimer());

        console.log('🔗 Event listeners configurés');
    }

    // === GESTION DES FORFAITS ===
    handleAxaSelection(value) {
        const priceDisplay = document.getElementById('axa-price');
        const serviceItem = document.querySelector('select[name="axa_forfait"]').closest('.service-item');
        
        if (value === 'none') {
            this.state.servicesPayants.axa = false;
            if (priceDisplay) priceDisplay.textContent = '-';
            if (serviceItem) serviceItem.classList.remove('selected');
        } else {
            this.state.servicesPayants.axa = true;
            if (priceDisplay) {
                priceDisplay.textContent = this.axaForfaits[value].price;
                // Animation du prix
                priceDisplay.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    priceDisplay.style.transform = 'scale(1)';
                }, 200);
            }
            if (serviceItem) serviceItem.classList.add('selected');
        }

        this.state.formData.axa_forfait = value;
        this.updateServicesStatus();
        this.updateConditionalElements();
        this.autoSaveData();
        
        console.log(`🛡️ AXA sélectionné: ${value} (${this.axaForfaits[value].label})`);
    }

    handleOffsetSelection(value) {
        const priceDisplay = document.getElementById('offset-price');
        const serviceItem = document.querySelector('select[name="offset_palier"]').closest('.service-item');
        
        if (value === 'none') {
            this.state.servicesPayants.offset = false;
            if (priceDisplay) priceDisplay.textContent = '-';
            if (serviceItem) serviceItem.classList.remove('selected');
        } else {
            this.state.servicesPayants.offset = true;
            const palier = this.offsetPaliers[value];
            if (priceDisplay) {
                priceDisplay.textContent = palier.price;
                // Animation du prix
                priceDisplay.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    priceDisplay.style.transform = 'scale(1)';
                }, 200);
            }
            if (serviceItem) serviceItem.classList.add('selected');
        }

        this.state.formData.offset_palier = value;
        this.updateServicesStatus();
        this.updateConditionalElements();
        this.autoSaveData();
        
        console.log(`🌱 Offset sélectionné: ${value} (${this.offsetPaliers[value].label})`);
    }

    handleMCPSelection(checked) {
        this.state.servicesPayants.mcp = checked;
        this.state.formData.service_mcp = checked;
        this.updateServicesStatus();
        this.autoSaveData();
        
        console.log(`👨‍💼 MCP sélectionné: ${checked}`);
    }

    // === ÉLÉMENTS CONDITIONNELS ===
    updateConditionalElements() {
        this.updateMentionsLegales();
        this.updateSignaturesSMS();
    }

    updateMentionsLegales() {
        const axaMentions = document.getElementById('mentions-axa');
        const carboneMentions = document.getElementById('mentions-carbone');
        const placeholder = document.getElementById('mentions-placeholder');

        let visibleCount = 0;

        // AXA Mentions
        if (this.state.servicesPayants.axa && axaMentions) {
            axaMentions.style.display = 'flex';
            axaMentions.classList.add('fade-in');
            visibleCount++;
        } else if (axaMentions) {
            axaMentions.style.display = 'none';
            axaMentions.classList.remove('fade-in');
        }

        // Carbone Mentions
        if (this.state.servicesPayants.offset && carboneMentions) {
            carboneMentions.style.display = 'flex';
            carboneMentions.classList.add('fade-in');
            visibleCount++;
        } else if (carboneMentions) {
            carboneMentions.style.display = 'none';
            carboneMentions.classList.remove('fade-in');
        }

        // Placeholder
        if (placeholder) {
            if (visibleCount === 0) {
                placeholder.style.display = 'block';
            } else {
                placeholder.style.display = 'none';
            }
        }

        // Mettre à jour le total des mentions
        this.sectionsConfig.mentions.total = 5 - 2 + visibleCount; // 5 de base - 2 conditionnelles + visibles
        this.updateCounter('mentions');
    }

    updateSignaturesSMS() {
        const axaSMS = document.getElementById('sms-axa');
        const carboneSMS = document.getElementById('sms-carbone');
        const placeholder = document.getElementById('sms-placeholder');

        let visibleCount = 0;

        // AXA SMS
        if (this.state.servicesPayants.axa && axaSMS) {
            axaSMS.style.display = 'flex';
            axaSMS.classList.add('fade-in');
            visibleCount++;
        } else if (axaSMS) {
            axaSMS.style.display = 'none';
            axaSMS.classList.remove('fade-in');
        }

        // Carbone SMS
        if (this.state.servicesPayants.offset && carboneSMS) {
            carboneSMS.style.display = 'flex';
            carboneSMS.classList.add('fade-in');
            visibleCount++;
        } else if (carboneSMS) {
            carboneSMS.style.display = 'none';
            carboneSMS.classList.remove('fade-in');
        }

        // Placeholder
        if (placeholder) {
            if (visibleCount === 0) {
                placeholder.style.display = 'block';
            } else {
                placeholder.style.display = 'none';
            }
        }

        // Mettre à jour le total des SMS
        this.sectionsConfig.sms.total = 3 - 2 + visibleCount; // 3 de base - 2 conditionnelles + visibles
        this.updateCounter('sms');
    }

    // === STATUT DES SERVICES ===
    updateServicesStatus() {
        const servicesCount = Object.values(this.state.servicesPayants).filter(Boolean).length;
        const countElement = document.getElementById('services-count');
        const statusElement = document.getElementById('services-status');

        if (countElement) {
            countElement.textContent = servicesCount;
        }

        if (statusElement) {
            let statusHTML = '';
            if (servicesCount === 0) {
                statusHTML = '<span class="status status--error">❌ Aucun service sélectionné</span>';
            } else if (servicesCount === 1) {
                statusHTML = '<span class="status status--warning">⚠️ 1 service sélectionné (minimum 2)</span>';
            } else if (servicesCount >= 2) {
                statusHTML = '<span class="status status--success">✅ Minimum requis respecté</span>';
            }
            statusElement.innerHTML = statusHTML;
        }

        // Mettre à jour la progression des services
        const servicesProgress = document.getElementById('services-progress');
        if (servicesProgress) {
            if (servicesCount >= 2) {
                servicesProgress.textContent = 'Conforme ✅';
                servicesProgress.style.color = 'var(--color-success)';
            } else {
                servicesProgress.textContent = 'Non conforme';
                servicesProgress.style.color = 'var(--color-error)';
            }
        }

        this.updateGlobalProgress();
        this.updateValidateButton();
    }

    // === GESTION DES INPUTS ===
    handleInputChange(input) {
        const name = input.name;
        let value;

        if (input.type === 'checkbox') {
            value = input.checked;
        } else {
            value = input.value;
        }

        this.state.formData[name] = value;

        // Identifier la section pour mise à jour du compteur
        const sectionName = this.getSectionFromInputName(name);
        if (sectionName) {
            this.updateCounter(sectionName);
        }

        this.updateGlobalProgress();
        this.updateValidateButton();
        this.autoSaveData();
    }

    getSectionFromInputName(name) {
        if (name.startsWith('client_')) return 'client';
        if (name.startsWith('accord_')) return 'accords';
        if (name.startsWith('mentions_')) return 'mentions';
        if (name.startsWith('sms_')) return 'sms';
        if (name.startsWith('etape_')) return 'etapes';
        return null;
    }

    // === COMPTEURS ===
    updateCounter(sectionName) {
        const config = this.sectionsConfig[sectionName];
        if (!config) return;

        const inputs = this.getSectionInputs(sectionName);
        const completed = inputs.filter(input => {
            if (input.type === 'checkbox') return input.checked;
            return input.value.trim() !== '';
        }).length;

        const counterElement = document.getElementById(`${sectionName}-counter`);
        const fillElement = document.getElementById(`${sectionName}-fill`);

        if (counterElement) {
            counterElement.textContent = completed;
        }

        if (fillElement) {
            const percentage = (completed / config.total) * 100;
            fillElement.style.width = `${percentage}%`;
        }

        console.log(`📊 ${sectionName}: ${completed}/${config.total} (${Math.round((completed / config.total) * 100)}%)`);
    }

    updateAllCounters() {
        Object.keys(this.sectionsConfig).forEach(section => {
            this.updateCounter(section);
        });
    }

    getSectionInputs(sectionName) {
        switch (sectionName) {
            case 'client':
                return document.querySelectorAll('input[name^="client_"], textarea[name^="client_"]');
            case 'accords':
                return document.querySelectorAll('input[name^="accord_"]');
            case 'mentions':
                return document.querySelectorAll('input[name^="mentions_"]:not([style*="display: none"])');
            case 'sms':
                return document.querySelectorAll('input[name^="sms_"]:not([style*="display: none"])');
            case 'etapes':
                return document.querySelectorAll('input[name^="etape_"]');
            default:
                return [];
        }
    }

    // === PROGRESSION GLOBALE ===
    updateGlobalProgress() {
        let totalFields = 0;
        let completedFields = 0;
        let requiredFields = 0;
        let completedRequired = 0;

        Object.entries(this.sectionsConfig).forEach(([section, config]) => {
            const inputs = this.getSectionInputs(section);
            totalFields += config.total;

            inputs.forEach(input => {
                const isCompleted = input.type === 'checkbox' ? input.checked : input.value.trim() !== '';
                if (isCompleted) completedFields++;

                // Champs obligatoires
                if (input.required || input.classList.contains('obligatoire') || 
                    input.closest('.obligatoire') || section === 'accords') {
                    requiredFields++;
                    if (isCompleted) completedRequired++;
                }
            });
        });

        // Mise à jour des affichages
        const totalProgress = document.getElementById('total-progress');
        const requiredProgress = document.getElementById('required-progress');
        const globalFill = document.getElementById('global-progress-fill');

        const totalPercentage = Math.round((completedFields / totalFields) * 100);
        const requiredPercentage = requiredFields > 0 ? Math.round((completedRequired / requiredFields) * 100) : 0;

        if (totalProgress) totalProgress.textContent = `${totalPercentage}%`;
        if (requiredProgress) requiredProgress.textContent = `${requiredPercentage}%`;
        if (globalFill) globalFill.style.width = `${totalPercentage}%`;

        console.log(`🎯 Progression globale: ${totalPercentage}% | Obligatoires: ${requiredPercentage}%`);
    }

    // === VALIDATION ===
    updateValidateButton() {
        const validateBtn = document.getElementById('btn-validate');
        if (!validateBtn) {
            console.warn('⚠️ Bouton de validation non trouvé');
            return;
        }

        const servicesCount = Object.values(this.state.servicesPayants).filter(Boolean).length;
        const rgpdChecked = document.querySelector('input[name="accord_rgpd"]')?.checked || false;
        
        const isValid = servicesCount >= 2 && rgpdChecked;
        
        validateBtn.disabled = !isValid;
        
        if (isValid) {
            validateBtn.textContent = '✅ Valider & Finaliser';
            validateBtn.style.background = '#0052CC';
            validateBtn.style.opacity = '1';
            validateBtn.style.cursor = 'pointer';
        } else {
            const reason = servicesCount < 2 ? 'Services manquants' : 'RGPD requis';
            validateBtn.textContent = `⚠️ ${reason}`;
            validateBtn.style.background = 'var(--color-secondary)';
            validateBtn.style.opacity = '0.6';
            validateBtn.style.cursor = 'not-allowed';
        }

        console.log(`🔘 Bouton validation: ${isValid ? 'ACTIVÉ' : 'DÉSACTIVÉ'} (Services: ${servicesCount}/2, RGPD: ${rgpdChecked})`);
    }

    validateAndFinalize() {
        const servicesCount = Object.values(this.state.servicesPayants).filter(Boolean).length;
        const rgpdChecked = document.querySelector('input[name="accord_rgpd"]')?.checked || false;

        if (servicesCount < 2) {
            alert('❌ Minimum 2 services payants requis pour finaliser');
            return;
        }

        if (!rgpdChecked) {
            alert('❌ L\'accord RGPD est obligatoire pour finaliser');
            return;
        }

        // Animation de succès
        const btn = document.getElementById('btn-validate');
        if (btn) {
            btn.textContent = '🎉 Checklist Finalisée !';
            btn.style.background = 'var(--color-success)';
            btn.disabled = true;
        }

        this.saveData(true);
        this.stopTimer();

        // Générer un récapitulatif détaillé
        const recap = this.generateFinalRecap();

        setTimeout(() => {
            alert(`🎉 Checklist commerciale finalisée avec succès !\n\n${recap}`);
        }, 500);

        console.log('🎉 Checklist finalisée avec succès');
    }

    generateFinalRecap() {
        const servicesCount = Object.values(this.state.servicesPayants).filter(Boolean).length;
        let recap = `Services sélectionnés: ${servicesCount}/3\n`;
        
        if (this.state.servicesPayants.axa) {
            const forfait = this.state.formData.axa_forfait;
            recap += `• AXA: ${this.axaForfaits[forfait]?.price}\n`;
        }
        
        if (this.state.servicesPayants.offset) {
            const palier = this.state.formData.offset_palier;
            recap += `• Carbone: ${this.offsetPaliers[palier]?.price}\n`;
        }
        
        if (this.state.servicesPayants.mcp) {
            recap += `• MCP: Sélectionné\n`;
        }
        
        recap += `\nDurée: ${this.formatTime(this.state.timer.elapsed)}`;
        recap += `\nDonnées sauvegardées automatiquement.`;
        
        return recap;
    }

    // === TIMER ===
    setupTimer() {
        setInterval(() => {
            if (this.state.timer.isRunning) {
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    toggleTimer() {
        const btn = document.getElementById('timer-toggle');
        
        if (this.state.timer.isRunning) {
            this.stopTimer();
            if (btn) btn.textContent = '▶️ Reprendre';
        } else {
            this.startTimer();
            if (btn) btn.textContent = '⏸️ Pause';
        }
    }

    startTimer() {
        if (!this.state.timer.isRunning) {
            this.state.timer.startTime = Date.now() - this.state.timer.elapsed;
            this.state.timer.isRunning = true;
            console.log('⏱️ Timer démarré');
        }
    }

    stopTimer() {
        if (this.state.timer.isRunning) {
            this.state.timer.elapsed = Date.now() - this.state.timer.startTime;
            this.state.timer.isRunning = false;
            console.log(`⏱️ Timer arrêté: ${this.formatTime(this.state.timer.elapsed)}`);
        }
    }

    updateTimerDisplay() {
        const display = document.getElementById('global-timer');
        if (!display) return;

        const elapsed = Date.now() - this.state.timer.startTime;
        display.textContent = `⏱️ ${this.formatTime(elapsed)}`;
    }

    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // === SAUVEGARDE ===
    setupAutoSave() {
        // Démarrer la sauvegarde automatique
        setInterval(() => {
            if (this.state.autoSave.enabled) {
                this.autoSaveData();
            }
        }, 30000); // Toutes les 30 secondes
    }

    autoSaveData() {
        if (!this.state.autoSave.enabled) return;
        
        this.saveData(false);
        this.state.autoSave.lastSave = new Date();
        
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            saveStatus.textContent = '💾 Sauvegardé automatiquement';
            saveStatus.style.color = 'var(--color-success)';
            
            setTimeout(() => {
                saveStatus.textContent = '💾 Sauvegarde automatique';
                saveStatus.style.color = '';
            }, 2000);
        }
    }

    saveData(manual = false) {
        const dataToSave = {
            formData: this.state.formData,
            servicesPayants: this.state.servicesPayants,
            timer: this.state.timer.elapsed,
            timestamp: new Date().toISOString()
        };

        try {
            localStorage.setItem('selectra_checklist', JSON.stringify(dataToSave));
            
            if (manual) {
                alert('💾 Données sauvegardées avec succès !');
                console.log('💾 Sauvegarde manuelle effectuée');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
        }
    }

    loadSavedData() {
        try {
            const saved = localStorage.getItem('selectra_checklist');
            if (!saved) return;

            const data = JSON.parse(saved);
            
            // Restaurer les données du formulaire
            Object.entries(data.formData || {}).forEach(([name, value]) => {
                const input = document.querySelector(`[name="${name}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = value;
                    } else {
                        input.value = value;
                    }
                }
            });

            // Restaurer les services payants
            if (data.servicesPayants) {
                this.state.servicesPayants = data.servicesPayants;
                
                // Restaurer les sélecteurs
                if (data.formData.axa_forfait && data.formData.axa_forfait !== 'none') {
                    const axaSelect = document.getElementById('axa-select');
                    if (axaSelect) {
                        axaSelect.value = data.formData.axa_forfait;
                        this.handleAxaSelection(data.formData.axa_forfait);
                    }
                }
                
                if (data.formData.offset_palier && data.formData.offset_palier !== 'none') {
                    const offsetSelect = document.getElementById('offset-select');
                    if (offsetSelect) {
                        offsetSelect.value = data.formData.offset_palier;
                        this.handleOffsetSelection(data.formData.offset_palier);
                    }
                }
            }

            // Restaurer le timer
            if (data.timer) {
                this.state.timer.elapsed = data.timer;
            }

            this.updateAllCounters();
            this.updateServicesStatus();
            this.updateConditionalElements();

            console.log('📂 Données restaurées depuis la sauvegarde');
        } catch (error) {
            console.warn('⚠️ Erreur lors du chargement des données:', error);
        }
    }

    // === EXPORT ===
    exportData() {
        const exportData = this.generateExportData();
        const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `selectra_checklist_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log('📄 Export généré et téléchargé');
    }

    generateExportData() {
        const servicesCount = Object.values(this.state.servicesPayants).filter(Boolean).length;
        
        let content = `SELECTRA - CHECKLIST COMMERCIALE\n`;
        content += `${'='.repeat(40)}\n`;
        content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n`;
        content += `Heure: ${new Date().toLocaleTimeString('fr-FR')}\n`;
        content += `Durée: ${this.formatTime(this.state.timer.elapsed)}\n\n`;

        // Informations client
        content += `INFORMATIONS CLIENT\n`;
        content += `${'='.repeat(20)}\n`;
        ['client_nom', 'client_tel', 'client_email', 'client_adresse', 'client_pdl', 'client_pce'].forEach(field => {
            const value = this.state.formData[field] || 'Non renseigné';
            const label = field.replace('client_', '').toUpperCase();
            content += `${label}: ${value}\n`;
        });

        // Services payants
        content += `\nSERVICES PAYANTS (${servicesCount}/3)\n`;
        content += `${'='.repeat(25)}\n`;
        
        if (this.state.servicesPayants.axa) {
            const forfait = this.state.formData.axa_forfait;
            content += `🛡️ AXA Assistance: ${this.axaForfaits[forfait]?.label || forfait} (${this.axaForfaits[forfait]?.price})\n`;
        }
        
        if (this.state.servicesPayants.offset) {
            const palier = this.state.formData.offset_palier;
            content += `🌱 Compensation Carbone: ${this.offsetPaliers[palier]?.label || palier} (${this.offsetPaliers[palier]?.price})\n`;
        }
        
        if (this.state.servicesPayants.mcp) {
            content += `👨‍💼 Mon Conseiller Perso: Sélectionné\n`;
        }

        content += `\nSTATUT: ${servicesCount >= 2 ? '✅ CONFORME (Minimum 2 services)' : '❌ NON CONFORME'}\n`;

        // Accords
        content += `\nACCORDS RGPD\n`;
        content += `${'='.repeat(12)}\n`;
        ['accord_rgpd', 'accord_enregistrement', 'accord_reseau', 'accord_final'].forEach(field => {
            const checked = this.state.formData[field] ? '✅' : '❌';
            const label = field.replace('accord_', '').toUpperCase();
            content += `${checked} ${label}\n`;
        });

        // Notes
        if (this.state.formData.notes_commerciales || this.state.formData.notes_objections || this.state.formData.notes_attention) {
            content += `\nNOTES\n`;
            content += `${'='.repeat(5)}\n`;
            if (this.state.formData.notes_commerciales) content += `Commerciales: ${this.state.formData.notes_commerciales}\n`;
            if (this.state.formData.notes_objections) content += `Objections: ${this.state.formData.notes_objections}\n`;
            if (this.state.formData.notes_attention) content += `Attention: ${this.state.formData.notes_attention}\n`;
        }

        content += `\n${'='.repeat(40)}\n`;
        content += `Checklist générée par Selectra v2.0\n`;

        return content;
    }
}

// === INITIALISATION ===
let selectraChecklist;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Démarrage Selectra Checklist avec forfaits...');
    
    try {
        selectraChecklist = new SelectraChecklist();
        console.log('✅ Application prête avec menus déroulants AXA et Offset');
        console.log('🛡️ AXA: Aucune, Formule 1 (3,99€), Formule 2 (6,99€)');
        console.log('🌱 Offset: 6 paliers de compensation carbone (2,99€ à 14,99€)');
        console.log('👨‍💼 MCP: Checkbox standard maintenu');
        console.log('📊 Minimum 2 services payants requis pour validation');
        console.log('🔘 Bouton "Valider & Finaliser" configuré');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
});

// === GESTION DES ERREURS ===
window.addEventListener('error', function(e) {
    console.error('❌ Erreur JavaScript:', e.error);
});

window.addEventListener('beforeunload', function(e) {
    if (selectraChecklist) {
        selectraChecklist.saveData(false);
    }
});