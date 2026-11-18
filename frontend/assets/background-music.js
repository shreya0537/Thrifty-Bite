/* Thrifty Bite soft ambient music. Uses Web Audio so no external audio file is needed. */
(function () {
  "use strict";
  const PREF_KEY = "thriftyBitePreferences";
  const MUSIC_KEY = "thriftyBiteMusic";
  let ctx = null, master = null, timer = null, noteIndex = 0, started = false;
  // A gentle, repeating pentatonic melody in C major.
  const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880.00, 698.46,
                  523.25, 659.25, 783.99, 1046.50, 880.00, 783.99, 659.25, 587.33];
  function enabled() {
    try {
      const saved = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
      if (typeof saved.welcomeMusic === "boolean") return saved.welcomeMusic;
    } catch (_) {}
    return localStorage.getItem(MUSIC_KEY) !== "off";
  }
  function playNote() {
    if (!ctx || !master || !enabled() || document.hidden) return;
    const now = ctx.currentTime;
    const freq = melody[noteIndex++ % melody.length];
    // Main bell-like note.
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);
    osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + 0.55);
    // Quiet supporting harmony on alternating notes.
    if (noteIndex % 2 === 1) {
      const pad = ctx.createOscillator(), pg = ctx.createGain();
      pad.type = "triangle"; pad.frequency.setValueAtTime(freq / 2, now);
      pg.gain.setValueAtTime(0.0001, now);
      pg.gain.exponentialRampToValueAtTime(0.025, now + 0.08);
      pg.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      pad.connect(pg); pg.connect(master); pad.start(now); pad.stop(now + 0.82);
    }
  }
  async function start() {
    if (!enabled()) { stop(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { updateButton("Audio is not supported by this browser"); return; }
      if (!ctx) {
        ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
      }
      await ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.22, ctx.currentTime, 0.12);
      if (!started) {
        started = true;
        playNote();
        timer = window.setInterval(playNote, 520);
      }
      updateButton("Music is playing. Click to mute.");
    } catch (err) { updateButton("Click to start music"); }
  }
  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null; started = false;
    if (master && ctx) {
      try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, 0.06); } catch (_) {}
    }
    updateButton();
  }
  function refresh() {
    if (!enabled()) stop();
    else if (started && master && ctx) {
      try { master.gain.setTargetAtTime(0.22, ctx.currentTime, 0.12); } catch (_) {}
      updateButton("Music is playing. Click to mute.");
    } else updateButton("Music is enabled. Click to start playback.");
  }
  let control;
  function updateButton(title) {
    if (!control) return;
    control.textContent = !enabled() ? "♫ Music muted" : (started ? "♫ Music playing" : "♫ Start music");
    control.setAttribute("aria-pressed", enabled() && started ? "true" : "false");
    control.title = title || (!enabled() ? "Music is muted. Click to enable and play." : "Music is enabled. Click to start playback.");
  }
  function saveEnabled(value) {
    let prefs = {}; try { prefs = JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); } catch (_) {}
    prefs.welcomeMusic = value;
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    localStorage.setItem(MUSIC_KEY, value ? "on" : "off");
    const checkbox = document.getElementById("welcomeMusic"); if (checkbox) checkbox.checked = value;
    const msg = document.getElementById("preferencesMessage"); if (msg) msg.textContent = value ? "Background music enabled. Click Start music if playback has not begun." : "Background music muted.";
  }
  function makeControl() {
    if (document.getElementById("tbAmbientMusicControl")) return;
    control = document.createElement("button");
    control.id = "tbAmbientMusicControl"; control.type = "button";
    control.textContent = enabled() ? "♫ Start music" : "♫ Music muted";
    control.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:10000;border:1px solid rgba(212,175,55,.7);border-radius:999px;padding:11px 15px;background:#2b0714;color:#fff1b8;font:600 12px 'DM Sans',sans-serif;box-shadow:0 4px 18px #0003;cursor:pointer";
    control.addEventListener("click", async function () {
      if (!enabled()) { saveEnabled(true); await start(); return; }
      if (!started) { await start(); return; }
      saveEnabled(false); stop();
    });
    document.body.appendChild(control); updateButton();
  }
  document.addEventListener("DOMContentLoaded", function () {
    makeControl();
    // Autoplay is blocked by browsers until the visitor interacts. The floating control
    // is an explicit Start/Mute control; any other first interaction can also start it.
    function firstGesture(event) {
      if (event && event.target && event.target.closest && event.target.closest("#tbAmbientMusicControl")) return;
      if (enabled()) start();
    }
    ["pointerdown", "keydown", "touchstart"].forEach(ev => document.addEventListener(ev, firstGesture, { once: true, passive: true }));
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (master && ctx) { try { master.gain.setTargetAtTime(0, ctx.currentTime, .1); } catch (_) {} }
      } else if (enabled()) start();
    });
    window.addEventListener("storage", refresh);
  });
  window.ThriftyBiteMusic = { refresh, start, stop, isEnabled: enabled };
})();
