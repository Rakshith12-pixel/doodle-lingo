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
  const invitationTitle = document.getElementById('invitation-title');
  const subjectPicker = document.getElementById('subject-picker');
  const storyScene = document.getElementById('story-scene');
  const childStoryArt = document.getElementById('child-story-art');
  const sceneCaption = document.getElementById('scene-caption');
  const sceneStoryVisual = document.getElementById('scene-story-visual');
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
  let pickerWasOpenedFromPrompt = false;

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
    mountain: {
      label: 'mountain',
      title: 'A Kind Mountain Climb',
      opening: 'One careful step, then another, helps the climber reach the mountain top.',
      middle: 'A little bird needs help finding its nest.',
      ending: 'They help gently and leave every tiny flower safe.',
      narration: 'One careful step, then another, helps the climber reach the mountain top. A little bird needs help. They help gently and leave every tiny flower safe.',
      visual: '<svg viewBox="0 0 360 150" fill="none" aria-hidden="true"><path class="visual-trail" d="M22 128c48 0 47-53 91-53 33 0 28-39 74-39 33 0 42 62 83 62 22 0 38-19 66-19"/><path class="visual-flag" d="M198 16v38m0-37 35 9-35 10"/><path class="visual-bird" d="M270 38c11-10 19-10 28 0-10 0-17 3-23 10m8-10 7-8"/></svg>'
    },
    home: {
      label: 'home',
      title: 'A Tidy Little Home',
      opening: 'The little house has toys waiting outside.',
      middle: 'Friends put each toy in its basket, one by one.',
      ending: 'Now their home is tidy and ready for play.',
      narration: 'The little house has toys waiting outside. Friends put each toy in its basket, one by one. Now their home is tidy and ready for play.',
      visual: '<svg viewBox="0 0 360 150" fill="none" aria-hidden="true"><path class="visual-basket" d="M131 73h91l-9 57h-73l-9-57Zm-7 0h105M147 84v33m27-33v33m27-33v33"/><path class="visual-block" d="M157 58h21v20h-21zM191 51h18v27h-18z"/><path class="visual-spark" d="m275 42 4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z"/></svg>'
    },
    flower: {
      label: 'flower',
      title: 'The Thirsty Flower',
      opening: 'A little flower looks thirsty in the warm sun.',
      middle: 'A gardener gives it just a sip of water.',
      ending: 'Soon a butterfly visits. We care for plants gently.',
      narration: 'A little flower looks thirsty in the warm sun. A gardener gives it just a sip of water. Soon a butterfly visits. We care for plants gently.',
      visual: '<svg viewBox="0 0 360 150" fill="none" aria-hidden="true"><path class="visual-stem" d="M177 124V72m0 31c-17-18-32-13-41-9 8 20 24 22 41 16m0-16c15-17 29-14 39-9-8 19-23 22-39 16"/><path class="visual-flower" d="M177 64c-18 1-21-15-9-23-8-17 9-26 18-13 13-14 29-2 21 12 16 10 7 26-9 24-5 17-22 18-27 0-16 5-25-9-15-20Z"/><path class="visual-drop" d="M248 54c0 9-14 9-14 0 0-6 7-15 7-15s7 9 7 15Z"/><path class="visual-butterfly" d="M277 81c-14-23-31-7-15 5-16 12 1 27 15 5 14 22 31 7 15-5 16-12-1-28-15-5Z"/></svg>'
    },
    animal: {
      label: 'animal',
      title: 'A Gentle Helping Paw',
      opening: 'A little puppy feels thirsty after exploring.',
      middle: 'A friend sets out fresh water and waits quietly.',
      ending: 'Gentle care means giving every animal space.',
      narration: 'A little puppy feels thirsty after exploring. A friend sets out fresh water and waits quietly. Gentle care means giving every animal space.',
      visual: '<svg viewBox="0 0 360 150" fill="none" aria-hidden="true"><path class="visual-bowl" d="M125 96h74l-10 29h-54l-10-29Zm-5 0h84"/><ellipse class="visual-puppy" cx="270" cy="100" rx="30" ry="19"/><circle class="visual-puppy" cx="250" cy="77" r="20"/><path class="visual-puppy-ear" d="M239 63c-17-20-25 2-13 17m36-17c17-20 25 2 13 17"/><circle class="visual-puppy-eye" cx="245" cy="77" r="2"/><circle class="visual-puppy-eye" cx="258" cy="77" r="2"/><ellipse class="visual-puppy-nose" cx="252" cy="84" rx="4" ry="3"/><path class="visual-heart" d="M171 53c-15-14-31 5 0 27 31-22 15-41 0-27Z"/><path class="visual-paw" d="M315 65c-9 0-10-13-3-15 7-2 11 8 8 12 7-8 17-4 15 4-2 7-11 6-14 3 4 9-4 15-11 10-5-4-1-11 5-14Z"/></svg>'
    },
    vehicle: {
      label: 'vehicle',
      title: 'A Safe Little Ride',
      opening: 'The little bike rolls up to a crossing.',
      middle: 'The rider stops, looks both ways, and waits for a grown-up.',
      ending: 'Safe choices help everyone enjoy the ride.',
      narration: 'The little bike rolls up to a crossing. The rider stops, looks both ways, and waits for a grown-up. Safe choices help everyone enjoy the ride.',
      visual: '<svg viewBox="0 0 360 150" fill="none" aria-hidden="true"><path class="visual-road" d="M18 114h324"/><path class="visual-crossing" d="M184 91h18v24h-18zm29 0h18v24h-18zm29 0h18v24h-18z"/><circle class="visual-wheel" cx="75" cy="102" r="20"/><circle class="visual-wheel" cx="142" cy="102" r="20"/><path class="visual-bike" d="m75 102 24-39 22 39H75l16-26h21l17 26m-33-39h-9m36-1h13m-4 1 10 13"/><path class="visual-sign" d="M310 37v83m-2-78h35v34h-35"/><path class="visual-spark" d="m274 38 4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z"/></svg>'
    },
    friend: {
      label: 'friend',
      title: 'Bubbly Clean Hands',
      opening: 'A little friend has been playing outside.',
      middle: 'They wash hands with soap before snack time.',
      ending: 'Pop, pop, pop! Clean hands are ready.',
      narration: 'A little friend has been playing outside. They wash hands with soap before snack time. Pop, pop, pop! Clean hands are ready.',
      visual: '<svg viewBox="0 0 360 150" fill="none" aria-hidden="true"><path class="visual-sink" d="M117 74h124v18h-18v34h-87V92h-19V74Zm39-1V48c0-17 15-25 33-18m-20 3c0-10 8-17 20-17h29v17h-29"/><circle class="visual-bubble" cx="275" cy="62" r="12"/><circle class="visual-bubble" cx="304" cy="91" r="8"/><circle class="visual-bubble" cx="267" cy="111" r="6"/><path class="visual-spark" d="m302 36 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/></svg>'
    },
    sky: {
      label: 'sky',
      title: 'A Rainbow for Everyone',
      opening: 'A soft cloud shares a little rain with the flowers.',
      middle: 'The sun peeks out and paints a rainbow.',
      ending: 'Its bright colors are lovely to share.',
      narration: 'A soft cloud shares a little rain with the flowers. The sun peeks out and paints a rainbow. Its bright colors are lovely to share.',
      visual: '<svg viewBox="0 0 360 150" fill="none" aria-hidden="true"><path class="visual-rainbow rainbow-one" d="M102 127a78 78 0 0 1 156 0"/><path class="visual-rainbow rainbow-two" d="M119 127a61 61 0 0 1 122 0"/><path class="visual-rainbow rainbow-three" d="M137 127a43 43 0 0 1 86 0"/><path class="visual-cloud" d="M263 64c-18 0-19-25-1-28 5-22 36-22 41 0 22-2 24 27 4 28h-44Z"/><path class="visual-rain" d="m277 73-5 12m20-12-5 12m20-12-5 12"/></svg>'
    },
    adventure: {
      label: 'shape adventure',
      title: 'A Curious Little Journey',
      opening: 'A little explorer follows these curious lines.',
      middle: 'Around each twist, there is something new to notice.',
      ending: 'Slow steps help us discover and care for the world.',
      narration: 'A little explorer follows these curious lines. Around each twist, there is something new to notice. Slow steps help us discover and care for the world.',
      visual: '<svg viewBox="0 0 360 150" fill="none" aria-hidden="true"><path class="visual-trail" d="M25 128c40-54 68 20 105-31s58 21 91-27 65 8 114-30"/><path class="visual-spark" d="m270 32 4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z"/><circle class="visual-dot" cx="78" cy="64" r="6"/><circle class="visual-dot" cx="207" cy="75" r="5"/></svg>'
    }
  };

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
    subjectPicker.hidden = true;
    pickerWasOpenedFromPrompt = false;
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

  function classifySubject() {
    const rect = canvas.getBoundingClientRect();
    const paths = strokes
      .filter((stroke) => !stroke.erase && stroke.points.length > 1)
      .map((stroke) => stroke.points.map((point) => ({ x: point.x * rect.width, y: point.y * rect.height })));
    const points = paths.flat();
    if (points.length < 8) return null;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    points.forEach((point) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
    const drawingWidth = Math.max(1, maxX - minX);
    const drawingHeight = Math.max(1, maxY - minY);
    const normalizedPaths = paths.map((path) => path.map((point) => ({
      x: (point.x - minX) / drawingWidth,
      y: (point.y - minY) / drawingHeight
    })));

    const shapes = normalizedPaths.map((path) => {
      const compact = [];
      for (const point of path) {
        const last = compact[compact.length - 1];
        if (!last || Math.hypot(point.x - last.x, point.y - last.y) >= .035) compact.push(point);
      }
      const first = path[0];
      const last = path[path.length - 1];
      const closed = path.length >= 8 && Math.hypot(first.x - last.x, first.y - last.y) < .17;
      let turns = 0;
      for (let index = 1; index < compact.length - 1; index += 1) {
        const before = compact[index - 1];
        const at = compact[index];
        const after = compact[index + 1];
        const angleA = Math.atan2(at.y - before.y, at.x - before.x);
        const angleB = Math.atan2(after.y - at.y, after.x - at.x);
        let angle = Math.abs(angleB - angleA);
        if (angle > Math.PI) angle = Math.PI * 2 - angle;
        if (angle > .72) turns += 1;
      }
      if (closed && compact.length > 3) {
        const before = compact[compact.length - 2];
        const at = compact[0];
        const after = compact[1];
        const angleA = Math.atan2(at.y - before.y, at.x - before.x);
        const angleB = Math.atan2(after.y - at.y, after.x - at.x);
        let angle = Math.abs(angleB - angleA);
        if (angle > Math.PI) angle = Math.PI * 2 - angle;
        if (angle > .72) turns += 1;
      }
      let pathMinX = Infinity;
      let pathMaxX = -Infinity;
      let pathMinY = Infinity;
      let pathMaxY = -Infinity;
      path.forEach((point) => {
        pathMinX = Math.min(pathMinX, point.x);
        pathMaxX = Math.max(pathMaxX, point.x);
        pathMinY = Math.min(pathMinY, point.y);
        pathMaxY = Math.max(pathMaxY, point.y);
      });
      const width = pathMaxX - pathMinX;
      const height = pathMaxY - pathMinY;
      const length = path.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - path[index].x, point.y - path[index].y), 0);
      const peaks = [];
      if (compact.length > 2) {
        const oriented = compact[0].x <= compact[compact.length - 1].x ? compact : compact.slice().reverse();
        for (let index = 1; index < oriented.length - 1; index += 1) {
          const before = oriented[index - 1];
          const at = oriented[index];
          const after = oriented[index + 1];
          const hasRoom = at.x - before.x > .055 && after.x - at.x > .055;
          const isPeak = at.y < before.y - .10 && at.y < after.y - .10;
          if (hasRoom && isPeak && !peaks.some((peak) => Math.abs(peak.x - at.x) < .14)) peaks.push(at);
        }
      }
      return { path, compact, width, height, turns, closed, length, peaks };
    });

    const bigLoops = shapes.filter((shape) => shape.closed && shape.width * shape.height > .07);
    const compactLoops = shapes.filter((shape) => shape.closed && shape.width < .48 && shape.height < .48);
    const tallStem = shapes.some((shape) => shape.height > .54 && shape.width < .25);
    const mountainProfile = shapes.some((shape) => {
      if (shape.width < .58 || shape.height < .26 || shape.peaks.length === 0) return false;
      if (shape.closed && shape.turns > 4) return false;
      const peakY = Math.min(...shape.peaks.map((peak) => peak.y));
      const endY = (shape.path[0].y + shape.path[shape.path.length - 1].y) / 2;
      return endY > peakY + .12 && shape.length > 1.05;
    });

    // A wide, open ridge or a simple three-sided peak is a mountain. A closed
    // five-corner outline is more likely to be a house, so check that first.
    const houseOutline = shapes.some((shape) => shape.closed && shape.width > .44 && shape.height > .38 && shape.turns >= 5 && shape.width / shape.height > .62 && shape.width / shape.height < 1.8);
    if (houseOutline) return 'home';
    if (mountainProfile || shapes.some((shape) => shape.closed && shape.width > .58 && shape.height > .35 && shape.turns <= 4 && shape.peaks.length > 0)) return 'mountain';

    const flowerLike = compactLoops.length >= 3 && tallStem;
    if (flowerLike) return 'flower';

    const wheels = compactLoops.filter((shape) => shape.width > .06 && shape.height > .06 && shape.width / shape.height > .55 && shape.width / shape.height < 1.7);
    const body = shapes.some((shape) => shape.closed && shape.width > .48 && shape.width > shape.height * 1.35 && shape.turns >= 3);
    if (wheels.length >= 2 && body) return 'vehicle';

    // Ambiguous art is deliberately left unnamed; the child can choose a picture
    // in the story picker, avoiding a confident but unrelated story.
    return null;
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
      currentArtwork = { ...artwork, subject: classifySubject() };
      promptedSignature = artwork.signature;
      invitationTitle.textContent = currentArtwork.subject
        ? `${stories[currentArtwork.subject].label[0].toUpperCase()}${stories[currentArtwork.subject].label.slice(1)} story ready!`
        : 'A little story is ready!';
      positionStoryInvitation(artwork);
      speak(currentArtwork.subject
        ? `A ${stories[currentArtwork.subject].label} story is ready. Would you like to hear it or keep drawing?`
        : 'A little story is ready. Tap a picture to choose what it is about, or keep drawing.');
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
    storyScene.classList.remove('is-helping', 'is-finished');
    storyScene.removeAttribute('data-subject');
    sceneStoryVisual.innerHTML = '';
    childStoryArt.removeAttribute('src');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    currentArtwork = null;
    showToast('Back to your drawing!');
  }

  function playStory(subject = currentArtwork?.subject) {
    if (!currentArtwork || storyActive) return;
    if (!subject) {
      openSubjectPicker();
      return;
    }
    const story = stories[subject] || stories.adventure;
    window.clearTimeout(idleTimer);
    storyInvitation.hidden = true;
    subjectPicker.hidden = true;
    hideIdea();
    storyActive = true;
    promptedSignature = currentArtwork.signature;
    childStoryArt.src = cropDrawing(currentArtwork);
    storyScene.classList.remove('is-helping', 'is-finished');
    storyScene.dataset.subject = subject;
    document.getElementById('scene-title').textContent = story.title;
    sceneStoryVisual.innerHTML = story.visual;
    sceneCaption.textContent = story.opening;
    sceneProgress.style.animation = 'none';
    void sceneProgress.offsetWidth;
    sceneProgress.style.animation = '';
    storyScene.hidden = false;
    speak(story.narration);

    sceneTimers.push(window.setTimeout(() => {
      storyScene.classList.add('is-helping');
      sceneCaption.textContent = story.middle;
    }, 2600));
    sceneTimers.push(window.setTimeout(() => {
      storyScene.classList.add('is-finished');
      sceneCaption.textContent = story.ending;
    }, 6500));
    sceneTimers.push(window.setTimeout(finishStory, 10000));
  }

  function openSubjectPicker() {
    if (!currentArtwork || storyActive) return;
    pickerWasOpenedFromPrompt = !storyInvitation.hidden;
    storyInvitation.hidden = true;
    subjectPicker.hidden = false;
    speak('Tap the picture that looks like what you drew.');
  }

  function closeSubjectPicker() {
    subjectPicker.hidden = true;
    if (pickerWasOpenedFromPrompt && currentArtwork) positionStoryInvitation(currentArtwork);
    pickerWasOpenedFromPrompt = false;
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
  document.getElementById('read-prompt').addEventListener('click', () => speak('Draw anything you like. Pause for a little story about your picture. If I am not sure what it is, tap a picture to choose.'));
  document.getElementById('read-story-flow').addEventListener('click', () => speak('After you draw, pause for a moment. A story choice appears beside your picture. If the app is not sure what it shows, tap a picture to choose its story.'));
  document.getElementById('story-button').addEventListener('click', () => playStory());
  document.getElementById('continue-drawing').addEventListener('click', hideStoryInvitation);
  document.getElementById('subject-picker-close').addEventListener('click', closeSubjectPicker);
  document.querySelectorAll('.subject-choice').forEach((button) => {
    button.addEventListener('click', () => playStory(button.dataset.subject));
  });
  document.getElementById('scene-close').addEventListener('click', finishStory);

  if ('ResizeObserver' in window) {
    new ResizeObserver(fitCanvas).observe(paper);
  } else {
    window.addEventListener('resize', fitCanvas);
  }
  fitCanvas();
  updateUndoButton();
})();
