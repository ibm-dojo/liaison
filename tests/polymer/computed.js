define([
	"intern!bdd",
	"intern/chai!expect",
	"dojo/Deferred",
	"../../polymer/computed",
	"../waitFor",
	"../sandbox/monitor"
], function (bdd, expect, Deferred, computed, waitFor) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/computed with Polymer", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					typeof handle.close === "function" ? handle.close() : handle.remove();
				}
			});
			it("Computed property", function () {
				var elem,
					link = document.createElement("link");
				link.href = "./imports/computed.html";
				link.rel = "import";
				this.timeout = 10000;
				document.head.appendChild(link);
				return waitFor(function () {
					/* global Polymer */
					return Polymer.getRegisteredPrototype("liaison-test-computed");
				}).then(function () {
					elem = document.createElement("liaison-test-computed");
					document.body.appendChild(elem);
					handles.push({
						remove: function () {
							if (document.body.contains(elem)) {
								document.body.removeChild(elem);
							}
						}
					});
					expect(elem.name).to.equal("John Doe");
					elem.first = "Ben";
				}).then(waitFor.create(function () {
					return elem.name !== "John Doe";
				})).then(function () {
					expect(elem.name).to.equal("Ben Doe");
					document.body.removeChild(elem);
				}).then(waitFor.create(function () {
					return !elem.computed;
				}));
			});
			it("Computed array", function () {
				var link = document.createElement("link");
				link.href = "./imports/computedArray.html";
				link.rel = "import";
				document.head.appendChild(link);
				this.timeout = 10000;
				return waitFor(function () {
					/* global Polymer */
					return Polymer.getRegisteredPrototype("liaison-test-computedarray");
				}).then(function () {
					var elem = document.createElement("liaison-test-computedarray");
					expect(elem.totalNameLength).to.equal(45);
					elem.items.push({Name: "John Jacklin"});
				}).then(waitFor.create(function () {
					return document.createElement("liaison-test-computedarray").totalNameLength !== 45;
				})).then(function () {
					var elem = document.createElement("liaison-test-computedarray");
					expect(elem.totalNameLength).to.equal(57);
				});
			});
		});
	}
});
