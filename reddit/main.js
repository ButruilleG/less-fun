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

// Redirect `www.reddit.com` top-level navigations to `old.reddit.com`
const REDIRECT_TO_OLD_REDDIT_RULE = {
  id: 41,
  priority: 1,
  action: {
    type: 'redirect',
    redirect: { transform: { scheme: 'https', host: 'old.reddit.com' } }
  },
  condition: {
    // Broadly match www.reddit.com. Exclusions are handled by higher-priority rules.
    urlFilter: '||www.reddit.com',
    resourceTypes: ['main_frame'],
  }
};

// Allow reddit.com/media links to remain unchanged by giving them a higher priority.
const RETAIN_REDDIT_MEDIA_RULE = {
  id: 42,
  priority: 2, // Higher priority
  action: { type: 'allow' },
  condition: {
    urlFilter: '||www.reddit.com/media',
    resourceTypes: ['main_frame']
  }
};

// Allow reddit.com/gallery links to remain unchanged by giving them a higher priority.
const RETAIN_REDDIT_GALLERY_RULE = {
  id: 43,
  priority: 2, // Higher priority
  action: { type: 'allow' },
  condition: {
    urlFilter: '||www.reddit.com/gallery',
    resourceTypes: ['main_frame']
  }
};

export function init(config) {
  const rulesToAdd = [];
  if (config.redirectToOldReddit) {
    rulesToAdd.push(REDIRECT_TO_OLD_REDDIT_RULE);
    rulesToAdd.push(RETAIN_REDDIT_MEDIA_RULE);
    rulesToAdd.push(RETAIN_REDDIT_GALLERY_RULE);
  }
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
