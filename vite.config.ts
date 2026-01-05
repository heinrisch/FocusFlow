import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        svelte(),
        crx({ manifest }),
        {
            name: 'copy-icons',
            writeBundle() {
                // Ensure icons directory exists in dist
                const distIconsDir = join(__dirname, 'dist', 'icons');
                if (!existsSync(distIconsDir)) {
                    mkdirSync(distIconsDir, { recursive: true });
                }
                
                // Copy all icon files including active ones
                const iconFiles = [
                    'icon16.png', 'icon16_active.png',
                    'icon32.png', 'icon32_active.png',
                    'icon48.png', 'icon48_active.png',
                    'icon128.png', 'icon128_active.png'
                ];
                
                iconFiles.forEach(file => {
                    const src = join(__dirname, 'icons', file);
                    const dest = join(distIconsDir, file);
                    if (existsSync(src)) {
                        copyFileSync(src, dest);
                    }
                });
            }
        },
    ],
    build: {
        rollupOptions: {
            input: {
                'src/blocked/index': 'src/blocked/index.html',
            },
            output: {
                inlineDynamicImports: false,
            },
        },
    },
    resolve: {
        alias: {
            src: '/src',
        },
    },
});
