/**
 * CMEase Navigation Agent
 *
 * Injected into the WebView player. Automates mechanical CME course navigation:
 * dismissing popups, scrolling, advancing sections, filling evaluations, and
 * claiming credit.
 *
 * CRITICAL: The agent NEVER interacts with quiz/post-test questions.
 * Step 1 of every loop is quiz detection — if a quiz is found, the loop
 * halts and sends 'quiz_detected' to React Native.
 */

export const CMEASE_AGENT: string = `
(function () {
  // ─── Guard against double-injection ────────────────────────────────────────
  if (window.__cmease_agent_running) { return; }
  window.__cmease_agent_running = true;

  // ─── Messaging ─────────────────────────────────────────────────────────────
  function send(type, data) {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(
          Object.assign({ type: type }, data || {})
        ));
      }
    } catch (e) {}
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────
  function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function safeClick(el) {
    if (!el || el.__cmease_clicked) return false;
    try {
      el.__cmease_clicked = true;
      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      el.click();
      setTimeout(function () { el.__cmease_clicked = false; }, 3000);
      return true;
    } catch (e) {
      el.__cmease_clicked = false;
      return false;
    }
  }

  function queryFirst(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      try {
        var el = document.querySelector(selectors[i]);
        if (el && isVisible(el)) return el;
      } catch (e) {}
    }
    return null;
  }

  function queryAll(selectors) {
    var results = [];
    for (var i = 0; i < selectors.length; i++) {
      try {
        var els = document.querySelectorAll(selectors[i]);
        for (var j = 0; j < els.length; j++) {
          if (isVisible(els[j]) && results.indexOf(els[j]) === -1) {
            results.push(els[j]);
          }
        }
      } catch (e) {}
    }
    return results;
  }

  function isVisible(el) {
    if (!el) return false;
    try {
      var rect = el.getBoundingClientRect();
      var style = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    } catch (e) {
      return false;
    }
  }

  function scrollDepth() {
    try {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return 1.0;
      return Math.min(1.0, (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight);
    } catch (e) {
      return 0;
    }
  }

  function textMatches(el, patterns) {
    if (!el) return false;
    var text = (el.textContent || el.innerText || el.value || '').toLowerCase().trim();
    for (var i = 0; i < patterns.length; i++) {
      if (text.indexOf(patterns[i]) !== -1) return true;
    }
    return false;
  }

  // ─── Provider Action Maps ───────────────────────────────────────────────────
  var ACTION_MAPS = {
    'medscape.com': {
      quizUrls: ['/quiz', '/posttest', '/assessment', '/exam'],
      quizSelectors: ['.quiz-container', '#quiz-container', '[class*="quiz-form"]',
                      '[class*="posttest"]', '[class*="post-test"]'],
      popups: ['.modal-close', '.cookie-banner .close', '#onetrust-accept-btn-handler',
               '[aria-label="Close"]', '[aria-label="close"]', '.dismiss-btn',
               '[class*="modal-close"]', '[class*="close-button"]',
               'button[class*="close"]'],
      terms: ['#chk_termsCondition', '[name*="terms"]', '[name*="agree"]',
              'input[type="checkbox"][id*="terms"]', 'input[type="checkbox"][id*="agree"]'],
      startActivity: ['.btn-start-activity', '[class*="start-activity"]',
                      'a[class*="launch"]', '.launch-activity',
                      'button[class*="start"]', 'a[class*="start"]'],
      nextPage: ['.btn-next', '.next-page', '[class*="next-page"]',
                 'a[class*="btn-next"]', 'button[class*="next"]',
                 '[aria-label="Next"]', '[aria-label="next page"]',
                 'a.rightArrow', '[class*="rightarrow"]'],
      claimCredit: ['[class*="claim-credit"]', '.btn-credit', 'a[href*="credit"]',
                    'button[class*="credit"]', '[class*="getcme"]', '[class*="get-cme"]',
                    'a[class*="certificate"]', '.download-certificate'],
      evalContainer: ['.evaluation-form', '[class*="evaluation"]', '.survey-form',
                      '[id*="evaluation"]', '[class*="feedback-form"]'],
      videoNext: ['.brightcove-next', '[class*="video-next"]', '[aria-label="Next video"]',
                  '.vjs-next-button', '[class*="next-segment"]'],
      continueBtn: ['.btn-continue', 'button[class*="continue"]', '[aria-label="Continue"]'],
    },
    'aafp.org': {
      quizUrls: ['/assessment', '/quiz', '/exam', '/posttest'],
      quizSelectors: ['.question-container', '#quiz-wrapper', '[class*="quiz"]',
                      '[class*="assessment-question"]', '.test-question'],
      popups: ['#onetrust-accept-btn-handler', '.modal-close', '[aria-label="Close"]',
               '.cookie-accept', '[class*="close-modal"]', '.dialog-close'],
      terms: ['[name*="terms"]', 'input[type="checkbox"][class*="agree"]'],
      startActivity: ['.launch-btn', '[data-track="course-launch"]', '.btn-launch',
                      '[class*="launch-course"]', 'button[class*="start"]',
                      'a[href*="/courses/"][class*="btn"]'],
      nextPage: ['.btn-primary[aria-label*="Next"]', '.continue-btn',
                 'button[class*="next-lesson"]', '[class*="module-next"]',
                 '[aria-label="Next lesson"]', '.lesson-next-btn',
                 'button[data-action="next"]'],
      claimCredit: ['.claim-cme-btn', '[class*="claim-cme"]', 'a[href*="credit"]',
                    '[class*="earn-credit"]', '.certificate-link'],
      evalContainer: ['.evaluation-container', '[class*="course-evaluation"]',
                      '.feedback-section', '[id*="eval"]'],
      videoNext: ['.video-next-btn', '[aria-label="Next video"]', '.next-video'],
      continueBtn: ['.btn-continue', '[class*="continue-learning"]'],
    },
    'pri-med.com': {
      quizUrls: ['/quiz', '/assessment', '/test', '/exam'],
      quizSelectors: ['[class*="quiz-question"]', '.assessment-question',
                      '#question-container', '[class*="test-form"]'],
      popups: ['[aria-label="Close"]', '.modal__close', '.popup-close',
               '#onetrust-accept-btn-handler', '[class*="dismiss"]'],
      terms: ['input[type="checkbox"][name*="terms"]', '[id*="accept"]'],
      startActivity: ['.btn-launch-course', '[class*="launch-activity"]',
                      '.start-course-btn', 'button[class*="launch"]',
                      'a[class*="start-learning"]'],
      nextPage: ['.btn-next-page', '[class*="next-lesson"]', '.lesson-continue',
                 '[data-action="next"]', 'button[class*="advance"]',
                 '[aria-label="Next"]', '.next-module-btn'],
      claimCredit: ['.claim-credit-button', '[class*="redeem-credit"]',
                    'a[href*="certificate"]', '[class*="download-cert"]'],
      evalContainer: ['.evaluation', '.program-evaluation', '[class*="course-eval"]'],
      videoNext: ['.video-next', '[aria-label="Next segment"]', '.segment-advance'],
      continueBtn: ['button[class*="continue"]', '.proceed-btn'],
    },
    'edhub.ama-assn.org': {
      quizUrls: ['/assessment/', '/exam/', '/quiz/', '/test/'],
      quizSelectors: ['[class*="assessment-question"]', '.exam-question',
                      '#assessment-container', '[class*="quiz-item"]'],
      popups: ['#onetrust-accept-btn-handler', '[aria-label="Close"]',
               '.modal-header .close', '[class*="close-dialog"]'],
      terms: ['input[type="checkbox"][name*="terms"]', '[id*="agree"]'],
      startActivity: ['.activity-launch-btn', '[data-action="launch"]',
                      '.start-activity', 'button[class*="launch"]',
                      'a[class*="begin-activity"]'],
      nextPage: ['.module-next-btn', '[class*="continue-module"]',
                 'button[class*="next-step"]', '[aria-label="Continue"]',
                 '.advance-btn', '[data-action="next"]'],
      claimCredit: ['[class*="claim-credit"]', '.credit-button',
                    'a[href*="certificate"]', '[class*="download-cert"]',
                    'button[class*="get-credit"]'],
      evalContainer: ['.activity-evaluation', '[class*="course-feedback"]',
                      '.evaluation-form', '[id*="evaluation"]'],
      videoNext: ['.next-video-btn', '[aria-label="Next video"]', '.playlist-next'],
      continueBtn: ['.continue-btn', 'button[class*="proceed"]'],
    }
  };

  // Generic fallback selectors used when domain isn't specifically mapped
  var GENERIC_MAP = {
    quizUrls: ['/quiz', '/posttest', '/assessment', '/exam', '/test'],
    quizSelectors: ['[class*="quiz"]', '[class*="post-test"]', '[class*="posttest"]',
                    '[class*="assessment-q"]', '[class*="exam-q"]'],
    popups: ['#onetrust-accept-btn-handler', '[aria-label="Close"]', '.modal-close',
             '.cookie-accept', '[class*="dismiss"]', '[class*="close-btn"]',
             'button[class*="close"]'],
    terms: ['input[type="checkbox"][name*="terms"]', 'input[type="checkbox"][id*="agree"]',
            'input[type="checkbox"][name*="accept"]'],
    startActivity: ['button[class*="start"]', 'a[class*="launch"]', 'button[class*="launch"]',
                    'a[class*="begin"]', 'button[class*="begin"]'],
    nextPage: ['[aria-label="Next"]', 'button[class*="next"]', 'a[class*="next"]',
               'button[class*="continue"]', 'a[class*="continue"]'],
    claimCredit: ['[class*="claim-credit"]', '[class*="get-credit"]', 'a[href*="certificate"]'],
    evalContainer: ['[class*="evaluation"]', '[class*="survey"]', '[class*="feedback"]'],
    videoNext: ['[aria-label="Next video"]', '[class*="video-next"]'],
    continueBtn: ['button[class*="continue"]', '[aria-label="Continue"]'],
  };

  function getMap() {
    var hostname = window.location.hostname.replace(/^www\\./, '');
    for (var domain in ACTION_MAPS) {
      if (hostname === domain || hostname.indexOf(domain) !== -1) {
        return ACTION_MAPS[domain];
      }
    }
    return GENERIC_MAP;
  }

  // ─── Step 1: Quiz Detection ─────────────────────────────────────────────────
  function isQuizPage() {
    var url = window.location.href.toLowerCase();
    var map = getMap();

    // URL-based detection
    for (var i = 0; i < map.quizUrls.length; i++) {
      if (url.indexOf(map.quizUrls[i]) !== -1) return true;
    }

    // DOM-based detection: quiz container selectors
    for (var j = 0; j < map.quizSelectors.length; j++) {
      try {
        var el = document.querySelector(map.quizSelectors[j]);
        if (el && isVisible(el)) return true;
      } catch (e) {}
    }

    // Heuristic: 3+ visible radio-button groups that are NOT inside eval containers
    try {
      var allRadios = document.querySelectorAll('input[type="radio"]');
      var groupNames = {};
      var inEvalCount = 0;
      for (var k = 0; k < allRadios.length; k++) {
        var radio = allRadios[k];
        if (!isVisible(radio)) continue;
        var inEval = false;
        for (var m = 0; m < map.evalContainer.length; m++) {
          try {
            if (radio.closest(map.evalContainer[m])) { inEval = true; break; }
          } catch (e) {}
        }
        if (!inEval && radio.name) groupNames[radio.name] = true;
      }
      if (Object.keys(groupNames).length >= 3) return true;
    } catch (e) {}

    return false;
  }

  // ─── Step 2: Dismiss Popups ─────────────────────────────────────────────────
  function dismissPopups() {
    var map = getMap();
    var el = queryFirst(map.popups);
    if (el) {
      send('action', { action: 'dismiss_popup', text: el.textContent.trim().slice(0, 60) });
      safeClick(el);
      return true;
    }
    return false;
  }

  // ─── Step 3: Accept Terms ────────────────────────────────────────────────────
  function acceptTerms() {
    var map = getMap();
    // Check all matching checkboxes
    var checkboxes = queryAll(map.terms);
    var acted = false;
    for (var i = 0; i < checkboxes.length; i++) {
      var cb = checkboxes[i];
      if (cb.type === 'checkbox' && !cb.checked) {
        cb.checked = true;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
        acted = true;
      }
    }
    // Click any adjacent continue button
    if (acted) {
      send('action', { action: 'accept_terms', text: 'Accepted terms' });
      var contBtn = queryFirst(map.continueBtn);
      if (contBtn && textMatches(contBtn, ['continue', 'agree', 'accept', 'proceed', 'next'])) {
        setTimeout(function () { safeClick(contBtn); }, randomDelay(600, 1200));
      }
      return true;
    }
    return false;
  }

  // ─── Step 4: Fill Evaluations ────────────────────────────────────────────────
  var __evalFilled = false;
  function fillEvaluations() {
    if (__evalFilled) return false;
    var map = getMap();
    var evalContainers = queryAll(map.evalContainer);
    if (evalContainers.length === 0) return false;

    var acted = false;
    for (var c = 0; c < evalContainers.length; c++) {
      var container = evalContainers[c];

      // Radio buttons: select second-to-last option per group
      var radioGroups = {};
      try {
        var radios = container.querySelectorAll('input[type="radio"]');
        for (var r = 0; r < radios.length; r++) {
          var radio = radios[r];
          if (!radio.name) continue;
          if (!radioGroups[radio.name]) radioGroups[radio.name] = [];
          radioGroups[radio.name].push(radio);
        }
        for (var groupName in radioGroups) {
          var group = radioGroups[groupName];
          if (group.length < 2) continue;
          var target = group[group.length - 2]; // second-to-last
          if (!target.checked) {
            target.checked = true;
            target.dispatchEvent(new Event('change', { bubbles: true }));
            acted = true;
          }
        }
      } catch (e) {}

      // Textareas: fill with neutral text if empty
      try {
        var textareas = container.querySelectorAll('textarea');
        for (var t = 0; t < textareas.length; t++) {
          var ta = textareas[t];
          if (!ta.value || ta.value.trim() === '') {
            ta.value = 'Informative and relevant content.';
            ta.dispatchEvent(new Event('input', { bubbles: true }));
            ta.dispatchEvent(new Event('change', { bubbles: true }));
            acted = true;
          }
        }
      } catch (e) {}
    }

    if (acted) {
      send('action', { action: 'fill_evaluation', text: 'Filled evaluation form' });
      // Submit after delay
      __evalFilled = true;
      setTimeout(function () {
        var submitSelectors = [
          'button[type="submit"]', 'input[type="submit"]',
          'button[class*="submit"]', 'button[class*="save-eval"]',
          '[class*="submit-eval"]'
        ];
        var submitBtn = queryFirst(submitSelectors);
        if (submitBtn && textMatches(submitBtn, ['submit', 'save', 'send', 'complete'])) {
          safeClick(submitBtn);
          send('action', { action: 'submit_evaluation', text: 'Submitted evaluation' });
        }
      }, randomDelay(1500, 2500));
      return true;
    }
    return false;
  }

  // ─── Step 5: Start Activity ──────────────────────────────────────────────────
  function clickStartActivity() {
    var map = getMap();
    var el = queryFirst(map.startActivity);
    if (el && textMatches(el, ['start', 'launch', 'begin', 'open', 'view activity'])) {
      send('action', { action: 'start_activity', text: el.textContent.trim().slice(0, 60) });
      safeClick(el);
      return true;
    }
    return false;
  }

  // ─── Step 6: Video Advance ───────────────────────────────────────────────────
  function handleVideo() {
    var map = getMap();

    // Check for ended video players
    var videoEnded = false;
    try {
      var videos = document.querySelectorAll('video');
      for (var i = 0; i < videos.length; i++) {
        if (videos[i].ended || (videos[i].paused && videos[i].currentTime > 0 &&
            videos[i].currentTime >= videos[i].duration - 0.5)) {
          videoEnded = true;
          break;
        }
      }
    } catch (e) {}

    if (videoEnded) {
      var nextBtn = queryFirst(map.videoNext);
      if (nextBtn) {
        send('action', { action: 'video_advance', text: 'Advancing to next video segment' });
        safeClick(nextBtn);
        return true;
      }
    }
    return false;
  }

  // ─── Step 7: Scroll & Advance ────────────────────────────────────────────────
  var __scrollTick = 0;
  var __claimedCredit = false;

  function smoothScrollDown() {
    try {
      var px = randomDelay(2, 5);
      window.scrollBy({ top: px, behavior: 'instant' });
      __scrollTick++;
      // Send status every ~30 ticks
      if (__scrollTick % 30 === 0) {
        var depth = Math.round(scrollDepth() * 100);
        send('status', { text: 'Scrolling\u2026 ' + depth + '%', scrollDepth: depth });
      }
    } catch (e) {}
  }

  function scrollAndAdvance() {
    var depth = scrollDepth();
    var map = getMap();

    if (depth >= 0.85) {
      // Try next page button
      var nextBtn = queryFirst(map.nextPage);
      if (nextBtn) {
        send('action', { action: 'next_page', text: nextBtn.textContent.trim().slice(0, 60) });
        safeClick(nextBtn);
        return;
      }
      // Try continue
      var contBtn = queryFirst(map.continueBtn);
      if (contBtn && textMatches(contBtn, ['continue', 'next', 'proceed', 'advance'])) {
        send('action', { action: 'continue', text: contBtn.textContent.trim().slice(0, 60) });
        safeClick(contBtn);
        return;
      }
    } else {
      smoothScrollDown();
    }
  }

  // ─── Step 8: Claim Credit ────────────────────────────────────────────────────
  function claimCredit() {
    if (__claimedCredit) return false;
    var map = getMap();
    var el = queryFirst(map.claimCredit);
    if (el) {
      var text = (el.textContent || el.innerText || '').toLowerCase();
      if (text.indexOf('claim') !== -1 || text.indexOf('credit') !== -1 ||
          text.indexOf('certificate') !== -1 || text.indexOf('download') !== -1) {
        __claimedCredit = true;
        send('action', { action: 'claim_credit', text: el.textContent.trim().slice(0, 60) });
        send('course_complete', { url: window.location.href });
        setTimeout(function () { safeClick(el); }, randomDelay(500, 1000));
        return true;
      }
    }
    return false;
  }

  // ─── Main Loop ────────────────────────────────────────────────────────────────
  send('agent_loaded', { domain: window.location.hostname });

  function runLoop() {
    try {
      // ── Step 1: Quiz guard ──
      if (isQuizPage()) {
        send('quiz_detected', { url: window.location.href });
        setTimeout(runLoop, 5000);
        return;
      }

      // ── Step 2-8: Execute in priority order ──
      var acted = false;

      if (!acted) acted = dismissPopups();
      if (!acted) acted = acceptTerms();
      if (!acted) acted = fillEvaluations();
      if (!acted) acted = clickStartActivity();
      if (!acted) acted = handleVideo();
      if (!acted) acted = claimCredit();
      if (!acted) scrollAndAdvance();

    } catch (e) {
      // Catch-all: never crash the loop
      send('status', { text: 'Agent error: ' + String(e).slice(0, 80) });
    }

    var delay = randomDelay(500, 2000) + (window.__cmease_quiz_pause ? 3000 : 0);
    setTimeout(runLoop, delay);
  }

  // Small initial delay to let page settle
  setTimeout(runLoop, randomDelay(800, 1500));

})();
true;
`;
