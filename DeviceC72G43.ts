import { SerialPort, ReadlineParser } from "serialport";
import { SimC172G430 } from "./models/SimC172G430";

enum Command {
  Reset = 1,
}

type CommandTypes = {
  [Command.Reset]: { args: [] };
};

enum Message {
  EncoderSmallRotate = 1,
  EncoderSmallPress = 2,
  EncoderSmallRelease = 3,
}

const messageDescriptions: {
  [K in Message]: {
    event: { name: string; type: NumberConstructor | StringConstructor }[];
  };
} = {
  [Message.EncoderSmallRotate]: {
    event: [
      { name: "delta", type: Number },
      { name: "position", type: Number },
    ],
  },
  [Message.EncoderSmallPress]: {
    event: [],
  },
  [Message.EncoderSmallRelease]: {
    event: [],
  },
};

export class DeviceC72G43 {
  #sim: SimC172G430;
  #com: SerialPort;

  #parser: ReadlineParser;

  #call = (command: Command, ...args: CommandTypes[typeof command]["args"]) => {
    this.#com.write(
      `${command}\t${args
        .map((val) => String(val).replace("\t", "\\t"))
        .join("\t")}\n`
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

    for (let i = 0; i < description.event.length; i += 1) {
      const argDescription = description.event[i];

      event[argDescription.name] = argDescription.type(args[i]);
    }

    handler(event);
  };

  #messageHandlers: Partial<{
    [K in Message]: (e: any) => void;
  }> = {
    [Message.EncoderSmallRotate]: (e: { delta: number; position: number }) => {
      console.log("ROTATE", e);
    },
  };

  constructor(sim: SimC172G430, com: SerialPort) {
    this.#sim = sim;
    this.#com = com;

    this.#parser = new ReadlineParser();
    com.pipe(this.#parser);
    this.#parser.on("data", this.#onMessage);
  }
}
