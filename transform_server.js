const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Move `initLocalDatabase();` out of `startServer`
code = code.replace(/async function startServer\(\) {\n\s*initLocalDatabase\(\);\n\s*const app = express\(\);/, 'initLocalDatabase();\nconst app = express();\n\nasync function startServer() {');

// Move `const app = express();` and middlewares above `startServer`
code = code.replace(/async function startServer\(\) {\n\s*const PORT = 3000;\n\s*app.use\(express.json\(\{ limit: '50mb' \}\)\);\n\s*app.use\(express.urlencoded\(\{ limit: '50mb', extended: true \}\)\);/, 'const PORT = process.env.PORT || 3000;\napp.use(express.json({ limit: "50mb" }));\napp.use(express.urlencoded({ limit: "50mb", extended: true }));\n\nasync function startServer() {');

// Move all API routes above `startServer`
// They are currently between `// --- API ROUTES ---` and `// --- VITE MIDDLEWARE / STATIC SERVING ---`
const routesRegex = /(\/\/ --- API ROUTES ---[\s\S]*?)(\/\/ --- VITE MIDDLEWARE \/ STATIC SERVING ---)/;
const routesMatch = code.match(routesRegex);

if (routesMatch) {
    const routes = routesMatch[1];
    code = code.replace(routesRegex, routesMatch[2]);
    code = code.replace('async function startServer() {', routes + '\nasync function startServer() {');
}

// Modify the end of the file
code = code.replace(/}\nstartServer\(\);/, '}\n\nif (!process.env.VERCEL) {\n  startServer();\n}\n\nexport default app;');

fs.writeFileSync('server.ts', code);
