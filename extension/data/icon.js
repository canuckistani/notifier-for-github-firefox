'use strict';

let participating = self.options.participating;

self.port.on('update-pref', (value) => {
	participating = value;
	self.port.emit('pref-updated', true);
})

self.port.on('render', function (data) {
	let countElem;
	let tmp = document.createElement('div');
	tmp.innerHTML = unescape(data);

	let selector = '';
	participating ? selector = 'a[href="/notifications/participating"] .count' : selector = 'a[href="/notifications"] .count';
	countElem = tmp.querySelector(selector);
	self.port.emit('fetched-count', countElem && countElem.textContent);
});
