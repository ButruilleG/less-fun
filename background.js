import * as reddit from './reddit/main.js';
import * as youtube from './youtube/main.js';

const siteModules = {
  reddit,
  youtube
};

let config;

async function setup() {
  config = await fetch(chrome.runtime.getURL('config.json')).then(response => response.json());

  // Clear all existing rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map(rule => rule.id);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds
  });

  for (const site in config.enabled_sites) {
    if (config.enabled_sites[site] && siteModules[site]) {
      siteModules[site].init(config[site]);
    }
  }
  console.log('Setup complete based on config.json.');
}

chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url || !config) {
    return;
  }

  for (const site in config.enabled_sites) {
    if (config.enabled_sites[site] && siteModules[site]) {
      siteModules[site].onTabUpdated(tabId, changeInfo, tab, config[site]);
    }
  }
});