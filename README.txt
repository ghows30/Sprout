Pattern 1:

 Observer Pattern: Quando si crea una sessione di studio, 
 il sistema deve aggiornare la lista delle sessioni, salvare i dati 
 e cambiare vista.

 Creiamo un EventManager. StudySessions(il modulo)il moduloosseerva l'evento SESSION_CREATED
 e aggiorna la lista delle sessioni automaticamente
