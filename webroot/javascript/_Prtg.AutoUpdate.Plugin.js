﻿/* _Prtg.AutoUpdate.Plugin.js */
;
(function($, window, document, undefined) {
  var pluginName = 'autoupdate';

  function autoupdate(element, data, parent) {
    this.data = data;
    this.el = (!(element instanceof jQuery)) ? element : element[0];
    this.$el = (!(element instanceof jQuery)) ? $(element) : element;
    this.initEvents();
    this.hadNoConnection = false;
    this.connectionInterval;
  }

  autoupdate.prototype.initEvents = function() {
    var self = this;
    self.updateRunning = false;
    this.$el
      .on("click", "#triggerdownloadupdate", function(e) {
        e.preventDefault();
        $("#results").load("/api/autoupdatedownload.htm");
        $("#install_p").hide();
        $("#download_p").hide();
        $("#download_loader").show();
        _Prtg.Events.stop('refresh');
      })
      .on("click", "#beforeinstallupdate", function(e) {
        e.preventDefault();
        $("#beforeinstall").dialog({
        	closeText: "",
          closeOnEscape: false,
          draggable: false,
          modal: true,
          resizable: false,
          height: 350,
          title: '<#langjs key="html.autoupdate.important" default="Important">',
          width: 450,
          buttons: [
            {
              'html': '<#langjs key="html.autoupdate.installnow" default="Yes, install update now">',
              'class': "actionbutton",
              'click': function (e) {
                var $dlg = $(this);
                if (!self.updateRunning) {
                  self.updateRunning = true;
                  $(e.target).closest('button').css('pointer-events', 'none');
                  self.triggerinstallupdate()
                    .done(function () {
                      location.replace("/start.htm");
                    })
                    .fail(function (jqXHR) {
                      $(e.target).closest('button').css('pointer-events', 'all');
                      self.updateRunning = false;
                      $dlg.find('.validateerror').html(jqXHR.responseText);
                    });
                }
              }
            },
            {
              'html': '<#langjs key="html.autoupdate.dont" default="No, do not install">',
              'class': "button btngrey",
              'click': function (e) {
                $(this).dialog("destroy");
              }
            }
          ]
        });
      });
  };

  autoupdate.prototype.triggerinstallupdate = function() {
    return $.ajax({
      beforeSend: function(jqXHR) {
        jqXHR.ignoreError= true;
      },
      url: "/api/autoupdateinstall.htm",
    });
  };

  _Prtg.Plugins.registerPlugin(pluginName, autoupdate);
})(jQuery, window, document);

