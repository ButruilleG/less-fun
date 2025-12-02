(function() {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    div.expando-button:not(.selftext) {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  console.log('Reddit expando-button hider script loaded.');
})();
