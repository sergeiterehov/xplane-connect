// https://devboards.info/boards/arduino-mega2560-rev3

#define ENCODER_BIG_A 2
#define ENCODER_BIG_B 3

#define ENCODER_SMALL_A 21
#define ENCODER_SMALL_B 20
#define ENCODER_SMALL_BTN 17

// https://deepbluembedded.com/arduino-pcint-pin-change-interrupts/
// #include "PinChangeInterrupt.h";

const int ShortPressTime = 500;

enum Message
{
  EncoderSmallRotate = 1,
  EncoderSmallButton = 2,
  EncoderSmallShortPress = 3,
  EncoderSmallLongPress = 4,
};

struct State
{
  float encoderSmallPosition;
  bool encoderSmallButton;
  bool encoderSmallOnShortPress;
  bool encoderSmallOnLongPress;
};

struct State state;
struct State statePrev;

volatile struct
{
  int lastState;
  int btnState;
  int btnLastState;
  unsigned long pressedTime;
  unsigned long releasedTime;
} encoderSmall;

void intEncoderSmall()
{
  int aState = digitalRead(ENCODER_SMALL_A);

  if (aState != encoderSmall.lastState)
  {
    int bState = digitalRead(ENCODER_SMALL_B);

    state.encoderSmallPosition += (bState != encoderSmall.lastState) ? -0.5 : 0.5;
    encoderSmall.lastState = aState;
  }
}

void intEncoderBig()
{
  // NOP
}

void buttonsMonitor()
{
  // read the state of the switch/button:
  encoderSmall.btnState = digitalRead(ENCODER_SMALL_BTN);

  if (encoderSmall.btnLastState == HIGH && encoderSmall.btnState == LOW) {
    encoderSmall.pressedTime = millis();

    state.encoderSmallButton = true;
  } else if (encoderSmall.btnLastState == LOW && encoderSmall.btnState == HIGH) {
    encoderSmall.releasedTime = millis();

    long pressDuration = encoderSmall.releasedTime - encoderSmall.pressedTime;

    if (pressDuration < ShortPressTime) {
      state.encoderSmallOnShortPress = true;
    } else {
      state.encoderSmallOnLongPress = true;
    }

    state.encoderSmallButton = false;
  }

  // save the the last state
  encoderSmall.btnLastState = encoderSmall.btnState;
}

void setup()
{
  state.encoderSmallPosition = -0.5;
  statePrev.encoderSmallPosition = -0.5;

  pinMode(LED_BUILTIN, OUTPUT);

  pinMode(ENCODER_SMALL_BTN, INPUT);

  attachInterrupt(digitalPinToInterrupt(ENCODER_BIG_A), intEncoderBig, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENCODER_BIG_B), intEncoderBig, CHANGE);

  attachInterrupt(digitalPinToInterrupt(ENCODER_SMALL_A), intEncoderSmall, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENCODER_SMALL_B), intEncoderSmall, CHANGE);

  Serial.begin(115200);
}

void loop()
{
  buttonsMonitor();

  if (state.encoderSmallPosition != statePrev.encoderSmallPosition) {
    Serial.print(EncoderSmallRotate);
    Serial.print('\t');
    Serial.print(state.encoderSmallPosition - statePrev.encoderSmallPosition);
    Serial.print('\t');
    Serial.println(state.encoderSmallPosition);
  }

  if (state.encoderSmallButton != statePrev.encoderSmallButton) {
    Serial.print(EncoderSmallButton);
    Serial.print('\t');
    Serial.println(state.encoderSmallButton);
  }

  if (state.encoderSmallOnShortPress != statePrev.encoderSmallOnShortPress) {
    Serial.println(EncoderSmallShortPress);

    state.encoderSmallOnShortPress = false;
  }

  if (state.encoderSmallOnLongPress != statePrev.encoderSmallOnLongPress) {
    Serial.println(EncoderSmallLongPress);

    state.encoderSmallOnLongPress = false;
  }

  statePrev = state;

  delay(1);
}