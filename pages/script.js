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

  // BLOCK SCROLLING: Keep the page non-scrollable at all times
  function disableScroll() {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }

  function enableScroll() {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }

  // **Disable scrolling on page load**
  disableScroll();

  // Ensure scrolling is blocked when modal is opened and re-blocked when closed
  modalElement.addEventListener("show.bs.modal", function () {
    isModalShown = true;
    disableScroll();
  });

  modalElement.addEventListener("hidden.bs.modal", function () {
    isModalShown = false;
    disableScroll(); // **Reapply scroll block to prevent Bootstrap from resetting it**
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

  function openModal() {
    if (images.length > 0) {
      modalImage.src = images[currentIndex];
      modal.show();
    }
  }

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

  [prevBtn, nextBtn, modalPrevBtn, modalNextBtn].forEach(btn => {
    btn.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
  });

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

  galleryImage.addEventListener("click", openModal);

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

  addSwipeListener(galleryImage, () => {
    currentIndex = (currentIndex + 1) % images.length;
    updateImage();
  }, () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateImage();
  });

  addSwipeListener(modalImage, () => {
    currentIndex = (currentIndex + 1) % images.length;
    updateBothViews();
  }, () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateBothViews();
  });

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
