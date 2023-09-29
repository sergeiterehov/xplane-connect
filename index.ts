import { config } from "dotenv";
import { XPlane } from "./models/XPlane";
import { SimC172G430 } from "./models/SimC172G430";
import { DeviceG43 } from "./devices/DeviceG43";
import { AppC72G43 } from "./apps/AppC72G43";

config();

const { SERIAL_PORT } = process.env;

if (!SERIAL_PORT) {
  console.error("Serial port not configured");
  process.exit();
}

// Device

const dev = new DeviceG43(SERIAL_PORT);

dev.on("log", console.log);

// XPlane

const xp = new XPlane();

xp.on("log", console.log);

// Sim model

const sim = new SimC172G430(xp);

// App

const app = new AppC72G43(dev, sim);
