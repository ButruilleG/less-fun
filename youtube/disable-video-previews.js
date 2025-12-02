(function() {
  'use strict';

  const logger = {
    info: (...args) => console.info('[YT-PAUSE]', ...args)
  };

  function checkVideoSizeAndPause() {
    const video = document.querySelector('video');
    if (!video) {
      return;
    }

    const videoArea = video.videoWidth * video.videoHeight;
    const screenArea = window.screen.width * window.screen.height;

    if (videoArea > 0 && screenArea > 0 && (videoArea / screenArea) < 0.25) {
      if (!video.paused) {
        logger.info('Video is smaller than 1/4 of the screen, pausing.', { videoArea, screenArea });
        video.pause();
      }
    }
  }

  // Run the check periodically. A MutationObserver would be more efficient,
  // but for simplicity and to ensure we catch all resizes, setInterval is used.
  setInterval(checkVideoSizeAndPause, 1000);

  logger.info('YouTube small video pauser script loaded.');
})();
