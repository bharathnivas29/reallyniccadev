// scripts/run-accuracy-eval-pipeline.ts
import { exec, spawn } from 'child_process';
import axios from 'axios';

function startProcess(command: string, args: string[], cwd: string) {
  const proc = spawn(command, args, { cwd, shell: true, stdio: 'inherit' });
  return proc;
}

function waitForHealth(url: string, timeoutMs = 60000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        const res = await axios.get(url);
        if (res.status === 200) return resolve();
      } catch (_) {}
      if (Date.now() - start > timeoutMs) return reject(new Error(`Health check timeout for ${url}`));
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
    console.log('Waiting for services to be healthy...');
    await waitForHealth('http://localhost:3000/health');
    console.log('Backend is healthy.');
    
    await waitForHealth('http://localhost:8000/health');
    console.log('ML Service is healthy.');
    
    console.log('Both services are healthy. Running accuracy evaluation...');
    
    const evalProc = exec('npm run accuracy:evaluate', { cwd: process.cwd() });
    
    evalProc.stdout?.pipe(process.stdout);
    evalProc.stderr?.pipe(process.stderr);
    
    evalProc.on('exit', (code) => {
      console.log(`Accuracy evaluation completed with code ${code}`);
      // Cleanup processes
      backend.kill();
      ml.kill();
      process.exit(code || 0);
    });
    
  } catch (e) {
    console.error('Error during startup:', e);
    backend.kill();
    ml.kill();
    process.exit(1);
  }
}

main();
