export type ControlKind = "key" | "pad" | "knob" | "joystick" | "button" | "display";

export type ControllerControl = {
  id: string;
  kind: ControlKind;
  label: string;
  midiType: "note" | "cc" | "system";
  midiNumber: number | null;
  channel: number;
  value: number;
  active: boolean;
  xValue?: number;
  yValue?: number;
};

const KEY_NAMES = [
  "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
  "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5",
];

export const defaultControls: ControllerControl[] = [
  ...KEY_NAMES.map((label, index) => ({
    id: `key-${index + 1}`,
    kind: "key" as const,
    label,
    midiType: "note" as const,
    midiNumber: 48 + index,
    channel: 1,
    value: 0,
    active: false,
  })),
  ...Array.from({ length: 8 }, (_, index) => ({
    id: `pad-${index + 1}`,
    kind: "pad" as const,
    label: `PAD ${index + 1}`,
    midiType: "note" as const,
    midiNumber: 36 + index,
    channel: 10,
    value: 0,
    active: false,
  })),
  ...[
    "FILTER / ATTACK",
    "RESONANCE / RELEASE",
    "REVERB AMT / EQ LOW",
    "CHORUS AMT / EQ HIGH",
    "SELECT",
    "VOLUME",
  ].map((label, index) => ({
    id: `knob-${index + 1}`,
    kind: "knob" as const,
    label,
    midiType: "cc" as const,
    midiNumber: 20 + index,
    channel: 1,
    value: 64,
    active: false,
  })),
  {
    id: "joystick",
    kind: "joystick",
    label: "X/Y JOYSTICK",
    midiType: "cc",
    midiNumber: 1,
    channel: 1,
    value: 64,
    active: false,
    xValue: 64,
    yValue: 64,
  },
  {
    id: "display",
    kind: "display",
    label: "OLED DISPLAY",
    midiType: "system",
    midiNumber: null,
    channel: 1,
    value: 0,
    active: false,
  },
  ...[
    ["octave-down", "OCTAVE −", 110],
    ["octave-up", "OCTAVE +", 111],
    ["program-prev", "PROGRAM −", 112],
    ["program-next", "PROGRAM +", 113],
    ["bank-a", "BANK A", 114],
    ["bank-b", "BANK B", 115],
  ].map(([id, label, midiNumber]) => ({
    id: String(id),
    kind: "button" as const,
    label: String(label),
    midiType: "cc" as const,
    midiNumber: Number(midiNumber),
    channel: 1,
    value: 0,
    active: false,
  })),
];

export const isBlackKey = (label: string) => label.includes("#");

export const getControl = (controls: ControllerControl[], id: string | null) =>
  controls.find((control) => control.id === id) ?? null;
