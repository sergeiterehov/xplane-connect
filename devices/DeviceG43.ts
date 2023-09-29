import EventEmitter from "events";
import { SerialPort, ReadlineParser } from "serialport";

export enum Button {
  // Each encoder emit common event
  Encoder,
  C1_R1,
  C1_R2,
  C1_R3,
  C1_R4,
  C2_R1,
  C2_R2,
  C2_R3,
  C2_R4,
  C3_R1,
  C3_R2,
  C3_R3,
  C3_R4,
  C4_R1,
  C4_R2,
  C4_R3,
  C4_R4,
}

enum Command {
  Reset = 1,
}

type CommandTypes = {
  [Command.Reset]: { args: [] };
};

enum Message {
  EncoderSmallRotate = 1,
  EncoderSmallButton = 2,
  EncoderSmallShortPress = 3,
  EncoderSmallLongPress = 4,
}

const messageDescriptions: {
  [K in Message]: {
    data: { name: string; type: NumberConstructor | StringConstructor }[];
  };
} = {
  [Message.EncoderSmallRotate]: {
    data: [
      { name: "delta", type: Number },
      { name: "position", type: Number },
    ],
  },
  [Message.EncoderSmallButton]: {
    data: [{ name: "state", type: Number }],
  },
  [Message.EncoderSmallShortPress]: {
    data: [],
  },
  [Message.EncoderSmallLongPress]: {
    data: [],
  },
};

interface Events {
  big_encoder_rotate: [{ delta: number; position: number }];
  small_encoder_rotate: [{ delta: number; position: number }];
  button_click: [{ button: Button; long: boolean }];
}

export declare interface DeviceG43 {
  emit<N extends keyof Events>(event: N, ...e: Events[N]): boolean;
  addListener<N extends keyof Events>(event: N, handler: (...e: Events[N]) => any): this;
  on<N extends keyof Events>(event: N, handler: (...e: Events[N]) => any): this;
  once<N extends keyof Events>(event: N, handler: (...e: Events[N]) => any): this;
  prependListener<N extends keyof Events>(event: N, handler: (...e: Events[N]) => any): this;
  prependOnceListener<N extends keyof Events>(event: N, handler: (...e: Events[N]) => any): this;
  removeListener<N extends keyof Events>(event: N, handler: (...e: Events[N]) => any): this;
}

export class DeviceG43 extends EventEmitter {
  #serial: SerialPort;

  #parser: ReadlineParser;

  #call = (command: Command, ...args: CommandTypes[typeof command]["args"]) => {
    this.#serial.write(`${command}\t${args.map((val) => String(val).replace("\t", "\\t")).join("\t")}\n`);
  };

  #onMessage = (line: string) => {
    const [strType, ...args] = line.split("\t");
    const type = Number(strType) as Message;

    const handler = this.#messageHandlers[type];

    if (!handler) return;

    const description = messageDescriptions[type];

    if (!description) return;

    const event = {} as any;

    for (let i = 0; i < description.data.length; i += 1) {
      const argDescription = description.data[i];

      event[argDescription.name] = argDescription.type(args[i]);
    }

    handler(event);
  };

  #messageHandlers: Partial<{
    [K in Message]: (e: any) => void;
  }> = {
    [Message.EncoderSmallRotate]: (e: { delta: number; position: number }) => {
      this.emit("small_encoder_rotate", e);
    },
    [Message.EncoderSmallShortPress]: () => {
      this.emit("button_click", { button: Button.Encoder, long: false });
    },
    [Message.EncoderSmallLongPress]: () => {
      this.emit("button_click", { button: Button.Encoder, long: true });
    },
    [Message.EncoderSmallButton]: (e: { state: number }) => {
      // TODO: not implemented
    },
  };

  constructor(path: string) {
    super();

    this.#serial = new SerialPort({
      path,
      baudRate: 115200,
    });

    this.#serial.on("open", () => {
      console.log("Serial Port is opened.");
    });

    this.#serial.on("error", (e) => {
      console.log("Serial port error", e);
    });

    this.#parser = new ReadlineParser();
    this.#serial.pipe(this.#parser);
    this.#parser.on("data", this.#onMessage);
  }
}
