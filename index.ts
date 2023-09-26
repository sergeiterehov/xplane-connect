import { ReadlineParser, SerialPort } from "serialport";
import { XPlane } from "./XPlane";

// XPlane

const xp = new XPlane();

xp.on("log", console.log);

xp.getDataRef("sim/cockpit/autopilot/heading_mag", "f").then(
  ([heading]) => console.log("Current heading:", heading),
  console.error
);

xp.command("sim/ice/pitot_heat0_tog");

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
