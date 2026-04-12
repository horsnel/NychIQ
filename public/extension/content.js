/* ══════════════════════════════════════════════════
   NychIQ Chrome Extension — Content Script
   Injects NychIQ badges & analysis overlay on YouTube
   ══════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'nychiq_ext_state';
  const NAMESPACE = 'nychiq-ext';
  let settings = { showBadges: true, autoAnalyze: false };
  let injected = false;

  /* ── Utility: Simulated scores ── */
  function randomScore(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getViralClass(score) {
    if (score >= 85) return 'nychiq-viral-high';
    if (score >= 60) return 'nychiq-viral-medium';
    return 'nychiq-viral-low';
  }

  function getViralLabel(score) {
    if (score >= 85) return '🔥 Viral';
    if (score >= 60) return '📈 Trending';
    return '📊 Normal';
  }

  function getScoreColor(score) {
    if (score >= 85) return '#10B981';
    if (score >= 60) return '#FDBA2D';
    return '#EF4444';
  }

  /* ── Inject CSS ── */
  function injectStyles() {
    if (document.getElementById(`${NAMESPACE}-styles`)) return;

    const style = document.createElement('style');
    style.id = `${NAMESPACE}-styles`;
    style.textContent = `
      /* ── Score badge on thumbnails ── */
      .nychiq-score-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 1000;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        backdrop-filter: blur(8px);
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 4px;
        opacity: 0;
        animation: nychiq-fade-in 0.4s ease forwards;
      }

      .nychiq-score-badge .nychiq-score-num {
        font-size: 12px;
        font-weight: 800;
      }

      .nychiq-score-badge .nychiq-score-label {
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .nychiq-viral-high {
        background: rgba(16, 185, 129, 0.85);
        color: #FFFFFF;
        border: 1px solid rgba(16, 185, 129, 0.4);
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      }

      .nychiq-viral-medium {
        background: rgba(253, 186, 45, 0.85);
        color: #000000;
        border: 1px solid rgba(253, 186, 45, 0.4);
        box-shadow: 0 2px 8px rgba(253, 186, 45, 0.3);
      }

      .nychiq-viral-low {
        background: rgba(0, 0, 0, 0.7);
        color: #A3A3A3;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      /* ── NychIQ floating button on video pages ── */
      .nychiq-analyze-btn {
        position: fixed;
        bottom: 80px;
        right: 24px;
        z-index: 9999;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #8B5CF6, #FDBA2D);
        color: #FFF;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(253, 186, 45, 0.3);
        transition: all 0.3s ease;
        animation: nychiq-slide-up 0.5s ease;
      }

      .nychiq-analyze-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(253, 186, 45, 0.4);
      }

      .nychiq-analyze-btn svg {
        width: 22px;
        height: 22px;
      }

      /* ── Analysis overlay panel ── */
      .nychiq-overlay {
        position: fixed;
        bottom: 140px;
        right: 24px;
        z-index: 9999;
        width: 340px;
        background: #141414;
        border: 1px solid #1F1F1F;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
        animation: nychiq-slide-up 0.4s ease;
      }

      .nychiq-overlay-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        border-bottom: 1px solid #1F1F1F;
        background: #0D0D0D;
      }

      .nychiq-overlay-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 700;
        color: #FFFFFF;
      }

      .nychiq-overlay-title span.amber { color: #FDBA2D; }

      .nychiq-overlay-close {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: transparent;
        border: 1px solid #1F1F1F;
        color: #666;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .nychiq-overlay-close:hover {
        background: #1F1F1F;
        color: #FFF;
      }

      .nychiq-overlay-body {
        padding: 16px;
      }

      .nychiq-metric-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #1F1F1F;
      }

      .nychiq-metric-row:last-child {
        border-bottom: none;
      }

      .nychiq-metric-label {
        font-size: 12px;
        color: #A3A3A3;
      }

      .nychiq-metric-value {
        font-size: 13px;
        font-weight: 700;
        color: #FFFFFF;
      }

      .nychiq-meter {
        width: 100%;
        height: 6px;
        background: #1F1F1F;
        border-radius: 3px;
        overflow: hidden;
        margin-top: 4px;
      }

      .nychiq-meter-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.8s ease;
      }

      .nychiq-overlay-footer {
        padding: 12px 16px;
        border-top: 1px solid #1F1F1F;
      }

      .nychiq-overlay-footer a {
        display: block;
        width: 100%;
        text-align: center;
        padding: 10px;
        border-radius: 10px;
        background: linear-gradient(135deg, #FDBA2D, #C69320);
        color: #000;
        font-size: 12px;
        font-weight: 700;
        text-decoration: none;
        transition: filter 0.2s;
      }

      .nychiq-overlay-footer a:hover {
        filter: brightness(1.1);
      }

      /* ── Animations ── */
      @keyframes nychiq-fade-in {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }

      @keyframes nychiq-slide-up {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  /* ── Add score badge to a thumbnail ── */
  function addScoreBadge(thumbnailContainer) {
    if (!thumbnailContainer || !settings.showBadges) return;

    const id = thumbnailContainer.dataset.nychiqScored;
    if (id) return;
    thumbnailContainer.dataset.nychiqScored = '1';

    const score = randomScore(30, 98);
    const engagement = randomScore(20, 95);
    const cls = getViralClass(score);
    const label = getViralLabel(score);

    const badge = document.createElement('div');
    badge.className = `nychiq-score-badge ${cls}`;
    badge.innerHTML = `
      <span class="nychiq-score-num">${score}</span>
      <span class="nychiq-score-label">${label.split(' ')[0]}</span>
    `;

    const anchor = thumbnailContainer.querySelector('a#thumbnail, a.ytd-thumbnail');
    if (anchor) {
      anchor.style.position = 'relative';
      anchor.appendChild(badge);
    }
  }

  /* ── Process thumbnails ── */
  function processThumbnails() {
    if (!settings.showBadges) return;

    const thumbnails = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer');
    thumbnails.forEach((item) => {
      addScoreBadge(item);
    });
  }

  /* ── Add floating analyze button (on video pages) ── */
  function addFloatingButton() {
    if (document.getElementById(`${NAMESPACE}-fab`)) return;
    if (!window.location.pathname.includes('/watch')) return;

    const btn = document.createElement('button');
    btn.id = `${NAMESPACE}-fab`;
    btn.className = 'nychiq-analyze-btn';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      </svg>
    `;
    btn.addEventListener('click', showAnalysisOverlay);
    document.body.appendChild(btn);
  }

  /* ── Show analysis overlay ── */
  function showAnalysisOverlay() {
    if (document.getElementById(`${NAMESPACE}-overlay`)) return;

    const viralScore = randomScore(45, 98);
    const engagementRate = randomScore(20, 95);
    const seoScore = randomScore(30, 92);
    const hookStrength = randomScore(40, 88);
    const retentionPred = randomScore(25, 85);

    const overlay = document.createElement('div');
    overlay.id = `${NAMESPACE}-overlay`;
    overlay.className = 'nychiq-overlay';
    overlay.innerHTML = `
      <div class="nychiq-overlay-header">
        <div class="nychiq-overlay-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M10 6L18 12L10 18V6Z" fill="#FDBA2D"/>
            <rect x="5" y="5" width="2.5" height="14" rx="1" fill="white"/>
          </svg>
          NY<span class="amber">CHIQ</span> Analysis
        </div>
        <button class="nychiq-overlay-close" id="${NAMESPACE}-close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="nychiq-overlay-body">
        <div class="nychiq-metric-row">
          <span class="nychiq-metric-label">🔥 Viral Score</span>
          <span class="nychiq-metric-value" style="color: ${getScoreColor(viralScore)}">${viralScore}/100</span>
        </div>
        <div class="nychiq-meter"><div class="nychiq-meter-fill" style="width: ${viralScore}%; background: ${getScoreColor(viralScore)};"></div></div>

        <div class="nychiq-metric-row" style="margin-top: 12px;">
          <span class="nychiq-metric-label">💬 Engagement Rate</span>
          <span class="nychiq-metric-value" style="color: ${getScoreColor(engagementRate)}">${engagementRate}%</span>
        </div>
        <div class="nychiq-meter"><div class="nychiq-meter-fill" style="width: ${engagementRate}%; background: ${getScoreColor(engagementRate)};"></div></div>

        <div class="nychiq-metric-row" style="margin-top: 12px;">
          <span class="nychiq-metric-label">🔍 SEO Score</span>
          <span class="nychiq-metric-value" style="color: ${getScoreColor(seoScore)}">${seoScore}/100</span>
        </div>
        <div class="nychiq-meter"><div class="nychiq-meter-fill" style="width: ${seoScore}%; background: ${getScoreColor(seoScore)};"></div></div>

        <div class="nychiq-metric-row" style="margin-top: 12px;">
          <span class="nychiq-metric-label">🪝 Hook Strength</span>
          <span class="nychiq-metric-value" style="color: ${getScoreColor(hookStrength)}">${hookStrength}/100</span>
        </div>

        <div class="nychiq-metric-row">
          <span class="nychiq-metric-label">⏱ Retention Prediction</span>
          <span class="nychiq-metric-value" style="color: ${getScoreColor(retentionPred)}">${retentionPred}%</span>
        </div>
      </div>
      <div class="nychiq-overlay-footer">
        <a href="https://nychiq.com" target="_blank">Open NychIQ Dashboard →</a>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById(`${NAMESPACE}-close`).addEventListener('click', () => {
      overlay.remove();
      document.getElementById(`${NAMESPACE}-fab`)?.remove();
    });
  }

  /* ── MutationObserver: watch for new thumbnails ── */
  function observeDOM() {
    const observer = new MutationObserver(() => {
      processThumbnails();
      if (window.location.pathname.includes('/watch')) {
        addFloatingButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /* ── Load settings ── */
  function loadSettings() {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const state = result[STORAGE_KEY] || {};
      settings.showBadges = state.showBadges !== false;
      settings.autoAnalyze = state.autoAnalyze === true;

      // Only inject if connected
      if (state.connected) {
        injectStyles();
        processThumbnails();
        addFloatingButton();
        observeDOM();
        injected = true;
      }
    });
  }

  /* ── Message handler ── */
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'ANALYZE_PAGE') {
      showAnalysisOverlay();
    }
    if (msg.type === 'SETTINGS_CHANGED') {
      settings = msg.settings;
      if (settings.showBadges) {
        if (!injected) {
          injectStyles();
          processThumbnails();
          observeDOM();
          injected = true;
        } else {
          processThumbnails();
        }
      }
    }
    if (msg.type === 'REINJECT') {
      if (!injected) {
        loadSettings();
      }
    }
  });

  /* ── Init ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSettings);
  } else {
    loadSettings();
  }
})();
