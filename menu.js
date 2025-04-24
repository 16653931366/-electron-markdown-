const {
  app,
  Menu,
  shell,
  ipcMain,
  BrowserWindow,
  globalShortcut,
  dialog
} = require('electron');

const fs = require('fs');

function saveFile() {
  const window = BrowserWindow.getFocusedWindow();
  // send a one-way message from the main process to the renderer process
  window.webContents.send('editor-event', 'save');
}

function loadFile() {
  const window = BrowserWindow.getFocusedWindow();

  // Sync is for synchronous/ˈsɪŋkrənəs/
  // This function will open a dialog and return a array that contains the paths of the files that user chooses
  // If user canceled, then it will return undefined

  const files = dialog.showOpenDialogSync(window, {
      properties: ['openFile'],
      title: 'Pick a markdown file',
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown','txt'] }]

  });
  if (!files) return;

  const file = files[0];

  // Read the file synchronously, return the buffer of the content of the file
  const fileContent = fs.readFileSync(file).toString();
  window.webContents.send('load', fileContent);
}

app.on('ready', () => {
  globalShortcut.register('CommandOrControl+S', () => {
    saveFile();
  });

  globalShortcut.register('CommandOrControl+O', () => {
    loadFile();
  });
});

ipcMain.on('save', (event, arg) => {
  const window = BrowserWindow.getFocusedWindow();
  const options = {
    title: 'Save markdown file',
    filters: [
      {
        name: 'MyFile',
        extensions: ['md']
      }
    ]
  };

  // This function will open a dialog and return the path that user chooses where user hopes the file to be saved
  const filename = dialog.showSaveDialogSync(window, options);
  if (filename) {

    // Write the content to the file, synchronously
    fs.writeFileSync(filename, arg);
  }
});


const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open',
        accelerator: 'CommandOrControl+O',
        click() {
          loadFile();
        }
      },
      {
        label: 'Save',
        accelerator: 'CommandOrControl+S',
        click() {
          saveFile();
        }
      }
    ]
  },
  {
    label: 'Format',
    submenu: [
      {
        label: 'Toggle Bold',
        click() {
          const window = BrowserWindow.getFocusedWindow();
          window.webContents.send('editor-event', 'toggle-bold');
        }
      }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'About Editor Component',
        click() {
          shell.openExternal('https://simplemde.com/');
        }
      }
    ]
  }
];

if (process.env.DEBUG) {
  template.push({
    label: 'Debugging',
    submenu: [
      {
        label: 'Dev Tools',
        role: 'toggleDevTools'
      },

      { type: 'separator' },
      {
        role: 'reload',
        accelerator: 'Alt+R'
      }
    ]
  });
}

if (process.platform === 'darwin') {
  template.unshift({
    label: app.name,
    submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }]
  });
}

const menu = Menu.buildFromTemplate(template);

module.exports = menu;
