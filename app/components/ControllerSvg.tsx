"use client";

import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { isBlackKey, type ControllerControl } from "../lib/controller-data";
import { useControllerStore } from "../store/controller-store";

const WHITE_KEY_W = 77;
const JOYSTICK = { x: 88, y: 83, range: 20 };
const KNOB_POSITIONS = [
  { x: 250, y: 66 }, { x: 380, y: 66 }, { x: 510, y: 66 }, { x: 640, y: 66 },
  { x: 920, y: 70 }, { x: 1092, y: 70 }, { x: 806, y: 226 }, { x: 884, y: 226 },
];

function Knob({ control, x, y, compact = false }: { control: ControllerControl; x: number; y: number; compact?: boolean }) {
  const { dispatch } = useControllerStore();
  const start = useRef<{ y: number; value: number } | null>(null);
  const angle = -140 + (control.value / 127) * 280;
  const radius = compact ? 17 : 25;

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
      onPointerUp={() => { start.current = null; dispatch({ type: "RELEASE", id: control.id }); }}
      onPointerCancel={() => { start.current = null; dispatch({ type: "RELEASE", id: control.id }); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp" || event.key === "ArrowRight") dispatch({ type: "SET_VALUE", id: control.id, value: control.value + 1 });
        if (event.key === "ArrowDown" || event.key === "ArrowLeft") dispatch({ type: "SET_VALUE", id: control.id, value: control.value - 1 });
      }}
    >
      <text x={x} y={y - radius - 13} textAnchor="middle" className="hardware-label">{compact ? `Q${control.id.slice(-1)}` : control.label.replace("Q-LINK ", "CONTROL ")}</text>
      <circle cx={x} cy={y + 3} r={radius + 3} className="knob-shadow" />
      <circle cx={x} cy={y} r={radius} className="knob-body" />
      <line x1={x} y1={y - radius * .43} x2={x} y2={y - radius * .86} className="knob-indicator" transform={`rotate(${angle} ${x} ${y})`} />
      {!compact && <><text x={x - 34} y={y + radius + 12} className="knob-min">MIN</text><text x={x + 22} y={y + radius + 12} className="knob-min">MAX</text></>}
    </g>
  );
}

