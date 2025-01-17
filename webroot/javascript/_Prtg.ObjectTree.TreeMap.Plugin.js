﻿// _Prtg.ObjectTree.TreeMap.Plugin.js
(function($,window,document,undefined){
	var pluginName = "treemap";
	function TreeMap(element,data,parent){
		this.$element = $(element);
		this.data = data;
		if(!this.data.dataview){
			this.data.dataview = new Slick.Data.RemoteModel(this.data);
			if(!!data.options.filter){
				var self = this;
				$.each(data.options.filter,function(i,v){
					self.data.dataview.toggleFilter(v);
				});
			}
		}
		if(!!data.objects){
			this.data.dataview.initializeData(0, data.objects, false, 'sensorxref');
			this.$element.removeAttr('data-objects');
			this.initialRender = this.update;
		}
		this.parent = parent;
		this.layout = {};
		this.init(this);
		this.initialRender();
	};
	TreeMap.prototype.initialRender = function dummy(){};
	TreeMap.prototype.init = function(me){
		var $self = me.$element
			,	data = me.data;

		me.filter = data.dataview.Filters();
		me.sizePriority = me.getSize('treeMapSizePriority');
		me.sizeSensors = me.getSize('treeMapSizeSensors');
		me.treemap = d3.layout.treemap()
			.round(true)
			.sticky(false)
			.value(function (d) { return d.basetype === 'device' || /filter/.test(d.libkind) === true ? Math.pow((Math.log((me.sizeSensors ? d.totalsens + 2 : 4)) / Math.LN2), (me.sizePriority ? parseInt(d.priority) : 1)) : 1; })
			.sort(function (a, b) { return a._id < b._id ? 1 : a._id > b._id ? -1 : 0; })
			.children(function (d) { return d._children.length > 0 ? $.grep(d._children, function(d){
				var ret = true;
				if(me.filter !== true && !!d && d.basetype === 'device')
					$.each(me.filter, function (i,e) {
						var sum = 0
							, types = _Prtg.Core.objects.group.sensorTypes.slice(0);
						$.each(types.splice(0,types.indexOf(e)+1), function(i,e){
						 sum += d[e+'sens'];
						});
						ret = ret && (sum === 0 || sum > d[e+'sens']);
					});
				return ret;
			}) : null; });
    me.container = $self.find('.slick-viewport,#viewport').closest('.mapobjectpreviewcontainer').addBack().eq(0);
		me.div = d3.select(me.container[0])
			.append("div")
			.attr("class", "treemap d3");

			me.$element
				.on('destroyed',function() {
					_Prtg.Plugins['groupviewsize'] ={init:function(){}};
				});

		if (!me.data.options.hideControls){
			_Prtg.Plugins['groupviewsize'].init = function(){me.groupviewsize.call(this,me)};
			_Prtg.Plugins['groupviewsize'].init.call($(me.data.options.controlsParent).find('.size-by-switch.control'));
		}
		me.layout.element = $(me.div[0]);

	};

	TreeMap.prototype.groupviewsize = function(me){
		$(this)
			.addClass('show')
			.html($.jqote(_Prtg.Core.getObject('sensorTree').treemap.template, [{sizePriority:me.sizePriority,sizeSensors:me.sizeSensors}]))
			.find("#treemapSizePriority").click(function () {
					me.sizePriority = !me.sizePriority;
					try { ret = window.localStorage.setItem('treeMapSizePriority', me.sizePriority) } catch (e) { }
					me.update();
					return;
			})
			.end()
			.find("#treemapSizeSensors").click(function () {
				me.sizeSensors = !me.sizeSensors;
				try { ret = window.localStorage.setItem('treeMapSizeSensors', me.sizeSensors) } catch (e) { }
				me.update();
				return;
			});
	};

	TreeMap.prototype.refresh = function(){
		var $self = this.$element
			, data = this.data
      , div = this.div[0][0]
      , w = this.container.width()-2
      , h = this.container.closest('#objecttreecontainer').addBack().eq(0).height()-2
      , container = $self.find('.slick-viewport,#viewport');
		this.layout.element.detach().empty();
		this.treemap.size([w, h]);
		this.filter = this.data.dataview.Filters();
		this.div
			.attr('style','width:' +w+'px;height:' +h+ 'px;')
			.data(data.dataview.Data())
			.selectAll("div")
			.data(this.treemap.nodes)
			.enter()
      .append("div")
      .call(this.cell)
			.attr("class", function (d) {
				var status = 'none';
				jQuery.each(_Prtg.Core.objects.group.sensorTypes, function (i,key) {
					if (d[key + 'sens'] > 0) {
						status = key;
						return false;
					}
				});
				return "cell " + d.basetype + ' ' + (d.libkind||'') + ' ' + status;
			})
			.attr("path", function(d){ return d._id;})
      .attr("objid", function(d){return d.objid;})
			.attr("title", function (d) { return !!d._siblings.parent ? d._siblings.parent.name : null; })
			.html(function (d) { return(
        '<a id="'+d.objid+'" class="'+d.basetype+'menu" href="' + '/' +  (d.basetype === 'probe' ? 'probenode' : d.basetype) + '.htm?id=' + d.objid
        + '"" style="background-image:url(' + _Prtg.Core.objects.icons.icon(d) + ')">'
        + d.name
       + '</a>'
        );
      });

			container.append(this.layout.element);
	};
	TreeMap.prototype.update = function(data){
		var me = this;
    if(!!data && typeof(data) != "boolean")
      this.data.dataview.initializeData(0, data, false, 'sensorxref');
		// if(!!data)
		// 	this.data.dataview.initializeData(0, data, false, 'sensorxref');
		// _Prtg.Plugins['groupviewsize'].init = function(){me.groupviewsize.call(this,me)};
		// _Prtg.Plugins['groupviewsize'].init.call($(this.data.options.controlsParent).find('.size-by-switch.control'));
		return this.refresh();
	};
	TreeMap.prototype.element = function(){
		return this.layout.element;
	};

	TreeMap.prototype.cell = function cell() {
		this
		.style("left", function (d) { return d.x + 1 + "px"; })
		.style("top", function (d) { return d.y + 1 + "px"; })
		.style("width", function (d) { return (d.dx > 0 ? d.dx - 1 : 0) + "px"; })
		.style("height", function (d) { return (d.dy > 0 ? d.dy- 1 : 0) + "px"; });
	}

	TreeMap.prototype.getSize = function (type) {
		var data = this.data
			, ret;
		if(data.options.hasOwnProperty(type))
			return data.options[type];
		try {
			ret = window.localStorage.getItem(type) === 'true'
		} catch (e) {
			ret = false;
		}
		ret = ret === null ? false : ret;
		return ret;
	};
	$.fn[pluginName] = function(options, parent){
		return this.map(function() {
			var ret = $.data(this, "plugin_" + pluginName);
			if (!ret) {
				ret = new TreeMap(this, options, parent);
				$.data(this, "plugin_" + pluginName, ret);
			}
			return ret;
		});
	};
})(jQuery, window, document );
