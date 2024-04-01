const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 8080;

const server = http.createServer((req, res) => {
    // Обрабатываем запросы к файлам index.html и data.js
    if (req.url === '/' || req.url === '/index.html') {
        // Читаем и отправляем файл index.html
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (req.url === '/data.js') {
        // Читаем и отправляем файл composers.json как JSON
        fs.readFile(path.join(__dirname, '/data.js'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading data.js');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
    } else if (req.url === '/script.js') {
            // Читаем и отправляем файл composers.json как JSON
            fs.readFile(path.join(__dirname, '/script.js'), (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error loading script.js');
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/js' });
                    res.end(data);
                }
            });
    } else {
        // Обрабатываем другие запросы, например, запросы к другим ресурсам
        res.writeHead(404);
        res.end('Page not found');
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});