export function ControllerSvg() {
  const { state, dispatch } = useControllerStore();
  const byId = (id: string) => state.controls.find((control) => control.id === id)!;
  const keys = state.controls.filter((control) => control.kind === "key");
  const pads = state.controls.filter((control) => control.kind === "pad");
  const knobs = state.controls.filter((control) => control.kind === "knob");
  const joystick = byId("joystick");
  const joystickX = (((joystick.xValue ?? 64) - 64) / 63) * JOYSTICK.range;
  const joystickY = -(((joystick.yValue ?? 64) - 64) / 63) * JOYSTICK.range;
  const whitePositions = useMemo(() => {
    let whiteIndex = 0;
    return keys.map((control) => isBlackKey(control.label) ? null : whiteIndex++);
  }, [keys]);

  const keyX = (index: number) => {
    let whiteBefore = 0;
    for (let i = 0; i < index; i++) if (!isBlackKey(keys[i].label)) whiteBefore++;
    return whiteBefore * WHITE_KEY_W - 23;
  };
  const press = (control: ControllerControl, value = 127) => dispatch({ type: "SET_VALUE", id: control.id, value, active: true });
  const release = (control: ControllerControl) => dispatch({ type: "RELEASE", id: control.id });
  const moveJoystick = (event: ReactPointerEvent<SVGGElement>) => {
    const matrix = event.currentTarget.getScreenCTM();
    const svg = event.currentTarget.ownerSVGElement;
    if (!matrix || !svg) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    let dx = local.x - JOYSTICK.x;
    let dy = local.y - JOYSTICK.y;
    const distance = Math.hypot(dx, dy);
    if (distance > JOYSTICK.range) {
      dx = (dx / distance) * JOYSTICK.range;
      dy = (dy / distance) * JOYSTICK.range;
    }
    dispatch({ type: "SET_JOYSTICK", xValue: 64 + (dx / JOYSTICK.range) * 63, yValue: 64 - (dy / JOYSTICK.range) * 63 });
  };

  return (
    <svg className="controller-svg hardware-faithful" viewBox="0 0 1220 680" role="img" aria-label="Interactive MPK Mini Play style MIDI controller">
      <defs>
        <linearGradient id="panel" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#292b2d" /><stop offset="1" stopColor="#17191a" /></linearGradient>
        <linearGradient id="pad" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#242628" /><stop offset="1" stopColor="#111314" /></linearGradient>
        <radialGradient id="redStick"><stop offset="0" stopColor="#ff3b3e" /><stop offset=".75" stopColor="#e12029" /><stop offset="1" stopColor="#9c1118" /></radialGradient>
        <pattern id="speakerHoles" width="13" height="13" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.4" fill="#050606" /><circle cx="9.5" cy="9.5" r="2.4" fill="#050606" /></pattern>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>

      <rect x="6" y="10" width="1208" height="658" rx="13" fill="url(#panel)" stroke="#404244" strokeWidth="2" />
      <path d="M13 22 Q13 12 23 12 L28 12 L28 666 L15 661 Z" fill="#cf1f2a" />
      <path d="M1207 22 Q1207 12 1197 12 L1192 12 L1192 666 L1205 661 Z" fill="#cf1f2a" />

      <g aria-label={`Joystick X ${joystick.xValue ?? 64}, Y ${joystick.yValue ?? 64}`} aria-valuetext={`X ${joystick.xValue ?? 64}, Y ${joystick.yValue ?? 64}`}
        className={`joystick-control ${joystick.active ? "is-active" : ""}`} tabIndex={0} role="slider"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); moveJoystick(event); }}
        onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveJoystick(event); }}
        onPointerUp={(event) => { event.currentTarget.releasePointerCapture(event.pointerId); dispatch({ type: "CENTER_JOYSTICK" }); }}
        onPointerCancel={() => dispatch({ type: "CENTER_JOYSTICK" })}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 16 : 6;
          if (event.key === "ArrowLeft") dispatch({ type: "SET_JOYSTICK", xValue: (joystick.xValue ?? 64) - step, yValue: joystick.yValue ?? 64 });
          if (event.key === "ArrowRight") dispatch({ type: "SET_JOYSTICK", xValue: (joystick.xValue ?? 64) + step, yValue: joystick.yValue ?? 64 });
          if (event.key === "ArrowUp") dispatch({ type: "SET_JOYSTICK", xValue: joystick.xValue ?? 64, yValue: (joystick.yValue ?? 64) + step });
          if (event.key === "ArrowDown") dispatch({ type: "SET_JOYSTICK", xValue: joystick.xValue ?? 64, yValue: (joystick.yValue ?? 64) - step });
          if (event.key === " " || event.key === "Enter") dispatch({ type: "CENTER_JOYSTICK" });
        }} onBlur={() => dispatch({ type: "CENTER_JOYSTICK" })}>
        <circle cx={JOYSTICK.x} cy={JOYSTICK.y} r="39" fill="#090a0b" stroke="#3d3f41" strokeWidth="3" />
        <circle cx={JOYSTICK.x} cy={JOYSTICK.y} r="29" fill="url(#redStick)" stroke="#ff555a" strokeWidth="2" className="joystick-stick" transform={`translate(${joystickX} ${joystickY})`} />
        <text x="88" y="137" textAnchor="middle" className="hardware-label">JOYSTICK</text>
      </g>

      <g className="arp-section">
        <text x="86" y="165" textAnchor="middle" className="hardware-label">ARPEGGIATOR</text>
        {["program-prev", "program-next", "octave-down", "octave-up", "bank-a", "bank-b"].map((id, index) => {
          const control = byId(id);
          const col = index % 2;
          const row = Math.floor(index / 2);
          const x = 34 + col * 63;
          const y = 176 + row * 43;
          const labels = ["ON / OFF", "TAP TEMPO", "OCT −", "OCT +", "FULL LEVEL", "NOTE REPEAT"];
          return <g key={id} role="button" tabIndex={0} className={`hardware-button ${control.active ? "is-active" : ""}`}
            onPointerDown={() => press(control)} onPointerUp={() => release(control)} onPointerLeave={() => release(control)}>
            <rect x={x} y={y} width="53" height="28" rx="3" className="utility-button" />
            <text x={x + 26.5} y={y + 17} textAnchor="middle" className="tiny-button-label">{labels[index]}</text>
          </g>;
        })}
      </g>

      {knobs.map((control, index) => <Knob key={control.id} control={control} {...KNOB_POSITIONS[index]} compact={index > 5} />)}

      <g className="pads-group">
        {pads.map((control, index) => {
          const x = 190 + (index % 4) * 132;
          const y = 118 + Math.floor(index / 4) * 103;
          return <g key={control.id} className={`pad-control ${control.active ? "is-active" : ""}`} role="button" tabIndex={0} aria-label={`${control.label}, MIDI note ${control.midiNumber}`}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press(control); }} onPointerUp={() => release(control)} onPointerCancel={() => release(control)}
            onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") press(control); }} onKeyUp={() => release(control)}>
            <text x={x} y={y - 7} className="pad-top-label">PAD {index + 1}</text>
            <rect x={x} y={y} width="112" height="77" rx="5" fill="url(#pad)" className="pad-rect" />
            <text x={x + 112} y={y - 7} textAnchor="end" className="pad-note-label">{control.label.replace("PAD", "NOTE")}</text>
          </g>;
        })}
      </g>

      <g className="display-module" role="button" tabIndex={0} onClick={() => dispatch({ type: "SELECT", id: "display" })}>
        <rect x="744" y="42" width="140" height="57" rx="4" className="display-shell" />
        <rect x="755" y="51" width="118" height="39" rx="2" className="display-screen" />
        <text x="814" y="67" textAnchor="middle" className="screen-logo">MPK</text>
        <text x="814" y="82" textAnchor="middle" className="screen-main">{String(byId("display").value).padStart(3, "0")} · CH 1</text>
      </g>

      <g className="center-buttons">
        {["KEYS", "DRUMS", "FAVORITES", "INTERNAL", "PAD A/B", "KNOBS A/B"].map((label, index) => {
          const x = 748 + (index % 2) * 68;
          const y = 124 + Math.floor(index / 2) * 42;
          return <g key={label}><rect x={x} y={y} width="52" height="27" rx="3" className="utility-button" /><text x={x + 26} y={y + 17} textAnchor="middle" className="tiny-button-label">{label}</text></g>;
        })}
      </g>

      <text x="944" y="197" textAnchor="middle" className="akai-logo">AKAI</text>
      <text x="944" y="212" textAnchor="middle" className="akai-sub">PROFESSIONAL</text>
      <g className="speaker" aria-label="Speaker grille">
        <circle cx="1090" cy="220" r="62" fill="#101112" stroke="#36383a" strokeWidth="3" />
        <circle cx="1090" cy="220" r="51" fill="url(#speakerHoles)" />
        <circle cx="1090" cy="220" r="6" fill="#0a0b0c" stroke="#323436" />
      </g>

      <text x="34" y="316" className="mpk-logo">MPK <tspan fontWeight="300">mini play</tspan></text>
      <text x="28" y="335" className="keyboard-functions">1/4　　 1/4T　　 1/8　　 1/8T　　 1/16　　 1/16T　　 UP　 DOWN　 EXCL　 INCL　 ORDER　 RAND　 LATCH　 ARP OCT 1　 ARP OCT 2　 ARP OCT 3　 ARP OCT 4　 SWING</text>

      <g transform="translate(30 342)">
        {keys.map((control, index) => {
          if (isBlackKey(control.label)) return null;
          const x = (whitePositions[index] ?? 0) * WHITE_KEY_W;
          return <g key={control.id} className={`piano-key white-key ${control.active ? "is-active" : ""}`} role="button" tabIndex={0} aria-label={`${control.label}, MIDI note ${control.midiNumber}`}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press(control); }} onPointerUp={() => release(control)} onPointerCancel={() => release(control)}
            onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") press(control); }} onKeyUp={() => release(control)}>
            <rect x={x} y="0" width={WHITE_KEY_W - 2} height="308" className="white-key-shape" />
            <text x={x + 38} y="292" textAnchor="middle" className="key-label">{control.label}</text>
          </g>;
        })}
        {keys.map((control, index) => {
          if (!isBlackKey(control.label)) return null;
          const x = keyX(index);
          return <g key={control.id} className={`piano-key black-key ${control.active ? "is-active" : ""}`} role="button" tabIndex={0} aria-label={`${control.label}, MIDI note ${control.midiNumber}`}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); press(control); }} onPointerUp={() => release(control)} onPointerCancel={() => release(control)}
            onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") press(control); }} onKeyUp={() => release(control)}>
            <rect x={x} y="0" width="46" height="190" rx="0 0 4 4" className="black-key-shape" />
            <text x={x + 23} y="174" textAnchor="middle" className="black-key-label">{control.label}</text>
          </g>;
        })}
      </g>
      <circle cx="1180" cy="316" r="4" fill="#d72731" filter="url(#glow)" />
    </svg>
  );
}
