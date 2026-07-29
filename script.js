// ==============================
// EVENT CONFIGURATION
// Change these values to reuse this site for any event.
// ==============================
const EVENT_NAME     = "Carry the Flame";
const CHURCH_NAME    = "Acts Church";
const EVENT_VENUE    = "Soshanguve Campus";

// Primary night (e.g. the opening / anointing night)
const EVENT_DATE     = "2026-07-29T18:30:00+02:00"; // ISO 8601, Africa/Johannesburg (UTC+2)
const EVENT_DATE_LABEL = "29 – 30 JULY";
const EVENT_TIME_LABEL = "6:30PM";
const EVENT_NIGHT_LABEL = "ANOINTING FRIDAY";

// Optional second night shown under the countdown (set to null to hide)
const EVENT_DATE_2_LABEL = "31 JULY";
const EVENT_TIME_2_LABEL = "6:30PM";

// The countdown itself always targets EVENT_DATE above.
// ==============================

(function(){
  "use strict";

  // ---- Populate static event info from config ----
  document.getElementById("eventDateRow").innerHTML =
    `<span class="event-info__date">${EVENT_DATE_LABEL}</span><span class="event-info__dot" aria-hidden="true">•</span><span class="event-info__time">${EVENT_TIME_LABEL}</span>`;
  document.getElementById("eventNightLabel").textContent = EVENT_NIGHT_LABEL;

  if (EVENT_DATE_2_LABEL) {
    document.getElementById("eventDateRow2").innerHTML =
      `<span class="event-info__date">${EVENT_DATE_2_LABEL}</span><span class="event-info__dot" aria-hidden="true">•</span><span class="event-info__time">${EVENT_TIME_2_LABEL}</span>`;
  } else {
    document.getElementById("eventDateRow2").style.display = "none";
  }

  document.getElementById("eventVenue").textContent = EVENT_VENUE.toUpperCase();
  document.getElementById("footerChurchName").textContent = CHURCH_NAME.toUpperCase();
  document.title = `${EVENT_NAME} — ${CHURCH_NAME}`;

  // ---- Countdown logic ----
  const targetTime = new Date(EVENT_DATE).getTime();
  const grid = document.getElementById("countdownGrid");
  const countdownEl = document.getElementById("countdown");
  const zeroEl = document.getElementById("countdownZero");
  const eyebrowEl = document.getElementById("heroEyebrow");

  let timerId = null;
  let lastRendered = null; // remembers previous unit values to trigger pop animation

  function buildUnitEl(labelText){
    const wrap = document.createElement("div");
    wrap.className = "countdown__unit";
    const num = document.createElement("div");
    num.className = "countdown__number";
    num.setAttribute("data-val", "00");
    num.textContent = "00";
    const label = document.createElement("div");
    label.className = "countdown__label";
    label.textContent = labelText;
    wrap.appendChild(num);
    wrap.appendChild(label);
    return { wrap, num };
  }

  function buildSeparator(){
    const sep = document.createElement("div");
    sep.className = "countdown__sep";
    sep.textContent = ":";
    sep.setAttribute("aria-hidden", "true");
    return sep;
  }

  function pad(n){ return String(n).padStart(2, "0"); }

  function render(diffMs){
    if (diffMs <= 0){
      countdownEl.hidden = true;
      zeroEl.hidden = false;
      eyebrowEl.textContent = "";
      if (timerId) { clearInterval(timerId); timerId = null; }
      return;
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days    = Math.floor(totalSeconds / 86400);
    const hours   = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Decide which units to display: drop leading zero-value units,
    // but always keep at least minutes + seconds visible.
    const showDays  = days > 0;
    const showHours = days > 0 || hours > 0;

    const units = [];
    if (showDays)  units.push({ key:"days",  value: days,  label: days === 1 ? "DAY" : "DAYS" });
    if (showHours) units.push({ key:"hours", value: hours, label: "HOURS" });
    units.push({ key:"minutes", value: minutes, label: "MINUTES" });
    units.push({ key:"seconds", value: seconds, label: "SECONDS" });

    const signature = units.map(u => u.key).join(",");
    if (signature !== (lastRendered && lastRendered.signature)) {
      // structure changed (a unit appeared/disappeared) — rebuild DOM
      grid.innerHTML = "";
      const elements = {};
      units.forEach((u, i) => {
        const { wrap, num } = buildUnitEl(u.label);
        elements[u.key] = num;
        grid.appendChild(wrap);
        if (i < units.length - 1) grid.appendChild(buildSeparator());
      });
      lastRendered = { signature, elements, values: {} };
    }

    units.forEach(u => {
      const el = lastRendered.elements[u.key];
      const padded = pad(u.value);
      if (lastRendered.values[u.key] !== padded){
        el.textContent = padded;
        el.setAttribute("data-val", padded);
        el.classList.remove("is-updating");
        // force reflow so the animation can retrigger every second
        void el.offsetWidth;
        el.classList.add("is-updating");
        lastRendered.values[u.key] = padded;
      }
    });

    // Adaptive eyebrow phrase, e.g. "1 DAY 7 HOURS TO GO" / "23 HOURS TO GO" / "45 MINUTES TO GO"
    let phrase;
    if (days > 0){
      phrase = `${days} ${days === 1 ? "DAY" : "DAYS"}${hours > 0 ? " " + hours + " " + (hours === 1 ? "HOUR" : "HOURS") : ""} TO GO`;
    } else if (hours > 0){
      phrase = `${hours} ${hours === 1 ? "HOUR" : "HOURS"} TO GO`;
    } else if (minutes > 0){
      phrase = `${minutes} ${minutes === 1 ? "MINUTE" : "MINUTES"} TO GO`;
    } else {
      phrase = `${seconds} SECONDS TO GO`;
    }
    eyebrowEl.textContent = phrase;
  }

  function tick(){
    const diff = targetTime - Date.now();
    render(diff);
  }

  tick();
  timerId = setInterval(tick, 1000);

  // ---- Ember particle canvas ----
  const canvas = document.getElementById("emberCanvas");
  const ctx = canvas.getContext("2d");
  let particles = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resizeCanvas(){
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }

  function makeParticle(){
    return {
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + Math.random() * 100,
      r: 1 + Math.random() * 2.2,
      speed: 0.3 + Math.random() * 0.9,
      drift: (Math.random() - 0.5) * 0.6,
      life: 0,
      maxLife: 400 + Math.random() * 400,
      hue: Math.random() < 0.5 ? "255,122,26" : "255,194,75",
      flicker: Math.random() * Math.PI * 2
    };
  }

  function initParticles(){
    const count = window.innerWidth < 600 ? 26 : 46;
    particles = Array.from({ length: count }, makeParticle);
  }

  function stepParticles(){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach(p => {
      p.y -= p.speed;
      p.x += p.drift + Math.sin(p.flicker) * 0.15;
      p.flicker += 0.05;
      p.life++;

      const lifeRatio = p.life / p.maxLife;
      const opacity = lifeRatio < 0.15
        ? lifeRatio / 0.15
        : lifeRatio > 0.85
          ? (1 - lifeRatio) / 0.15
          : 1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue}, ${Math.max(0, Math.min(1, opacity)) * 0.8})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `rgba(${p.hue}, 0.8)`;
      ctx.fill();

      if (p.life >= p.maxLife || p.y < -20) {
        Object.assign(p, makeParticle(), { y: window.innerHeight + Math.random() * 60 });
      }
    });

    requestAnimationFrame(stepParticles);
  }

  resizeCanvas();
  initParticles();
  window.addEventListener("resize", () => {
    resizeCanvas();
    initParticles();
  });

  if (!reduceMotion) {
    requestAnimationFrame(stepParticles);
  } else {
    // draw a single static frame so embers still appear subtly
    stepParticles();
  }

  // ---- Optional music playlist and autoplay ----
  const AUDIO_PLAYLIST = [
    "assets/song1.mpeg",
    "assets/song2.mpeg",
    "assets/song3.mpeg"
  ];
  let currentTrackIndex = 0;
  let autoPlayAttempted = false;
  const audioPlayer = new Audio();
  audioPlayer.preload = "auto";
  audioPlayer.autoplay = true;
  audioPlayer.playsInline = true;
  audioPlayer.volume = 0.5;
  audioPlayer.loop = false;

  function loadTrack(index){
    if (!AUDIO_PLAYLIST.length) return;
    currentTrackIndex = (index + AUDIO_PLAYLIST.length) % AUDIO_PLAYLIST.length;
    audioPlayer.src = AUDIO_PLAYLIST[currentTrackIndex];
    audioPlayer.load();
  }

  function playTrack(){
    if (!AUDIO_PLAYLIST.length) return;
    if (!audioPlayer.src) loadTrack(currentTrackIndex);
    audioPlayer.play().catch((err) => {
      console.warn("Audio autoplay blocked or failed:", err);
    });
  }

  audioPlayer.addEventListener("ended", () => {
    loadTrack(currentTrackIndex + 1);
    playTrack();
  });

  function startPlayback(){
    if (!AUDIO_PLAYLIST.length) return;
    if (!audioPlayer.src) loadTrack(currentTrackIndex);
    playTrack();
  }

  function resumeOnGesture(){
    if (autoPlayAttempted) return;
    autoPlayAttempted = true;
    startPlayback();
  }

  document.addEventListener("DOMContentLoaded", () => {
    startPlayback();
    ["click", "keydown", "touchstart"].forEach((eventName) => {
      document.addEventListener(eventName, resumeOnGesture, { once: true });
    });
  });


  // ---- Poster lightbox behavior ----
  const posterButton = document.getElementById('eventPosterButton');
  const posterLightbox = document.getElementById('posterLightbox');
  const posterClose = posterLightbox && posterLightbox.querySelector('.poster-lightbox__close');

  if (posterButton && posterLightbox) {
    function openPoster(){
      posterLightbox.removeAttribute('hidden');
      // prevent background scrolling while lightbox is open
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.overflow = 'hidden';
      if (posterClose) posterClose.focus();
    }
    function closePoster(){
      posterLightbox.setAttribute('hidden', '');
      document.body.style.overflow = '';
      posterButton.focus();
    }

    posterButton.addEventListener('click', openPoster);
    posterClose && posterClose.addEventListener('click', closePoster);

    // Close when clicking backdrop / outside the content
    posterLightbox.addEventListener('click', (e) => {
      if (e.target === posterLightbox || e.target.hasAttribute('data-dismiss')) {
        closePoster();
      }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (!posterLightbox.hasAttribute('hidden') && e.key === 'Escape') {
        closePoster();
      }
    });
  }

})();
