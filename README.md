# Doodle Garden

A touch-first drawing and storytelling app designed for little hands on iPad.

## What it does

- Draw with a finger or Apple Pencil using big, bright crayons.
- Undo, erase, start a fresh page, or save a PNG to the device.
- Ask for a gentle tracing idea, shown as a light guide on the paper.
- After a three-second pause, offer a story beside any visible drawing.
- Play a ten-second visual story matched to recognizable subjects such as mountains, homes, flowers, people, and vehicles.
- Choose a story subject from picture buttons when the drawing is too ambiguous to recognize confidently.
- Read prompts and story lines aloud with the device's built-in speech voice.

The app uses the canvas and stroke shapes to find the child's artwork and recognize a few clear subjects locally. It does not send drawings to a recognition service. When the subject is unclear, the child can choose a picture for the story. The animation is an overlay; it never changes the original drawing.

## Run locally

Open `index.html` in a browser, or serve the published files from `dist/`:

```sh
python3 -m http.server 4173 --directory dist
```

Then visit `http://localhost:4173`.
