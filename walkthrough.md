# Walkthrough: Main Sidebar Improvements

Ho migliorato la sidebar principale dell'applicazione rendendola ridimensionabile e collassabile.

## Funzionalità Aggiunte

1.  **Ridimensionamento (Resize)**:
    - È presente una sottile barra invisibile (che si illumina al passaggio del mouse) sul bordo destro della sidebar principale.
    - Clicca e trascina per allargare o stringere la sidebar.

2.  **Modalità Mini (Toggle)**:
    - Aggiunto un pulsante (icona hamburger) accanto al logo "Sprout".
    - Cliccando, la sidebar si riduce a una larghezza minima, mostrando solo le icone.
    - Cliccando di nuovo, la sidebar torna alla dimensione originale.

## Modifiche Tecniche

- **`index.html`**:
    - Aggiunto `id="main-sidebar"` alla sidebar.
    - Aggiunto pulsante toggle e span per testi (per nasconderli in modalità mini).
    - Aggiunto `div#main-resizer` dopo la sidebar.
- **`styles.css`**:
    - Aggiunti stili per `.sidebar.collapsed` (width: 80px, nasconde testi).
    - Aggiornati stili per gestire il layout flessibile.
- **`app.js`**:
    - Aggiunta funzione `setupSidebar()` per gestire eventi di resize e toggle.

## Come Testare

1.  **Resize**: Posiziona il mouse sul bordo destro della sidebar verde scuro. Il cursore cambierà. Trascina per ridimensionare.
2.  **Toggle**: Clicca sull'icona con tre linee (hamburger) accanto alla scritta "Sprout". La sidebar si ridurrà mostrando solo le icone.
