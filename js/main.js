/* Il Nemico — Cartigliano (VI) — interazioni (Lenis + GSAP/ScrollTrigger) */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header ---------- */
  var header = document.querySelector('.site-header');
  function onScrollHeader() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  var toggle = document.querySelector('.nav-toggle');
  var siteNav = document.querySelector('.site-nav');
  if (toggle && siteNav) {
    toggle.addEventListener('click', function () {
      var open = siteNav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
    });
    siteNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        siteNav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', false);
      });
    });
  }

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -70 }); }
      });
    });
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------- Reveal allo scroll ---------- */
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
    });

    gsap.utils.toArray('[data-reveal-group]').forEach(function (group) {
      gsap.fromTo(group.children,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: .85, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: group, start: 'top 86%', once: true }
        });
    });

    /* La nostra specialità: mazzo chiuso che si apre a ventaglio allo scroll
       (stessa meccanica della sezione "festa della mamma" del sito De Pellegrin) */
    (function fanDeck() {
      var deck = document.querySelector('.specialita-cards');
      var left = document.querySelector('.specialita-cards .fan-left');
      var center = document.querySelector('.specialita-cards .spec-card-center');
      var right = document.querySelector('.specialita-cards .fan-right');
      if (!deck || !left || !center || !right) return;

      var cards = [left, center, right];
      gsap.set(cards, { transition: 'none' });

      var closedRot = { left: 16, center: -22, right: -16 };
      var openRot = { left: -7, center: 2.5, right: 7 };
      var opened = false;

      function measureAndClose() {
        if (opened) return;
        gsap.set(cards, { clearProps: 'transform' });
        var cRect = center.getBoundingClientRect();
        var lRect = left.getBoundingClientRect();
        var rRect = right.getBoundingClientRect();
        var cx = cRect.left + cRect.width / 2, cy = cRect.top + cRect.height / 2;
        var dxLeft = cx - (lRect.left + lRect.width / 2);
        var dyLeft = cy - (lRect.top + lRect.height / 2);
        var dxRight = cx - (rRect.left + rRect.width / 2);
        var dyRight = cy - (rRect.top + rRect.height / 2);

        gsap.set(left, { x: dxLeft, y: dyLeft, rotation: closedRot.left, zIndex: 1 });
        gsap.set(center, { rotation: closedRot.center, zIndex: 2 });
        gsap.set(right, { x: dxRight, y: dyRight, rotation: closedRot.right, zIndex: 3 });
      }

      measureAndClose();
      window.addEventListener('nemicoLoaderDone', measureAndClose, { once: true });
      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(measureAndClose, 150);
      });

      ScrollTrigger.create({
        trigger: deck, start: 'top 82%', once: true,
        onEnter: function () {
          opened = true;
          gsap.to(left, { x: 0, y: 0, rotation: openRot.left, duration: 1.8, ease: 'expo.out' });
          gsap.to(center, { rotation: openRot.center, duration: 1.8, ease: 'expo.out', delay: 0.04 });
          gsap.to(right, {
            x: 0, y: 0, rotation: openRot.right, duration: 1.8, ease: 'expo.out', delay: 0.08,
            onComplete: function () { gsap.set(cards, { clearProps: 'transition' }); }
          });
        }
      });
    })();

    /* Divisore tratteggiato rosso: si disegna in orizzontale allo scroll */
    gsap.utils.toArray('.section-divider span').forEach(function (line) {
      gsap.set(line, { scaleX: 0 });
      gsap.to(line, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: line, start: 'top 85%', end: 'top 45%', scrub: true }
      });
    });
  } else {
    document.querySelectorAll('[data-reveal], [data-reveal-group] > *').forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
  }

  /* ---------- Recensioni: marquee di card, destra -> sinistra, reattivo allo scroll ---------- */
  var track = document.querySelector('[data-marquee-track]');
  if (track) {
    track.innerHTML += track.innerHTML;

    var half = 0;
    function measure() { half = track.scrollWidth / 2; }
    measure();
    window.addEventListener('resize', measure);

    var pos = 0;
    var idleSpeed = reduceMotion ? 0 : 34;
    var scrollFactor = 0.14;
    var lastScrollY = window.scrollY;

    function tick(now, dt) {
      if (!half) measure();
      pos -= idleSpeed * (dt / 1000);
      var sy = window.scrollY;
      var dy = sy - lastScrollY;
      if (dy) { pos -= dy * scrollFactor; lastScrollY = sy; }
      pos = ((pos % half) + half) % half;
      track.style.transform = 'translate3d(' + (-pos) + 'px,0,0)';
    }
    if (window.gsap) {
      gsap.ticker.add(function (t, dt) { tick(t, dt); });
    } else {
      var last = performance.now();
      (function loop(now) {
        tick(now, now - last); last = now;
        requestAnimationFrame(loop);
      })(last);
    }
  }

  /* ---------- Il locale: video ambientale rispetta prefers-reduced-motion ---------- */
  var ambientVideo = document.querySelector('.locale-video video');
  if (ambientVideo) {
    if (reduceMotion) {
      ambientVideo.removeAttribute('autoplay');
      ambientVideo.pause();
    } else if (window.IntersectionObserver) {
      var videoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var playPromise = ambientVideo.play();
            if (playPromise) playPromise.catch(function () {});
          } else {
            ambientVideo.pause();
          }
        });
      }, { threshold: 0.15 });
      videoObserver.observe(ambientVideo);
    }
  }

  /* ---------- Modulo prenotazione: redirect diretto su WhatsApp al titolare ---------- */
  var OWNER_WHATSAPP = '393472417355';

  function formatDataIt(iso) {
    var parts = (iso || '').split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function primoNome(nomeCompleto) {
    return (nomeCompleto || '').trim().split(/\s+/)[0] || '';
  }

  function buildRiepilogo(data) {
    return primoNome(data.nome) + ', la ringraziamo per la sua prenotazione da Il Nemico.\n' +
      'Ecco il riepilogo:\n\n' +
      'Persone: ' + data.persone + '\n\n' +
      'Data: ' + formatDataIt(data.data) + '\n\n' +
      'Ora: ' + data.ora + '\n\n' +
      'Tavolo: ' + data.tavolo + '\n\n' +
      'Nome: ' + data.nome + '\n\n' +
      'Telefono: ' + data.telefono;
  }

  var form = document.querySelector('.prenota-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fd = new FormData(form);
      var datiPrenotazione = {
        nome: fd.get('Nome'),
        telefono: fd.get('Telefono'),
        data: fd.get('Data'),
        ora: fd.get('Ora'),
        persone: fd.get('Persone'),
        tavolo: fd.get('Preferenza tavolo')
      };

      var riepilogo = buildRiepilogo(datiPrenotazione);
      var waUrl = 'https://wa.me/' + OWNER_WHATSAPP + '?text=' + encodeURIComponent(riepilogo);
      window.location.href = waUrl;
    });
  }

})();
