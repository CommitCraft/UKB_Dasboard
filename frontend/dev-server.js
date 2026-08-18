import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function start() {
  const server = await createServer({
    root: __dirname,
    configFile: path.join(__dirname, 'vite.config.js'),
    server: {
      host: '0.0.0.0',
      port: 8800
    }
  });
  await server.listen();
  console.log('Aplos_Logix Frontend Vite server listening on http://0.0.0.0:8800');
  server.printUrls();
}

start().catch((err) => {
  console.error('Failed to start Vite dev server:', err);
  process.exit(1);
});
