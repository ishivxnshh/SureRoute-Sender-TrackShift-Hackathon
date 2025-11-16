import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate test files of various sizes
const testFiles = [
  { name: 'small-test.txt', size: 1024 * 1024 }, // 1 MB
  { name: 'medium-test.txt', size: 10 * 1024 * 1024 }, // 10 MB
  { name: 'large-test.txt', size: 100 * 1024 * 1024 }, // 100 MB
];

const testDataDir = path.join(__dirname, '../test-data');

// Create test-data directory
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

console.log('🎲 Generating test files...\n');

testFiles.forEach(({ name, size }) => {
  const filePath = path.join(testDataDir, name);
  
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  ${name} already exists, skipping...`);
    return;
  }

  console.log(`📝 Creating ${name} (${(size / 1024 / 1024).toFixed(1)} MB)...`);
  
  const writeStream = fs.createWriteStream(filePath);
  const chunkSize = 1024 * 1024; // 1 MB chunks
  let written = 0;

  const patterns = [
    'SureRoute Test Data - ',
    'Resilient File Transfer - ',
    'AI-Powered Optimization - ',
    'Multi-Transport Failover - ',
  ];

  while (written < size) {
    const remainingSize = size - written;
    const currentChunkSize = Math.min(chunkSize, remainingSize);
    
    // Create varied content for better testing
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const lineNumber = Math.floor(written / chunkSize);
    const line = `${pattern}Line ${lineNumber} - ${Date.now()}\n`;
    
    const chunk = Buffer.alloc(currentChunkSize);
    let offset = 0;
    
    while (offset < currentChunkSize) {
      const lineBuffer = Buffer.from(line);
      const bytesToCopy = Math.min(lineBuffer.length, currentChunkSize - offset);
      lineBuffer.copy(chunk, offset, 0, bytesToCopy);
      offset += bytesToCopy;
    }
    
    writeStream.write(chunk);
    written += currentChunkSize;

    // Show progress for large files
    if (size >= 50 * 1024 * 1024 && written % (10 * 1024 * 1024) === 0) {
      const progress = ((written / size) * 100).toFixed(0);
      process.stdout.write(`   Progress: ${progress}%\r`);
    }
  }

  writeStream.end();
  console.log(`   ✅ ${name} created successfully`);
});

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                                                           ║');
console.log('║   ✅ Test files generated!                                ║');
console.log('║                                                           ║');
console.log('║   📂 Location: test-data/                                 ║');
console.log('║                                                           ║');
console.log('║   Files created:                                          ║');
console.log('║   - small-test.txt (1 MB) - Quick tests                  ║');
console.log('║   - medium-test.txt (10 MB) - Demo transfers             ║');
console.log('║   - large-test.txt (100 MB) - Stress tests               ║');
console.log('║                                                           ║');
console.log('║   Use these files for testing transfers in SureRoute!    ║');
console.log('║                                                           ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
