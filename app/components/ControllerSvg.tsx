"use client";

import { useMemo, useRef } from "react";
import { isBlackKey, type ControllerControl } from "../lib/controller-data";
import { useControllerStore } from "../store/controller-store";

const WHITE_KEY_W = 59;
const WHITE_KEYS = 15;

function Knob({ control, x, y }: { control: ControllerControl; x: number; y: number }) {
  const { dispatch } = useControllerStore();
  const start = useRef<{ y: number; value: number } | null>(null);
  const angle = -140 + (control.value / 127) * 280;

  return (
    <g
      className={`knob-control ${control.active ? "is-active" : ""}`}
      role="slider"
      aria-label={`${control.label}, value ${control.value}`}
      aria-valuemin={0}
      aria-valuemax={127}
      aria-valuenow={control.value}
      tabIndex={0}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        start.current = { y: event.clientY, value: control.value };
        dispatch({ type: "SELECT", id: control.id });
      }}
      onPointerMove={(event) => {
        if (!start.current) return;
        dispatch({ type: "SET_VALUE", id: control.id, value: start.current.value + Math.round((start.current.y - event.clientY) * 0.8) });
      }}
      onPointerUp={() => {
        start.current = null;
        dispatch({ type: "RELEASE", id: control.id });
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp" || event.key === "ArrowRight") dispatch({ type: "SET_VALUE", id: control.id, value: control.value + 1 });
        if (event.key === "ArrowDown" || event.key === "ArrowLeft") dispatch({ type: "SET_VALUE", id: control.id, value: control.value - 1 });
      }}
    >
      <circle cx={x} cy={y} r="29" className="knob-shadow" />
      <circle cx={x} cy={y} r="24" className="knob-body" />
      <line x1={x} y1={y - 10} x2={x} y2={y - 21} className="knob-indicator" transform={`rotate(${angle} ${x} ${y})`} />
      <text x={x} y={y + 43} textAnchor="middle" className="control-label">{control.label.replace("Q-LINK ", "")}</text>
    </g>
  );
}

