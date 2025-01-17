﻿//_Prtg.ChannelGauges.Plugin.js
(function($, window, undefined) {
	var connectionTrys = 0,
		maxConnectionTrys = 2,
		pluginName = 'refreshable',
		pipe = null,
		parent = null;

	function Refreshable(elements, parent) {
		$.each(elements,function(){
			var data = $(this).data();
			if(!data.hasOwnProperty('refreshInterval'))
				data.refreshInterval = 0;
			if(!data.hasOwnProperty('lastRefresh'))
				data.lastRefresh = 0;
			data.refreshing = false;
		});
		this.elements = elements;
		this.$parent = $(parent);
		this.timer = this.$parent.Events();
		this.init(this);
	}

	Refreshable.prototype.init = function(me) {
		this.timer.subscribe('refresh.events.prtg',$.proxy(this.refreshables, this));
		if(this.timer !== _Prtg.Events)
			this.timer.subscribeOnce('navigate.prtg', $.proxy(function(e){
				if ( !!pipe && pipe.abort)
					pipe.abort();
				this.timer.unsubscribe('refresh.events.prtg',$.proxy(this.refreshables, this));
			}, this));
	};

	Refreshable.prototype.add = function add(elements) {
		$.each(elements,function(){
			var data = $(this).data();
			if(!data.hasOwnProperty('refreshInterval'))
				data.refreshInterval = 0;
			if(!data.hasOwnProperty('lastRefresh'))
				data.lastRefresh = 0;
			data.refreshing = false;
		});
		$.merge(this.elements,elements);
	};

	Refreshable.prototype.refreshables = function refreshables(e) {
		var me = this
			, t = (new Date()).getTime();
		// if ((_Prtg.Options.connectionCheck.getTime() + _Prtg.Options.refreshInterval * 1000) <= t - t%100) {
				connectionTrys = 0;
				$("#footerrefresh").find(".refreshclock").hide().end().find(".refreshinglable").show();
				if(!pipe)
					pipe = me.connectionCheck();
				// else
					// pipe = pipe.pipe(function(){return me.connectionCheck();});
		// }
		pipe = (pipe || $.when(me.$parent)).pipe(
			function refreshAll() {
				var deferreds = $.map(me.elements, function(e,i){
					var $elm = $(e)
						, data = $elm.data();
          if(data.hasOwnProperty('lastRefresh') && !data.refreshing){
            data.lastRefresh += _Prtg.Options.refreshInterval;
            if(e && data.lastRefresh >= data.refreshInterval) return me.refresh($elm, data, me, i);
          }
          data = null;
          $elm = null;
				});

				if(!!pipe || deferreds.length !== 0)
					return $.when.apply($,
						deferreds
					).then(
						function allDone(){
							$('body .tooltip, body .popover').remove();
							pipe = null;
              _Prtg.Events.reset().resume();
							$("#footerrefresh").find(".refreshclock").show().end().find(".refreshinglable").hide();
						},
						function oneFailed(){
							$('body .tooltip, body .popover').remove();
							pipe = null;
              _Prtg.Events.reset().resume();
							$("#footerrefresh").find(".refreshclock").show().end().find(".refreshinglable").hide();
						}
					);
				else pipe = null;
			},
			function connectionCheckFailed(){
				pipe = null;
			}).always(function(){pipe=null;});
	};

	Refreshable.prototype.refresh = function refresh(o, d ,me , index) {
		var $obj = o,
			data = d,
			url = $obj.attr("refreshurl");

		if (!url) return $.when(o);
		else{
			data.refreshing = true;
			return $.ajax({
					url: url,
					type: 'GET',
		      dataType: 'html',
					beforeSend: function(jqXHR, settings) {
						_Prtg.Tip.killPopups();
						jqXHR.peNumber = 'PE1114';
					}
				}).done(function success(content, textStatus, jqXHR) {
		      content = $($.parseHTML(content));
					if(content.eq(0).is('.refreshable')) content = content.html();
					$obj.html(content).triggerHandler('refreshed');
					content=null;
					_Prtg.initPlugins($obj);
					data.lastRefresh = 0;
					data.refreshing = false;
				}).fail(function error(jqXHR, textStatus, errorThrown) {
					if(jqXHR.status === 404) me.elements.splice(index,1); //remove from refreshables if not found
				});
		}
	};

	Refreshable.prototype.connectionCheck = function connectionCheck() {
		var me = this;
		return $.ajax({
			url: "/api/public/testlogin.htm",
			type: "GET",
			timeout: 25000,
			global: false,
			beforeSend: function(jqXHR, settings) {
				connectionTrys++;
				jqXHR.peNumber = 'PE1014';
			}
		}).done(function success(data, textStatus, jqXHR) {
			data = data || "";
			if (data.length === 0 || $.trim(data) === "NOTOK") {
				if (connectionTrys < maxConnectionTrys) {
					me.connectionCheck();
					return;
				}
        if(!_Prtg.Options.connectionLost){
          _Prtg.Options.connectionLost = window.connectionLost = true;
          setTimeout(function(){
				    _Prtg.Dialogs.connectionLost('/api/public/testlogin.htm failed twice (Timeout PE1014)');
          },500);
        }
			} else {
				_Prtg.Options.connectionCheck = new Date();
			}
		}).fail(function error(jqXHR, textStatus, errorThrown) {
			if (connectionTrys < maxConnectionTrys) {
				me.connectionCheck();
				return;
			} else {
        if(!_Prtg.Options.connectionLost){
          _Prtg.Options.connectionLost = window.connectionLost = true;
          setTimeout(function(){
  				  _Prtg.Dialogs.connectionLost('/api/public/testlogin.htm failed twice (PE1114, ' + textStatus + ', ' + errorThrown + ')');
          },500);
        }
			}
		});
	};
	Refreshable.prototype.now = function now() {
		_Prtg.Events.reset();
	};

	$.fn[pluginName] = function(parent) {
		var elements = $.makeArray(this);
		if(elements.length)
			if (!$.data(parent, "plugin_" + pluginName)) {
				$.data(parent, "plugin_" + pluginName, new Refreshable(elements, parent));
			} else {
				$.data(parent, "plugin_" + pluginName).add(elements);
			}
	};
})(jQuery, window, document);
