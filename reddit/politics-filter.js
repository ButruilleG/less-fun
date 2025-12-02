(async function() {
  'use strict';
  console.log("Less-Fun extension: content script loaded");

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
  }

  // Run the script once on load
  processEntries();

  // And run it again whenever the DOM changes, to catch dynamically loaded content.
  const observer = new MutationObserver(processEntries);
  observer.observe(document.body, { childList: true, subtree: true });

})();
