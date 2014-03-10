define([
	"intern!bdd",
	"intern/chai!expect",
	"../Observable"
], function (bdd, expect, Observable) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		// TODO(asudoh): Look more at Object.observe() spec and add more tests
		describe("Test liaison/Observable", function () {
			var handles = [],
				pseudoError = new Error("Error thrown on purpose. This error does not mean bad result of test case.");
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Enumerate observable instance", function () {
				/* jshint unused: false */
				var found = false,
					observable = new Observable();
				for (var s in observable) {
					found = true;
				}
				expect(found).to.equal(false);
			});
			it("Observing null", function () {
				var caught;
				try {
					Observable.observe(null, function () {});
				} catch (e) {
					caught = true;
				}
				expect(caught).to.be.true;
				expect(Observable.canObserve(null)).not.to.be.true;
			});
			it("Work with a single observable", function () {
				var dfd = this.async(1000),
					observable = new Observable();
				handles.push(Observable.observe(observable, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "bar"
						},
						{
							type: Observable.CHANGETYPE_UPDATE,
							object: observable,
							name: "foo",
							oldValue: "Foo0"
						}
					]);
				})));
				observable.set("foo", "Foo0");
				observable.set("bar", "Bar");
				observable.set("foo", "Foo1");
			});
			it("Work with multiple observables, Observable.observe() callback defined earlier should be called earlier", function () {
				var dfd = this.async(1000),
					observable0 = new Observable(),
					observable1 = new Observable();
				handles.push(Observable.observe(observable1, dfd.rejectOnError(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable1,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable1,
							name: "bar"
						}
					]);
				})));
				handles.push(Observable.observe(observable0, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable0,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable0,
							name: "bar"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable0,
							name: "baz"
						}
					]);
				})));
				observable0.set("foo", "Foo0");
				observable1.set("foo", "Foo0");
				observable0.set("bar", "Bar0");
				observable1.set("bar", "Bar0");
				observable0.set("baz", "Baz0");
			});
			it("Work with multiple observers per an observable", function () {
				var dfd = this.async(1000),
					observable = new Observable();
				handles.push(Observable.observe(observable, dfd.rejectOnError(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "bar"
						},
						{
							type: Observable.CHANGETYPE_UPDATE,
							object: observable,
							name: "foo",
							oldValue: "Foo0"
						}
					]);
				})));
				handles.push(Observable.observe(observable, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "bar"
						},
						{
							type: Observable.CHANGETYPE_UPDATE,
							object: observable,
							name: "foo",
							oldValue: "Foo0"
						}
					]);
				})));
				observable.set("foo", "Foo0");
				observable.set("bar", "Bar");
				observable.set("foo", "Foo1");
			});
			it("Observer callback changing another observable", function () {
				var changeRecords = [],
					observable0ObserverCalledCount = 0,
					dfd = this.async(1000),
					observable0 = new Observable(),
					observable1 = new Observable();
				handles.push(Observable.observe(observable0, dfd.rejectOnError(function (records) {
					[].push.apply(changeRecords, records);
					if (++observable0ObserverCalledCount >= 2) {
						expect(observable0ObserverCalledCount).to.be.equal(2);
						expect(changeRecords).to.deep.equal([
							{
								type: Observable.CHANGETYPE_ADD,
								object: observable0,
								name: "foo0"
							},
							{
								type: Observable.CHANGETYPE_ADD,
								object: observable1,
								name: "foo1"
							},
							{
								type: Observable.CHANGETYPE_ADD,
								object: observable0,
								name: "bar0"
							}
						]);
						dfd.resolve(1);
					}
				})));
				handles.push(Observable.observe(observable1, dfd.rejectOnError(function (records) {
					observable0.set("bar0", "Bar0");
					[].push.apply(changeRecords, records);
				})));
				observable1.set("foo1", "Foo1");
				observable0.set("foo0", "Foo0");
			});
			it("Observing with the same callback", function () {
				var dfd = this.async(1000),
					count = 0,
					observable = new Observable(),
					callback = dfd.rejectOnError(function () {
						expect(++count < 2).to.be.true;
					});
				handles.push(Observable.observe(observable, callback, [Observable.CHANGETYPE_UPDATE]));
				handles.push(Observable.observe(observable, callback, [Observable.CHANGETYPE_ADD]));
				observable.set("foo", "Foo0");
				setTimeout(dfd.callback(function () {
					expect(count).to.equal(1);
				}), 100);
			});
			it("Error in observer callback", function () {
				var dfd = this.async(1000),
					observable = new Observable();
				handles.push(Observable.observe(observable, function () {
					throw pseudoError;
				}));
				handles.push(Observable.observe(observable, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "foo"
						}
					]);
				})));
				observable.set("foo", "Foo0");
			});
			it("Unobserve", function () {
				var h0, h1,
					dfd = this.async(1000),
					observable0 = new Observable(),
					observable1 = new Observable();
				handles.push(h0 = Observable.observe(observable0, dfd.rejectOnError(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable0,
							name: "foo0"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable0,
							name: "bar0"
						}
					]);
				})));
				handles.push(h1 = Observable.observe(observable1, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable1,
							name: "foo1"
						}
					]);
				})));
				observable0.set("foo0", "Foo1");
				observable1.set("foo1", "Foo1");
				h1.remove();
				h1 = null;
				observable1.set("bar1", "Bar1");
				observable0.set("bar0", "Bar0");
				h0.remove();
				h0.remove(); // Make sure removing the handle twice won't cause any problem
				h0 = null;
			});
		});
		// TODO(asudoh): Add more enumeable/configuable/writable tests
		// TODO(asudoh): Add test for Observable.observe() is called twice for the same observable/callback pair, and removing that handle
	}
});
