import dgram from "node:dgram";
import EventEmitter from "node:events";
// https://docs.python.org/3/library/struct.html
import { pack, unpack } from "python-struct";

enum QueryType {
  GetDataRef = "GETD",
  SendDataRef = "DREF",
  SendCommand = "COMM",
}

/**
 * How to send:
 * - https://github.com/nasa/XPlaneConnect/wiki/sendDREF
 *
 * XPlane available data refs and commands:
 * - https://www.siminnovations.com/xplane/dataref
 * - https://www.siminnovations.com/xplane/command
 */
export class XPlane extends EventEmitter {
  #port = 49009;
  #host = "127.0.0.1";

  #client = dgram.createSocket("udp4");

  #callbackStack: ((msg: Buffer) => any)[] = [];

  constructor(host?: string, port?: number) {
    super();

    if (host !== undefined) {
      this.#host = host;
    }

    if (port !== undefined) {
      this.#port = port;
    }

    this.#client.on("error", (err) => {
      this.emit("log", `Error: ${err.message}`);

      this.#client.close();

      this.emit("error", err);
    });

    this.#client.on("listening", () => {
      const address = this.#client.address();

      this.emit("log", `Listening ${address.address}:${address.port}`);
    });

    this.#client.on("connect", () => {
      this.emit("log", "Connect");
    });

    this.#client.on("close", () => {
      this.emit("log", "Close");
    });

    this.#client.on("message", (msg: Buffer) => {
      this.emit(
        "log",
        `Message: ${msg
          .toString("hex")
          .replace(/../g, (c) => c + " ")} ${JSON.stringify(
          msg.toString("ascii")
        )}`
      );

      const cb = this.#callbackStack.pop();

      if (!cb) {
        this.emit("error", "Can not process message from XPlane Connect");
        return;
      }

      cb(msg);
    });
  }

  async #request(req: Buffer, withResponse: boolean): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.#client.send(req, this.#port, this.#host, (err) => {
        if (err) {
          reject(err);
          return;
        }

        if (withResponse) {
          this.#callbackStack.push((res) => resolve(res));
        } else {
          resolve(Buffer.alloc(0));
        }
      });
    });
  }

  async #query(type: QueryType, data: Buffer) {
    const res = await this.#request(
      Buffer.concat([pack("<4sx", [type]), data]),
      true
    );

    const [resType] = unpack("<4s", res);

    if (resType !== "RESP") {
      throw new Error(`Expected message RESP, got ${resType}`);
    }

    return res.subarray(5);
  }

  async #call(type: QueryType, data: Buffer) {
    await this.#request(Buffer.concat([pack("<4sx", [type]), data]), false);
  }

  async getDataRef(name: string, format: string) {
    const res = await this.#query(
      QueryType.GetDataRef,
      pack(`<BB${name.length}s`, [1, name.length, name])
    );

    const [resultsLength, rowLength, ...data] = unpack(`<BB${format}`, res);

    return data;
  }

  async sendDataRef(name: string, format: string, data: any[]) {
    await this.#call(
      QueryType.SendDataRef,
      pack(`<B${name.length}sB${format}`, [
        name.length,
        name,
        data.length,
        ...data,
      ])
    );
  }

  async command(name: string) {
    await this.#call(
      QueryType.SendCommand,
      pack(`<B${name.length}s`, [name.length, name])
    );
  }
}
