import { ReadlineParser, SerialPort } from "serialport";
import { XPlane } from "./XPlane";
import { C172G430 } from "./C172G430";

// XPlane

const xp = new XPlane();

xp.on("log", console.log);

xp.getDataRef("sim/cockpit/autopilot/heading_mag", "f").then(
  ([heading]) => console.log("Current heading:", heading),
  console.error
);

// Model

const model = new C172G430(xp);

model.interface.Navigation.ADFHeading.get().then(console.log);

// Serial

const serial = new SerialPort({
  path: "/dev/cu.usbserial-210",
  baudRate: 9600,
});

serial.on("open", () => {
  console.log("Serial Port is opened.");
});

serial.on("error", (e) => {
  console.log("Serial port error", e);
});

serial.pipe(new ReadlineParser({ delimiter: "\r\n" })).on("data", (row) => {
  const newHeading = Number(row);

  console.log({ newHeading });

  xp.sendDataRef("sim/cockpit/autopilot/heading_mag", "f", [newHeading]);
});
