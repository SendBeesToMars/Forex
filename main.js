//start from cmd "npm start"/"electron ."
const {app, BrowserWindow} = require('electron');

let mainWindow;

app.on('ready', function() {
  mainWindow = new BrowserWindow({
      height: 700,
      width: 1000
  });

  mainWindow.loadURL('file://' + __dirname + '/index.html');
});
