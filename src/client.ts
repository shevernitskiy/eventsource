import { EventSourceServer } from './server.ts'

export class EventSourceClient {
  public conn_rid: number

  constructor(private conn: Deno.Conn, private encoder: TextEncoder, private server: EventSourceServer) {
    this.encoder = new TextEncoder()
    this.conn_rid = conn.rid
  }

  public async send(data: string): Promise<void> {
    await this.sendRaw(`data: ${data}\n\n`)
  }

  public async sendRaw(data: string): Promise<void> {
    try {
      await this.conn.write(this.encoder.encode(data))
    } catch (err) {
      if (err?.message?.includes('os error 10053')) {
        this.server.close(this.conn.rid, true)
      } else {
        throw err
      }
    }
  }

  public close(): void {
    this.server.close(this.conn.rid)
    this.conn.close()
  }
}
