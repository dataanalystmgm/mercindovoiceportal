const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The original lines are:
// async function startServer() {
//   initLocalDatabase();
//   const app = express();
//   const PORT = 3000;
//   app.use(express.json({ limit: '50mb' }));
//   app.use(express.urlencoded({ limit: '50mb', extended: true }));

code = code.replace(/async function startServer\(\) \{\n\s*initLocalDatabase\(\);\n\s*const app = express\(\);\n\s*const PORT = 3000;\n\s*app\.use\(express\.json\(\{ limit: '50mb' \}\)\);\n\s*app\.use\(express\.urlencoded\(\{ limit: '50mb', extended: true \}\)\);/,
`initLocalDatabase();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

async function startServer() {`);

// Now move routes.
const routesRegex = /(\/\/ --- API ROUTES ---[\s\S]*?)(\/\/ --- VITE MIDDLEWARE \/ STATIC SERVING ---)/;
const routesMatch = code.match(routesRegex);

if (routesMatch) {
    const routes = routesMatch[1];
    code = code.replace(routesRegex, routesMatch[2]);
    code = code.replace('async function startServer() {', routes + '\nasync function startServer() {');
}

// Modify the end of the file
// It currently has:
//   app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });
// }
// startServer();

code = code.replace(/app\.listen\(PORT, '0\.0\.0\.0', \(\) => \{\n\s*console\.log\(`Server running on http:\/\/localhost:\$\{PORT\}`\);\n\s*\}\);\n\}\nstartServer\(\);/,
`if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(\`Server running on http://localhost:\${PORT}\`);
    });
  }
}
if (!process.env.VERCEL) {
  startServer();
}

export default app;`);

fs.writeFileSync('server.ts', code);
