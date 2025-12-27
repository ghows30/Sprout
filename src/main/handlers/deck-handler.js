const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function registerDeckHandlers() {
    ipcMain.handle('save-deck', async (event, { sessionPath, deck }) => {
        try {
            if (!sessionPath || !deck) {
                throw new Error('Missing sessionPath or deck');
            }

            const flashcardsDir = path.join(sessionPath, 'flashcards');
            if (!fs.existsSync(flashcardsDir)) {
                fs.mkdirSync(flashcardsDir, { recursive: true });
            }

            const safeDeckName = deck.name.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();
            const deckDir = path.join(flashcardsDir, safeDeckName);

            if (!fs.existsSync(deckDir)) {
                fs.mkdirSync(deckDir, { recursive: true });
            }

            const deckFile = path.join(deckDir, 'data.json');

            deck.lastModified = new Date().toISOString();

            fs.writeFileSync(deckFile, JSON.stringify(deck, null, 2));
            return { success: true, path: deckDir };
        } catch (error) {
            console.error('Error saving deck:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('load-decks', async (event, { sessionPath }) => {
        try {
            if (!sessionPath) {
                throw new Error('Missing sessionPath');
            }

            const flashcardsDir = path.join(sessionPath, 'flashcards');
            if (!fs.existsSync(flashcardsDir)) {
                return { success: true, decks: [] };
            }

            const decks = [];
            const items = fs.readdirSync(flashcardsDir, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory()) {
                    const deckFile = path.join(flashcardsDir, item.name, 'data.json');
                    if (fs.existsSync(deckFile)) {
                        try {
                            const data = fs.readFileSync(deckFile, 'utf8');
                            const deck = JSON.parse(data);
                            decks.push(deck);
                        } catch (e) {
                            console.error(`Error reading deck in ${item.name}:`, e);
                        }
                    }
                }
            }

            return { success: true, decks };
        } catch (error) {
            console.error('Error loading decks:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('delete-deck', async (event, { sessionPath, deckName }) => {
        try {
            if (!sessionPath || !deckName) {
                throw new Error('Missing sessionPath or deckName');
            }

            const safeDeckName = deckName.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();
            const deckDir = path.join(sessionPath, 'flashcards', safeDeckName);

            if (!fs.existsSync(deckDir)) {
                return { success: false, error: 'DECK_NOT_FOUND' };
            }

            fs.rmSync(deckDir, { recursive: true, force: true });
            return { success: true };
        } catch (error) {
            console.error('Error deleting deck:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('rename-deck', async (event, { sessionPath, oldName, newName }) => {
        try {
            if (!sessionPath || !oldName || !newName) {
                throw new Error('Missing parameters');
            }

            const safeOldName = oldName.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();
            const safeNewName = newName.replace(/[^a-z0-9àèéìòùç\s-_]/gi, '').trim();

            const flashcardsDir = path.join(sessionPath, 'flashcards');
            const oldDir = path.join(flashcardsDir, safeOldName);
            const newDir = path.join(flashcardsDir, safeNewName);

            if (!fs.existsSync(oldDir)) {
                return { success: false, error: 'DECK_NOT_FOUND' };
            }

            if (fs.existsSync(newDir) && oldDir !== newDir) {
                return { success: false, error: 'DECK_NAME_EXISTS' };
            }

            fs.renameSync(oldDir, newDir);

            const deckFile = path.join(newDir, 'data.json');
            if (fs.existsSync(deckFile)) {
                const data = JSON.parse(fs.readFileSync(deckFile, 'utf8'));
                data.name = newName;
                data.lastModified = new Date().toISOString();
                fs.writeFileSync(deckFile, JSON.stringify(data, null, 2));
            }

            return { success: true };
        } catch (error) {
            console.error('Error renaming deck:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = registerDeckHandlers;
