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
  SetBigEncoderPosition = 2,
  SetSmallEncoderPosition = 3,
  EnableAnalog = 4,
}

enum Message {
  Ready = 0,

  EncoderBigRotate = 1,
  EncoderBigButton = 2,
  EncoderBigShortPress = 3,
  EncoderBigLongPress = 4,

  EncoderSmallRotate = 5,
  EncoderSmallButton = 6,
  EncoderSmallShortPress = 7,
  EncoderSmallLongPress = 8,

  KeyboardShortPress = 9,
  KeyboardLongPress = 10,

  ResistorLeft = 11,

  Axis = 12,
}

const messageDescriptions: {
  [K in Message]: {
    data: { name: string; type: NumberConstructor | StringConstructor }[];
  };
} = {
  [Message.Ready]: {
    data: [],
  },
  [Message.EncoderBigRotate]: {
    data: [
      { name: "delta", type: Number },
      { name: "position", type: Number },
    ],
  },
  [Message.EncoderBigButton]: {
    data: [{ name: "state", type: Number }],
  },
  [Message.EncoderBigShortPress]: {
    data: [],
  },
  [Message.EncoderBigLongPress]: {
    data: [],
  },
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
  [Message.ResistorLeft]: {
    data: [
      { name: "position", type: Number },
      { name: "prevPosition", type: Number },
    ],
  },
  [Message.Axis]: {
    data: [
      { name: "x", type: Number },
      { name: "y", type: Number },
      { name: "z", type: Number },
    ],
  },
};

interface Events {
  log: [string];

  connected: [];
  disconnected: [];

  big_encoder_rotate: [{ delta: number; position: number }];
  small_encoder_rotate: [{ delta: number; position: number }];
  button_click: [{ button: Button }];
  button_long_click: [{ button: Button }];
  left_resistor: [{ position: number }];
  axis: [{ x: number; y: number; z: number }];
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
    this.emit("log", `DEV CALL ${Command[command]}(${args.join(", ")})`);

    this.#serial.write(
      `${command}\t${args
        .map((val) => (typeof val === "number" ? val.toFixed(5) : String(val)).replace("\t", "\\t"))
        .join("\t")}\n`,
      "ascii",
    );
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
    [Message.Ready]: () => {
      this.emit("log", "Device ready");
      this.emit("connected");
    },
    [Message.EncoderBigRotate]: (e: { delta: number; position: number }) => {
      this.emit("big_encoder_rotate", e);
    },
    [Message.EncoderBigShortPress]: () => {
      this.emit("button_click", { button: Button.Encoder });
    },
    [Message.EncoderBigLongPress]: () => {
      this.emit("button_long_click", { button: Button.Encoder });
    },
    [Message.EncoderBigButton]: (e: { state: number }) => {
      // TODO: not implemented. Pressed/released state.
    },
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
    [Message.ResistorLeft]: (e: { position: number; prevPosition: number }) => {
      this.emit("left_resistor", { position: e.position });
    },
    [Message.Axis]: (e: { x: number; y: number; z: number }) => {
      this.emit("axis", { x: e.x, y: e.y, z: e.z });
    },
  };

  call = {
    [Command.Reset]: () => {
      this.#call(Command.Reset);
    },
    [Command.SetBigEncoderPosition]: (position: number) => {
      this.#call(Command.SetBigEncoderPosition, position);
    },
    [Command.SetSmallEncoderPosition]: (position: number) => {
      this.#call(Command.SetSmallEncoderPosition, position);
    },
    [Command.EnableAnalog]: () => {
      this.#call(Command.EnableAnalog);
    },
  };

  constructor(path: string) {
    super();

    const baudRate = 115200;
    const reconnectingInterval = 5000;

    this.#serial = new SerialPort({
      path,
      baudRate,
      autoOpen: false,
    });

    this.#serial.on("open", () => {
      this.emit("log", `Serial Port is opened ${path} at ${baudRate}.`);
    });

    this.#serial.on("error", (e) => {
      this.emit("log", `Serial port ${path} error: ${e}`);

      setTimeout(() => this.#serial.open(), reconnectingInterval);
    });

    this.#serial.on("close", () => {
      this.emit("log", `Serial port closed. Reconnecting...`);
      this.emit("disconnected");

      setTimeout(() => this.#serial.open(), reconnectingInterval);
    });

    this.#parser = new ReadlineParser();
    this.#serial.pipe(this.#parser);
    this.#parser.on("data", this.#onMessage);

    setTimeout(() => {
      this.emit("log", `Trying serial port ${path}`);
      this.#serial.open();
    });
  }
}
