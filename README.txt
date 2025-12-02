Pattern 1:
    Observer Pattern: quando si crea una sessione di studio, il sistema aggiorna la lista delle sessioni,
    salva i dati e cambia vista.
    - EventManager.js gestisce gli eventi globali.
    - StudySessions osserva l'evento SESSION_CREATED e aggiorna la lista delle sessioni automaticamente.

Pattern 2:
    Singleton Pattern: utilizzato per i manager globali.
    - EventManager.js -> const eventManager = new EventManager();
    - ToastManager.js -> const toastManager = new ToastManager();
    - Garantisce una singola istanza condivisa.
     
Pattern 3:
    Facade Pattern: operazioni sulle sessioni.
    - SessionController.js semplifica le operazioni sulle sessioni e fornisce un'interfaccia unificata.

