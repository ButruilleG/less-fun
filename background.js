let config;

const REDIRECT_RULE = {
  id: 1,
  priority: 1,
  action: { type: 'redirect', redirect: { transform: { host: 'old.reddit.com' } } },
  condition: { urlFilter: '||www.reddit.com', resourceTypes: ['main_frame'] }
};

const BLOCK_THUMBNAILS_RULE = {
  id: 2,
  priority: 1,
  action: { type: 'block' },
  condition: { urlFilter: '||thumbs.redditmedia.com', resourceTypes: ['image'], initiatorDomains: ['old.reddit.com'] }
};

const BLOCK_EXTERNAL_PREVIEWS_RULE = {
  id: 3,
  priority: 1,
  action: { type: 'block' },
  condition: { urlFilter: '||external-preview.redd.it', resourceTypes: ['image'], initiatorDomains: ['old.reddit.com'] }
};

async function setup() {
  config = await fetch(chrome.runtime.getURL('config.json')).then(response => response.json());

  const rulesToAdd = [];
  if (config.redirectOldReddit) rulesToAdd.push(REDIRECT_RULE);
  if (config.blockThumbnails) rulesToAdd.push(BLOCK_THUMBNAILS_RULE);
  if (config.blockExternalPreviews) rulesToAdd.push(BLOCK_EXTERNAL_PREVIEWS_RULE);

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map(rule => rule.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: rulesToAdd,
    removeRuleIds: existingRuleIds
  });

  console.log('Rules have been set up based on config.json.');
  if(config.enableRagebaitFilter) console.log('Ragebait filter is enabled.');
  if(config.pauseSmallYoutubeVideos) console.log('YouTube small video pauser is enabled.');
}

chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) {
    return;
  }

  if (config.enableRagebaitFilter && tab.url.includes('reddit.com')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['sabotage-reddit-ragebait.js']
    });
  }

  if (config.pauseSmallYoutubeVideos && tab.url.includes('youtube.com')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['youtube-pause.js']
    });
  }
});