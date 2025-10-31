const express = require('express');
const cors = require('cors');
const { ExpressPeerServer } = require('peer');
const os = require('os');
const path = require('path');

// Get local IP address
const getLocalIPs = () => {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4') {
                addresses.push({
                    name: name,
                    address: iface.address,
                    internal: iface.internal
                });
            }
        }
    }
    return addresses;
};

const localIP = getLocalIPs();
const PORT = 3001;

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'build')));

// Add OPTIONS handler
app.options('*', cors());

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('Server is running on:');
    console.log(`Local: http://localhost:${PORT}`);
    
    const ips = getLocalIPs();
    console.log('\nAvailable Network Addresses:');
    ips.forEach(ip => {
        console.log(`${ip.name}: http://${ip.address}:${PORT}`);
    });
    
    console.log('\nPeerJS server is available at /peerjs/myapp');
});

const peerServer = ExpressPeerServer(server, {
    path: '/myapp',
    allow_discovery: true,
    debug: true,
    proxied: false,
    pingInterval: 5000,
    ssl: false
});

app.use('/peerjs', peerServer);

// Add a health check endpoint
app.get('/health', (req, res) => {
    res.send('Server is running');
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server shut down.');
        process.exit(0);
    });
});

// Error handling
server.on('error', (error) => {
    console.error('Server error:', error);
});

peerServer.on('connection', (client) => {
    console.log('Client connected:', client.getId());
});

peerServer.on('disconnect', (client) => {
    console.log('Client disconnected:', client.getId());
});