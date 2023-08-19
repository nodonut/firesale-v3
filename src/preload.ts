import { ipcRenderer, contextBridge } from 'electron';

contextBridge.exposeInMainWorld('api', {
    onFileOpen: (callback: (content: string) => void) => {
        ipcRenderer.on('file-opened', (_event, content: string) => {
            callback(content);
        });
    },
    showOpenDialog: () => {
        ipcRenderer.send('show-open-dialog');
    },
    showExportHtmlDialog: (content: string) => {
        ipcRenderer.send('show-export-html-dialog', content);
    },
});
