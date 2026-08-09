# MIDILAB Virtual Controller

A desktop-style React + TypeScript MIDI controller built on Vite/vinext. The top-down SVG surface includes 25 mini keys, eight drum pads, eight Q-Link knobs, a joystick, display, and utility buttons.

## Features

- Every control has a stable ID, mapping, value, active state, and MIDI channel.
- Keys and pads respond to pointer and keyboard input.
- Knobs support vertical mouse/touch drag and arrow keys.
- The inspector shows the selected control's note/CC, channel, label, and value.
- Web MIDI device discovery and live Note On, Note Off, and CC handling.
- JSON mapping export, validated import, and default reset.
- Responsive dark hardware-inspired interface.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal (normally `http://localhost:3000`). Use Chrome or another browser with Web MIDI support if you want to connect hardware, then select **Enable Web MIDI** in the inspector.

## Build

```bash
npm run build
```

## Project structure

```text
app/
├── components/
│   ├── ControllerApp.tsx       # Application layout
│   ├── ControllerSvg.tsx       # Interactive SVG hardware surface
│   └── InspectorPanel.tsx      # Selection, MIDI, and mapping controls
├── lib/
│   └── controller-data.ts      # Types and mock default mappings
├── store/
│   └── controller-store.tsx    # Central reducer, Web MIDI, JSON I/O
├── globals.css                 # Responsive visual system
├── layout.tsx                  # Metadata and app shell
└── page.tsx                    # Route entry point
```

## Default MIDI mapping

- Keys: notes 48–72 on channel 1
- Pads: notes 36–43 on channel 10
- Knobs: CC 20–27 on channel 1
- Joystick: CC 1 on channel 1
- Octave/program/bank buttons: CC 110–115 on channel 1

Web MIDI requires permission and a secure context when the app is not running on localhost.
