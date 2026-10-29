let scanned = 0;
let hidden = 0;
let running = false;
let wake;

new MutationObserver(() => wake?.()).observe(document, {
	childList: true, subtree: true
});
document.addEventListener("loadeddata", () => wake?.(), true);
document.addEventListener("scroll", () => wake?.(), true);

chrome.runtime.sendMessage(scanned);
chrome.runtime.onMessage.addListener((message, sender, reply) => {
	if (message && !running) {
		running = true;
		scan(message);
	}
	reply({ hidden, running, scanned });
});

async function scan(lookahead) {
	let path, remaining;
	while (true) {
		if (path !== location.pathname) {
			path = location.pathname;
			remaining = lookahead;
		}
		const videos = [...document.querySelectorAll("video")];
		const video = videos.find(video =>
			!video.dataset.reelskip && video.readyState >= 2 &&
			video.getBoundingClientRect().top > innerHeight / 2
		);
		if (
			!location.pathname.startsWith("/reels/") ||
			!remaining || !video || videos.length < 2
		) {
			await new Promise(resolve => { wake = resolve; });
			continue;
		}
		video.dataset.reelskip = "1";
		let reel = video;
		while (
			reel.parentElement.querySelectorAll("video").length < 2
		) {
			reel = reel.parentElement;
		}
		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth / 2;
		canvas.height = video.videoHeight / 2;
		canvas.getContext("2d").drawImage(
			video, 0, 0, canvas.width, canvas.height
		);
		const image = canvas.toDataURL("image/jpeg");
		remaining--;
		const match = await chrome.runtime.sendMessage(image);
		if (match) {
			reel.remove();
			hidden++;
		}
		chrome.runtime.sendMessage(++scanned);
	}
}
