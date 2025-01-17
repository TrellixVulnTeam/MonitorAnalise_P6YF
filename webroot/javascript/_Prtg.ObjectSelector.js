﻿//_Prtg.ObjectSelector.js

(function($, window, document, undefined) {
  var pluginName = "objectselector";

  function Plugin(element, data, parent) {
      this.data = data;
      this.$element = $(element);
      this.$parent = $(parent);
      this.$sensorload = (!!data.sensorload && this.$parent.find(data.sensorload).length ? this.$parent.find(data.sensorload) : null);
      this.timer = null;
      this.init(this);
  }

  Plugin.prototype.init = function(me) {
      var $self = me.$element
        , data = me.data
        , node = $();
      if (!data.tree) return;
      $self.attr('data-tree', null)
      .on("loaded.jstree", function(e, o) {
        o.inst.open_all(-1);
        !!(data.branch) && o.inst.select_node("#objectlink_"+data.branch);
        !!data.disabled && !o.inst.close_node("#objectlink_"+data.disabled) &&  o.inst._get_node("#objectlink_"+data.disabled)!==false && o.inst._get_node("#objectlink_"+data.disabled).attr('rel', 'disabled');

      }).on("select_node.jstree", function(e, o) {
        node = $(o.args[0]);
        var objid = $.map(o.inst.get_selected(),function(node){return $(node).attr('objid');});
        !!node.length && !!me.$sensorload && me.loadSensorlist(objid, node);
        $self.next().val(objid.join(',')).trigger('change').trigger('blur');
        $self.parents("form").trigger("change");
      }).on("search.jstree", function (e, o) {
        $self.addClass('jstree-search');
      }).jstree({
        "json_data": {
          "data": data.tree
        },
        "ui":{
          "select_limit": data.allowone || -1,
          "initially_select": (''+data.selid||'').split(',').map(function(e){return 'objectlink_'+e;})
        },
        "core": {
          "animation": 0
        },
        "themes": {
          "url": "/css/prtg.tree.css"
        },
        "search": {
          "case_insensitive": true,
          "show_only_matches": true
        },
        "types": {
          "types": {
            "default": {
              "max_children": -2,
              "max_depth": -2,
              "valid_children": "all",
              "icon": {
                "image": "",
                "position": false
              }
            },
            "disabled": {
              "valid_children": "all",
              "hover_node": false,
              "select_node": function(node){
                  return false;
              }
            }
          }
        },
        "plugins": ["json_data", "ui", "themes", "types", "search"]
      });

    //object search
    $self.closest('form').find('#objsearch')
      .on('focusin', function(){
        var $me = $(this)
          , timer = null;
        $self
          .removeClass('jstree-search')
          .addClass('jstree-search-light');

        if ($me.val() === $me.attr('defaultvalue'))
          $me.val('');
        !!me.$sensorload && !!me.$sensorload.empty();

        $me.on('keyup.searchobject', function(e){
          if(e.target.value.length === 0) {
            clearTimeout(timer);
            $self.removeClass('jstree-search-light');
            !!node.length && !!me.$sensorload &&  me.loadSensorlist.call(me, node.parent().attr('objid'), node);

          } else {
            clearTimeout(timer);
            timer = setTimeout(function() {
              !!me.$sensorload && me.loadSensorlist.call(me, undefined,undefined,'group,device,name,tags,objid',e.target.value)
            }, 600);
          }
        });
      })
      .on('focusout', function(){
        var $me = $(this);
        $me.off('.searchobject')
      });
    //tree search
    $self
      .on('mousedown', function(e){
        if($self.hasClass('jstree-search-light')) {
          !!node.length && !!me.$sensorload &&  me.loadSensorlist.call(me, node.parent().attr('objid'), node);
          $self.removeClass('jstree-search jstree-search-light');
        }
      })
      .closest('form').find('#objtreesearch')
      .on('focusin', function(){
        var $me = $(this)
          , timer = null;

        if($self.hasClass('jstree-search-light'))
          !!node.length && !!me.$sensorload &&  me.loadSensorlist.call(me, node.parent().attr('objid'), node);

        $self
          .removeClass('jstree-search jstree-search-light')
          .jstree('clear_search');

        $me.val('');
        $me.on('keyup.searchtree', function(e){
          if(e.target.value.length === 0){
            clearTimeout(timer);
            $self
              .removeClass('jstree-search')
              .jstree('clear_search');
          } else {
            clearTimeout(timer);
            timer = setTimeout(function(){
              $self.jstree("search", e.target.value);
            }, 300);
          }
        });
      })
      .on('focusout', function(){
        var $me = $(this);
        $me.off('.searchtree');
      })
      .filter(':focus').triggerHandler('focusin');
  };

  Plugin.prototype.loadSensorlist = function loadSensorlist(myid,node,searchtype,searchstring){
    var self = this
      , myurl=""
      , $mytarget=self.$sensorload.empty().addClass('loading')
      , data = this.data
      , ajax = {}
      , filter=[""];

      if ($mytarget.find('.loadspinner').length == 0){
          $mytarget.append('<div class="loadspinner"></div>')
      }

    if (myid !== null) {
      myurl="/api/table.json";
      ajax = {
        // id:myid,
        content: "sensorxref",
        noraw: "1",
        columns: "name,objid,status=textraw,type,basetype,device,group",
        filter_basetype: ['sensor'],
        filter_parentid: myid,
        output: "json",
        maxcount: "9999",
        nonefound: "{}"
      };
    }
    if (!!searchstring){
      searchtype = searchtype.split(',');
      filter = $.map(searchtype, function(e){
        return "?filter_"+e+"=@sub("+searchstring+")";
      });
      myurl="/api/search.htm";
      ajax = {
        id: 0,
        maxcount: "9999",
        noraw: "1",
        content: "sensors",
        columns: "name,type,basetype,objid,status=textraw,device,group,icon=treejson",
        output: "json",
        nonefound: "{}"
      };
      if(!data.onlysensors)
        ajax.content += ',device,groups,probes';
    }

    if(!data.onlysensors && !!node){
      $mytarget.append("<div><input id='mainobject' type='radio' name='"+(self.data.parametername||'id')+"' checked='checked' value='"+myid+"' class='hidden'><label for='mainobject' style='background-image:"+node.find('.jstree-icon').css('background-image')+";'>"+node.text()+"</label></div>");
    }

    // $mytarget.appendTo(this.$sensorload);

    $.each(filter, function(i,e){
      var content = ajax.content;
      $.ajax({
        type: "GET",
        url: myurl+e,
        data: ajax,
        dataType: "json"
      }).done(function(results){
        var dd = (results.hasOwnProperty('multiobj') ? 'multiobj':content);

        if(!!results[dd]){
          $.each(results[dd],function(){
            var elm = this;
            elm.mytitle = '';
            if (!!elm.group)
              elm.mytitle  += _Prtg.Lang.common.strings.Group+": "+elm.group;
            if (!!elm.device)
              elm.mytitle += " " + _Prtg.Lang.common.strings.Device+": "+elm.device;
            elm.mystyle='';
            switch (elm.basetype.toLowerCase())
            {
              case "group": elm.mystyle='background-image:url(' + elm.icon + ');';break;
              case "device": elm.mystyle='background-image:url(' + elm.icon + ');';break;
              case "probenode": elm.mystyle= 'background-image:url(' + elm.icon + ');';break;
              case "sensor": break;
              default: elm.mystyle='-';break;
            }
            elm.parametername = self.data.parametername||'id';
            if (!!searchstring && elm.mystyle=='-') return;
            if(!!elm.mystyle) elm.status =0;
            $mytarget.append($.jqote(_Prtg.Core.objects.objectSelector.template, elm));
          });
        }
        self.$sensorload.removeClass("loading").find("input").eq(0).click();
        if (!!self.data.sensorid){
          if ($("#objectnode_"+myid).length>0)
            self.$element.scrollTo($("#objectnode_"+myid),1000, {axis:'y'});
          if (self.$sensorload.find("#radio"+self.data.sensorid).length>0){
            self.$sensorload.find("#radio"+self.data.sensorid).click();
            self.$sensorload.scrollTo($("#radio"+self.data.sensorid),2000,{offset:-50});
          }
        }
        self.data.sensorid=false;
      });
    });
  };

  $.fn[pluginName] = function(options, parent) {
    return this.each(function() {
      if (!$.data(this, "plugin_" + pluginName)) {
        $.data(this, "plugin_" + pluginName, new Plugin(this, options, parent));
      }
    });
  };
})(jQuery, window, document);
