﻿//_Prtg.Toplist.Toplist.js
//Plugins: toplistperiods, toplist, toplistpreview
(function($, window, document, undefined) {

  function Periods(element, data, parent) {
    this.element = $(element);
    this.data = data;
    this.parent = $(parent);
    this.template = _Prtg.Core.objects.toplistTimeline;
    this.init(this);
    this.filters = {sdate: 0, edate: Math.pow(2, 53)};
	};

  Periods.prototype.init = function(me) {
    var topnumber;
    me.element.on('click','li',function() {
      var val = $(this).attr('query');
      if(!!val) {
        val += '&subid='+me.data.subid;
        me.element.attr('query',$(this).attr('id')).find('li').removeClass('selected');
        $(this).addClass('selected');
        _Prtg.Hjax.loadLink('toplist.htm?'+val,{url:'/controls/toplistscontent.htm#toplistcontent'});
        $('#updatehref').attr('href',$('#updatehref').attr('href').split('?')[0]+'?'+val);
      }
    });
    this.render(this.data.objects);

    _Prtg.Events.subscribe('refresh.events.prtg', $.proxy(me.refresh, me));
    _Prtg.Events.subscribe('datetimpicker.change', $.proxy(me.filter, me));
    me.element
      .one('destroyed',function() {
        _Prtg.Events.unsubscribe('refresh.events.prtg', $.proxy(me.refresh, me));
        _Prtg.Events.unsubscribe('datetimpicker.change', $.proxy(me.filter, me));
      });

  };

  Periods.prototype.render = function(data) {
    var topnumber;
    var self = this;
    this.element.css('max-height', $(window).height() - this.element.offset().top -76);
    if(!data || !data.topidx) return;
    this.element.empty().html(
      $.jqote(self.template.template, data.topidx)
    );
    topnumber = this.element.find('li#topnumber_'+_Prtg.Util.getUrlVars()['topnumber']);
    if(topnumber.length === 0) topnumber = this.element.find('li').eq(0);

    topnumber.addClass('selected');
  };

  Periods.prototype.refresh = function() {
    var self = this;
    $.ajax({
      url: this.template.url,
      dataType: 'json',
      data: $.extend(this.template.data,{id:this.data.objid,subid:this.data.subid})
    }).done(function(data) {
      self.render.call(self,data);
      self.filter.call(self);
    });
  };

  Periods.prototype.filter = function(e, plugin, reset) {
    var me = this
      , nulls = {sdate: 0,edate: Math.pow(2, 53)}
      , idx;

    if(!!plugin) {
      idx = plugin.$picker.context.id;
      if(reset === "reset") {
          this.filters[idx] = nulls[idx];
      } else {
        if(!!plugin.currentDateText) {
          this.filters[idx] = (new Date(plugin.currentDateText)).getTime();
        } else {
          this.filters[idx] = nulls[idx];
        }
        if(this.filters['sdate'] > this.filters['edate']) {
          idx = this.filters['sdate'];
          this.filters['sdate'] = this.filters['edate'];
          this.filters['edate'] = idx;
          if(idx === 'sdate' && this.filters['edate'] !== nulls['edate']) this.filters[idx] += 86400000;
        } else if(idx === 'edate' && this.filters['edate'] !== nulls['edate']) this.filters[idx] += 86400000;

      }
    }
    var sdate = me.filters.sdate
      , edate = me.filters.edate;
    this.element.find('ul').each(function() {
      var self = $(this)
        , unix = self.data().unix;
      if(sdate <= unix && edate > unix) self.show();
      else self.hide();
    });
  };

  _Prtg.Plugins.registerPlugin("toplistperiods",Periods);


  function Toplist(element, data, parent) {
    this.element = $(element);
    this.data = data;
    this.parent = parent;
    this.$parent = $(parent);
    this.timer = this.$parent.Events && this.$parent.Events();
    this.animationdata = data.animation || null;
    this.preview = data.preview || false;
    this.animId=0;
    this.legend = data.legend;
    this.asImage = !!data.asimage || false;
    this.init(this);
  }

  Toplist.prototype.init = function(me) {
    if(!!!me.data.nonrefreshable) {
			this.timer.subscribe('refresh.events.prtg', $.proxy(this.refresh, this));
			this.timer.subscribeOnce('navigate.prtg', $.proxy(function(e) {
				this.timer.unsubscribe('refresh.events.prtg', $.proxy(this.refresh, this));
			}, this));
		}
    me.statical(me, me.data.objects);
  };

  Toplist.prototype.refresh = function(e) {
    // console.log("update")
    var me = this;
    $.ajax({
      url: '/api/toplist.json',
      data:{
        id: me.data.objectid,
        topnumber: me.data.topnumber,
        subid: me.data.subid
      },
      dataType: 'json'
    }).done(function(data) {
      me.element.parents('#toplist').find('#toplistperiod').text(data.period + data.warning);
      me.statical(me,data.data);
    });
  };

  Toplist.prototype.update = function(data) {
    var me = this;
    if(!!data) me.statical(me,data.data);
  };

  Toplist.prototype.statical = function statical(me, data) {
    if(!!data && (data.topdata || data.topreport)) {
      var w = me.element.width()  || this.data.width
        , h = me.element.height() || this.data.height
        , $new = $('<div/>', {
          'class': (me.element.is('.zoomable') ? 'toplist-chordgraph zoomable' : 'toplist-chordgraph'),
          'style': 'width:'+w+'px;height:'+h+'px;'
        });
      $.when(_Prtg.Graphixs.Toplist.Chord.render((data.topdata||data.topreport),$new, me.preview, w,h,me.legend,undefined,undefined, me.asImage))
        .done(function(img) {
          if(!img){
            $new.prependTo(me.element.empty());
            $new.find('.zoom').attr('href',"graphzoomtoplist.htm?id="+ me.data.objectid+"&subid="+me.data.subid+"&topnumber="+me.data.topnumber);
          }else{
            $('<img src="' + img + '" width="'+w+'px" height="'+h+'px">').prependTo(me.element.empty());
          }
        });
    }
  };

  _Prtg.Plugins.registerPlugin("toplist",Toplist);

  function TolplistPreview(element,data,parent) {
    this.element = $(element);
    this.content = this.element.find('.scroll-content');
    this.elmH = this.content.children().eq(0).outerHeight(true)+3;
    this.data = data;
    this.parent = parent;
    this.scroll = 0;
    this.init(this);
  }

  TolplistPreview.prototype.init = function init(me) {
    me.show();
    me.element
      .on('click', '.scroll.left', function() {
        me.scroll = (me.scroll <= -me.elmH ? (me.scroll+=me.elmH) : (-me.content.height() + me.elmH));
        me.content.css({'margin-top': me.scroll});
      })
      .on('click', '.scroll.right', function() {
        me.scroll = (me.scroll >= -me.content.height() + me.elmH ? (me.scroll-=me.elmH) : 0);
        me.content.css({'margin-top':me.scroll});
    });
    $(window).on('resize.toplists',$.proxy(me.show,me));
    me.element.one('destroyed',function() {$(window).off('resize.toplists');});
  };

  TolplistPreview.prototype.show = function show() {
    if(this.elmH < this.content.height()) {
        this.element.find('.scroll').show();
      } else {
        this.element.find('.scroll').hide();
        this.content.css({'margin-top':0,'margin-left':0});
      }
  };

  _Prtg.Plugins.registerPlugin("toplistpreview",TolplistPreview);

})( jQuery, window, document );
