﻿//_Prtg.ObjectLookup.Plugin.js
(function($, window, document, undefined) {
  var pluginName = "object-lookup";

  function ObjectLookup(element, data, parent) {
    this.data = data;
    this.$el = $(element);
    this.$parent = $(parent);
    this.resetable = this.$el.is(".resetable");
    this.init(this);
  }

  ObjectLookup.prototype.init = function(self) {
    var data = self.data;
    var myurl =
      data.selid !== null
        ? "/controls/objectlookupnew.htm"
        : data.emptyinfo || "/controls/objectlookupnewempty.htm";
    var para = { domid: $.now() };

    $.extend(true, para, data);

    if (data.selid !== null) {
      para["id"] = data.selid;
      self.$el.addClass("loading");

      if (self.$el.find(".loadspinner").length == 0) {
        self.$el.append('<div class="loadspinner"></div>');
      }
    }
    self.$el.attr("id", "div" + para.domid);

    $.ajax({
      url: myurl,
      data: para,
      type: "GET",
      beforeSend: function(jqXHR, settings) {
        jqXHR.peNumber = "PE1018";
      }
    }).done(function success(html) {
      self.$el
        .html(
          html.replace(/&nbsp;&raquo;&nbsp;/g, '<div class="treeellipsis" />')
        )
        .removeClass("loading");
      if (data.validate) self.$el.find("input").addClass("validateme");

      if (data.required === "required") {
        self.$el.find("input").valid();
      }

      if (self.$el.find(".objectlookup.clusterobject").length) {
        self.$parent.find(".clustertreeobject").show();
      } else {
        self.$parent.find(".clustertreeobject").hide();
      }
      self.$el.triggerHandler("loaded");
      self.$el.off("click").on("click", function() {
        self
          .selectObject(self.$el.find("input:first"), para, self)
          .done(function(result) {
            if (!!self.$el.data("filtername")) {
              self.$el.trigger("changed", {
                filters: [
                  {
                    name: self.$el.data("filtername"),
                    value: "" + (result.id || null)
                  },
                  { name: "start", value: "0" }
                ]
              });
            } else {
              self.$el.triggerHandler("changed", result);
            }
          });
        return false;
      });
      if (self.resetable) {
        self.$el.find("i.resetable").addClass("icon-close");
        self.$el.on("click", "i.resetable", function(e) {
          e.stopImmediatePropagation();
          self.data.selid = null;
          self.init(self);
          self.$el.trigger("changed", {
            filters: [
              { name: self.$el.data("filtername"), value: null },
              { name: "start", value: "0" }
            ]
          });
        });
      }
    });
  };

  ObjectLookup.prototype.selectObject = function selectObject(
    $input,
    data,
    me
  ) {
    var myurl =
      "/controls/objectselectorform" +
      (!!data.hidesensors ? "nosensors" : "") +
      ".htm";
    var self = this;

    return _Prtg.Dialogs.defaultDialog(myurl, data, {})
      .done(function(result, action) {
        if (!self.$el.data("filtername") && self.data.selid !== result.id)
          self.$el.trigger("change");
        self.data.selid = result.id === undefined ? null : result.id;
        self.init(self);
      })
      .fail(function() {});
  };

  $.fn[pluginName] = function(options, parent) {
    return this.each(function() {
      if (!$.data(this, "plugin_" + pluginName)) {
        $.data(
          this,
          "plugin_" + pluginName,
          new ObjectLookup(this, options, parent)
        );
      }
    });
  };
})(jQuery, window, document);
