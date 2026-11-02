(() => {
  const canvas = document.getElementById('drawing-canvas');
  const paper = document.getElementById('paper');
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  const emptyMessage = document.getElementById('canvas-empty');
  const undoButton = document.getElementById('undo-button');
  const eraserButton = document.getElementById('eraser-button');
  const clearButton = document.getElementById('clear-button');
  const saveButton = document.getElementById('save-button');
  const ideaOverlay = document.getElementById('idea-overlay');
  const ideaCaption = document.getElementById('idea-caption');
  const toast = document.getElementById('toast');
  const dialog = document.getElementById('story-dialog');
  const storyChoices = document.getElementById('story-choices');
  const storyResult = document.getElementById('story-result');
  const storyText = document.getElementById('story-text');

  let color = '#f47758';
  let erasing = false;
  let activeStroke = null;
  let strokes = [];
  let undoStack = [];
  let ideaIndex = -1;
  let toastTimer = 0;
  let currentStory = '';

  const ideas = [
    {
      caption: 'Can you add a rainbow? Follow the dots, or make your own!',
      art: '<svg viewBox="0 0 180 150" fill="none"><path d="M25 128c0-48 29-86 65-86s65 38 65 86" stroke="#F29B74" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 10"/><path d="M42 128c0-35 21-63 48-63s48 28 48 63" stroke="#EBC85D" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 10"/><path d="M59 128c0-23 14-42 31-42s31 19 31 42" stroke="#81B99A" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 10"/><path d="M23 129h22m90 0h22" stroke="#B7A8DE" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 10"/><circle cx="37" cy="39" r="5" fill="#F2C55F"/><circle cx="145" cy="30" r="4" fill="#DDA0B2"/><path d="m126 31 2 7m-2-7-7 2m7-2 1-7" stroke="#88A5D4" stroke-width="3" stroke-linecap="round"/></svg>'
    },
    {
      caption: 'Could a flower grow here? Add petals any way you like!',
      art: '<svg viewBox="0 0 180 150" fill="none"><path d="M91 82c-1 20-2 33 0 52m0-26c-11-13-24-13-31-7 3 13 16 18 31 14m0-5c12-13 25-12 32-6-3 13-17 18-32 13" stroke="#6FA183" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 8"/><path d="M90 61c-11-2-13-17-3-20-8-10 3-20 12-12 7-12 22-6 19 5 13 1 12 17 2 20 3 12-11 18-19 11-8 10-22 6-20-4-10-2-11-16-1-20" fill="#F7D579" fill-opacity=".27" stroke="#E6AD57" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 8"/><circle cx="93" cy="51" r="4" fill="#F1A27C"/></svg>'
    },
    {
      caption: 'Let’s make a starry sky. Add a twinkle or two!',
      art: '<svg viewBox="0 0 180 150" fill="none"><path d="m52 41 6 13 14 1-11 9 4 14-13-8-12 8 4-14-11-9 14-1 5-13Z" stroke="#D4A64F" stroke-width="4" stroke-linejoin="round" stroke-dasharray="2 7"/><path d="m119 25 4 9 10 1-8 6 3 10-9-6-9 6 3-10-8-6 10-1 4-9Z" stroke="#8C9ED0" stroke-width="4" stroke-linejoin="round" stroke-dasharray="2 7"/><path d="m121 83 4 8 9 1-7 6 2 9-8-5-8 5 3-9-8-6 9-1 4-8Z" stroke="#D38FA9" stroke-width="4" stroke-linejoin="round" stroke-dasharray="2 7"/><circle cx="70" cy="105" r="3" fill="#E9C45D"/><circle cx="40" cy="96" r="2.5" fill="#9DB59B"/><circle cx="146" cy="63" r="3" fill="#E6A47C"/></svg>'
    }
  ];

  const stories = {
    sleepy: [
      'One cozy night, your doodle found a tiny moonbeam. The moonbeam tucked it in with a soft, silver yawn. Together they wished goodnight to every star, then dreamed of a brand-new day.',
      'When the sky turned lavender, your doodle curled up on a cloud. A friendly little star sang a lullaby, and the whole sky glowed gently until morning.'
    ],
    friend: [
      'One bright morning, your doodle met a tiny new friend. They shared a giggle, a snack, and the very best secret: kindness makes every garden grow.',
      'Your doodle heard a little “hello!” from behind a flower. A new friend popped out, and soon they were laughing, dancing, and sharing their favorite colors.'
    ],
    adventure: [
      'Your doodle packed a little bag and set off beyond the cloud hills. A friendly star showed the way, and every new place brought a kind surprise. Home was waiting with a big, warm welcome.',
      'With one brave step, your doodle sailed across a sea of soft blue. It found a quiet island full of singing shells, then sailed back to share the song with everyone.'
    ]
  };

  const tinyWonders = [
    'The Sun is a star! It looks big because it is much closer to us than the other stars.',
    'Bees do a little waggle dance to show their friends where the flowers are.',
    'A rainbow is made when sunlight shines through tiny drops of water in the sky.',
    'Some flowers turn their faces toward the sunny sky as they grow.'
  ];

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2300);
  }

  function cloneStrokes(source = strokes) {
    return source.map((stroke) => ({
      color: stroke.color,
      size: stroke.size,
      erase: stroke.erase,
      points: stroke.points.map((point) => ({ x: point.x, y: point.y }))
    }));
  }

  function remember() {
    undoStack.push(cloneStrokes());
    if (undoStack.length > 28) undoStack.shift();
    updateUndoButton();
  }

  function updateUndoButton() {
    undoButton.disabled = undoStack.length === 0;
  }

  function fitCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function redraw() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const stroke of strokes) drawStroke(stroke, rect.width, rect.height);
    emptyMessage.classList.toggle('is-hidden', strokes.length > 0);
    canvas.setAttribute('aria-label', strokes.length ? 'Your drawing paper. Keep drawing with your finger or Apple Pencil.' : 'Blank drawing paper. Draw here with your finger or Apple Pencil.');
    if (activeStroke && activeStroke.points.length > 0) drawStroke(activeStroke, rect.width, rect.height);
  }

  function drawStroke(stroke, width, height) {
    if (!stroke.points.length) return;
    const first = stroke.points[0];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.size;
    ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    if (stroke.points.length === 1) {
      ctx.beginPath();
      ctx.arc(first.x * width, first.y * height, stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(first.x * width, first.y * height);
      for (let i = 1; i < stroke.points.length; i += 1) {
        const point = stroke.points[i];
        ctx.lineTo(point.x * width, point.y * height);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    };
  }

  function startStroke(event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    remember();
    activeStroke = { color, size: erasing ? 28 : 11, erase: erasing, points: [pointFromEvent(event)] };
    redraw();
  }

  function moveStroke(event) {
    if (!activeStroke) return;
    event.preventDefault();
    activeStroke.points.push(pointFromEvent(event));
    redraw();
  }

  function endStroke() {
    if (!activeStroke) return;
    strokes.push(activeStroke);
    activeStroke = null;
    redraw();
    updateUndoButton();
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      showToast('This device cannot read aloud, but you can still make up the words!');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.84;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }

  function hideIdea() {
    ideaOverlay.innerHTML = '';
    ideaCaption.textContent = '';
    ideaCaption.classList.remove('is-visible');
  }

  function showIdea() {
    ideaIndex = (ideaIndex + 1) % ideas.length;
    const idea = ideas[ideaIndex];
    ideaOverlay.innerHTML = idea.art;
    ideaCaption.textContent = idea.caption;
    ideaCaption.classList.add('is-visible');
    speak(idea.caption);
    showToast('A little idea is waiting on your paper.');
  }

  function saveDrawing() {
    if (!strokes.length) {
      showToast('Make a little mark first, then save your art!');
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const exportCanvas = document.createElement('canvas');
    const scale = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    exportCanvas.width = Math.round(rect.width * scale);
    exportCanvas.height = Math.round(rect.height * scale);
    const exportContext = exportCanvas.getContext('2d');
    exportContext.fillStyle = '#fffefa';
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportContext.scale(scale, scale);
    for (const stroke of strokes) {
      // Render to the export surface with CSS pixel coordinates.
      const points = stroke.points;
      const width = rect.width;
      const height = rect.height;
      exportContext.save();
      exportContext.lineCap = 'round';
      exportContext.lineJoin = 'round';
      exportContext.lineWidth = stroke.size;
      // The paper is opaque, so an eraser restores the paper color in the PNG.
      exportContext.globalCompositeOperation = 'source-over';
      exportContext.strokeStyle = stroke.erase ? '#fffefa' : stroke.color;
      exportContext.fillStyle = stroke.erase ? '#fffefa' : stroke.color;
      if (points.length === 1) {
        exportContext.beginPath();
        exportContext.arc(points[0].x * width, points[0].y * height, stroke.size / 2, 0, Math.PI * 2);
        exportContext.fill();
      } else {
        exportContext.beginPath();
        exportContext.moveTo(points[0].x * width, points[0].y * height);
        for (let i = 1; i < points.length; i += 1) exportContext.lineTo(points[i].x * width, points[i].y * height);
        exportContext.stroke();
      }
      exportContext.restore();
    }
    exportCanvas.toBlob((blob) => {
      if (!blob) {
        showToast('Let’s try saving that one again.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-doodle-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
      showToast('Your drawing is ready to keep!');
    }, 'image/png');
  }

  function openStory() {
    currentStory = '';
    storyChoices.hidden = false;
    storyResult.hidden = true;
    document.getElementById('story-dialog-title').textContent = 'What do you see in your doodle?';
    document.querySelector('.dialog-subtitle').textContent = strokes.length
      ? 'Pick a story feeling or a tiny wonder. Your drawing can be anything you say!'
      : 'Start with a mark, or dream up what this page could become!';
    dialog.showModal();
  }

  function makeStory(kind) {
    const options = stories[kind];
    currentStory = options[Math.floor(Math.random() * options.length)];
    document.getElementById('story-dialog-title').textContent = 'A little story for your doodle';
    document.querySelector('.dialog-subtitle').textContent = 'You chose the feeling. Your imagination made the magic.';
    storyText.textContent = currentStory;
    storyChoices.hidden = true;
    storyResult.hidden = false;
    speak(currentStory);
  }

  function makeFact() {
    currentStory = tinyWonders[Math.floor(Math.random() * tinyWonders.length)];
    document.getElementById('story-dialog-title').textContent = 'A tiny wonder for you';
    document.querySelector('.dialog-subtitle').textContent = 'Little things in our world can be full of magic.';
    storyText.textContent = currentStory;
    storyChoices.hidden = true;
    storyResult.hidden = false;
    speak(currentStory);
  }

  canvas.addEventListener('pointerdown', startStroke);
  canvas.addEventListener('pointermove', moveStroke);
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('lostpointercapture', endStroke);

  document.querySelectorAll('.color-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      color = swatch.dataset.color;
      erasing = false;
      eraserButton.setAttribute('aria-pressed', 'false');
      document.querySelectorAll('.color-swatch').forEach((button) => {
        const selected = button === swatch;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
    });
  });

  eraserButton.addEventListener('click', () => {
    erasing = !erasing;
    eraserButton.setAttribute('aria-pressed', String(erasing));
    if (erasing) showToast('Eraser ready — rub away a little bit.');
  });

  undoButton.addEventListener('click', () => {
    if (!undoStack.length) return;
    strokes = undoStack.pop();
    redraw();
    updateUndoButton();
    showToast('One step back.');
  });

  clearButton.addEventListener('click', () => {
    if (!strokes.length) {
      showToast('Your paper is already fresh and ready!');
      return;
    }
    remember();
    strokes = [];
    hideIdea();
    redraw();
    showToast('Fresh page! Tap undo if you want it back.');
  });

  saveButton.addEventListener('click', saveDrawing);
  document.getElementById('idea-button').addEventListener('click', showIdea);
  document.getElementById('story-button').addEventListener('click', openStory);
  document.getElementById('read-prompt').addEventListener('click', () => speak('Hello, little artist. What will your doodle become? Every wiggly line has a little bit of wonder in it. Touch the paper and make a mark.'));
  document.getElementById('dialog-close').addEventListener('click', () => dialog.close());
  document.getElementById('again-story').addEventListener('click', () => {
    storyChoices.hidden = false;
    storyResult.hidden = true;
    document.getElementById('story-dialog-title').textContent = 'What do you see in your doodle?';
    document.querySelector('.dialog-subtitle').textContent = 'Pick a little story feeling. Your drawing can be anything you say!';
  });
  document.getElementById('listen-story').addEventListener('click', () => speak(currentStory));
  storyChoices.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-story]');
    if (!choice) return;
    if (choice.dataset.story === 'fact') makeFact();
    else makeStory(choice.dataset.story);
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(fitCanvas).observe(paper);
  } else {
    window.addEventListener('resize', fitCanvas);
  }
  fitCanvas();
  updateUndoButton();
})();
