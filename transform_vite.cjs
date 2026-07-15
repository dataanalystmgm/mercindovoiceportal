const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const \{ createServer: createViteServer \} = await import\('vite'\);/,
  `// Bypass bundler static analysis for vite
    const viteModule = 'vite';
    const { createServer: createViteServer } = await import(viteModule);`
);

fs.writeFileSync('server.ts', code);
