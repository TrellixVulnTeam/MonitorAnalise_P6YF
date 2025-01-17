﻿// _Prtg.Events.js
(function($, window, document, undefined) {
	var pluginName = "Events"
		,	domain = '.' + pluginName.toLowerCase() + '.prtg'
		, defaults = {
			refreshInterval: 5
		};

	function Events(element, options) {
		this.id = $.now();
		this.$ = $({});
		this.element = element;
		this.options = $.extend({}, defaults, options);
		this._defaults = defaults;
		this.master = _Prtg.Events;

		this.timerId = null;
    this.refreshCounter = 0;
		this.running = false;
		this.currentTime = this.options.refreshInterval;
		if(this.options.refreshType === "none") {
			if(!this.master)
				$('#quickbar .icon-refresh').on('click', function(e) {
					e.stopImmediatePropagation();
					window.location.reload();
				});
		} else if(typeof(options) === "object" ) this.init();
	}

	Events.prototype.init = function() {
		var self = this;
		if (!this.master) {
			this.master = this;
			this.clockContainer = document.getElementById("footerrefreshclock");
			this.$serverClock = $("footer .serverclock");
			this.start(this.options.refreshInterval);
		} else {
			this.master.subscribe('refresh'+domain, $.proxy(this.refresh, this));
			this.master.subscribe('navigate.prtg', $.proxy(this.refresh, this));
		}
	};

	Events.prototype.refresh = function triggersubevents(e) {
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		this.$.triggerHandler(e.type, args);
	};

	Events.prototype.start = function(refreshTime) {
		var self = this;
    if(this.refreshCounter >= 120
    && $('form.prtg-form,#mapeditor,tct[data-role="guru"]').length === 0)
    	document.location.reload();
    if(!!refreshTime){
		  this.currentTime = parseInt(refreshTime, 10) || 30;
      this.options.refreshInterval = this.currentTime;
    }
		if (!this.running) {
			this.running = true;
			if(this.clockContainer) this.clockContainer.innerHTML = this.currentTime;
			this.publish("start" + domain);
			this.timerId = setInterval(function() {
				self.tick.call(self);
			}, 1000);
		}
		return this;
	};

	Events.prototype.pause = function(trigger) {
		if (this.running) {
			this.running = false;
			clearInterval(this.timerId);
			this.publish((trigger || "pause") + domain);
		}
		return this;
	};

	Events.prototype.stop = function(trigger) {
		if (this.running) {
			this.running = false;
			clearInterval(this.timerId);
			if(trigger != undefined && this.options.refreshType === "wholepage") {
				document.location.reload();
			} else {
        this.publish.call(this,(trigger || "stop") + domain);
      }
		}
		return this;
	};

	Events.prototype.resume = function() {
    var self = this;
    if (!this.running) {
      this.running = true;
     if(this.clockContainer) this.clockContainer.innerHTML = this.currentTime;
      this.publish("start" + domain);
      this.timerId = setInterval(function() {
        self.tick.call(self);
      }, 1000);
    }
    return this;
	};

  Events.prototype.tick = function() {
		if(this.clockContainer) this.clockContainer.innerHTML = --this.currentTime;
		if (this.currentTime === 0) {
      this.publish('playalarm.events.prtg');
			this.stop('refresh');
      this.refreshCounter = this.refreshCounter + 1;
		}
		return this;
	};

  Events.prototype.reset = function() {
		this.currentTime = this.options.refreshInterval;
		return this;
	};

	Events.prototype.subscribe = function() {
		this.$.on.apply(this.$, arguments);
		return this;
	};

  Events.prototype.unsubscribe = function() {
		this.$.off.apply(this.$, arguments);
		return this;
	};

  Events.prototype.publish = function() {
		this.$.trigger.apply(this.$, arguments);
		return this;
	};

  Events.prototype.subscribeOnce = function() {
		this.$.one.apply(this.$, arguments);
		return this;
	};

	$.fn[pluginName] = function(options, parent) {
		var me = this[0]
			, ret = $.data(me, "plugin_" + pluginName);
		if (!ret) {
			ret = new Events(me, options, parent);
			$.data(me, "plugin_" + pluginName, ret);
		}
		return ret;
	};

})(jQuery, window, document);
