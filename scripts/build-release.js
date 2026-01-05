import { execSync } from 'child_process';
import { createWriteStream, existsSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import archiver from 'archiver';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// Get version from package.json
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const version = packageJson.version || '0.1.0';
const outputFile = join(rootDir, `focusflow-v${version}.zip`);

// Files and folders to exclude from the zip
const excludePatterns = [
    '.vite',
    '.DS_Store',
    'Thumbs.db',
];

function shouldExclude(filePath) {
    const relativePath = relative(distDir, filePath);
    return excludePatterns.some(pattern => 
        relativePath.includes(pattern) || 
        relativePath.startsWith(pattern)
    );
}

async function addDirectory(archive, dirPath, basePath = '') {
    const entries = await readdir(dirPath);
    
    for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const relativePath = join(basePath, entry);
        const stats = await stat(fullPath);
        
        if (shouldExclude(fullPath)) {
            console.log(`Excluding: ${relativePath}`);
            continue;
        }
        
        if (stats.isDirectory()) {
            await addDirectory(archive, fullPath, relativePath);
        } else {
            archive.file(fullPath, { name: relativePath });
        }
    }
}

async function createZip() {
    console.log('Building extension...');
    execSync('npm run build', { 
        stdio: 'inherit',
        cwd: rootDir 
    });
    
    if (!existsSync(distDir)) {
        throw new Error(`Dist directory not found: ${distDir}`);
    }
    
    console.log('\nCreating release zip...');
    
    return new Promise((resolve, reject) => {
        const output = createWriteStream(outputFile);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });
        
        output.on('close', () => {
            const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
            console.log(`\n✅ Release zip created: ${outputFile}`);
            console.log(`   Size: ${sizeInMB} MB`);
            console.log(`   Total bytes: ${archive.pointer().toLocaleString()}`);
            resolve();
        });
        
        archive.on('error', (err) => {
            reject(err);
        });
        
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.warn('Warning:', err);
            } else {
                reject(err);
            }
        });
        
        archive.pipe(output);
        
        // Add all files from dist directory
        addDirectory(archive, distDir)
            .then(() => {
                archive.finalize();
            })
            .catch(reject);
    });
}

createZip().catch((error) => {
    console.error('Error creating release zip:', error);
    process.exit(1);
});
