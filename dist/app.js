(() => {
  const canvas = document.getElementById('drawing-canvas');
  const paper = document.getElementById('paper');
  const ctx = canvas.getContext('2d');
  const emptyMessage = document.getElementById('canvas-empty');
  const undoButton = document.getElementById('undo-button');
  const eraserButton = document.getElementById('eraser-button');
  const clearButton = document.getElementById('clear-button');
  const saveButton = document.getElementById('save-button');
  const ideaOverlay = document.getElementById('idea-overlay');
  const ideaCaption = document.getElementById('idea-caption');
  const toast = document.getElementById('toast');
  const storyInvitation = document.getElementById('story-invitation');
  const storyScene = document.getElementById('story-scene');
  const childStoryArt = document.getElementById('child-story-art');
  const sceneCaption = document.getElementById('scene-caption');
  const sceneProgress = document.getElementById('scene-progress-fill');

  let color = '#f47758';
  let erasing = false;
  let activeStroke = null;
  let strokes = [];
  let undoStack = [];
  let ideaIndex = -1;
  let toastTimer = 0;
  let idleTimer = 0;
  let sceneTimers = [];
  let currentArtwork = null;
  let promptedSignature = '';
  let storyActive = false;

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

  function renderStroke(target, stroke, width, height) {
    if (!stroke.points.length) return;
    const first = stroke.points[0];
    target.save();
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.lineWidth = stroke.size;
    target.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
    target.strokeStyle = stroke.color;
    target.fillStyle = stroke.color;
    if (stroke.points.length === 1) {
      target.beginPath();
      target.arc(first.x * width, first.y * height, stroke.size / 2, 0, Math.PI * 2);
      target.fill();
    } else {
      target.beginPath();
      target.moveTo(first.x * width, first.y * height);
      for (let i = 1; i < stroke.points.length; i += 1) {
        const point = stroke.points[i];
        target.lineTo(point.x * width, point.y * height);
      }
      target.stroke();
    }
    target.restore();
  }

  function drawStroke(stroke, width, height) {
    renderStroke(ctx, stroke, width, height);
  }

  function fitCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
    if (!storyInvitation.hidden && currentArtwork) positionStoryInvitation(currentArtwork);
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

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    };
  }

  function cancelStoryPrompt() {
    window.clearTimeout(idleTimer);
    storyInvitation.hidden = true;
  }

  function startStroke(event) {
    if (storyActive || (event.button !== undefined && event.button !== 0)) return;
    event.preventDefault();
    cancelStoryPrompt();
    promptedSignature = '';
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
    scheduleStoryPrompt();
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
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
    if (storyActive) return;
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
    const scale = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = Math.round(rect.width * scale);
    exportCanvas.height = Math.round(rect.height * scale);
    const exportContext = exportCanvas.getContext('2d');
    exportContext.fillStyle = '#fffefa';
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportContext.scale(scale, scale);
    for (const stroke of strokes) {
      const copy = { ...stroke, erase: false, color: stroke.erase ? '#fffefa' : stroke.color };
      renderStroke(exportContext, copy, rect.width, rect.height);
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

  function findArtwork() {
    if (strokes.length === 0 || canvas.width === 0 || canvas.height === 0) return null;
    const rect = canvas.getBoundingClientRect();
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const width = canvas.width;
    const height = canvas.height;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (pixels[(y * width + x) * 4 + 3] > 24) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (maxX < 0) return null;
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const bounds = {
      left: Math.max(0, minX / scaleX - 12),
      top: Math.max(0, minY / scaleY - 12),
      right: Math.min(rect.width, (maxX + 1) / scaleX + 12),
      bottom: Math.min(rect.height, (maxY + 1) / scaleY + 12)
    };
    const pointCount = strokes.reduce((total, stroke) => total + stroke.points.length, 0);
    const signature = [strokes.length, pointCount, Math.round(bounds.left / 8), Math.round(bounds.top / 8), Math.round(bounds.right / 8), Math.round(bounds.bottom / 8)].join(':');
    return { bounds, signature };
  }

  function positionStoryInvitation(artwork) {
    storyInvitation.hidden = false;
    const paperRect = paper.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const width = storyInvitation.offsetWidth;
    const height = storyInvitation.offsetHeight;
    const drawLeft = canvasRect.left - paperRect.left + artwork.bounds.left;
    const drawTop = canvasRect.top - paperRect.top + artwork.bounds.top;
    const drawRight = canvasRect.left - paperRect.left + artwork.bounds.right;
    const drawBottom = canvasRect.top - paperRect.top + artwork.bounds.bottom;
    const gap = 12;
    let left = drawRight + gap;
    if (left + width > paper.clientWidth - 10) left = drawLeft - width - gap;
    left = Math.max(10, Math.min(left, paper.clientWidth - width - 10));
    let top = (drawTop + drawBottom) / 2 - height / 2;
    top = Math.max(10, Math.min(top, paper.clientHeight - height - 10));
    storyInvitation.style.left = left + 'px';
    storyInvitation.style.top = top + 'px';
  }

  function scheduleStoryPrompt() {
    window.clearTimeout(idleTimer);
    if (storyActive || strokes.length === 0) return;
    idleTimer = window.setTimeout(() => {
      const artwork = findArtwork();
      if (!artwork || artwork.signature === promptedSignature) return;
      currentArtwork = artwork;
      promptedSignature = artwork.signature;
      positionStoryInvitation(artwork);
      speak('A little story is ready. Would you like to hear it or keep drawing?');
    }, 3000);
  }

  function cropDrawing(artwork) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const sourceX = Math.max(0, Math.floor(artwork.bounds.left * scaleX));
    const sourceY = Math.max(0, Math.floor(artwork.bounds.top * scaleY));
    const sourceWidth = Math.max(1, Math.min(canvas.width - sourceX, Math.ceil((artwork.bounds.right - artwork.bounds.left) * scaleX)));
    const sourceHeight = Math.max(1, Math.min(canvas.height - sourceY, Math.ceil((artwork.bounds.bottom - artwork.bounds.top) * scaleY)));
    const outputScale = 2;
    const cropped = document.createElement('canvas');
    cropped.width = Math.max(1, Math.round(sourceWidth / scaleX * outputScale));
    cropped.height = Math.max(1, Math.round(sourceHeight / scaleY * outputScale));
    const cropContext = cropped.getContext('2d');
    cropContext.drawImage(canvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, cropped.width, cropped.height);
    return cropped.toDataURL('image/png');
  }

  function clearSceneTimers() {
    sceneTimers.forEach((timer) => window.clearTimeout(timer));
    sceneTimers = [];
  }

  function finishStory() {
    if (!storyActive) return;
    storyActive = false;
    clearSceneTimers();
    storyScene.hidden = true;
    storyScene.classList.remove('is-tidying', 'is-finished');
    childStoryArt.removeAttribute('src');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    currentArtwork = null;
    showToast('Back to your drawing!');
  }

  function playStory() {
    if (!currentArtwork || storyActive) return;
    window.clearTimeout(idleTimer);
    storyInvitation.hidden = true;
    hideIdea();
    storyActive = true;
    promptedSignature = currentArtwork.signature;
    childStoryArt.src = cropDrawing(currentArtwork);
    storyScene.classList.remove('is-tidying', 'is-finished');
    sceneCaption.textContent = 'A kind little helper sees toys waiting to be put away.';
    sceneProgress.style.animation = 'none';
    void sceneProgress.offsetWidth;
    sceneProgress.style.animation = '';
    storyScene.hidden = false;
    speak('A little friend sees toys waiting to be put away. Together, they put them in a basket and give the floor a gentle sweep. All tidy. Now there is room to play!');

    sceneTimers.push(window.setTimeout(() => {
      storyScene.classList.add('is-tidying');
      sceneCaption.textContent = 'Together, the toys go in their basket and the floor gets a gentle sweep.';
    }, 2600));
    sceneTimers.push(window.setTimeout(() => {
      storyScene.classList.add('is-finished');
      sceneCaption.textContent = 'All tidy! Now everyone has room to play.';
    }, 6500));
    sceneTimers.push(window.setTimeout(finishStory, 10000));
  }

  function hideStoryInvitation() {
    if (!storyInvitation.hidden && currentArtwork) promptedSignature = currentArtwork.signature;
    storyInvitation.hidden = true;
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
    cancelStoryPrompt();
    strokes = undoStack.pop();
    currentArtwork = null;
    redraw();
    updateUndoButton();
    showToast('One step back.');
    scheduleStoryPrompt();
  });

  clearButton.addEventListener('click', () => {
    if (!strokes.length) {
      showToast('Your paper is already fresh and ready!');
      return;
    }
    cancelStoryPrompt();
    remember();
    strokes = [];
    currentArtwork = null;
    promptedSignature = '';
    hideIdea();
    redraw();
    showToast('Fresh page! Tap undo if you want it back.');
  });

  saveButton.addEventListener('click', saveDrawing);
  document.getElementById('idea-button').addEventListener('click', showIdea);
  document.getElementById('read-prompt').addEventListener('click', () => speak('Draw anything you like. When you pause, a little story will appear by your drawing. You can hear it or keep drawing.'));
  document.getElementById('read-story-flow').addEventListener('click', () => speak('After you make a drawing, pause for a moment. A story invitation will appear beside your art. Tap hear a story, or keep drawing.'));
  document.getElementById('story-button').addEventListener('click', playStory);
  document.getElementById('continue-drawing').addEventListener('click', hideStoryInvitation);
  document.getElementById('scene-close').addEventListener('click', finishStory);

  if ('ResizeObserver' in window) {
    new ResizeObserver(fitCanvas).observe(paper);
  } else {
    window.addEventListener('resize', fitCanvas);
  }
  fitCanvas();
  updateUndoButton();
})();
