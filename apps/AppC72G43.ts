import EventEmitter from "node:events";
import { Button, Command, DeviceG43 } from "../devices/DeviceG43";
import { SimC172G430 } from "../models/SimC172G430";

enum KeyboardLayout {
  Avionics = 10,
  Systems = 11,
  Navigation = 20,
  ADF = 21,
  G530 = 30,
  G430 = 31,
  Autopilot = 40,
  Transponder = 41,
  Default = Avionics,
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
  Default = None,
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
  Autopilot,
  Default = None,
}

enum KeyboardSystemLayout {
  Engine,
  Electro,
  Light,
  Default = Engine,
}

enum KeyboardGx30Layout {
  Left,
  Right,
  Default = Left,
}

enum KeyboardTransponderLayout {
  Mode,
  Code,
  Default = Mode,
}

export class AppC72G43 extends EventEmitter {
  #dev: DeviceG43;
  #sim: SimC172G430;

  #layout = KeyboardLayout.Default;
  #layoutSystem = KeyboardSystemLayout.Default;
  #layoutGx30 = KeyboardGx30Layout.Default;
  #layoutTransponder = KeyboardTransponderLayout.Default;

  #encoderBigMode = EncoderBigMode.Default;
  #encoderSmallMode = EncoderSmallMode.Default;

  constructor(dev: DeviceG43, sim: SimC172G430) {
    super();

    this.#dev = dev;
    this.#sim = sim;

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
  }

