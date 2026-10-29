chrome.runtime.onMessage.addListener(async (message, sender) => {
	if (typeof message === "number") {
		chrome.action.setBadgeText({
			tabId: sender.tab.id, text: String(message)
		});
		if (message === 0) chrome.tabs.sendMessage(
			sender.tab.id,
			(await (await fetch("config.json")).json()).lookahead
		);
		return;
	}
	const config = await (await fetch("config.json")).json();
	const env = await (await fetch("env.json")).json();
	const hosts = chrome.runtime.getManifest().host_permissions;
	const text = `Does the image show any of the following? ${config.contents}`
	let x = new URL(hosts[0]).origin;
	let y = env.CLOUDFLARE_ACCOUNT_ID;
	const url = `${x}/client/v4/accounts/${y}/ai/run/@cf/cloudflare/clef-omni`;
	const response = await fetch(url, {
		body: JSON.stringify({
			images: [message],
			model: "clef-omni",
			questions: {
				match: { instructions: text, type: "noul" }
			},
			state: ""
		}),
		headers: {
			Authorization: `Bearer ${env.CLOUDFLARE_ACCOUNT_API_TOKEN}`,
			"Content-Type": "application/json"
		},
		method: "POST"
	});
	const data = await response.json();
	return data.result.answers.match.noul > 0.5;
});
