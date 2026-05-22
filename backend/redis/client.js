const Redis = require('ioredis')
const pub = new Redis({ host: '127.0.0.1', port: 6379 })
const sub = new Redis({ host: '127.0.0.1', port: 6379 })
pub.on('connect', () => console.log('Redis pub connected'))
sub.on('connect', () => console.log('Redis sub connected'))
module.exports = { pub, sub }