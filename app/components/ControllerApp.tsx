"use client";

import { ControllerSvg } from "./ControllerSvg";
import { InspectorPanel } from "./InspectorPanel";
import { ControllerStoreProvider } from "../store/controller-store";

export function ControllerApp() {
  return (
    <ControllerStoreProvider>
      <main className="app-shell">
        <header className="topbar">
          <div className="wordmark"><span className="wordmark-icon">M</span><span>MIDILAB</span><small>CONTROL SURFACE</small></div>
          <div className="topbar-meta"><span className="live-pill"><i /> LOCAL SESSION</span><span>25 KEYS · 8 PADS · 4 KNOBS · 2 DIALS</span></div>
        </header>
        <div className="workspace">
          <section className="stage" aria-label="MIDI controller surface">
            <div className="stage-heading">
              <div><p className="eyebrow">VIRTUAL INSTRUMENT</p><h1>Mini Play / MK3</h1></div>
              <p>Click, drag, or connect a MIDI device</p>
            </div>
            <div className="controller-wrap"><ControllerSvg /></div>
            <div className="stage-foot"><span><kbd>CLICK</kbd> Trigger notes</span><span><kbd>DRAG</kbd> Adjust knobs</span><span><kbd>MIDI</kbd> Hardware sync</span></div>
          </section>
          <InspectorPanel />
        </div>
      </main>
    </ControllerStoreProvider>
  );
}
