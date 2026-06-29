import * as fs from 'fs';
import * as path from 'path';

function scanDir(dir: string, depth = 0) {
  if (depth > 2) return;
  try {
    const list = fs.readdirSync(dir);
    console.log(`Scanning dir: ${dir} (has ${list.length} files)`);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          console.log(`[DIR] ${filePath}`);
          scanDir(filePath, depth + 1);
        } else {
          console.log(`[FILE] ${filePath} (${stat.size} bytes)`);
        }
      } catch (err) {}
    });
  } catch (err) {}
}

console.log("Scanning /app...");
scanDir('/app');
console.log("Scan finished.");
