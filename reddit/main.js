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

export function init(config) {
  const rulesToAdd = [];
  if (config.redirectOldReddit) rulesToAdd.push(REDIRECT_RULE);
  if (config.blockThumbnails) rulesToAdd.push(BLOCK_THUMBNAILS_RULE);
  if (config.blockExternalPreviews) rulesToAdd.push(BLOCK_EXTERNAL_PREVIEWS_RULE);

  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: rulesToAdd
    // We assume that the main background script will remove all old rules
  });
}

export function onTabUpdated(tabId, changeInfo, tab, config) {
  const scriptsToInject = [];

  if (tab.url && tab.url.includes('reddit.com')) {
    if (config.blockPolitics) {
      console.log('Less-Fun: Enabling politics filter');
      scriptsToInject.push('reddit/politics-filter.js');
    }

    if (config.hideExpandoButtons) {
      console.log('Less-Fun: Hiding expando buttons');
      scriptsToInject.push('reddit/hide-expando.js');
    }
  }

  if (scriptsToInject.length > 0) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: scriptsToInject
    });
  }
}
