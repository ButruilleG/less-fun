(async function() {
  'use strict';
  console.log("Less-Fun extension: politics-filter.js loaded");

  const subredditBlocklist = await fetch(chrome.runtime.getURL('reddit/political-subreddits.txt'))
    .then(response => response.text())
    .then(text => text.split('\n').filter(s => s.trim().length > 0));

  const ragebaitBlocklist = await fetch(chrome.runtime.getURL('reddit/political-terms.txt'))
    .then(response => response.text())
    .then(text => text.split('\n').filter(s => s.trim().length > 0 && !s.startsWith('#')));

  const ragebaitRegexps = ragebaitBlocklist.map(pattern => new RegExp(pattern, 'i'));

  function isRagebait(title, subreddit) {
    if (subredditBlocklist.includes(subreddit)) {
      return true;
    }
    for (const re of ragebaitRegexps) {
      if (re.test(title)) {
        return true;
      }
    }
    return false;
  }

  function processEntries() {
    // Old Reddit entries
    const entries = document.querySelectorAll('div.entry.unvoted');
    for (const entry of entries) {
      const titleElement = entry.querySelector('a.title');
      const subredditElement = entry.querySelector('a.subreddit');

      if (!titleElement || !subredditElement) {
        continue;
      }

      const title = titleElement.innerText;
      // subreddit text is like "r/subreddit", so we slice off "r/"
      const subreddit = subredditElement.innerText.substring(2);

      if (isRagebait(title, subreddit)) {
        // Check if the title has already been replaced
        if (!entry.querySelector('.ragebait-replaced')) {
          const originalTitle = titleElement.innerHTML;
          titleElement.innerHTML = '<span class="ragebait-replaced">probably ragebait</span>';
          titleElement.insertAdjacentHTML('afterend', `<!-- ${originalTitle} -->`);
        }
      }
    }

    // New Reddit: posts in feeds (e.g. /r/all) often have anchor titles like:
    // <a href="/r/politics/comments/..." id="post-title-t3_<id>" ...>Title</a>
    const newTitleAnchors = document.querySelectorAll('a[id^="post-title-t3_"]');
    for (const anchor of newTitleAnchors) {
      // avoid double-processing
      if (anchor.dataset.ragebaitProcessed) continue;

      const title = anchor.innerText && anchor.innerText.trim();
      if (!title) continue;

      // Attempt to determine subreddit from href (/r/<subreddit>/...)
      let subreddit = null;
      const href = anchor.getAttribute('href') || '';
      const m = href.match(/^\/r\/([^\/]+)/);
      if (m) subreddit = m[1];

      // Fallback: look for a nearby subreddit link inside the same post container
      if (!subreddit) {
        const container = anchor.closest('[data-testid="post-container"]') || anchor.closest('.Post');
        if (container) {
          const srLink = container.querySelector('a[href^="/r/"]');
          if (srLink) {
            const mh = srLink.getAttribute('href').match(/^\/r\/([^\/]+)/);
            if (mh) subreddit = mh[1];
          }
        }
      }

      if (!subreddit) {
        // if still unknown, skip — conservative approach
        continue;
      }

      if (isRagebait(title, subreddit)) {
        // replace text but keep the element so clicking still navigates (optional)
        anchor.dataset.ragebaitProcessed = '1';
        anchor.dataset.originalTitle = encodeURIComponent(anchor.innerHTML);
        anchor.innerHTML = '<span class="ragebait-replaced">probably ragebait</span>';
      }
    }
  }

  // Run the script once on load
  processEntries();

  // And run it again whenever the DOM changes, to catch dynamically loaded content.
  const observer = new MutationObserver(processEntries);
  observer.observe(document.body, { childList: true, subtree: true });

})();
