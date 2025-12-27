class SessionFileController {
    constructor(controller) {
        this.controller = controller;
    }

    get model() {
        return this.controller.model;
    }

    async addDocuments() {
        if (typeof toastManager === 'undefined') {
            console.error('ToastManager not found');
            return;
        }

        try {
            const result = await this.model.addFilesToSession();

            if (result.success && result.files) {
                // Check for duplicates
                if (result.duplicates && result.duplicates.length > 0) {
                    const dupCount = result.duplicates.length;
                    toastManager.show(
                        'File duplicati',
                        `${dupCount} file ${dupCount === 1 ? 'è già presente' : 'sono già presenti'} nella sessione`,
                        'warning'
                    );
                }

                // Check for new files added
                const newCount = result.newFilesCount || 0;
                if (newCount > 0) {
                    const currentSession = this.model.getCurrentSession();
                    currentSession.files = result.files;
                    this.controller.activeView.renderFileList(currentSession.files);

                    toastManager.show(
                        'File aggiunti',
                        `${newCount} ${newCount === 1 ? 'file aggiunto' : 'file aggiunti'} con successo`,
                        'success'
                    );
                }
            } else if (result.canceled) {
                // User canceled - no notification needed
            }
        } catch (error) {
            console.error(error);
            toastManager.show('Errore', 'Impossibile aggiungere i file', 'error');
        }
    }

    async deleteFile(fileName) {
        const currentSession = this.model.getCurrentSession();
        if (!currentSession) return;

        const result = await this.model.deleteFile(fileName);

        if (result.success) {
            // Rimuovi il file dalla sessione locale
            currentSession.files = currentSession.files.filter(f => f !== fileName);

            // Aggiorna la vista
            this.controller.activeView.renderFileList(currentSession.files);

            // Se il file eliminato era aperto, chiudi il visualizzatore
            // Accessing documentView through controller
            if (this.controller.documentView &&
                this.controller.documentView.viewerFilename &&
                this.controller.documentView.viewerFilename.textContent === fileName.split('/').pop().split('\\').pop()) {
                this.controller.documentView.closeDocument();
            }

            if (typeof toastManager !== 'undefined') {
                toastManager.show('Successo', 'File eliminato correttamente', 'success');
            }
        } else {
            if (typeof toastManager !== 'undefined') {
                toastManager.show('Errore', 'Impossibile eliminare il file', 'error');
            }
        }
    }
}
