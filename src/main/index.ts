import {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    shell,
    Menu,
    MenuItemConstructorOptions,
} from 'electron';
import { readFile, writeFile } from 'fs/promises';
import { join, basename } from 'path';

type MarkdownFile = {
    content?: string;
    filePath?: string;
};

const isMac = process.platform === 'darwin';
const getCurrentFile = async (browserWindow?: BrowserWindow) => {
    if (currentFile.filePath) return currentFile.filePath;
    if (!browserWindow) return;

    return showSaveDialog(browserWindow);
};

const setCurrentFile = (
    browserWindow: BrowserWindow,
    filePath: string,
    content: string,
) => {
    currentFile.filePath = filePath;
    currentFile.content = content;

    app.addRecentDocument(filePath);
    browserWindow.setTitle(`${basename(filePath)} - ${app.name}`);
    browserWindow.setRepresentedFilename(filePath);
};

const hasChanges = (content: string) => {
    return currentFile.content !== content;
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

    return mainWindow;
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

    setCurrentFile(browserWindow, filePath, content);

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
    const filePath = await getCurrentFile(browserWindow);
    if (!filePath) return;

    await writeFile(filePath, content, { encoding: 'utf8' });
    setCurrentFile(browserWindow, filePath, content);
};

ipcMain.on('save-file', async (event, content: string) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    if (!browserWindow) return;

    await saveFile(browserWindow, content);
});

ipcMain.handle('has-changes', async (event, content: string) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    const changed = hasChanges(content);

    browserWindow?.setDocumentEdited(changed);

    return changed;
});

ipcMain.on('show-in-folder', () => {
    if (currentFile.filePath) {
        shell.showItemInFolder(currentFile.filePath);
    }
});

ipcMain.on('open-in-default', async () => {
    if (currentFile.filePath) {
        await shell.openPath(currentFile.filePath);
    }
});

const template: MenuItemConstructorOptions[] = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open',
                click: () => {
                    let browserWindow = BrowserWindow.getFocusedWindow();
                    if (!browserWindow) browserWindow = createWindow();
                    showOpenDialog(browserWindow);
                },
                accelerator: 'CmdOrCtrl+O',
            },
        ],
    },
    { label: 'Edit', role: 'editMenu' },
];
if (isMac) {
    template.unshift({
        label: app.name,
        role: 'appMenu',
    });
}

const menu = Menu.buildFromTemplate(template);

Menu.setApplicationMenu(menu);
