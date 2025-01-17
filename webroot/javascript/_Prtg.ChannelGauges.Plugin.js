﻿//_Prtg.objectoverview.plugin.js

(function($, window, document, undefined) {
  var pluginName = "channelgauges";

  function Plugin(element, data, parent) {
      this.data = data;
      this.element = element;
      this.$element = $(element);
      this.$parent = $(parent);
      this.template = data.type==='channels'
        ? _Prtg.Core.getObject('sensor').channelTemplates.gauge.template
        : _Prtg.Core.getObject('device').channelTemplates.gauge.template;
      this.ajaxdata = !!data.ajaxdata ? data.ajaxdata : data.type==='channels'
      ? $.extend(true,{},_Prtg.Core.getObject('sensor').channelTemplates.gauge.data)
      : $.extend(true,{},_Prtg.Core.getObject('device').channelTemplates.gauge.data);
      if(!!this.data.filterpriority)
        this.ajaxdata.filter_priority = this.data.filterpriority;
      if(!!this.data.filter)
        $.extend(this.ajaxdata,data.filter);
      this.ajaxdata.id = data.objectid;
      this.init(this);
      this.render(this);
      if(!!this.data.sortable)
        this.sortable = this.$element.sortable(data, parent, true)[0].refresh();
  }

  Plugin.prototype.refresh = function() {
    var me = this;
    if (this.data.mapobj == true) return;
    $.ajax({
      type: 'GET',
      url: '/api/table.json',
      data: me.ajaxdata,
      dataType: 'json',
      cached: false,
      traditional: true,
      beforeSend: function(jqXHR){
        jqXHR.peNumber = 'PE1125';
      }
    }).done(function(d){
      me.data.objects = d;
      me.render.call(me, me);
      !!me.sortable && me.sortable.refresh();
    });
  };

  Plugin.prototype.init = function(me) {

    if(!!me.data && ['cloudhttp','cloudping'].indexOf(me.data.sensortype)>-1){
       $('.responsiveobjectoverview_panelB')
       		.remove('#globe')
       		.prepend('<div id="globe" class="graphbox"><div class="prtg-plugin" data-plugin="prtg_globe" style="width:100%;margin-bottom:6px"/><div class="globetitle" /></div>');
       var globe = $('#globe', '.responsiveobjectoverview_panelB');
       globe.find('.prtg-plugin').data(me.data.objects[me.data.type]);
      _Prtg.initPlugins(globe);
    }

    if(!_Prtg.Events) return;

    _Prtg.Events.subscribe('refresh.events.prtg', $.proxy(me.refresh, me));
    me.$element
      .removeAttr('data-objects')
      .on('destroyed',function() {
        _Prtg.Events.unsubscribe('refresh.events.prtg', $.proxy(me.refresh, me));
      });
    if(!_Prtg.Options.userIsReadOnly) {
      me.$element
        .on('click','.channeledit, .channelsettings', function(e) {
          if($(this).hasClass('channeledit') || e.target.className.indexOf('editsetting') > -1) {
            _Prtg.objectTools.channelEditDialog(me.data.objectid, $(this).data().channel);
          } else if(e.target.className.indexOf('setprimarychannel') > -1) {
            me.data.primarychannel = $(this).data().channel;
            _Prtg.objectTools.primaryChannel.call(me.$element[0], me.data.objectid,$(this).data().channel);
          }
          e.stopImmediatePropagation();
        })
        .on('click','.toplistsettings', function(e) {
          if(e.target.className.indexOf('editsetting') > -1) {
            _Prtg.Dialogs.defaultDialog(
              "/controls/toplistedit.htm",
              $(this).data()
            ).done(function(result, action) {
              return $.ajax({
                url: action,
                type: "POST",
                data: result,
                beforeSend: function(jqXHR) {
                  jqXHR.peNumber = 'PE1121';
                }
              }).done(function(html) {
                _Prtg.objectTools.update.call(me.$element);
              });
            });
        } else if(e.target.className.indexOf('add') > -1) {
          _Prtg.Dialogs.defaultDialog(
            "/controls/toplistadd.htm",
            $(this).data()
            ).done(function(result, action) {
              return $.ajax({
                url: action,
                type: "POST",
                data: result,
                beforeSend: function(jqXHR) {
                  jqXHR.peNumber = 'PE1122';
                }
              }).done(function(html) {
                _Prtg.objectTools.update.call(me.$element);
              });
            });
        } else if(e.target.className.indexOf('delete') > -1) {
          _Prtg.Dialogs.defaultDialog(
            "/controls/toplistdelete.htm",
            $(this).data()
            ).done(function(result, action) {
              return $.ajax({
                url: action,
                type: "POST",
                data: result,
                beforeSend: function(jqXHR) {
                  jqXHR.peNumber = 'PE1123';
                }
              }).done(function(html) {
                _Prtg.objectTools.update.call(me.$element);
              });
            });
        }
      });
    }
  };

    Plugin.prototype.render = function (me) {
        var primaryObjects = [];
        var smallObjects = [];

        me.$element.empty();
        if (!me.data || !me.data.objects || !me.data.objects[me.data.type] || !me.data.objects[me.data.type].length) {
            renderDisplayEmptyMessage();
            return;
        }

        sortObjects(me.data.objects[me.data.type], me.data.type, me.data.mapview);

        var mainElem = me.$element;
        me.$element.append('<div class="centered"></div>');
        me.$element = me.$element.find('.centered');

        $.each(primaryObjects, function () {
            if (!!this.addinfo.lookups)
                me.renderLookup.call(this, me, this.addinfo);
            else
                me.renderGauge.call(this, me, this.addinfo);
        });


        $.each(smallObjects, function () {
            if (!!this.addinfo.lookups)
                me.renderLookup.call(this, me, this.addinfo);
            else
                me.renderGauge.call(this, me, this.addinfo);
        });
        me.$element.append('<div style="clear: both;"></div>');
        me.$element = mainElem;


        if ((primaryObjects.length + smallObjects.length) < 1
            && !$(".overviewsmalldata").hasClasses(["overviewsmalldatastatus7", "overviewsmalldatastatus8", "overviewsmalldatastatus9", "overviewsmalldatastatus11", "overviewsmalldatastatus12"])) {
            renderDisplayEmptyMessage();
        }

        function renderDisplayEmptyMessage(){
            if ((me.data.type === 'sensors') && me.$element.closest('.map_object').length === 0) {
                me.$element.html('<div class="oskhelpbox nosensors">' + _Prtg.Lang.objectoverview.strings.nosensors + ' &nbsp;' +
                    '<i class="priority3"></i>' + ' / ' + '<i class="priority4"></i> .</div>');
            }
            else {
                $('#displaytable').show();
                $('#overviewshowtablelink').hide();
            }
        }

        //me.data.objects[me.data.type], me.data.mapview
        function sortObjects(object, type, mapview ) {

            $.each(object, function () {
                var info = !!this.info.data ? $.extend(true, {}, this.info.data[0]) : null;
                this.addinfo = info;
                this.primary = (((info||{}).primary || this.priority > 4) ? (/small/.test(mapview || '') !== true ? ' primary' : ' smallprimary') : '');

                if (!info || !info.name || info.show === 0
                    || (type === 'channels' && !this.condition)
                    || $(".overviewsmalldata").is(".overviewsmalldatastatus7,.overviewsmalldatastatus12"))
                    return;

                if (this.primary === ' primary')
                    primaryObjects.push(this);
                else {
                    if ((/primaryonly/.test(mapview || '') === false) || this.primary === ' smallprimary'){
                        smallObjects.push(this);
                    }
                }
            });
        }
    };

  Plugin.prototype.renderLookup = function(me,info) {
    this.channelidtxt = '<br>'
        +(me.data.type==='channels'
          ?_Prtg.Lang.objectoverview.strings.ChannelID
          :_Prtg.Lang.objectoverview.strings.SensorID)
        +': ' +info.id;
    this.minimumtxt= "";
    this.maximumtxt= "";

    me.$element[(!!this.primary?"prepend":"append")]($.jqote(me.template, this));
    var config = {
        size: (this.primary === ' primary'?220:60),
        label: info.name.substring(0,10),
        greenColor:"status3",
        yellowColor:"status4",
        redColor:"status5",
        grayColor:"status0",
        lookups: info.lookups,
        lastvalue: info.lastvalue,
        lastvalueraw: info.lastvalueraw
      }
      , mygauge = new _Prtg.Graphixs.LookupsDonut($('#channelgauge'+info.id, me.element)[0], config);
      mygauge.render();
  };

  Plugin.prototype.renderGauge = function(me,info) {

      this.channelidtxt = '<br>'
        +(me.data.type==='channels'
          ?_Prtg.Lang.objectoverview.strings.ChannelID
          :_Prtg.Lang.objectoverview.strings.SensorID)
        +': ' +info.id;
      this.minimumtxt=this.maximumtxt="";
      if(!!info.alltimeminimum)
        this.minimumtxt="<br>"+_Prtg.Lang.objectoverview.strings.Min+": "+info.alltimeminimum;
      if(!!info.alltimemaximum)
        this.maximumtxt="<br>"+_Prtg.Lang.objectoverview.strings.Max+": "+info.alltimemaximum;

      var config = {
            size: (this.primary === ' primary'?220:56),
            label: info.name.substring(0,10),
            min:info.graphminraw||0,
            max:info.graphmaxraw||1000,
            avg:null,
            redZones : [],
            yellowZones : [],
            grayZones : [],
            greenZones : [],
            greenColor:"status3",
            yellowColor:"status4",
            redColor:"status5",
            grayColor:"status0"
          }
        , transform_conf = ['min','max']
        , transform_lim = ['limitminwarning','limitmaxwarning','limitminerror','limitmaxerror']
        , transform_val = ['lastvalueraw','averageraw'];

      if(!!info.average){
        config.avgtxt = _Prtg.Lang.objectoverview.strings.Avg+": "+info.average;
        this.maximumtxt = "<br>"+config.avgtxt+this.maximumtxt ;
      }

      me.$element[(!!this.primary?"prepend":"append")]($.jqote(me.template, this));


      var scale = config.max - config.min
        , min = config.min;
      if(!!scale){
        if(!!info.limitmode && info.limitminwarning !== "" && info.limitmaxwarning === info.limitminwarning){
          info.limitminwarning += (-0.05*scale);
          info.limitmaxwarning += (0.05*scale);
        }
        if(!!info.limitmode && info.limitmaxerror !== "" && info.limitminerror === info.limitmaxerror){
          info.limitmaxerror += (0.05*scale);
          info.limitminerror += (-0.05*scale);
        }
        transform_conf.forEach(function(e){
          config[e] = Math.round((config[e] - min) / scale * 1000);
        });
        if(!!info.limitmode)
          transform_lim.forEach(function(e){
            if(info[e] !== '')
              info[e] = Math.round((info[e] - min) / scale * 1000);
          });
        transform_val.forEach(function(e){
          if(info[e] !== '')
            info[e] = Math.round((info[e] - min) / scale * 1000);
        });
      }
      var hidelabels=false;
      if (info.hasOwnProperty('averageraw') && info.averageraw!=='') { config.avg = info.averageraw, transform_conf.push('avg');}
      if (info.graphmaxraw === null || info.graphminraw === null || isNaN(info.lastvalueraw)) {
        config.min=0;
        config.max=1000;
        hidelabels=true;
        config.grayZones.push({ from: config.min, to: config.max });
        config.grayColor = 'status' + info.status;
      } else if(info.status===7||info.status===8||info.status===9||info.status===11||info.status===12) { //paused
        config.min=0;
        config.max=1000;
        config.grayZones.push({ from: config.min, to: config.max });
        config.grayColor= 'status' + info.status;
        hidelabels=true;
        $("#channelbox"+info.id+" .channelvalue", me.element).hide();
      } else if (info.status===0||info.status===1||info.status===6) { //unknown
        config.min=0;
        config.max=1000;
        config.grayZones.push({ from: config.min, to: config.max });
        hidelabels=true;
        $("#channelbox"+info.id+" .channelvalue", me.element).hide();
      } else {
        config.greenZones.push({ from: config.min, to: config.max });
        if(info.graphmaxraw === info.graphminraw)
          hidelabels=true;
      }
      if (!hidelabels && !!info.limitmode) {
        if (info.limitminwarning!=="")
          config.yellowZones.push({ from: config.min, to: info.limitminwarning });
        if (info.limitminerror!=="")
          config.redZones.push({ from: config.min, to: info.limitminerror });
        if (info.limitmaxwarning!=="")
          config.yellowZones.push({ from: info.limitmaxwarning, to: config.max  });
        if (info.limitmaxerror!=="")
          config.redZones.push({ from: info.limitmaxerror, to: config.max  });
      }
        $('#channelbox'+info.id, me.element).data('gauge',{config:config,info:info});
        var mygauge = new _Prtg.Graphixs.Gauge($('#channelgauge'+info.id, me.element)[0], config);
        if (info.graphmax) config.maxtext=info.graphmax;
        if (info.graphmin) config.mintext=info.graphmin;
        mygauge.render(info.lastvalueraw);
        if (hidelabels) {
          $("#channelgauge" + info.id + " .pointerContainer,#channelgauge" + info.id + " text", me.element).hide();
        }
  };

	_Prtg.Plugins.registerPlugin(pluginName, Plugin);

})(jQuery, window, document);
