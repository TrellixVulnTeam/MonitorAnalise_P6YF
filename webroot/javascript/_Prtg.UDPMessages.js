﻿/* _Prtg.UDPMessages.js */
(function PrtgUdpmessagesPlugin($, window, document, undefined) {
  var pluginName = 'prtg-udpmessages';

  function prtgUDPMessages(element, data, parent) {
    this.data = data;
    this.el = (!(element instanceof jQuery)) ? element : element[0];
    this.$el = (!(element instanceof jQuery)) ? $(element) : element;
    this.previewMode = data.preview;

    this.$output = this.$el.find('.udpmessages-output');

    this.requestId = -1;
    this.objid = data.objid;
    this.udptype = data.udptype;
    this.probeConnected = false;
    this.tablecolumns = data.columns.split(',');
    this.responsecode = { ok: 0, done: -100, timeout: 2};

    this.startDate = new Date();
    this.startDate.addDays(-100);
    this.endDate = new Date();

    this.startDatePlugin = null;
    this.endDatePlugin = null;

    this.FilterToggle = _Prtg.Plugins['table-filter-toggle'];

    this.filterText = '';
    this.$filterDialog = this.$el.find('.udpmessages-filter-dialog');
    this.$filterTextarea = this.$filterDialog.find('.udpmessages-advanced-filter');

    this.advancedFilterEnabled = false;

    this.showFilter = true;

    this.pollTimer = null;
    this.running = false;

    this.resultPerRequest = parseInt(50, 10);
    this.page = 0;
    this.xhrRequest = {
      requestid: null,
      gettable: null,
      status: null
    };

    var _this = this;

    _Prtg.Events.subscribe('datetimpicker.initialized', function(e, plugin) {
      if (plugin.$el.hasClass('table_datepicker_dstart')) {
        plugin.setCurrentSelectedDateTime(_this.startDate, true);
        _this.startDatePlugin = plugin;
      } else if (plugin.$el.hasClass('table_datepicker_dend')) {
        plugin.setCurrentSelectedDateTime(_this.endDate, true);
        _this.endDatePlugin = plugin;
      }
    });

    $.getJSON('/api/typesstatus.json?id=' + _this.objid, function(resp) {
      _this.probeConnected = resp.probeconn;
    }).done(function() {
      if (_this.previewMode) {
        _this.initPreview();
      } else {
        _this.init();
      }
    });
  }

  prtgUDPMessages.prototype.initPreview = function() {
    var self = this;
    if (!self.probeConnected) {
      self.$output.html('<p>' + _Prtg.Lang.common.strings.udpmessageprobeconn + '</p>');
      return;
    }
    if(self.udptype == 'flow') {
      self.$output.append('<table cellspacing="0" class="messagetable table hoverable udpmessage" id="table_" style="display: table;"><tbody class="data"></tbody></table>');
    }
    self.startDate.addDays(-100);
    self.resultPerRequest = parseInt(10, 10);
    self.showFilter = false;
    self.getRequestId().done(function(response) {
      self.requestId = response;
      clearTimeout(self.pollTimer);
      if(self.udptype !== 'flow') {
        self.pollTimer = setTimeout($.proxy(self.getTableData, self), 1000);
      } else {
        self.pollTimer = setTimeout($.proxy(self.getFlowData, self), 1000);
      }
    });

    self.$el.on('click.udpmessag', function() {
      _Prtg.Plugins['prtg-tabs'].plugin.activateTab(20, true);
    });
  };

  prtgUDPMessages.prototype.init = function() {
    var self = this;
    if (!self.probeConnected) {
      self.$output.html('<p>' + _Prtg.Lang.common.strings.udpmessageprobeconn + '</p>');
      return;
    }

    self.$output.find('.messagetable').show();
    _Prtg.Events.subscribe('datetimpicker.change', function(e, plugin) {
      self.startDate = self.startDatePlugin.getCurrentSelectedDate();
      self.endDate = self.endDatePlugin.getCurrentSelectedDate();
      self.applyFilterEvent();
    });
    if(self.udptype == 'flow') {
      self.$output.append('<table cellspacing="0" class="messagetable table hoverable udpmessage" id="table_" style="display: table;"><tbody class="data"></tbody></table>');
    }
    self.showFilter = false;
    self.initEvents();
    self.updatePagingView();
    self.applyFilter();

    self.$el.find('tr.filters input').tagsinput({
      autocomplete: false,
      newtagkeycode: [13],
      pastesplitregex: null
    });

    var example = self.$filterDialog.find('table tr').eq(0).find('th').eq(2).text();
    self.$filterDialog.find('table tr:gt(0)').each(function() {
      var $this = $(this);
      var name = $(this).find('td').eq(0).text().split('[')[0];
      var $filter = $('tr.filters td[filtertype="' + name + '"]');
      var $tds = $this.find('td');

      if ($filter.length) {
        $filter.attr('data-original-title', '<div>' + $tds.eq(1).html() + '</div>' +
        '<div><b>' + example + '</b>:<br>' + $tds.eq(2).html().replace(new RegExp(name + '\\[','gi'), '').replace(/(\] ,)|(\])/gi, '<br>')
        );
      }
    });

    $('tr.filters td:last-child').attr('data-placement', 'left');
  };

  prtgUDPMessages.prototype.initEvents = function() {
    var self = this;
    self.$el.on('destroyed', {self: self}, self.destroy);

    this.$el.on('click.udpmessage', '.table_itemcount_selector a', {self: self}, self.resultPerRequestChangeEvent);
    this.$el.on('click.udpmessage', '.table_daterange_selector li', {self: self}, self.dateRangeChangeEvent);
    this.$el.on('click.udpmessage', '.reloadtablelink.arrow', {self: self}, self.pagingEvent);
    this.$el.on('change.udpmessage', 'input.udpmessages-filterfield', function() {
      self.applyFilterEvent();
    });

    this.$el.on('click.udpmessage', '.udpmessages-morefilter, .advancedfilterinputcolumn', {self: self}, self.showFilterDialog);
    this.$el.on('click.udpmessage', '.advancedfilterinputcolumn i', function(event) {
      event.stopPropagation();
      self.advancedFilterEnabled = false;
      self.hideAdvancedFilterBar();
      self.applyFilter();
    });

    this.$el.on('change.udpmessages', 'select.udpmessages-filterfield', {self: self}, self.applyFilterEvent);

    this.FilterToggle.init(this.el);

    this.$el.on('click.udpmessages', 'table tr:not(.filters) td', {self: self}, function() {
      var sel = getSelection().toString();
      if (sel !== '') return;
      var $this = $(this);
      var me = this;
      var index = '';
      var value = '';
      $this.parent('tr').find('td').each(function(i, elm) {
        if (elm === me) {
          index = i;
          value = $(elm).text();
          return false;
        }
      });

      var $filterTd = self.$el.find('tr.filters').find('td').eq(index);
      if ($filterTd.find('.taglist').length > 0) {
        var $td = self.$el.find('tr.filters').find('td').eq(index);
        $td.find('.taglist li span').each(function(i, elm) {
          if ($(elm).text() === value) value = '';
        });

        if (value !== '') $td.find('input').data('Tagsinput').addTag(value);
      } else if ($filterTd.find('select').length > 0) {
        if ($filterTd.find('select').val() !== value) $filterTd.find('select').val(value).trigger('change');
      }
    });
  };

  prtgUDPMessages.prototype.killXhr = function() {
    var self = this;
    for (var request in self.xhrRequest) {
      if (self.xhrRequest.hasOwnProperty(request)) {
        if (self.xhrRequest[request] !== null) {
          self.xhrRequest[request].abort();
        }
      }
    }
  };

  prtgUDPMessages.prototype.start = function() {
    var self = this;
    self.running = true;
    this.getRequestId().done(function(response) {
      self.requestId = response;
      clearTimeout(self.pollTimer);
      if(self.udptype !== 'flow') {
        self.pollTimer = setTimeout($.proxy(self.getTableData, self), 1000);
      } else {
        self.pollTimer = setTimeout($.proxy(self.getFlowData, self), 1000);
      }
    });
  };

  prtgUDPMessages.prototype.applyFilter = function() {
    var self = this;
    self.killXhr();
    self.running = true;
    self.filterText = self.collectFilter();
    if (self.advancedFilterEnabled) {
      if (self.filterText !== '') {
        self.showAdvancedFilterBar();
      } else {
        self.hideAdvancedFilterBar();
        self.advancedFilterEnabled = false;
        self.filterText = self.collectFilter();
      }
    }

    self.$el.find('.loading_indicator').show();
    self.$el.find('.percent_loading').show();
    self.$output.find('table tbody:last').html('');
    this.getRequestId().done(function(response) {
      self.requestId = response;
      clearTimeout(self.pollTimer);
      if(self.udptype !== 'flow') {
        self.pollTimer = setTimeout($.proxy(self.getTableData, self), 1000);
      } else {
        if(self.$el.find('tr.filters').length > 0) {
          self.pollTimer = setTimeout($.proxy(self.getFlowData, self), 1000);
        } else {
          self.pollTimer = setTimeout($.proxy(self.getFlowData, self, true), 1000);
        }

      }
    });
  };

  prtgUDPMessages.prototype.getTableData = function() {
    var self = this;
    self.getStatus().done(function(statusResponse) {
      var status = $.parseJSON(statusResponse);
      if (status.code === self.responsecode.ok ) {
        self.$el.find('.percent_loading').html(status.progress + '%');
        self.getTable().done(function(response) {
          if (self.$output.find('table').length) {
            var $data = $($.parseHTML(response));
            self.$output.find('table tbody:last').append($data.find('tbody > tr'));
          } else {
            self.$output.html(response);
          }

          self.pollTimer = setTimeout($.proxy(self.getTableData, self), 1000);
        });
      } else {
        self.$el.find('.loading_indicator').hide();
        self.$el.find('.percent_loading').hide();
        self.running = false;

        if (status.code === self.responsecode.timeout){
          _Prtg.Dialogs.alert($('<div>'+_Prtg.Lang.Dialogs.strings.timeoutDescription+'</div>'),_Prtg.Lang.Dialogs.strings.timeoutTitle, {});
        }
      }
    });
  };

  prtgUDPMessages.prototype.getFlowData = function(getHeads) {
    var self = this;
    var table = '<form id="form_"><table cellspacing="0" class="messagetable table hoverable udpmessage" id="table_" style="display: table;">';
    self.getStatus().done(function(statusResponse) {
      var status = $.parseJSON(statusResponse);
      if (status.code === self.responsecode.ok) {
        self.$el.find('.percent_loading').html(status.progress + '%');
        $.ajax({
          url: 'api/flowmessagelist.json',
          data: {
            'requestid': self.requestId,
            'header': 'true'
          },
          dataType: 'json'
        }).done(function(response) {
          var table_obj = $('table');
          if(self.previewMode) {
            response.preview = true;
            response.previewconf = {
              columns: 6,
              rows: 10
            };
          } else {
            response.preview = false;
          }
          if(getHeads) {
            table = $.jqote(_Prtg.Core.objects.flowlist.header.template, response);
          }
          table = table + $.jqote(_Prtg.Core.objects.flowlist.data.template, response);
          if(getHeads) {
            self.$output.find('.messagetable tbody.data').append(table);
          } else {
            table = $($.parseHTML(table));
            if(self.previewMode) {
              self.$output.html(table);
            } else {
              self.$output.find('table tbody:last').append(table.find('tbody > tr'));
            }
          }
          if(getHeads) {
            self.$el.find("tr.filters input").tagsinput({
              autocomplete: false,
              "newtagkeycode": [13],
              "pastesplitregex": null
            });
          }

          if(getHeads) _Prtg.initPlugins(self.$el);
          self.pollTimer = setTimeout($.proxy(self.getFlowData, self, false), 1000);
        });
      }
      else {
        self.$el.find('.loading_indicator').hide();
        self.$el.find('.percent_loading').hide();
        self.running = false;

        if (status.code === self.responsecode.timeout){
          _Prtg.Dialogs.alert($('<div>'+_Prtg.Lang.Dialogs.strings.timeoutDescription+'</div>'),_Prtg.Lang.Dialogs.strings.timeoutTitle, {});
        }
      }
    });
  };

  // Event functions

  prtgUDPMessages.prototype.applyFilterEvent = function(event) {
    var self = (event !== undefined && event.data !== undefined ? event.data.self : this);
    self.page = 0;
    self.updatePagingView();
    self.applyFilter();
  };

  prtgUDPMessages.prototype.resultPerRequestChangeEvent = function(event) {
    var self = (event !== undefined && event.data !== undefined ? event.data.self : this);
    var $this = $(this);
    self.$el.find('.table_itemcount_selector .selected').removeClass('selected');
    $this.addClass('selected');
    var reloadData = $.parseJSON($this.attr('data-reload'));
    for (var i = reloadData.length - 1; i >= 0; i--) {
      if (reloadData[i].name === 'count') {
        self.resultPerRequest = parseInt(reloadData[i].value, 10);
        self.$el.find('.table_fromcount').html((self.page) * self.resultPerRequest);
        self.applyFilter();
      }
    }

    self.updatePagingView();
  };

  prtgUDPMessages.prototype.pagingEvent = function(event) {
    var self = (event !== undefined && event.data !== undefined ? event.data.self : this);
    var $this = $(this);
    event.preventDefault();
    if ($this.hasClass('a_right_on')) {
      self.page = self.page + 1;
    } else if ($this.hasClass('a_first_on')) {
      self.page = 0;
    } else if ($this.hasClass('a_left_on')) {
      self.page = self.page - 1;
    }

    self.updatePagingView();
    self.applyFilter();
  };

  prtgUDPMessages.prototype.dateRangeChangeEvent = function(event) {
    var self = (event !== undefined && event.data !== undefined ? event.data.self : this);
    var $this = $(this).find('a');
    var reloadData = $.parseJSON($this.attr('data-reload'));
    for (var i = reloadData.length - 1; i >= 0; i--) {
      if (reloadData[i].name === 'filter_drel') {
        self.startDate = new Date();
        self.startDate.setHours(0, 0, 0, 0);
        self.endDate = new Date();
        self.endDate.setHours(24, 0, 0, 0);
        switch (reloadData[i].value) {
        case 'today':
          break;
        case 'yesterday':
          self.startDate.addDays(-1);
          self.endDate.addDays(-1);
          break;
        case '7days':
          self.startDate.addDays(-7);
          break;
        case '30days':
          self.startDate.addDays(-30);
          break;
        case '6months':
          self.startDate.addMonth(-6);
          break;
        case '12months':
          self.startDate.addMonth(-12);
          break;
        case 'eternity':
          self.startDate.addMonth(-48);
          break;
        default:
          break;
        }
        self.page = 0;
        self.updatePagingView();
        self.startDatePlugin.setCurrentSelectedDateTime(self.startDate, true);
        self.endDatePlugin.setCurrentSelectedDateTime(self.endDate, true);
        self.applyFilter();
      }
    }
  };

  prtgUDPMessages.prototype.showFilterDialog = function(event) {
    var self = (event !== undefined && event.data !== undefined ? event.data.self : this);

    self.$filterTextarea.val(self.filterText);
    var dialog = self.$filterDialog.dialog({
    	closeText: "",
      title: 'Advanced Filter',
      closeOnEscape: true,
      draggable: false,
      resizable: false,
      modal: true,
      width: '710px',
      buttons: [{
        html: _Prtg.Lang.Dialogs.strings.ok, // TODO
        class: 'actionbutton',
        click: function() {
          self.advancedFilterEnabled = true;
          self.applyFilter();
          dialog.dialog('close');
          return false;
        }
      }, {
        html: _Prtg.Lang.Dialogs.strings.cancel,
        class: 'button btngrey',
        click: function() {
          dialog.dialog('close');
          return false;
        }
      }],
      close: function() {
        dialog.dialog('destroy');
      }
    });
  };

  prtgUDPMessages.prototype.showAdvancedFilterBar = function(event) {
    var self = (event !== undefined && event.data !== undefined ? event.data.self : this);
    self.$output.find('tr.filters').hide();
    self.$output.find('.udpfilterheader').hide();
    self.$output.find('.advancedfilterinputcolumn').html(self.filterText + '<i class="icon-dark float-right icon-close icon-hovertored"></i>');
    self.$output.find('.udpadvancedfilterheader').show();
    self.$output.find('.advancedfilterinputrow').show();
  };

  prtgUDPMessages.prototype.hideAdvancedFilterBar = function(event) {
    var self = (event !== undefined && event.data !== undefined ? event.data.self : this);
    if (event !== undefined) event.stopPropagation();
    self.$output.find('tr.filters').show();
    self.$output.find('.udpfilterheader').show();
    self.$output.find('.udpadvancedfilterheader').hide();
    self.$output.find('.advancedfilterinputrow').hide();
  };

  // Helper functions
  prtgUDPMessages.prototype.updatePagingView = function() {
    var self = this;
    if (self.page === 0) {
      self.$el.find('.reloadtablelink.arrow.a_left_on').removeClass('a_left_on').addClass('a_left_off').removeClass('.disabled');
      self.$el.find('.reloadtablelink.arrow.a_first_on').removeClass('a_first_on').addClass('a_first_off').removeClass('.disabled');
    } else if (self.page > 0) {
      self.$el.find('.reloadtablelink.arrow.a_left_off').removeClass('a_left_off').addClass('a_left_on').addClass('.disabled');
      self.$el.find('.reloadtablelink.arrow.a_first_off').removeClass('a_first_off').addClass('a_first_on').addClass('.disabled');
    }

    self.$el.find('.table_fromcount').html(self.page * self.resultPerRequest);
    self.$el.find('.table_tocount').html((self.page * self.resultPerRequest) + self.resultPerRequest);
  };

  prtgUDPMessages.prototype.collectFilter = function() {
    var self = this;
    var filter = '';
    var filterCount = 0;
    var filterVal;
    var filterBlock;

    if (self.advancedFilterEnabled) return self.$filterTextarea.val().trim();

    self.$el.find('.udpmessages-filterfield').each(function(index, elm) {
      var $this = $(this);
			if(($this.val() === '-1') || ($this.val().trim() === '')) return;
      if (index > 0 && filterCount > 0) filter = filter + ' AND ';
      filterVal = $.trim($this.val()).split(' ');
      filterBlock = '';
      for (var i = 0; i < filterVal.length; i++) {
        if (filterVal[i] === ' ') continue;
        if (i > 0) filterBlock = filterBlock + ' OR ';
        filterBlock = filterBlock + elm.getAttribute('filtername') + '[' + filterVal[i] + ']';
      }

      if (filterBlock !== '') filter = filter + ' (' + filterBlock + ') ';
      filterCount = filterCount + 1;
    });

    return filter;
  };

  // API Call functions

  prtgUDPMessages.prototype.getStatus = function() {
    var self = this;
    self.xhrRequest.status = $.ajax({
      url: 'api/udpmessageliststatus.json',
      data: {
        type: self.udptype,
        requestid: self.requestId
      }
    });
    return self.xhrRequest.status;
  };

  prtgUDPMessages.prototype.getRequestId = function() {
    var self = this;
    self.xhrRequest.requestid = $.ajax({
      url: 'api/requestudpmessagelist.htm',
      data: {
        type: self.udptype,
        id: self.objid,
        sdate: self.startDate.toPrtgString(),
        edate: self.endDate.toPrtgString(),
        filter: self.filterText,
        count: self.resultPerRequest,
        start: self.page * self.resultPerRequest
      }
    });
    return self.xhrRequest.requestid;
  };

  prtgUDPMessages.prototype.getTable = function() {
    var self = this;
    self.xhrRequest.gettable = $.ajax({
      url: 'api/table.json',
      data: {
        output: 'html',
        udptype: self.udptype,
        udpmsgid: self.requestId,
        content: 'udpmessage',
        infoheader:'true',
        columns: self.tablecolumns.join(','),
        count: self.resultPerRequest,
        start: '0',
        showfilter: self.showFilter,
        hideemptycol: 'true'
      }
    });
    return self.xhrRequest.gettable;
  };

  prtgUDPMessages.prototype.destroy = function(event) {
    var self = event.data.self;
    clearTimeout(self.pollTimer);
    self.killXhr();
    $(window).off('.udpmessages');
    $(document).off('.udpmessages');
    self.$el.off('.udpmessages');

    _Prtg.Events.unsubscribe('datetimpicker.change');
    _Prtg.Events.unsubscribe('datetimpicker.initialized');
  };
  _Prtg.Plugins.registerPlugin(pluginName, prtgUDPMessages);
})(jQuery, window, document);
