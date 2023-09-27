import { SerialPort } from "serialport";
import { SimC172G430 } from "./models/SimC172G430";

export class DeviceC72G43 {
  #sim: SimC172G430;
  #com: SerialPort;

  constructor(sim: SimC172G430, com: SerialPort) {
    this.#sim = sim;
    this.#com = com;

    sim.interface.Avionics.HeadingBug.get().then(console.log);
  }
}
