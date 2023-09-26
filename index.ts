import { ReadlineParser, SerialPort } from "serialport";
import { XPlane } from "./XPlane";

// XPlane

const xp = new XPlane();

xp.on("log", console.log);

xp.getDataRef("sim/cockpit/autopilot/heading_mag", "f").then(
  ([heading]) => console.log("Current heading:", heading),
  console.error
);

setInterval(() => {
  // C172

  // G430: n1 - 530, n2 - 430
  // https://www.siminnovations.com/xplane/command/?name=g430&description=&submit=Search

  // C/V
  // xp.command("sim/GPS/g430n1_nav_com_tog");

  // C flip
  // xp.command("sim/GPS/g430n1_com_ff");

  // V flip
  // xp.command("sim/GPS/g430n1_nav_ff");

  // Left Big clock
  // xp.command("sim/GPS/g430n1_coarse_up");

  // Left Big counter clock
  // xp.command("sim/GPS/g430n1_coarse_down");

  // Left Small clock
  // xp.command("sim/GPS/g430n1_fine_up");

  // Left Small counter clock
  // xp.command("sim/GPS/g430n1_fine_down");

  // Transponder
  // https://www.siminnovations.com/xplane/command/?name=transponder&description=&submit=Search

  // IDENT
  // xp.command("sim/transponder/transponder_ident");

  // ALT
  // xp.command("sim/transponder/transponder_alt");

  // ON
  // xp.command("sim/transponder/transponder_on");

  // STBY
  // xp.command("sim/transponder/transponder_standby");

  // OFF
  // xp.command("sim/transponder/transponder_off");

  // CLR
  // xp.command("sim/transponder/transponder_CLR");

  // Digits
  // xp.command("sim/transponder/transponder_digit_0");
  // xp.command("sim/transponder/transponder_digit_1");
  // xp.command("sim/transponder/transponder_digit_2");
  // xp.command("sim/transponder/transponder_digit_3");
  // xp.command("sim/transponder/transponder_digit_4");
  // xp.command("sim/transponder/transponder_digit_5");
  // xp.command("sim/transponder/transponder_digit_6");
  // xp.command("sim/transponder/transponder_digit_7");

  // Autopilot
  // https://www.siminnovations.com/xplane/command/?name=autopilot&description=&submit=Search

  // HDG
  // xp.command("sim/autopilot/heading");

  // HDG
  // xp.command("sim/autopilot/NAV");

  // APR
  // xp.command("sim/autopilot/approach");

  // REV
  // xp.command("sim/autopilot/back_course");

  // ALT
  // xp.command("sim/autopilot/altitude_hold");

  // VS
  // xp.command("sim/autopilot/vertical_speed");

  // VS+
  // xp.command("sim/autopilot/vertical_speed_up");

  // VS-
  // xp.command("sim/autopilot/vertical_speed_down");

  // Disengage
  // xp.command("sim/autopilot/servos_fdir_off");
}, 1000);

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