export function ControllerSvg() {
  const { state, dispatch } = useControllerStore();
  const byId = (id: string) => state.controls.find((control) => control.id === id)!;
  const keys = state.controls.filter((control) => control.kind === "key");
  const pads = state.controls.filter((control) => control.kind === "pad");
  const knobs = state.controls.filter((control) => control.kind === "knob");
  const whitePositions = useMemo(() => {
    let whiteIndex = 0;
    return keys.map((control) => {
      if (isBlackKey(control.label)) return null;
      return whiteIndex++;
    });
  }, [keys]);

  const keyX = (index: number) => {
    let whiteBefore = 0;
    for (let i = 0; i < index; i++) if (!isBlackKey(keys[i].label)) whiteBefore++;
    return isBlackKey(keys[index].label) ? whiteBefore * WHITE_KEY_W - 18 : whiteBefore * WHITE_KEY_W;
  };

  const press = (control: ControllerControl, value = 127) => dispatch({ type: "SET_VALUE", id: control.id, value, active: true });
  const release = (control: ControllerControl) => dispatch({ type: "RELEASE", id: control.id });

  return (
    <svg className="controller-svg" viewBox="0 0 1220 680" role="img" aria-label="Interactive 25-key MIDI controller">
      <defs>
        <linearGradient id="panel" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#27292c" /><stop offset="1" stopColor="#141618" /></linearGradient>
        <linearGradient id="pad" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#363a3d" /><stop offset="1" stopColor="#202326" /></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect x="8" y="8" width="1204" height="664" rx="24" fill="url(#panel)" stroke="#3a3d40" strokeWidth="2" />
      <rect x="21" y="21" width="1178" height="15" rx="7" fill="#d52530" />
      <text x="44" y="75" className="brand-mark">MIDILAB</text>
      <text x="44" y="96" className="brand-sub">MINI PLAY · 25</text>

      <g aria-label="Joystick" className={`joystick-control ${byId("joystick").active ? "is-active" : ""}`} tabIndex={0} role="slider"
        onClick={() => press(byId("joystick"), byId("joystick").value === 127 ? 64 : 127)}>
        <rect x="42" y="126" width="112" height="112" rx="18" className="recess" />
        <circle cx="98" cy="182" r="37" className="joystick-base" />
        <circle cx="98" cy="174" r="22" className="joystick-stick" />
        <text x="98" y="257" textAnchor="middle" className="section-label">X / Y</text>
      </g>

      <g className="display-module" role="button" tabIndex={0} onClick={() => dispatch({ type: "SELECT", id: "display" })}>
        <rect x="185" y="62" width="272" height="118" rx="12" className="display-shell" />
        <rect x="201" y="77" width="240" height="87" rx="5" className="display-screen" />
        <text x="218" y="103" className="screen-kicker">PROGRAM 01</text>
        <text x="218" y="134" className="screen-main">{state.lastMessage}</text>
        <rect x="218" y="146" width="132" height="3" rx="2" fill="#405b56" />
        <rect x="218" y="146" width="76" height="3" rx="2" fill="#9bf5d0" />
      </g>

      {knobs.map((control, index) => (
        <Knob key={control.id} control={control} x={515 + (index % 4) * 91} y={91 + Math.floor(index / 4) * 112} />
      ))}

      <g className="pads-group">
        {pads.map((control, index) => {
          const x = 900 + (index % 4) * 70;
          const y = 65 + Math.floor(index / 4) * 92;
          return (
            <g key={control.id} className={`pad-control ${control.active ? "is-active" : ""}`} role="button" tabIndex={0} aria-label={`${control.label}, MIDI note ${control.midiNumber}`}
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press(control); }}
              onPointerUp={() => release(control)} onPointerCancel={() => release(control)}
              onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") press(control); }} onKeyUp={() => release(control)}>
              <rect x={x} y={y} width="58" height="68" rx="8" fill="url(#pad)" className="pad-rect" />
              <text x={x + 29} y={y + 84} textAnchor="middle" className="control-label">{index + 1}</text>
            </g>
          );
        })}
      </g>

      <g className="utility-buttons">
        {["program-prev", "program-next", "bank-a", "bank-b"].map((id, index) => {
          const control = byId(id);
          const x = 186 + index * 67;
          return (
            <g key={id} role="button" tabIndex={0} className={control.active ? "is-active" : ""}
              onPointerDown={() => press(control)} onPointerUp={() => release(control)} onPointerLeave={() => release(control)}>
              <rect x={x} y="205" width="55" height="35" rx="6" className="utility-button" />
              <text x={x + 27.5} y="227" textAnchor="middle" className="button-label">{control.label.replace("PROGRAM ", "PGM ")}</text>
            </g>
          );
        })}
      </g>

      <g transform="translate(282 280)">
        {keys.map((control, index) => {
          if (isBlackKey(control.label)) return null;
          const x = (whitePositions[index] ?? 0) * WHITE_KEY_W;
          return (
            <g key={control.id} className={`piano-key white-key ${control.active ? "is-active" : ""}`} role="button" tabIndex={0} aria-label={`${control.label}, MIDI note ${control.midiNumber}`}
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press(control); }} onPointerUp={() => release(control)} onPointerCancel={() => release(control)}
              onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") press(control); }} onKeyUp={() => release(control)}>
              <rect x={x} y="0" width={WHITE_KEY_W - 2} height="336" rx="0 0 7 7" className="white-key-shape" />
              <text x={x + 29} y="314" textAnchor="middle" className="key-label">{control.label}</text>
            </g>
          );
        })}
        {keys.map((control, index) => {
          if (!isBlackKey(control.label)) return null;
          const x = keyX(index);
          return (
            <g key={control.id} className={`piano-key black-key ${control.active ? "is-active" : ""}`} role="button" tabIndex={0} aria-label={`${control.label}, MIDI note ${control.midiNumber}`}
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press(control); }} onPointerUp={() => release(control)} onPointerCancel={() => release(control)}
              onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") press(control); }} onKeyUp={() => release(control)}>
              <rect x={x} y="0" width="36" height="206" rx="0 0 6 6" className="black-key-shape" />
              <text x={x + 18} y="188" textAnchor="middle" className="black-key-label">{control.label}</text>
            </g>
          );
        })}
      </g>

      <g className="octave-controls">
        {["octave-down", "octave-up"].map((id, index) => {
          const control = byId(id);
          return (
            <g key={id} role="button" tabIndex={0} onPointerDown={() => press(control)} onPointerUp={() => release(control)} onPointerLeave={() => release(control)}>
              <rect x={52 + index * 99} y="326" width="84" height="44" rx="7" className={`octave-button ${control.active ? "is-active" : ""}`} />
              <text x={94 + index * 99} y="353" textAnchor="middle" className="button-label">{index ? "OCT +" : "OCT −"}</text>
            </g>
          );
        })}
        <text x="141" y="397" textAnchor="middle" className="section-label">OCTAVE</text>
      </g>
      <text x="50" y="628" className="footer-mark">25-KEY USB MIDI CONTROLLER</text>
      <circle cx="1170" cy="636" r="5" fill="#9bf5d0" filter="url(#glow)" />
    </svg>
  );
}
