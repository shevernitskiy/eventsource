import { EventSourceServer } from '../mod.ts'

const server = new EventSourceServer({ port: 4505 })

server.on('connect', (client) => {
  console.log(`client ${client.conn_rid} connected`)
  client.send('welcome dear client')
})

server.on('disconnect', (ctx) => {
  console.log(`client ${ctx.conn_rid}: connection closed by ${ctx.by_remote ? 'remote' : 'server'}`)
})

setInterval(() => {
  console.log(`total amount of clients: ${server.conns.size}`)
  server.broadcast('ping')
}, 5000)
