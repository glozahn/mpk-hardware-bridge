"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import { defaultControls, type ControllerControl } from "../lib/controller-data";

type MidiDevice = { id: string; name: string };

type ControllerState = {
  controls: ControllerControl[];
  selectedId: string;
  midiDevices: MidiDevice[];
  selectedMidiId: string;
  midiStatus: "unsupported" | "idle" | "ready" | "connected" | "denied";
  lastMessage: string;
};

type Action =
  | { type: "SELECT"; id: string }
  | { type: "SET_VALUE"; id: string; value: number; active?: boolean }
  | { type: "SET_JOYSTICK"; xValue: number; yValue: number }
  | { type: "CENTER_JOYSTICK" }
  | { type: "RELEASE"; id: string }
  | { type: "SET_MIDI"; devices: MidiDevice[]; status: ControllerState["midiStatus"] }
  | { type: "SELECT_MIDI"; id: string }
  | { type: "MIDI_MESSAGE"; midiType: "note" | "cc"; number: number; channel: number; value: number }
  | { type: "LOAD_MAPPING"; controls: ControllerControl[] }
  | { type: "RESET" };

const initialState: ControllerState = {
  controls: defaultControls,
  selectedId: "pad-1",
  midiDevices: [],
  selectedMidiId: "",
  midiStatus: "idle",
  lastMessage: "Waiting for input",
};

function reducer(state: ControllerState, action: Action): ControllerState {
  if (action.type === "SELECT") return { ...state, selectedId: action.id };
  if (action.type === "SET_VALUE") {
    return {
      ...state,
      selectedId: action.id,
      controls: state.controls.map((control) =>
        control.id === action.id
          ? { ...control, value: Math.max(0, Math.min(127, action.value)), active: action.active ?? true }
          : control,
      ),
    };
  }
  if (action.type === "SET_JOYSTICK") {
    const clamp = (value: number) => Math.max(0, Math.min(127, Math.round(value)));
    return {
      ...state,
      selectedId: "joystick",
      controls: state.controls.map((control) =>
        control.id === "joystick"
          ? { ...control, xValue: clamp(action.xValue), yValue: clamp(action.yValue), value: clamp(action.yValue), active: true }
          : control,
      ),
    };
  }
  if (action.type === "CENTER_JOYSTICK") {
    return {
      ...state,
      controls: state.controls.map((control) =>
        control.id === "joystick" ? { ...control, xValue: 64, yValue: 64, value: 64, active: false } : control,
      ),
    };
  }
  if (action.type === "RELEASE") {
    return {
      ...state,
      controls: state.controls.map((control) =>
        control.id === action.id ? { ...control, active: false, value: control.kind === "knob" ? control.value : 0 } : control,
      ),
    };
  }
  if (action.type === "SET_MIDI") return { ...state, midiDevices: action.devices, midiStatus: action.status };
  if (action.type === "SELECT_MIDI") return { ...state, selectedMidiId: action.id, midiStatus: action.id ? "connected" : "ready" };
  if (action.type === "MIDI_MESSAGE") {
    const match = state.controls.find(
      (control) => control.midiType === action.midiType && control.midiNumber === action.number && control.channel === action.channel,
    );
    return {
      ...state,
      selectedId: match?.id ?? state.selectedId,
      lastMessage: `${action.midiType.toUpperCase()} ${action.number} · CH ${action.channel} · ${action.value}`,
      controls: match
        ? state.controls.map((control) =>
            control.id === match.id ? { ...control, value: action.value, active: action.value > 0 } : control,
          )
        : state.controls,
    };
  }
  if (action.type === "LOAD_MAPPING") {
    return { ...state, controls: action.controls, selectedId: action.controls[0]?.id ?? "" };
  }
  if (action.type === "RESET") return { ...initialState, midiDevices: state.midiDevices, midiStatus: state.midiStatus };
  return state;
}

type Store = {
  state: ControllerState;
  dispatch: Dispatch<Action>;
  requestMidi: () => Promise<void>;
  saveMapping: () => void;
  loadMapping: (file: File) => Promise<void>;
};

const ControllerContext = createContext<Store | null>(null);

export function ControllerStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const midiAccessRef = useRef<MIDIAccess | null>(null);

  const refreshDevices = useCallback((access: MIDIAccess) => {
    const devices = Array.from(access.inputs.values()).map((input) => ({
      id: input.id,
      name: input.name || `MIDI input ${input.id.slice(0, 5)}`,
    }));
    dispatch({ type: "SET_MIDI", devices, status: "ready" });
  }, []);

  const requestMidi = useCallback(async () => {
    if (!("requestMIDIAccess" in navigator)) {
      dispatch({ type: "SET_MIDI", devices: [], status: "unsupported" });
      return;
    }
    try {
      const access = await navigator.requestMIDIAccess();
      midiAccessRef.current = access;
      refreshDevices(access);
      access.onstatechange = () => refreshDevices(access);
    } catch {
      dispatch({ type: "SET_MIDI", devices: [], status: "denied" });
    }
  }, [refreshDevices]);

  useEffect(() => {
    const access = midiAccessRef.current;
    if (!access) return;
    access.inputs.forEach((input) => {
      input.onmidimessage = null;
    });
    const input = access.inputs.get(state.selectedMidiId);
    if (!input) return;

    // MIDI status high nibble identifies the message; low nibble is the zero-based channel.
    input.onmidimessage = (event) => {
      const [status = 0, number = 0, value = 0] = Array.from(event.data);
      const command = status & 0xf0;
      const channel = (status & 0x0f) + 1;
      if (command === 0x90 || command === 0x80) {
        dispatch({ type: "MIDI_MESSAGE", midiType: "note", number, channel, value: command === 0x80 ? 0 : value });
      } else if (command === 0xb0) {
        dispatch({ type: "MIDI_MESSAGE", midiType: "cc", number, channel, value });
      }
    };
    return () => {
      input.onmidimessage = null;
    };
  }, [state.selectedMidiId]);

  const saveMapping = useCallback(() => {
    const payload = JSON.stringify({ version: 1, name: "MIDILAB Mini default mapping", controls: state.controls }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "midilab-mini-mapping.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [state.controls]);

  const loadMapping = useCallback(async (file: File) => {
    const parsed = JSON.parse(await file.text()) as { controls?: ControllerControl[] };
    const hasCompleteSurface =
      Array.isArray(parsed.controls) &&
      defaultControls.every((required) => parsed.controls?.some((control) => control.id === required.id)) &&
      parsed.controls.every(
        (control) =>
          control.id &&
          control.kind &&
          Number.isFinite(control.channel) &&
          Number.isFinite(control.value),
      );
    if (!hasCompleteSurface) {
      throw new Error("Invalid controller mapping");
    }
    // Normalize imports to the physical surface so older mappings cannot add
    // controls that do not exist on the real unit.
    const normalized = defaultControls.map((required) => ({
      ...required,
      ...parsed.controls?.find((control) => control.id === required.id),
      active: false,
    }));
    dispatch({ type: "LOAD_MAPPING", controls: normalized });
  }, []);

  const value = useMemo(() => ({ state, dispatch, requestMidi, saveMapping, loadMapping }), [state, requestMidi, saveMapping, loadMapping]);
  return <ControllerContext.Provider value={value}>{children}</ControllerContext.Provider>;
}

export function useControllerStore() {
  const store = useContext(ControllerContext);
  if (!store) throw new Error("useControllerStore must be used within ControllerStoreProvider");
  return store;
}
