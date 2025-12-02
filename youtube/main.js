export function init(config) {
  // Intentionally left blank; no declarative rules for YouTube yet
}

export function onTabUpdated(tabId, changeInfo, tab, config) {
  if (config.disableVideoPreviews && tab.url.includes('youtube.com')) {
    console.log('Less-Fun: Disabling video previews');
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['youtube/disable-video-previews.js']
    });
  }
}
