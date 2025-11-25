class HomeModel {
    constructor() {
        this.ipcRenderer = require('electron').ipcRenderer;
    }

    async getRecentSessions(limit = 3) {
        try {
            const sessions = await this.ipcRenderer.invoke('get-sessions');

            // Ordina per lastModified (più recenti prima)
            const sortedSessions = sessions.sort((a, b) => {
                const dateA = new Date(a.lastModified || a.createdAt || 0);
                const dateB = new Date(b.lastModified || b.createdAt || 0);
                return dateB - dateA;
            });

            // Prendi solo le prime N sessioni
            return sortedSessions.slice(0, limit);
        } catch (error) {
            console.error('Error loading recent sessions:', error);
            return [];
        }
    }

    async getSessionByPath(sessionPath) {
        try {
            const sessions = await this.ipcRenderer.invoke('get-sessions');
            return sessions.find(s => s.fullPath === sessionPath);
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }
}
