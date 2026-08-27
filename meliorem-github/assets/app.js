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

  /* reveals */
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  $$('.rv').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(el); });

  /* contact form -> Web3Forms.
     REPLACE the key below with the access key for melioremfoundation.org.
     Until then the form falls back to opening the visitor's mail app. */
  const W3_KEY = 'REPLACE_WITH_YOUR_WEB3FORMS_KEY';
  const TO = 'REPLACE@melioremfoundation.org';

  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = $('#send-btn');
      const data = Object.fromEntries(new FormData(form).entries());
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending...';

      const payload = Object.assign({
        access_key: W3_KEY,
        subject: 'Meliorem inquiry - ' + (data.reason || 'General') + ' - ' + (data.name || ''),
        from_name: 'Meliorem Housing Website',
        replyto: data.email || ''
      }, data);

      try {
        if (W3_KEY.indexOf('REPLACE') === 0) throw new Error('no key yet');
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
