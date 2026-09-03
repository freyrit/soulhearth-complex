# SOULHEARTH — LATTICE 0.1

The existing `index.html` remains the primary application entry point. LATTICE's Overview 3D space is implemented with Babylon.js and is compatible with Vite's static serving/build pipeline.

## Run

```bash
npm install
npm run dev
```

Babylon.js is loaded in `index.html` from the Babylon CDN so the existing single-file Soulhearth implementation remains intact.

## LATTICE 0.1

Overview now contains a Babylon.js 3D space with typed canonical entities, spatial placements, Tethers, creation, movement, selection/inspection, deletion/reference cleanup, seeded data, and localStorage persistence.
