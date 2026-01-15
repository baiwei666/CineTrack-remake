import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
        },
        titleBarStyle: 'hidden', // Custom title bar support (vnite style)
        titleBarOverlay: {
            color: '#00000000', // Transparent
            symbolColor: '#ffffff',
            height: 35
        }
    });
    const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist-react/index.html')}`;
    if (process.env.ELECTRON_START_URL) {
        mainWindow.loadURL(startUrl);
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist-react/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
// IPC Handlers for Data Persistence
// IPC Handlers for Data Persistence
import { ipcMain, dialog } from 'electron';
import fs from 'fs/promises';
const DATA_FILE = 'data.json';
const CONFIG_FILE = 'config.json';
// Helper: Get Config Path (Always in userData for stability)
function getConfigPath() {
    return path.join(app.getPath('userData'), CONFIG_FILE);
}
// Helper: Load Config
async function loadConfig() {
    try {
        const configPath = getConfigPath();
        const data = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(data);
    }
    catch {
        return { dataPath: await getDefaultDataDir() }; // Default to userData/data
    }
}
// Helper: Save Config
async function saveConfig(config) {
    const configPath = getConfigPath();
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}
// Helper: Get Default Data Directory
async function getDefaultDataDir() {
    const defaultPath = path.join(app.getPath('userData'), 'data'); // Subfolder to keep it clean
    try {
        await fs.mkdir(defaultPath, { recursive: true });
    }
    catch { }
    return defaultPath;
}
// Helper: Get Actual Data File Path
async function getDataPath() {
    const config = await loadConfig();
    const dir = config.dataPath || await getDefaultDataDir(); // Fallback
    // Ensure directory exists
    try {
        await fs.mkdir(dir, { recursive: true });
    }
    catch { }
    return path.join(dir, DATA_FILE);
}
// IPC: Read Data
ipcMain.handle('db:read', async () => {
    try {
        const dataPath = await getDataPath();
        const data = await fs.readFile(dataPath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return null; // File doesn't exist yet
        throw error;
    }
});
// IPC: Write Data
ipcMain.handle('db:write', async (_event, data) => {
    const dataPath = await getDataPath();
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
});
// IPC: Get Current Data Path Config
ipcMain.handle('app:get-path-config', async () => {
    const config = await loadConfig();
    return {
        dataPath: config.dataPath,
        defaultPath: await getDefaultDataDir()
    };
});
// IPC: Select Folder Dialog
ipcMain.handle('app:select-folder', async () => {
    if (!mainWindow)
        return null;
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled || result.filePaths.length === 0)
        return null;
    return result.filePaths[0];
});
// IPC: Set Data Path
ipcMain.handle('app:set-data-path', async (_event, newPath) => {
    const config = await loadConfig();
    const oldPathDir = config.dataPath; // Store old path if we want to migrate later
    config.dataPath = newPath;
    await saveConfig(config);
    return true;
});
import ColorThief from 'colorthief';
ipcMain.handle('app:extract-color', async (_event, url) => {
    try {
        if (!url)
            return null;
        // console.log("[IPC] Extracting color for:", url); // Reduce noise
        // 1. Manually fetch the image to a buffer (Node.js 18+ fetch)
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // 2. Pass buffer to ColorThief
        const color = await new ColorThief().getColor(buffer);
        return color;
    }
    catch (err) {
        console.error("[IPC] Color Extraction Failed:", err);
        return null;
    }
});
//# sourceMappingURL=main.js.map