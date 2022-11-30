import { EventEmitter } from 'https://deno.land/x/event@2.0.1/mod.ts'
import { EventSourceClient } from './client.ts'

export type EventMap = {
  connect: [EventSourceClient]
  disconnect: [{ conn_rid: number; by_remote: boolean }]
}

export class EventSourceServer extends EventEmitter<EventMap> {
  private listener: Deno.Listener
  public conns = new Map<number, EventSourceClient>()
  private decoder: TextDecoder
  private encoder: TextEncoder

  constructor(options: Deno.TcpListenOptions) {
    super()
    this.decoder = new TextDecoder()
    this.encoder = new TextEncoder()
    this.listener = Deno.listen(options)
    this.start()
  }

  close(conn_rid: number, by_remote = false): void {
    this.emit('disconnect', { conn_rid: conn_rid, by_remote: by_remote })
    if (this.conns.has(conn_rid)) {
      this.conns.delete(conn_rid)
    }
  }

  broadcast(payload: string): void {
    this.conns.forEach((conn) => {
      conn.send(payload)
    })
  }

  private async start(): Promise<void> {
    for await (const conn of this.listener) {
      const buf = new Uint8Array(1024)
      await conn.read(buf)
      const request = this.decoder.decode(buf)
      if (request.match(/.*ccept: text\/event-stream.*/gm) === null) {
        await conn.write(this.encoder.encode(`HTTP/1.1 404 OK\n\n`))
        conn.close()
        continue
      }

      const client = new EventSourceClient(conn, this.encoder, this)
      this.conns.set(conn.rid, client)
      client.sendRaw(
        `HTTP/1.1 200 OK\nContent-type: text/event-stream\nConnection: keep-alive\nCache-Control: no-store\nAccess-Control-Allow-Origin: *\n\n`,
      )
      this.emit('connect', client)
    }
  }
}
