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

  // Update modal state and fix the body to preserve scroll position and width
  modalElement.addEventListener("shown.bs.modal", function () {
    isModalShown = true;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = `${window.innerWidth}px`;
  });
  modalElement.addEventListener("hidden.bs.modal", function () {
    isModalShown = false;
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
    updateIndicators();
  });

  // Dynamic API URL based on environment
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

  function updateImage() {
    if (images.length > 0) {
      galleryImage.classList.add("fade-out");
      setTimeout(() => {
        galleryImage.src = images[currentIndex];
        galleryImage.classList.remove("fade-out");
        galleryImage.classList.add("fade-in");
        setTimeout(() => {
          galleryImage.classList.remove("fade-in");
          updateIndicators();
        }, 500);
      }, 300);
    }
  }

  function createIndicators() {
    indicatorsContainer.innerHTML = "";
    images.forEach((_, index) => {
      const indicator = document.createElement("span");
      indicator.classList.add("indicator", "rounded-circle");
      if (index === currentIndex) indicator.classList.add("active");
      indicator.setAttribute("aria-label", `View image ${index + 1}`);
      indicator.addEventListener("click", () => {
        currentIndex = index;
        updateImage();
      });
      indicatorsContainer.appendChild(indicator);
    });
  }

  function updateIndicators() {
    const allIndicators = document.querySelectorAll(".indicator");
    allIndicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index === currentIndex);
    });
  }

  // Open Modal & Set Image
  function openModal() {
    if (images.length > 0) {
      modalImage.src = images[currentIndex];
      modal.show();
    }
  }

  // Update both gallery and modal image
  function updateBothViews() {
    if (images.length > 0) {
      modalImage.classList.add("fade-out");
      galleryImage.classList.add("fade-out");
      setTimeout(() => {
        modalImage.src = images[currentIndex];
        galleryImage.src = images[currentIndex];
        modalImage.classList.remove("fade-out");
        modalImage.classList.add("fade-in");
        galleryImage.classList.remove("fade-out");
        galleryImage.classList.add("fade-in");
        setTimeout(() => {
          modalImage.classList.remove("fade-in");
          galleryImage.classList.remove("fade-in");
          updateIndicators();
        }, 500);
      }, 300);
    }
  }

  // Gallery Navigation
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

  // Modal Navigation
  modalPrevBtn.addEventListener("click", function () {
    if (images.length > 0) {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateBothViews();
    }
    setTimeout(() => this.blur(), 0);
  });
  modalNextBtn.addEventListener("click", function () {
    if (images.length > 0) {
      currentIndex = (currentIndex + 1) % images.length;
      updateBothViews();
    }
    setTimeout(() => this.blur(), 0);
  });

  // Prevent buttons from receiving focus on mousedown
  [prevBtn, nextBtn, modalPrevBtn, modalNextBtn].forEach(btn => {
    btn.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
  });

  // Keyboard Navigation
  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateBothViews();
    } else if (event.key === "ArrowRight") {
      currentIndex = (currentIndex + 1) % images.length;
      updateBothViews();
    } else if (event.key === "Escape" && isModalShown) {
      modal.hide();
    }
  });

  // Open Modal on Gallery Image Click
  galleryImage.addEventListener("click", openModal);

  // Touch Swipe Support
  function addSwipeListener(element, callbackLeft, callbackRight) {
    let startX = 0;
    let lastSwipeTime = 0;
    element.addEventListener("touchstart", function (event) {
      startX = event.touches[0].clientX;
    });
    element.addEventListener("touchend", function (event) {
      const now = Date.now();
      if (now - lastSwipeTime < 300) return;
      lastSwipeTime = now;
      const endX = event.changedTouches[0].clientX;
      const diff = startX - endX;
      if (diff > 50) {
        callbackLeft();
      } else if (diff < -50) {
        callbackRight();
      }
    });
  }

  // Enable swiping in gallery
  addSwipeListener(galleryImage, () => {
    currentIndex = (currentIndex + 1) % images.length;
    updateImage();
  }, () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateImage();
  });

  // Enable swiping in modal
  addSwipeListener(modalImage, () => {
    currentIndex = (currentIndex + 1) % images.length;
    updateBothViews();
  }, () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateBothViews();
  });

  // Exit Modal by Clicking Blank Space
  modalElement.addEventListener("click", function (e) {
    if (e.target === modalElement || e.target.classList.contains("modal-body")) {
      modal.hide();
    }
  });

  // Fetch images & initialize gallery
  images = await fetchImages();
  if (images.length > 0) {
    currentIndex = 0;
    createIndicators();
    updateImage();
    setTimeout(() => {
      loader.style.display = "none";
      galleryContainer.classList.remove("hidden");
    }, 600);
  }
});
