const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const P2P_FOLDER = path.join(app.getPath('documents'), 'p2psharefiles');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Create p2psharefiles folder if it doesn't exist
    if (!fs.existsSync(P2P_FOLDER)) {
        fs.mkdirSync(P2P_FOLDER);
        console.log('Created p2psharefiles folder');
    }

    // In development, load from React dev server
    mainWindow.loadURL('http://localhost:3000');

    // Handle file operations
    ipcMain.handle('save-file', async (event, { name, content }) => {
        const filePath = path.join(P2P_FOLDER, name);
        fs.writeFileSync(filePath, Buffer.from(content));
        return true;
    });

    ipcMain.handle('get-files', async () => {
        const files = fs.readdirSync(P2P_FOLDER);
        return files.map(fileName => {
            const filePath = path.join(P2P_FOLDER, fileName);
            const stats = fs.statSync(filePath);
            return {
                name: fileName,
                size: stats.size,
                lastModified: stats.mtime
            };
        });
    });

    ipcMain.handle('read-file', async (event, fileName) => {
        const filePath = path.join(P2P_FOLDER, fileName);
        return fs.readFileSync(filePath);
    });
}

app.whenReady().then(createWindow);

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