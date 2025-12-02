(async function() {
  'use strict';
  console.log("Less-Fun extension: content script loaded");

  const subredditBlocklist = await fetch(chrome.runtime.getURL('block-subreddits.txt'))
    .then(response => response.text())
    .then(text => text.split('\n').filter(s => s.trim().length > 0));
  console.debug("Less-Fun extension: loaded subreddit blocklist", subredditBlocklist);

  const ragebaitBlocklist = await fetch(chrome.runtime.getURL('block-ragebait.txt'))
    .then(response => response.text())
    .then(text => text.split('\n').filter(s => s.trim().length > 0 && !s.startsWith('#')));
  console.debug("Less-Fun extension: loaded ragebait blocklist", ragebaitBlocklist);

  const ragebaitRegexps = ragebaitBlocklist.map(pattern => new RegExp(pattern, 'i'));

  function isRagebait(title, subreddit) {
    if (subredditBlocklist.includes(subreddit)) {
      console.debug("Less-Fun extension: subreddit match found", subreddit);
      return true;
    }
    for (const re of ragebaitRegexps) {
      if (re.test(title)) {
        console.debug("Less-Fun extension: ragebait keyword match found on title '"+title+"' with pattern '"+re+"'");
        return true;
      }
    }
    return false;
  }

  function processEntries() {
    console.debug("Less-Fun extension: processing entries");
    const entries = document.querySelectorAll('div.entry.unvoted');
    console.debug(`Less-Fun extension: found ${entries.length} entries`);
    for (const entry of entries) {
      const titleElement = entry.querySelector('a.title');
      const subredditElement = entry.querySelector('a.subreddit');

      if (!titleElement || !subredditElement) {
        console.debug("Less-Fun extension: skipping entry because title or subreddit element not found", entry);
        continue;
      }

      const title = titleElement.innerText;
      // subreddit text is like "r/subreddit", so we slice off "r/"
      const subreddit = subredditElement.innerText.substring(2);
      console.debug("Less-Fun extension: processing entry", {title, subreddit});


      if (isRagebait(title, subreddit)) {
        console.debug("Less-Fun extension: RAGEBAIT DETECTED", {title, subreddit});
        // Check if the title has already been replaced
        if (!entry.querySelector('.ragebait-replaced')) {
          const originalTitle = titleElement.innerHTML;
          titleElement.innerHTML = '<span class="ragebait-replaced">probably ragebait</span>';
          titleElement.insertAdjacentHTML('afterend', `<!-- ${originalTitle} -->`);
        }
      }
    }
  }

  // Run the script once on load
  processEntries();

  // And run it again whenever the DOM changes, to catch dynamically loaded content.
  const observer = new MutationObserver(processEntries);
  observer.observe(document.body, { childList: true, subtree: true });

})();
