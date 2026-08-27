/* Meliorem Housing — nav, reveals, contact form. No dependencies. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* nav */
  const header = $('header');
  const onScroll = () => header && header.classList.toggle('stuck', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = $('#burger'), links = $('#navlinks');
  function closeNav() {
    if (!burger) return;
    burger.classList.remove('open');
    links.classList.remove('open');
    document.body.classList.remove('locked');
  }
  if (burger) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      links.classList.toggle('open', open);
      document.body.classList.toggle('locked', open);
    });
    $$('#navlinks a').forEach(a => a.addEventListener('click', closeNav));
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });

  /* hero video autoplay.
     iOS is strict: the video must be muted AND playsinline, and Safari sometimes
     ignores the muted *attribute* while honouring the muted *property* -- so we
     set it in JS too, then call play() ourselves rather than trusting autoplay.
     If it is still blocked (Low Power Mode blocks all autoplay, and nothing in
     the page can override that) the poster frame stays up, which is why the
     poster is a real frame from the video and not a placeholder. */
  const hero = $('.hero-vid');
  if (hero) {
    hero.muted = true;
    hero.defaultMuted = true;
    hero.playsInline = true;
    const play = () => { const p = hero.play(); if (p) p.catch(() => {}); };
    play();
    hero.addEventListener('loadeddata', play, { once: true });
    hero.addEventListener('canplay', play, { once: true });
    // last resort: the first touch anywhere counts as a user gesture
    ['touchstart', 'click'].forEach(function (e) {
      document.addEventListener(e, play, { once: true, passive: true });
    });
    // coming back from another tab or unlocking the phone can leave it paused
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && hero.paused) play();
    });
  }

  /* reveals */
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  $$('.rv').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(el); });

  /* contact form -> Web3Forms. Submissions land in info@melioremfoundation.org.
     If the request fails (offline, service down) we fall back to opening the
     visitor's mail app so an inquiry is never silently lost. */
  const W3_KEY = '3e165a41-c791-4a84-bda0-d505c14f021c';
  const TO = 'info@melioremfoundation.org';

  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = $('#send-btn');
      const data = Object.fromEntries(new FormData(form).entries());
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending...';

      const payload = Object.assign({}, data, {
        access_key: W3_KEY,
        subject: 'Meliorem inquiry - ' + (data.reason || 'General') + ' - ' + (data.name || ''),
        from_name: 'Meliorem Housing Website',
        replyto: data.email || ''
      });

      try {
        const r = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
        const out = await r.json();
        if (!out.success) throw new Error(out.message || 'failed');
        form.hidden = true; $('#sent').hidden = false;
      } catch (err) {
        const body = Object.entries(data).map(([k, v]) => k + ': ' + v).join('\n');
        window.location.href = 'mailto:' + TO
          + '?subject=' + encodeURIComponent(payload.subject)
          + '&body=' + encodeURIComponent(body);
        form.hidden = true; $('#sent').hidden = false;
      } finally {
        btn.disabled = false; btn.textContent = label;
      }
    });
  }

})();
