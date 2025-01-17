﻿/* _Prtg.Maps.js */
(function prtgMapsPlugin($, window, document, undefined) {
  var pluginName = 'prtg-maps';

  function prtgMaps(element, data, parent) {
    this.el = (!(element instanceof jQuery)) ? element : element[0];
    this.$el = (!(element instanceof jQuery)) ? $(element) : element;
    this.$parent = (!(parent instanceof jQuery)) ? $(parent) : parent;
    this.$objectpanel = this.$el.find('div.objectpanel');
    this.$probpanel = this.$el.find('div.probpanel');


    this.mode = data.mode;
    this.isInputFocused = false;
    this.connections = data.connections;
    this.mObjInfo = {};

    this.historydata = data.historydata;

    this.autoscale = data.autoscale;

    this.previewShowtimer = null;
    this.previewAjax = null;
    this.previewHover = false;

    this.snapToGrid = true;

    this.map = {
      id: parseInt(data.mapid, 10),
      width: parseInt(data.mapwidth, 10),
      height: parseInt(data.mapheight, 10)
    };

    this.selectedObjects = [];

    this.svg = d3.select('#mapsvg');
    this.svgDefs = this.svg.append('svg:defs');

    if (this.mode === 'edit') {
      this.initMapEditor();
    } else {
      this.initMapView();
    }
  }

  prtgMaps.prototype.mapAutoScale = function mapAutoScale() {
    var $map = $('#mapview');
    var $view = $('#mapshow');

    var mapHeight = $map.height();
    var mapWidth = $map.width();

    var viewWidth = $view.innerWidth();
    var viewHeight = $view.innerHeight();

    var widthFactor;
    var heightFactor;
    var factor;

    widthFactor = (viewWidth / mapWidth);
    heightFactor = (viewHeight / mapHeight);
    if (widthFactor > heightFactor) factor = heightFactor;
    else factor = widthFactor;

    $map.css('-moz-transform', 'scale(' + factor + ')');
    $map.css('-moz-transform-origin', '0 0');
    $map.css('-ms-transform', 'scale(' + factor + ')');
    $map.css('-ms-transform-origin', '0 0');
    $map.css('transform', 'scale(' + factor + ')');
    $map.css('transform-origin', '0 0');
    if ($map.parent('.scalewrapper').length) {
      $map.parent('.scalewrapper').css({
        'width': $map.innerWidth() * factor,
        'height': $map.innerHeight() * factor
      });
    } else {
      $map.wrap($('<div/>', {'class': 'scalewrapper'}).css({
        'position': 'absolute',
        'width': $map.innerWidth() * factor,
        'height': $map.innerHeight() * factor,
        'overflow': 'hidden'
      }));
    }
  };

  prtgMaps.prototype.initMapView = function initMapView() {
    var self = this;

    function resize(offsetTop, footerAtr, scale) {
      var e = $('#loadedcontent').parent();
      var d = e.find('#mapshow');
      var h = Math.floor(window.innerHeight - offsetTop);
      var footer = !!footerAtr && footerAtr.length > 0 ? footerAtr[0] : false;
      if (!!footer) {
        h -= footer.offsetHeight + 19;
      }
      d.height((Math.floor(d.css('min-Height'), 10) > h ? Math.floor(d.css('min-Height'), 10) : h));
      if (self.mode !== 'edit' && self.autoscale === true && scale !== false) {
        self.mapAutoScale();
      }
    }
    resize(
      self.$el.offset().top,
      document.getElementsByTagName('footer'),
      false
    );
    _Prtg.Events.subscribe('prtg.resize.layout', $.proxy(
        resize,
        self,
        self.$el.offset().top,
        document.getElementsByTagName('footer')
    ));
    self.$el.on('destroyed', function() {
      _Prtg.Events.unsubscribe('prtg.resize.layout', $.proxy(
          resize,
          self,
          self.$el.offset().top,
          document.getElementsByTagName('footer')
      ));
    });
    // Non-Blocking loading

    self.$el.find('.map_object').each(function(i, elm) {
      self.updateMapObjectPosition($(elm));
    });
    self.$el.find('.map_object').each(function(i, elm) {
      self.InitMapObject.call(self, elm);
    });

    function linkIsExternal(link) {
      if (link.match(/.{0,7}:\/\/.*/)) return true;
      return false;
    }

    self.$el.on('click.mapeditor', '.map_linkedobject', function(e) {
      e.preventDefault();
      var link = this.getAttribute('data-link');
      if (linkIsExternal(link)) {
        var newWnd = window.open(link);
        newWnd.opener = null;
      } else {
        window.top.location = link;
      }
      return false;
    });

    _Prtg.Events.subscribeOnce('refresh.events.prtg', function() {
      if ($('#mapeditor').length < 1 && $('.prtg-tabs').find('.tab-active').attr("tabid") == 1) {
        $('.prtg-tabs').find('.tab-active').click();
      } else if($('#mapdashboard').length) {
        $.ajax({
          url: $('#mapdashboard').attr('mapurl'),
          type: 'GET',
          dataType: 'html',
        }).done(function success(content, textStatus, jqXHR) {
          content = $($.parseHTML(content));

          $('#mapdashboard').html(content)
          content=null;
          _Prtg.initPlugins($('#mapdashboard'));
        })
      }
    });

    if (self.autoscale === true) {
      self.mapAutoScale();
    }
  };

  prtgMaps.prototype.initMapEditor = function() {
    var self = this;

    self.$historyUndoButton = self.$objectpanel.find('.history_button.history_undo');
    self.$historyRedoButton = self.$objectpanel.find('.history_button.history_redo');

    var historyData = self.historydata.split(':');
    self.historyPosition = historyData[0];
    self.historyMax = historyData[1];
    self.historyCount = historyData[2];
    self.historyLoading = false;

    // disable jquery.event.drag - HACK
    $.event.special.drag.defaults.distance = 9999999;
    $.event.special.drag.defaults.which = 9999999;

    _Prtg.Events.subscribe('prtg.resize.layout', $.proxy(self.resizeMapeditor, self));

    self.$el.on('destroyed', {
      'self': self
    }, self.destroyEditor);

    self.$el.on('mouseover mouseleave', '.previewloading', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });

    // Make right and left panel resizeable
    self.$el.find('.panelsizer').draggable({
      containment: '#mapeditor',
      axis: 'x',
      addClasses: false
    });

    var $mapObjects = self.$el.find('.map_object');

    $mapObjects.each(function(i, elm) {
      self.updateMapObjectPosition($(elm));
    });
    $mapObjects.each(function(i, elm) {
      self.InitMapObject.call(self, elm);
    });

    self.initEvents();
    setTimeout(self.initTree, 10);
    setTimeout(function() {
      self.prepareIcons.call(self);
    }, 10);

    self.resizeMapeditor(true);
    self.checkHistoryButtons();
  };

  prtgMaps.prototype.initEditorMapobjects = function() {
    var self = this;
    self.svg = d3.select('#mapsvg');
    self.svgDefs = self.svg.append('svg:defs');

    var $mapObjects = self.$el.find('.map_object');
    $mapObjects.each(function(i, elm) {
      self.updateMapObjectPosition($(elm));
    });
    $mapObjects.each(function(i, elm) {
      self.InitMapObject.call(self, elm);
    });
  };

  prtgMaps.prototype.destroyEditor = function(event) {
    var self = event.data.self;
    $(window).off('.mapeditor');
    $(document).off('.mapeditor');
    self.$el.off('.mapeditor');
    _Prtg.Events.unsubscribe('prtg.resize.layout', $.proxy(self.resizeMapeditor, self));
    try {
      self.$el.find('.ui-draggable, .map_object, .object_connector, .panelsizer, .map_objectsizer').draggable('destroy');
      self.$el.find('.ui-droppable, .map_object, #mapview').droppable('destroy');
    } catch (e) {
      console.log(e);
    }
  };

  prtgMaps.prototype.resizeMapeditor = function(initial) {
    var self = this;
    var w = $(window);
    var f = $('footer')[0];
    var e = self.$el.parent();
    var d = e.find('#mapeditor');
    var h = window.innerHeight - self.$el.offset().top;
    if (!!f) {
      h -= f.offsetHeight + 15;
    } else if (self.$el.parent().is('.wingui')) {
      h = w.height();
    }
    d.height((Math.floor(d.css('min-Height'), 10) > h ? Math.floor(d.css('min-Height'), 10) : h));
    // sizer position after window resize
    self.$el.find('.probpanelsizer').css('left', $('#mapeditor').outerWidth() - $('.probpanel').outerWidth() - 21);

    var treePanel = self.$el.find('#objectpanel_tree');
    var objectpanel = treePanel.parent('.objectpanel');
    treePanel.css('height', (objectpanel.height() - 40 - 35 - 12) + 'px');

    if (!initial) $('#possibleobjects').accordion('refresh');
  };

  // --------------------------------------------------
  // Right/Left panel
  // --------------------------------------------------
  prtgMaps.prototype.prepareIcons = function() {
    var self = this;
    $.getJSON("/api/mapobject.json", $.proxy(self.initIcons, self));
  };

  prtgMaps.prototype.initIcons = function(images) {
    var self = this;
    var objectdiv = $("#possibleobjects"),
      accord = "",
      category, cont, i = 0;

    for (category in images) {

      accord += '<h3 cate="' + category + '">' + category + '</h3><div>';
      if (typeOf(images[category][0]) === "String") {
        accord += '<ul class="iconspreview objectprev">';
      } else if (typeOf(images[category][0]) === "Object") {
        accord += '<ul class="objectpreview objectprev">';
      }
      for (cont in images[category]) {
        if (typeOf(images[category][cont]) === "String") {
          if (i % 2 || i === 8) {
            accord += '<li class="newobject" data-type="icon"><a href="#"><img class="lazy" src="images/transparent.gif" data-src="/mapicons' + images[category][cont] + '" alt="" /></a>';
          } else {
            accord += '<li class="newobject" data-type="icon"><a href="#"><img class="lazy" src="images/transparent.gif" data-src="/mapicons' + images[category][cont] + '" alt="" /><img  class="lazy icontemplate" src="images/transparent.gif" data-src="/images/mapicon_template.svg" alt="" /></a></li>';
          }
        } else if (typeOf(images[category][cont]) === "Object") {
          accord += '<li class="newobject" data-type="data">' + images[category][cont].name + '<div class="objectpreviewoverlay" data-url="' + images[category][cont].value + '" data-title="' + images[category][cont].name + '"></div></li>';
        }
      }
      accord += '</ul></div>';
      i++;
    }
    objectdiv.append(accord);

    $("ul.objectprev li").draggable({
      containment: '#mapview',
      appendTo: "#mapview",
      cancel: false,
      scroll: true,
      cursor: "move",
      scope: "mapobject",
      revert: false,
      addClasses: false,
      helper: function() {
        var $this = $(this);
        var objid = 0;
        if ($(".jstree-clicked").length) {
          objid = $(".jstree-clicked").parent().attr("objid");
        }
        if ($this.find('img').length > 0) {
          return '<div id="' + objid + '" class="dragto_helper icon_dragto" data-type="' + $this.attr("data-type") + '"><p><img src="' + $this.find('img').attr('src') + '" /></p>' + '</div>';
        } else {
          if ($this.find('.mapobjectpreviewcontainer').length > 0) {
            return '<div id="' + objid + '" class="dragto_helper icon_dragto" data-type="' + $this.attr("data-type") + '"><p>' + $this.find('.mapobjectpreviewcontainer').html() + '</p>' + '</div>';
          } else {
            return '<div id="' + objid + '" class="dragto_helper icon_dragto" data-type="' + $this.attr("data-type") + '"><p>' + $this.text() + '</p>' + '</div>';
          }
        }
      },
      distance: 30,
      zIndex: 999999999,
      opacity: 0.35
    });

    $("#possibleobjects").accordion({
      collapsible: true,
      heightStyle: "fill",
      animate: false,
      activate: function(event, ui) {
        self.lazyImageLoad(ui.newPanel);
      }
    });

    $("#possibleobjects").accordion("refresh");
    self.lazyImageLoad($('.ui-accordion-content-active'));

  };

  prtgMaps.prototype.lazyImageLoad = function($container) {
    $container.find('img.lazy').each(function(i, e) {
      var $this = $(this);
      var source = $this.attr('data-src');
      $this.attr('src', source);
      $this.removeClass('lazy').removeAttr('data.src');
    });

  };

  prtgMaps.prototype.initTree = function() {
    var searchResultCount = 0;
    var searched = false;
    var searchActive = false;

    var tree = $("#objectpanel_tree").jstree({
      "json_data": {
        "ajax": {
          "url": "/api/tree.json?groups=1&devices=1&probes=1&allowroot=1"
        },
        "progressive_render": true
      },
      "core": {
        "animation": 0
      },
      "search": {
        "case_insensitive": true,
        "show_only_matches": true
      },
      "ui": {
        "select_limit": 1
      },
      types: {
        "types" : {
          "disabled": {
            "select_node": false
          }
        }
      },
      "plugins": ["json_data", "ui", "search", "types"]
    }).bind("open_node.jstree", function(event, data) {
      if (searchActive) return;
      data.rslt.obj.siblings(".jstree-open").each(function() {
        data.inst.close_node(this, true);
      });
    }).bind('load_node.jstree', function(e, data) {
      var $nodes = data.inst._get_children(data.rslt.obj);
      $nodes.each(function() {
          $(this).draggable({
            containment: "#mapeditor",
            scope: "mapobject",
            helper: function(event) {
              return $('<div class="dragto_helper" id="' + $(this).attr("objid") + '"><p><img src="/mapicons/defaulticons1/A1 pc.png" /></p>' + '</div>');
            },
            start: function(e) {
              if($(this).attr('rel') == 'disabled') return false;
            },
            distance: 30,
            appendTo: 'body'
          });
      });
    }).bind('loaded.jstree', function(e, data) {
      $('#objectpanel_tree li').draggable({
        containment: "#mapeditor",
        scope: "mapobject",
        helper: function(event) {
          return $('<div class="dragto_helper" id="' + $(this).attr("objid") + '"><p><img src="/mapicons/defaulticons1/A1 pc.png" /></p>' + '</div>');
        },
        start: function(e) {
          if($(this).attr('rel') == 'disabled') return false;
        },
        distance: 30,
        appendTo: 'body',
        addClasses: false
      });
    });
    var searchTimeout;
    var searchbox = $('#maptreesearchinput');

    searchbox.keydown(function(event) {
      clearTimeout(searchTimeout);
      searched = !searched;
      if (event.keyCode == '13') startSearch();
      searchTimeout = setTimeout(startSearch, 1000);

      function startSearch() {
        searchActive = true;
        tree.addClass('jstree-search');
        $('#prtgtreeview_deleteicon').show();
        tree.jstree('open_all', false);
        tree.jstree('search', searchbox.val());
      }
    }).blur(function(event) {
      if ($(this).val() === '') {
        $(this).val(_Prtg.Lang.common.strings.search);
      }
    }).focus(function() {
      $(this).val('');
    });

    $("#prtgtreeview_deleteicon").click(function() {
      tree.removeClass('jstree-search');
      tree.jstree("clear_search");
      $(this).hide();
      searchbox.val("Search...");
      searched = false;
      searchActive = false;
    });
  };

  //TODO: refactor
  prtgMaps.prototype.showObjectProperties = function() {
    var self = this;
    self.$el.find("#prob_save").hide();
    if (self.$el.find("#objectproperties").is(':hidden')) {
      self.$el.find("#objectproperties").show();

      self.$el.find("#possibleobjects").accordion("refresh");
    }
  };
  //TODO: refactor
  prtgMaps.prototype.hideObjectProperties = function() {
    var self = this;
    if (self.$el.find("#objectproperties").is(':visible')) {
      self.$el.find("#objectproperties").hide();
      self.$el.find("#possibleobjects").accordion("refresh");
    }
  };

  // --------------------------------------------------
  // Event Binding
  // --------------------------------------------------
  prtgMaps.prototype.initEvents = function() {
    var self = this;

    // Dropphandling TODO
    self.$el.find("#mapview").on("drop.mapeditor", {
      "self": self
    }, self.dropNewObjectHandler).on("dropover.mapeditor", function(event, ui) {
      if (ui.helper.hasClass("dragto_helper")) {
        // TODO move to css
        ui.helper.css({
          "border": "1px solid green"
        });
      }
    }).on("dropout.mapeditor", function(event, ui) {
      if (ui.helper.hasClass("dragto_helper")) {
        // TODO move to css
        ui.helper.css({
          "border": "1px solid black"
        });
      }
    }).droppable({
      scope: "mapobject",
      tolerance: 'pointer',
      addClasses: false
    });

    // In der object preview clicks deaktivieren.
    self.$el.on("click.mapeditor", ".onepreview>*", function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }).on("dblclick.mapeditor", 'ul.objectprev li, #objectpanel_tree li', function(e) {
      var $this = $(this);
      if($this.attr('rel') == "disabled") return;
      var ui = {
        'helper': $($this.draggable("option", "helper").call($this)),
        'draggable': $this
      };
      if(self.selectedObjects[0]) {
        if (!self.isScrolledIntoViewVertical($(".editor"), self.selectedObjects[0])) {
          $(".editor").scrollTop(self.selectedObjects[0].position().top);
        }
        if (!self.isScrolledIntoViewHorizontal($(".editor"), self.selectedObjects[0])) {
          $(".editor").scrollLeft(self.selectedObjects[0].position().left);
        }
        self.$el.find(self.selectedObjects[0]).trigger('drop.mapeditor', [ui]);
      } else {
        self.$el.find("#mapview").trigger('drop.mapeditor', [ui]);
      }
      e.stopPropagation();
      e.preventDefault();
    });

    self.$el.on("dragstop.mapeditor", ".panelsizer", {
      "self": self
    }, self.dragStopPanelSizerHanlder).on("drag.mapeditor", ".panelsizer", {
      "self": self
    }, self.dragPanelSizerHanlder).on("click.mapeditor", ".panelpinbutton", {
      "self": self
    }, self.togglePanelHanlder).on("click.mapeditor", ".editor", {
      "self": self
    }, self.deSelectAllHandler).on("click.mapeditor", "#prob_save", {
      "self": self
    }, self.saveMapObjectPropertiesHandler).on("click.mapeditor", "#map_select_externallink", {
      "self": self
    }, self.selectMapObjectLinkDialog).on("change.mapeditor", "#map_snaptogridcontrol input", {
      "self": self
    }, self.snapToGridHandler).on('click.mapeditor', '.history_buttons .history_button', {
      "self": self
    }, self.historyButtonHandler).on("keydown.mapeditor", ".propertyval", function() {
      if (!$("#prob_save").is(':visible')) {
        self.$el.find("#prob_save").show();
        $("#possibleobjects").accordion("refresh");
      }
    }).on("mouseenter.mapeditor mouseleave.mapeditor", "ul.objectpreview li", {
      "self": self
    }, self.hoverObjectPreviewHandler);

    $(document).on('keydown.mapeditor', {
      'self': self
    }, self.keyHandler);

    $('input').focus(function() {
      self.isInputFocused = true;
    }).blur(function() {
      self.isInputFocused = false;
    });
    $("textarea").focus(function() {
      self.isInputFocused = true;
    }).blur(function() {
      self.isInputFocused = false;
    });

    self.mapObjectEvents();
  };

  prtgMaps.prototype.mapObjectEvents = function() {
    var self = this;

    self.$el.find("#mapview").on("click.mapeditor", ".map_object_overlay", {
      "self": self
    }, self.selectMapObjectHandler).on("click.mapeditor", ".map_object .map_objecttools.delete", {
      "self": self
    }, self.deleteMapObjectButtonHandler).on("click.mapeditor", ".map_object .map_objecttools.dropconnectors", {
      "self": self
    }, self.dropAllConnectionsButtonHandler).on("click.mapeditor", ".map_object .map_objecttools.moveup, .map_object .map_objecttools.movedown", {
      "self": self
    }, self.moveUpDownButtonHandler).on("drag.mapeditor", ".map_object", {
      "self": self
    }, self.dragObjectHandler).on("dragstart.mapeditor", ".map_object", {
      "self": self
    }, self.dragStartObjectHandler).on("dragstop.mapeditor", ".map_object", {
      "self": self
    }, self.dragStopObjectHandler).on("drop.mapeditor", ".map_object", {
      "self": self
    }, self.dropObjectHandler).on("drag.mapeditor", ".object_connector", {
      "self": self
    }, self.dragConnectorHandler).on("dragstart.mapeditor", ".object_connector", {
      "self": self
    }, self.dragConnectorHandler).on("dragstop.mapeditor", ".object_connector", {
      "self": self
    }, self.dragConnectorHandler).on("drag.mapeditor", ".map_objectsizer", {
      "self": self
    }, self.dragSizerHandler).on("dragstart.mapeditor", ".map_objectsizer", {
      "self": self
    }, self.dragStartSizerHandler).on("dragstop.mapeditor", ".map_objectsizer", {
      "self": self
    }, self.dragStopSizerHandler).on("mouseenter.mapeditor", "line", {
      "self": self
    }, self.showConnectionRemoveButton).on("mouseleave.mapeditor", ".connection-remove-container", {
      "self": self
    }, self.removeConnectionRemoveButton).on("mouseenter.mapeditor", ".connection-remove-container", {
      "self": self
    }, self.removeConnectionRemoveButton).on("click.mapeditor", ".connection-remove", {
      "self": self
    }, self.removeConnectionHandler);

    $('.map_object').on("scroll.mapeditor", function(e) {
      var $this = $(this);
      $this.find('.map_object_buttonbar').css('top', $this.scrollTop() + 'px');
    });
  };

  // --------------------------------------------------
  // Event Handlers
  // --------------------------------------------------
  prtgMaps.prototype.removeConnectionHandler = function(event) {
    var self = event.data.self;

    var subid = $(this).attr("subid");
    var tosubid = $(this).attr("tosubid");

    self.$el.find(".connection-remove-container").remove();
    $.when(self.SaveMapObject(subid, {
      "delconnectionto": tosubid
    })).done(function(response) {
      // TODO: load and update all connections from this subid after delete (Connection id change)
      self.$el.find('line[fromsubid="' + subid + '"]').filter('[tosubid="' + tosubid + '"]').remove();
    });
  };

  prtgMaps.prototype.showConnectionRemoveButton = function(event) {
    var self = event.data.self;
    if (self.$el.find('.connection-remove[subid="' + $(this).attr("fromsubid") + '"]').length > 0) return;
    var delDiv = $("<div />", {
      "class": "connection-remove",
      "subid": $(this).attr("fromsubid"),
      "tosubid": $(this).attr("tosubid")
    });

    var div = $("<div />", {
      "class": "connection-remove-container",
      "html": delDiv
    }).css({
      "top": event.originalEvent.layerY - 30,
      "left": event.originalEvent.layerX - 30
    }).appendTo("#mapview");
  };

  prtgMaps.prototype.removeConnectionRemoveButton = function(event) {
    var self = event.data.self;
    if (event.type === "mouseleave") {
      $(this).data("removetimer", setTimeout(function() {
        self.$el.find(".connection-remove-container").remove();
      }, 1000));
    } else if (event.type === "mouseenter") {
      clearTimeout($(this).data("removetimer"));
    }
  };

  prtgMaps.prototype.saveMapObjectPropertiesHandler = function(event) {
    var self = event ? event.data.self : this;
    if(event) event.preventDefault();
    var selected = self.selectedObjects[0];
    $validator = self.$el.find("#htmlvalidator");
    $validator.append(self.$el.find("#prob_htmlbefore").val() + "|-|-|" + self.$el.find("#prob_htmlafter").val());
    self.$el.find("#prob_htmlbefore").val($validator.html().split("|-|-|")[0]);
    self.$el.find("#prob_htmlafter").val($validator.html().split("|-|-|")[1]);
    $validator.html("");

    selected.css({
      "top": self.$el.find("#prob_top").val() + "px",
      "left": self.$el.find("#prob_left").val() + "px",
      "width": self.$el.find("#prob_width").val() + "px",
      "height": self.$el.find("#prob_height").val() + "px",
      "z-index": self.$el.find("#prob_zindex").val()
    });


    self.newMapObjectPosition(selected);
    //    CheckObjectBounds(selected, $("#mapview"));
    var subid = selected.attr("subid");
    self.SaveMapObject(subid, {
      "top": parseInt(selected.position().top, 10) || 0,
      "left": parseInt(selected.position().left, 10) || 0,
      "width": parseInt(selected.width(), 10) || 0,
      "height": parseInt(selected.height(), 10) || 0,
      "zindex": self.$el.find("#prob_zindex").val() || 0,
      "htmlbefore_": self.$el.find("#prob_htmlbefore").val() || "",
      "htmlafter_": self.$el.find("#prob_htmlafter").val() || "",
      "ElementLink": self.$el.find("#prob_externallink").val() || ""
    }).done(function(resp) {
      self.$el.find("#prob_save").hide();
      self.replaceMapObject(resp, subid);
    }); // TODO: show saving wheel after click
  };

  prtgMaps.prototype.deSelectAllHandler = function(event) {
    var self = event.data.self;
    self.selectedObjects = [];
    self.$el.find(".maptable_selected").removeClass("maptable_selected");
    self.$el.find(".mapobject_selected").removeClass("mapobject_selected");
    self.hideObjectProperties();
  };

  prtgMaps.prototype.selectMapObjectHandler = function(event) {
    var self = event.data ? event.data.self : event;
    if (event.data) event.stopPropagation();

    self.showObjectProperties();
    if (self.selectedObjects[0]) {
      // Wenn das aktuell ausgewaelte schon das selbe ist abbrechen
      if (self.selectedObjects[0].attr("id") === $(this).parent(".map_object").attr("id")) return;
      self.selectedObjects[0].removeClass("maptable_selected");
      self.selectedObjects[0].removeClass("mapobject_selected");
    }

    self.selectedObjects = [$(this).parent(".map_object")];
    var selected = self.selectedObjects[0];
    if (selected.hasClass("map_table") || selected.hasClass("map_graph")) {
      selected.addClass("maptable_selected");
    } else {
      selected.addClass("mapobject_selected");
    }
    self.updatePropbSheet(selected);
  };

  prtgMaps.prototype.selectMapObject = function(subid) {
    var self = this;
    var $elm = this.$el.find('#mapelement_' + this['map'].id + '_' + subid);

    self.showObjectProperties();
    if (self.selectedObjects[0]) {
      self.selectedObjects[0].removeClass("maptable_selected");
      self.selectedObjects[0].removeClass("mapobject_selected");
    }

    self.selectedObjects = [$elm];
    var selected = self.selectedObjects[0];
    if (selected.hasClass("map_table") || selected.hasClass("map_graph")) {
      selected.addClass("maptable_selected");
    } else {
      selected.addClass("mapobject_selected");
    }
    self.updatePropbSheet(selected);
  };

  // TODO: look
  prtgMaps.prototype.togglePanelHanlder = function(event) {
    var self = event.data.self;
    var $this = $(this);
    $panel = $this.parent(".panel");
    if ($panel.hasClass("objectpanel")) {
      if ($panel.is(":visible")) {
        $editor = $("#mapeditor div.editor");
        $editor.css("left", "10px");
        //$panel.css("width", "0px");
        $panel.hide();
        //$(".objectpanelsizer").addClass("objectpaneltoggle");
        self.$el.find(".objectpanelsizer").css({
          "left": "0px",
          "width": "10px"
        });
      }
    }
  };

  prtgMaps.prototype.keyHandler = function(event) {
    var self = event.data.self;
    if(event.which === 89 && event.ctrlKey) {
      self.loadMapHistory(0);
    } else if (event.which === 90 && event.ctrlKey) {
      self.loadMapHistory(1);
    }

    if (!self.selectedObjects[0]) return;
    var movedist = 1;
    var selectedSubid = self.selectedObjects[0].attr('subid');

    function updateObj() {
      self.CheckObjectBounds(self.selectedObjects[0], $("#mapview"));
      self.newMapObjectPosition(self.selectedObjects[0]);
      self.SaveMapObject(selectedSubid, {
        'top': parseInt(self.selectedObjects[0].position().top, 10),
        'left': parseInt(self.selectedObjects[0].position().left, 10)
      });
      event.preventDefault();
    }

    if(event.shiftKey) movedist = 10;
    if (self.isInputFocused) return;
    if (!self.selectedObjects[0]) return;

    if (!self.isScrolledIntoViewVertical($(".editor"), self.selectedObjects[0])) {
      $(".editor").scrollTop(self.selectedObjects[0].position().top);
    }
    if (!self.isScrolledIntoViewHorizontal($(".editor"), self.selectedObjects[0])) {
      $(".editor").scrollLeft(self.selectedObjects[0].position().left);
    }

    switch (event.keyCode) {
    case 46: //entf key
      self.DeleteMapObject.call(self, self.selectedObjects[0]);
      self.deSelectAllHandler({
        'data': {
          'self': self
        }
      });
      break;
    case 37: // left
      self.selectedObjects[0].css("left", (self.selectedObjects[0].position().left -= movedist).toFixed(0) + "px");
      updateObj();
      break;
    case 38: // up
      self.selectedObjects[0].css("top", (self.selectedObjects[0].position().top -= movedist).toFixed(0) + "px");
      updateObj();
      break;
    case 39: // right
      self.selectedObjects[0].css("left", (self.selectedObjects[0].position().left += movedist).toFixed(0) + "px");
      updateObj();
      break;
    case 40: // down
      self.selectedObjects[0].css("top", (self.selectedObjects[0].position().top += movedist).toFixed(0) + "px");
      updateObj();
      break;
    }
  };

  prtgMaps.prototype.hoverObjectPreviewHandler = function(event) {
    var self = event.data.self;
    var $this = $(this);
    if (event.type === "mouseleave") {
      clearTimeout(self.previewShowtimer);
      self.previewHover = false;
      return;
    }
    if (self.previewHover) return;

    self.previewHover = true;
    self.previewShowtimer = setTimeout(function() {
      var $thisdiv = $this.find('div');
      var objid = 0;
      var width = 200;
      var height = 200;

      if ($(".jstree-clicked").length) {
        objid = $(".jstree-clicked").parent().attr("objid");
      }
      // if (selected !== "") {
      //   objid = selected.attr("objectid");
      // }
      $(".preview").remove();
      self.previewAjax = null;
      // TODO
      // if (!isScrolledIntoViewVertical($thisdiv.parent().parent().parent(), $(".preview"))) {
      //     $thisdiv.parent().parent().parent().scrollTop($(".preview").position().top);
      // }
      $this.append('<div class="preview"><span class="previewheader">' + _Prtg.Lang.Maps.strings.previewtext + ':</span><p class="previewloading loading-box"><span class="loadspinner"></span><span>' + _Prtg.Lang.Maps.strings.loadingtext + '</span></p></div>');

      if (self.previewAjax != null) self.previewAjax.abort();
      self.previewAjax = $.ajax({
        url: "/controls/mapobjectpreview.htm",
        data: {
          id: self.map.id,
          count: 5,
          dependency_: objid,
          width: width,
          height: height,
          selected: "",
          mapelements: ",*" + $thisdiv.attr("data-url") + "*",
          maptitles: ",*" + $thisdiv.attr("data-title") + "*"
        },
        dataType: 'html',
        type: "GET"
      }).done(function(response) {
        var preHtml = $(response);
        preHtml.find(".objtitle").hide()
        self.previewAjax = null;
        $(".previewloading", $this).html(preHtml).removeClass('loading-box');
        _Prtg.initPlugins($(".previewloading", $this));
      }).fail(function() {
        $(".preview").remove();
      });
    }, 500);
  };

  prtgMaps.prototype.dragStopPanelSizerHanlder = function(event, ui) {
    event.stopPropagation();
    var $sizer = $(this);
    var $resizePanel = $sizer.hasClass("objectpanelsizer") ? $(".objectpanel") : $(".probpanel");
    if ($resizePanel.hasClass("objectpanel")) {
      $editor = $("#mapeditor div.editor");
      $editor.css("left", ui.position.left + 6);
      $resizePanel.css("width", ui.position.left);
    } else if ($resizePanel.hasClass("probpanel")) {
      $editor = $("#mapeditor div.editor");
      $editor.css("right", $("#mapeditor").outerWidth() - ui.position.left);
      $resizePanel.css("width", $("#mapeditor").outerWidth() - ui.position.left - 21);
    }
  };

  prtgMaps.prototype.dragPanelSizerHanlder = function(event, ui) {
    event.stopPropagation();
    var $sizer = $(this);
    var $resizePanel = $sizer.hasClass("objectpanelsizer") ? $(".objectpanel") : $(".probpanel");
    if ($resizePanel.hasClass("objectpanel")) {
      // minsize = 200
      if (ui.position.left < 200) {
        ui.position.left = 200;
      }
      // maxsize = rightpanel - 100px
      if (ui.position.left > $(".probpanelsizer").position().left - 100) {
        ui.position.left = $(".probpanelsizer").position().left - 100;
      }
    } else if ($resizePanel.hasClass("probpanel")) {
      // minsize = 300
      if (($("#mapeditor").outerWidth() - ui.position.left - 21) < 300) {
        ui.position.left = $("#mapeditor").outerWidth() - 321;
      }
      // maxsize = leftpanel - 100px
      if (ui.position.left < $(".objectpanelsizer").position().left + 100) {
        ui.position.left = $(".objectpanelsizer").position().left + 100;
      }
    }
  };

  prtgMaps.prototype.dropNewObjectHandler = function(event, ui) {
    if (!ui.helper.hasClass("dragto_helper")) return;
    var self = event.data.self;
    self.CheckObjectBounds(ui.helper, $("#mapview"));
    var addId = ui.helper.attr("id");
    var top = ui.helper.offset().top - $("#mapview").offset().top + 15;
    var left = ui.helper.offset().left - $("#mapview").offset().left - 30;
    var helper = ui.helper.clone();

    if (self.snapToGrid) {
      var position = self.calcGrid({
        "top": top,
        "left": left
      });
      //ui.helper.offset().top = position.top;
      //ui.helper.offset().left = position.left;
      top = position.top;
      left = position.left;
    }

    helper.css({
      "position": "absolute",
      "top": top + "px",
      "left": left + "px"
    });
    //top = top + 15;
    //left = left - 30;
    helper.append('<p class="loading"><span class="loadspinner"></span></p>');
    helper.appendTo("#mapview");
    var obj = self.GetNewIcon(ui.draggable);
    self.addToMap(addId, top, left, helper, obj).done(function(resp) { // FAIL
      helper.remove();
      $.when($("#mapview").append($.parseHTML(resp))).then(function() {
        var subid = $($.parseHTML(resp)).filter(".map_object").attr("subid");
        var $addedElm = $("#mapelement_" + self.map.id + "_" + subid);
        if ($addedElm.is('.reaload_wo_params')) {
          $.get('/controls/mapobjectonly.htm?mode=edit&subid=' + subid + '&id=' + self['map'].id, function(response) {
            $addedElm.replaceWith(response);
            $addedElm = $("#mapelement_" + self.map.id + "_" + subid);
            self.updateMapObjectPosition($addedElm);
            self.InitMapObject.call(self, $addedElm);
          });
        } else {
          self.updateMapObjectPosition($addedElm);
          self.InitMapObject.call(self, $addedElm);
        }
      });
    });
  };

  prtgMaps.prototype.dragObjectHandler = function(event, ui) {
    var objid = ui.helper.attr("id");
    var subid = ui.helper.attr("subid");
    var self = event.data.self;

    self.updateMapObjectPosition(ui.helper);
    self.calcConnectionLines(subid);
    self.updatePropbSheetOnMove($(this));
  };

  prtgMaps.prototype.dragStartObjectHandler = function(event, ui) {
    var objid = ui.helper.attr("id");
    var subid = ui.helper.attr("subid");
    var self = event.data.self;

    if (self.snapToGrid) {
      var position = self.calcGrid({
        "top": ui.helper.offset().top,
        "left": ui.helper.offset().left
      });
      ui.helper.offset().top = position.top;
      ui.helper.offset().left = position.left;
    }

    self.selectMapObjectHandler.call(ui.helper.find(".map_object_overlay"), self);
    // Hide stuff that should not be displayed while dragging
    $(this).find(".map_object_buttonbar").hide();
    self.svg.select("#newconnector_" + subid).style("display", "none");
    self.$el.find("#map_objectsizer_" + subid).hide();
    self.$el.find("#object_connector_" + subid).hide();
  };

  prtgMaps.prototype.dragStopObjectHandler = function(event, ui) {
    var objid = ui.helper.attr("id");
    var subid = ui.helper.attr("subid");
    var self = event.data.self;
    var $this = $(this);
    $this.find(".map_object_buttonbar").show();
    // TODO: check object bounds;
    // if(self.CheckObjectBounds(ui.helper, $("#mapview"))) {
    //self.updatePropbSheetOnMove($this);
    self.newMapObjectPosition(ui.helper);

    self.SaveMapObject(subid, {
      'top': parseInt(ui.position.top, 10),
      'left': parseInt(ui.position.left, 10)
    });
  };

  prtgMaps.prototype.dropObjectHandler = function(event, ui) {
    event.stopPropagation();
    var self = event.data.self;
    var subid;

    if (ui.helper.hasClass("object_connector")) {
      subid = ui.helper.attr("subid");
      // if a connection between the objects allready exists, dont add a second one.
      if (self.$el.find('line[fromsubid="' + subid + '"]').filter('[tosubid="' + $(this).attr("subid") + '"]').length > 0) return;
      if (self.$el.find('line[fromsubid="' + $(this).attr("subid") + '"]').filter('[tosubid="' + subid + '"]').length > 0) return;

      var newConnectionIndex = self.mObjInfo[subid].connections.push(parseInt($(this).attr("subid"), 10)) - 1;
      self.svg.append("svg:line").data([self.mObjInfo[subid]]).call(self.calcNewConnection, self, subid, newConnectionIndex);
      self.svgDefs.append('svg:linearGradient').data([self.mObjInfo[subid]]).call(self.calcNewGradient, self, subid, newConnectionIndex);
      self.SaveMapObject(subid, {
        "addconnection": $(this).attr("subid")
      });
    } else if (ui.helper.hasClass("dragto_helper") && ui.helper.hasClass("icon_dragto")) {
      var obj = self.GetNewIcon(ui.draggable);
      subid = $(event.currentTarget).attr("subid");
      self.SaveMapObject(subid, {
        mapobject_: obj
      }).done(

      function(response) {
        self.replaceMapObject(response, subid);
      });
    } else if (ui.helper.hasClass("dragto_helper") && !ui.helper.hasClass("icon_dragto")) {
      subid = $(event.currentTarget).attr("subid");
      self.SaveMapObject(subid, {
        "objectid": ui.helper.attr("id")
      }).done(function(response) {
        self.replaceMapObject(response, subid);
      });
    }
  };

  prtgMaps.prototype.dragConnectorHandler = function(event, ui) {
    // TODO: Draw line to new connector dot while dragging
    // event.preventDefault();
    event.stopPropagation();

    // var subid = ui.helper.attr("subid"),
    //  self = event.data.self;
    // /* Drag */
    // if(event.type === "drag") {
    // }
    // /* Dragstart */
    // if(event.type === "dragstart") {
    // }
    // /* Dragstop */
    // if(event.type === "dragstart") {
    // }
  };

  // Map_object buttons handler
  prtgMaps.prototype.deleteMapObjectButtonHandler = function(event) {
    var $mapObj = $(this).parents(".map_object");
    var self = event.data.self;
    self.DeleteMapObject.call(self, $mapObj);
    event.stopPropagation();
    event.preventDefault();
  };

  prtgMaps.prototype.dropAllConnectionsButtonHandler = function(event) {
    var $mapObj = $(this).parents(".map_object");
    var subid = $mapObj.attr("subid");
    var self = event.data.self;

    self.$el.find('line[tosubid="' + subid + '"]').remove();
    self.$el.find('line[fromsubid="' + subid + '"]').remove();

    self.SaveMapObject(subid, {
      "delallconnections": 1
    });
    event.stopPropagation();
  };

  prtgMaps.prototype.moveUpDownButtonHandler = function(event) {
    var $mapObj = $(this).parents(".map_object");
    var subid = $mapObj.attr("subid");
    var self = event.data.self;
    var zindex = parseInt($mapObj.css("z-index"), 10);

    if ($(this).hasClass("movedown")) zindex = zindex - 1;
    else if ($(this).hasClass("moveup")) zindex = zindex + 1;

    if (zindex > -1) {
      self.SaveMapObject(subid, {
        "zindex": zindex
      });
      $mapObj.css("z-index", zindex);
      self.updatePropbSheetOnMove($mapObj);
    }
    event.stopPropagation();
  };

  prtgMaps.prototype.dragSizerHandler = function(event, ui) {
    var self = event.data.self;
    var subid = $(this).attr("subid");
    var $elm = self.$el.find("#mapelement_" + self.map.id + "_" + subid);

    $elm.width(parseInt(((ui.offset.left - $elm.offset().left) + 8), 10));
    $elm.height(parseInt(((ui.offset.top - $elm.offset().top) + 8), 10));

    self.updatePropbSheetOnMove($(this));
    self.updateMapObjectPosition($elm);
    self.calcConnectionLines(subid);
  };

  prtgMaps.prototype.dragStartSizerHandler = function(event, ui) {
    var self = event.data.self;
    var subid = $(this).attr("subid");

    self.svg.select("#newconnector_" + subid).style("display", "none");
    self.$el.find('#object_connector_' + subid).hide();
  };

  prtgMaps.prototype.dragStopSizerHandler = function(event, ui) {
    var self = event.data.self;
    var subid = $(this).attr("subid");
    var $elm = self.$el.find("#mapelement_" + self.map.id + "_" + subid);

    self.svg.select("#newconnector_" + subid).data([self.mObjInfo[subid]]).each(self.calcNewConnectorLines).style("display", "inline");
    self.$el.find('#object_connector_' + subid).show();

    $('#map_objectsizer_' + subid).hide();
    $('#object_connector_' + subid).hide();
    self.SaveMapObject(subid, {
      "width": parseInt($elm.width(), 10),
      "height": parseInt($elm.height(), 10)
    }).done(function(response) {
      if ($elm.is('.mapoject_noreload')) {
        $('#map_objectsizer_' + subid).show();
        $('#object_connector_' + subid).show();
        return;
      }
      self.replaceMapObject(response, subid);
    });
  };

  prtgMaps.prototype.snapToGridHandler = function(event, ui) {
    var self = event.data.self;
    var $currentTarget = $(event.currentTarget);
    if ($currentTarget.is(':checked')) {
      self.snapToGrid = true;
      self.$el.find("#mapview").addClass("showsnaptogrid");
      self.$el.find(".map_object, .map_objectsizer").draggable("option", "grid", [10, 10]);
    } else {
      self.snapToGrid = false;
      self.$el.find("#mapview").removeClass("showsnaptogrid");
      self.$el.find(".map_object, .map_objectsizer").draggable("option", "grid", false);
    }
  };

  prtgMaps.prototype.checkHistoryButtons = function checkHistoryButtons() {
      if (this.historyPosition <= 0) {
        this.$historyUndoButton.addClass('disabled button btndisabled');
        this.$historyUndoButton.removeClass('actionbutton');
      } else {
        this.$historyUndoButton.removeClass('disabled button btndisabled');
        this.$historyUndoButton.addClass('actionbutton');
      }

      if (this.historyPosition >= this.historyMax || this.historyPosition >= this.historyCount) {
        this.$historyRedoButton.addClass('disabled button btndisabled');
        this.$historyRedoButton.removeClass('actionbutton');
      } else {
        this.$historyRedoButton.removeClass('disabled button btndisabled');
        this.$historyRedoButton.addClass('actionbutton');
      }
  };

  prtgMaps.prototype.historyButtonHandler = function(event) {
    var self = event.data.self;
    var $currentTarget = $(event.currentTarget);
    if ($currentTarget.eq(0).hasClass('disabled')) return;

    if ($currentTarget.eq(0).hasClass('history_undo')) {
      self.loadMapHistory(1);
    } else if ($currentTarget.eq(0).hasClass('history_redo')) {
      self.loadMapHistory(0);
    }
  };

  prtgMaps.prototype.loadMapHistory = function(back) {
    var self = this;
    if (self.historyLoading) {
      return;
    } else {
      self.selectedObjects = [];
      self.hideObjectProperties();
      self.historyLoading = true;
    }

    $('#mapeditor .historyloader').show();

    var data = {
      id: self.map.id,
      type: 'history'
    };

    if (parseInt(back, 10) === 1) {
      data.back = 1;
    } else {
      data.forward = 1;
    }

    this.getMapobjects(data).done(function(response) {
      var historyData = response.split(':');
      self.historyPosition = parseInt(historyData[0], 10);
      self.historyCount = parseInt(historyData[1], 10);
      self.checkHistoryButtons.call(self);

      var connData = {
        type: 'connections',
        id: self.map.id
      };

      self.getMapobjects(connData).done(function(response) {
        self.mObjInfo = {};
        self.connections = response;

        self.getMapSvg().done(function(response) {
          self.$el.find('#mapview').html(response);
          self.initEditorMapobjects();
          $('#mapeditor .historyloader').hide();
          self.historyLoading = false;
        });
      });
    });
  };

  prtgMaps.prototype.InitMapObject = function(elm, replace) { // TODO
    var self = this;
    var $elm = $(elm);
    var subid = $elm.attr("subid");
    var grid = self.snapToGrid ? [10, 10] : false;

    $elm.attr('onclick', '');

    // TODO initialize prtg plugins
    // TODO remove if control trough init functions
    if (self.mode === "edit") {
      // TODO Move to webserver
      //var over = crel('div', {class: 'map_object_overlay', data},)
      var overlay = '<div class="map_object_overlay" data-subid="' + $elm.attr("id") + '"><div class="map_object_buttonbar"><div class="map_objecttools moveup"><a href="#" title="Bring to Front"></a></div><div class="map_objecttools movedown"><a href="#" title="Send to Back"></a></div><div class="map_objecttools delete"><a href="#" title="Delete"></a></div><div class="map_objecttools dropconnectors"><a href="#" title="Drop Connections"></a></div></div><p class="ajaxindicator"></p><div class="selected_indicator"></div></div>';
      $elm.append(overlay);


      $elm.draggable({
        containment: 'parent',
        appendTo: "parent",
        cancel: false,
        scroll: true,
        cursor: "move",
        addClasses: false,
        handle: ".map_object_overlay",
        grid: grid
      });

      $elm.droppable({
        scope: "mapobject",
        tolerance: 'pointer',
        greedy: true,
        hoverClass: "drophoverhighlight",
        addClasses: false
      });

      $('<div title="' + _Prtg.Lang.Maps.strings.dragtocreate + '" id="object_connector_' + subid + '" class="object_connector" subid="' + subid + '"></div>').css({
        'top': $elm.position().top + parseInt(($elm.height() / 2), 10),
        'left': $elm.position().left - 10,
        'z-index': $elm.css("z-index")
      }).appendTo($elm.parent()).draggable({
        scope: "mapobject",
        containment: '#mapview',
        appendTo: "#mapview",
        cancel: false,
        scroll: true,
        cursor: "move",
        addClasses: false,
        revert: true
      });

      // Append resizer - only if object is not an map_icon
      if (!$elm.hasClass("map_icon")) {
        $('<div id="map_objectsizer_' + subid + '" class="map_objectsizer" subid="' + subid + '"><div class="ui-icon ui-icon-arrowthick-2-se-nw"></div></div>').css({
          'top': $elm.position().top + $elm.height() - 8,
          'left': $elm.position().left + $elm.width() - 8,
          'z-index': $elm.css("z-index")
        }).appendTo($elm.parent()).draggable({
          scope: "items",
          containment: '#mapview',
          cancel: false,
          grid: grid,
          addClasses: false
        });
      }

      // New connection lines
      this.svg.append("svg:line").data([self.mObjInfo[subid]]).each(this.calcNewConnectorLines).attr("id", "newconnector_" + subid).style("stroke", "rgb(6,120,155)");

    }
    // TODO Refactor - Muss ausserhalb des editors callable sein, zum anzeigen
    // Create connection lines
    if (!replace) {
      for (var i = self.mObjInfo[subid].connections.length - 1; i >= 0; i--) {
        this.svgDefs.append('svg:linearGradient').data([self.mObjInfo[subid]]).call(this.calcNewGradient, self, subid, i);
        this.svg.append("svg:line").data([self.mObjInfo[subid]]).call(this.calcNewConnection, self, subid, i);
      }
    } else {
      self.updateMapObjectPosition($elm);
      self.calcConnectionLines(subid, true);
      self.svg.select("#newconnector_" + subid).data([self.mObjInfo[subid]]).each(self.calcNewConnectorLines);
    }
    _Prtg.initPlugins($elm);
  };

  // --------------------------------------------------
  //  Helper
  // --------------------------------------------------
  prtgMaps.prototype.updateMapObjectPosition = function($mapObj) {
    var self = this;
    // TODO only read changed values
    var subid = $mapObj.attr("subid");
    if (!this.mObjInfo[subid]) {
      this.mObjInfo[subid] = {
        "connections": self.connections[subid] || []
      };
    }
    this.mObjInfo[subid].top = parseInt($mapObj.position().top, 10);
    this.mObjInfo[subid].left = parseInt($mapObj.position().left, 10);
    this.mObjInfo[subid].width = parseInt($mapObj.width(), 10);
    this.mObjInfo[subid].height = parseInt($mapObj.height(), 10);
  };

  prtgMaps.prototype.calcNewConnection = function(obj, self, subid, i) {
    var from = self.mObjInfo[subid],
      to = self.mObjInfo[self.mObjInfo[subid].connections[i]];
    obj.attr("x1", function(d) {
      return parseInt(from.left + (from.width / 2), 10);
    }).attr("y1", function(d) {
      return parseInt(from.top + (from.height / 2), 10);
    }).attr("x2", function(d) {
      return parseInt(to.left + (to.width / 2), 10);
    }).attr("y2", function(d) {
      return parseInt(to.top + (to.height / 2), 10);
    }).attr("id", "connection_" + subid + "_" + self.mObjInfo[subid].connections[i]).attr("class", "elmfrom" + subid + " elmto" + self.mObjInfo[subid].connections[i] + " connectionline").attr("fromsubid", subid).attr("tosubid", self.mObjInfo[subid].connections[i]).attr("stroke", 'url(#gradient_' + subid + '_' + i + ')').attr("gradient", 'gradient_' + subid + '_' + i);
  };

  prtgMaps.prototype.getGradientColor = function(subid, mid) {
    var color = '#b4cc38';

    var redClasses = ".hasred, .sensr, .map_iconcolor_sensr, .map_iconcolor_hasred, .map_objectstate_sensr, .map_objectstate_hasred";
    redClasses = redClasses + ".haspartialred, .sensq, .map_iconcolor_sensq, .map_iconcolor_haspartialred, .map_objectstate_sensq, .map_objectstate_haspartialred";
    var ackClasses = ".hasack, .senso, .map_iconcolor_senso, .map_iconcolor_hasack, .map_objectstate_senso, .map_objectstate_hasack";

    var yellowClasses = ".hasyellow, .sensy, .map_iconcolor_hasyellow, .map_iconcolor_sensy, .map_objectstate_sensy, .map_objectstate_hasyellow";
    var unusualClasses = ".hasorange, .sensp, .map_iconcolor_hasorange, .map_iconcolor_sensp, .map_objectstate_sensp, .map_objectstate_hasorange";
    var blueClasses = ".hasblue, .sensb, .map_iconcolor_hasblue, .map_iconcolor_sensb, .map_objectstate_sensb, .map_objectstate_hasblue";
    var undefindClasses = ".hasblack, .sensx, .map_iconcolor_hasblack, .map_iconcolor_sensx, .map_objectstate_sensx, .map_objectstate_hasblack";


    var $elm = $('#mapelement_' + mid + '_' + subid);

    if ($elm.is(redClasses) || $elm.find(redClasses).length) color = '#d71920';
    else if ($elm.is(ackClasses) || $elm.find(ackClasses).length) color = '#e77579';
    else if ($elm.is(yellowClasses) || $elm.find(yellowClasses).length) color = '#ffcb05';
    else if ($elm.is(unusualClasses) || $elm.find(unusualClasses).length) color = '#f99d1c';
    else if ($elm.is(blueClasses) || $elm.find(blueClasses).length) color = '#447fc1';
    else if ($elm.is(undefindClasses) || $elm.find(undefindClasses).length) color = '#808282';

    return color;
  };

  prtgMaps.prototype.calcNewGradient = function(obj, self, subid, i) {
    var from = self.mObjInfo[subid];
      to = self.mObjInfo[self.mObjInfo[subid].connections[i]];

    var fromColor = '#b4cc38';
    var toColor = '#b4cc38';

    var redClasses = ".hasred, .sensr, .map_iconcolor_sensr, .map_iconcolor_hasred, .map_objectstate_sensr, .map_objectstate_hasred";
    redClasses = redClasses + ".haspartialred, .sensq, .map_iconcolor_sensq, .map_iconcolor_haspartialred, .map_objectstate_sensq, .map_objectstate_haspartialred";
    var ackClasses = ".hasack, .senso, .map_iconcolor_senso, .map_iconcolor_hasack, .map_objectstate_senso, .map_objectstate_hasack";

    var yellowClasses = ".hasyellow, .sensy, .map_iconcolor_hasyellow, .map_iconcolor_sensy, .map_objectstate_sensy, .map_objectstate_hasyellow";
    var unusualClasses = ".hasorange, .sensp, .map_iconcolor_hasorange, .map_iconcolor_sensp, .map_objectstate_sensp, .map_objectstate_hasorange";
    var blueClasses = ".hasblue, .sensb, .map_iconcolor_hasblue, .map_iconcolor_sensb, .map_objectstate_sensb, .map_objectstate_hasblue";
    var undefindClasses = ".hasblack, .sensx, .map_iconcolor_hasblack, .map_iconcolor_sensx, .map_objectstate_sensx, .map_objectstate_hasblack";


    var $fromDiv = $('#mapelement_' + self.map.id + '_' + subid);
    var $toDiv = $('#mapelement_' + self.map.id + '_' + self.mObjInfo[subid].connections[i]);

    if ($fromDiv.is(redClasses) || $fromDiv.find(redClasses).length) fromColor = '#d71920';
    else if ($fromDiv.is(ackClasses) || $fromDiv.find(ackClasses).length) fromColor = '#e77579';
    else if ($fromDiv.is(yellowClasses) || $fromDiv.find(yellowClasses).length) fromColor = '#ffcb05';
    else if ($fromDiv.is(unusualClasses) || $fromDiv.find(unusualClasses).length) fromColor = '#f99d1c';
    else if ($fromDiv.is(blueClasses) || $fromDiv.find(blueClasses).length) fromColor = '#447fc1';
    else if ($fromDiv.is(undefindClasses) || $fromDiv.find(undefindClasses).length) fromColor = '#808282';

    if ($toDiv.is(redClasses) || $toDiv.find(redClasses).length) toColor = '#d71920';
    else if ($toDiv.is(ackClasses) || $toDiv.find(ackClasses).length) toColor = '#e77579';
    else if ($toDiv.is(yellowClasses) || $toDiv.find(yellowClasses).length) toColor = '#ffcb05';
    else if ($toDiv.is(unusualClasses) || $toDiv.find(unusualClasses).length) toColor = '#f99d1c';
    else if ($toDiv.is(blueClasses) || $toDiv.find(blueClasses).length) toColor = '#447fc1';
    else if ($toDiv.is(undefindClasses) || $toDiv.find(undefindClasses).length) toColor = '#808282';


    obj.attr('gradientUnits', 'userSpaceOnUse').attr("x1", function(d) {
      return parseInt(from.left + (from.width / 2), 10);
    }).attr("y1", function(d) {
      return parseInt(from.top + (from.height / 2), 10);
    }).attr("x2", function(d) {
      return parseInt(to.left + (to.width / 2), 10);
    }).attr("y2", function(d) {
      return parseInt(to.top + (to.height / 2), 10);
    }).attr("id", "gradient_" + subid + '_' + i).attr("class", "gradelmfrom" + subid + ' connection_' + i + " gradelmto" + self.mObjInfo[subid].connections[i] + " connectionlineGradient").call(

    function(gradient) {
      gradient.append('svg:stop').attr('offset', '40%').attr('stop-color', fromColor).attr('class', 'fromgradient_' + subid);
      gradient.append('svg:stop').attr('offset', '60%').attr('stop-color', toColor).attr('class', 'togradient_' + self.mObjInfo[subid].connections[i]);
    });
  };


  prtgMaps.prototype.GetNewIcon = function($elm) {
    var type = $elm.attr("data-type"),
      obj;
    if (type === "icon") {
      obj = $elm.find("img").attr("src").replace("/mapicons", "");
    } else if (type === "data") {
      obj = $(".objectpreviewoverlay", $elm).attr("data-url");
    }
    return obj;
  };

  prtgMaps.prototype.calcGrid = function(position) {
    var top = position.top || 0;
    var left = position.left || 0;
    position.top = top - (top % 10);
    position.left = left - (left % 10);
    return position;
  };

  prtgMaps.prototype.replaceMapObject = function(newHtml, subid) {
    var self = this;
    var $oldElm = this.$el.find('#mapelement_' + this['map'].id + '_' + subid);
    this.$el.find('#object_connector_' + subid).remove();
    this.$el.find('#map_objectsizer_' + subid).remove();
    this.$el.find('#newconnector_' + subid).remove();
    if ($oldElm.is('.reaload_wo_params')) {
      $.get('/controls/mapobjectonly.htm?mode=edit&subid=' + subid + '&id=' + self['map'].id, function(response) {
        $oldElm.replaceWith(response);
        self.InitMapObject(self.$el.find('#mapelement_' + self['map'].id + '_' + subid), true);
        self.selectMapObject(subid);
      });
    } else {
      $oldElm.replaceWith(newHtml);
      this.InitMapObject(this.$el.find('#mapelement_' + this['map'].id + '_' + subid), true);
      this.selectMapObject(subid);
    }
  };

  // TODO: name onMove nicht passend
  prtgMaps.prototype.updatePropbSheetOnMove = function($elm) {
    var self = this;
    var subid = $elm.attr("subid");

    // TODO: check if server response is equal to browser results (width/height)
    self.$el.find("#prob_top").val(self.mObjInfo[subid].top || 0);
    self.$el.find("#prob_left").val(self.mObjInfo[subid].left || 0);
    self.$el.find("#prob_width").val(self.mObjInfo[subid].width || 0);
    self.$el.find("#prob_height").val(self.mObjInfo[subid].height || 0);
    self.$el.find("#prob_zindex").val($elm.css("z-index") || 0);
  };

  prtgMaps.prototype.updatePropbSheet = function($elm) {
    var self = this;
    var subid = $elm.attr("subid");
    var serverData;
    self.updatePropbSheetOnMove($elm);

    var htmlbefore = $("#prob_htmlbefore"),
      htmlafter = $("#prob_htmlafter"),
      externallink = $("#prob_externallink");

    htmlbefore.val("").attr("readonly", "readonly").addClass("ajax-loader-small");
    htmlafter.val("").attr("readonly", "readonly").addClass("ajax-loader-small");
    externallink.val("").attr("readonly", "readonly").addClass("ajax-loader-small");

    $.ajax({
      url: "/api/mapsettings.htm",
      data: {
        id: self.map.id,
        subid: subid,
        type: "objectproperties"
      }
    }).done(function(response) {
      serverData = $.parseJSON(response);
      htmlbefore.val((''+serverData["htmlbefore"]).replace(/&apos;/g, '"')).removeAttr("readonly").removeClass("ajax-loader-small");
      htmlafter.val((''+serverData["htmlafter"]).replace(/&apos;/g, '"')).removeAttr("readonly").removeClass("ajax-loader-small");
      externallink.val(serverData["externallink"]).removeAttr("readonly").removeClass("ajax-loader-small");
    });
  };

  prtgMaps.prototype.CheckObjectBounds = function($elm, $mapview) {
    // TODO: remove mapview parameter (use class var)
    var mapwidth = $mapview.width();
    var mapheight = $mapview.height();

    if ($elm.position().left + $elm.outerWidth() + $mapview.scrollLeft() > (mapwidth)) {
      $elm.css("left", (mapwidth - $elm.outerWidth()) + "px");
    }
    if ($elm.position().top + $elm.outerHeight() + $mapview.scrollTop() > mapheight) {
      $elm.css("top", (mapheight - $elm.outerHeight()) + "px");
    }
    if ($elm.position().top < 0) {
      $elm.css("top", "0px");
    }
    if ($elm.position().left < 0) {
      $elm.css("left", "0px");
    }
    return;
  };

  prtgMaps.prototype.isScrolledIntoViewVertical = function ($view, $elem) {
    var docViewTop = $view.scrollTop();
    var docViewBottom = docViewTop + $view.height();

    var elemTop = $elem.position().top;
    var elemBottom = elemTop + $elem.height();

    //return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom));

    return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom) && (elemBottom <= docViewBottom) && (elemTop >= docViewTop));
  };

  prtgMaps.prototype.isScrolledIntoViewHorizontal = function ($view, $elm) {
    var docViewLeft = $view.scrollLeft();
    var docViewRight = docViewLeft + $view.width();

    var elmLeft = $elm.position().left;
    var elmRight = elmLeft + $elm.width();
    //return ((elmRight >= docViewLeft) && (elmLeft <= docViewRight));
    return ((elmRight >= docViewLeft) && (elmLeft <= docViewRight) && (elmRight <= docViewRight) && (elmLeft >= docViewLeft));
  };

  prtgMaps.prototype.GetNewIcon = function($elm) {
    var type = $elm.attr("data-type"),
      obj;
    if (type === "icon") {
      obj = $elm.find("img").attr("src");
      obj = obj.replace("/mapicons", "");
    } else if (type === "data") {
      obj = $(".objectpreviewoverlay", $elm).attr("data-url");
    }
    return obj;
  };

  prtgMaps.prototype.calcConnectionLines = function(subid, calcGradient) {
    var self = this;

    function updateGradient() {
      var gradient = this.getAttribute('gradient');
      var x1 = this.getAttribute('x1');
      var x2 = this.getAttribute('x2');
      var y1 = this.getAttribute('y1');
      var y2 = this.getAttribute('y2');
      self.svg.selectAll('#' + gradient).attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);
      if (calcGradient) {
        var newColor = self.getGradientColor(subid, self.map.id);
        self.svg.selectAll('.fromgradient_' + subid).attr('stop-color', newColor);
        self.svg.selectAll('.togradient_' + subid).attr('stop-color', newColor);
      }
    }

    var from = this.mObjInfo[subid];
    this.svg.selectAll(".elmfrom" + subid).attr("x1", function(d) {
      return parseInt(from.left + (from.width / 2), 10);
    }).attr("y1", function(d) {
      return parseInt(from.top + (from.height / 2), 10);
    }).each(updateGradient);
    this.svg.selectAll(".elmto" + subid).attr("x2", function(d) {
      return parseInt(from.left + (from.width / 2), 10);
    }).attr("y2", function(d) {
      return parseInt(from.top + (from.height / 2), 10);
    }).each(updateGradient);
  };

  prtgMaps.prototype.calcConnectionLineStart = function(d, i) {
    d3.select(this).attr("x1", function(d) {
      return parseInt(d.left + (d.width / 2), 10);
    }).attr("y1", function(d) {
      return parseInt(d.top + (d.height / 2), 10);
    });
  };

  prtgMaps.prototype.calcNewConnectorLines = function(d, i) {
    d3.select(this).attr("x1", parseInt(d.left + (d.width / 2), 10)).attr("y1", parseInt(d.top + (d.height / 2), 10)).attr("x2", parseInt(d.left, 10)).attr("y2", parseInt(d.top + (d.height / 2), 10));
  };

  prtgMaps.prototype.newMapObjectPosition = function($elm) {
    var self = this;
    var subid = $elm.attr("subid");
    // Update Mapobject data, update connection, show and update new connector lines
    self.updateMapObjectPosition($elm);
    self.calcConnectionLines(subid);
    self.svg.select("#newconnector_" + subid).data([self.mObjInfo[subid]]).each(self.calcNewConnectorLines).style("display", "inline");

    self.$el.find("#map_objectsizer_" + subid).css({
      'top': parseInt($elm.position().top + $elm.height() - 8, 10),
      'left': parseInt($elm.position().left + $elm.width() - 8, 10)
    }).show();

    self.$el.find("#object_connector_" + subid).css({
      'top': parseInt($elm.position().top + $elm.height() / 2, 10),
      'left': parseInt($elm.position().left - 10, 10)
    }).show();
  };


  // --------------------------------------------------
  //  Ajax call functions
  // --------------------------------------------------
  prtgMaps.prototype.addToMap = function(objid, toparg, leftarg, helper, mapobjectarg) {
    var self = this;
    var mapobject = mapobjectarg || "/defaulticons1/A1 pc.png";
    var top = parseInt(toparg, 10);
    var left = parseInt(leftarg, 10);
    return $.ajax({
      url: "/api/addobjecttomap.htm",
      data: {
        "objectid": objid,
        "top": top,
        "left": left,
        "id": this.map.id,
        "width": 200,
        "height": 200,
        "mapobject_": mapobject,
        "noautoposition": 1,
        "result": "html" // retunrs new mapobject as html
      },
      type: "POST"
    }).done(function() {
      self.getHistoryData();
    });

  };

  prtgMaps.prototype.getMapSvg = function() {
    var self = this;
    return $.ajax({
      url: '/api/mapsvg.htm',
      data: {
        id: self.map.id
      },
      dataType: 'html'
    });
  };

  prtgMaps.prototype.getMapobjects = function(data) {
    var dataType = 'html';
    if(data.type === 'connections') dataType = 'JSON';

    return $.ajax({
      url: '/api/mapobjects.htm',
      data: data,
      dataType: dataType
    });
  };

  prtgMaps.prototype.LoadSingleMapObject = function(subid) {
    return $.ajax({
      url: "/controls/mapobjectonly.htm",
      data: {
        "subid": subid,
        "id": this.map.id
      },
      type: "GET",
      dataType: "html"
    });
  };

  prtgMaps.prototype.getHistoryData = function() {
    var self = this;
    $.ajax({
      url: '/api/maphistorydata.htm',
      data: {
        'id': self.map.id
      },
      type: 'GET',
      dataType: 'html'
    }).done(function(response) {
      var historyData = response.split(':');
      self.historyPosition = historyData[0];
      self.historyMax = historyData[1];
      self.historyCount = historyData[2];
      self.checkHistoryButtons();
    });
  };

  prtgMaps.prototype.SaveMapObject = function(subid, options) {
    var self = this;
    var apiargs = options || {};
    apiargs.subid = subid;
    apiargs.id = this.map.id;
    return $.ajax({
      url: "/api/editmapobject.htm",
      data: apiargs,
      type: "POST"
    }).done(function()
{      self.getHistoryData();
    });
  };

  prtgMaps.prototype.DeleteMapObject = function($elm) {
    var self = this;
    var subid = $elm.attr("subid");

    $elm.detach();
    self.DeleteMapObjectCall.call(self, subid).done(function(response) {
      $elm.remove();
      self.svg.selectAll(".elmfrom" + subid).remove();
      self.svg.selectAll(".elmto" + subid).remove();
      self.svg.selectAll("#newconnector_" + subid).remove();
      self.$el.find('#map_objectsizer_' + subid).remove();
      self.$el.find('#object_connector_' + subid).remove();
      $('.tooltip').remove();
      self.getHistoryData();
    }).fail(function() {
      $elm.appendTo(self.$el);
    });
  };

  prtgMaps.prototype.DeleteMapObjectCall = function(subid) {
    var self = this;
    return $.ajax({
      url: "/api/deletesubobject.htm",
      data: {
        id: self.map.id,
        subid: subid
      },
      type: "GET"
    }).done(function() {
      self.getHistoryData();
    });
  };

  prtgMaps.prototype.selectMapObjectLinkDialog = function(event) {
    var self = event.data.self || this;
    if(event) event.preventDefault();
    $("<div />", {
      "html": '<div id="map_selectobjectlink"><ul><li id="map_objectlinkdialog_tab1"><a href="#externallink-tabs-1">' + _Prtg.Lang.Maps.strings.linktoobjectdialogtabobject + '</a></li><li id="map_objectlinkdialog_tab2"><a href="#externallink-tabs-2">' + _Prtg.Lang.Maps.strings.linktoobjectdialogtabmaps + '</a></li></ul><div id="externallink-tabs-1"><div id="objectSelectorTree"></div></div><div id="externallink-tabs-2"><ul id="map_mapslist"></ul></div></div>',
      "id": 'externallinkdialog'
    }).dialog({
    	closeText: "",
      closeOnEscape: false,
      draggable: false,
      resizable: false,
      height: 450,
      modal: true,
      width: 490,
      title: _Prtg.Lang.Maps.strings.linktoobjecttext,
      open: function() {
        $("#objectSelectorTree").jstree({
          "json_data": {
            "ajax": {
              "url": "/api/tree.json"
            },
            "progressive_render": true
          },
          "core": {
            "animation": 0
          },
          "themes": {
            "url": "/css/prtg.tree.css"
          },
          "search": {
            "case_insensitive": true
          },
          "ui": {
            "select_multiple_modifier": false
          },
          "plugins": ["json_data", "ui", "themes", "search"],
          metadata: "metadata"
        });
        $("#map_selectobjectlink").tabs();
        $.ajax({
          url: "api/table.json?content=maps&columns=name,objid",
          type: "GET",
          dataType: "JSON",
          success: function(response) {
            var maplist = "";
            for (var i = 0; i < response.maps.length; i++) {
              maplist += '<li data-objid="' + response.maps[i].objid + '">' + response.maps[i].name + '</li>';
            }
            $("#map_mapslist").append(maplist);
            $("#map_mapslist").find("li").click(function() {
              $("#map_mapslist").find("li").removeClass("maplistselected");
              $(this).addClass("maplistselected");
            });
          }
        });
      },
      close: function() {
        $(this).remove();
      },
      buttons: [{
        "html": _Prtg.Lang.common.strings.ok,
        "class": "actionbutton",
        "click": function(event) {
          // TODO self.$el.find für dialog
          if ($("#externallinkdialog").find("#map_objectlinkdialog_tab1").hasClass("ui-tabs-active")) {
            var li = $("#externallinkdialog").find(".jstree-clicked").parent("li");
            if (li.length === 1) {
              var link = "";
              switch (li.attr("type")) {
              case "probe":
                link = "probenode.htm?id=" + li.attr("objid");
                break;
              case "group":
                link = "group.htm?id=" + li.attr("objid");
                break;
              case "sensor":
                link = "sensor.htm?id=" + li.attr("objid");
                break;
              case "device":
                link = "device.htm?id=" + li.attr("objid");
                break;
              case "probedevice":
                link = "device.htm?id=" + li.attr("objid");
                break;
              }
              $("#prob_externallink").val(link).change();
            }
          } else if ($("#externallinkdialog").find("#map_objectlinkdialog_tab2").hasClass("ui-tabs-active")) {
            $("#prob_externallink").val('map.htm?id=' + $("#externallinkdialog").find(".maplistselected").attr("data-objid")).change();
          }
          self.saveMapObjectPropertiesHandler.call(self);
          $(this).dialog("close").remove();
        }
      }, {
        "html": _Prtg.Lang.common.strings.cancel,
        "class": "button btngrey",
        "click": function(event) {
          $(this).dialog("close").remove();
        }
      }]
    });
    return false;
  };

  _Prtg.Plugins.registerPlugin(pluginName, prtgMaps);

})(jQuery, window, document);
