// scripts/run-e2e-tests.ts
import { exec, spawn } from 'child_process';
import axios from 'axios';

function startProcess(command: string, args: string[], cwd: string) {
  const proc = spawn(command, args, { cwd, shell: true, stdio: 'inherit' });
  return proc;
}

function waitForHealth(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch (_) {}
      if (Date.now() - start > timeoutMs) return reject(new Error('Health check timeout'));
      setTimeout(check, 1000);
    };
    check();
  });
}

async function main() {
  console.log('Starting backend...');
  const backend = startProcess('npm', ['run', 'dev'], process.cwd());
  console.log('Starting ML service...');
  const ml = startProcess('python', ['start.py'], `${process.cwd()}/../ml-service`);

  try {
    await waitForHealth('http://localhost:3000/health');
    await waitForHealth('http://localhost:8000/health');
    console.log('Both services are healthy. Running integration tests...');
    exec('npm run test:integration', { cwd: process.cwd() }, (err, stdout, stderr) => {
      console.log(stdout);
      console.error(stderr);
      process.exit(err ? err.code : 0);
    });
  } catch (e) {
    console.error('Error during startup:', e);
    process.exit(1);
  }
}

main();
