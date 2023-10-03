import EventEmitter from "node:events";
import { Button, Command, DeviceG43 } from "../devices/DeviceG43";
import { SimC172G430 } from "../models/SimC172G430";
import { makeStepperUpDown } from "../utils/stepper";

enum KeyboardLayout {
  Primary = 10,
  Adjust = 11,
  Navigation = 20,
  ADF = 21,
  G530 = 30,
  G430 = 31,
  Autopilot = 40,
  Transponder = 41,
}

enum EncoderBigMode {
  None,
  AltPressure,
  PitchAdjust,
  OBS1,
  ADFBig,
  G530LeftBig,
  G530RightBig,
  G430LeftBig,
  G430RightBig,
  Autopilot,
}

enum EncoderSmallMode {
  None,
  HeadingBug,
  GyroCompassAdjust,
  OBS2,
  ADFHeading,
  ADFSmall,
  G530LeftSmall,
  G530RightSmall,
  G430LeftSmall,
  G430RightSmall,
}

enum KeyboardAdjustLayout {
  Engine,
  Electro,
  Light,
}

enum KeyboardGx30Layout {
  Left,
  Right,
}

enum KeyboardTransponderLayout {
  Mode,
  Code,
}

export class AppC72G43 extends EventEmitter {
  #dev: DeviceG43;
  #sim: SimC172G430;

  #layout = KeyboardLayout.Primary;
  #layoutAdjust = KeyboardAdjustLayout.Engine;
  #layoutGx30 = KeyboardGx30Layout.Left;
  #layoutTransponder = KeyboardTransponderLayout.Mode;

  #encoderBigMode = EncoderBigMode.None;
  #encoderSmallMode = EncoderSmallMode.None;

  #bigEncoderReader?: (position: number) => void;
  #smallEncoderReader?: (position: number) => void;

  #encoderBigProvider(getter: () => Promise<number>, setter: (position: number) => void) {
    this.#bigEncoderReader = undefined;

    getter().then((value) => {
      this.#dev.call[Command.SetBigEncoderPosition](value);
    });

