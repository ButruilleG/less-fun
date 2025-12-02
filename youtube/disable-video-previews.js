(function() {
  'use strict';

  const logger = {
    info: (...args) => console.info('[YT-HIDE-PREVIEWS]', ...args)
  };

  const selectorsToHide = [
    'ytd-rich-shelf-renderer', // Used to display shorts; all short videos are evil
    '.yt-lockup-view-model__content-image', // previews
  ];

  const style = document.createElement('style');
  style.textContent = `
    ${selectorsToHide.join(', ')} {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  console.log("Less-Fun extension: disable-video-previews.js loaded");
  logger.info('Hiding elements matching:', selectorsToHide.join(', '));
})();
