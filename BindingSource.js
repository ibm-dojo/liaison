/** @module liaison/BindingSource */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory();
	} else if (typeof define === "function" && define.amd) {
		define(factory);
	} else {
		root.BindingSource = factory();
	}
})(this, function () {
	"use strict";

	function callConverter(converter, value) {
		/* jshint validthis: true */
		try {
			return converter.call(this, value);
		} catch (e) {
			console.error("Error occured in data converter callback: " + (e.stack || e));
			return value;
		}
	}

	/**
	 * An interface that abstracts various types of things that can be observed.
	 * {@link module:liaison/BindingSource BindingSource} points to something like object path,
	 * a list of {@link module:liaison/BindingSource BindingSource}, etc.
	 * @class module:liaison/BindingSource
	 * @augments Handle
	 * @abstract
	 */
	var BindingSource = (function () {
		var proto = /** @lends module:liaison/BindingSource# */ {
			_openObserver: function () {
				if (!this.observerIsOpen) {
					// Calling observe() against closed observer will end up with an error thrown in here
					this.value = this._ensureObserver().open(function (newValue, oldValue) {
						this.value = newValue;
						for (var i = 0, l = this.callbacks.length; i < l; ++i) {
							try {
								this.callbacks[i](
									this.boundFormatter ? this.boundFormatter(newValue) : newValue,
									this.boundFormatter ? this.boundFormatter(oldValue) : oldValue);
							} catch (e) {
								console.error("Error occured in BindingSource callback: " + (e.stack || e));
							}
						}
					}, this);
					this.observerIsOpen = true;
				}
			},

			_closeObserver: function () {
				if (this.observer) {
					this.observer.close();
					this.observer = null;
				}
				this.observerIsOpen = false;
			},

			/**
			 * Observes change in {@link module:liaison/BindingSource BindingSource}.
			 * @param {module:liaison/BindingSource~ChangeCallback} callback The change callback.
			 * @returns {Handle} The handle to stop observing.
			 */
			observe: function (callback) {
				this._openObserver();
				this.callbacks = this.callbacks || [];
				if (this.callbacks.indexOf(callback) < 0) {
					this.callbacks.push(callback);
				}
				return {
					remove: function () {
						var index = this.callbacks.indexOf(callback);
						if (index >= 0) {
							this.callbacks.splice(index, 1);
							if (this.callbacks.length === 0 && !this.keepObserver) {
								this._closeObserver();
							}
						}
					}.bind(this)
				};
			},

			/**
			 * Makes the given callback the only change callback.
			 * @param {function} callback The change callback.
			 * @param {Object} thisObject The object that should works as "this" object for callback.
			 * @returns The current value of this {@link module:liaison/BindingSource BindingSource}.
			 */
			open: function (callback, thisObject) {
				if (this.callbacks) {
					this.callbacks.length = 0;
				}
				this.observe(callback.bind(thisObject));
				return this.boundFormatter ? this.boundFormatter(this.value) : this.value;
			},

			/**
			 * @returns The current value of {@link module:liaison/BindingSource BindingSource}.
			 */
			getFrom: function () {
				this._openObserver();
				this.deliver();
				return this.boundFormatter ? this.boundFormatter(this.value) : this.value;
			},

			/**
			 * Sets a value to {@link module:liaison/BindingSource BindingSource}.
			 * @param value The value to set.
			 */
			setTo: function (value) {
				this._ensureObserver().setValue(this.boundParser ? this.boundParser(value) : value);
			},

			/**
			 * Synchronously delivers pending change records.
			 */
			deliver: function () {
				this._ensureObserver().deliver();
			},

			/**
			 * Discards pending change records.
			 * @returns The current value of this {@link module:liaison/BindingSource BindingSource}.
			 */
			discardChanges: function () {
				var value = this._ensureObserver().discardChanges();
				return this.boundFormatter ? this.boundFormatter(value) : value;
			},

			get formatter() {
				return this._formatter;
			},

			set formatter(formatter) {
				this._formatter = formatter;
				if ((this._formatter = formatter)) {
					this.boundFormatter = callConverter.bind(this, formatter);
				}
			},

			get parser() {
				return this._parser;
			},

			set parser(parser) {
				this._parser = parser;
				if ((this._parser = parser)) {
					this.boundParser = callConverter.bind(this, parser);
				}
			},

			/**
			 * Stops all observations.
			 */
			remove: function () {
				if (this.callbacks) {
					this.callbacks.length = 0;
				}
				this.observer && this.observer.close();
			}
		};
		proto.setValue = proto.setTo;
		proto.close = proto.remove;
		return proto;
	})();

	/**
	 * A synonym for {@link BindingSource#setTo}.
	 * @method module:liaison/BindingSource#setValue
	 * @param value The value to set.
	 */

	/**
	 * A synonym for {@link module:liaison/BindingSource#remove remove() method}.
	 * @method module:liaison/BindingSource#close
	 */

	/**
	 * Change callback.
	 * @callback module:liaison/BindingSource~ChangeCallback
	 * @param newValue The new value.
	 * @param [oldValue] The old value.
	 */

	return BindingSource;
});
