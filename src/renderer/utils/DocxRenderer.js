const { renderAsync } = require('docx-preview');

class DocxRenderer {
    /**
     * Renders a DOCX buffer into a container element.
     * @param {Buffer|ArrayBuffer} buffer - The DOCX file content.
     * @param {HTMLElement} container - The container to render into.
     */
    static async render(buffer, container) {
        if (!buffer || !container) {
            throw new Error('Missing buffer or container');
        }

        try {
            await renderAsync(buffer, container, null, {
                className: 'docx-viewer',
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
                ignoreFonts: false,
                breakPages: true,
                useBase64URL: false,
                experimental: false
            });
        } catch (error) {
            console.error('Error rendering DOCX:', error);
            container.innerHTML = `<div class="error-message">Error rendering document: ${error.message}</div>`;
        }
    }
}

module.exports = DocxRenderer;
