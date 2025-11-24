class SessionModel {
    constructor() {
        this.currentSession = null;
        this.ipcRenderer = require('electron').ipcRenderer;
    }

    async getSessions() {
        return await this.ipcRenderer.invoke('get-sessions');
    }

    saveSession(session) {
        this.ipcRenderer.send('save-session', session);
    }

    async saveNote(content, fileName) {
        if (!this.currentSession) throw new Error('No active session');

        return await this.ipcRenderer.invoke('save-note', {
            sessionPath: this.currentSession.fullPath,
            fileName: fileName,
            content: content
        });
    }

    async addFilesToSession() {
        if (!this.currentSession) throw new Error('No active session');

        return await this.ipcRenderer.invoke('add-files-to-session', {
            sessionPath: this.currentSession.fullPath
        });
    }

    saveSessionData(sessionData) {
        this.ipcRenderer.send('save-session-data', sessionData);
    }

    setCurrentSession(session) {
        this.currentSession = session;
    }

    getCurrentSession() {
        return this.currentSession;
    }

    // Helper to process file paths for new sessions
    processNewSessionFiles(uploadedFiles) {
        return uploadedFiles.map(f => {
            let filePath = f.path;
            if (!filePath) {
                try {
                    const { webUtils } = require('electron');
                    filePath = webUtils.getPathForFile(f);
                } catch (e) {
                    // console.error('Error getting path:', e);
                }
            }
            return { name: f.name, path: filePath };
        });
    }
}
