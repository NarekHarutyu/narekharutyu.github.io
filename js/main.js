/*
 * Site behaviour shared by index.html and gallery.html:
 * theme toggle, header state, mobile menu, section spy, lazy video playback,
 * lightbox, gallery masonry + filters, copy-to-clipboard, and the Berkeley clock.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  /* Theme ------------------------------------------------------------------ */

  const effectiveTheme = () => root.dataset.theme || (darkScheme.matches ? 'dark' : 'light');

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    const label = () => {
      button.setAttribute(
        'aria-label',
        effectiveTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    };
    label();
    darkScheme.addEventListener('change', label);
    button.addEventListener('click', () => {
      const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch (error) {
        /* storage unavailable (private mode); the choice lasts for this page view */
      }
      label();
      document.dispatchEvent(new CustomEvent('themechange'));
    });
  });

  /* Header ----------------------------------------------------------------- */

  const header = document.querySelector('.site-header');

  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Mobile menu ------------------------------------------------------------ */

  const menuButton = document.querySelector('[data-menu-toggle]');

  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    if (menuButton) {
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.textContent = open ? 'Close' : 'Menu';
    }
  };

  menuButton?.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  document.querySelectorAll('.mobile-nav a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('menu-open')) setMenu(false);
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });

  /* Section spy ------------------------------------------------------------ */

  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const spied = [document.getElementById('top')]
    .concat(navLinks.map((link) => document.getElementById(link.hash.slice(1))))
    .filter(Boolean);

  if (navLinks.length && spied.length) {
    // The current section is the last one whose top has passed a line a third of the
    // way down the viewport; short sections at the very end can never reach that line,
    // so the bottom of the page always selects the last one.
    let queued = false;
    const spy = () => {
      queued = false;
      const line = window.innerHeight / 3;
      const atEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = spied[0];
      spied.forEach((section) => {
        if (section.getBoundingClientRect().top <= line) current = section;
      });
      if (atEnd) current = spied[spied.length - 1];
      navLinks.forEach((link) => {
        if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(spy);
    };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    spy();
  }

  /* Lazy video: load near the viewport, play only while visible ------------- */

  const loadVideo = (video) => {
    if (!video.dataset.src) return;
    if (video.dataset.poster) video.poster = video.dataset.poster;
    video.src = video.dataset.src;
    video.removeAttribute('data-src');
  };

  const videos = [...document.querySelectorAll('video[data-src]')];
  const loader = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadVideo(entry.target);
        loader.unobserve(entry.target);
      });
    },
    { rootMargin: '800px 0px' }
  );
  const player = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && !reduceMotion.matches) {
          loadVideo(video);
          const playing = video.play();
          if (playing) playing.catch(() => {});
        } else if (!video.paused) {
          video.pause();
        }
      });
    },
    { threshold: 0.2 }
  );
  videos.forEach((video) => {
    video.muted = true;
    loader.observe(video);
    player.observe(video);
  });

  /* Lightbox --------------------------------------------------------------- */

  const dialog = document.querySelector('[data-lightbox-dialog]');

  if (dialog && typeof dialog.showModal === 'function') {
    const stage = dialog.querySelector('[data-lightbox-stage]');
    const caption = dialog.querySelector('[data-lightbox-caption]');
    const counter = dialog.querySelector('[data-lightbox-count]');
    let items = [];
    let index = 0;

    const pad = (n) => String(n).padStart(2, '0');

    const show = (i) => {
      index = (i + items.length) % items.length;
      const item = items[index];
      let media;
      if (item.dataset.lightbox === 'video') {
        media = document.createElement('video');
        Object.assign(media, {
          src: item.dataset.src,
          poster: item.dataset.poster || '',
          controls: true,
          autoplay: true,
          muted: true,
          loop: true,
          playsInline: true,
        });
      } else {
        media = new Image();
        media.src = item.dataset.src;
        media.alt = item.dataset.caption || '';
      }
      stage.replaceChildren(media);
      caption.textContent = item.dataset.caption || '';
      if (counter) counter.textContent = `${pad(index + 1)} / ${pad(items.length)}`;
    };

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-lightbox]');
      if (!trigger) return;
      event.preventDefault();
      items = [...document.querySelectorAll('[data-lightbox]')].filter(
        (el) => el.offsetParent !== null
      );
      show(Math.max(0, items.indexOf(trigger)));
      if (!dialog.open) dialog.showModal();
    });

    dialog.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => show(index - 1));
    dialog.querySelector('[data-lightbox-next]')?.addEventListener('click', () => show(index + 1));
    dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target === stage) dialog.close();
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight') show(index + 1);
    });
    dialog.addEventListener('close', () => stage.replaceChildren());
  }

  /* Gallery: balanced columns in reading order, plus filters ---------------- */

  const grid = document.querySelector('[data-masonry]');

  if (grid) {
    const tiles = [...grid.querySelectorAll('.tile')];
    const GAP = 20;
    const CAPTION = 72; // approximate caption height, used only to balance columns
    let columnCount = 0;

    const layout = (force) => {
      const width = grid.clientWidth;
      const count = width >= 1000 ? 3 : width >= 600 ? 2 : 1;
      if (count === columnCount && !force) return;
      columnCount = count;

      const columnWidth = (width - GAP * (count - 1)) / count;
      const columns = Array.from({ length: count }, () => {
        const column = document.createElement('div');
        column.className = 'masonry-col';
        return column;
      });
      const heights = new Array(count).fill(0);

      tiles.forEach((tile) => {
        if (tile.hidden) {
          columns[0].append(tile);
          return;
        }
        const shortest = heights.indexOf(Math.min(...heights));
        columns[shortest].append(tile);
        heights[shortest] += columnWidth / (parseFloat(tile.dataset.ar) || 1) + CAPTION;
      });

      grid.classList.add('is-js');
      grid.replaceChildren(...columns);
    };

    layout(true);
    new ResizeObserver(() => layout(false)).observe(grid);

    // Re-apply a #fragment after the tiles have moved into columns.
    const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'center' }));

    const filters = [...document.querySelectorAll('[data-filter]')];
    filters.forEach((button) => {
      button.addEventListener('click', () => {
        const tag = button.dataset.filter;
        filters.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
        tiles.forEach((tile) => {
          tile.hidden = tag !== 'all' && !tile.dataset.tags.split(' ').includes(tag);
        });
        layout(true);
      });
    });
  }

  /* Copy to clipboard ------------------------------------------------------ */

  document.querySelectorAll('[data-copy]').forEach((button) => {
    const label = button.querySelector('[data-copy-label]') || button;
    const original = label.textContent;
    let timer = 0;

    button.addEventListener('click', async () => {
      const text = button.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        const field = document.createElement('textarea');
        field.value = text;
        field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.append(field);
        field.select();
        document.execCommand('copy');
        field.remove();
      }
      label.textContent = 'Copied';
      button.classList.add('is-done');
      clearTimeout(timer);
      timer = setTimeout(() => {
        label.textContent = original;
        button.classList.remove('is-done');
      }, 1800);
    });
  });

  /* Small things ----------------------------------------------------------- */

  const clock = document.querySelector('[data-clock]');
  if (clock) {
    const format = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
    });
    const tick = () => {
      clock.textContent = format.format(new Date());
    };
    tick();
    setInterval(tick, 15000);
  }

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
