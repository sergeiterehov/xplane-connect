// https://devboards.info/boards/arduino-mega2560-rev3

#define ENCODER_BIG_A 19
#define ENCODER_BIG_B 18
#define ENCODER_BIG_BTN 16

#define ENCODER_SMALL_A 21
#define ENCODER_SMALL_B 20
#define ENCODER_SMALL_BTN 17

#define KB_ROW_1 23
#define KB_ROW_2 22
#define KB_ROW_3 25
#define KB_ROW_4 24

#define KB_COL_1 26
#define KB_COL_2 27
#define KB_COL_3 29
#define KB_COL_4 28

#define LEFT_RESISTOR A0

// https://deepbluembedded.com/arduino-pcint-pin-change-interrupts/
// #include "PinChangeInterrupt.h";

const int ShortPressTime = 500;

enum Command
{
  Reset = 1,
  SetBigEncoderPosition = 2,
  SetSmallEncoderPosition = 3,
};

enum Message
{
  Ready = 0,

  EncoderBigRotate = 1,
  EncoderBigButton = 2,
  EncoderBigShortPress = 3,
  EncoderBigLongPress = 4,

  EncoderSmallRotate = 5,
  EncoderSmallButton = 6,
  EncoderSmallShortPress = 7,
  EncoderSmallLongPress = 8,

  KeyboardShortPress = 9,
  KeyboardLongPress = 10,

  ResistorLeft = 11,
};

struct State
{
  float encoderBigPosition;
  bool encoderBigButton;
  bool encoderBigOnShortPress;
  bool encoderBigOnLongPress;

  float encoderSmallPosition;
  bool encoderSmallButton;
  bool encoderSmallOnShortPress;
  bool encoderSmallOnLongPress;

  int leftResistor;

  /** [row][col] */
  bool kbOnShortPress[4][4];
  /** [row][col] */
  bool kbOnLongPress[4][4];
};

struct State state;
struct State statePrev;

struct
{
  char buffer[256];
  int length;
} command;

volatile struct
{
  int lastState;
  int btnLastState;
  unsigned long pressedTime;
} encoderBig;

volatile struct
{
  int lastState;
  int btnLastState;
  unsigned long pressedTime;
} encoderSmall;

struct
{
  /** [row][col] */
  int lastState[4][4];
  /** [row][col] */
  unsigned long pressedTime[4][4];
} keyboard;

const int kbRows[] = {KB_ROW_1, KB_ROW_2, KB_ROW_3, KB_ROW_4};
const int kbCols[] = {KB_COL_1, KB_COL_2, KB_COL_3, KB_COL_4};

void intEncoderBig()
{
  int aState = digitalRead(ENCODER_BIG_A);

  if (aState != encoderBig.lastState)
  {
    int bState = digitalRead(ENCODER_BIG_B);

    state.encoderBigPosition += (bState != encoderBig.lastState) ? -0.5 : 0.5;
    encoderBig.lastState = aState;
  }
}

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

void processBigEncoderButton()
{
  // read the state of the switch/button:
  int btnLevel = digitalRead(ENCODER_BIG_BTN);
  int btnPrev = encoderBig.btnLastState;

  if (btnPrev == HIGH && btnLevel == LOW)
  {
    encoderBig.pressedTime = millis();

    state.encoderBigButton = true;
  }
  else if (btnPrev == LOW && btnLevel == HIGH)
  {
    unsigned long releasedTime = millis();

    long pressDuration = releasedTime - encoderBig.pressedTime;

    if (pressDuration < ShortPressTime)
    {
      state.encoderBigOnShortPress = true;
    }
    else
    {
      state.encoderBigOnLongPress = true;
    }

    state.encoderBigButton = false;
  }

  // save the the last state
  encoderBig.btnLastState = btnLevel;
}

void processSmallEncoderButton()
{
  // read the state of the switch/button:
  int btnLevel = digitalRead(ENCODER_SMALL_BTN);
  int btnPrev = encoderSmall.btnLastState;

  if (btnPrev == HIGH && btnLevel == LOW)
  {
    encoderSmall.pressedTime = millis();

    state.encoderSmallButton = true;
  }
  else if (btnPrev == LOW && btnLevel == HIGH)
  {
    unsigned long releasedTime = millis();

    long pressDuration = releasedTime - encoderSmall.pressedTime;

    if (pressDuration < ShortPressTime)
    {
      state.encoderSmallOnShortPress = true;
    }
    else
    {
      state.encoderSmallOnLongPress = true;
    }

    state.encoderSmallButton = false;
  }

  // save the the last state
  encoderSmall.btnLastState = btnLevel;
}

void processKeyboard()
{
  for (int row = 0; row < 4; row += 1)
  {
    digitalWrite(kbRows[row], LOW);

    for (int col = 0; col < 4; col += 1)
    {
      int current = digitalRead(kbCols[col]);
      int prev = keyboard.lastState[row][col];

      if (prev == HIGH && current == LOW)
      {
        keyboard.pressedTime[row][col] = millis();
      }
      else if (prev == LOW && current == HIGH)
      {
        unsigned long pressedTime = keyboard.pressedTime[row][col];
        unsigned long releasedTime = millis();

        long pressDuration = releasedTime - pressedTime;

        if (pressDuration < ShortPressTime)
        {
          state.kbOnShortPress[row][col] = true;
        }
        else
        {
          state.kbOnLongPress[row][col] = true;
        }
      }

      keyboard.lastState[row][col] = current;
    }

    digitalWrite(kbRows[row], HIGH);
  }
}

