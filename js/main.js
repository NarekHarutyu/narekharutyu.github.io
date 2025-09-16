document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.contains('hidden');
      if (isHidden) {
        mobileMenu.classList.remove('hidden');
        navToggle.setAttribute('aria-expanded', 'true');
      } else {
        mobileMenu.classList.add('hidden');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Close mobile menu after clicking a link
  document.querySelectorAll('#mobile-menu a').forEach((anchor) => {
    anchor.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Active nav link based on scroll
  const sectionIds = ['home', 'research', 'teaching', 'publications', 'contact'];
  const links = Array.from(document.querySelectorAll('.nav-link'));
  const linkById = Object.fromEntries(
    links.map((a) => [a.getAttribute('href').replace('#', ''), a])
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          links.forEach((l) => l.classList.remove('active'));
          if (linkById[id]) linkById[id].classList.add('active');
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] }
  );

  sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .forEach((section) => observer.observe(section));

  

  // Current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
});

// Test function to verify JavaScript is loading
window.testFunction = function() {
  console.log('JavaScript is working!');
  alert('JavaScript is working!');
};

// Poster viewer functionality - moved to global scope
window.openPoster = function(pdfPath, caption) {
  console.log('openPoster called with:', pdfPath, caption); // Debug log
  
  const modal = document.getElementById('posterModal');
  const title = document.getElementById('posterTitle');
  const captionEl = document.getElementById('posterCaption');
  const frame = document.getElementById('posterFrame');
  
  if (!modal) {
    console.error('Poster modal not found');
    return;
  }
  
  // Set content
  title.textContent = 'Advancements in Multi-Robot Systems';
  captionEl.textContent = `Poster presented at ${caption}`;
  frame.src = pdfPath;
  
  // Show modal
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  // Update URL with hash for poster
  const posterHash = '#poster-multi-robot-systems';
  history.pushState({ posterOpen: true }, '', posterHash);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closePoster();
    }
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', handleEscapeKey);
}

window.closePoster = function() {
  const modal = document.getElementById('posterModal');
  const frame = document.getElementById('posterFrame');
  
  // Hide modal
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  frame.src = '';
  
  // Update URL back to publications section
  history.pushState({}, '', '#publications');
  
  // Remove event listeners
  document.removeEventListener('keydown', handleEscapeKey);
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closePoster();
  }
}

// Handle browser back/forward button
window.addEventListener('popstate', (e) => {
  if (window.location.hash === '#poster-multi-robot-systems') {
    // If someone navigates directly to the poster URL, open it
    openPoster('assets/Advancements_in_Multi_Robot_Systems.pdf', 'Yale Northeast Robotics Colloquium (NERC) 2023');
  } else {
    // If navigating away from poster, close it
    const modal = document.getElementById('posterModal');
    if (modal && !modal.classList.contains('hidden')) {
      closePoster();
    }
  }
});

// Check if page loads with poster hash
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#poster-multi-robot-systems') {
    openPoster('assets/Advancements_in_Multi_Robot_Systems.pdf', 'Yale Northeast Robotics Colloquium (NERC) 2023');
  }
}); 