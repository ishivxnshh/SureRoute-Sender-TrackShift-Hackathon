#!/usr/bin/env node

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚡ SureRoute - Resilient File Transfer System           ║
║                                                           ║
║   🎨 AI-Powered | 🔄 Multi-Transport | 📊 Real-time      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

console.log('🚀 Starting SureRoute services...\n');

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const services = [
  {
    name: 'Backend',
    cwd: join(__dirname, 'backend'),
    command: 'npm',
    args: ['run', 'dev'],
    port: 5000,
    color: '\x1b[36m', // Cyan
  },
  {
    name: 'Relay',
    cwd: join(__dirname, 'relay-server'),
    command: 'npm',
    args: ['run', 'dev'],
    port: 5001,
    color: '\x1b[33m', // Yellow
  },
  {
    name: 'Frontend',
    cwd: join(__dirname, 'frontend'),
    command: 'npm',
    args: ['run', 'dev'],
    port: 3000,
    color: '\x1b[35m', // Magenta
  },
];

const processes = [];

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down all services...');
  processes.forEach(proc => {
    if (proc && !proc.killed) {
      proc.kill();
    }
  });
  process.exit(0);
});

// Start each service
services.forEach((service, index) => {
  setTimeout(() => {
    console.log(`${service.color}[${service.name}]\x1b[0m Starting on port ${service.port}...`);
    
    const proc = spawn(service.command, service.args, {
      cwd: service.cwd,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('error', (error) => {
      console.error(`${service.color}[${service.name}]\x1b[0m Error:`, error);
    });

    proc.on('exit', (code) => {
      if (code !== 0) {
        console.error(`${service.color}[${service.name}]\x1b[0m Exited with code ${code}`);
      }
    });

    processes.push(proc);

    if (index === services.length - 1) {
      setTimeout(() => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✅ All services started successfully!                   ║
║                                                           ║
║   🌐 Frontend:  http://localhost:3000                     ║
║   🔧 Backend:   http://localhost:5000                     ║
║   🔄 Relay:     http://localhost:5001                     ║
║                                                           ║
║   📖 Press Ctrl+C to stop all services                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
      }, 3000);
    }
  }, index * 1000); // Stagger starts by 1 second
});