bool tryReadCommand()
{
  if (!Serial.available())
  {
    return false;
  }

  while (Serial.available())
  {
    char current = Serial.read();

    if (current == '\n')
    {
      return true;
    }

    command.buffer[command.length++] = current;
  }

  return false;
}

bool processSerialInput()
{
  if (!tryReadCommand())
  {
    return;
  }

  if (command.buffer[0] == '0' + SetBigEncoderPosition)
  {
    float position = atof(&command.buffer[2]);

    state.encoderBigPosition = position;
    statePrev.encoderBigPosition = position;
  }
  else if (command.buffer[0] == '0' + SetSmallEncoderPosition)
  {
    float position = atof(&command.buffer[2]);

    state.encoderSmallPosition = position;
    statePrev.encoderSmallPosition = position;
  }

  command.length = 0;
}

void processLeftResister() {
  int current = analogRead(LEFT_RESISTOR) >> 2;

  state.leftResistor = current;
}

void setup()
{
  state.encoderSmallPosition = -0.5;
  state.encoderBigPosition = -0.5;
  state.leftResistor = 0;

  statePrev.encoderSmallPosition = -0.5;
  statePrev.encoderBigPosition = -0.5;
  statePrev.leftResistor = -1;


  encoderBig.btnLastState = HIGH;
  encoderSmall.btnLastState = HIGH;

  for (int row = 0; row < 4; row += 1)
  {
    for (int col = 0; col < 4; col += 1)
    {
      keyboard.lastState[row][col] = HIGH;
    }
  }

  pinMode(LED_BUILTIN, OUTPUT);

  pinMode(ENCODER_BIG_BTN, INPUT);
  pinMode(ENCODER_SMALL_BTN, INPUT);

  pinMode(LEFT_RESISTOR, INPUT);

  pinMode(KB_ROW_1, OUTPUT);
  pinMode(KB_ROW_2, OUTPUT);
  pinMode(KB_ROW_3, OUTPUT);
  pinMode(KB_ROW_4, OUTPUT);

  pinMode(KB_COL_1, INPUT_PULLUP);
  pinMode(KB_COL_2, INPUT_PULLUP);
  pinMode(KB_COL_3, INPUT_PULLUP);
  pinMode(KB_COL_4, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(ENCODER_BIG_A), intEncoderBig, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENCODER_BIG_B), intEncoderBig, CHANGE);

  attachInterrupt(digitalPinToInterrupt(ENCODER_SMALL_A), intEncoderSmall, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENCODER_SMALL_B), intEncoderSmall, CHANGE);

  Serial.begin(115200);

  Serial.println(Ready);
}

void loop()
{
  processSerialInput();

  processLeftResister();
  processBigEncoderButton();
  processSmallEncoderButton();
  processKeyboard();

  if (state.leftResistor != statePrev.leftResistor) {
    Serial.print(ResistorLeft);
    Serial.print('\t');
    Serial.print(1.0 * state.leftResistor / 256.0);
    Serial.print('\t');
    Serial.println(1.0 * statePrev.leftResistor / 256.0);
  }

  if (state.encoderBigPosition != statePrev.encoderBigPosition)
  {
    Serial.print(EncoderBigRotate);
    Serial.print('\t');
    Serial.print(state.encoderBigPosition - statePrev.encoderBigPosition);
    Serial.print('\t');
    Serial.println(state.encoderBigPosition);
  }

  if (state.encoderBigButton != statePrev.encoderBigButton)
  {
    Serial.print(EncoderBigButton);
    Serial.print('\t');
    Serial.println(state.encoderBigButton);
  }

  if (state.encoderBigOnShortPress != statePrev.encoderBigOnShortPress)
  {
    Serial.println(EncoderBigShortPress);

    state.encoderBigOnShortPress = false;
  }

  if (state.encoderBigOnLongPress != statePrev.encoderBigOnLongPress)
  {
    Serial.println(EncoderBigLongPress);

    state.encoderBigOnLongPress = false;
  }

  if (state.encoderSmallPosition != statePrev.encoderSmallPosition)
  {
    Serial.print(EncoderSmallRotate);
    Serial.print('\t');
    Serial.print(state.encoderSmallPosition - statePrev.encoderSmallPosition);
    Serial.print('\t');
    Serial.println(state.encoderSmallPosition);
  }

  if (state.encoderSmallButton != statePrev.encoderSmallButton)
  {
    Serial.print(EncoderSmallButton);
    Serial.print('\t');
    Serial.println(state.encoderSmallButton);
  }

  if (state.encoderSmallOnShortPress != statePrev.encoderSmallOnShortPress)
  {
    Serial.println(EncoderSmallShortPress);

    state.encoderSmallOnShortPress = false;
  }

  if (state.encoderSmallOnLongPress != statePrev.encoderSmallOnLongPress)
  {
    Serial.println(EncoderSmallLongPress);

    state.encoderSmallOnLongPress = false;
  }

  for (int row = 0; row < 4; row += 1)
  {
    for (int col = 0; col < 4; col += 1)
    {
      if (state.kbOnShortPress[row][col] != statePrev.kbOnShortPress[row][col])
      {
        Serial.print(KeyboardShortPress);
        Serial.print('\t');
        Serial.print(row);
        Serial.print('\t');
        Serial.println(col);

        state.kbOnShortPress[row][col] = false;
      }

      if (state.kbOnLongPress[row][col] != statePrev.kbOnLongPress[row][col])
      {
        Serial.print(KeyboardLongPress);
        Serial.print('\t');
        Serial.print(row);
        Serial.print('\t');
        Serial.println(col);

        state.kbOnLongPress[row][col] = false;
      }
    }
  }

  statePrev = state;

  delay(1);
}