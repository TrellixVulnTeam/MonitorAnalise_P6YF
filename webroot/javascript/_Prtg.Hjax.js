﻿// _Prtg.Hjax.js //
(function(_Prtg, $, window, document, undefined) {
  var module_name = "prtg_hjax"
    , namespaces = {}
    , timeout = null
    , sitename = $('<div>'+_Prtg.Options.sitename+'</div>').text();
  // moved to webserver keep here for testing
  //   , url =  document.createElement('a')
  //   , urlStripOff = [
  //         'mapid'
  //       , 'tmpid'
  //       , 'subid'
  //       , 'topnumber'
  //       , 'username'
  //       , 'password'
  //       , 'email_address'
  //   ]
  // ;

  // window.__gaStripOrigin = function(urlString){
  //   var param = [];
  //   url.href = (""+urlString);
  //   param = url.search.replace('?','').split('&');
  //   param = param.filter(function(value){
  //     return (value !== "" && urlStripOff.indexOf(value.split('=')[0]) === -1)
  //   });
  //   return url.pathname + (param.length === 0 ? '' : '?' +  param.join('&'));
  // };


  History.Adapter.bind(window, 'statechange', function(e) {
    var State = History.getState();
    e.stopImmediatePropagation(); // Für was?
    if (State.data.namespace && namespaces[State.data.namespace]) {
      var namespace = namespaces[State.data.namespace];
      namespace.handler.call(namespace.context, namespace.data, State, e);
    } else {
      loadLink(State.url, State.data);
    }
  });

  function bind(namespace, handler, context, data) {
    if (typeof(handler) !== "function") throw new Error("State handler must be a function!");
    namespaces[namespace] = {
      handler: handler,
      data: data || {},
      context: context || null
    };
  }

  function unbind(namespace) {
    delete namespaces[namespace];
  }
  /*
    Call navigate({
      url: "myurl",
      container: "selector",
      namespace: "meinnamespace fuer handler",
      data: {
        myadditional: data
      }
    })
   */
  function navigate() {
    var url;
    var container;
    var namespace;
    var data;

    _Prtg.xhrManager.xhrabort();

    if(typeof arguments[0] === 'object') {
      url = arguments[0].url || "";
      container = arguments[0].container || "#container";
      namespace = arguments[0].namespace || "linkloader.prtg";
      data = arguments[0].data || {};
    } else return;
    History.pushState({
      container: container,
      namespace: namespace,
      data: data
    }, window.title, url.split('#')[0]);

  }


  function loadLink(url, stateData) {
    var $container;
    var edata = stateData.data;
    var dataurl;
    var data = {_hjax: true};

    if(_Prtg.Util.getUrlVars()['showtiming'] === '1') _Prtg.Options['showtiming'] = 1;
    if(!!_Prtg.Options.showtiming) data['showtiming'] = 1;

    _Prtg.Events.publish('navigate.prtg', stateData.container);

    // Wenn kein container übergeben -> default #container verwenden.
    // Wenn container übergeben -> zu jquery objekt machen, wenn es noch keins sein sollte.
    $container = (!stateData.container) ? $("#container") // container nicht gesetzt -> default (#container)
    :(!(stateData.container instanceof jQuery)) ? $(stateData.container) : stateData.container; // container gesetzt, jquery check

    if(!!edata && edata.url) {
      //extract data-url and propably new container from hash
      dataurl = edata.url.split('#');
      dataurl = dataurl[0] + '?' + url.split('?')[1] + (dataurl.length <= 1 ? '&' : ($container=$('#'+dataurl[1]), '#'+dataurl[1]));
    } else {
      dataurl = url;
      _Prtg.Plugins["crumblerSensorStats"].plugin.id = (_Prtg.Util.getUrlParameters(dataurl)['id'] || null);
    }

    _Prtg.Tip.killPopups();

      if( $container.find('.loadspinner').length == 0){
        $container.append('<div class="loadspinner"></div>')
      }

    $container.addClass('loading');
    $(window).scrollTop(0);
    return $.ajax({
      url: dataurl,
      dataType: "html",
      data: data,
      beforeSend: function(jqXHR) {
        jqXHR.peNumber = 'PE1113';
      },
      success: function(data, textStatus, jqXHR) {
        var $data = $('<div/>');
        $container.removeClass('loading').removeData().children().remove();
        if(!!edata && edata.url) {
          $data.html($(data).html());
        } else {
          $data.html(data);
        }
        timeout = null;

        var CurrentTitle = window.title = document.title;
        window.title = document.title = $data.find("[data-title]").attr("data-title") + ' | ' +  sitename;
        _Prtg.Events.publish('refresh.events.prtg');
        $container.empty().append($data);
        _Prtg.SetupPage($container);
        !!window.__ga && window.__ga('send','pageview', window.__gaStripOrigin(dataurl));
        _Prtg.Events.publish('loaded.events.prtg', $container, stateData.data);
      }
    });
  }

  function linkClickHandler(e) {
    var $me = $(this);
    var data = (!!$me.data() && !!$me.data().url && {url:$me.data().url}) || {};

    if ((e.ctrlKey||e.metaKey)) return; // Wenn strg gedrückt, den default handler ausführen (neuer browsertab)
    if ($me.hasClass("logout") || $me.attr('href') === undefined || $me.attr('href')==="/home") return;
    if (window.winGUI === true) {
      window.location.href = e.currentTarget.href;
      return;
    }
    if(!!timeout) return;
    timeout = e;
    e.preventDefault();
    if (!e.data) throw new Error("Hjax.linkHandler: event.data missing namespace and container");
    else navigate({
      url: $me.attr('href'),
      container: e.data.container,
      namespace: e.data.namespace,
      data: data
    });
    return false;
  }

  $.extend(true, window, {
    _Prtg: {
      Hjax: {
        loadLink: function(url, namespace, container, data) {
          return navigate.call(null, {
            url: url || "",
            namespace: namespace || "linkloader.prtg",
            container: container || "#container",
            data: data || null
          });
        },
        bind: bind,
        unbind: unbind,
        navigate: navigate
      }
    }
  });

  $(document).on('click.hjax.prtg', '#header_menu a:not(.nohjax,[href*=":"]), #crumblersensorstats a:not(.nohjax,[href*=":"]), #main a:not([href^="#"], [href*=":"], [target], [onclick], .nohjax, .as-dialog), #header_breadcrumbs a:not(.nohjax), #mainstuff a:not([href^="#"], [href*=":"], [target], [onclick], .nohjax, .as-dialog)', {
    namespace: "linkloader.prtg",
    container: "#container"
  }, linkClickHandler);

})(_Prtg, jQuery, window, document);
