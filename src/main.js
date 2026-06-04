import './style.css';

// Configuration
const frameCount = 264;
const images = [];
let currentFrame = 0;
let targetFrame = 0;
let isLoaded = false;

// DOM Elements
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const preloader = document.getElementById('preloader');
const loaderBar = document.getElementById('loader-bar');
const preloadPercent = document.getElementById('preload-percentage');

// Helper to get scroll fraction
function getScrollFraction() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return scrollTop / maxScroll;
}

// Fit and Center Image on Canvas (Cover fit)
function drawFrame(frameIndex) {
  const img = images[frameIndex];
  if (!img) return;

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set high-quality image smoothing parameters
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const imgRatio = img.width / img.height;
  const canvasRatio = canvas.width / canvas.height;

  let drawWidth, drawHeight, drawX, drawY;

  if (canvasRatio > imgRatio) {
    // Canvas is wider than image (fit horizontally, clip vertically)
    drawWidth = canvas.width;
    drawHeight = canvas.width / imgRatio;
    drawX = 0;
    drawY = (canvas.height - drawHeight) / 2;
  } else {
    // Canvas is taller than image (fit vertically, clip horizontally)
    drawWidth = canvas.height * imgRatio;
    drawHeight = canvas.height;
    drawX = (canvas.width - drawWidth) / 2;
    drawY = 0;
  }

  // Draw the image
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

// Preload Images
function preloadImages() {
  return new Promise((resolve) => {
    let loadedCount = 0;

    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/frames/ezgif-frame-${frameNum}.jpg`;

      img.onload = () => {
        loadedCount++;
        const percentage = Math.round((loadedCount / frameCount) * 100);
        
        // Update preloader UI
        loaderBar.style.width = `${percentage}%`;
        preloadPercent.textContent = `${percentage}%`;

        if (loadedCount === frameCount) {
          resolve();
        }
      };

      img.onerror = () => {
        console.error(`Failed to load frame: ${img.src}`);
        loadedCount++;
        
        // Update preloader UI even on fail to not lock the UI
        const percentage = Math.round((loadedCount / frameCount) * 100);
        loaderBar.style.width = `${percentage}%`;
        preloadPercent.textContent = `${percentage}%`;

        if (loadedCount === frameCount) {
          resolve();
        }
      };

      images.push(img);
    }
  });
}

// Smooth Lerped Animation Loop
function updateAnimation() {
  const diff = targetFrame - currentFrame;
  
  if (Math.abs(diff) < 0.01) {
    currentFrame = targetFrame;
  } else {
    // Lerp: current = current + diff * factor
    currentFrame += diff * 0.08;
  }

  if (isLoaded) {
    drawFrame(Math.round(currentFrame));
  }
  
  requestAnimationFrame(updateAnimation);
}

// Handle Window Resizing with High-DPI support
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  
  if (isLoaded) {
    drawFrame(Math.round(currentFrame));
  }
}

// Setup Scroll Event
function setupScroll() {
  window.addEventListener('scroll', () => {
    const fraction = getScrollFraction();
    targetFrame = Math.min(frameCount - 1, Math.floor(fraction * frameCount));
  });
}

// Setup Intersection Observer for Panels & Navigation
function setupScrollObserver() {
  const sections = document.querySelectorAll('.scroll-section');
  const navLinks = document.querySelectorAll('.nav-links a');

  const observerOptions = {
    root: null,
    rootMargin: '-25% 0px -25% 0px', // Trigger when in central view
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add visible class to floating panels
        const panels = entry.target.querySelectorAll('.floating-panel');
        panels.forEach(panel => panel.classList.add('visible'));

        // Highlight navigation links
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

// Setup Flavor Selector (Theme switcher)
function setupFlavorSelector() {
  const flavorCards = document.querySelectorAll('.flavor-card');

  flavorCards.forEach(card => {
    card.addEventListener('click', () => {
      // Remove active from all cards
      flavorCards.forEach(c => c.classList.remove('active'));
      
      // Add active to current card
      card.classList.add('active');

      // Swap body theme class
      const theme = card.getAttribute('data-theme');
      document.body.className = ''; // Reset all classes
      document.body.classList.add(`theme-${theme}`);
    });
  });
}

// Initialize Application
async function init() {
  // Initial size setup
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Preload all animation frames
  await preloadImages();
  isLoaded = true;

  // Set initial scroll values to prevent jumping
  const initialFraction = getScrollFraction();
  targetFrame = Math.min(frameCount - 1, Math.floor(initialFraction * frameCount));
  currentFrame = targetFrame;
  drawFrame(Math.round(currentFrame));

  // Hide Preloader with a nice transition
  preloader.classList.add('loaded');

  // Start scroll listeners & animations
  setupScroll();
  setupScrollObserver();
  setupFlavorSelector();
  setupCheckout();
  
  // Set default body class theme
  document.body.classList.add('theme-kesar');
}

// Run the loop and bootstrap
updateAnimation();
window.addEventListener('DOMContentLoaded', init);

// Checkout & Payment Modal Controller
function setupCheckout() {
  const modal = document.getElementById('checkout-modal');
  const btnOrderCta = document.getElementById('btn-order-cta');
  const btnBuyHeader = document.getElementById('btn-buy-header');
  const btnClose = document.getElementById('modal-close');
  
  const stepOrder = document.getElementById('step-order');
  const stepPayment = document.getElementById('step-payment');
  const stepSuccess = document.getElementById('step-success');
  
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');
  const qtyValue = document.getElementById('qty-value');
  const totalPriceView = document.getElementById('checkout-total-price');
  const flavorIndicator = document.getElementById('checkout-flavor-indicator');
  
  const shippingForm = document.getElementById('shipping-form');
  const cardForm = document.getElementById('card-form');
  
  // Card Inputs & Views
  const cardNumInput = document.getElementById('card-number');
  const cardNameInput = document.getElementById('card-name');
  const cardExpiryInput = document.getElementById('card-expiry');
  const cardCvvInput = document.getElementById('card-cvv');
  
  const cardNumView = document.getElementById('card-num-view');
  const cardNameView = document.getElementById('card-name-view');
  const cardExpiryView = document.getElementById('card-expiry-view');
  const cardCvvView = document.getElementById('card-cvv-view');
  const creditCardEl = document.getElementById('credit-card-element');
  const cardBrandLogo = document.getElementById('card-brand-logo');
  
  // Tabs
  const tabBtnCard = document.getElementById('tab-btn-card');
  const tabBtnUpi = document.getElementById('tab-btn-upi');
  const panelCard = document.getElementById('payment-card-panel');
  const panelUpi = document.getElementById('payment-upi-panel');
  
  // Back buttons
  const btnBackShipping = document.getElementById('btn-back-to-shipping');
  const btnBackShippingUpi = document.getElementById('btn-back-to-shipping-upi');
  const btnConfirmUpiPay = document.getElementById('btn-confirm-upi-pay');
  const btnFinishCheckout = document.getElementById('btn-finish-checkout');
  
  // Receipt elements
  const receiptOrderId = document.getElementById('receipt-order-id');
  const receiptFlavor = document.getElementById('receipt-flavor');
  const receiptQty = document.getElementById('receipt-qty');
  const receiptTotal = document.getElementById('receipt-total');
  
  let quantity = 1;
  const pricePerBottle = 40;
  let upiTimerInterval = null;

  // Open modal handler
  function openCheckout(e) {
    if (e) e.preventDefault();
    
    // Detect active flavor from landing page
    const activeFlavorCard = document.querySelector('.flavor-card.active');
    let flavorName = 'Kesar Badam';
    if (activeFlavorCard) {
      flavorName = activeFlavorCard.querySelector('h4').textContent;
    }
    
    // Set flavor indicator
    flavorIndicator.textContent = flavorName;
    
    // Reset quantity
    quantity = 1;
    qtyValue.textContent = '1';
    totalPriceView.textContent = `₹${pricePerBottle}`;
    
    // Go to first step
    stepOrder.classList.add('active');
    stepPayment.classList.remove('active');
    stepSuccess.classList.remove('active');
    
    // Open modal
    modal.classList.add('open');
  }

  // Close modal handler
  function closeCheckout() {
    modal.classList.remove('open');
    shippingForm.reset();
    cardForm.reset();
    if (upiTimerInterval) {
      clearInterval(upiTimerInterval);
    }
    
    // Reset card mock view
    cardNumView.textContent = '•••• •••• •••• ••••';
    cardNameView.textContent = 'JOHN DOE';
    cardExpiryView.textContent = 'MM/YY';
    cardCvvView.textContent = '•••';
    cardBrandLogo.textContent = 'VISA';
  }

  btnOrderCta.addEventListener('click', openCheckout);
  btnBuyHeader.addEventListener('click', openCheckout);
  btnClose.addEventListener('click', closeCheckout);
  
  // Close modal when clicking overlay background
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCheckout();
  });

  // Quantity controllers
  qtyPlus.addEventListener('click', () => {
    quantity++;
    qtyValue.textContent = quantity;
    totalPriceView.textContent = `₹${quantity * pricePerBottle}`;
  });

  qtyMinus.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      qtyValue.textContent = quantity;
      totalPriceView.textContent = `₹${quantity * pricePerBottle}`;
    }
  });

  // Step 1 -> Step 2 transition
  shippingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    stepOrder.classList.remove('active');
    stepPayment.classList.add('active');
    
    // Reset UPI timer to 2 minutes
    startUpiTimer();
  });

  // Back button card -> Shipping
  btnBackShipping.addEventListener('click', () => {
    stepPayment.classList.remove('active');
    stepOrder.classList.add('active');
  });

  // Back button UPI -> Shipping
  btnBackShippingUpi.addEventListener('click', () => {
    stepPayment.classList.remove('active');
    stepOrder.classList.add('active');
  });

  // Tab switching
  tabBtnCard.addEventListener('click', () => {
    tabBtnCard.classList.add('active');
    tabBtnUpi.classList.remove('active');
    panelCard.classList.add('active');
    panelUpi.classList.remove('active');
  });

  tabBtnUpi.addEventListener('click', () => {
    tabBtnUpi.classList.add('active');
    tabBtnCard.classList.remove('active');
    panelUpi.classList.add('active');
    panelCard.classList.remove('active');
  });

  // Credit Card Input formatting & binding
  cardNumInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = '';
    
    // Group digits by 4
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += value[i];
    }
    e.target.value = formattedValue;
    cardNumView.textContent = formattedValue || '•••• •••• •••• ••••';
    
    // Brand detection
    if (value.startsWith('4')) {
      cardBrandLogo.textContent = 'VISA';
    } else if (value.startsWith('5')) {
      cardBrandLogo.textContent = 'MC';
    } else {
      cardBrandLogo.textContent = 'CARD';
    }
  });

  cardNameInput.addEventListener('input', (e) => {
    cardNameView.textContent = e.target.value.toUpperCase() || 'JOHN DOE';
  });

  cardExpiryInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
    cardExpiryView.textContent = value || 'MM/YY';
  });

  cardCvvInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^0-9]/gi, '');
    e.target.value = value;
    cardCvvView.textContent = value ? '•'.repeat(value.length) : '•••';
  });

  // 3D Card flip listeners
  cardCvvInput.addEventListener('focus', () => {
    creditCardEl.classList.add('flipped');
  });

  cardCvvInput.addEventListener('blur', () => {
    creditCardEl.classList.remove('flipped');
  });

  // Submit payment handler (Card)
  cardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerOrderSuccess();
  });

  // Confirm payment handler (UPI)
  btnConfirmUpiPay.addEventListener('click', () => {
    triggerOrderSuccess();
  });

  // Finish checkout button
  btnFinishCheckout.addEventListener('click', closeCheckout);

  // Trigger Order Success Screen
  function triggerOrderSuccess() {
    stepPayment.classList.remove('active');
    stepSuccess.classList.add('active');
    
    // Fill receipt details
    const randomOrderId = '#AK-' + Math.floor(10000 + Math.random() * 90000);
    receiptOrderId.textContent = randomOrderId;
    receiptFlavor.textContent = flavorIndicator.textContent;
    receiptQty.textContent = `${quantity} ${quantity === 1 ? 'Bottle' : 'Bottles'}`;
    receiptTotal.textContent = `₹${quantity * pricePerBottle}`;
    
    // Start confetti celebration
    launchConfetti();
  }

  // UPI QR Countdown Timer
  function startUpiTimer() {
    if (upiTimerInterval) {
      clearInterval(upiTimerInterval);
    }
    
    const timerDisplay = document.getElementById('upi-timer');
    let timeRemaining = 120; // 2 minutes in seconds
    
    function updateTimer() {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      if (timeRemaining <= 0) {
        clearInterval(upiTimerInterval);
        timerDisplay.textContent = 'Expired';
      }
      timeRemaining--;
    }
    
    updateTimer();
    upiTimerInterval = setInterval(updateTimer, 1000);
  }

  // Celebratory Confetti Launcher
  function launchConfetti() {
    const colors = ['#ffaa1d', '#f03e8d', '#a07855', '#34b3a0', '#ffffff', '#4ebdae'];
    const particleCount = 100;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const startX = Math.random() * 100; // viewport percentage
      const size = 5 + Math.random() * 8; // width/height in px
      const duration = 2 + Math.random() * 2; // seconds
      const delay = Math.random() * 1.5; // seconds
      
      particle.style.background = randomColor;
      particle.style.left = `${startX}vw`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.animationDuration = `${duration}s`;
      particle.style.animationDelay = `${delay}s`;
      
      const shapeType = Math.floor(Math.random() * 3);
      if (shapeType === 0) {
        particle.style.borderRadius = '50%'; // Circle
      } else if (shapeType === 1) {
        particle.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)'; // Triangle
      }
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, (duration + delay) * 1000);
    }
  }
}
