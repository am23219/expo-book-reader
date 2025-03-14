// Custom start script to bypass middleware issues
const { exec } = require('child_process');
const path = require('path');

console.log('Starting React Native bundler with custom configuration...');

// Run the Metro bundler directly
const metroConfig = path.resolve(__dirname, 'metro.config.js');
const command = `node ./node_modules/react-native/cli.js start --config ${metroConfig}`;

const child = exec(command);

child.stdout.on('data', (data) => {
  console.log(data);
});

child.stderr.on('data', (data) => {
  console.error(data);
});

child.on('close', (code) => {
  console.log(`Metro bundler exited with code ${code}`);
}); 