﻿// _Prtg.Satus.Plugin.js
(function($, window, document, undefined) {

  function status(element, data, parent) {
    this.data = data;
    this.$element = $(element);
    this.$parent = $(parent);
    this.timer = this.$parent.Events();
    this.$elms = this.$element.find('[status]');
    this.init(this);
  }

  status.prototype.init = function(me) {
    me.$elms.each(function() {
      var arg = $(this).attr('status').split(';')
        , i, args, proxy, prop, attr, prepend;

      for(i=0; i < arg.length; ++i) {
        args = arg[i].split(',');
        proxy = null;
        prop = null;
        attr = "";
        prepend = "";

        if(args.length === 0)
          return;
        if(args.length === 1) {
            proxy = me.updateContent;
            prop = args[0];
        } else {
            proxy = me.updateAttr;
            prop = args[0];
            attr = args[1];
            prepend = (args.length===3?args[2]:"");
        }
        _Prtg.Events.subscribe('newstats.prtg',$.proxy(proxy, this, prop, attr, prepend));
      }
    });

    me.$element.on('destroyed', $.proxy(function(e) {
      _Prtg.Events.unsubscribe('newstats.prtg');
    }, me));
  };

  status.prototype.updateContent = function(prop, attr, prepend, event, data) {
    $(this).html(data.object[prop]);
  };

  status.prototype.updateAttr = function(prop, attr, prepend, event, data) {
    if(attr === 'title'){
      attr =  (!!$(this).attr('title') ? 'title' : 'data-original-title');
    }
    $(this).prop(attr, prepend + data.object[prop]);
  };

  _Prtg.Plugins.registerPlugin("status", status);

})(jQuery, window, document);
