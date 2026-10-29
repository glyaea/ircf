const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

async function update() {
	const { hidden, scanned } = await chrome.tabs.sendMessage(tab.id, null);
	document.querySelector("pre").textContent = `Filtered ${hidden}/${scanned}`;
}

chrome.runtime.onMessage.addListener((message, sender) => {
	if (typeof message === "number" && sender.tab?.id === tab.id) update();
});

update();
