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