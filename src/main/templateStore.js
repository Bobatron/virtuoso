const Store = require('electron-store');

// Initialize store for templates
// We don't need encryption for templates as they are not sensitive
const store = new Store({
    name: 'templates',
    clearInvalidConfig: true
});

/**
 * Load all saved templates
 */
function loadTemplates() {
    try {
        const templates = store.get('templates', []);
        console.log(`[TemplateStore] Loaded ${templates.length} templates`);
        return templates;
    } catch (err) {
        console.error('[TemplateStore] Failed to load templates:', err);
        return [];
    }
}

/**
 * Save a new template or update existing one
 * @param {Object} template - { id, name, description, xml, fields, values }
 */
function saveTemplate(template) {
    try {
        const templates = store.get('templates', []);

        // Check if updating existing
        const index = templates.findIndex(t => t.id === template.id);

        if (index !== -1) {
            templates[index] = template;
        } else {
            templates.push(template);
        }

        store.set('templates', templates);
        console.log(`[TemplateStore] Saved template: ${template.name}`);
        return true;
    } catch (err) {
        console.error('[TemplateStore] Failed to save template:', err);
        return false;
    }
}

/**
 * Delete a template by ID
 */
function deleteTemplate(templateId) {
    try {
        const templates = store.get('templates', []);
        const newTemplates = templates.filter(t => t.id !== templateId);

        if (templates.length === newTemplates.length) {
            return false; // Not found
        }

        store.set('templates', newTemplates);
        console.log(`[TemplateStore] Deleted template: ${templateId}`);
        return true;
    } catch (err) {
        console.error('[TemplateStore] Failed to delete template:', err);
        return false;
    }
}

module.exports = { loadTemplates, saveTemplate, deleteTemplate };
