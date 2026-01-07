// Rich Text Editor Wrapper Class usando Quill
// Gestisce l'inizializzazione e la configurazione dell'editor Quill

class RichTextEditor {
    constructor() {
        this.editor = null;
        this.element = null;
        this.onUpdateCallback = null;
    }

    /**
     * Inizializza l'editor Quill su un elemento DOM
     * @param {HTMLElement} element - L'elemento DOM dove montare l'editor
     * @param {Function} onUpdate - Callback chiamata quando il contenuto cambia
     * @param {Object} initialContent - Contenuto iniziale in formato Delta/JSON
     */
    init(element, onUpdate = null, initialContent = null) {
        this.element = element;
        this.onUpdateCallback = onUpdate;

        // Verifica che Quill sia caricato
        if (typeof Quill === 'undefined') {
            console.error('Quill non caricato! Assicurati che lo script CDN sia incluso.');
            return null;
        }

        try {
            // Configurazione della toolbar
            const toolbarOptions = [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['blockquote', 'code-block'],
                ['link'],
                [{ 'align': [] }],
                ['clean']
            ];

            // Crea l'editor Quill
            this.editor = new Quill(element, {
                theme: 'snow',
                modules: {
                    toolbar: toolbarOptions
                }
            });

            // Imposta il contenuto iniziale se fornito
            if (initialContent) {
                this.setContent(initialContent);
            }

            // Callback per gli aggiornamenti
            this.editor.on('text-change', () => {
                if (this.onUpdateCallback) {
                    this.onUpdateCallback(this.getJSON());
                }
            });

            return this.editor;
        } catch (error) {
            console.error('Errore durante l\'inizializzazione dell\'editor:', error);
            return null;
        }
    }

    /**
     * Restituisce il contenuto di default per un editor vuoto
     */
    getDefaultContent() {
        return {
            ops: [{ insert: '\n' }]
        };
    }

    /**
     * Ottiene il contenuto dell'editor in formato JSON (Delta)
     */
    getJSON() {
        if (!this.editor) return this.getDefaultContent();
        return this.editor.getContents();
    }

    /**
     * Ottiene il contenuto dell'editor in formato HTML
     */
    getHTML() {
        if (!this.editor) return '';
        return this.editor.root.innerHTML;
    }

    /**
     * Imposta il contenuto dell'editor
     * @param {Object} content - Contenuto in formato Delta/JSON
     */
    setContent(content) {
        if (!this.editor) return;

        try {
            // Se il contenuto è nel formato Delta di Quill
            if (content && content.ops) {
                this.editor.setContents(content);
            }
            // Se il contenuto è nel vecchio formato TipTap, converti
            else if (content && content.type === 'doc') {
                const text = this.convertTipTapToText(content);
                this.editor.setText(text);
            }
            // Altrimenti imposta contenuto vuoto
            else {
                this.editor.setContents(this.getDefaultContent());
            }
        } catch (error) {
            console.error('Errore durante l\'impostazione del contenuto:', error);
            this.editor.setContents(this.getDefaultContent());
        }
    }

    /**
     * Converte il vecchio formato JSON in testo plain
     * @param {Object} oldContent - Contenuto in vecchio formato JSON
     * @returns {string} Testo plain
     */
    convertTipTapToText(oldContent) {
        if (!oldContent || !oldContent.content) return '';

        let text = '';
        oldContent.content.forEach(node => {
            if (node.type === 'paragraph' && node.content) {
                node.content.forEach(textNode => {
                    if (textNode.text) {
                        text += textNode.text;
                    }
                });
                text += '\n';
            }
        });
        return text;
    }

    /**
     * Distrugge l'istanza dell'editor
     */
    destroy() {
        if (this.editor) {
            // Quill non ha un metodo destroy esplicito, ma possiamo disabilitarlo
            this.editor.disable();
            this.editor = null;
        }
    }

    /**
     * Verifica se l'editor è vuoto
     */
    isEmpty() {
        if (!this.editor) return true;
        const text = this.editor.getText().trim();
        return text.length === 0;
    }

