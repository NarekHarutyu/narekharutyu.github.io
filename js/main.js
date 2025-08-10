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
  const sectionIds = ['home', 'education', 'skills', 'research', 'teaching', 'publications', 'contact'];
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

  // Contact form handler (POST to local API)
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');
  if (statusEl) {
    statusEl.setAttribute('role', 'status');
    statusEl.setAttribute('aria-live', 'polite');
  }
  if (form && statusEl) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const name = (formData.get('name') || '').toString().trim();
      const email = (formData.get('email') || '').toString().trim();
      const message = (formData.get('message') || '').toString().trim();

      if (!name || !email || !message) {
        statusEl.textContent = 'Please fill out all fields.';
        statusEl.classList.remove('text-green-600');
        statusEl.classList.add('text-red-600');
        return;
      }

      statusEl.textContent = 'Sending...';
      statusEl.classList.remove('text-red-600');
      statusEl.classList.add('text-gray-600');

      try {
        const res = await fetch('http://127.0.0.1:8788/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message }),
        });
        const data = await res.json().catch(() => ({ ok: false }));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to send');

        statusEl.classList.remove('text-red-600', 'text-gray-600');
        statusEl.classList.add('text-green-600');
        statusEl.innerHTML =
          "Thanks for your message — I'll respond soon. " +
          '<a id="send-another" class="underline text-brand-700 hover:text-brand-800 cursor-pointer">Send another message</a>';

        const resetLink = document.getElementById('send-another');
        if (resetLink) {
          resetLink.addEventListener('click', (evt) => {
            evt.preventDefault();
            form.reset();
            statusEl.textContent = '';
            const nameInput = document.getElementById('name');
            if (nameInput) nameInput.focus();
          });
        }
      } catch (err) {
        statusEl.textContent = 'There was a problem sending your message. Please try again later.';
        statusEl.classList.remove('text-gray-600');
        statusEl.classList.add('text-red-600');
      }
    });
  }

  // Current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}); 