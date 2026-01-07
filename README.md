# Sprout 🌱

**Sprout** è un'applicazione desktop moderna progettata per ottimizzare il tuo flusso di studio. Combina la gestione organizzata dei documenti, un potente editor di testo e un sistema avanzato di flashcard per aiutarti a imparare in modo più efficace.

Costruito con **Electron**, offre un'esperienza fluida e reattiva, ideale per studenti e professionisti che vogliono mantenere tutto il materiale di studio in un unico posto.

---

## ✨ Funzionalità Principali

*   **📂 Gestione Sessioni**: Organizza il tuo studio in spazi dedicati e separati.
*   **📝 Editor Avanzato**: Prendi appunti ricchi con formattazione, liste, immagini e altro ancora.
*   **💡 Flashcard Intelligenti**: Crea mazzi, studia con il metodo della ripetizione e traccia i tuoi progressi.
*   **🧠 Modalità Studio**: Interfaccia immersiva per concentrarti sui concetti chiave, con funzionalità di "Annulla" per correggere errori.
*   **⏱️ Timer Integrato**: Gestisci il tempo di studio direttamente nell'app con un timer personalizzabile.
*   **🎨 Personalizzazione**: Temi chiaro/scuro e opzioni di accessibilità.

---

## 🚀 Come Iniziare (Per il Professore / Valutatore)

Segui questi passaggi per scaricare, installare e avviare il progetto sulla tua macchina.

### Prerequisiti
Assicurati di avere installato sul tuo computer:
*   [Node.js](https://nodejs.org/) (versione 14 o superiore)
*   [npm](https://www.npmjs.com/) (solitamente incluso nell'installazione di Node.js)

### Installazione

1.  **Apri il terminale** nella cartella radice del progetto (dove si trova questo file `README.md`).
2.  **Installa le dipendenze** eseguendo il comando:
    ```bash
    npm install
    ```
    *Questo scaricherà tutte le librerie necessarie (Electron, ecc.) nella cartella `node_modules`.*

### Avvio

Una volta completata l'installazione, avvia l'applicazione con:
```bash
npm start
```
L'applicazione si aprirà in una nuova finestra desktop.

---

## 🛠️ Tecnologie Utilizzate

*   **Electron**: Framework per creare applicazioni desktop cross-platform.
*   **JavaScript (ES6+)**: Logica applicativa.
*   **HTML5 / CSS3**: Struttura e stile dell'interfaccia (senza framework CSS pesanti).
*   **Node.js**: Backend locale per la gestione del file system.

---

## 🏗️ Design Patterns Implementati

Il progetto fa uso di diversi Design Patterns per garantire un'architettura manutenibile e scalabile:

### 1. Observer Pattern
Utilizzato per la gestione reattiva degli eventi.
*   **Implementazione**: `EventManager.js` gestisce gli eventi globali (es. `SESSION_CREATED`). I componenti (viste, controller) si iscrivono a questi eventi e reagiscono automaticamente ai cambiamenti di stato senza accoppiamento diretto.

### 2. Singleton Pattern
Garantisce l'unicità delle istanze per i gestori di stato globale.
*   **Implementazione**:
    *   `SessionModel.js`: Unica fonte di verità per i dati della sessione corrente.
    *   `ToastManager.js`: Gestore centralizzato per le notifiche utente.

### 3. Facade Pattern
Semplifica l'interazione con logiche complesse.
*   **Implementazione**: `SessionController.js` agisce da Facade, esponendo metodi semplici (es. `createSession`) che orchestrano operazioni complesse tra Modello e Vista, nascondendo i dettagli implementativi all'UI.

### 4. Memento Pattern
Implementa la funzionalità di "Annulla" (Undo) nelle Flashcard.
*   **Implementazione**:
    *   `StudyMemento.js`: Cattura lo stato istantaneo (snapshot).
    *   `StudyHistory.js`: (Caretaker) Mantiene la cronologia degli stati.
    *   `FlashcardView.js`: (Originator) Crea e ripristina gli stati.

### 5. Adapter Pattern
Gestisce l'importazione di flashcard da formati diversi.
*   **Implementazione**:
    *   `importers/adapters/CsvFlashcardAdapter.js`: Adatta file CSV al modello interno di Card.
    *   `importers/adapters/JsonFlashcardAdapter.js`: Adatta file JSON.
    *   `FlashcardImportService.js`: Seleziona dinamicamente l'adapter corretto in base all'input.

---

*(English version below)*

---

# Sprout 🌱 (English)

**Sprout** is a modern desktop application designated to optimize your study flow. It combines organized document management, a powerful text editor, and an advanced flashcard system.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v14+)
*   npm

### Installation & Run
1.  Open terminal in the project folder.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the app:
    ```bash
    npm start
    ```

---
Create by Mattia Provvisorio.
