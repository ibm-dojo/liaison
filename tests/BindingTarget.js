define([
	"intern!bdd",
	"intern/chai!expect",
	"../Observable",
	"../ObservablePath",
	"../BindingTarget"
], function (bdd, expect, Observable, ObservablePath, BindingTarget) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/BindingTarget", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Object reflecting plain value", function () {
				var o = {},
					target = new BindingTarget(o, "Foo");
				handles.push(target);
				target.bind("Foo0");
				expect(o.Foo).to.equal("Foo0");
				expect(target.value).to.equal("Foo0");
			});
			it("Object reflecting model", function () {
				var target,
					dfd = this.async(1000),
					o = {},
					observable = new Observable({foo: "Foo0"}),
					source = new ObservablePath(observable, "foo");
				handles.push(target = new BindingTarget(o, "Foo").bind(source), source);
				expect(o.Foo).to.equal("Foo0");
				observable.set("foo", "Foo1");
				setTimeout(dfd.rejectOnError(function () {
					expect(o.Foo).to.equal("Foo1");
					expect(target.value).to.equal("Foo1");
					target.remove();
					observable.set("foo", "Foo2");
					setTimeout(dfd.callback(function () {
						expect(o.Foo).to.equal("Foo1");
						expect(target.value).to.equal("Foo1");
					}), 100);
				}), 100);
			});
			it("Sending current value of BindingTarget to the bound source", function () {
				var o = {},
					observable = new Observable({foo: new Observable({bar: "Bar0"})}),
					source = new ObservablePath(observable, "foo.bar"),
					target = new BindingTarget(o, "Foo");
				handles.push(source, target);
				target.updateSource(); // Should be no-op without error
				target.bind(source);
				o.Foo = "Bar1";
				target.updateSource();
				expect(observable.foo.bar).to.equal("Bar1");
			});
			it("Rebind", function () {
				var dfd = this.async(1000),
					o = {},
					observable = new Observable({foo: "Foo0", bar: "Bar0"}),
					source0 = new ObservablePath(observable, "foo"),
					source1 = new ObservablePath(observable, "bar"),
					target = new BindingTarget(o, "Foo");
				handles.push(source0, source1, target);
				target.bind(source0);
				target.bind(source1);
				observable.set("foo", "Foo1");
				observable.set("bar", "Bar1");
				setTimeout(dfd.callback(function () {
					expect(o.Foo).to.equal("Bar1");
					expect(target.value).to.equal("Bar1");
				}), 100);
			});
			it("Cleaning up BindingTarget references", function () {
				var o = {},
					target0 = new BindingTarget(o, "Foo"),
					target1 = new BindingTarget(o, "Bar");
				handles.push(target0, target1);
				expect(o.bindings).to.deep.equal({
					Foo: target0,
					Bar: target1
				});
				target0.remove();
				target1.remove();
				expect("bindings" in o).to.be.false;
			});
		});
	}
});
