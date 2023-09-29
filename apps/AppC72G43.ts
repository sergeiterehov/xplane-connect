import { DeviceG43 } from "../devices/DeviceG43";
import { SimC172G430 } from "../models/SimC172G430";

// TODO: move to device
enum Button {
  // Each encoder emit common event
  Encoder,
  C1_R1,
  C1_R2,
  C1_R3,
  C1_R4,
  C2_R1,
  C2_R2,
  C2_R3,
  C2_R4,
  C3_R1,
  C3_R2,
  C3_R3,
  C3_R4,
  C4_R1,
  C4_R2,
  C4_R3,
  C4_R4,
}

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

export class AppC72G43 {
  #dev: DeviceG43;
  #sim: SimC172G430;

  #layout = KeyboardLayout.Default;
  #layoutSystem = KeyboardSystemLayout.Default;
  #layoutGx30 = KeyboardGx30Layout.Default;
  #layoutTransponder = KeyboardTransponderLayout.Default;

  #encoderBigMode = EncoderBigMode.Default;
  #encoderSmallMode = EncoderSmallMode.Default;

  constructor(dev: DeviceG43, sim: SimC172G430) {
    this.#dev = dev;
    this.#sim = sim;

    this.#dev.on("small_encoder_click", () => {
      console.log("Small click");
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
      if (button === Button.C2_R1) {
        // TODO: flaps up
      } else if (button === Button.C2_R2) {
        // TODO: flaps 10
      } else if (button === Button.C2_R3) {
        // TODO: flaps 20
      } else if (button === Button.C2_R4) {
        // TODO: flaps full
      } else if (button === Button.C3_R1) {
        // TODO: clock select
      } else if (button === Button.C3_R2) {
        // TODO: toggle lending light
      } else if (button === Button.C3_R3) {
        // TODO: break normal
      } else if (button === Button.C3_R4) {
        // TODO: break full
      } else if (button === Button.C4_R1) {
        // TODO: clock control
      } else if (button === Button.C4_R2) {
        // TODO: toggle taxi light
      } else if (button === Button.C4_R3) {
        // TODO: trim nose down
      } else if (button === Button.C4_R4) {
        // TODO: trim nose up
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
        if (button === Button.C3_R1) {
          // TODO: magnetos off
        } else if (button === Button.C3_R2) {
          // TODO: magneto 1
        } else if (button === Button.C3_R3) {
          // TODO: magneto 2
        } else if (button === Button.C3_R4) {
          // TODO: both magnetos
        } else if (button === Button.C4_R1) {
          // TODO: starter
        } else if (button === Button.C4_R2) {
          // TODO: toggle fuel pump
        } else if (button === Button.C4_R3) {
          // TODO: toggle tank selection
        } else if (button === Button.C4_R4) {
          // TODO: tank cutoff
        }
      } else if (this.#layoutSystem === KeyboardSystemLayout.Electro) {
        if (button === Button.C3_R1) {
          // TODO: toggle master alternate
        } else if (button === Button.C3_R2) {
          // TODO: toggle master battery
        } else if (button === Button.C3_R3) {
          // TODO: toggle bus 1
        } else if (button === Button.C3_R4) {
          // TODO: toggle bus 2
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
        if (button === Button.C3_R1) {
          // TODO: toggle navigation light
        } else if (button === Button.C3_R2) {
          // TODO: toggle taxi light
        } else if (button === Button.C3_R3) {
          // TODO: toggle landing light
        } else if (button === Button.C3_R4) {
          // NOP
        } else if (button === Button.C4_R1) {
          // TODO: toggle beacon light
        } else if (button === Button.C4_R2) {
          // NOP
        } else if (button === Button.C4_R3) {
          // TODO: toggle strobe light
        } else if (button === Button.C4_R4) {
          // NOP
        }
      }
    } else if (this.#layout === KeyboardLayout.ADF) {
      if (button === Button.C2_R1) {
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
        if (button === Button.C3_R1) {
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
        if (button === Button.C3_R1) {
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
        if (button === Button.C3_R1) {
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
        if (button === Button.C3_R1) {
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
      if (button === Button.C2_R1) {
        // TODO: AP HDG
      } else if (button === Button.C2_R2) {
        // NOP
      } else if (button === Button.C2_R3) {
        // NOP
      } else if (button === Button.C2_R4) {
        // NOP
      } else if (button === Button.C3_R1) {
        // TODO: AP NAV
      } else if (button === Button.C3_R2) {
        // NOP
      } else if (button === Button.C3_R3) {
        // NOP
      } else if (button === Button.C3_R4) {
        // NOP
      } else if (button === Button.C4_R1) {
        // TODO: AP APR
      } else if (button === Button.C4_R2) {
        // TODO: AP REV
      } else if (button === Button.C4_R3) {
        // TODO: AP ALT
      } else if (button === Button.C4_R4) {
        // TODO: AP VS
      }
    } else if (this.#layout === KeyboardLayout.Transponder) {
      // Static buttons
      if (button === Button.C2_R1) {
        // TODO: Trans IDENT
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
          // TODO: Trans ALT
        } else if (button === Button.C4_R2) {
          // TODO: Trans ON
        } else if (button === Button.C4_R3) {
          // TODO: Trans STB
        } else if (button === Button.C4_R4) {
          // TODO: Trans OFF
        }
      } else if (this.#layoutTransponder === KeyboardTransponderLayout.Code) {
        if (button === Button.C3_R1) {
          // TODO: Trans 1
        } else if (button === Button.C3_R2) {
          // TODO: Trans 3
        } else if (button === Button.C3_R3) {
          // TODO: Trans 5
        } else if (button === Button.C3_R4) {
          // TODO: Trans 7
        } else if (button === Button.C4_R1) {
          // TODO: Trans 2
        } else if (button === Button.C4_R2) {
          // TODO: Trans 4
        } else if (button === Button.C4_R3) {
          // TODO: Trans 6
        } else if (button === Button.C4_R4) {
          // TODO: Trans 0
        }
      }
    }
  }

  #selectLayout(layout: KeyboardLayout) {
    this.#layout = layout;

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
      this.#selectBigEncoderMode(EncoderBigMode.ADFBig);
      this.#selectSmallEncoderMode(EncoderSmallMode.ADFSmall);
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
  }

  #selectGx30Layout(layout: KeyboardGx30Layout) {
    this.#layoutGx30 = layout;

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
  }

  #selectSmallEncoderMode(mode: EncoderSmallMode) {
    this.#encoderSmallMode = mode;
  }

  #selectBigEncoderMode(mode: EncoderBigMode) {
    this.#encoderBigMode = mode;
  }
}
