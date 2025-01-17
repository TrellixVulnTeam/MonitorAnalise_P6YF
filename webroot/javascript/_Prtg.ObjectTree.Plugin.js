﻿/*
/   _Prtg.ObjectTree.Plugin.js
*/
(function ( $, window, document, undefined ) {
	var pluginName = "objecttree";

	function ObjectTree( element, options, parent ) {
		this.element = element;
		this.options = options;
		this.parent = parent;
		this._name = pluginName;
		this.$sensorTree = $(element);
		this.$parent = this.$sensorTree.parent();
		this.grid = null;
		this.$treeblocker = this.$sensorTree.find('#treeblocker');
		this.$editSettings = $('div.editsettings');
		this.$dropTreeAdorner = $('<div id="treeAdorner" />');
		this.$dragSensor = null;
		this.$draggedSensor = null;
		this.$right_panel = $('#rightpanel_titel');
		this.pinned = true;
		var totalsens = (this.options.objects['sensorxref'][0] || {totalsens:0}).totalsens;
		this.fullSize = totalsens <= _Prtg.Core.objects.maxSensorFullSize;
		this.editable = this.$sensorTree.parent().is('.treeiseditable');

		this.init(this);
	}

	ObjectTree.prototype.refresh = function refreshObjectTree(){
		this.$sensorTree.sensortree('refresh');
	};
	ObjectTree.prototype.setFullsize =  function (val){
		this.fullSize = val === undefined ? this.options.objects['sensorxref'][0].totalsens <= _Prtg.Core.objects.maxSensorFullSize : val;
      this.resize(
        !this.fullSize,
        this.$sensorTree.offset().top,
        document.getElementsByTagName('footer'),
        document.getElementById('sensortreelinks')
      );
		return this.fullSize;
	};

	ObjectTree.prototype.resize =  function (setHeight, offsetTop, footer, buttons){
    footer = !!footer && footer.length > 0 ? footer[0] : false;
    if(setHeight)
  		this.$sensorTree.height(
  			(window.innerHeight
  				- offsetTop
  				- (footer ? footer.offsetHeight : 0) - 14
  			)
  		);
    else
      this.$sensorTree.height('auto');
    this.$sensorTree.trigger('resize.objecttree');
	};


	ObjectTree.prototype.init = function (me) {

		_Prtg.Events.subscribe('prtg.resize.layout',$.proxy(
			me.resize,
			me,
      !me.fullSize,
			me.$sensorTree.offset().top,
			document.getElementsByTagName('footer'),
			document.getElementById('sensortreelinks')
		));
    if(!me.fullSize){
				me.resize(
          !me.fullSize,
					me.$sensorTree.offset().top,
					document.getElementsByTagName('footer'),
					document.getElementById('sensortreelinks')
				);
		}
		$.when(me.$sensorTree.sensortree($.extend(true, {},
			_Prtg.Core.objects['sensorTree'], {
				layout: (me.editable ? 'sensortreenormal': me.options.viewType),
				data: {
					id: me.options.objectid
				},
				editMode: me.editable,
				displayMode: (me.options.displayMode || 'overview'),
				controlsParent: '#loadedcontent',
				gridOptions: {
					fullHeight: me.fullSize,
					setFullsize: function(val){me.setFullsize(val);}
				},
				timer: $(me.parent).Events()
			}), me.options.objects)
		).then(function(){
			me.$sensorTree
				.appendTo(me.$parent)
				.parents('.loading').removeClass('loading');
			me.$treeblocker = me.$sensorTree.find('#treeblocker');

			if(me.editable){
				$.event.special.drop.targets=[];
				$.drop({ mode: 'mouse', distance: 5, multi: false });

				me.$sensorTree.on({
					'drop': function dropSensor(e, d) {
						var $target = $(e.currentTarget)
							, idx = parseInt(($target.attr('idx') || -1))
							, row = parseInt($target.closest('.sensorItem').attr('idx'))
            ;
						if(!!d.feedback && me.$draggedSensor!==null){
							if(d.feedback === 'copy' || ((e.ctrlKey||e.metaKey) && /copy/.test(d.feedback) === true && !e.shiftKey)){
								me.$treeblocker.show();
								me.$sensorTree.removeClass('cursor-none cursor-copy').addClass('cursor-progress');
								me.$draggedSensor.removeClass('sensorAdorner');
								var $draggedSensorKeep = me.$draggedSensor
									, $dragSensorKeep = me.$dragSensor
									, srcids = $.map(d.sensors, function(elm){
									return parseInt($(elm).attr('idx'),10);
								});
								me.$draggedSensor= null;
								d.dataView.cloneLeaf(me.$sensorTree.data('sensortree').grid, d.row, row, srcids, idx)
									.always(function(){
										me.$sensorTree.removeClass('cursor-progress');
										me.$treeblocker.hide();
									}).fail(function(){
										 $draggedSensorKeep.remove();
									});
							}else if (d.row === row) {
								me.$treeblocker.show();
								if(idx === -1)
									idx = me.$sensorTree.data('sensortree').dataview.getItemByRow(row).leafs.length -1;
								me.$sensorTree.removeClass('cursor-none cursor-copy').addClass('cursor-progress');
								var $draggedSensorKeep = me.$draggedSensor
									, $dragSensorKeep = me.$dragSensor;
								me.$dragSensor().hide();
								me.$dragSensor = null;
								me.$draggedSensor.removeClass('sensorAdorner');
								me.$draggedSensor= null;
								var srcids = $.map(d.sensors, function(elm){
									return parseInt($(elm).attr('idx'),10);
								});
								d.dataView.moveLeafe(me.$sensorTree.data('sensortree').grid, d.row, srcids, idx)
									.always(function(){
										me.$sensorTree.removeClass('cursor-progress');
										me.$treeblocker.hide();
									}).fail(function(){
										 $draggedSensorKeep.remove();
										 $dragSensorKeep().show();
									}).done(function(){
										$dragSensorKeep().remove();
									});
							}
						}
					},
					'dropstart': function dropStartSensor(e, d) {
						var $target = $(e.currentTarget)
							, idx = parseInt(($target.attr('idx') || -1), 10)
							, $sensors = $target.closest('.sensorItem')
							, row = parseInt($sensors.attr('idx'), 10)
            ;
						d.feedback = false;
						if($sensors.attr('type') === 'device'
						&& !$sensors.hasClass('clusterprobedevice')){
							switch (d.type) {
								case 'sensor':
									if(d.selection.is('.fixed')){
										if(row === d.row)
											d.feedback = 'move';
										else
											d.feedback = false;
									} else {
										if (row === d.row)
											d.feedback = 'move,copy';
										else
											d.feedback = 'copy';
									}
									break;
								default:
									break;
							}
						}
						if(!!d.feedback){
							if(row === d.row && d.sensorIdx < idx)
								$target.after(me.$draggedSensor.detach());
							else
								$target.before(me.$draggedSensor.detach());
							if(d.feedback === 'copy' || ((e.ctrlKey||e.metaKey) && /copy/.test(d.feedback) === true && !e.shiftKey))
								me.$dragSensor().show();
							else
								me.$dragSensor().hide();
						}else{
							e.stopImmediatePropagation();
						}
					}
				}, 'sensor');


				me.$sensorTree.on({
					'drop.livedrag': function dropTreeItem(e, d) {
						var $target = $(e.currentTarget)
							, dstrow = parseInt(($target.attr('idx') || -1))
							, dstType = ($target.find('probe,group,device')[0] || $target).localName
							, func = "moveNode"
							, grid = me.$sensorTree.data('sensortree').grid
            ;
						if(d.feedback !== false){
							if (d.row !== dstrow) {
								me.$treeblocker.show();
								me.$sensorTree.removeClass('cursor-none cursor-copy');

								if((e.ctrlKey||e.metaKey) && /copy/.test(d.feedback) === true && !e.shiftKey)
										func = "cloneNode";
								var deferreds = $.map(d.selection, function(e, i){
									var srcrow = parseInt($(e).attr('idx'),10);
									return d.dataView[func](grid, srcrow, dstrow, d.move);
								});
								$.when.apply($,deferreds)
									.always(function(){
										d.dataView.refresh(grid,true);
										me.$sensorTree.removeClass('cursor-progress');
										me.$treeblocker.hide();
										me.$sensorTree.triggerHandler('DragEnd');
										$('#main_menu').parent().load('/controls/menu.htm')
								});
							}
						}
						me.$sensorTree.data('sensortree').grid.onDragEnd.notify(d,e);
						e.stopImmediatePropagation();
					},
					'dropend.livedrag':function(e){
						$(this).off('mousemove.drag');
					},
					'dropstart.livedrag': function dropStartTreeItem(e, d) {
						var $target = $(e.currentTarget)
							, row = parseInt(($target.attr('idx') || -1))
							, dstType = ($target.find('probe,group,device')[0] || $target).localName
            ;
						d.feedback = false;
						me.$dropTreeAdorner.removeClass().remove();
						if(!$target.is('.fixed')){
							switch (d.type) {
								case 'group':
									if(!me.$sensorTree.data('sensortree').dataview.isChild(d.row,row)){
										if (/probe|group|device/.test(dstType) && row > 0)
											d.feedback = 'move,copy';
									}
									break;
								case 'probe':
									if(!me.$sensorTree.data('sensortree').dataview.isChild(d.row,row)){
										if (/probe/.test(dstType) || row === 0)
											d.feedback = 'move';
									}
									break;
								case 'device':
									if (/probe|group|device/.test(dstType) && row > 0)
										d.feedback = 'move,copy';
									break;
								default:
									break;
							}
							$target.on('mousemove.drag','',{me:me,d:d},function(e){
								var $self = $(this)
									, me = e.data.me
									, d = e.data.d
									, h = $self.height()
									, dy = h - e.clientY + $self.offset().top
                ;
								h /= 3;
								if(dy > 2*h){ // before
									me.$dropTreeAdorner.removeClass('dropOnClosed dropAfter').addClass('dropBefore');
									d.move ='before';
								}else if(dy > h && dstType !== 'device'){ // insert
									me.$dropTreeAdorner.removeClass('dropBefore dropAfter').addClass('dropOnClosed');
									d.move ='insert';
								}else{ //after
									me.$dropTreeAdorner.removeClass('dropOnClosed dropBefore').addClass('dropAfter');
									d.move ='after';
								}
							});
							if(d.feedback && row !== d.row) {
									$target.closest('.slick-row').prepend(me.$dropTreeAdorner);
									var classes = ' ui-icon-play level' + (parseInt($target.attr('level'))-2);
									if($target.is('.groupItem') && $target.is('.collapsed')){
										me.$dropTreeAdorner.addClass('dropOnClosed' + classes);
									} else if(row < d.row){
										me.$dropTreeAdorner.addClass('dropBefore' + classes);
									}else if(row > d.row){
										me.$dropTreeAdorner.addClass('dropAfter' + classes);
									}
								}
						}
						return true;
					}
				}, 'div.treeItem');

				me.$sensorTree.on({
					'drop': function dropSensorItem(e, d) {
						var $target = $(e.currentTarget).find('.sensorItem').andSelf().last()
							, idx = parseInt(($target.attr('idx') || -1))
							, row = parseInt($target.closest('.sensorItem').attr('idx'))
            ;
						if(!!d.feedback && me.$draggedSensor!==null){
							if(d.feedback === 'copy' || ((e.ctrlKey||e.metaKey) && /copy/.test(d.feedback) === true && !e.shiftKey)){
								me.$treeblocker.show();
								me.$sensorTree.removeClass('cursor-none cursor-copy').addClass('cursor-progress');
								me.$draggedSensor.removeClass('sensorAdorner');
								var $draggedSensorKeep = me.$draggedSensor
									, $dragSensorKeep = me.$dragSensor;
								me.$draggedSensor= null;
								var srcids = $.map(d.sensors, function(elm){
									return parseInt($(elm).attr('idx'),10);
								});
								d.dataView.cloneLeaf(me.$sensorTree.data('sensortree').grid, d.row, row, srcids, idx)
									.always(function(){
										me.$sensorTree.removeClass('cursor-progress');
										me.$treeblocker.hide();
									}).fail(function(){
										 $draggedSensorKeep.remove();
									});
							}else if (d.row === row) {
								me.$treeblocker.show();
								if(idx === -1)
									idx = me.$sensorTree.data('sensortree').dataview.getItemByRow(row).leafs.length -1;
								me.$sensorTree.removeClass('cursor-none cursor-copy').addClass('cursor-progress');
								var $draggedSensorKeep = me.$draggedSensor
									, $dragSensorKeep = me.$dragSensor
                ;
								me.$dragSensor().hide();
								me.$dragSensor = null;
								me.$draggedSensor.removeClass('sensorAdorner');
								me.$draggedSensor= null;
								var srcids = $.map(d.sensors, function(elm){
									return parseInt($(elm).attr('idx'),10);
								});
								d.dataView.moveLeafe(me.$sensorTree.data('sensortree').grid, d.row, srcids, idx)
									.always(function(){
										me.$sensorTree.removeClass('cursor-progress');
										me.$treeblocker.hide();
									}).fail(function(){
										 $draggedSensorKeep.remove();
										 $dragSensorKeep().show();
									}).done(function(){
										$dragSensorKeep().remove();
									});
							}
						}
						e.stopPropagation();
					},
					'dropstart': function dropStartSensorItem(e, d) {
						var $target = $(e.currentTarget).find('.sensorItem').andSelf().last()
							, idx = -1
							, row = parseInt($target.attr('idx'))
            ;
						d.feedback = false;
						if($target.hasClass('clusterprobedevice')===false){
							switch (d.type) {
								case 'sensor':
									if(d.selection.is('.fixed')){
										if(row === d.row)
											d.feedback = 'move';
									} else {
										if (row === d.row)
											d.feedback = 'move,copy';
										else{
											d.feedback = 'copy';
										}
									}
									break;
								default:
									break;
							}
						}
						if(!!d.feedback){
							$target.children('div').append(me.$draggedSensor.detach());
							if(d.feedback === 'copy' || ((e.ctrlKey||e.metaKey) && /copy/.test(d.feedback) === true && !e.shiftKey))
								me.$dragSensor().show();
							else
								me.$dragSensor().hide();
						}
						return true;
					}
				}, 'row');

				me.$sensorTree.sensortree('subscribe', 'onDragStart', function dragstart(e, d) {
					if(d.hasOwnProperty('sensorIdx') && !!d.data.leafs && !!d.data.leafs.length){
						me.$dragSensor = (function(p,o){
							var path = p
								, objid = o
							;
							return function getDragSensor(){
								return $('div[path="'+path+'"]').find('sensor[objid="'+objid+'"], sensor.selected').not('.sensorAdorner');
							};
						})(d.data._id, d.data.leafs[d.sensorIdx].objid);
						if(me.$dragSensor().length){
							me.$draggedSensor = me.$dragSensor().clone().addClass('sensorAdorner');
							return;
						}
					} else {
						me.$dragSensor = null;
						me.$draggedSensor  = null;
					}
					e.stopImmediatePropagation();
				});

				me.$sensorTree.sensortree('subscribe', 'onDragEnd', function dragend(e, d) {
					if(me.$dragSensor !== null){
						me.$dragSensor().show();
						me.$dragSensor = null;
					}
					if(me.$draggedSensor !== null){
						me.$draggedSensor.remove();
					}
					me.$sensorTree.find('.selected').removeClass('selected');
					e.stopImmediatePropagation();
				});

				if($('.multiedit').length){
                    var selectedIds = []
						, selectedObjectType = ''
						, selectorArray = []
						, selectedTimer = null
						, objIDs = ""
						, lastSelected=null
						, obj = null
						, loadmultiinlineedit = function(){
						    me.$editSettings
  								// .attr('loadurl','/multiinlineedit.htm?id='+objIDs)
  								.load('/multiinlineedit.htm?id='+objIDs+'&tabid=1',function(){
  									_Prtg.initPlugins(me.$editSettings);
                                    $('.js-rightPanel_title').text(_Prtg.Lang.common.strings.settings)
                  				});
							};

					me.$editSettings
						.on('click.edit', '#PRTGContextMenu li#dodelte, .buttonbox a[delete]', function(e){
							e.stopImmediatePropagation();
							_Prtg.objectTools.deleteObject(selectedIds,true).done(function(){
								selectedIds = [];
								selectorArray = [];
								objIDs = "";
								me.$sensorTree.find('.selected').removeClass('selected');
								me.$editSettings.empty();
								$('.sensorTree').data('sensortree').dataview.refresh($('.sensorTree ').data('sensortree').grid);
							});
						})
						.on('click.edit','.buttonbox a[pause]', function(){
							_Prtg.objectTools.pauseObject(selectedIds.join(','),0).done(function(){
								loadmultiinlineedit();
								$('.sensorTree').data('sensortree').dataview.refresh($('.sensorTree ').data('sensortree').grid);
							});
						})
						.on('click.edit', '.buttonbox a[resume]', function(){
							_Prtg.objectTools.pauseObject(selectedIds.join(','),1).done(function(){
								loadmultiinlineedit();
								$('.sensorTree').data('sensortree').dataview.refresh($('.sensorTree ').data('sensortree').grid);
							});
						})
						.on('click.edit', '.buttonbox a[favorite]', function(){
							_Prtg.objectTools.faveObject(selectedIds.join(','),'toggle').done(function(){
								loadmultiinlineedit();
								$('.sensorTree').data('sensortree').dataview.refresh($('.sensorTree ').data('sensortree').grid);
							});
						})
						.on('click.edit','.buttonbox a[checknow]', function(){
							_Prtg.objectTools.checkObjectNow(selectedIds.join(',')).done(function(){
								loadmultiinlineedit();
								$('.sensorTree').data('sensortree').dataview.refresh($('.sensorTree ').data('sensortree').grid);
							});
						});

					me.$sensorTree.data('sensortree').grid.onRefreshLeafs.subscribe(function(){
						$.each(selectorArray, function(i,e){
							$(e).addClass('selected');
						});
					});
					me.$sensorTree.data('sensortree').grid.onPostRender.subscribe(function(){
						$.each(selectorArray, function(i,e){
							$(e).addClass('selected');
						});
					});

					me.$sensorTree.on('click', function(e,d){
						if(/toggler|level/.test(e.target.localName) === true || $(e.target).is('.sensorItem')){
							obj = null;
						} else {
							obj = $(e.target).andSelf().closest('*[objid]');
							obj = obj.last();
						}
						if(obj===null || !((e.ctrlKey||e.metaKey) || e.shiftKey) || obj.attr('type') !== selectedObjectType){
							selectedIds = [];
							selectorArray = [];
							objIDs = "";
							me.$sensorTree.find('.selected').removeClass('selected');
							me.$editSettings.empty();
							$('.leftpanel_titletext').remove();

							if(obj === null){
								e.stopImmediatePropagation();
								e.preventDefault();
								return;
							}
							selectedObjectType = obj.attr('type');
						}

						var selectedTimer = clearTimeout(selectedTimer);
						if(objIDs.indexOf(obj.attr('objid'))===-1
						&& !obj.hasClass('sensorItem')
						&& !obj.is('sensor[type!="sensor"]')){
							var $obj = obj;
							if(e.shiftKey && !!lastSelected){
								if(parseInt(lastSelected.attr("idx")) < parseInt(obj.attr("idx")))
									$obj = $obj.prevUntil(lastSelected, '*[type="'+selectedObjectType+'"]').andSelf();
								else
									$obj = $obj.nextUntil(lastSelected, '*[type="'+selectedObjectType+'"]').andSelf();
							}

							$obj.each(function(){
								var $this = $(this);
								if(!$this.hasClass('noContextMenu')){
									$this.addClass('selected');
									var objid = $this.attr('objid');
									if(objIDs.indexOf(objid)===-1){
										selectorArray.push(this.localName + '[objid="' +  objid +  '"]:first');
										selectedIds.push(objid);
									}
								}
							});
						} else if(objIDs.indexOf(obj.attr('objid'))>-1){
							var $obj = obj;
							if(e.shiftKey && !!lastSelected){
								if(parseInt(lastSelected.attr("idx")) < parseInt(obj.attr("idx")))
									$obj = $obj.prevUntil(lastSelected, '*[type="'+selectedObjectType+'"]').andSelf();
								else
									$obj = $obj.nextUntil(lastSelected, '*[type="'+selectedObjectType+'"]').andSelf();
							}

							$obj.each(function(){
								var $this = $(this);
								$this.removeClass('selected');
								for(var ii=0; ii < selectedIds.length; ++ii){
									if($this.attr('objid') === selectedIds[ii]){
										selectorArray.splice(ii,1);
										selectedIds.splice(ii,1);
										break;
									}
								}
							});
						}

						if(selectedIds.length
						&& objIDs !== selectedIds.join(',')){
							objIDs = selectedIds.join(',');
							lastSelected= obj;
							$('.sensorTree').data('sensortree').options.loadDataOnRefresh = false;
							selectedTimer = setTimeout(loadmultiinlineedit, 300);
						} else if(selectedIds.length==0){
							me.$editSettings.empty();
							$('.leftpanel_titletext').remove();
							objIDs='';
							$('.sensorTree').data('sensortree').options.loadDataOnRefresh = true;
						}
					});
				}

				me.$sensorTree.removeClass('tiny lage medium small').addClass('small');

        $(me.parent).Events().subscribe('refresh.events.prtg', $.proxy(me.refresh, me));
        $(me.parent).Events().subscribeOnce('navigate.prtg', $.proxy(function(){
          $(this.parent).Events().unsubscribe('refresh.events.prtg', $.proxy(this.refresh, this));
        },me));

			} else {
				if(me.$sensorTree.closest('.focussearch').length > 0)
					setTimeout(function () { $('#treesearch').focus();}, 0);
			}
		});
	};


  $.fn[pluginName] = function ( options, parent ) {
  	var me = this
  		, elm = this
    ;
  	if(!!options){
  		if(!!options.pluginTarget)
  			me = $(options.pluginTarget);
  		if(!!options.pluginFunction){
  			return me.each(function(){
  				$.data(this, "plugin_" + pluginName )[options.pluginFunction](elm, options);
  			});
  		}
  	}
    return me.each(function () {
      if ( !$.data(this, "plugin_" + pluginName )) {
        $.data( this, "plugin_" + pluginName, new ObjectTree( this, options, parent ));
      }
    });
  };
})( jQuery, window, document );
