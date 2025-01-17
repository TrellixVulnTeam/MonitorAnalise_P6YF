﻿// _Prtg.Channels.Plugin.js
(function($, window, document, undefined) {
  var pluginName = 'channels';

  function Plugin(element, data, parent) {
    this.element = $(element);
    this.data = data;
    this.parent = $(parent);
    // initialize form plugin first
    if (!this.data.singleedit) this.element['prtg-form'](data,parent);

    this.container = this.parent.find(data.container);
    this.select = this.element.find('#channelsdropdown');
    this.channelkind = -999;
    this.channelval = 0;
    this.multiedit = 0;
    this.init(this);
  }

  Plugin.prototype.init = function(me) {
    if (me.data.singleedit) {
      me.select.val(me.data.channelid);
      me.select.on('change', function(e) {
        if (me.container.find('.prtg-form').hasClass('formchanged')) {
          _Prtg.Dialogs.confirmDialog(_Prtg.Lang.Dialogs.strings['savewarningtitle'], _Prtg.Lang.Dialogs.strings['savewarning'], _Prtg.Lang.common.strings['save'], _Prtg.Lang.common.strings['discardchanges']).done(function() {
            me.container.find('.prtg-form').addClass('dialogform').trigger('submit');
            me.loadContent(me);
          }).fail(function() {
            me.loadContent(me);
          });
        } else {
          me.loadContent(me);
        }
      });
    } else {
      me.select
        .on('click', function(e) {
          var selected = $(this).find(':selected').not(e.target)
            , $current = $(e.target)
            , val = $current.val()
            , chan = $current.attr('data-channel-kind');
          //IE hack
          e.preventDefault();
          if(typeOf(val) === "Array") {
            val = val[0];
            chan = $(this).find('option[value="'+val+'"]');
            selected = $(this).find(':selected').not(chan);
            chan = chan.attr('data-channel-kind');
          }
          val = parseInt(val, 10);
          if(e.shiftKey && val > 0){
            selected.prop("selected", false);
            me.select.find('[data-channel-kind="'+chan+'"]').not('[value^="-"]').prop('selected',true);
            me.channelkind = chan;
          }
          if(val < 0 || me.channelval < 0 || chan !== me.channelkind) {
            selected.prop("selected", false);
          }
          me.channelkind = chan;
          me.channelval = val;
          me.select.trigger("changed");
        })
        .on('changed',function() {
          var myurl="/controls/"+me.data.template
           , channels = $.map(me.select.serializeArray(), function(elm){return elm.value;});
          if(channels.length > 1 || (''+me.data.objectid).indexOf(',') > 0) {
            me.multiedit=1;
          } else {
            me.multiedit=0;
          }
            if( me.container.find('.loadspinner').length == 0){
                me.container.append('<div class="loadspinner"></div>')
            }
          me.container.addClass('loading').removeClass('prtg-form');
          $.ajax({
            url: myurl,
            data:{
              id: me.data.objectid,
              channel: channels,
              channelmultiedit: me.multiedit
            },
            type: "POST",
            dataType: "html"
          }).done(function(html,status) {
            me.container.removeClass("loading").html(html);
            _Prtg.initPlugins(me.container);
            if(me.multiedit === 1){
              me.element.closest('.ui-dialog').find('button.submit').off('mousedown.multiedit').on('mousedown.multiedit',function channelClick(e) {
                e.preventDefault();
                var o={}
                  , values = me.container.find('#channelsform').serializeArray();
                  channels.pop();
                  jQuery.each(values, function () {
                    if(this.name.indexOf('_')>-1 && !!parseInt(this.name.split('_')[1],10)) {
                      var n = this.name.split('_')
                        , v = this.value;
                      channels.forEach(function(value){
                        n[1] = value;
                        var name = n.join("_");
                        if(o[name] === undefined) {
                          o[name] = v || '';
                        }
                      });
                    }
                  });
                  $(this).trigger('click', o);
              });
            }
        });
      });
    }
  };

  Plugin.prototype.loadContent = function(me) {
      if( me.container.find('.loadspinner').length == 0){
          me.container.append('<div class="loadspinner"></div>')
      }
    me.container.addClass('loading');
        $.ajax({
          url: 'controls/' + me.data.template,
          data: {
            id: me.data.objectid,
            channel: me.select.val()
          },
          type: 'GET',
          dataType: 'html'
        }).done(function(response) {
          me.container.removeClass('loading');
          me.container.html(response);
          _Prtg.initPlugins(me.container);
        });
  };
  _Prtg.Plugins.registerPlugin(pluginName, Plugin);
})(jQuery, window, document);
