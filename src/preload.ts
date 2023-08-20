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
    saveFile: async (content: string) => {
        ipcRenderer.send('save-file', content);
    },
    checkForUnsavedChanges: async (content: string) => {
        const result = await ipcRenderer.invoke('has-changes', content);
        console.log({ result });
        return result;
    },
    showInFolder: () => {
        ipcRenderer.send('show-in-folder');
    },
    openInDefaultApplication: () => {
        ipcRenderer.send('open-in-default');
    },
});
