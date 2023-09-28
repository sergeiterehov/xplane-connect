#define ENCODER_SMALL_A 2
#define ENCODER_SMALL_B 3
#define ENCODER_SMALL_BTN 4

enum Message {
  EncoderSmallRotate = 1,
  EncoderSmallPress = 2,
  EncoderSmallRelease = 3,
};

struct State {
  float encoderSmallPosition;
};

struct State state;
struct State statePrev;

volatile struct {
  int lastState;
  int btnState;
} encoderSmall;

void setup() {
  state.encoderSmallPosition = -0.5;
  statePrev.encoderSmallPosition = -0.5;

  Serial.begin(9600);
  attachInterrupt(0, intEncoderSmall, CHANGE);
}

void intEncoderSmall() {
  int aState = digitalRead(ENCODER_SMALL_A);

  if (aState != encoderSmall.lastState) {
    int bState = digitalRead(ENCODER_SMALL_B);

    state.encoderSmallPosition += (bState != encoderSmall.lastState) ? -0.5 : 0.5;
    encoderSmall.lastState = aState;
  }
}

void loop() {
  if (state.encoderSmallPosition != statePrev.encoderSmallPosition) {
    Serial.print(EncoderSmallRotate);
    Serial.print('\t');
    Serial.print(state.encoderSmallPosition - statePrev.encoderSmallPosition);
    Serial.print('\t');
    Serial.println(state.encoderSmallPosition);

    statePrev.encoderSmallPosition = state.encoderSmallPosition;
  }

  delay(100);
}