# Doodle Garden

A touch-first drawing and storytelling app designed for little hands on iPad.

## What it does

- Draw with a finger or Apple Pencil using big, bright crayons.
- Undo, erase, start a fresh page, or save a PNG to the device.
- Ask for a gentle tracing idea, shown as a light guide on the paper.
- After a three-second pause, offer a story beside any visible drawing.
- Play a ten-second visual story about helping and tidying, with the child's drawing as its animated main character.
- Read prompts and story lines aloud with the device's built-in speech voice.

The app uses the canvas itself to find and crop the child's artwork. It runs entirely in the browser and saves an image only when someone taps **Save art**. The animated scene is an overlay; it never changes the child's original drawing.

## Run locally

Open `index.html` in a browser, or serve the published files from `dist/`:

```sh
python3 -m http.server 4173 --directory dist
```

Then visit `http://localhost:4173`.
