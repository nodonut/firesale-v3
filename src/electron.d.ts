/// <reference types="vite/client" />
/// <reference types="electron" />

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

declare interface Window {
    api: {
        onFileOpen: (callback: (content: string) => void) => void;
        showOpenDialog: () => void;
        showExportHtmlDialog: (content: string) => void;
        saveFile: (content: string) => void;
    };
}
