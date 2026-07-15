import http from 'node:http';
import { EndpointError, ERROR_CODES } from './errors.mjs';
export function createLocalApi({ diagnostics, authToken, offlineControl }) {
  return http.createServer((req, res) => {
    if (req.headers.authorization !== `Bearer ${authToken}`) {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { code: ERROR_CODES.unauthorizedLocalApi, message: 'Local API authentication failed.' } }));
      return;
    }
    if (req.url === '/diagnostics' && req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(diagnostics()));
      return;
    }
    if (req.url === '/diagnostics/export' && req.method === 'POST') {
      res.writeHead(202, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'accepted' }));
      return;
    }
    if (req.url === '/offline/commands' && req.method === 'POST' && offlineControl) {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', async () => {
        try {
          const result = await offlineControl(JSON.parse(body || '{}'));
          res.writeHead(202, { 'content-type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(400, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: { code: error.code ?? ERROR_CODES.localApiFailed, message: error.message } }));
        }
      });
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: { code: ERROR_CODES.localApiFailed, message: 'Local API route not found.' } }));
  });
}
export function listenLocalhost(server, port = 0) {
  return new Promise((resolve, reject) => {
    server.once('error', (error) => reject(new EndpointError(ERROR_CODES.localApiFailed, 'Local API failed to start.', { cause: error.message })));
    server.listen(port, '127.0.0.1', () => resolve(server.address()));
  });
}
