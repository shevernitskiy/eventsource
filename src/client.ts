import { EventSourceServer } from './server.ts'

export class EventSourceClient {
  public conn_rid: number

  constructor(private conn: Deno.Conn, private encoder: TextEncoder, private server: EventSourceServer) {
    this.encoder = new TextEncoder()
    this.conn_rid = conn.rid
  }

  /**
   * It sends a string to the client
   * @param {string} data - The data to send to the client.
   */
  public async send(data: string): Promise<void> {
    await this.sendRaw(`data: ${data}\n\n`)
  }

  /**
   * It sends raw text to the client connection
   * @param {string} data - The data to send to the client.
   */
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

  /**
   * The function closes the connection to the client
   */
  public close(): void {
    this.server.close(this.conn.rid)
    this.conn.close()
  }
}
