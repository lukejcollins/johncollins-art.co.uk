document.addEventListener("DOMContentLoaded", async function () {
  const galleryImage = document.getElementById("galleryImage");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const indicatorsContainer = document.getElementById("imageIndicators");
  const galleryContainer = document.getElementById("galleryContainer");
  const loader = document.getElementById("loader");

  const modalElement = document.getElementById("imageModal");
  const modal = new bootstrap.Modal(modalElement);
  const modalImage = document.getElementById("modalImage");
  const modalPrevBtn = document.getElementById("modalPrevBtn");
  const modalNextBtn = document.getElementById("modalNextBtn");

  if (!galleryImage || !prevBtn || !nextBtn || !indicatorsContainer || !modalImage) {
    return;
  }

  let images = [];
  let currentIndex = 0;
  let isModalShown = false;

  // Scroll control (lock only while modal is open)
  function disableScroll() {
    // Let Bootstrap handle most scroll locking; avoid changing root to prevent desktop vw jumps
    document.body.style.overflow = "hidden";
  }

  function enableScroll() {
    document.body.style.overflow = "";
  }

  // Allow scrolling by default; lock only during modal

  // Block scrolling when modal is opened and re-block when closed
  modalElement.addEventListener("show.bs.modal", function () {
    isModalShown = true;
    disableScroll();
    // Ensure modal arrows reflect zoom state
    if (typeof updateModalNavDisabled === 'function') updateModalNavDisabled();
  });

  modalElement.addEventListener("hidden.bs.modal", function () {
    isModalShown = false;
    enableScroll();
    updateIndicators();
  });

  // Dynamic API URL (localhost vs. production)
  const apiUrl = window.location.hostname === "localhost"
    ? "http://127.0.0.1:8787/api/images"
    : "/api/images";

  async function fetchImages() {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error();
      return data;
    } catch {
      try {
        const fallback = await fetch("/images.json");
        return await fallback.json();
      } catch {
        return [];
      }
    }
  }

  // Sliding-window indicators (max 7 dots) with fading sizes
  const MAX_VISIBLE_INDICATORS = 7;
  let windowStart = 0; // first visible index in the window
  let indicatorsTrack = null;
  let indicatorCursor = null;

  function ensureIndicatorDom() {
    if (!indicatorsTrack) {
      indicatorsTrack = document.createElement('div');
      indicatorsTrack.className = 'indicators-track';
      indicatorsContainer.appendChild(indicatorsTrack);
    }
    if (!indicatorCursor) {
      indicatorCursor = document.createElement('div');
      indicatorCursor.className = 'indicator-cursor';
      indicatorsContainer.appendChild(indicatorCursor);
    }
  }

  function getVisibleIndices(total, current, maxVisible = MAX_VISIBLE_INDICATORS) {
    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i);
    }
    const side = Math.floor(maxVisible / 2);
    let start = Math.max(0, Math.min(current - side, total - maxVisible));
    let end = Math.min(total - 1, start + maxVisible - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  function slotDistance() {
    const dots = indicatorsTrack.querySelectorAll('.indicator');
    if (dots.length < 2) return 18; // fallback
    const a = dots[0].getBoundingClientRect();
    const b = dots[1].getBoundingClientRect();
    return Math.abs(b.left - a.left);
  }

  function renderIndicators(withSlideAnimation = false) {
    ensureIndicatorDom();
    const prevWindowStart = windowStart;
    const visible = getVisibleIndices(images.length, currentIndex);
    windowStart = visible[0] || 0;

    if (withSlideAnimation && indicatorsTrack.children.length > 0) {
      const delta = windowStart - prevWindowStart;
      if (delta !== 0) {
        const dist = slotDistance();
        const currentLeft = parseFloat(indicatorCursor.style.left || '0');
        if (!Number.isNaN(currentLeft) && currentLeft !== 0) {
          indicatorCursor.style.left = `${currentLeft - (delta * dist)}px`;
        }
        indicatorsTrack.style.transition = 'transform 200ms ease-out';
        indicatorsTrack.style.transform = `translateX(${-delta * dist}px)`;
        const onEnd = () => {
          indicatorsTrack.removeEventListener('transitionend', onEnd);
          indicatorsTrack.style.transition = 'none';
          indicatorsTrack.style.transform = 'translateX(0)';
          buildDots(visible);
          void indicatorsTrack.offsetWidth;
          indicatorsTrack.style.transition = 'transform 200ms ease-out';
          positionCursor();
        };
        indicatorsTrack.addEventListener('transitionend', onEnd);
      } else {
        buildDots(visible);
        positionCursor();
      }
    } else {
      buildDots(visible);
      positionCursor();
    }
  }

  function buildDots(visible) {
    indicatorsTrack.innerHTML = '';
    visible.forEach((index) => {
      const dot = document.createElement('span');
      dot.className = 'indicator rounded-circle';
      const dist = Math.abs(index - currentIndex);
      if (dist === 0) dot.classList.add('active');
      else if (dist === 1) dot.classList.add('near');
      else if (dist === 2) dot.classList.add('far');
      else dot.classList.add('faint');
      dot.setAttribute('aria-label', `View image ${index + 1}`);
      dot.addEventListener('click', () => {
        currentIndex = index;
        updateImage();
      });
      indicatorsTrack.appendChild(dot);
    });
  }

  function positionCursor() {
    if (!indicatorCursor) return;
    const dots = indicatorsTrack.querySelectorAll('.indicator');
    if (dots.length === 0) return;
    // Active dot is the one with class 'active'
    let activeEl = null;
    dots.forEach(d => { if (d.classList.contains('active')) activeEl = d; });
    const containerRect = indicatorsContainer.getBoundingClientRect();
    const activeRect = (activeEl || dots[0]).getBoundingClientRect();
    const left = activeRect.left - containerRect.left + activeRect.width / 2;
    const top = activeRect.top - containerRect.top + activeRect.height / 2;
    indicatorCursor.style.left = `${left}px`;
    indicatorCursor.style.top = `${top}px`;
  }

  function updateIndicators() {
    const visible = getVisibleIndices(images.length, currentIndex);
    const newStart = visible[0] || 0;
    const willSlide = (newStart !== windowStart);
    renderIndicators(willSlide);
  }

  function updateImage() {
    if (images.length === 0) return;
    const nextSrc = images[currentIndex];
    if (galleryImage.src === nextSrc) {
      updateIndicators();
      positionCursor();
      return;
    }
    galleryImage.classList.add('fade-out');
    const img = new Image();
    img.onload = () => {
      // Swap only after the image is loaded
      galleryImage.src = nextSrc;
      // Allow a frame for the browser to apply the src before fading back in
      requestAnimationFrame(() => {
        galleryImage.classList.remove('fade-out');
        // Update indicators right away for responsiveness
        updateIndicators();
        positionCursor();
      });
    };
    img.src = nextSrc;
  }

  function openModal() {
    if (images.length > 0) {
      modalImage.src = images[currentIndex];
      modal.show();
    }
  }

  function updateBothViews() {
    if (images.length === 0) return;
    const nextSrc = images[currentIndex];
    // Preload once
    const img = new Image();
    img.onload = () => {
      modalImage.src = nextSrc;
      updateImage(); // handles gallery fade + indicators
    };
    img.src = nextSrc;
  }

  // Navigation Controls
  prevBtn.addEventListener("click", function () {
    if (images.length > 0) {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateImage();
    }
    setTimeout(() => this.blur(), 0);
  });

  nextBtn.addEventListener("click", function () {
    if (images.length > 0) {
      currentIndex = (currentIndex + 1) % images.length;
      updateImage();
    }
    setTimeout(() => this.blur(), 0);
  });

  modalPrevBtn.addEventListener("click", function () {
    if (isZoomed) return;
    if (images.length > 0) {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateBothViews();
    }
    setTimeout(() => this.blur(), 0);
  });

  modalNextBtn.addEventListener("click", function () {
    if (isZoomed) return;
    if (images.length > 0) {
      currentIndex = (currentIndex + 1) % images.length;
      updateBothViews();
    }
    setTimeout(() => this.blur(), 0);
  });

  [prevBtn, nextBtn, modalPrevBtn, modalNextBtn].forEach(btn => {
    btn.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      if (isModalShown && isZoomed) return;
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateBothViews();
    } else if (event.key === "ArrowRight") {
      if (isModalShown && isZoomed) return;
      currentIndex = (currentIndex + 1) % images.length;
      updateBothViews();
    } else if (event.key === "Escape" && isModalShown) {
      modal.hide();
    }
  });

  galleryImage.addEventListener("click", openModal);

  function addSwipeListener(element, callbackLeft, callbackRight) {
    let startX = 0;
    let lastSwipeTime = 0;
    let hadMultiTouch = false;
    element.addEventListener("touchstart", function (event) {
      // If gesture starts as multi-touch, mark it so we ignore swipe on end
      hadMultiTouch = event.touches && event.touches.length > 1;
      if (event.touches && event.touches.length > 0) {
        startX = event.touches[0].clientX;
      }
    }, { passive: true });
    // Track if this gesture ever became multi-touch
    element.addEventListener("touchmove", function (event) {
      if (event.touches && event.touches.length > 1) {
        hadMultiTouch = true;
      }
    }, { passive: true });
    element.addEventListener("touchend", function (event) {
      const now = Date.now();
      // Avoid repeat swipes and ignore swipes immediately after a pinch
      // Use a global suppress window if defined by pinch handlers
      if (typeof suppressSwipeUntil !== 'undefined' && now < suppressSwipeUntil) {
        hadMultiTouch = false;
        return;
      }
      if (now - lastSwipeTime < 300) {
        hadMultiTouch = false;
        return;
      }
      // If any multi-touch occurred in this gesture, don't treat as swipe
      if (hadMultiTouch) {
        hadMultiTouch = false;
        return;
      }
      lastSwipeTime = now;
      if (event.changedTouches && event.changedTouches.length > 0) {
        const endX = event.changedTouches[0].clientX;
        const diff = startX - endX;
        if (diff > 50) {
          callbackLeft();
        } else if (diff < -50) {
          callbackRight();
        }
      }
      hadMultiTouch = false;
    }, { passive: true });
  }

  addSwipeListener(galleryImage, () => {
    currentIndex = (currentIndex + 1) % images.length;
    updateImage();
  }, () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateImage();
  });

  addSwipeListener(modalImage, () => {
    if (isZoomed) return;
    currentIndex = (currentIndex + 1) % images.length;
    updateBothViews();
  }, () => {
    if (isZoomed) return;
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateBothViews();
  });

  modalElement.addEventListener("click", function (e) {
    if (e.target === modalElement || e.target.classList.contains("modal-body")) {
      modal.hide();
    }
  });

  // Pinch-to-zoom in modal
  let isPinching = false;
  // Short suppression window to block swipe immediately after a pinch ends
  let suppressSwipeUntil = 0;
  let isDragging = false;
  let isZoomed = false;
  let startDist = 0;
  let baseScale = 1;
  let zoomScale = 1;
  let panX = 0, panY = 0;
  let startCenter = { x: 0, y: 0 };
  let startPan = { x: 0, y: 0 };
  let dragStart = { x: 0, y: 0 };

  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  function distance(a, b) {
    const dx = a.touches[0].clientX - a.touches[1].clientX;
    const dy = a.touches[0].clientY - a.touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  function centerPoint(e) {
    return {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
    };
  }

  function applyModalTransform() {
    modalImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
  }

  function updateModalNavDisabled() {
    const disabled = isZoomed;
    modalPrevBtn.disabled = disabled;
    modalNextBtn.disabled = disabled;
  }

  function constrainPan() {
    const rect = modalImage.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Approximate max panning based on scale and current rendered size
    const imgW = rect.width / zoomScale;
    const imgH = rect.height / zoomScale;
    const maxX = Math.max(0, (imgW * zoomScale - vw) / 2);
    const maxY = Math.max(0, (imgH * zoomScale - vh) / 2);
    panX = clamp(panX, -maxX, maxX);
    panY = clamp(panY, -maxY, maxY);
  }

  modalImage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      isPinching = true;
      startDist = distance(e);
      baseScale = zoomScale;
      startCenter = centerPoint(e);
      startPan = { x: panX, y: panY };
    } else if (e.touches.length === 1 && zoomScale > 1.01) {
      isDragging = true;
      dragStart = { x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY };
    }
  }, { passive: false });

  modalImage.addEventListener('touchmove', (e) => {
    if (isPinching && e.touches.length === 2) {
      e.preventDefault();
      const currentDist = distance(e);
      const scale = clamp(baseScale * (currentDist / startDist), 1, 3);
      const c = centerPoint(e);
      // Adjust pan so zoom centers around the pinch midpoint
      panX = startPan.x + (c.x - startCenter.x);
      panY = startPan.y + (c.y - startCenter.y);
      zoomScale = scale;
      isZoomed = zoomScale > 1.01;
      constrainPan();
      applyModalTransform();
      updateModalNavDisabled();
    } else if (isDragging && e.touches.length === 1 && zoomScale > 1.01) {
      e.preventDefault();
      panX = e.touches[0].clientX - dragStart.x;
      panY = e.touches[0].clientY - dragStart.y;
      constrainPan();
      applyModalTransform();
    }
  }, { passive: false });

  modalImage.addEventListener('touchend', (e) => {
    if (isPinching && e.touches.length < 2) {
      isPinching = false;
      // Suppress swipe shortly after pinch ends to avoid accidental navigation
      suppressSwipeUntil = Date.now() + 400;
    }
    if (isDragging && e.touches.length === 0) {
      isDragging = false;
    }
    if (zoomScale <= 1.01) {
      // Reset to default when user zooms out fully
      zoomScale = 1; panX = 0; panY = 0; isZoomed = false;
      applyModalTransform();
      updateModalNavDisabled();
      // Also suppress swipe after fully zooming out
      suppressSwipeUntil = Date.now() + 400;
    }
  });

  // Double-tap to toggle zoom (helps testing in emulators)
  let lastTapTime = 0;
  let lastTapPos = { x: 0, y: 0 };
  modalImage.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches.length === 1) {
      const now = Date.now();
      const t = e.changedTouches[0];
      const dx = t.clientX - lastTapPos.x;
      const dy = t.clientY - lastTapPos.y;
      const dist2 = dx*dx + dy*dy;
      if (now - lastTapTime < 300 && dist2 < 100) {
        // Toggle zoom
        if (zoomScale <= 1.01) {
          zoomScale = 2;
          panX = 0; panY = 0; // center zoom
          isZoomed = true;
        } else {
          zoomScale = 1;
          panX = 0; panY = 0; isZoomed = false;
        }
        applyModalTransform();
        updateModalNavDisabled();
        lastTapTime = 0; // reset
        return;
      }
      lastTapTime = now;
      lastTapPos = { x: t.clientX, y: t.clientY };
    }
  });

  modalElement.addEventListener('hidden.bs.modal', () => {
    // Reset zoom on close
    zoomScale = 1; panX = 0; panY = 0; isZoomed = false; isPinching = false; isDragging = false;
    applyModalTransform();
    updateModalNavDisabled();
  });

  // Fetch images & initialize gallery
  images = await fetchImages();
  if (images.length > 0) {
    currentIndex = 0;
    renderIndicators(false);
    updateImage();
    setTimeout(() => {
      loader.style.display = "none";
      galleryContainer.classList.remove("hidden");
      // Reposition cursor once visible in case of layout shift
      positionCursor();
    }, 600);
  }

  // Keep cursor aligned on resize
  window.addEventListener('resize', () => {
    positionCursor();
  });
});
