﻿// _Prtg.Comparison.Plugin.js

(function($, window, document, undefined) {
	var pluginName = "comparison";

	function Comparison(element, data, parent) {
			this.data = data;
			this.$element = $(element);
			this.parent = parent;
			this.$parent = $(parent);
			this.timer = this.$parent.Events();
			this.init(this);
	}

	Comparison.prototype.init = function(me) {
		me.result = {id: me.data.selid};
    var baseURI = me.$element.context.baseURI;
    var count, show, connectedIdWithParameter, ids;
    var existsShowInUrl=false, existsIdsInUrl=false, existsCountInUrl=false, existsGraphidInUrl=false;
    if(!!baseURI){
      show = _Prtg.Util.getUrlParameters(baseURI)["sh0w"];
      ids = _Prtg.Util.getUrlParameters(baseURI)["ids"];
      count = _Prtg.Util.getUrlParameters(baseURI)["count"];
      if(baseURI.indexOf("graphid") > -1)
        existsGraphidInUrl = true;
    }
    show = !!show ? show.split(',') : null;
    ids = !!ids ? ids.split(',') : null;
    if(!!show && !!ids){
      existsShowInUrl = true;
      existsIdsInUrl = true;

      connectedIdWithParameter = new Array();
      connectedIdWithParameter[ids[0]] = show[0];
      connectedIdWithParameter[ids[1]] = show[1];
    }
    if(count !== undefined)
      existsCountInUrl = true;
		$.extend(true, me.result, me.data);
    me.objectlookup = me.$element['object-lookup'](me.result,me.$parent[0]);
		me.$contentload = me.$parent.find(me.data.contentload);

    me.$contentload.on('click', '.centeredHint, .selectNewSensor', function(e) {
      me.objectlookup.triggerHandler('click');
      e.stopPropagation();
      e.preventDefault();
    });

		me.$graphid = me.$parent.find('input:radio.graphid').on('click', function(){
			me.$element.triggerHandler('changed', me.result);
		});

    if(existsCountInUrl) {
      me.$element.on('changed', function(e,r){
        if(r.hasOwnProperty('id'))
        {
          me.result = {
            id: r.id<0?0:r.id,
            graphid: me.$graphid.filter(':checked').val(),
            isinitialized: r.id>0
          };
        }
        me.refresh();
      }).triggerHandler('changed', me.result);
    }
    else {
      if(existsGraphidInUrl) {
        me.$element.on('changed', function(e,r){
          if(r.hasOwnProperty('id'))
          {
            me.result = {
              id: r.id<0?0:r.id,
              graphid: me.$graphid.filter(':checked').val(),
              isinitialized: r.id>0
            };
          }
          me.refresh();
        }).triggerHandler('changed', me.result);
      }
      else {
        me.$element.on('changed', function(e,r){
          if(r.hasOwnProperty('id'))
          {
            me.result = {
              id: r.id<0?0:r.id,
              graphid: me.$graphid.filter(':checked').val(),
              isinitialized: r.id>0,
              sh0w: !!connectedIdWithParameter ? connectedIdWithParameter[r.id] : undefined
            };
          }
          me.refresh();
        }).triggerHandler('changed', me.result);
      }
    }

		this.timer.subscribe('refresh.events.prtg',$.proxy(this.refresh, this));
		this.timer.subscribeOnce('navigate.prtg', $.proxy(function(e){
			this.timer.unsubscribe('refresh.events.prtg',$.proxy(this.refresh, this));
		}, this));
	};

	Comparison.prototype.refresh = function(){
		var me = this;
		this.result.multi = me.$element.parents('#content').hasClass('multi-compare');
		this.$contentload
		.empty()
		.addClass('load');
		$.ajax({
			url: '/controls/compareobject'+(this.result.multi?'.multi':'')+'.htm',
			data: this.result,
			timeout: 10000,
			beforeSend: function(jqXHR){
				jqXHR.peNumber = 'PE1132';
			}
		}).done(function(html){
			var elm = me.$contentload.removeClass('load').html(html);
			if(me.result.isinitialized) elm.closest('.no-data').removeClass('no-data');
			_Prtg.initPlugins(me.$contentload[0]);
		});
	};

	$.fn[pluginName] = function(options, parent) {
		return this.each(function() {
			if (!$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName, new Comparison(this, options, parent));
			}
		});
	};
})(jQuery, window, document);

// _Prtg.MultiComparison.Plugin.js
//
(function($, window, document, undefined) {
	var pluginName = "comparison-multi";

	function MultiComparison(element, data, parent) {
			this.data = data;
			this.$element = $(element);
			this.$parent = $(parent);
			this.init(this);
	}

	MultiComparison.prototype.init = function(me) {
		var ids= _Prtg.Util.getUrlVars()['ids']
			, count =  parseInt(_Prtg.Util.getUrlVars()['count'], 10)
			, $cp = me.$element.find('#compareobjects');

		ids = !!ids ? ids.split(',') : [];
		if( count > ids.length)
			ids.length = count;
		else
			count = ids.length;

		me.$element.on('click', '#popout', function(){
			ids = me.$element.find('.comparison-object input')
			.map(function(){var val = $(this).val(); return val<0?undefined:val;}).get().join(',');
			window.open('/compares.htm?graphid='+me.$element.find('input:radio:checked').val()+'&ids='+ids);
		});

		if(!!ids){
			me.$element.find('#comparecount').val(ids.length);
			//if(ids.length>3) me.$element.addClass('multi-compare');
			$.ajax({
				url: '/controls/compareobjecteditajax.htm',
				data:{
					id: '{objectid}',
					counter: '{counter}',
					isinitialized: '{initialized}'
				},
				beforeSend: function(jqXHR) {
					jqXHR.peNumber = 'PE1131';
				}
			}).done(function(htm){
				for(var i=me.$element.find('.comparison-object').length; i < ids.length; ++i){
					el = htm.printf({objectid:(ids[i]||0), counter:i+1, initialized: ''+!!ids[i]});
					$cp.append(el);
				}
				_Prtg.initPlugins($('#main')[0]);
			});
		}
	};

	$.fn[pluginName] = function(options, parent) {
		return this.each(function() {
			if (!$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName, new MultiComparison(this, options, parent));
			}
		});
	};
})(jQuery, window, document);
