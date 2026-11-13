// Labkit BML als desktopprogramma (Electron).
// Laadt dezelfde web-app uit /web, zodat web- en desktopversie altijd gelijk zijn.
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

app.setAppUserModelId('nl.svgbml.labkit'); // nodig voor Windows-meldingen van de timers

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Labkit BML',
    backgroundColor: '#eef1f4',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, '..', 'web', 'index.html'));

  // Bronlinks openen in de gewone browser, niet in het programma.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) {
      e.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });
  // Downloads (gelfoto, CSV) krijgen automatisch het standaard "Opslaan als"-venster.
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
