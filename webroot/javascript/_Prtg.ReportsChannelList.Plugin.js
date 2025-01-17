﻿// _Prtg.ReportsChannelList.Plugin.js
(function($, window, document, undefined) {
	var pluginName = "prtg-reportchannellist";

	function Plugin(element, data, parent) {
		this.data = data;
    this.data.objects = this.loadDataFromHtmlComment('reportchannels-data-objects');
		this.el = (!(element instanceof jQuery)) ? element : element[0];
		this.$el = (!(element instanceof jQuery)) ? $(element) : element;
		this.$parent = (!(parent instanceof jQuery)) ? $(parent) : parent;

		this.coreObject = $.extend(true,{data:{id:data.objectid}},_Prtg.Core.getObject(data.template));
		this.init(this);
	}

	Plugin.prototype.init = function(me) {
		var id = me.data.objectid;

		me.$nirvana =
		me.$parent
			.on('resize.objecttree',function(){
				me.$parent.find('#reportChannelList').css('max-height',$('.rootTree',this).height());
			})
			.on('click.report', '.deleteItem, #nirvana', me, me.remove)
			// .on('click.report', '.sortItems', me, me.switchSorting)
			.on('change.report','input:checkbox', me, me.change)
			.on('add.report','input:checkbox', me, me.add)
			.find(me.data.multiselectDelete);
		me.$el.sortable({
				handle: '.reorder',
				axis: "y",
				revert: true,
				update: function(event, ui) {
					var subids = []
						, objids = [];
					me.$el.find('.channelItem').each(function(){
						subids.push($(this).data().reportNodeId);
						objids.push($(this).data().objid);
					});
					$.ajax({
						url: '/api/deletesubobject.htm',
						data: {
							id: id,
							subid: subids.join(',')
						}
					}).done(function(){
							$.ajax({
								url: '/api/reportaddsensor.htm',
								data: {
									id: id,
									addid: objids.join(',')
								}
							}).done(function(){
								me.refresh();
							});
					});
				}
			})
			.selectable({
				cancel: '.deleteItem,:input,option, label,reorder,a',
				selected: function () { me.$nirvana.show(); },
				unselected: function () { me.$nirvana.show(); }
			});
		me.update(me.data.objects.reportnodes);

		me.$el.removeAttr('data-objects');
		//me.sorts().current.apply($('.sortItems.ui-icon-triangle-1-n')[0]);
	};

  Plugin.prototype.loadDataFromHtmlComment = function(commentid) {
    var $comment = $('#' + commentid);
    var comment = $.trim($comment.html());
    var commentLength = comment.length;
    var dataBegin = comment.indexOf('{');
    var data;
    data = JSON.parse(comment.substr(dataBegin, commentLength-3-dataBegin));
    $comment.remove();
    return data;
  };

	Plugin.prototype.sorts = function(){
			var e = null
				, x = {
				'none': ['ui-icon-triangle-2-n-s', function (a, b) { return b - a; } ],
				'up': ['ui-icon-triangle-1-n', function (a, b) { return a === b ? 0 : a > b ? 1 : -1; } ],
				'down': ['ui-icon-triangle-1-s', function (a, b) { return a === b ? 0 : a < b ? 1 : -1; } ]
			};
			return {
				current: function () {
					if (this !== window) {
						if (!!e && e !== this) {
							var i = $(e).data().sort.type;
							$(e).removeClass(x[i][0]).addClass(x['none'][0]);
							$(e).data().sort.type = 'none';
						}
						e = this;
					}
					return { 'sort': x[$(e).data().sort.type || 'none'], 'field': $(e).data().sort.field };
				},
				next: function () {
					var i = $(this).data().sort.type || 'none';
					$(e).removeClass(x[i][0]);
					i = i === 'none' ? 'up' : i === 'up' ? 'down' : 'up';
					$(e).addClass(x[i][0]);
					$(this).data().sort.type = i;
					return { 'sort': x[i], 'field': $(this).data().sort.field };
				}
			};
	};

	Plugin.prototype.refresh = function(){
		var self = this;
		return $.ajax({
			global: false,
			dataType: 'text json',
			url: this.coreObject.url,
			data: this.coreObject.data
		}).done(function(d) {
			self.update(d.reportnodes);
		});
	};

	Plugin.prototype.update = function(d) {
		var me= this
			, $self = me.$el
			, p = me.$el.parent();
		$self.detach()
			.empty()
			.append($.jqote(this.coreObject.template, d));

		if(d.length === 0)
			p.find('.centeredHint').show().delay(8000).fadeOut(2000);
		else
			p.find('.centeredHint').hide();

		p.append($self);
//		$self.triggerHandler('changed',{data:d});
		me.currentData = d;

		var subids=[], objids=[];
		$self.find('.channelItem').each(function(){
			subids.push($(this).data().reportNodeId);
			objids.push($(this).data().objid);
		});
	};

	Plugin.prototype.getData = function(){
		return [];//this.currentData;
	};

	Plugin.prototype.add = function(objid, e,d){
		var self = this
			, opts = this.settings
			, dfd = $.Deferred();

		self.$el.css('opacity', 0.3).append("<center class='loading'><span class='loadspinner'></span></center>");
		$.ajax({
			url: '/api/reportaddsensor.htm',
			data: {
				id: self.data.objectid,
				addid: objid
			}
		}).done(function(html){
			self.refresh().always(function (data) {
				//self.sorting();
				self.$el.css('opacity', 1);
				var $elm = self.$el.find('div[objid="' + objid + '"]').css('opacity', 0.3);
				$elm[0].scrollIntoView();
				$elm.fadeTo(3000, 1);
				dfd.resolve(data);
			});
		});
		return dfd.promise();
	};

	Plugin.prototype.reorder = function(e,d){
		var $this = $(this)
			, me = e.data;

	};

	Plugin.prototype.remove = function(e){
		var $this = null
			, me = e.data
			, subids=[]
			, purged=[];

		if ($(e.target).hasClass('deleteItem')){
			$(this).closest('.channelItem').addClass('ui-selected');
			me.$nirvana.show();
		}
		$this = me.$el.find('div[objid].ui-selected').not('.disabled').addClass('disabled');

		$.each($this, function(){
			var $self = $(this);
			subids.push($self.data().reportNodeId);
			purged.push($.extend(true,{purge:true},$self.data()));
		});
		if(subids.length > 0)
			$.ajax({
				url:'/api/deletesubobject.htm',
				data: {
					id: me.data.objectid,
					subid: subids.join(',')
				}
			}).done(function(){
				$this.effect('transfer', { to: '#nirvana', className: 'ui-effects-transfer' },
          500,
					function () {
						$(this).remove();
						me.$nirvana.hide();
						//me.$el.triggerHandler('changed',{data:purged});
						me.refresh();
				});
			});
	};

	Plugin.prototype.change = function(e){
			var $self = $(this)
				, url = '';
			if ($self.is(":checked") === true)
				url = '/api/reportaddsensorchannel.htm';
			else
				url = '/api/reportdeletesensorchannel.htm';
			$.ajax({ url: url,
				data: {
					id: e.data.data.objectid,
					repnodeid: $self.data().reportNodeId,
					channelid: $self.data().channelId
				},
				type: "GET"
			});

	};
/*
					sorting: function sorting() {
						var c = sorts.current.apply(window),
							p = $list.parent();
						$list.detach();
						$list.html($list.find('.sortItem').sort(function (a, b) {
							return c.sort[1]($(a).data().sortData[c.field], $(b).data().sortData[c.field]);
						}));
						p.append($list);
						makeButtonSets($list);
					},
					switchSorting: function switchSorting(e) {
						sorts.current.apply(this);
						sorts.next.apply(this);
						e.data.report.sorting();
					},
*/
	$.fn[pluginName] = function(data, parent) {

    return this.each(function() {
			if (!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, new Plugin(this, data, parent));
			}
		});
	};

})(jQuery, window, document);
