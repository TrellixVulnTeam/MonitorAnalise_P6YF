﻿//_Prtg.QRCode.Plugin.js
(function($, window, document, undefined) {
  var pluginName = "prtgqrcode";

  function Plugin(element, data, parent) {
    var phash = $("button[prop]").attr("prop");
    var $element = $(element);
    if(data.myaccountqr) {
      data.url = document.location.origin + data.url;
      if(!!phash)
        data.url += '&passhash=' + phash;
      if(data.sitename)
        data.url += '&sitename=' + data.sitename;
        console.log(data.url)
    }

    var preferredWidth = $element.data('qrwidth') || 200;
      var preferredHeight = $element.data('qrheight') || 200;

    var qrcode = {
        text: data.url
          || (window.action && window.action
              .replace(/\/controls/,location.origin)
              .replace(/overview/,''))
          || document.location.href,
         width: preferredWidth * (data.zoom || 1),
         height: preferredHeight * (data.zoom || 1) - ($element.is('.onmap')?40:0)
      };
    qrcode.text = qrcode.text.replace(location.origin, location.origin)
      .replace(document.location.hostname,(_Prtg.Options.dnsname||document.location.hostname));

    $element.qrcode(qrcode);
    var canvas = $element.find('canvas')[0];
    var x = canvas.width / 2;
    var y = canvas.height + 40;
    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    try {
      tempCanvas.getContext('2d').drawImage(canvas, 0, 0);
    } catch (e) {
      // throw "_Prtg.QRCode.Plugin.js 2d canvas has no height or width, something seems to be wrong with css";
    }
    canvas.height = y;
    var context = canvas.getContext('2d');
    context.fillStyle = "white";
    context.fill();
    context.drawImage(tempCanvas, 0, 8);
    context.font = '13px Calibri';
    context.textAlign = 'center';
    context.fillStyle = 'black';
    context.fillText(data.name, x, y - 12);
    if (data.name !== data.host) context.fillText(data.host, x, y);
    context.font = '8px Calibri';
    context.fillText(qrcode.text, x, y - 24);
    context.textAlign = 'left';
    context.fillText("PRTG Network Monitor", 1, 6);
    context.textAlign = 'right';
    context.fillText("Paessler AG", x * 2 - 1, 6);

    $element.on('click', function() {
      _Prtg.Dialogs.alert($('<div class="qrcode-image"><img src="'+canvas.toDataURL()+'" style="margin:15px auto;display: block;"></div>'),
        data.name,
        {
          height:300,
          width:300
        }
        );
    });
  }
  _Prtg.Plugins.registerPlugin(pluginName, Plugin);
})(jQuery, window, document);
