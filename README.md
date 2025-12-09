# Sprout 🌱 (🇮🇹)

Sprout è un'applicazione desktop moderna progettata per ottimizzare il tuo flusso di studio. Combina la gestione organizzata dei documenti, un potente editor di testo e un sistema avanzato di flashcard per aiutarti a imparare in modo più efficace. Costruito con Electron, offre un'esperienza fluida e reattiva, ideale per studenti e professionisti che vogliono mantenere tutto il materiale di studio in un unico posto.

## Funzionalità Principali
*   **Gestione Sessioni**: Organizza il tuo studio in spazi dedicati.
*   **Editor Avanzato**: Prendi appunti ricchi con formattazione, liste e altro.
*   **Flashcard Intelligenti**: Crea mazzi, studia con il metodo della ripetizione e traccia i tuoi progressi.
*   **Modalità Studio**: Interfaccia immersiva per concentrarti sui concetti chiave, con funzionalità di "Annulla" per correggere errori.
*   **Timer Integrato**: Gestisci il tempo di studio direttamente nell'app.

---

## Come Iniziare

### Prerequisiti
Assicurati di avere installato:
*   [Node.js](https://nodejs.org/) (versione 14 o superiore)
*   [npm](https://www.npmjs.com/) (solitamente incluso con Node.js)

### Installazione
1.  Clona il repository:
    ```bash
    git clone https://github.com/tuo-username/Sprout.git
    ```
2.  Entra nella cartella del progetto:
    ```bash
    cd Sprout
    ```
3.  Installa le dipendenze:
    ```bash
    npm install
    ```

### Avvio
Per avviare l'applicazione in modalità sviluppo:
```bash
npm start
```


---

# Sprout 🌱 (🇬🇧)

Sprout is a modern desktop application designed to optimize your study flow. It combines organized document management, a powerful text editor, and an advanced flashcard system to help you learn more effectively. Built with Electron, it offers a smooth and responsive experience, ideal for students and professionals who want to keep all their study material in one place.

## Key Features
*   **Session Management**: Organize your study into dedicated spaces.
*   **Advanced Editor**: Take rich notes with formatting, lists, and more.
*   **Smart Flashcards**: Create decks, study with spaced repetition, and track your progress.
*   **Study Mode**: Immersive interface to focus on key concepts, with "Undo" functionality to correct mistakes.
*   **Built-in Timer**: Manage your study time directly within the app.

---

## Getting Started

### Prerequisites
Make sure you have installed:
*   [Node.js](https://nodejs.org/) (version 14 or higher)
*   [npm](https://www.npmjs.com/) (usually included with Node.js)

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/Sprout.git
    ```
2.  Enter the project folder:
    ```bash
    cd Sprout
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

### Running
To start the application in development mode:
```bash
npm start
```

---





## Design Patterns Utilizzati

Pattern 1: **Observer Pattern**
Quando si crea una sessione di studio, il sistema aggiorna la lista delle sessioni, salva i dati e cambia vista.
-   `EventManager.js` gestisce gli eventi globali (es. `SESSION_CREATED`).
-   I componenti interessati (come la lista sessioni) "osservano" questi eventi e reagiscono automaticamente.

Pattern 2: **Singleton Pattern**
Garantisce che ci sia una sola istanza di classi critiche per la gestione dello stato globale.
-   `SessionModel.js` gestisce i dati delle sessioni ed è un Singleton per evitare conflitti di dati.
-   `ToastManager.js` è un Singleton per gestire le notifiche in modo centralizzato.

Pattern 3: **Facade Pattern**
Semplifica l'interazione con sottosistemi complessi fornendo un'interfaccia unificata.
-   `SessionController.js` agisce da Facade, nascondendo la complessità delle operazioni sul modello e sulla vista, offrendo metodi semplici come `createSession` o `openSession`.

Pattern 4: **Memento Pattern**
Permette di salvare lo stato di un oggetto per poterlo ripristinare successivamente (Undo).
-   `StudyMemento.js`: Rappresenta l'istantanea dello stato (ID carta, stato precedente, indice).
-   `StudyHistory.js` (Caretaker): Gestisce la pila (stack) dei memento salvati.
-   `FlashcardView.js` (Originator): Crea i memento prima di ogni modifica e li usa per ripristinare lo stato quando l'utente preme "Annulla".
