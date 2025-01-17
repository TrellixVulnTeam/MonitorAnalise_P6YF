﻿/* _Prtg.Forms.js */
(function ($, window, document, undefined) {
    var pluginName = "prtg-form";

    function prtgForm(element, data, parent) {
        this.data = data;
        this.el = (!(element instanceof jQuery)) ? element : element[0];
        this.$el = (!(element instanceof jQuery)) ? $(element) : element;
        this.namespace = _Prtg.Util.uniqueId('prtgform');
        this.needsserverrestart = false;
        this.dorestart = false;
        this.floatButtonProperties = {};
        this.dataTables = [];
        this.init();
    }

  prtgForm.prototype.init = function() {
    var self = this;
    this.$el.find('fieldset').wrapInner("<div></div>");
      this.moveHelptext(this.$el);
      this.$el.attr('autocomplete',"off");

    //remove anoying title tip and bind fieldset toggler
    this.$el.removeAttr('title').find('input[type="checkbox"]').not('.data-table').prtgFieldsetToggler();

        // TODO this is only a "fast fix" move output to webserver!!!!
        this.$el.find("textarea.fieldrequired, select.fieldrequired").each(function () {
            var $this = $(this);
            var $icon = $this.next(".required-icon").detach();
            $icon.addClass("textarea-required");
            $this.before($icon);
            $this.addClass("textarea-fieldrequired");
            $this.wrap('<span class="inputfield" />');
        });

        var theme = this.$el.find('#theme2');
        if(theme.length) {
	        var label = this.$el.find('[for="theme2"]');
	        if (!theme.is(':checked')) {
	            var option = theme.clone().add(label.clone());
	            theme.remove();
	            label.siblings().first().addClass('js-insertAnchorelem');
	            label.remove();
	        }
	        this.$el.find('[for^="theme"]').contextmenu(function (e) {
	            e.stopPropagation();
	            if (self.$el.find('#theme2').length == 0) {
	                $('.js-insertAnchorelem').first().before(option.hide());
	                option.fadeIn("slow");
	            }
	        });
        }
        this.$el.find('button[prop]').on('click', function () {
            $(this).replaceWith('<input id="mypasshash" type="text" readonly="readonly" value="' + $(this).attr('prop') + '"></div>');
        });
        this.$el.find('button#newpasshash').on('click', function (event) {
            var userID = $('#objectdataform input[name=id]').val() || location.search.split('id=')[1].split('&')[0], $newpasshashBtn = $(this);

            event.preventDefault();
            $.ajax({
                url: 'api/newpasshash.htm?id=' + userID,
                type: "POST",
                dataType: "html",
                success: function (res) {
                    var msg = _Prtg.Lang.common.strings.newpasshashfail;

                    if (!isNaN(res)) {
                        if ($('#mypasshash').length) {
                            $('#mypasshash').val(res);
                            $('#mypasshash').stop().css("background-color", "#ffffcc").animate({backgroundColor: "#f3f2f2"}, 500, 'easeInCubic');
                        } else {
                            $('#objectdataform button[prop]').click();
                            $('#mypasshash').val(res);
                        }
                        msg = _Prtg.Lang.common.strings.newpasshashsuccess;
                    }

                    $newpasshashBtn.replaceWith('<input disabled="disabled" id="newpasshash" type="text" readonly="readonly" value="' + msg + '"></div>');
                }
            });
        });
        // bind the farbtastic color picker
        this.$el.find('.colorselector').each(function () {
            var $this = $(this)
                , picker = $this.parent().append('<div />').children().last();
            $this.on('change.' + self.namespace, function () {
                picker.setColor($(this).val());
            });

            picker = $.farbtastic(picker, function (color) {
                var invertColor = function invertColor(hexColor) {
                    var hexValue = hexColor.slice(1), //remove '#'
                        colorAsInt = parseInt(hexValue, 16),
                        invertedColorAsInt = 0xFFFFFF ^ colorAsInt,
                        newHexColor = "#" + invertedColorAsInt.toString(16);
                    return newHexColor;
                };
                $this.css("background-color", color);
                $this.css("color", invertColor(color));
                $this.val(color).trigger("change");
            });

            if ($this.val().length === 0) {
                $this.val('#000000').trigger('change');
            }

        });

        // Favstars plugin binding
        this.$el.find('#priority_,#priority,input[name="priority_"]').favstarsinput();

        this.$el.find('#tags_,input[name="tags_"],#tagfilter_,#filtertag_,#libtagfilter_').tagsinput({
            "tags": self.getUserTags
        });

        this.$el.find('input[name="parenttags_"]').tagsinput({
            "readonly": true,
            "autocomplete": false
        });

        // Datatables
        var dt = this.$el.find('table.datatables, table.hoverable').not('.prevent-datatables');
        dt.each(function initDataTable() {
            var rows = $(this).find('tbody tr').length;
            var $me = $(this);
            var $parent = $me.parent();
            var shouldCollapseHeaders = $me.hasClass('snmptable_');
            var caption = ($me.parent(".controls").data() && $me.parent(".controls").data()['caption'] ? $me.parent(".controls").data()['caption'] : '');
            var options = $.extend(true, self.getDataTableOptions(self,caption, shouldCollapseHeaders, rows), $me.data().options || {});
            if(rows < 1 || $parent.hasClass('readonlyproperty')) return;

            $('.step-3 .add-sensor-box').css('max-width', '100vw');
                

            $me.find('thead th').each(function checkSort(i, elem) {
                if ($(elem).is('.no_sort') || rows > _Prtg.Core.objects.dataTableBigMode) {
                    options.aoColumns.push({"bSortable": false});
                } else options.aoColumns.push(null);

                if (shouldCollapseHeaders && i > 0) {
                    var text = $(elem).text();
                    var cut = text.split(".");

                    $(elem).attr('title', text);

                    if (cut.length > 1){
                    	$(elem).html('..' + cut[cut.length - 2] + '.' + cut[cut.length - 1]);
                  	}
                }
            });
            $me.on("change", "checkbox", function() {
            	$(this).toggleClass("icon-check");
            })
            if(!$me.is(':visible')) {  //initializing the dataTable before it's visible will reduce it to 40px width
                var interval = setInterval(function waitforVisible() {
                    if($me.is(':visible')) {
                        clearInterval(interval);
                		$me.dataTable().resize();
                    }
                }, 500);
            }
            self.dataTables.push($me.dataTable(options));
            self.manipulateDataTable(self, $me, options, caption);
            $me.removeClass('loading-box');
        });

        if (!this.$el.hasClass('assistent')) {
            this.$el.parents('.ui-dialog').find('.ui-dialog-buttonpane .actionbutton').addClass("button btngrey submit").removeClass("actionbutton ");
        }

        this.initEvents();

        this.$el.find(".fieldrequired").addClass("required");

        this.$el.find("input[editable]").each(function () {
            var $me = $(this);
            $me
                .parent()
                .append('<i class="locked icon-locked">')
                .attr('title', _Prtg.Lang.common.strings.editrequest)
                .attr('data-original-title', _Prtg.Lang.common.strings.editrequest)
                .find('i')
                .on('click.' + self.namespace, function () {
                    var that = $(this);
                    if (that.hasClass('icon-locked')) {
                        if (confirm(_Prtg.Lang.common.strings.editrequest)) {
                            $me.removeAttr('disabled readonly').focus();
                            that.removeClass('icon-locked').addClass('icon-unlocked');
                        }
                    }
                });
        });

        // Focus first input on form
        if (!!!this.data.inline) {
            this.$el.find("input:visible:not(.ui-autocomplete-input), textarea:visible").eq(0).focus();
        }
        _Prtg.Events.publish("forminitialized.prtg");
    };

    prtgForm.prototype.manipulateDataTable = function manipulateDataTable(self, $me, options, caption, rows) {
    	var currentTable = self.dataTables[self.dataTables.length - 1];
        $me.closest('fieldset,.groupshowhideelement').one('groupshow.' + self.namespace, function (e) {
            var meHeight = $me.height() - 15;
            options.scrollY = meHeight < 1024 ? meHeight + 'px' : "1024px";
            currentTable.fnAdjustColumnSizing();
        });
        $me.parents('.dataTables_wrapper').find('.dataTables_filter').prepend(caption);

        if ($me.find('input[type="checkbox"]').length) {

        	$me.closest('.control-group').find('.datatablecontrols')
        		.on('click.' + self.namespace, 'a.button', function(event) {
                    event.preventDefault();
        			var type  = "tr";
        			var check = false;
        			if($(event.target).hasClass('table-select-all-connected')){
        				type = '.connected';
                        check = true;
        			} else if ($(event.target).hasClass('table-select-all-not-connected')){
        				type = '.notconnected';
        				check = true;
                    }
                    currentTable.api().rows().nodes().to$().filter(type).find('input').prop("checked", check).trigger("change");
        	});

            $me.on('click.' + self.namespace, 'tr', function (event) {
                var $this = $(this);
                var $checkbox = $this.find("input.checkbox:first");

                if ($(event.target).is('th')) return;
                $checkbox.prop("checked", !$checkbox.is(':checked')).trigger("change");
                $me
                    .parent()
                    .prev()
                    .find('tr th:first-child input:checkbox')
                    .prop('checked', ($me.find('tbody tr td:first-child input').not(":checked").length === 0));

            });

           // $me.find("tbody").selectable(self.getDataTableSelectableOptions());

        }
        if ($me.find("tbody tr td:first-child input").not(":checked").length === 0)
        	$me.parent().prev().find('tr th:first-child input:checkbox').prop('checked', true);
    };

    prtgForm.prototype.getDataTableSelectableOptions = function () {
        return {
            create: function (event, ui) {
                $(this).find('td input[type="checkbox"]:checked').each(function (i, elm) {
                    $(elm).parents('tr').addClass('ui-selected');
                });
            },
            start: function () {
                $(this).parents('.dataTables_wrapper').find(".checkboxtoggler").prop("checked", false).trigger("change");
            },
            selecting: function (event, ui) {
                $(ui.selecting).find("input.checkbox:first").prop("checked", true).triggerHandler("change");
            },
            unselecting: function (event, ui) {
                $(ui.unselecting).find("input.checkbox:first").prop("checked", false).triggerHandler("change");
            },
            selected: function (e, ui) {
                $(ui.selected).find("input.checkbox:first").prop("checked", true).trigger("change");
                if ($(this).find("tbody tr td:first-child input").not(":checked").length === 0)
                	$(this).parent().prev().find('tr th:first-child input:checkbox').prop('checked', true);
            },
            filter: "tr",
            distance: 15,
            cancel: "a, input, option, .notselectable, select"
        };
    };

    prtgForm.prototype.getDataTableOptions = function (self,caption,shouldCollapseHeaders, rows) {
        return {
            "paginate": rows > _Prtg.Core.objects.dataTableBigMode,
            "pagingType": "full_numbers",
            "pageLength": 20,
            "lengthChange": false,
            "autoWidth": true,
            "filter": true,
            "sort": rows < _Prtg.Core.objects.dataTableBigMode,
            "order": [],
            "info": false,
            "scrollY": "1024px",
            "scrollX": true,
            "scrollCollapse": true,
            "aoColumns": [],
            "language": {
           		"paginate": {
           			"first": "",
            		"previous": "",
            		"next": "",
            		"last": ""
            	}
            },
            "fnInitComplete": function () {
                var $me = $(this);
                var $parent = $me.parents('.dataTables_wrapper');
                var $filter = $parent.find(".dataTables_filter");
                var input = $filter.find('label').children('input').addClass('ignore-on-validation');
                if (rows > 5) {
                    input.attr("placeholder", _Prtg.Lang.common.strings.search).detach();
                    $filter.find('label').text('').append('<i class="icon-gray icon-search"></i>').append(input).find('i').on('click.' + self.namespace, function () {
                        $(this).next().val('').trigger((new $.Event('keyup')));
                    });
                } else if (!!caption) {
                    $filter.children().hide();
                } else {
                    $filter.hide();
                }
                $('input:radio[checked="checked"]', this).prop('checked', true);
                $parent.find('.dataTables_scrollHeadInner').css('width', '');

                if (shouldCollapseHeaders) {
                    $('#main.add-sensor-main-container.step-3 .add-sensor-box').css('max-width', 'none')
                }
            },
            'fnDrawCallback': function(){
                var scrollBody = $(this).parents('.dataTables_wrapper').find('.dataTables_scrollBody');
                scrollBody.css('width', scrollBody.outerWidth());//setting a fixed with to prevent width:100%
                // scrollBody.css('height', scrollBody.height() + 11);//height of scroll bar
            }
        }
    };

    prtgForm.prototype.moveHelptext = function($form) {
        var helptexts = $form.find('[data-helptext]');
        helptexts.each(function(i, elem){
            var infoIcon = $('<span class="input-info glyph-info-circled" tabindex="-1"></span>');
            var targetInput =  $(elem).find('input, select, textarea').not('[type=hidden]').first();
            var targetLabel = $form.find('label[for='+targetInput.attr('name')+']');

            //neded since forms have very differing structures
            if(targetLabel.length == 0 &&
                targetInput.attr('type')!='radio' &&
                targetInput.attr('type')!='checkbox') {

                targetLabel = $form.find('label[for='+targetInput.attr('id')+']');
            }

            if(targetLabel.length == 0 &&
                ($(elem).prev().is('label') || $(elem).prev().hasClass('control-label'))
                ){
                targetLabel = $(elem).prev();
            }

            infoIcon.popover({
                "animation": false,
                "trigger": 'hover focus',
                "container": 'body',
                "placement": "top",
                "title": _Prtg.Lang.common.strings['help'],
                "content": $(elem).data('helptext'),
                "delay": { show: 400, hide: 400 },
                "html": true
            });
            if(targetLabel.length > 0) {
                targetLabel.append(infoIcon);
                $(elem).removeAttr('data-helptext');
            }
        });
    };

    prtgForm.prototype.initEvents = function () {
        var self = this;
        var highlight_ = $.validator.defaults.highlight;
        var unhighlight_ = $.validator.defaults.unhighlight;

        if (self.$el.hasClass('clusterselector')) {
            this.$el.on('change.' + self.namespace, 'input[name="clgid"]', function (e) {
                var url = $(".tab-active").find('a').attr('href');
                if (url) {
                    $(".tab-active").find('a').attr('href', url.split('?')[0] + '?' + self.$el.serialize());
                    _Prtg.Plugins['prtg-tabs']['plugin'].activateTab($(".tab-active").attr("tabid"));
                    $(".tab-active").find('a').attr('href', url);
                } else {
                    url = _Prtg.Util.getUrlParameters(window.location.href);
                    url.clgid = $(this).val();
                    window.location.href = window.location.href.split('?')[0] + '?' + Object.keys(url).map(function (e) {
                            return e + '=' + encodeURIComponent(url[e]);
                        }).join('&');
                }
            });
            return;
        }

        self.$el.on('destroyed.' + self.namespace, {"self": self}, self.destroy);

        // if textarea set the cursor at end of text
        this.$el.find("textarea").on('focus.' + self.namespace, function () {
            var val = this.value;
            this.value = "";
            this.value = val;
        });

        this.$el.off('click.' + self.namespace + ' change.' + self.namespace, ".GroupShowHide", this.groupShowHideHandler);
        this.$el.on('click.' + self.namespace + ' change.' + self.namespace, ".GroupShowHide", {
            self: this
        }, this.groupShowHideHandler);

        var scrollTimer = null;

        // NOTE: Fix for PRTG-961 Adding SNMP Traffic monitor fails because of unmet dependencies
        // We need a form ID because the same checkbox classes connectedAll/notconnectedAll are used in Core&Probes settings form
        if (self.$el.attr('id') === 'addobjectdialogform') {
            self.$el.find('input.notconnectedAll[data-rule-required="true"]').addClass('validateme');
            self.$el.find('input.connectedAll[data-rule-required="true"]').addClass('validateme');
        }

        self.$el.validate({
            errorClass: "validateerror",
            errorElement: "div",
            ignore: '.ignore-on-validation, fieldset.collapsed *, :hidden:not(.validateme), .datatables:hidden tbody .checkboxholder [type="checkbox"]:hidden',
            errorPlacement: function (label, $element) {
                // NOTE: Prevent multiple validate error for AutoDiscovery with Template
                if ($('#devicetemplate__check-error').length > 0) {
                    return;
                }
                if ($element.hasClass("checkbox")) {
                    $element.parents('.dataTables_wrapper').append(label);
                } else {
                    $element.parent().append(label);
                }
            },
            focusInvalid: true,
            highlight: function (element, errorClass, validClass) {
                highlight_(element, errorClass, validClass);
                if (!!$(element).data('validateRelated'))
                    highlight_($($(element).data('validateRelated')), 'validateerror2', validClass);
            },
            unhighlight: function (element, errorClass, validClass) {
                unhighlight_(element, errorClass, validClass);
                if (!!$(element).data('validateRelated'))
                    unhighlight_($($(element).data('validateRelated')), 'validateerror2', validClass);
            }
        });

        this.$el.on('change.' + self.namespace + ' keyup.' + self.namespace, '[needsserverrestart="true"], [needsserverrestart="true"]>*', function (e) {
            self.needsserverrestart = true;
        });

        this.$el.on('change.' + self.namespace + ' keyup.' + self.namespace + ' formchange.' + self.namespace, function (e) {
        	var $elm = $(e.target)

            if ($elm.hasClass('initilizing') || $elm.hasClass('ignore-on-validation')) return false; // Wenn ein plugin noch initilisiert wird den event nicht annehmen
            self.highLightSave();

            self.$el.valid();
            self.$el.addClass("formchanged");
        });

        // If Historic Data Form...
        if (this.data.historyform) {
            this.$el.on('click.' + self.namespace, '.submit', {
                self: this
            }, this.runhistoryform);
        }

        this.$el.find('input[name="name_"]').each(function () {
            self.$name_ = $(this);
            self.$name_.data().oldValue = self.$name_.val();
        });
        this.$el.on('submit.' + self.namespace, {'self': self}, self.submitFormHandler);

        this.$el.on('click.' + self.namespace, '.checkboxtoggler', function (e) {
            var $this = $(this);
            var $table = $this.closest(".dataTables_wrapper").find('table.datatables');
            var check = $this.is(':checked');

          	$('input.checkbox', $table.dataTable().api().rows( { filter: 'applied'} ).nodes()).prop("checked", check).triggerHandler('change');
        });

        setTimeout(function () {
            self.$el.valid();
        }, 1);
    };

    prtgForm.prototype.highLightSave = function () {
        this.$el.find(".submit").addClass("actionbutton").removeClass("btngrey button");
        this.$el.parents('.ui-dialog').find('.ui-dialog-buttonpane .submit').addClass("actionbutton").removeClass("btngrey button");
    };

    // Tags könnten auch als PRTG platzhalter eingebunden werden,
    // dann cachen die Browser das aber und neue tags sind erst nach
    // cache leeren/cache free realod mit im autocomplete des tags controls
    prtgForm.prototype.getUserTags = function ($elm) {
        $.getJSON("api/usertags.json", function (data, status, xhr) {
            $elm.autocomplete({
                source: data['tags']
            });
        });
    };

    prtgForm.prototype.submitFormHandler = function (event, donotsend) {
        var self = event.data.self;
        var pageLength = [];
        var search = []
        // Only if form is valid.
        if (!self.$el.valid()) {
            event.preventDefault();
            return;
        }

        if (donotsend != undefined) {
            event.preventDefault();
            return;
        }

        if (self.needsserverrestart) {
            event.preventDefault();
            _Prtg.Dialogs.serverRestartNeededDialog().done(function () {
                self.needsserverrestart = false;
                self.dorestart = true;
                self.submitForm.call(self, event); 
            });
        } else {
            self.submitForm(event);    
        }
    };

  prtgForm.prototype.submitForm = function(event) {
    var $submitButton = $(event.target).find('button[type=submit]').first()
    $submitButton.addClass('button-disabled')
    var $quickButton = $submitButton.parent().find('button[type=submit].quick-action-badge')
    $quickButton.addClass('button-disabled')

    var reenable = function(){
        $submitButton.removeClass('button-disabled')
        $quickButton.removeClass('button-disabled')
    }
    
    if($(event.target).data('reenable')){
        $(event.target).find('button,a,input').click(reenable)
    }
    
    var self = event.data.self;
    var formAction = self.$el.attr('action');
    var loadingDialog = null;

    if (self.$el.is("#reportrunnerform")) {
        if ($("#report_html").prop("checked") === true) {
            $("#reportrunnerform").attr("target", "prtg_" + Math.floor(Math.random() * 10000000));
            if(loadingDialog) loadingDialog.dialog('destroy').remove(); // Remove loading dialog.
        } else {
            $("#reportrunnerform").attr("target", "");
        }
    }
    if ($('#mainstuff').hasClass('wingui')) return;

    if (self.data['ajaxsubmit'] !== undefined && self.data['ajaxsubmit'] ) {
        event.preventDefault();
        loadingDialog = _Prtg.Dialogs.loader(_Prtg.Lang.Dialogs.strings.multieditdialogtitle);
        
        var formData = new FormData(self.$el[0])
       
        for(var tableI = 0; tableI < this.dataTables.length; tableI++) {
            var datarr = this.dataTables[tableI].$('input, select').serializeArray()
            for(var i = 0; i < datarr.length; i++) {
                if(!formData.has(datarr[i].name)) {
                    formData.append(datarr[i].name, datarr[i].value)
                }
            }
        }
            
        $.ajax({
            url: formAction,
            data: formData,
            type: "POST",
            processData: false,
            contentType: false,
            beforeSend: function(jqXHR) {
                jqXHR.gotoAfterError = false;
                jqXHR.peNumber = "03456";
            },
        }).done(function(resp) {
            if(self.dorestart) {
              if(window.winGUI) {
                alert("restartserver"); //Spezial for Wingui - do not change
              } else {
                _Prtg.objectTools.restartServer();
              }
            } else if(self.data.hasOwnProperty('redirect') && self.data['redirect'] === false) {
              _Prtg.Events.publish('refresh.events.prtg',[true]);
              if (( !! self.$name_ && self.$name_.val() !== self.$name_.data().oldValue && /editsettings/.test(formAction) === true)  || /deleteobject|addgroup2|adddevice2|addmap2|duplicateobject|moveobjectnow|deletesub/.test(formAction) === true) {
                $('#main_menu').parent().load('/controls/menu.htm');
              }
            } else {
              if(self.$el.hasClass('dialogform')) {
                self.$el.parents('.ui-dialog').find('.ui-dialog-buttonpane .submit').addClass("btngrey button").removeClass(" actionbutton");
              } else {
                if(formAction === 'addsensor5.htm') {
                	var urlVars = _Prtg.Util.getUrlVars();
                	
				          self.Poll(
											"/api/getaddsensorprogress.htm?id={id}&tmpid={tmpid}&step=3&targeturl=/device.htm?id={id}".printf(urlVars),
											"/device.htm?id={id}".printf(urlVars)
				            ).done(function(response){
			          			// response.dialog.dialog("destroy").remove();
					            if(window.winGUI)
					              window.location.href = 'wingui.htm?action=' + encodeURIComponent(resposne.targeturl);
					            else
	                 	 		location.href = response.targeturl;
				            }).fail(function(response){
				            	var url = response.targeturl
				            	var title = _Prtg.Lang.addSensor.strings.addsensorfailed;
				            	response.dialog.dialog("destroy").remove();
				            	_Prtg.Dialogs.alert($("<div>"+response.error+"</div>"),title).always(function(){
				            		if(url !== "/device.htm?id={id}".printf(urlVars)) location.href = url;
				            	});
				            });
                } else {
                  if(formData.get('targeturl')) {
                    location.href = formData.get('targeturl');
                  } else {
                    var objid;
                    try {
                        objid = JSON.parse(resp);
                    } catch(e) {
                        objid = undefined
                    }
                    if(objid != undefined && objid.objid != undefined && self.data['targeturl'] != undefined) {
                        location.href = self.data['targeturl'].replace("%objid%", objid.objid)                        
                    } else {
                        location.href = location.href.replace(/&tabid=[a-zA-Z0-9]+/,'').replace(/tabid=[a-zA-Z0-9]+&/, '').replace(/\?tabid=[a-zA-Z0-9]+$/, '');
                    }
                  }
                  loadingDialog.dialog('destroy').remove();
                }
              }
            }
        }).always(function() {
	          if(!!loadingDialog && loadingDialog.hasClass('ui-dialog-content')) {
	            loadingDialog.dialog('destroy').remove();
	        }
	        self.$el.removeClass('formchanged');
            reenable()
        });
    }
  };

  prtgForm.prototype.Poll = function Poll(url, target){
    _Prtg.Tip.killPopups();
    var response = {progress:0, targeturl: target, dialog: null};
    var dfd = $.Deferred();
    var progress = {};
    response.dialog = $(
         '<div>'
          + '<p>' + _Prtg.Lang.addSensor.strings.addingSensor + '</p>'
          + '<div id="newprogressbar"></div></center>'
          + '<div id="progressinfo"></div>'
          + '</div>'
      ).dialog({
        modal: true,
        resizable: false,
        draggable: false,
        position: 'center',
        maxHeight: parseInt($(window).height() * 0.95, 10),
        maxWidth:  parseInt($(window).width() * 0.95, 10),
        width: 400,
        height: 200,
        zIndex: 8999,
        title: $("<div/>").html(_Prtg.Lang.Dialogs.strings.working).text(),
        buttons: [{
          'html': _Prtg.Lang.Dialogs.strings.continue,
          'class': "button btngrey",
          'click': function() {
            clearInterval(progress.interval);
            dfd.resolve(response);
          }
        }]
    });
		progress.bar = response.dialog.find('#newprogressbar');
		progress.info = response.dialog.find('#progressinfo');

	 	progress.interval = function() {
			$.ajax({
			  global: false,
			  dataType: "json",
        beforeSend: function(jqXHR){
          jqXHR.ignoreManager = true;
        },
			  url: url
			}).done(function(json) {
			  $.extend(true, response, json);
			  !!response.info && progress.info.text(response.info);
			    progress.bar.progressbar({
			      value: Math.max(0,Math.min(response.progress, 100))
			    });
			  if(response.progress < 0){
			    clearInterval(progress.interval);
			    dfd.reject(response, response.error);
			    return;
			  }else if(response.progress >= 100){
			    clearInterval(progress.interval);
			    dfd.resolve(response);
			    return;
			  }
				setTimeout(progress.interval, 300);
			}).fail(function(){
				setTimeout(progress.interval, 300);
			});
		};

		setTimeout(progress.interval, 300);

	  progress.bar.progressbar({
	    value: response.progress
	  });
	  return dfd.promise(progress);
	};

  prtgForm.prototype.initUpdateFloatingButtons = function() {
    var $submitbox = this.$el.find(".submitbuttonbox");
    var $anchor = $submitbox.closest(".submitbuttonboxanchor");
    var $scrollContainer = $anchor.scrollParent().not("html").add(window).slice(0,1);
    var submitBoxHeight = $submitbox.outerHeight();

    this.floatButtonProperties = {
      '$submitbox': $submitbox,
      '$anchor': $anchor,
      '$scrollContainer': $scrollContainer,
      'submitBoxHeight': $submitbox.outerHeight() + 35
    };
    return $anchor;
  };

  prtgForm.prototype.updateFloatingButtons = function() {
    var self = this;
    if (self.floatButtonProperties['$submitbox'].length < 1 || self.floatButtonProperties['$anchor'].length < 1) return;
    var docViewTop = self.floatButtonProperties['$scrollContainer'].scrollTop();//$(window).scrollTop(),
      docViewBottom = docViewTop + self.floatButtonProperties['$scrollContainer'].height() + (self.floatButtonProperties['$scrollContainer'].offset()||{top:0}).top,
      elemTop = self.floatButtonProperties['$anchor'].offset().top + (self.floatButtonProperties['$scrollContainer'].offset() ? self.floatButtonProperties['$scrollContainer'].scrollTop() : 0),
      elemBottom = elemTop + self.floatButtonProperties['submitBoxHeight'];
    if (!((docViewTop < elemTop) && (docViewBottom > elemBottom))) {
      self.floatButtonProperties['$submitbox'].toggleClass("float", true);
    } else {
      self.floatButtonProperties['$submitbox'].toggleClass("float", false);
    }
  };

  prtgForm.prototype.groupShowHideHandler = function(e, forceHide) {
    var $this = $(this);
    var self = e.data.self;
    var thisId = ($this.is("select")) ? $this.children(":selected").attr("id") : $this.attr("id");
    var $hideId = $(".Hide" + thisId +":not(.multieditactivecheckbox)");
    var $showId = $(".Show" + thisId +":not(.multieditactivecheckbox)");

        if ($this.prop("checked") || $this.is("select") || forceHide) {
            if (forceHide) {
                $showId = $();
            }
            $hideId.removeClass("InitialDisplayNone hide").addClass("hidden");
            $showId.css('display', '').removeClass("InitialDisplayNone hidden hide");

            if ($hideId.is("visible")) {
                $(".Hide" + thisId + ":visible").addClass("hidden");
                $hideId.trigger('grouphide.' + self.namespace);
            } else {
                $showId.trigger('groupshow.' + self.namespace);
            }

            var $gsh;
            $hideId.each(function (i, elm) {
                $gsh = $(elm).find('.GroupShowHide');
                if ($gsh.length) {
                    $gsh.each(function (index, elm2) {
                        self.groupShowHideHandler.call(elm2, {"data": {"self": self}}, true);
                    });
                }
            });

            $showId.each(function (i, elm) {
                $gsh = $(elm).find('.GroupShowHide');
                if ($gsh.length) {
                    $gsh.each(function (index, elm2) {
                        self.groupShowHideHandler.call(elm2, {"data": {"self": self}});
                    });
                }
            });

        } else {
            $(".HideNot" + thisId + ":visible").addClass("hidden");
            $(".ShowNot" + thisId).removeClass("InitialDisplayNone hidden hide");
        }
    };

    prtgForm.prototype.runhistoryform = function (e) {
        var self = e.data.self;
        if (!self.$el.valid() || self.$el.find('.validateerror2').length > 0) {
            e.preventDefault();
            return;
        }
        var myid;
        if (typeof(myid) == 'undefined') {
            myid = $("#myid").val();
        }
        if (typeof(myid) == 'undefined') {
            myid = $(".sensorlookupnew").attr("selid");
        }
        if (typeof(myid) == 'undefined') {
            myid = $('input[name="id"]:hidden').val();
        }


        var params = "?id=" + myid
            + "&sdate=" + $("#sdate").val()
            + "&edate=" + $("#edate").val()
            + "&avg=" + $("#avg").val()
            + "&pctavg=" + $("#pctavg").val()
            + "&pctshow=" + $("#pctshow").prop("checked")
            + "&pct=" + $("#pct").val()
            + "&pctmode=" + $("#pctmode1").prop("checked");
        var clusterid = $('input[name="clgid"]:checked').val();
        if (clusterid) {
            params = params + "&clgid=" + clusterid;
        }

        if ($('#hiddenchannels').length > 0 && $('#hiddenchannels').val() !== '')
            params += '&hide=' + $('#hiddenchannels').val();

        if ($("#formathtml").prop("checked")) {
            var windowname = 'HistoricDataWindow' + parseInt(Math.random() * (1000000), 10);
            var mywindow = window.open("/generatehistoricdata.htm?id=" + myid + "&generate=" + encodeURIComponent('/historicdata_html.htm' + params), windowname, 'width=900,height=600,scrollbars=yes,toolbar=yes,location=yes,status=yes,menubar=yes,resizable=yes');
            mywindow.focus();
        } else if ($("#formatxml").prop("checked") === true) {
            window.top.location.href = "/api/historicdata.xml" + params;
        } else if ($("#formatcsv").prop("checked") === true) {
            window.top.location.href = "/api/historicdata.csv" + params;
        }
        e.preventDefault();
    };

    prtgForm.prototype.destroy = function (event) {
        var self = event.data.self;
        $(document).off('.' + self.namespace);
        self.$el.off('.' + self.namespace);
        self.$el.off('.' + self.namespace);
    };

    $.fn[pluginName] = function (data, parent) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new prtgForm(this, data, parent));
            }
        });
    };

})(jQuery, window, document);
