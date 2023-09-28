import { SerialPort } from "serialport";
import { XPlane } from "./models/XPlane";
import { SimC172G430 } from "./models/SimC172G430";
import { DeviceC72G43 } from "./DeviceC72G43";

// XPlane

const xp = new XPlane();

xp.on("log", console.log);

// Sim model

const sim = new SimC172G430(xp);

// Serial

const serial = new SerialPort({
  path: "/dev/cu.usbserial-10",
  baudRate: 115200,
});

serial.on("open", () => {
  console.log("Serial Port is opened.");
});

serial.on("error", (e) => {
  console.log("Serial port error", e);
});

// Device

const dev = new DeviceC72G43(sim, serial);
