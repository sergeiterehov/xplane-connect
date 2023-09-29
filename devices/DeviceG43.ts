import EventEmitter from "events";
import { SerialPort, ReadlineParser } from "serialport";

export enum Button {
  // Each encoder emit common event
  Encoder,
  // Ordering here is important
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

export enum Command {
  Reset = 1,
  SetSmallEncoderPosition = 2,
}

enum Message {
  EncoderSmallRotate = 1,
  EncoderSmallButton = 2,
  EncoderSmallShortPress = 3,
  EncoderSmallLongPress = 4,
  KeyboardShortPress = 5,
  KeyboardLongPress = 6,
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
  [Message.KeyboardShortPress]: {
    data: [
      { name: "row", type: Number },
      { name: "col", type: Number },
    ],
  },
  [Message.KeyboardLongPress]: {
    data: [
      { name: "row", type: Number },
      { name: "col", type: Number },
    ],
  },
};

interface Events {
  log: [string];

  big_encoder_rotate: [{ delta: number; position: number }];
  small_encoder_rotate: [{ delta: number; position: number }];
  button_click: [{ button: Button }];
  button_long_click: [{ button: Button }];
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

  #call = (command: Command, ...args: Array<number | string>) => {
    this.emit("log", `CALL ${Command[command]}(${args.join(", ")})`);

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

  #messageHandlers: {
    [K in Message]: (e: any) => void;
  } = {
    [Message.EncoderSmallRotate]: (e: { delta: number; position: number }) => {
      this.emit("small_encoder_rotate", e);
    },
    [Message.EncoderSmallShortPress]: () => {
      this.emit("button_click", { button: Button.Encoder });
    },
    [Message.EncoderSmallLongPress]: () => {
      this.emit("button_long_click", { button: Button.Encoder });
    },
    [Message.EncoderSmallButton]: (e: { state: number }) => {
      // TODO: not implemented. Pressed/released state.
    },
    [Message.KeyboardShortPress]: (e: { row: number; col: number }) => {
      this.emit("button_click", { button: Button.C1_R1 + e.col * 4 + e.row });
    },
    [Message.KeyboardLongPress]: (e: { row: number; col: number }) => {
      this.emit("button_long_click", { button: Button.C1_R1 + e.col * 4 + e.row });
    },
  };

  call = {
    [Command.Reset]: () => {
      this.#call(Command.Reset);
    },
    [Command.SetSmallEncoderPosition]: (position: number) => {
      this.#call(Command.SetSmallEncoderPosition, position);
    },
  };

  constructor(path: string) {
    super();

    const baudRate = 115200;

    this.#serial = new SerialPort({
      path,
      baudRate,
    });

    this.#serial.on("open", () => {
      this.emit("log", `Serial Port is opened ${path} at ${baudRate}.`);
    });

    this.#serial.on("error", (e) => {
      this.emit("log", `Serial port ${path} error: ${e}`);
    });

    this.#parser = new ReadlineParser();
    this.#serial.pipe(this.#parser);
    this.#parser.on("data", this.#onMessage);
  }
}
