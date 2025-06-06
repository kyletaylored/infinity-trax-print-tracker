# Infinity Trax Print Planner

A simple React web app to plan and track 3D printing of Infinity Trax modular marble run parts, with kit presets and checklist/CSV export.

## Features

- Select parts and specify quantities to print
- Optionally load part kits (e.g., Turing Edition, Newton Edition)
- Visual part cards, list, and a dynamic checklist
- CSV export for 3D print planning
- Debug JSON viewer for parts and kits

## Usage

1. **Install dependencies:**

```

npm install

```

2. **Start the app:**

```

npm run dev

```

3. **Open** `http://localhost:5173` in your browser.

4. **Add or adjust your part and kit JSON files** in `/src/data/parts-list.json` and `/src/data/kits.json`.

## File Structure

- `src/components/PrintPlanner.jsx` — Main planner UI
- `src/data/parts-list.json` — Parts data
- `src/data/kits.json` — Kit presets

---

Requires Node.js and npm.  
Built with React and Chakra UI.
