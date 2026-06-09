/**
 * NEXO · SAÚDE & SANEAMENTO
 * Servidor Localhost Estático (Sem dependências extras)
 * 
 * Este script utiliza módulos nativos do Node.js (http, fs, path) para criar um 
 * servidor web estático que roda localmente na porta 3000.
 * 
 * Escrito com propósitos didáticos para que você possa rodar o sistema mockup
 * sem precisar instalar pacotes pesados de terceiros (como Express ou live-server).
 * 
 * Como rodar:
 * Abra o terminal na pasta do projeto e execute:
 *   node serve.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Mapeamento de extensões para cabeçalhos Content-Type (MIME Types)
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`[Servidor] Requisição recebida: ${req.url}`);

  // Normaliza o caminho do arquivo solicitado
  let filePath = req.url === '/' ? './index.html' : '.' + req.url;
  
  // Remove query strings ou hashes da URL (ex: ?v=1.2)
  filePath = filePath.split('?')[0].split('#')[0];

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  // Lê o arquivo do disco e serve ao navegador
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Arquivo não encontrado (Erro 404)
        console.warn(`[Servidor] Arquivo não encontrado: ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Erro 404: Arquivo não encontrado', 'utf-8');
      } else {
        // Erro interno do servidor (Erro 500)
        console.error(`[Servidor] Erro ao ler arquivo ${filePath}:`, error);
        res.writeHead(500);
        res.end(`Erro 500: Erro interno do servidor (${error.code})`, 'utf-8');
      }
    } else {
      // Sucesso (Erro 200)
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('\n=============================================================');
  console.log(`  🚀 NEXO · SAÚDE & SANEAMENTO (Mockup PWA) inicializado!`);
  console.log(`  💻 Executando localmente em: http://localhost:${PORT}`);
  console.log('=============================================================\n');
  console.log('Para encerrar o servidor, pressione: CTRL + C no seu terminal.');
});