  #handleKeyboardClick(button: Button, long: boolean) {
    // Mode selection
    if (button === Button.C1_R1) {
      if (long) {
        this.#selectLayout(KeyboardLayout.Systems);
      } else {
        this.#selectLayout(KeyboardLayout.Avionics);
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
    else if (this.#layout === KeyboardLayout.Avionics) {
      if (button === Button.Encoder) {
        // NOP
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
        // chron mode
        this.#sim.interface.Timer.SelectMode();
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
        // toggle taxi light
        this.#sim.interface.Light.Taxi();
      } else if (button === Button.C4_R3) {
        // trim nose down
        this.#sim.interface.Trim.Down();
      } else if (button === Button.C4_R4) {
        // trim nose up
        this.#sim.interface.Trim.Up();
      }
    } else if (this.#layout === KeyboardLayout.Systems) {
      // Sub mode selection
      if (button === Button.C2_R1) {
        this.#selectSystemLayout(KeyboardSystemLayout.Engine);
      } else if (button === Button.C2_R2) {
        this.#selectSystemLayout(KeyboardSystemLayout.Electro);
      } else if (button === Button.C2_R3) {
        this.#selectSystemLayout(KeyboardSystemLayout.Light);
      } else if (button === Button.C2_R4) {
        // NOP
      }
      // Each sub mode
      else if (this.#layoutSystem === KeyboardSystemLayout.Engine) {
        if (button === Button.Encoder) {
          // NOP
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
      } else if (this.#layoutSystem === KeyboardSystemLayout.Electro) {
        if (button === Button.Encoder) {
          // NOP
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
          // NOP
        } else if (button === Button.C4_R2) {
          // NOP
        } else if (button === Button.C4_R3) {
          // NOP
        } else if (button === Button.C4_R4) {
          // NOP
        }
      } else if (this.#layoutSystem === KeyboardSystemLayout.Light) {
        if (button === Button.Encoder) {
          // NOP
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
          // NOP
        } else if (button === Button.C4_R1) {
          // toggle beacon light
          this.#sim.interface.Light.Beacon();
        } else if (button === Button.C4_R2) {
          // NOP
        } else if (button === Button.C4_R3) {
          // toggle strobe light
          this.#sim.interface.Light.Strobe();
        } else if (button === Button.C4_R4) {
          // NOP
        }
      }
    } else if (this.#layout === KeyboardLayout.ADF) {
      if (button === Button.Encoder) {
        // NOP
      } else if (button === Button.C2_R1) {
        this.#selectBigEncoderMode(EncoderBigMode.None);
        this.#selectSmallEncoderMode(EncoderSmallMode.ADFHeading);
      } else if (button === Button.C2_R2) {
        this.#selectBigEncoderMode(EncoderBigMode.ADFBig);
        this.#selectSmallEncoderMode(EncoderSmallMode.ADFSmall);
      } else if (button === Button.C2_R3) {
        // TODO: ADF frequency flip
      } else if (button === Button.C2_R4) {
        // ?
      } else if (button === Button.C3_R1) {
        // TODO: ADF toggle ADF
      } else if (button === Button.C3_R2) {
        // ?
      } else if (button === Button.C3_R3) {
        // ?
      } else if (button === Button.C3_R4) {
        // ?
      } else if (button === Button.C4_R1) {
        // TODO: ADF toggle BFO
      } else if (button === Button.C4_R2) {
        // ?
      } else if (button === Button.C4_R3) {
        // ?
      } else if (button === Button.C4_R4) {
        // ?
      }
    } else if (this.#layout === KeyboardLayout.G530) {
      // Static buttons
      if (button === Button.C2_R1) {
        // TODO: G530 flip COM frequency
      } else if (button === Button.C2_R2) {
        // TODO: G530 flip NAV frequency
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
          // TODO: G540 left knob
        } else if (button === Button.C3_R1) {
          // TODO: G530 SDI
        } else if (button === Button.C3_R2) {
          // TODO: G530 MSG
        } else if (button === Button.C3_R3) {
          // TODO: G530 VNAV
        } else if (button === Button.C3_R4) {
          // NOP
        } else if (button === Button.C4_R1) {
          // TODO: G530 OBS
        } else if (button === Button.C4_R2) {
          // TODO: G530 FPL
        } else if (button === Button.C4_R3) {
          // TODO: G530 PROC
        } else if (button === Button.C4_R4) {
          // NOP
        }
      } else if (this.#layoutGx30 === KeyboardGx30Layout.Right) {
        if (button === Button.Encoder) {
          // TODO: G530 right knob
        } else if (button === Button.C3_R1) {
          // TODO: G530 Range -
        } else if (button === Button.C3_R2) {
          // TODO: G530 Direct
        } else if (button === Button.C3_R3) {
          // TODO: G530 CLR
        } else if (button === Button.C3_R4) {
          // NOP
        } else if (button === Button.C4_R1) {
          // TODO: G530 Range +
        } else if (button === Button.C4_R2) {
          // TODO: G530 Menu
        } else if (button === Button.C4_R3) {
          // TODO: G530 ENT
        } else if (button === Button.C4_R4) {
          // NOP
        }
      }
    } else if (this.#layout === KeyboardLayout.G430) {
      // Static buttons
      if (button === Button.C2_R1) {
        // TODO: G430 flip COM frequency
      } else if (button === Button.C2_R2) {
        // TODO: G430 flip NAV frequency
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
          // TODO: G430 left knob
        } else if (button === Button.C3_R1) {
          // TODO: G430 SDI
        } else if (button === Button.C3_R2) {
          // TODO: G430 MSG
        } else if (button === Button.C3_R3) {
          // NOP
        } else if (button === Button.C3_R4) {
          // NOP
        } else if (button === Button.C4_R1) {
          // TODO: G430 OBS
        } else if (button === Button.C4_R2) {
          // TODO: G430 FPL
        } else if (button === Button.C4_R3) {
          // TODO: G430 PROC
        } else if (button === Button.C4_R4) {
          // NOP
        }
      } else if (this.#layoutGx30 === KeyboardGx30Layout.Right) {
        if (button === Button.Encoder) {
          // TODO: G430 right knob
        } else if (button === Button.C3_R1) {
          // TODO: G430 Range -
        } else if (button === Button.C3_R2) {
          // TODO: G430 Direct
        } else if (button === Button.C3_R3) {
          // TODO: G430 CLR
        } else if (button === Button.C3_R4) {
          // NOP
        } else if (button === Button.C4_R1) {
          // TODO: G430 Range +
        } else if (button === Button.C4_R2) {
          // TODO: G430 Menu
        } else if (button === Button.C4_R3) {
          // TODO: G430 ENT
        } else if (button === Button.C4_R4) {
          // NOP
        }
      }
    } else if (this.#layout === KeyboardLayout.Autopilot) {
      if (button === Button.Encoder) {
        // NOP
      } else if (button === Button.C2_R1) {
        // AP HDG
        this.#sim.interface.Autopilot.HDG();
      } else if (button === Button.C2_R2) {
        // NOP
      } else if (button === Button.C2_R3) {
        // NOP
      } else if (button === Button.C2_R4) {
        // NOP
      } else if (button === Button.C3_R1) {
        // AP NAV
        this.#sim.interface.Autopilot.NAV();
      } else if (button === Button.C3_R2) {
        // NOP
      } else if (button === Button.C3_R3) {
        // NOP
      } else if (button === Button.C3_R4) {
        // NOP
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
        this.#sim.interface.Autopilot.VerticalSpeed.get().then((value) => {
          this.#dev.call[Command.SetSmallEncoderPosition](Math.round(value / 100));
        });
      }
    } else if (this.#layout === KeyboardLayout.Transponder) {
      // Static buttons
      if (button === Button.Encoder) {
        // NOP
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
          // NOP
        } else if (button === Button.C3_R2) {
          // NOP
        } else if (button === Button.C3_R3) {
          // NOP
        } else if (button === Button.C3_R4) {
          // TODO: Trans TEST
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
      if (this.#encoderBigMode === EncoderBigMode.None) {
        // NOP
      } else if (this.#encoderBigMode === EncoderBigMode.AltPressure) {
        // rotate alt pressure adjust
        this.#sim.interface.Avionics.AltPressure.set(position / 100);
      } else if (this.#encoderBigMode === EncoderBigMode.PitchAdjust) {
        // rotate pitch adjust
        this.#sim.interface.Avionics.HorizonAdjust.set(position / 5);
      } else if (this.#encoderBigMode === EncoderBigMode.OBS1) {
        // rotate OBS1
        this.#sim.interface.Navigation.Nav1.set(position);
      } else if (this.#encoderBigMode === EncoderBigMode.ADFBig) {
        // rotate ADF big
        this.#sim.interface.Navigation.ADFHeading.set(position);
      } else if (this.#encoderBigMode === EncoderBigMode.G530LeftBig) {
        // TODO: rotate G530 left big
      } else if (this.#encoderBigMode === EncoderBigMode.G530RightBig) {
        // TODO: rotate G530 right big
      } else if (this.#encoderBigMode === EncoderBigMode.G430LeftBig) {
        // TODO: rotate G430 left big
      } else if (this.#encoderBigMode === EncoderBigMode.G430RightBig) {
        // TODO: rotate G430 right big
      }
    } else {
      if (this.#encoderSmallMode === EncoderSmallMode.None) {
        // NOP
      } else if (this.#encoderSmallMode === EncoderSmallMode.HeadingBug) {
        // move heading bug
        this.#sim.interface.Avionics.HeadingBug.set(position);
      } else if (this.#encoderSmallMode === EncoderSmallMode.GyroCompassAdjust) {
        // adjust gyro compass
        this.#sim.interface.Avionics.DriftAdjust.set(position);
      } else if (this.#encoderSmallMode === EncoderSmallMode.OBS2) {
        // rotate OBS2
        this.#sim.interface.Navigation.Nav2.set(position);
      } else if (this.#encoderSmallMode === EncoderSmallMode.ADFHeading) {
        // rotate ADF heading
        this.#sim.interface.Navigation.ADFHeading.set(position);
      } else if (this.#encoderSmallMode === EncoderSmallMode.ADFSmall) {
        // TODO: rotate ADF small
      } else if (this.#encoderSmallMode === EncoderSmallMode.G530LeftSmall) {
        // TODO: rotate G530 left small
      } else if (this.#encoderSmallMode === EncoderSmallMode.G530RightSmall) {
        // TODO: rotate G530 right small
      } else if (this.#encoderSmallMode === EncoderSmallMode.G430LeftSmall) {
        // TODO: rotate G430 left small
      } else if (this.#encoderSmallMode === EncoderSmallMode.G430RightSmall) {
        // TODO: rotate G430 right small
      } else if (this.#encoderSmallMode === EncoderSmallMode.Autopilot) {
        // rotate ap vs
        this.#sim.interface.Autopilot.VerticalSpeed.set(Math.round(position) * 100);
      }
    }
  }

  #selectLayout(layout: KeyboardLayout) {
    this.#layout = layout;

    console.log({ layout: KeyboardLayout[this.#layout] });

    this.#layoutSystem = KeyboardSystemLayout.Default;
    this.#layoutGx30 = KeyboardGx30Layout.Default;
    this.#layoutTransponder = KeyboardTransponderLayout.Default;

    if (layout === KeyboardLayout.Avionics) {
      this.#selectBigEncoderMode(EncoderBigMode.AltPressure);
      this.#selectSmallEncoderMode(EncoderSmallMode.HeadingBug);
    } else if (layout === KeyboardLayout.Systems) {
      this.#selectBigEncoderMode(EncoderBigMode.PitchAdjust);
      this.#selectSmallEncoderMode(EncoderSmallMode.GyroCompassAdjust);
    } else if (layout === KeyboardLayout.Navigation) {
      this.#selectBigEncoderMode(EncoderBigMode.OBS1);
      this.#selectSmallEncoderMode(EncoderSmallMode.OBS2);
    } else if (layout === KeyboardLayout.ADF) {
      this.#selectBigEncoderMode(EncoderBigMode.None);
      this.#selectSmallEncoderMode(EncoderSmallMode.ADFHeading);
    } else if (layout === KeyboardLayout.G530) {
      this.#selectBigEncoderMode(EncoderBigMode.G530LeftBig);
      this.#selectSmallEncoderMode(EncoderSmallMode.G530LeftSmall);
    } else if (layout === KeyboardLayout.G430) {
      this.#selectBigEncoderMode(EncoderBigMode.G430LeftBig);
      this.#selectSmallEncoderMode(EncoderSmallMode.G430LeftSmall);
    } else if (layout === KeyboardLayout.Autopilot) {
      this.#selectBigEncoderMode(EncoderBigMode.None);
      this.#selectSmallEncoderMode(EncoderSmallMode.Autopilot);
    } else if (layout === KeyboardLayout.Transponder) {
      this.#selectBigEncoderMode(EncoderBigMode.None);
      this.#selectSmallEncoderMode(EncoderSmallMode.None);
    }
  }

  #selectSystemLayout(layout: KeyboardSystemLayout) {
    this.#layoutSystem = layout;

    console.log({ layoutSystem: KeyboardSystemLayout[this.#layoutSystem] });
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
  }

  #encoderBigSetter(valuePromise: Promise<number>) {
    valuePromise.then((value) => {
      this.#dev.call[Command.SetBigEncoderPosition](value);
    });
  }

  #encoderSmallSetter(valuePromise: Promise<number>) {
    valuePromise.then((value) => {
      this.#dev.call[Command.SetSmallEncoderPosition](value);
    });
  }

  #selectSmallEncoderMode(mode: EncoderSmallMode) {
    this.#encoderSmallMode = mode;

    console.log({ encoderSmallMode: EncoderSmallMode[this.#encoderSmallMode] });

    if (this.#encoderSmallMode === EncoderSmallMode.HeadingBug) {
      // << heading bug position
      this.#encoderSmallSetter(this.#sim.interface.Avionics.HeadingBug.get());
    } else if (this.#encoderSmallMode === EncoderSmallMode.OBS2) {
      // << heading bug position
      this.#encoderSmallSetter(this.#sim.interface.Navigation.Nav2.get());
    } else if (this.#encoderSmallMode === EncoderSmallMode.GyroCompassAdjust) {
      // << heading bug position
      this.#encoderSmallSetter(this.#sim.interface.Avionics.DriftAdjust.get());
    } else if (this.#encoderSmallMode === EncoderSmallMode.ADFHeading) {
      // << heading bug position
      this.#encoderSmallSetter(this.#sim.interface.Navigation.ADFHeading.get());
    } else if (this.#encoderSmallMode === EncoderSmallMode.Autopilot) {
      // << heading bug position
      this.#encoderSmallSetter(this.#sim.interface.Autopilot.VerticalSpeed.get().then((val) => val * 100));
    }

    // FIXME: rest modes for position sync
  }

  #selectBigEncoderMode(mode: EncoderBigMode) {
    this.#encoderBigMode = mode;

    console.log({ encoderBigMode: EncoderBigMode[this.#encoderBigMode] });

    if (this.#encoderBigMode === EncoderBigMode.AltPressure) {
      // << alt pressure
      this.#encoderBigSetter(this.#sim.interface.Avionics.AltPressure.get().then((val) => val * 100));
    } else if (this.#encoderBigMode === EncoderBigMode.PitchAdjust) {
      // << alt pressure
      this.#encoderBigSetter(this.#sim.interface.Avionics.HorizonAdjust.get().then((val) => val * 5));
    }

    // FIXME: rest modes for position sync
  }
}
