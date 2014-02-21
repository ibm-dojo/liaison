define(["dojo/topic"], function (topic) {
	return function () {
		topic.subscribe("/suite/end", function (suite) {
			if (suite.name === "main") {
				window.postMessage(JSON.stringify(suite.toJSON()), "*");
			}
		});
		topic.subscribe("/error", function (error) {
			window.postMessage(JSON.stringify({__error: "" + error}), "*");
		});
	};
});
