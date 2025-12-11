class SSEManager {
    constructor() {
        this.clients = [];
    }

    addClient(res) {
        this.clients.push(res);
        console.log(`SSE connecté. Total: ${this.clients.length}`);
    }

    removeClient(res) {
        this.clients = this.clients.filter(c => c !== res);
        console.log(`SSE déconnecté. Total: ${this.clients.length}`);
    }

    broadcast(event = 'refresh') {
        this.clients.forEach(res => {
            try {
                res.write(`data: ${event}\n\n`);
            } catch (e) {
                // Client disconnected
            }
        });
    }

    keepAlive() {
        setInterval(() => {
            this.broadcast('ping');
        }, 30000);
    }
}

module.exports = new SSEManager();
