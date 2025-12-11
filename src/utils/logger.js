const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

const logger = {
    info: (message) => console.log(`${colors.blue}[INFO]${colors.reset} ${message}`),
    success: (message) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
    error: (message) => console.error(`${colors.red}[ERROR]${colors.reset} ${message}`),
    warn: (message) => console.warn(`${colors.yellow}[WARN]${colors.reset} ${message}`),
};

module.exports = logger;