    this.#bigEncoderReader = setter;
  }

  #encoderSmallProvider(getter: () => Promise<number>, setter: (position: number) => void) {
    this.#smallEncoderReader = undefined;

    getter().then((value) => {
      this.#dev.call[Command.SetSmallEncoderPosition](value);
    });

    this.#smallEncoderReader = setter;
  }

  constructor(dev: DeviceG43, sim: SimC172G430) {
    super();

    this.#dev = dev;
    this.#sim = sim;

    this.#sim.interface.Avionics.Compass.get().then((value) => {
      console.log(`Sim ready. Compass: ${value}`);
    });

    this.#dev.on("connected", () => {
      this.#sim.interface.HUD.OverrideJoystick.set(1);

      setTimeout(() => {
        // this.#dev.call[Command.EnableAnalog]();
        this.#selectLayout(KeyboardLayout.Primary);
      }, 100);
    });

    this.#dev.on("disconnected", () => {
      this.#sim.interface.HUD.OverrideJoystick.set(0);
    });

    this.#dev.on("button_click", ({ button }) => {
      console.log("CLICK", Button[button]);
      this.#handleKeyboardClick(button, false);
    });

    this.#dev.on("button_long_click", ({ button }) => {
      console.log("CLICK_LONG", Button[button]);
      this.#handleKeyboardClick(button, true);
    });

    this.#dev.on("big_encoder_rotate", ({ delta, position }) => {
      this.#handleEncoderRotate(delta, position, true);
    });

    this.#dev.on("small_encoder_rotate", ({ delta, position }) => {
      this.#handleEncoderRotate(delta, position, false);
    });

    this.#dev.on("left_resistor", ({ position }) => {
      this.#handleLeftResistor(position);
    });

    this.#dev.on("axis", ({ x, y }) => {
      this.#handleAxis(x, y);
    });
  }

  #handleAxis(x: number, y: number) {
    // pitch & roll
    this.#sim.interface.Control.Roll.set(x);
    this.#sim.interface.Control.Pitch.set(y);
  }

  #handleLeftResistor(position: number) {
    // throttle
    this.#sim.interface.Engine.Throttle.set(position);
  }

  #handleKeyboardClick(button: Button, long: boolean) {
    // Mode selection
    if (button === Button.C1_R1) {
      if (long) {
        this.#selectLayout(KeyboardLayout.Adjust);
      } else {
        this.#selectLayout(KeyboardLayout.Primary);
      }
    } else if (button === Button.C1_R2) {
      if (long) {
        this.#selectLayout(KeyboardLayout.ADF);
      } else {
        this.#selectLayout(KeyboardLayout.Navigation);
      }
    } else if (button === Button.C1_R3) {
      if (long) {
        this.#selectLayout(KeyboardLayout.G430);
      } else {
        this.#selectLayout(KeyboardLayout.G530);
      }
    } else if (button === Button.C1_R4) {
      if (long) {
        this.#selectLayout(KeyboardLayout.Transponder);
      } else {
        this.#selectLayout(KeyboardLayout.Autopilot);
      }
    }
    // Each mode
    else if (this.#layout === KeyboardLayout.Primary) {
      // Sub mode selection
      if (button === Button.C2_R1) {
        this.#selectAdjustLayout(KeyboardAdjustLayout.Engine);
      } else if (button === Button.C2_R2) {
        this.#selectAdjustLayout(KeyboardAdjustLayout.Electro);
      } else if (button === Button.C2_R3) {
        this.#selectAdjustLayout(KeyboardAdjustLayout.Light);
      } else if (button === Button.C2_R4) {
        // ?
      }
      // Each sub mode
      else if (this.#layoutAdjust === KeyboardAdjustLayout.Engine) {
        if (button === Button.Encoder) {
          // ?
        } else if (button === Button.C3_R1) {
          // magnetos off
          this.#sim.interface.Engine.MagnetosOff();
        } else if (button === Button.C3_R2) {
          // magneto R
          this.#sim.interface.Engine.MagnetosRight();
        } else if (button === Button.C3_R3) {
          // magneto L
          this.#sim.interface.Engine.MagnetosLeft();
        } else if (button === Button.C3_R4) {
          // both magnetos
          this.#sim.interface.Engine.MagnetosBoth();
        } else if (button === Button.C4_R1) {
          // TODO: starter
          // FIXME: This is real problem. I have no idea how made it
        } else if (button === Button.C4_R2) {
          // toggle fuel pump
          this.#sim.interface.Engine.FuelPump();
        } else if (button === Button.C4_R3) {
          // TODO: toggle tank selection
          // Probably need state for this
        } else if (button === Button.C4_R4) {
          // TODO: tank shutoff
          // For what?
        }
      } else if (this.#layoutAdjust === KeyboardAdjustLayout.Electro) {
        if (button === Button.Encoder) {
          // ?
        } else if (button === Button.C3_R1) {
          // toggle master alternate
          this.#sim.interface.Electrical.MasterAlternator();
        } else if (button === Button.C3_R2) {
          // toggle master battery
          this.#sim.interface.Electrical.MasterBattery();
        } else if (button === Button.C3_R3) {
          // toggle bus 1
          this.#sim.interface.Electrical.Bus1();
        } else if (button === Button.C3_R4) {
          // toggle bus 2
          this.#sim.interface.Electrical.Bus2();
        } else if (button === Button.C4_R1) {
          // ?
        } else if (button === Button.C4_R2) {
          // ?
        } else if (button === Button.C4_R3) {
          // ?
        } else if (button === Button.C4_R4) {
          // ?
        }
      } else if (this.#layoutAdjust === KeyboardAdjustLayout.Light) {
        if (button === Button.Encoder) {
          // ?
        } else if (button === Button.C3_R1) {
          // toggle navigation light
          this.#sim.interface.Light.Navigation();
        } else if (button === Button.C3_R2) {
          // toggle taxi light
          this.#sim.interface.Light.Taxi();
        } else if (button === Button.C3_R3) {
          // toggle landing light
          this.#sim.interface.Light.Landing();
        } else if (button === Button.C3_R4) {
          // ?
        } else if (button === Button.C4_R1) {
          // toggle beacon light
          this.#sim.interface.Light.Beacon();
        } else if (button === Button.C4_R2) {
          // ?
        } else if (button === Button.C4_R3) {
          // toggle strobe light
          this.#sim.interface.Light.Strobe();
        } else if (button === Button.C4_R4) {
          // ?
        }
      }
    } else if (this.#layout === KeyboardLayout.Adjust) {
      if (button === Button.Encoder) {
        // ?
      } else if (button === Button.C2_R1) {
        // flaps up
        this.#sim.interface.Flaps.Ratio.set(0);
      } else if (button === Button.C2_R2) {
        // flaps 10
        this.#sim.interface.Flaps.Ratio.set(0.333);
      } else if (button === Button.C2_R3) {
        // flaps 20
        this.#sim.interface.Flaps.Ratio.set(0.666);
      } else if (button === Button.C2_R4) {
        // flaps full
        this.#sim.interface.Flaps.Ratio.set(1);
      } else if (button === Button.C3_R1) {
        // toggle taxi light
        this.#sim.interface.Light.Taxi();
      } else if (button === Button.C3_R2) {
        // toggle lending light
        this.#sim.interface.Light.Landing();
      } else if (button === Button.C3_R3) {
        // break normal
        this.#sim.interface.Brakes.Regular();
      } else if (button === Button.C3_R4) {
        // break max
        this.#sim.interface.Brakes.Max();
      } else if (button === Button.C4_R1) {
        // timer start/stop
        this.#sim.interface.Timer.ControlStartStop();
      } else if (button === Button.C4_R2) {
        // chron mode
        this.#sim.interface.Timer.SelectMode();
      } else if (button === Button.C4_R3) {
        // trim nose down
        this.#sim.interface.Trim.Down();
      } else if (button === Button.C4_R4) {
        // trim nose up
        this.#sim.interface.Trim.Up();
      }
    } else if (this.#layout === KeyboardLayout.ADF) {
      if (button === Button.Encoder) {
        // ?
      } else if (button === Button.C2_R1) {
        this.#selectBigEncoderMode(EncoderBigMode.None);
        this.#selectSmallEncoderMode(EncoderSmallMode.ADFHeading);
      } else if (button === Button.C2_R2) {
        this.#selectBigEncoderMode(EncoderBigMode.ADFBig);
        this.#selectSmallEncoderMode(EncoderSmallMode.ADFSmall);
      } else if (button === Button.C2_R3) {
        // ?
      } else if (button === Button.C2_R4) {
        // ?
      } else if (button === Button.C3_R1) {
        // ?
      } else if (button === Button.C3_R2) {
        // ?
      } else if (button === Button.C3_R3) {
        // ?
      } else if (button === Button.C3_R4) {
        // ADF off
        this.#sim.interface.Navigation.ADF.Off();
      } else if (button === Button.C4_R1) {
        // ADF frequency flip
        this.#sim.interface.Navigation.ADF.FlipFrequency();
      } else if (button === Button.C4_R2) {
        // ADF tone
        this.#sim.interface.Navigation.ADF.Tone();
      } else if (button === Button.C4_R3) {
        // ADF on
        this.#sim.interface.Navigation.ADF.On();
      } else if (button === Button.C4_R4) {
        // ADF antenna
        this.#sim.interface.Navigation.ADF.Antenna();
      }
    } else if (this.#layout === KeyboardLayout.G530) {
      // Static buttons
      if (button === Button.C2_R1) {
        // G530 flip COM frequency
        this.#sim.interface.G530.CFlip();
      } else if (button === Button.C2_R2) {
        // G530 flip NAV frequency
        this.#sim.interface.G530.VFlip();
      }
      // Sub mode selection
      else if (button === Button.C2_R3) {
        this.#selectGx30Layout(KeyboardGx30Layout.Left);
      } else if (button === Button.C2_R4) {
        this.#selectGx30Layout(KeyboardGx30Layout.Right);
      }
      // Each sub mode
      else if (this.#layoutGx30 === KeyboardGx30Layout.Left) {
        if (button === Button.Encoder) {
          // G540 left knob
          this.#sim.interface.G530.LeftClick();
        } else if (button === Button.C3_R1) {
          // G530 CDI
          this.#sim.interface.G530.CDI();
        } else if (button === Button.C3_R2) {
          // G530 MSG
          this.#sim.interface.G530.MSG();
        } else if (button === Button.C3_R3) {
          // G530 VNAV
          this.#sim.interface.G530.VNAV();
        } else if (button === Button.C3_R4) {
          // ?
        } else if (button === Button.C4_R1) {
          // G530 OBS
          this.#sim.interface.G530.OBS();
        } else if (button === Button.C4_R2) {
          // G530 FPL
          this.#sim.interface.G530.FPL();
        } else if (button === Button.C4_R3) {
          // G530 PROC
          this.#sim.interface.G530.PROC();
        } else if (button === Button.C4_R4) {
          // ?
        }
      } else if (this.#layoutGx30 === KeyboardGx30Layout.Right) {
        if (button === Button.Encoder) {
          // G530 right knob
          this.#sim.interface.G530.RightClick();
        } else if (button === Button.C3_R1) {
          // G530 Range -
          this.#sim.interface.G530.RangeOut();
        } else if (button === Button.C3_R2) {
          // G530 Direct
          this.#sim.interface.G530.Direct();
        } else if (button === Button.C3_R3) {
          // G530 CLR
          this.#sim.interface.G530.CLR();
        } else if (button === Button.C3_R4) {
          // ?
        } else if (button === Button.C4_R1) {
          // G530 Range +
          this.#sim.interface.G530.RangeIn();
        } else if (button === Button.C4_R2) {
          // G530 Menu
          this.#sim.interface.G530.MENU();
        } else if (button === Button.C4_R3) {
          // G530 ENT
          this.#sim.interface.G530.ENT();
        } else if (button === Button.C4_R4) {
          // ?
        }
      }
    } else if (this.#layout === KeyboardLayout.G430) {
      // Static buttons
      if (button === Button.C2_R1) {
        // G430 flip COM frequency
        this.#sim.interface.G430.CFlip();
      } else if (button === Button.C2_R2) {
        // G430 flip NAV frequency
        this.#sim.interface.G430.VFlip();
      }
      // Sub mode selection
      else if (button === Button.C2_R3) {
        this.#selectGx30Layout(KeyboardGx30Layout.Left);
      } else if (button === Button.C2_R4) {
        this.#selectGx30Layout(KeyboardGx30Layout.Right);
      }
      // Each sub mode
      else if (this.#layoutGx30 === KeyboardGx30Layout.Left) {
        if (button === Button.Encoder) {
          // G440 left knob
          this.#sim.interface.G430.LeftClick();
        } else if (button === Button.C3_R1) {
          // G430 CDI
          this.#sim.interface.G430.CDI();
        } else if (button === Button.C3_R2) {
          // G430 MSG
          this.#sim.interface.G430.MSG();
        } else if (button === Button.C3_R3) {
          // G430 VNAV not exists
        } else if (button === Button.C3_R4) {
          // ?
        } else if (button === Button.C4_R1) {
          // G430 OBS
          this.#sim.interface.G430.OBS();
        } else if (button === Button.C4_R2) {
          // G430 FPL
          this.#sim.interface.G430.FPL();
        } else if (button === Button.C4_R3) {
          // G430 PROC
          this.#sim.interface.G430.PROC();
        } else if (button === Button.C4_R4) {
          // ?
        }
      } else if (this.#layoutGx30 === KeyboardGx30Layout.Right) {
        if (button === Button.Encoder) {
          // G430 right knob
          this.#sim.interface.G430.RightClick();
        } else if (button === Button.C3_R1) {
          // G430 Range -
          this.#sim.interface.G430.RangeOut();
        } else if (button === Button.C3_R2) {
          // G430 Direct
          this.#sim.interface.G430.Direct();
        } else if (button === Button.C3_R3) {
          // G430 CLR
          this.#sim.interface.G430.CLR();
        } else if (button === Button.C3_R4) {
          // ?
        } else if (button === Button.C4_R1) {
          // G430 Range +
          this.#sim.interface.G430.RangeIn();
        } else if (button === Button.C4_R2) {
          // G430 Menu
          this.#sim.interface.G430.MENU();
        } else if (button === Button.C4_R3) {
          // G430 ENT
          this.#sim.interface.G430.ENT();
        } else if (button === Button.C4_R4) {
          // ?
        }
      }
    } else if (this.#layout === KeyboardLayout.Autopilot) {
      if (button === Button.Encoder) {
        // ?
      } else if (button === Button.C2_R1) {
        // AP HDG
        this.#sim.interface.Autopilot.HDG();
      } else if (button === Button.C2_R2) {
        // ?
      } else if (button === Button.C2_R3) {
        // ?
      } else if (button === Button.C2_R4) {
        // disengage
        this.#sim.interface.Autopilot.Disengage();
      } else if (button === Button.C3_R1) {
        // AP NAV
        this.#sim.interface.Autopilot.NAV();
      } else if (button === Button.C3_R2) {
        // ?
      } else if (button === Button.C3_R3) {
        // ?
      } else if (button === Button.C3_R4) {
        // ?
      } else if (button === Button.C4_R1) {
        // AP APR
        this.#sim.interface.Autopilot.APR();
      } else if (button === Button.C4_R2) {
        // AP REV
        this.#sim.interface.Autopilot.REV();
      } else if (button === Button.C4_R3) {
        // AP ALT
        this.#sim.interface.Autopilot.ALT();
      } else if (button === Button.C4_R4) {
        // AP VS
        this.#sim.interface.Autopilot.VS();
        this.#selectBigEncoderMode(EncoderBigMode.Autopilot);
      }
    } else if (this.#layout === KeyboardLayout.Transponder) {
      // Static buttons
      if (button === Button.Encoder) {
        // ?
      } else if (button === Button.C2_R1) {
        // Trans IDENT
        this.#sim.interface.Transponder.IDENT();
      }
      // Sub mode selection
      else if (button === Button.C2_R3) {
        this.#selectTransponderLayout(KeyboardTransponderLayout.Mode);
      } else if (button === Button.C2_R4) {
        this.#selectTransponderLayout(KeyboardTransponderLayout.Code);
      }
      // Each sub mode
      else if (this.#layoutTransponder === KeyboardTransponderLayout.Mode) {
        if (button === Button.C3_R1) {
          // ?
        } else if (button === Button.C3_R2) {
          // ?
        } else if (button === Button.C3_R3) {
          // ?
        } else if (button === Button.C3_R4) {
          // Trans TEST
          this.#sim.interface.Transponder.TEST();
        } else if (button === Button.C4_R1) {
          // Trans ALT
          this.#sim.interface.Transponder.ALT();
        } else if (button === Button.C4_R2) {
          // Trans ON
          this.#sim.interface.Transponder.ON();
        } else if (button === Button.C4_R3) {
          // Trans STB
          this.#sim.interface.Transponder.STBY();
        } else if (button === Button.C4_R4) {
          // Trans OFF
          this.#sim.interface.Transponder.OFF();
        }
      } else if (this.#layoutTransponder === KeyboardTransponderLayout.Code) {
        if (button === Button.C3_R1) {
          // Trans 1
          this.#sim.interface.Transponder.Digit1();
        } else if (button === Button.C3_R2) {
          // Trans 3
          this.#sim.interface.Transponder.Digit3();
        } else if (button === Button.C3_R3) {
          // Trans 5
          this.#sim.interface.Transponder.Digit5();
        } else if (button === Button.C3_R4) {
          // Trans 7
          this.#sim.interface.Transponder.Digit7();
        } else if (button === Button.C4_R1) {
          // Trans 2
          this.#sim.interface.Transponder.Digit2();
        } else if (button === Button.C4_R2) {
          // Trans 4
          this.#sim.interface.Transponder.Digit4();
        } else if (button === Button.C4_R3) {
          // Trans 6
          this.#sim.interface.Transponder.Digit6();
        } else if (button === Button.C4_R4) {
          // Trans 0
          this.#sim.interface.Transponder.Digit0();
        }
      }
    }
  }

  #handleEncoderRotate(delta: number, position: number, big: boolean) {
    if (big) {
      this.#bigEncoderReader?.(position);
    } else {
      this.#smallEncoderReader?.(position);
    }
  }

  #selectBigEncoderMode(mode: EncoderBigMode) {
    this.#encoderBigMode = mode;

    console.log({ encoderBigMode: EncoderBigMode[this.#encoderBigMode] });

    if (this.#encoderBigMode === EncoderBigMode.None) {
      // ?
    } else if (this.#encoderBigMode === EncoderBigMode.AltPressure) {
      // rotate alt pressure adjust
      this.#encoderBigProvider(
        () => this.#sim.interface.Avionics.AltPressure.get().then((val) => val * 100),
        (position) => this.#sim.interface.Avionics.AltPressure.set(position / 100),
      );
    } else if (this.#encoderBigMode === EncoderBigMode.PitchAdjust) {
      // rotate pitch adjust
      this.#encoderBigProvider(
        () => this.#sim.interface.Avionics.HorizonAdjust.get().then((val) => val * 5),
        (position) => this.#sim.interface.Avionics.HorizonAdjust.set(position / 5),
      );
    } else if (this.#encoderBigMode === EncoderBigMode.OBS1) {
      // rotate OBS1
      this.#encoderBigProvider(
        () => this.#sim.interface.Navigation.Nav1.get().then((value) => -value),
        (position) => this.#sim.interface.Navigation.Nav1.set(-position % 360),
      );
    } else if (this.#encoderBigMode === EncoderBigMode.ADFBig) {
      // rotate ADF big
      this.#encoderBigProvider(
        () => Promise.resolve(0),
        makeStepperUpDown(
          () => this.#sim.interface.Navigation.ADF.BigUp(),
          () => this.#sim.interface.Navigation.ADF.BigDown(),
        ),
      );
    } else if (this.#encoderBigMode === EncoderBigMode.G530LeftBig) {
      // rotate G530 left big
      this.#encoderBigProvider(
        () => Promise.resolve(0),
        makeStepperUpDown(
          () => this.#sim.interface.G530.LeftBigUp(),
          () => this.#sim.interface.G530.LeftBigDown(),
        ),
      );
    } else if (this.#encoderBigMode === EncoderBigMode.G530RightBig) {
      // rotate G530 right big
      this.#encoderBigProvider(
        () => Promise.resolve(0),
        makeStepperUpDown(
          () => this.#sim.interface.G530.RightBigUp(),
          () => this.#sim.interface.G530.RightBigDown(),
        ),
      );
    } else if (this.#encoderBigMode === EncoderBigMode.G430LeftBig) {
      // rotate G430 left big
      this.#encoderBigProvider(
        () => Promise.resolve(0),
        makeStepperUpDown(
          () => this.#sim.interface.G430.LeftBigUp(),
          () => this.#sim.interface.G430.LeftBigDown(),
        ),
      );
    } else if (this.#encoderBigMode === EncoderBigMode.G430RightBig) {
      // rotate G430 right big
      this.#encoderBigProvider(
        () => Promise.resolve(0),
        makeStepperUpDown(
          () => this.#sim.interface.G430.RightBigUp(),
          () => this.#sim.interface.G430.RightBigDown(),
        ),
      );
    } else if (this.#encoderBigMode === EncoderBigMode.Autopilot) {
      // rotate ap vs
      this.#encoderBigProvider(
        () => this.#sim.interface.Autopilot.VerticalSpeed.get().then((val) => val / 100),
        (position) => this.#sim.interface.Autopilot.VerticalSpeed.set(Math.round(position) * 100),
      );
    } else {
      this.#bigEncoderReader = undefined;
    }
  }

  #selectSmallEncoderMode(mode: EncoderSmallMode) {
    this.#encoderSmallMode = mode;

    console.log({ encoderSmallMode: EncoderSmallMode[this.#encoderSmallMode] });

    if (this.#encoderSmallMode === EncoderSmallMode.None) {
      // ?
    } else if (this.#encoderSmallMode === EncoderSmallMode.HeadingBug) {
      // move heading bug
      this.#encoderSmallProvider(
        () => this.#sim.interface.Avionics.HeadingBug.get(),
        (position) => this.#sim.interface.Avionics.HeadingBug.set(position % 360),
      );
    } else if (this.#encoderSmallMode === EncoderSmallMode.GyroCompassAdjust) {
      // adjust gyro compass
      this.#encoderSmallProvider(
        () => this.#sim.interface.Avionics.DriftAdjust.get(),
        (position) => this.#sim.interface.Avionics.DriftAdjust.set(position % 360),
      );
    } else if (this.#encoderSmallMode === EncoderSmallMode.OBS2) {
      // rotate OBS2
      this.#encoderSmallProvider(
        () => this.#sim.interface.Navigation.Nav2.get().then((value) => -value),
        (position) => this.#sim.interface.Navigation.Nav2.set(-position % 360),
      );
    } else if (this.#encoderSmallMode === EncoderSmallMode.ADFHeading) {
      // rotate ADF heading
      this.#encoderSmallProvider(
        () => this.#sim.interface.Navigation.ADFHeading.get().then((value) => -value),
        (position) => this.#sim.interface.Navigation.ADFHeading.set(-position % 360),
      );
    } else if (this.#encoderSmallMode === EncoderSmallMode.ADFSmall) {
      // rotate ADF small
      this.#encoderSmallProvider(
        () => Promise.resolve(0),
        makeStepperUpDown(
          () => this.#sim.interface.Navigation.ADF.SmallUp(),
          () => this.#sim.interface.Navigation.ADF.SmallDown(),
        ),
      );
    } else if (this.#encoderSmallMode === EncoderSmallMode.G530LeftSmall) {
      // rotate G530 left small
      this.#encoderSmallProvider(
        () => Promise.resolve(0),
        makeStepperUpDown(
          () => this.#sim.interface.G530.LeftSmallUp(),
          () => this.#sim.interface.G530.LeftSmallDown(),
        ),
      );
    } else if (this.#encoderSmallMode === EncoderSmallMode.G530RightSmall) {
      // rotate G530 right small
      this.#encoderSmallProvider(
        () => Promise.resolve(0),
        makeStepperUpDown(
          () => this.#sim.interface.G530.RightSmallUp(),
          () => this.#sim.interface.G530.RightSmallDown(),
        ),
      );
    } else if (this.#encoderSmallMode === EncoderSmallMode.G430LeftSmall) {
      // rotate G430 left small
      this.#encoderSmallProvider(
        () => Promise.resolve(0),
        makeStepperUpDown(
          () => this.#sim.interface.G430.LeftSmallUp(),
          () => this.#sim.interface.G430.LeftSmallDown(),
        ),
      );
    } else if (this.#encoderSmallMode === EncoderSmallMode.G430RightSmall) {
      // rotate G430 right small
      this.#encoderSmallProvider(
        () => Promise.resolve(0),
        makeStepperUpDown(
          () => this.#sim.interface.G430.RightSmallUp(),
          () => this.#sim.interface.G430.RightSmallDown(),
        ),
      );
    } else {
      this.#smallEncoderReader = undefined;
    }
  }

  #selectLayout(layout: KeyboardLayout) {
    this.#layout = layout;

    console.log({ layout: KeyboardLayout[this.#layout] });

    if (layout === KeyboardLayout.Primary) {
      this.#selectBigEncoderMode(EncoderBigMode.AltPressure);
      this.#selectSmallEncoderMode(EncoderSmallMode.HeadingBug);
    } else if (layout === KeyboardLayout.Adjust) {
      this.#selectAdjustLayout(KeyboardAdjustLayout.Engine);
    } else if (layout === KeyboardLayout.Navigation) {
      this.#selectBigEncoderMode(EncoderBigMode.OBS1);
      this.#selectSmallEncoderMode(EncoderSmallMode.OBS2);
    } else if (layout === KeyboardLayout.ADF) {
      this.#selectBigEncoderMode(EncoderBigMode.None);
      this.#selectSmallEncoderMode(EncoderSmallMode.ADFHeading);
    } else if (layout === KeyboardLayout.G530) {
      this.#selectGx30Layout(KeyboardGx30Layout.Left);
    } else if (layout === KeyboardLayout.G430) {
      this.#selectGx30Layout(KeyboardGx30Layout.Left);
    } else if (layout === KeyboardLayout.Autopilot) {
      this.#selectBigEncoderMode(EncoderBigMode.Autopilot);
      this.#selectSmallEncoderMode(EncoderSmallMode.HeadingBug);
    } else if (layout === KeyboardLayout.Transponder) {
      this.#selectTransponderLayout(KeyboardTransponderLayout.Mode);
    }
  }

  #selectAdjustLayout(layout: KeyboardAdjustLayout) {
    this.#layoutAdjust = layout;

    console.log({ layoutAdjust: KeyboardAdjustLayout[this.#layoutAdjust] });

    this.#selectBigEncoderMode(EncoderBigMode.PitchAdjust);
    this.#selectSmallEncoderMode(EncoderSmallMode.GyroCompassAdjust);
  }

  #selectGx30Layout(layout: KeyboardGx30Layout) {
    this.#layoutGx30 = layout;

    console.log({ layoutGx30: KeyboardGx30Layout[this.#layoutGx30] });

    if (this.#layout === KeyboardLayout.G530) {
      if (this.#layoutGx30 === KeyboardGx30Layout.Left) {
        this.#selectBigEncoderMode(EncoderBigMode.G530LeftBig);
        this.#selectSmallEncoderMode(EncoderSmallMode.G530LeftSmall);
      } else if (this.#layoutGx30 === KeyboardGx30Layout.Right) {
        this.#selectBigEncoderMode(EncoderBigMode.G530RightBig);
        this.#selectSmallEncoderMode(EncoderSmallMode.G530RightSmall);
      }
    } else if (this.#layout === KeyboardLayout.G430) {
      if (this.#layoutGx30 === KeyboardGx30Layout.Left) {
        this.#selectBigEncoderMode(EncoderBigMode.G430LeftBig);
        this.#selectSmallEncoderMode(EncoderSmallMode.G430LeftSmall);
      } else if (this.#layoutGx30 === KeyboardGx30Layout.Right) {
        this.#selectBigEncoderMode(EncoderBigMode.G430RightBig);
        this.#selectSmallEncoderMode(EncoderSmallMode.G430RightSmall);
      }
    }
  }

  #selectTransponderLayout(layout: KeyboardTransponderLayout) {
    this.#layoutTransponder = layout;

    console.log({ layoutTransponder: KeyboardTransponderLayout[this.#layoutTransponder] });

    this.#selectBigEncoderMode(EncoderBigMode.None);
    this.#selectSmallEncoderMode(EncoderSmallMode.None);
  }
}
