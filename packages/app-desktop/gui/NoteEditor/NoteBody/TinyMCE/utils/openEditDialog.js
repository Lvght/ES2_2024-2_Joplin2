"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const locale_1 = require("@joplin/lib/locale");
const renderer_1 = require("@joplin/renderer");
const types_1 = require("./types");
const focusHandler_1 = require("@joplin/lib/utils/focusHandler");
const taboverride = require('taboverride');
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
function dialogTextArea_keyDown(event) {
    if (event.key === 'Tab') {
        window.requestAnimationFrame(() => (0, focusHandler_1.focus)('openEditDialog::dialogTextArea_keyDown', event.target));
    }
}
// Allows pressing tab in a textarea to input an actual tab (instead of changing focus)
// taboverride will take care of actually inserting the tab character, while the keydown
// event listener will override the default behaviour, which is to focus the next field.
function enableTextAreaTab(enable) {
    const textAreas = document.getElementsByClassName('tox-textarea');
    for (const textArea of textAreas) {
        taboverride.set(textArea, enable);
        if (enable) {
            textArea.addEventListener('keydown', dialogTextArea_keyDown);
        }
        else {
            textArea.removeEventListener('keydown', dialogTextArea_keyDown);
        }
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
function findBlockSource(node) {
    const sources = node.getElementsByClassName('joplin-source');
    if (!sources.length)
        throw new Error('No source for node');
    const source = sources[0];
    return {
        openCharacters: source.getAttribute('data-joplin-source-open'),
        closeCharacters: source.getAttribute('data-joplin-source-close'),
        content: source.textContent,
        node: source,
        language: source.getAttribute('data-joplin-language') || '',
    };
}
function newBlockSource(language = '', content = '', previousSource = null) {
    let fence = '```';
    if (language === 'katex') {
        if (previousSource && previousSource.openCharacters === '$') {
            fence = '$';
        }
        else {
            fence = '$$';
        }
    }
    const fenceLanguage = language === 'katex' ? '' : language;
    return {
        openCharacters: fence === '$' ? '$' : `\n${fence}${fenceLanguage}\n`,
        closeCharacters: fence === '$' ? '$' : `\n${fence}\n`,
        content: content,
        node: null,
        language: language,
    };
}
function editableInnerHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const editable = temp.getElementsByClassName('joplin-editable');
    if (!editable.length)
        throw new Error(`Invalid joplin-editable: ${html}`);
    return editable[0].innerHTML;
}
// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any -- Old code before rule was applied, Old code before rule was applied
function openEditDialog(editor, markupToHtml, dispatchDidUpdate, editable) {
    const source = editable ? findBlockSource(editable) : newBlockSource();
    editor.windowManager.open({
        title: (0, locale_1._)('Edit'),
        size: 'large',
        initialData: {
            codeTextArea: source.content,
            languageInput: source.language,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
        onSubmit: async (dialogApi) => {
            const newSource = newBlockSource(dialogApi.getData().languageInput, dialogApi.getData().codeTextArea, source);
            const md = `${newSource.openCharacters}${newSource.content}${newSource.closeCharacters}`;
            const result = await markupToHtml.current(renderer_1.MarkupToHtml.MARKUP_LANGUAGE_MARKDOWN, md, { bodyOnly: true });
            // markupToHtml will return the complete editable HTML, but we only
            // want to update the inner HTML, so as not to break additional props that
            // are added by TinyMCE on the main node.
            if (editable) {
                editable.innerHTML = editableInnerHtml(result.html);
            }
            else {
                editor.insertContent(result.html);
            }
            dialogApi.close();
            editor.fire(types_1.TinyMceEditorEvents.JoplinChange);
            dispatchDidUpdate(editor);
        },
        onClose: () => {
            enableTextAreaTab(false);
        },
        body: {
            type: 'panel',
            items: [
                {
                    type: 'input',
                    name: 'languageInput',
                    label: 'Language',
                    // Katex is a special case with special opening/closing tags
                    // and we don't currently handle switching the language in this case.
                    disabled: source.language === 'katex',
                },
                {
                    type: 'textarea',
                    name: 'codeTextArea',
                    value: source.content,
                },
            ],
        },
        buttons: [
            {
                type: 'submit',
                text: 'OK',
            },
        ],
    });
    window.requestAnimationFrame(() => {
        enableTextAreaTab(true);
    });
}
exports.default = openEditDialog;
//# sourceMappingURL=openEditDialog.js.map