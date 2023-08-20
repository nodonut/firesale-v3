import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

type MarkdownFile = {
    content?: string;
    filePath?: string;
};

let currentFile: MarkdownFile = {
    content: '',
};

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
        },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(
            join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
        );
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.webContents.openDevTools({
        mode: 'detach',
    });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

const showOpenDialog = async (browserWindow: BrowserWindow) => {
    const result = await dialog.showOpenDialog(browserWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Markdown File', extensions: ['md'] }],
    });

    if (result.canceled) return;

    const [filePath] = result.filePaths;

    openFile(browserWindow, filePath);
};

const showExportHtmlDialog = async (
    browserWindow: BrowserWindow,
    content: string,
) => {
    const result = await dialog.showSaveDialog(browserWindow, {
        title: 'Export HTML',
        filters: [{ name: 'HTML File', extensions: ['html'] }],
    });

    if (result.canceled) return;

    const { filePath } = result;

    if (!filePath) return;

    createFile(filePath, content);
};

const openFile = async (browserWindow: BrowserWindow, filePath: string) => {
    const content = await readFile(filePath, { encoding: 'utf8' });

    browserWindow.webContents.send('file-opened', content, filePath);
};

const createFile = async (path: string, content: string) => {
    await writeFile(path, content, { encoding: 'utf8' });
};

ipcMain.on('show-open-dialog', (event) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);

    if (!browserWindow) return;

    showOpenDialog(browserWindow);
});

ipcMain.on('show-export-html-dialog', async (event, content: string) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);

    if (!browserWindow) return;

    showExportHtmlDialog(browserWindow, content);
});

const showSaveDialog = async (browserWindow: BrowserWindow) => {
    const result = await dialog.showSaveDialog(browserWindow, {
        title: 'Save Markdown',
        filters: [{ name: 'Markdown File', extensions: ['md'] }],
    });

    if (result.canceled) return;

    const { filePath } = result;

    if (!filePath) return;

    return filePath;
};

const saveFile = async (browserWindow: BrowserWindow, content: string) => {
    const filePath =
        currentFile.filePath ?? (await showSaveDialog(browserWindow));
    if (!filePath) return;

    await writeFile(filePath, content, { encoding: 'utf8' });
};

ipcMain.on('save-file', async (event, content: string) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    if (!browserWindow) return;

    await saveFile(browserWindow, content);
});