    /**
     * Focus sull'editor
     */
    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }

    /**
     * Metodi di utilità per la toolbar (per compatibilità con il codice esistente)
     * Quill gestisce la toolbar automaticamente, quindi questi metodi sono opzionali
     */

    toggleBold() {
        if (!this.editor) return;
        const format = this.editor.getFormat();
        this.editor.format('bold', !format.bold);
    }

    toggleItalic() {
        if (!this.editor) return;
        const format = this.editor.getFormat();
        this.editor.format('italic', !format.italic);
    }

    toggleUnderline() {
        if (!this.editor) return;
        const format = this.editor.getFormat();
        this.editor.format('underline', !format.underline);
    }

    toggleStrike() {
        if (!this.editor) return;
        const format = this.editor.getFormat();
        this.editor.format('strike', !format.strike);
    }

    toggleCode() {
        if (!this.editor) return;
        const format = this.editor.getFormat();
        this.editor.format('code', !format.code);
    }

    toggleHighlight(color = '#ffff00') {
        if (!this.editor) return;
        const format = this.editor.getFormat();
        this.editor.format('background', format.background ? false : color);
    }

    setHeading(level) {
        if (!this.editor) return;
        this.editor.format('header', level);
    }

    setParagraph() {
        if (!this.editor) return;
        this.editor.format('header', false);
    }

    toggleBulletList() {
        if (!this.editor) return;
        const format = this.editor.getFormat();
        this.editor.format('list', format.list === 'bullet' ? false : 'bullet');
    }

    toggleOrderedList() {
        if (!this.editor) return;
        const format = this.editor.getFormat();
        this.editor.format('list', format.list === 'ordered' ? false : 'ordered');
    }

    toggleTaskList() {
        // Quill non ha task list nativamente, usa lista normale
        this.toggleBulletList();
    }

    toggleBlockquote() {
        if (!this.editor) return;
        const format = this.editor.getFormat();
        this.editor.format('blockquote', !format.blockquote);
    }

    toggleCodeBlock() {
        if (!this.editor) return;
        const format = this.editor.getFormat();
        this.editor.format('code-block', !format['code-block']);
    }

    setHorizontalRule() {
        // Quill non ha supporto nativo per HR, inserisci una linea di testo
        if (!this.editor) return;
        const range = this.editor.getSelection();
        if (range) {
            this.editor.insertText(range.index, '\n---\n');
        }
    }

    setLink() {
        if (!this.editor) return;
        const url = window.prompt('Inserisci URL:');
        if (url) {
            const range = this.editor.getSelection();
            if (range && range.length > 0) {
                this.editor.format('link', url);
            }
        }
    }

    unsetLink() {
        if (!this.editor) return;
        this.editor.format('link', false);
    }

    insertTable() {
        // Quill non ha supporto nativo per tabelle
        console.log('Le tabelle non sono supportate in Quill');
    }

    undo() {
        if (!this.editor) return;
        this.editor.history.undo();
    }

    redo() {
        if (!this.editor) return;
        this.editor.history.redo();
    }

    /**
     * Verifica se un formato è attivo
     */
    isActive(name, attributes = {}) {
        if (!this.editor) return false;
        const format = this.editor.getFormat();

        // Mappa i nomi dei formati ai nomi Quill
        const formatMap = {
            'bold': 'bold',
            'italic': 'italic',
            'underline': 'underline',
            'strike': 'strike',
            'code': 'code',
            'heading': 'header',
            'bulletList': 'list',
            'orderedList': 'list',
            'blockquote': 'blockquote',
            'codeBlock': 'code-block',
            'link': 'link'
        };

        const quillFormat = formatMap[name] || name;

        if (name === 'heading' && attributes.level) {
            return format.header === attributes.level;
        }
        if (name === 'bulletList') {
            return format.list === 'bullet';
        }
        if (name === 'orderedList') {
            return format.list === 'ordered';
        }

        return !!format[quillFormat];
    }

    /**
     * Verifica se un comando può essere eseguito
     */
    can(command) {
        // Quill non ha un sistema di "can" come altri editor
        return this.editor !== null;
    }
}
