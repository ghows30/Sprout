Pattern 1:

 Observer Pattern: Quando si crea una sessione di studio, 
 il sistema deve aggiornare la lista delle sessioni, salvare i dati 
 e cambiare vista.

 Creiamo un EventManager. StudySessions(il modulo)il moduloosseerva l'evento SESSION_CREATED
 e aggiorna la lista delle sessioni automaticamente

Pattern 2:
    Singleton Pattern: Utilizzato per i manager globali

    - EventManager.js -> const eventManager = new EventManager();
    - ToastManager.js -> const toastManager = new ToastManager();

    Viene garantita una singola istanza globale
     
Pattern3:
    Facade Pattern: Operazioni sulle sessioni
    
    - SessionController.js -> semplifica le operazioni sulle sessioni e fornisce un'interfaccia unificata
