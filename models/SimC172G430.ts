import { XPlane } from "./XPlane";

// https://github.com/cpowell/cessna_172SP_skyhawk_for_xplane

type TypeByFormat<F extends string> = F extends
  | "f"
  | "h"
  | "i"
  | "l"
  | "q"
  | "n"
  | "F"
  | "H"
  | "I"
  | "L"
  | "Q"
  | "N"
  | "e"
  | "f"
  | "d"
  | "P"
  ? number
  : F extends "?"
  ? boolean
  : unknown;

/**
 * Cessna 172 with G430/G530
 */
export class SimC172G430 {
  #xp: XPlane;

  #makeCommand = (name: string) => {
    return () => {
      this.#xp.command(name);
    };
  };

  #getReader =
    <T>(name: string, format: string) =>
    async (): Promise<T> => {
      const result = await this.#xp.getDataRef(name, format);

      if (result.length > 1) {
        return result as any;
      }

      return result[0] as any;
    };

  #getWriter =
    <T>(name: string, format: string) =>
    async (value: T): Promise<void> => {
      await this.#xp.sendDataRef(name, format, Array.isArray(value) ? value : [value]);
    };

  #makeReadonlyDataRef = <F extends string = string, T = TypeByFormat<F>>(name: string, format: F) => {
    return {
      get: this.#getReader(name, format),
    };
  };

  #makeDataRef = <F extends string = string, T = TypeByFormat<F>>(name: string, format: F) => {
    return {
      get: this.#getReader<T>(name, format),
      set: this.#getWriter<T>(name, format),
    };
  };

  #interface = {
    Avionics: {
      HeadingBug: this.#makeDataRef("sim/cockpit/autopilot/heading_mag", "f"),
      DriftAdjust: this.#makeDataRef("sim/cockpit/gyros/dg_drift_vac_deg", "f"),
      HorizonAdjust: this.#makeDataRef("sim/cockpit2/gauges/actuators/artificial_horizon_adjust_deg_pilot", "f"),
      AltPressure: this.#makeDataRef("sim/cockpit2/gauges/actuators/barometer_setting_in_hg_pilot", "f"),

      Compass: this.#makeReadonlyDataRef("sim/cockpit2/gauges/indicators/compass_heading_deg_mag", "f"),
      Heading: this.#makeReadonlyDataRef("sim/cockpit2/gauges/indicators/heading_vacuum_deg_mag_pilot", "f"),
      AirSpeed: this.#makeReadonlyDataRef("	sim/cockpit2/gauges/indicators/calibrated_airspeed_kts_pilot", "f"),
      VerticalSpeed: this.#makeReadonlyDataRef("sim/cockpit2/gauges/indicators/vvi_fpm_pilot", "f"),
      Slip: this.#makeReadonlyDataRef("sim/cockpit2/gauges/indicators/slip_deg", "f"),
      Roll: this.#makeReadonlyDataRef("sim/cockpit2/gauges/indicators/roll_vacuum_deg_pilot", "f"),
      Pitch: this.#makeReadonlyDataRef("sim/cockpit2/gauges/indicators/pitch_vacuum_deg_pilot", "f"),
    },

    Navigation: {
      // OBS and ADF

      Nav1: this.#makeDataRef("sim/cockpit2/radios/actuators/nav1_obs_deg_mag_pilot", "f"),
      Nav2: this.#makeDataRef("sim/cockpit2/radios/actuators/nav2_obs_deg_mag_pilot", "f"),
      ADFHeading: this.#makeDataRef("sim/cockpit2/radios/actuators/adf1_card_heading_deg_mag_pilot", "f"),

      ADFBearing: this.#makeReadonlyDataRef("sim/cockpit2/radios/indicators/adf1_relative_bearing_deg", "f"),

      ADF: {
        StandbyFrequency: this.#makeDataRef("sim/cockpit2/radios/actuators/adf1_standby_frequency_hz", "f"),
        Mode: this.#makeDataRef("sim/cockpit2/radios/actuators/adf1_power", "f"),

        FlipFrequency: this.#makeCommand("sim/radios/adf1_standy_flip"),
        Off: this.#makeCommand("sim/radios/adf1_power_mode_0"),
        Antenna: this.#makeCommand("sim/radios/adf1_power_mode_1"),
        On: this.#makeCommand("sim/radios/adf1_power_mode_2"),
        Tone: this.#makeCommand("sim/radios/adf1_power_mode_3"),

        SmallUp: this.#makeCommand("sim/radios/stby_adf1_ones_tens_up"),
        SmallDown: this.#makeCommand("sim/radios/stby_adf1_ones_tens_down"),
        BigUp: this.#makeCommand("sim/radios/stby_adf1_hundreds_thous_up"),
        BigDown: this.#makeCommand("sim/radios/stby_adf1_hundreds_thous_down"),
      },
    },

    G530: {
      // https://www.siminnovations.com/xplane/command/?name=g430&description=&submit=Search

      CFlip: this.#makeCommand("sim/GPS/g430n1_com_ff"),
      VFlip: this.#makeCommand("sim/GPS/g430n1_nav_ff"),

      LeftClick: this.#makeCommand("sim/GPS/g430n1_nav_com_tog"),
      LeftBigUp: this.#makeCommand("sim/GPS/g430n1_coarse_up"),
      LeftBigDown: this.#makeCommand("sim/GPS/g430n1_coarse_down"),
      LeftSmallUp: this.#makeCommand("sim/GPS/g430n1_fine_up"),
      LeftSmallDown: this.#makeCommand("sim/GPS/g430n1_fine_down"),

      RightClick: this.#makeCommand("sim/GPS/g430n1_cursor"),
      RightBigUp: this.#makeCommand("sim/GPS/g430n1_chapter_up"),
      RightBigDown: this.#makeCommand("sim/GPS/g430n1_chapter_dn"),
      RightSmallUp: this.#makeCommand("sim/GPS/g430n1_page_up"),
      RightSmallDown: this.#makeCommand("sim/GPS/g430n1_page_dn"),

      CDI: this.#makeCommand("sim/GPS/g430n1_cdi"),
      OBS: this.#makeCommand("sim/GPS/g430n1_obs"),
      MSG: this.#makeCommand("sim/GPS/g430n1_msg"),
      FPL: this.#makeCommand("sim/GPS/g430n1_fpl"),
      VNAV: this.#makeCommand("sim/GPS/g430n1_vnav"),
      PROC: this.#makeCommand("sim/GPS/g430n1_proc"),

      RangeIn: this.#makeCommand("sim/GPS/g430n1_zoom_in"),
      RangeOut: this.#makeCommand("sim/GPS/g430n1_zoom_out"),
      Direct: this.#makeCommand("sim/GPS/g430n1_direct"),
      MENU: this.#makeCommand("sim/GPS/g430n1_menu"),
      CLR: this.#makeCommand("sim/GPS/g430n1_clr"),
      ENT: this.#makeCommand("sim/GPS/g430n1_ent"),
    },

    G430: {
      // https://www.siminnovations.com/xplane/command/?name=g430&description=&submit=Search

      CFlip: this.#makeCommand("sim/GPS/g430n2_com_ff"),
      VFlip: this.#makeCommand("sim/GPS/g430n2_nav_ff"),

      LeftClick: this.#makeCommand("sim/GPS/g430n2_nav_com_tog"),
      LeftBigUp: this.#makeCommand("sim/GPS/g430n2_coarse_up"),
      LeftBigDown: this.#makeCommand("sim/GPS/g430n2_coarse_down"),
      LeftSmallUp: this.#makeCommand("sim/GPS/g430n2_fine_up"),
      LeftSmallDown: this.#makeCommand("sim/GPS/g430n2_fine_down"),

      RightClick: this.#makeCommand("sim/GPS/g430n2_cursor"),
      RightBigUp: this.#makeCommand("sim/GPS/g430n2_chapter_up"),
      RightBigDown: this.#makeCommand("sim/GPS/g430n2_chapter_dn"),
      RightSmallUp: this.#makeCommand("sim/GPS/g430n2_page_up"),
      RightSmallDown: this.#makeCommand("sim/GPS/g430n2_page_dn"),

      CDI: this.#makeCommand("sim/GPS/g430n2_cdi"),
      OBS: this.#makeCommand("sim/GPS/g430n2_obs"),
      MSG: this.#makeCommand("sim/GPS/g430n2_msg"),
      FPL: this.#makeCommand("sim/GPS/g430n2_fpl"),
      PROC: this.#makeCommand("sim/GPS/g430n2_proc"),

      RangeIn: this.#makeCommand("sim/GPS/g430n2_zoom_in"),
      RangeOut: this.#makeCommand("sim/GPS/g430n2_zoom_out"),
      Direct: this.#makeCommand("sim/GPS/g430n2_direct"),
      MENU: this.#makeCommand("sim/GPS/g430n2_menu"),
      CLR: this.#makeCommand("sim/GPS/g430n2_clr"),
      ENT: this.#makeCommand("sim/GPS/g430n2_ent"),
    },

    Transponder: {
      // https://www.siminnovations.com/xplane/command/?name=transponder&description=&submit=Search

      IDENT: this.#makeCommand("sim/transponder/transponder_ident"),
      TEST: this.#makeCommand("sim/transponder/transponder_test"),

      ALT: this.#makeCommand("sim/transponder/transponder_alt"),
      ON: this.#makeCommand("sim/transponder/transponder_on"),
      STBY: this.#makeCommand("sim/transponder/transponder_standby"),
      OFF: this.#makeCommand("sim/transponder/transponder_off"),

      CLR: this.#makeCommand("sim/transponder/transponder_CLR"),

      Digit0: this.#makeCommand("sim/transponder/transponder_digit_0"),
      Digit1: this.#makeCommand("sim/transponder/transponder_digit_1"),
      Digit2: this.#makeCommand("sim/transponder/transponder_digit_2"),
      Digit3: this.#makeCommand("sim/transponder/transponder_digit_3"),
      Digit4: this.#makeCommand("sim/transponder/transponder_digit_4"),
      Digit5: this.#makeCommand("sim/transponder/transponder_digit_5"),
      Digit6: this.#makeCommand("sim/transponder/transponder_digit_6"),
      Digit7: this.#makeCommand("sim/transponder/transponder_digit_7"),
    },

    Autopilot: {
      // https://www.siminnovations.com/xplane/command/?name=autopilot&description=&submit=Search

      HDG: this.#makeCommand("sim/autopilot/heading"),
      NAV: this.#makeCommand("sim/autopilot/NAV"),
      APR: this.#makeCommand("sim/autopilot/approach"),
      REV: this.#makeCommand("sim/autopilot/back_course"),
      ALT: this.#makeCommand("sim/autopilot/altitude_hold"),
      VS: this.#makeCommand("sim/autopilot/vertical_speed"),

      VerticalSpeed: this.#makeDataRef("sim/cockpit/autopilot/vertical_velocity", "f"),
      VSInc: this.#makeCommand("sim/autopilot/vertical_speed_up"),
      VSDec: this.#makeCommand("sim/autopilot/vertical_speed_down"),

      Disengage: this.#makeCommand("sim/autopilot/servos_fdir_off"),
    },

    Electrical: {
      MasterBattery: this.#makeCommand("sim/electrical/batteries_toggle"),
      MasterAlternator: this.#makeCommand("sim/electrical/generators_toggle"),
      Bus1: this.#makeCommand("sim/systems/avionics_toggle"),
      Bus2: this.#makeCommand("sim/electrical/cross_tie_toggle"),
    },

    Engine: {
      MagnetosOff: this.#makeCommand("sim/magnetos/magnetos_off"),
      MagnetosRight: this.#makeCommand("sim/magnetos/magnetos_right_1"),
      MagnetosLeft: this.#makeCommand("sim/magnetos/magnetos_left_1"),
      MagnetosBoth: this.#makeCommand("sim/magnetos/magnetos_both"),
      Starter: this.#makeCommand("sim/starters/engage_starter_1"),
      FuelPump: this.#makeCommand("sim/fuel/fuel_pumps_tog"),
      Throttle: this.#makeDataRef("sim/multiplayer/controls/engine_throttle_request", "f"),
    },

    Light: {
      Navigation: this.#makeCommand("sim/lights/nav_lights_toggle"),
      Taxi: this.#makeCommand("sim/lights/taxi_lights_toggle"),
      Landing: this.#makeCommand("sim/lights/landing_lights_toggle"),
      Beacon: this.#makeCommand("sim/lights/beacon_lights_toggle"),
      Strobe: this.#makeCommand("sim/lights/strobe_lights_toggle"),
    },

    Flaps: {
      Ratio: this.#makeDataRef("sim/cockpit2/controls/flap_ratio", "f"),
    },

    Trim: {
      Up: this.#makeCommand("sim/flight_controls/pitch_trim_up"),
      Down: this.#makeCommand("sim/flight_controls/pitch_trim_down"),
    },

    Brakes: {
      Regular: this.#makeCommand("sim/flight_controls/brakes_toggle_regular"),
      Max: this.#makeCommand("sim/flight_controls/brakes_toggle_max"),
    },

    Timer: {
      SelectMode: this.#makeCommand("sim/instruments/timer_mode"),
      ControlStartStop: this.#makeCommand("sim/instruments/timer_start_stop"),
    },

    Control: {
      Pitch: this.#makeDataRef("sim/joystick/yoke_pitch_ratio", "f"),
      Roll: this.#makeDataRef("sim/joystick/yoke_roll_ratio", "f"),
      Yaw: this.#makeDataRef("sim/joystick/yoke_heading_ratio", "f"),
    },

    HUD: {
      OverrideJoystick: this.#makeDataRef("sim/operation/override/override_joystick", "f"),
    },
  };

  constructor(xp: XPlane) {
    this.#xp = xp;
  }

  get interface() {
    return this.#interface;
  }
}
