var page = require('webpage').create(),
  system = require('system'),
  t, resultfile, address;
var currentUrl = "",
  userName = '',
  passWord = '';

page.settings.userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36';

function NormalizeUrl(aUrl) {
  aUrl = aUrl.replace('://', ' ');
  aUrl = aUrl.replace(':', ' ');
  return aUrl;
}

if (system.args.length === 1) {
  console.log('0: URL missing');
  phantom.exit(2);
} else {
  resultfile = '';
  if (system.args.length > 1)
    address = system.args[1];
  if (system.args.length > 2)
    resultfile = system.args[2];
  if ((system.args.length > 3) && (system.args[3].indexOf('username=') > -1))
    userName = unescape(decodeURIComponent(system.args[3].slice(9)));
  if ((system.args.length > 4) && (system.args[4].indexOf('password=') > -1))
    passWord = unescape(decodeURIComponent(system.args[4].slice(9)));

  t = Date.now();

  if ((userName !== '') & (passWord !== '')) {
    page.settings.userName = userName;
	page.settings.password = passWord;
  }

  page.onUrlChanged = function(targetUrl) {
    currentUrl = page.evaluate(function() {
      return window.location.href;
    });
  };

  page.open(address, function(status) {
    address = NormalizeUrl(address);
    if (currentUrl !== '') {
      currentUrl = NormalizeUrl(currentUrl);
      if (currentUrl !== address) {
        address = currentUrl;
      }
    }
    page.evaluate(function() {
      var style = document.createElement('style'),
          text = document.createTextNode('body { background: #fff; color: #000;}');
      style.setAttribute('type', 'text/css');
      style.appendChild(text);
      document.head.insertBefore(style, document.head.firstChild);
    });

    if (status !== 'success') {
      console.log('0: Failed to load the address ' + address);
      phantom.exit(2);
    } else {
      t = Date.now() - t;
      try {
        if (resultfile !== '')
          page.render(resultfile);
        console.log(t + ':ok ' + address + '');
        phantom.exit(0);
      } catch (e) {
        console.log(t + ':Failed to render the page ' + address + ' ' + e.message);
        phantom.exit(1);
      }

    }
  });
}
