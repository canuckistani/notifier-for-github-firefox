'use strict';
const tabs = require('sdk/tabs');
const data = require('sdk/self').data;
const Request = require('sdk/request').Request;
const pageWorker = require('sdk/page-worker');
const timers = require('sdk/timers');
const { ActionButton } = require('sdk/ui/button/action');
const sp = require('sdk/simple-prefs');

var participating = sp.prefs.participatingPrefs;

sp.on('participatingPrefs', () => {
	console.log('pref-change>', sp.prefs.participatingPrefs);
	participating = sp.prefs.participatingPrefs;
	worker.port.emit('update-pref', participating);
});

let username = 'canuckistani';

const notifUrl = 'https://github.com/notifications';
// const notifUrl = 'https://github.com/mozilla/tofino/issues/assigned/'+username
const updateInterval = 1000 * 60;

let worker = pageWorker.Page({
	contentScriptFile: data.url('icon.js'),
	contentScriptOptions: { participating: participating }
});

function update() {
	Request({
		url: notifUrl,
		onComplete: function (response) {
			console.log('completed request>', response.text);
			worker.port.emit('render', response.text);
		}
		// Need to add a check if the computer is connected to the internet.
		// Waiting on a `onError` method.
	}).get();
};

let tbb = ActionButton({
	id: 'notifier-for-github',
	label: 'Notifier for GitHub',
	icon: {
		'16': './icon-16.png',
		'32': './icon-32.png',
		'64': './icon-64.png',
	},
	onClick: function (state) {
		let found = false;
		const currentTab = tabs.activeTab;
		for (let tab of tabs) {
			if (found = (tab.url === notifUrl && tab.window === currentTab.window)) {
				tab.activate();
				tab.reload();
				break;
			}
		}
		if (!found) {
			if (currentTab.url === 'about:blank' || currentTab.url === 'about:newtab') {
				currentTab.url = notifUrl;
			} else {
				tabs.open(notifUrl);
			}
		}

		timers.setTimeout(update, 1000 * 20);
		update();
	}
});

worker.port.on('fetched-count', function (count) {
	count = count > 999 ? '∞' : count;

	if (count) {
		tbb.label = 'Notifier for GitHub';

		if (count !== '0') {
			tbb.badge = count;
			tbb.badgeColor = '#C32424';
		} else {
			tbb.badge = 0;
			tbb.badgeColor = '#038103';
		}
	} else {
		tbb.label = 'You have to be logged into GitHub';
		tbb.badge = '!';
		tbb.badgeColor = '#FFA500';
	}
});

worker.port.on('pref-updated', update);

timers.setInterval(update, updateInterval);
update();
