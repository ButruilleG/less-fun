export function init(config) {
  // Intentionally left blank; no declarative rules for YouTube yet
}

export function onTabUpdated(tabId, changeInfo, tab, config) {
  if (config.pauseSmallYoutubeVideos && tab.url.includes('youtube.com')) {
    console.log('YouTube small video pauser is enabled.');
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['youtube/content.js']
    });
  }
}
