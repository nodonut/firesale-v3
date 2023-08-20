import { renderMarkdown } from './markdown';
import Elements from './elements';

window.api.onFileOpen((content: string) => {
    Elements.MarkdownView.value = content;
    renderMarkdown(content);
    Elements.ShowFileButton.disabled = false;
    Elements.OpenInDefaultApplicationButton.disabled = false;
});

Elements.MarkdownView.addEventListener('input', async () => {
    const markdown = Elements.MarkdownView.value;
    renderMarkdown(markdown);
    const hasChanges = await window.api.checkForUnsavedChanges(markdown);
    Elements.SaveMarkdownButton.disabled = !hasChanges;
});

Elements.OpenFileButton.addEventListener('click', () => {
    window.api.showOpenDialog();
});

Elements.ExportHtmlButton.addEventListener('click', () => {
    window.api.showExportHtmlDialog(Elements.RenderedView.innerHTML);
});

Elements.SaveMarkdownButton.addEventListener('click', () => {
    const markdown = Elements.MarkdownView.value;
    window.api.saveFile(markdown);
});

Elements.ShowFileButton.addEventListener('click', () => {
    window.api.showInFolder();
});

Elements.OpenInDefaultApplicationButton.addEventListener('click', () => {
    window.api.openInDefaultApplication();
});
