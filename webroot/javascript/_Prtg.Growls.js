﻿/*
  Call with: _Prtg.Growls.add(options)
  Options:
    type: info/... ---> css .prtg_growl_ + type
    title: the title of the growl.
    message: message th growl wil show.
    time: time in seconds for how long the growl shows.
*/
(function(_Prtg, $, window, document, undefined) {

  var growls = [],
    $growl_container;

  function growlInit() {
    $growl_container = $("#prtg_growls");

    if ($growl_container.length === 0) {
      $growl_container = $("<div />", {
        id: "prtg_growls"
      });
      $("body").append($growl_container);
    }
    $growl_container.on("click", ".prtg_growl", function() {
      $(this).fadeOut(700, function() {
        $(this).remove();
      });
    });
  }

  function addGrowl(options) {
    if ($growl_container === undefined) growlInit();
    var type = options.type || "info",
      title = options.title || "",
      message = options.message || "",
      time = options.time || parseInt((_Prtg.Options.refreshInterval / 3), 10),
      id = options.id || null,
      $growl = $("<div/>", {
        "id": id || '',
        "class": "prtg_growl prtg_growl_" + type
      });

      if(!!id && $growl_container.find('#'+id).length > 0) {
        $growl = $growl_container.find('#'+id);
        clearTimeout($growl.data('timer'));
        $growl.find('.prtg_growl_content')
        .html(message)
        .end()
        .data('timer',
          setTimeout(function() {
            destroyGrowl($growl);
            $growl = null;
          }, time * 1000)
        );
        return $growl;
      } else {
        if (title !== "") {
          $growl.append('<div class="prtg_growl_title">' + title + '<i id="closehelp" class="flr icon-dark ui-button-icon-primary ui-icon ui-icon-closethick"></i></div>');
        }
        $growl.append('<div class="prtg_growl_content">' + message + '</div>')
        .data('timer',
          setTimeout(function() {
            destroyGrowl($growl);
            $growl = null;
          }, time * 1000)
        );
      $growl_container.prepend($growl);
      return $growl_container.find('#'+id);
    }
  }

  function destroyGrowl($growl) {
    $growl.fadeOut(700, function() {
      $(this).remove();
    });
  }

  growlInit();
  $.extend(true, window, {
    _Prtg: {
      Growls: {
        add: addGrowl
      }
    }
  });
})(_Prtg, jQuery, window, document);
