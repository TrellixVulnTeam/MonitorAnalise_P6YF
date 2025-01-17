﻿/* _Prtg.Graphs.js */
(function($, window, document, undefined) {
  var regexWidth = /width=\d+/,
    regexHeight = /height=\d+/,
    regexCacheBreaker = /myid=\d/,
    fitSizeUrl = function(url) {
      return url;
    };

  function prtgGraphs(element, data, parent) {
    this.el = !(element instanceof jQuery) ? element : element[0];
    this.$el = !(element instanceof jQuery) ? $(element) : element;
    this.$parent = !(parent instanceof jQuery) ? $(parent) : parent;
    this.$legend = this.$el.find(".chartlegend");
    this.$chart = function() {
      return this.$el.find(
        '.prtgchart[data-graphid="' + this.$legend.attr("data-graphid") + '"]'
      );
    };

    this.data = data;
    this.fitSize = !!data.fitSize;

    this.data.currentChartUrl = this.$chart()
      .parent(".PNGGraph")
      .attr("refreshurl");
    this.data.currentChartSrc = this.$chart().attr("src");
    this.data.sh0w = [];
    this.data.hiddenChannel = [];
    this.data.exitstShowAttribut = false;

    try {
      this.data.hiddenChannel = window.sessionStorage
        .getItem("graphchannelfilter" + this.data.id)
        .split(",");
    } catch (e) {
      this.data.hiddenChannel = [];
    }

    var tmp;
    try {
      // Findet den Channel heraus, der angezeigt werden soll
      this.data.sh0w = _Prtg.Util.getUrlParameters(this.data.currentChartUrl)[
        "sh0w"
      ];
      if (this.data.sh0w) this.data.exitstShowAttribut = true;

      // Attribut von URL ersetzen
      tmp = this.data.currentChartUrl.replace(/hide=all/, "");
      this.data.currentChartUrl = tmp;
      tmp = this.data.currentChartSrc.replace(/hide=all/, "");
      this.data.currentChartSrc = tmp;
    } catch (e) {}
    this.init(this);
    this.initEvents();
  }

  prtgGraphs.prototype.init = function(self) {
    var tempZoomicon = $(".graphzoomicon").find(".zoom");
    var hiddenChannel = self.data.hiddenChannel;
    var channels = [];
    var valuesInHiddenChannelArray = false;

    tempZoomicon.attr("href", tempZoomicon.attr("href") + "&dynamicgraph=1");

    // hiddenChannel-Array in Int-Werte umwandeln
    if (self.data.hiddenChannel.length > 0) {
      for (var i = 0; i < self.data.hiddenChannel.length; i++) {
        channels.push(parseInt(self.data.hiddenChannel[i], 10));
      }
      self.data.hiddenChannel = channels;
      valuesInHiddenChannelArray = true;
    }

    this.$legend.find(".oneitem .chartlegendcolorbox").each(function() {
      var $this = $(this);
      var color = $this.css("background-color");
      var channelid = $this.parent(".oneitem").data("channelid");
      $this.removeAttr("style");
      $this
        .css({
          color: color
        })
        .empty();

      $this.addClass("prtg-checkbox");

      // hide alarms channel
      if (channelid == "-3") {
        $this.css("background-color", color);
        $this.removeClass("prtg-checkbox");
      } else {
        if (self.data.exitstShowAttribut) {
          if (channelid == self.data.sh0w) {
            if (valuesInHiddenChannelArray === false) {
              $this.addClass("icon-check icon-dark");
            }
          } else {
            if (valuesInHiddenChannelArray === false) {
              // Channel in hiddenChannel hinzufügen
              if (!self.data.hiddenChannel.indexOf(channelid) > -1) {
                self.data.hiddenChannel.push(parseInt(channelid, 10));
              }
              $this.removeClass("icon-check icon-dark ");
            }
          }
        } else {
          if (hiddenChannel.indexOf("" + channelid) === -1)
            $this.addClass("icon-check icon-dark ");
        }
        if (valuesInHiddenChannelArray) {
          if (self.data.hiddenChannel.indexOf(channelid) > -1) {
          } else {
            $this.addClass("icon-check icon-dark ");
          }
        }
      }
      try {
        window.sessionStorage.setItem(
          "graphchannelfilter" + self.data.id,
          self.data.hiddenChannel
        );
      } catch (e) {}
    });

    // Add Select/Deselect all checkboxes.
    this.$legend.append(
      '<span class="prtg-graphs-controls"><a href="#" class="button btngrey btnsmall prtg-graphs-control" data-action="selectall">' +
        _Prtg.Lang.common.strings.showall +
        '</a> <a href="#" class="button btngrey btnsmall prtg-graphs-control" data-action="deselectall">' +
        _Prtg.Lang.common.strings.hideall +
        "</a></span>"
    );
  };

  prtgGraphs.prototype.initEvents = function() {
    var self = this;
    this.$el
      .on("click", ".prtg-graphs-control", function(e) {
        var $this = $(this);
        if (self.$el.find(".PNGGraph").length) {
          $this.parent().addClass("loading");
        }

        if ($this.attr("data-action") === "selectall") {
          self.allCheckboxes(true);
        } else if ($this.attr("data-action") === "deselectall") {
          self.allCheckboxes(false);
        }
        e.preventDefault();
      })
      .on("mousedown", "a[data-force]", function() {
        var $this = $(this);
        var url = _Prtg.Util.getUrlParameters(self.data.currentChartSrc);
        [
          "bgcolor",
          "graphtitle",
          "graphstyling",
          "datastylefile",
          "force" + $this.data("force"),
          "hide"
        ].forEach(function(e) {
          delete url[e];
        });
        url = $.extend(true, url, $this.data().params);
        url = [
          $this.attr("href").split("?")[0],
          Object.keys(url)
            .map(function(e) {
              return e + "=" + encodeURIComponent(url[e]);
            })
            .join("&")
        ];
        $this.attr(
          "href",
          url.join("?") +
            "&hide=" +
            self.data.hiddenChannel.join(",") +
            "&graphstyling=baseFontSize%3D'10'%20showLegend%3D'1'&tooltexts=1"
        );
      });

    this.$legend.on("click", ".oneitem", function(e) {
      var $parent = $(this);
      var channelid = $parent.parent(".oneitem").data("channelid");

      var $box = $parent.find(".prtg-checkbox");
      if ($parent.data("channelid") == "-3") return;
      if (!$box.hasClass("icon-check")) {
        $box.addClass("icon-check icon-dark");
        self.ShowChannelInGraph($parent.attr("data-channelid"));
      } else {
        $box.removeClass("icon-check icon-dark");
        self.HideChannelFromGraph($parent.attr("data-channelid"));
      }
      try {
        window.sessionStorage.setItem(
          "graphchannelfilter" + self.data.id,
          self.data.hiddenChannel
        );
      } catch (e) {}

      self.loadNewGraph();
      e.preventDefault();
    });

    if (this.fitSize) {
      fitSizeUrl = function(url) {
        var width = self.$el.width(),
          height = self.$el.height() - self.$legend.outerHeight(); //30 for tooltp

        width = Math.max(width, 300);
        height = Math.max(height, 150);

        return url
          .replace(regexWidth, "width=" + width)
          .replace(regexHeight, "height=" + height);
      };
      $(window).debounce(function() {
        self.fitGraphSize.call(self);
      });
      this.fitGraphSize();
    } else {
      this.updateRefreshUrl();
      this.loadNewGraph();
    }
  };
  prtgGraphs.prototype.fitGraphSize = function() {
    this.data.currentChartUrl = fitSizeUrl(this.data.currentChartUrl);
    this.data.currentChartSrc = fitSizeUrl(this.data.currentChartSrc);
    this.updateRefreshUrl();
    if (this.chartloading)
      _Prtg.Events.subscribeOnce(
        "graph.loaded",
        $.proxy(this, this.fitGraphSize)
      );
    else this.loadNewGraph();
  };

  prtgGraphs.prototype.allCheckboxes = function(select) {
    var self = this;
    var hiddenChannel = [];

    self.$legend.find(".oneitem").each(function() {
      if ($(this).data("channelid") == "-3") return;
      if (select) {
        $(this)
          .find(".chartlegendcolorbox")
          .addClass("icon-check icon-dark");
        hiddenChannel = [];
      } else {
        $(this)
          .find(".chartlegendcolorbox")
          .removeClass("icon-check icon-dark");
        hiddenChannel.push(parseInt($(this).attr("data-channelid"), 10));
      }
    });

    this.data.hiddenChannel = hiddenChannel;

    try {
      window.sessionStorage.setItem(
        "graphchannelfilter" + self.data.id,
        hiddenChannel
      );
    } catch (e) {}

    self.updateRefreshUrl();
    self.loadNewGraph();
  };

  prtgGraphs.prototype.loadNewGraph = function() {
    var self = this;
    var hiddenChannels = this.data.hiddenChannel.join(",");
    var newSrc = this.data.currentChartSrc + "&hide=" + hiddenChannels;
    if (this.$chart().attr("src") == newSrc) {
      self.$el.find(".loading,.load").removeClass("loading load");
    } else {
      self.chartloading = true;
      newSrc = newSrc.replace(regexCacheBreaker, "myid=" + $.now());
      this.$chart()
        .addClass("load")
        .off("load")
        .attr("src", newSrc)
        .one("load", function() {
          self.$el.find(".loading,.load").removeClass("loading load");
          self.chartloading = false;
          _Prtg.Events.publish("graph.loaded");
        });
    }

    // NOTE: Append hidden channels params to download chart links (PRTG-820)
    var $graph_download_link = $("a.save");
    if (hiddenChannels !== "NaN" && !!$graph_download_link.length) {
      $graph_download_link.each(function() {
        var url = $(this)
          .attr("href")
          .split("?")[0];
        var params = _Prtg.Util.getUrlParameters(this.href);
        params["hide"] = hiddenChannels;
        href = url + "?" + $.param(params);
        $(this).attr("href", href);
      });
    }
  };

  prtgGraphs.prototype.getChart = function() {
    return this.$el.find(
      '.prtgchart[data-graphid="' + this.$legend.attr("data-graphid") + '"]'
    );
  };

  prtgGraphs.prototype.HideChannelFromGraph = function(channelID) {
    var hiddenChannel = this.data.hiddenChannel;
    var idx = hiddenChannel.indexOf(parseInt(channelID, 10));
    if (idx > -1) {
    } else {
      hiddenChannel.push(parseInt(channelID, 10));
    }
    this.updateRefreshUrl();
  };

  prtgGraphs.prototype.ShowChannelInGraph = function(channelID) {
    var hiddenChannel = this.data.hiddenChannel,
      idx = hiddenChannel.indexOf(parseInt(channelID, 10));
    if (idx > -1) {
      hiddenChannel.splice(idx, 1);
    }
    this.updateRefreshUrl();
  };

  prtgGraphs.prototype.updateRefreshUrl = function() {
    this.$chart()
      .parent(".PNGGraph")
      .attr(
        "refreshurl",
        this.data.currentChartUrl + "&hide=" + this.data.hiddenChannel.join(",")
      );
    this.$el.find("#hiddenchannels").val(this.data.hiddenChannel.join(","));
  };

  _Prtg.Plugins.registerPlugin("prtg-graphs", prtgGraphs);

  function prtgGraphsScroll(element, data, parent) {
    this.el = !(element instanceof jQuery) ? element : element[0];
    this.$el = !(element instanceof jQuery) ? $(element) : element;
    this.$parent = !(parent instanceof jQuery) ? $(parent) : parent;
    this.$legend = this.$el.find(".chartlegend");
    this.$chart = function() {
      return this.$el.find(
        '.prtgchart[data-graphid="' + this.$legend.attr("data-graphid") + '"]'
      );
    };

    this.data = data;
    this.serverTime = _Prtg.serverTime.getTime();

    this.orginalRefreshUrl =
      this.data.currentChartUrl ||
      this.$chart()
        .parent(".PNGGraph")
        .attr("refreshurl");
    this.orginalRefreshUrl = {
      url: this.orginalRefreshUrl.split("?")[0],
      par: _Prtg.Util.getUrlParameters(this.orginalRefreshUrl)
    };
    this.orginalSrc = this.data.currentChartSrc || this.$chart().attr("src");
    this.orginalSrc = {
      url: this.orginalSrc.split("?")[0],
      par: _Prtg.Util.getUrlParameters(this.orginalSrc)
    };
    this.average = "";
    this.incrementor = 0;
    this.clgid = $('input[name="clgid"]:checked').val() || null;
    this.stepwidth =
      this.$el.find(".PNGGraph").length > 0
        ? (function(me, data) {
            var p,
              j,
              t = data.chartType,
              i = data.sensorInterval,
              multiplier = function(d) {
                switch (d) {
                  case "m":
                    return 60;
                  case "h":
                    return 60 * 60;
                  case "d":
                    return 60 * 60 * 24;
                  default:
                    return 1;
                }
              };
            if (typeof t === "string") {
              p = t.split("|");
              t = parseInt(p[0], 10);
              i = multiplier(p[0].charAt(p[0].length - 1));
              if (p.length > 1) {
                j = parseInt(p[1], 10);
                me.average = j * multiplier(p[1].charAt(p[1].length - 1));
              } else {
                me.average = i;
              }
            } else {
              me.average = i;
            }
            p = t * i * 1000;
            return p;
          })(this, this.$el.find(".PNGGraph").data())
        : 0;
    this.zoom = 1.0;
    this.init(this);
  }

  prtgGraphsScroll.prototype.roundTime = function() {
    return this.serverTime - this.serverTime % (this.average * 1000);
  };

  prtgGraphsScroll.prototype.init = function(self) {
    var timer = null;
    self.$el
      .on("click", ".scrollchart", function(e) {
        if (self.$el.find(".PNGGraph").length) {
          var controls = $(this).parent(".prtg-graphs-controls");
          if (controls.find(".loadspinner").length == 0) {
            controls.append('<div class="loadspinner"></div>');
          }
          $(this)
            .parent(".prtg-graphs-controls")
            .addClass("loading");
        }

        var orginalSrc = $.extend(true, {}, self.orginalSrc),
          orginalRefreshUrl = $.extend(true, {}, self.orginalRefreshUrl),
          edate,
          sdate,
          data = $(this).data();

        if (self.incrementor === 0) {
          if ($(this).is(".right")) {
            $(this)
              .parent(".prtg-graphs-controls")
              .removeClass("loading");
            return;
          } else {
            self.serverTime = _Prtg.serverTime.getTime();
          }
        }

        if (self.zoom + data.zoom > 0.01) self.zoom += data.zoom;
        if (self.zoom >= 1.0) self.zoom = 1.0;
        self.incrementor += data.step;
        if (self.incrementor >= 0) self.incrementor = 0;
        if (data.zoom === 0 && data.step === 0)
          (self.incrementor = 0), (self.zoom = 1.0);
        if (self.incrementor !== 0 || self.zoom !== 1.0) {
          edate = new Date(
            self.roundTime() + self.incrementor * self.stepwidth * self.zoom
          );
          sdate = new Date(edate.getTime() - self.stepwidth * self.zoom);
          orginalSrc.par["graphid"] = -1;
          orginalSrc.par["edate"] = edate.toPrtgString();
          orginalSrc.par["sdate"] = sdate.toPrtgString();
          orginalSrc.par["avg"] = self.average;
          if (self.clgid) orginalSrc.par["clgid"] = self.clgid;
          self
            .$chart()
            .parent(".PNGGraph")
            .removeAttr("refreshurl");
        } else {
          self
            .$chart()
            .parent(".PNGGraph")
            .attr(
              "refreshurl",
              self.url(orginalRefreshUrl, "currentChartUrl") +
                "&hide=" +
                self.data.hiddenChannel.join(",")
            );
          self.serverTime = _Prtg.serverTime.getTime();
        }
        clearTimeout(timer);
        self.$el.find("a[data-force]").each(function() {
          orginalSrc.url = $(this)
            .attr("href")
            .split("?")[0];
          $(this).attr(
            "href",
            self.url(orginalSrc, "currentChartSrc") +
              "&hide=" +
              self.data.hiddenChannel.join(",") +
              "&" +
              $(this).data("force") +
              "=true"
          );
        });

        timer = setTimeout(function() {
          var newSrc =
            self.url(orginalSrc, "currentChartSrc") +
            "&hide=" +
            self.data.hiddenChannel.join(",");
          newSrc = fitSizeUrl(newSrc);

          if (self.$chart().attr("src") == newSrc) {
            self.$el.find(".loading,.load").removeClass("loading load");
          } else {
            newSrc = newSrc.replace(regexCacheBreaker, "myid=" + $.now());
            self
              .$chart()
              .addClass("load")
              .off("load")
              .attr("src", newSrc)
              .one("load", function() {
                self.$el.find(".loading,.load").removeClass("loading load");
              });
          }
        }, 333);
      })
      .find("#chart")
      .append(
        '<span class="prtg-graphs-controls">' +
          '<div class="scrollchart left" data-step="-1" data-zoom="0" title="' +
          _Prtg.Lang.Graphs.strings.bigscrollleft +
          '"><i class="glyph-graph-left-double"></i></div>' +
          '<div class="scrollchart left" data-step="-0.1" data-zoom="0" title="' +
          _Prtg.Lang.Graphs.strings.smallscrollleft +
          '"><i class="glyph-graph-left"></i></div>' +
          '<div class="scrollchart center" data-step="0" data-zoom="-0.2" title="' +
          _Prtg.Lang.Graphs.strings.zoomin +
          '"><i class="glyph-graph-plus"></i></div>' +
          '<div class="scrollchart center" data-step="0" data-zoom="0" title="' +
          _Prtg.Lang.Graphs.strings.reset +
          '"><i class="glyph-graph-reload"></i></div>' +
          '<div class="scrollchart center" data-step="0" data-zoom="0.2" title="' +
          _Prtg.Lang.Graphs.strings.zoomout +
          '"><i class="glyph-graph-minus"></i></div>' +
          '<div class="scrollchart right " data-step="0.1" data-zoom="0" title="' +
          _Prtg.Lang.Graphs.strings.smallscrollright +
          '"><i class="glyph-graph-right"></i></div>' +
          '<div class="scrollchart right " data-step="1" data-zoom="0" title="' +
          _Prtg.Lang.Graphs.strings.bigscrollright +
          '"><i class="glyph-graph-right-double"></i></div>' +
          "</span>"
      );
  };

  // Ein kommentar wär schön...
  prtgGraphsScroll.prototype.url = function(u, c) {
    var ret =
      u.url +
      "?" +
      Object.keys(u.par)
        .map(function(e) {
          return e + "=" + encodeURIComponent(u.par[e]);
        })
        .join("&");
    this.data[c] = ret;
    return ret;
  };

  _Prtg.Plugins.registerPlugin("prtg-graphs-scroll", prtgGraphsScroll);
})(jQuery, window, document);
