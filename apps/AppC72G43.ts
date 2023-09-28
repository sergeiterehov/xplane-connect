import { DeviceG43 } from "../devices/DeviceG43";
import { SimC172G430 } from "../models/SimC172G430";

export class AppC72G43 {
  #dev: DeviceG43;
  #sim: SimC172G430;

  constructor(dev: DeviceG43, sim: SimC172G430) {
    this.#dev = dev;
    this.#sim = sim;

    this.#dev.on("small_encoder_click", () => {
      console.log("Small click")
    });
  }
}
