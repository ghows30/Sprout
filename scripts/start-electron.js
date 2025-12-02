const { spawn } = require('child_process');
const electronPath = require('electron');

// Ensure Electron runs normally even if ELECTRON_RUN_AS_NODE is set in the environment.
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['.'], { stdio: 'inherit', env });

child.on('exit', code => {
  process.exit(code === undefined || code === null ? 0 : code);
});

child.on('error', err => {
  console.error('Failed to start Electron:', err);
  process.exit(1);
});
