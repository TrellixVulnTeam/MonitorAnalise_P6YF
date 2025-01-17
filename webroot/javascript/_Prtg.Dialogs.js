﻿// _Prtg.Dialogs.js
(function ($, window, undefined) {

  function Dialog(element, data, parent) {
    this.data = data;
    this.$element = $(element);
    this.$parent = $(parent);
    if (this.$element.is(':visible'))
      this.init(this);
  };

  Dialog.prototype.init = function (me) {
    var dfd;
    if (me.data.dialogType === 'loadAlert')
      dfd = _Prtg.Dialogs.loadAlert(me.data.dialogurl, me.data.data, me.data.options);
    else if (me.data.dialogType === 'alert')
      dfd = _Prtg.Dialogs.alert($(me.data.html), me.data.title, me.data.options);
    else
      dfd = _Prtg.Dialogs.defaultDialog(me.data.dialogurl, me.data.data, me.data.opts, me.data.parent);
    dfd.done(function () {
      if (me.data.redirect)
        location.href = me.data.redirect;
    });
  };

  Dialog.prototype.init = function (me) {
    if (me.data.dialogType === 'loadAlert')
      _Prtg.Dialogs.loadAlert(me.data.dialogurl, me.data.data, me.data.options);
    else if (me.data.dialogType === 'alert')
      _Prtg.Dialogs.alert($(me.data.html), me.data.title, me.data.options);
    else
      _Prtg.Dialogs.defaultDialog(me.data.dialogurl, me.data.data, me.data.opts, me.data.parent);
  };

  _Prtg.Plugins.registerPlugin('Dialog', Dialog);

  //HINT: Alle dialoge sollten eine close funktion haben mit $(this).dialog('destroy').remove() und mit einem dialog.dialog("close") geschlossen werden.
  var connectionLost = function (message) {
    _Prtg.Options.connectionLost = window.connectionLost = true;
    !!_Prtg.Events && _Prtg.Events.stop();
    $(document).off('ajaxError');
    _Prtg.xhrManager.xhrabort();

    var ConnectionLostDialog = $('<div />', {
      id: 'connectionlostdialog',
      html: _Prtg.Lang.Dialogs.strings.connectionlostdialog + '<p class="small">' + _Prtg.Lang.common.strings.server + ': ' + location.host + '<br>' + _Prtg.Lang.common.strings.url + ': ' + message + '<br>Time: ' + _Prtg.Util.getTimeString() + '</p>'
    });

    ConnectionLostDialog.dialog({
    	closeText: "",
      closeOnEscape: false,
      modal: true,
      draggable: false,
      resizable: false,
      title: _Prtg.Lang.Dialogs.strings.connectionlosttitle,
      zIndex: 99999,
      buttons: [{
        html: _Prtg.Lang.common.strings.tryagain,
        class: 'actionbutton',
        click: function (e) {
          window.location.reload();
          return false;
        }
      }],
      close: function () {
        $(this).dialog('destroy').remove();
      }
    });
  };

  var loadAlert = function loadAlert(dialogurl, data, options) {
    var loader = $("<div class='loader'/>").html("<div class='loading' style='min-height:100px;'><div class='loadspinner'></div></div>").dialog({
    closeText: "",
    dialogClass: 'addMultipleUserDialog',
    modal: true,
    resizable: false,
    draggable: false,
    width: 400,
    title: _Prtg.Lang.Dialogs.strings.loading });

    data = $.extend(true, data, {
      _hjax: true
    });
    $.ajax({
      url: dialogurl,
      dataType: 'html',
      type: 'GET',
      data: data,
      beforeSend: function (jqXHR) {
        jqXHR.peNumber = 'PE1001';
      }
    }).always(function () {
      loader.dialog('destroy').remove();
    }).done(function dialogDone(html) {
      var $html = $('<div>' + html + '</div>');
      var title = $html.find('#main, #content').data().title;
      _Prtg.Dialogs.alert($html, title, options || {});
      $html.closest('.ui-dialog').focus()
    });
  };

  var alert = function alert($html, title, options) {
    options = options || {};
    var dfd = $.Deferred();
    var $dlg = $html.dialog({
    	closeText: "",
      title: title,
      closeOnEscape: options.closeOnEscape || true,
      draggable: options.draggable || false,
      resizable: options.resizable || false,
      modal: options.modal || true,
      minWidth: options.width || 550,
      minHeight: options.height || 150,
      maxHeight: options.maxHeight || parseInt($(window).height() * 0.75, 10),
      maxWidth: options.maxWidth || parseInt($(window).outerWidth() * 0.75, 10),
      zIndex: options.zIndex || 89,
      create: options.create || function (event, ui) {},
      close: options.close || function (event, ui) {},

      open: options.open || function (event, ui) {},

      buttons: options.buttons || [{
        html: options.buttonText0 || _Prtg.Lang.Dialogs.strings.ok,
        class: 'actionbutton',
        click: function (event) {
          $dlg.parent().hide();
          $(this).dialog('close');
          dfd.resolve();
          return false;
        }
      }]
    });

    $dlg.find('[type="submit"], [type="reset"]').not('.hjax').hide();
    $dlg.on('click', 'a:not(.reloadtablelink)', function (event) {
      $dlg.dialog('close');
      dfd.resolve();
    });

    !!_Prtg.initPlugins && _Prtg.initPlugins($html);
    return dfd;
  };

  var loader = function (title, buttons) {
    return $("<div class='loader'/>").html("<div class='loading' style='min-height:100px;'><div class='loadspinner'></div></div>").dialog($.extend(true, {
    	closeText: "",
      modal: true,
      resizable: false,
      draggable: false,
      position: 'center',
      maxHeight: parseInt($(window).height() * 0.95, 10),
      maxWidth:  parseInt($(window).width() * 0.95, 10),
      width: 200,
      title: title || _Prtg.Lang.Dialogs.strings.loading

    }, buttons || {})).addClass('loadingDialog');
  };

  var confirmDialog = function (title, text, okbuttontext, cancelbuttontext) {
    var dfd = $.Deferred();
    var dialog = $('<div />').html(text).dialog({
    	closeText: "",
      dialogClass: 'confirmdialog',
      modal: true,
      resizable: false,
      draggable: false,
      width: 400,
      title: title,
      close: function (e, ui) {
        dfd.reject();
        dialog.dialog('destroy').remove();
      },

      buttons: [{
          html: cancelbuttontext || _Prtg.Lang.Dialogs.strings.cancel,
          class: 'button btnlink',
          click: function (event) {
            dfd.reject();
            dialog.dialog('destroy').remove();
          }
        },
          {
        text: okbuttontext || _Prtg.Lang.Dialogs.strings.ok,
        class: 'actionbutton',
        click: function (event) {
          dfd.resolve();
          dialog.dialog('destroy').remove();
        }
      }]
    });
    return dfd;
  };
  var defaultDialog = function defaultDialog(dialogurl, data, opts, parent) {
    var dfd = $.Deferred();

    if ($('html').hasClass('dialog' + dialogurl)) {
      dfd.reject(null);
      return dfd.promise();
    }

    var scrollTop = $(window).scrollTop();
    var load = loader();
    var id = $.now();
    var options = opts || {};
    var maxWidth = options.maxWidth || (window.winGUI && 600) || 800;
    var minWidth = options.width || 550;
    var $dlg;
    var title = '';

    $('html').addClass('dialog id' + id + ' dialog' + dialogurl);
    data = $.extend(true, {
      _hjax: true
    }, (data instanceof Object ? data : {
      id: data
    }));

    $.ajax({
      url: dialogurl,
      data: data,
      dataType: 'html',
      type: 'GET',
      traditional: true,
      beforeSend: function (jqXHR) {
        jqXHR.peNumber = 'PE1002';
      }
    }).always(function () {
      load.dialog('destroy').remove();
      !!window.__ga && window.__ga('send', 'pageview', window.__gaStripOrigin(dialogurl));
    }).done(function dialogDone(html) {
      var $res = $('<div>' + html + '</div>');

      //FIXME: This is a workaround for: PRTG-1198 and PRTG-1277
      // In order to fix the issues properly we have to change multiedit HTML partials in the webserver
      if ($res.find('div.multieditsearchresult').length && $res.find('div.multieditsearchresult form').length > 1) {
        $dlg = $res.find('div.multieditsearchresult').eq(0).clone();
      } else {
        $dlg = $res.find('form, .pseudoform').eq(0).parent().clone();
        title = $dlg.find('form, .pseudoform').eq(0).attr('title');
      }

      var buttons = $dlg.find('.quick-action-wrapper').hide();
      $dlg.find('form, .pseudoform').removeAttr('title');
      if (buttons.length === 0) buttons = null;
      if (!title) title = $res.find('h1').eq(0).text();
      $dlg = $dlg.wrapInner('<div class="dialog-container inline"/>').css({
        'max-height': parseInt($(window).height() * 0.75, 10) + 'px',
        width: '100%'
      });
      $res.find('.contexthelpbox').each(function () {
        $(this)
        .removeClass('prtg-plugin contexthelpbox')
        .detach()
        .prependTo($dlg);
      });

      function closeAndSave(e, data) {
        var $form = $dlg.find('form');
        var formPlugin = $form.data('plugin');
        if (formPlugin != undefined && formPlugin.indexOf('prtg-form') != -1) {
          $form.addClass('dialogform').trigger('submit', true);
          if (!$form.valid()) return;
        }
        var formData = _Prtg.Util.getFormData($form, data);
        if (formData !== null) {
          $dlg.parent().hide();
          destroyDialog();
          dfd.resolve(formData, ($form.attr('action') || dialogurl));
        } else {
          destroyDialog();
        }
        return dfd.promise();
      }
      
      var destroyDialog = function destroyDialog() {
        var $tbl = $dlg.closest('.dialog-table');
        !!_Prtg.Events && _Prtg.Events.unsubscribe('navigate.prtg', destroyDialog);
        $('html').removeClass('id' + id + ' dialog' + dialogurl);
        if ($('html').attr('class') === 'dialog') {
          $('html').removeClass('dialog');
          $(window).scrollTop(scrollTop);
        }

        $dlg.dialog('destroy').remove();
        $(window).off('.dialog' + id);
        $tbl.remove();
      };

      !!_Prtg.Events && _Prtg.Events.subscribeOnce('navigate.prtg', destroyDialog);
      $dlg.find('input[placeholder], textarea[placeholder]').placeholder();
      $dlg.dialog({
				closeText: "",
        title: title,
        closeOnEscape: options.closeOnEscape || true,
        draggable: false,
        resizable: options.resizable || false,
        modal: options.modal || true,
        minWidth: minWidth,
        minHeight: options.height || 100,
        maxHeight: options.maxHeight || parseInt($(window).height() * 0.95, 10),
        maxWidth: maxWidth,
        width: _Prtg.Util.calcLimit($(window).width(), minWidth, maxWidth, 0.75),
        zIndex: options.zIndex || 89,
        create: options.create ||
        function (event, ui) {
          !!$dlg.Events && $dlg.Events().publish('create.dialog.prtg', $dlg);
        },

        close: function (event, ui) {
          dfd.reject(null);
          destroyDialog();
          options.close && options.close.call($dlg);
          !!$dlg.Events && $dlg.Events().publish('close.dialog.prtg', $dlg);
        },

        open: function (event, ui) {
          $dlg.closest('.ui-dialog').addClass('ui-dialog-cell').css({
            display: '',
            top: ''
          })
          .wrap('<div class="dialog-table" style="top:' + scrollTop + 'px"/>')
          .wrap('<div class="dialog-cell" />');

          options.open && options.open.call($dlg);
          !!$dlg.Events && $dlg.Events().publish('open.dialog.prtg', $dlg);
        },

        buttons: options.buttons || [{
            html: _Prtg.Lang.Dialogs.strings.cancel,
            class: 'button btnlink',
            click: function() {
              dfd.reject(null);
              destroyDialog();
            }
          },
          {
          html: options.buttonText0 || (buttons && buttons.find('.actionbutton[type="submit"]').text()) || _Prtg.Lang.Dialogs.strings.ok,
          class: 'actionbutton',
          click: function (e, data) {
            closeAndSave(e, data);
          }
        }]
      });

      !!_Prtg.initPlugins && _Prtg.initPlugins($dlg);

      $(window).on('resize.dialog' + id, $dlg, function () {
        var opts = {
          maxHeight: options.maxHeight || parseInt($(window).height() * 0.95, 10),
          // width: options.maxWidth || parseInt($(window).width() * 0.75, 10),
          width: _Prtg.Util.calcLimit($(window).width(), minWidth, maxWidth, 0.75),
          position: 'center'
        };
        $dlg.dialog('option', opts);
      }).on('keydown.dialog' + id, function (event) {
        if ($('textarea:focus').length > 0) return;
        if (event.keyCode == 13) {
          event.preventDefault();
          $dlg.parent().find('button.submit:not(.noentersubmit)').triggerHandler('click');
        }
      });
    }).fail(function dialogFailed(jqXHR, textStatus, errorThrown) {
      dfd.reject(null);
    });

    return dfd.promise();
  };

  var wizardDialog = function wizardDialog(dialogurl, data, step, callbacks, opts, parent) {

    var dfd = $.Deferred();

    if ($('html').hasClass('dialog' + dialogurl)) {
      dfd.reject(null);
      return dfd.promise();
    }

    var scrollTop = $(window).scrollTop();
    var load = loader();
    var id = $.now();
    var options = opts || {};
    var maxWidth = options.maxWidth || (window.winGUI && 600) || 800;
    var minWidth = options.width || 550;
    var $dlg;
    var destroyDialog;
    var title = '';
    var $stepper = null;
    var $step = null;
      var defaultbuttons = [{
            text: _Prtg.Lang.Dialogs.strings.cancel,
            class: 'button btnlink cancel',
            click: function ($dlg, $steps) {
                destroyDialog();
                dfd.reject(null);
                return dfd.promise();
            }
          },
          {
              text: _Prtg.Lang.Dialogs.strings.next,
              class: 'actionbutton next',
              click: function ($dlg, $steps) {
                  if (step === $steps.length - 1) return;
                  if (callbacks['' + (step + 1)].apply($dlg, $steps)) {
                      var $old = $step;
                      $step = $($steps.get(++step));
                      $stepper.eq(step).removeClass('ustep').addClass('step');
                      $old = $old.add($step);
                      $old.toggle();
                      if (!!$step.attr('wizTitle'))
                          $dlg.dialog('option', 'title', $step.attr('wizTitle'));

                      if (!!$step.attr('btnText'))
                          $('.next').text($step.attr('btnText'));
                  }
              }
          }];

    $('html').addClass('dialog id' + id + ' dialog' + dialogurl);
    data = $.extend(true, {
      _hjax: true
    }, (data instanceof Object ? data : {
      id: data
    }));

    $.ajax({
      url: dialogurl,
      data: data,
      dataType: 'html',
      type: 'GET',
      traditional: true,
      beforeSend: function (jqXHR) {
        jqXHR.peNumber = 'PE1002';
      }
    }).always(function () {
      load.dialog('destroy').remove();
      !!window.__ga && window.__ga('send', 'pageview', window.__gaStripOrigin(dialogurl));
    }).done(function dialogDone(html) {
      var $res = $('<div>' + html + '</div>')
        , $dlg = $res.find('form, .pseudoform').eq(0).parent().clone()
        , $steps = $dlg.find('fieldset')
      ;
      $step = $($steps.get(step));
      title = $step.attr('wizTitle');
      $steps.not($step).hide();
      $dlg = $dlg.wrapInner('<div class="dialog-container inline"/>').css({
        'max-height': parseInt($(window).height() * 0.75, 10) + 'px',
        width: '100%'
      });
      $res.find('.contexthelpbox').each(function () {
        $(this)
        .removeClass('prtg-plugin contexthelpbox')
        .detach()
        .prependTo($dlg);
      });

      destroyDialog = function destroyDialog() {
        var $tbl = $dlg.closest('.dialog-table');
        !!_Prtg.Events && _Prtg.Events.unsubscribe('navigate.prtg', destroyDialog);
        $('html').removeClass('id' + id + ' dialog' + dialogurl);
        if ($('html').attr('class') === 'dialog') {
          $('html').removeClass('dialog');
          $(window).scrollTop(scrollTop);
        }

        $dlg.dialog('destroy').remove();
        $('body').off('.dialog' + id);
        $tbl.remove();
      };

      !!_Prtg.Events && _Prtg.Events.subscribeOnce('navigate.prtg', destroyDialog);
      $dlg.find('input[placeholder], textarea[placeholder]').placeholder();

      if(!!options.buttons){
        defaultbuttons = options.buttons.concat(defaultbuttons);
      }
      options.buttons = defaultbuttons;
      options.buttons = options.buttons.map(function(e){
        e.click = $.proxy(e.click, $dlg, $dlg, $steps);
        return e;
      });

      $dlg.dialog({
      	closeText: "",
        title: title,
        closeOnEscape: options.closeOnEscape || true,
        draggable: false,
        resizable: options.resizable || false,
        modal: options.modal || true,
        minWidth: minWidth,
        minHeight: options.height || 100,
        maxHeight: options.maxHeight || parseInt($(window).height() * 0.95, 10),
        maxWidth: maxWidth,
        width: _Prtg.Util.calcLimit($(window).width(), minWidth, maxWidth, 0.75),
        zIndex: options.zIndex || 89,
        create: options.create ||
        function (event, ui) {
          !!$dlg.Events && $dlg.Events().publish('create.dialog.prtg', $dlg);
        },

        close: function (event, ui) {
          dfd.reject(null);
          destroyDialog();
          options.close && options.close.call($dlg);
          !!$dlg.Events && $dlg.Events().publish('close.dialog.prtg', $dlg);
        },

        open: function (event, ui) {
          $dlg.closest('.ui-dialog').addClass('ui-dialog-cell').css({
            display: '',
            top: ''
          })
          .wrap('<div class="dialog-table" style="top:' + scrollTop + 'px"/>')
          .wrap('<div class="dialog-cell" />');

          options.open && options.open.call($dlg);
          !!$dlg.Events && $dlg.Events().publish('open.dialog.prtg', $dlg);

          var buttonpane = $dlg.closest('.ui-dialog').find('.ui-dialog-buttonpane');
          $.each($steps, function (index, value) {
            index == 0 ? buttonpane.append("<i class='step'>&#8226</i>")
                       : buttonpane.append("<i class='ustep'>&#8226</i>");
          });

          $stepper = $dlg.closest('.ui-dialog').find('.ui-dialog-buttonpane>i')
          if(!!$step.attr('btnText'))
            $('.next').text($step.attr('btnText'));
        },

        buttons: options.buttons

        });
      !!_Prtg.initPlugins && _Prtg.initPlugins($dlg);
    }).fail(function dialogFailed(jqXHR, textStatus, errorThrown) {
      dfd.reject(null);
    });

    return dfd.promise();
  };

  var serverRestartNeededDialog = function () {
    return _Prtg.Dialogs.confirmDialog(_Prtg.Lang.Dialogs.strings.needserverrestarttitle, '<p style="color: red; font-size: 15px;">' + _Prtg.Lang.Dialogs.strings.needserverrestart + '</p><p>' + _Prtg.Lang.Dialogs.strings.needserverrestarthint + '</p><p>' + _Prtg.Lang.Dialogs.strings.doyouwanttocontinue + '</p>');
  };

  var addMultipleUserDialog = function () {
    var redirectafter = false;
    var groupid;
    var dialog = $('<div />').html(_Prtg.Lang.Dialogs.strings.loading).dialog({
    	closeText: "",
      dialogClass: 'addMultipleUserDialog',
      modal: true,
      resizable: false,
      draggable: false,
      width: 400,
      title: _Prtg.Lang.Dialogs.strings.loading,
      open: function (e, ui) {
        $.ajax({
          url: '/api/table.json',
          data: {
            content: 'lookuplist',
            list: 'noadusergroupid',
            columns: 'name,objid',
            sortby: 'name'
          },
          dataType: 'json',
          type: 'GET'
        }).done(function (response) {
          var groupSelectDropDown = '<p>' + _Prtg.Lang.Dialogs.strings.addmultipleuserhelp + '</p><p class="bold">' + _Prtg.Lang.Dialogs.strings.addmultipleuserlable + '</p><select style="width:100%" name="adduserlistgroupselect" id="selectedaddusersgroup">';
          var groupList = response;

          for (var i = 0; i < groupList.lookuplist.length; i++) {
            groupSelectDropDown = groupSelectDropDown + '<option value="' + groupList.lookuplist[i].objid + '">' + groupList.lookuplist[i].name + '</option>';
          }

          groupSelectDropDown = groupSelectDropDown + '</select><p class="bold">' + _Prtg.Lang.Dialogs.strings.addmultipleuserlable2 + '</p><input type="text" name="newuseremails" id="newuserslist" />';

          dialog.html('<p>' + groupSelectDropDown + '</p>');

          // Select PRTG User group as default - Not Admin Group
          $("#selectedaddusersgroup option[value='201']").attr('selected', 'selected');
          $('#newuserslist').tagsinput({
            autocomplete: false,
            seperator: ','
          });
          dialog.dialog({
            title: _Prtg.Lang.Dialogs.strings.addmultipleusertitle
          });
        });
      },

      close: function () {
        if (redirectafter) {
          window.location.href = 'editusergroup.htm?id=' + groupid;
        }

        $(this).dialog('destroy').remove();
      },

      buttons: [{
              text: _Prtg.Lang.Dialogs.strings.cancel,
              class:'button btnlink',
              click: function (event) {
                  $(this).dialog('destroy').remove();
              }
          }, {
        text: _Prtg.Lang.Dialogs.strings.ok,
        class:'actionbutton',
        click: function (event) {
          groupid = $('#selectedaddusersgroup').val();
          var newusers = $.trim($('#newuserslist').val());
          if (newusers === '') {
            return;
          }

          if ($.trim($('#newtag').val()) !== '') {
            newusers = newusers + ',' + $.trim($('#newtag').val());
          }

          if (newusers[0] === ',') {
            newusers = newusers.substr(1, newusers.length);
          }

          dialog.dialog('option', 'buttons', {}); // Remove buttons
          dialog.html('<p>' + _Prtg.Lang.Dialogs.strings.addingusers + '</p><p>' + _Prtg.Lang.Dialogs.strings.onemoment + '</p><p class="loading"><span class="loadspinner"></span></p>');
          dialog.dialog({ title: _Prtg.Lang.common.strings.working + '...' });

          $.ajax({
            url: 'api/addusers.htm',
            data: {
              id: groupid,
              users: newusers
            },
            type: 'POST'
          }).done(function (response) {
            dialog.dialog('option', 'buttons', [{
            	closeText: "",
              html: _Prtg.Lang.common.strings.ok,
              click: function () {
                redirectafter = true;
                $(this).dialog('close');
              }
            }]);
            dialog.dialog({ title: _Prtg.Lang.Dialogs.strings.addmultipleuserdonetitle });
            dialog.html('<p>' + response + '</p>');
          });
        }
      }]
    });
  };

  $.extend(true, window, {
    _Prtg: {
      Dialogs: {
        connectionLost: connectionLost,
        defaultDialog: defaultDialog,
        wizardDialog: wizardDialog,
        loadAlert: loadAlert,
        alert: alert,
        loader: loader,
        serverRestartNeededDialog: serverRestartNeededDialog,
        addMultipleUserDialog: addMultipleUserDialog,
        confirmDialog: confirmDialog
      }
    }
  });
})(jQuery, window);
