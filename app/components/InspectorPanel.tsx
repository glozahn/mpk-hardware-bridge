"use client";

import { useRef, useState } from "react";
import { getControl } from "../lib/controller-data";
import { useControllerStore } from "../store/controller-store";

export function InspectorPanel() {
  const { state, dispatch, requestMidi, saveMapping, loadMapping } = useControllerStore();
  const control = getControl(state.controls, state.selectedId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const statusLabel = {
    idle: "Not connected",
    ready: state.midiDevices.length ? "Device available" : "No devices found",
    connected: "Listening",
    unsupported: "Browser unsupported",
    denied: "Access denied",
  }[state.midiStatus];

  return (
    <aside className="inspector">
      <div className="inspector-head">
        <div>
          <p className="eyebrow">CONTROL INSPECTOR</p>
          <h2>{control?.label ?? "No control"}</h2>
        </div>
        <span className={`status-dot status-${state.midiStatus}`} aria-label={statusLabel} />
      </div>

      <section className="info-card">
        <div className="value-readout">
          <span>VALUE</span>
          <strong>{String(control?.value ?? 0).padStart(3, "0")}</strong>
        </div>
        <input
          aria-label="Selected control value"
          type="range"
          min="0"
          max="127"
          value={control?.value ?? 0}
          disabled={!control || control.midiType === "system"}
          onChange={(event) => control && dispatch({ type: "SET_VALUE", id: control.id, value: Number(event.target.value) })}
          onPointerUp={() => control && dispatch({ type: "RELEASE", id: control.id })}
        />
      </section>

      <dl className="properties">
        <div><dt>Control ID</dt><dd>{control?.id ?? "—"}</dd></div>
        <div><dt>Message</dt><dd>{control?.midiType.toUpperCase() ?? "—"}</dd></div>
        <div><dt>{control?.midiType === "cc" ? "CC number" : "MIDI note"}</dt><dd>{control?.midiNumber ?? "—"}</dd></div>
        <div><dt>MIDI channel</dt><dd>{control?.channel ?? "—"}</dd></div>
      </dl>

      <section className="midi-section">
        <div className="section-heading"><span>MIDI INPUT</span><small>{statusLabel}</small></div>
        {state.midiStatus === "idle" || state.midiStatus === "denied" ? (
          <button className="primary-button" onClick={requestMidi}>Enable Web MIDI</button>
        ) : (
          <select
            aria-label="MIDI input device"
            value={state.selectedMidiId}
            onChange={(event) => dispatch({ type: "SELECT_MIDI", id: event.target.value })}
            disabled={state.midiStatus === "unsupported"}
          >
            <option value="">Select a device</option>
            {state.midiDevices.map((device) => <option value={device.id} key={device.id}>{device.name}</option>)}
          </select>
        )}
        <p className="midi-message">{state.lastMessage}</p>
      </section>

      <section className="mapping-section">
        <div className="section-heading"><span>MAPPING</span><small>{state.controls.length} controls</small></div>
        <div className="mapping-actions">
          <button onClick={saveMapping}>Save JSON</button>
          <button onClick={() => fileRef.current?.click()}>Load JSON</button>
          <button className="icon-button" aria-label="Reset mapping" title="Reset mapping" onClick={() => dispatch({ type: "RESET" })}>↺</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try { await loadMapping(file); setNotice("Mapping loaded"); }
            catch { setNotice("Could not read mapping"); }
            event.target.value = "";
          }}
        />
        {notice && <p className="file-notice">{notice}</p>}
      </section>

      <footer className="inspector-footer"><span>WEB MIDI</span><span>v1.0</span></footer>
    </aside>
  );
}
