﻿/* conext help plugin */
;(function ($, window, document, undefined) {
    var regRemarks = /<span class="f_Remarks">(.*)<\/span>/gi;

    function Documentation(element, data, parent) {
        this.element = $(element);
        this.data = data;
        if (!!this.data.url)
            this.init(this);
    }

    Documentation.prototype.init = function (me) {
        if (!me.data || !me.data.url)
            return;
        setTimeout(function () {
            $.ajax({
                url: me.data.url,
                dataType: "text",
                beforeSend: function (jqXHR) {
                    jqXHR.ignoreError = true;
                }
            })
                .done(function (html) {
                    var elms = [],
                        h = [],
                        m = null;
                    while ((m = regRemarks.exec(html)) !== null) {
                        elms.push(m[1]);
                    }
                    if (elms.length) {
                        elms.forEach(function (elm) {
                            if (elm !== '&nbsp;') {
                                elm = $('<li>' + elm + '</li>');
                                elm.find("a").each(function () {
                                    var href = $(this).attr('href');
                                    if (href.indexOf('/') === -1) href = '/help/' + href;
                                    $(this)
                                        .attr('href', href)
                                        .attr('target', '_blank');
                                });
                                elm.find("img").each(function () {
                                    var src = $(this).attr('src');
                                    if (src.indexOf('/') === -1) src = '/help/' + src;
                                    $(this).attr('src', src);
                                });
                                h.push(elm);
                            }
                        });
                        if (!!h.length) {
                            me.element.append(h);
                            me.element.children().wrapAll('<ul class="manual-remarks"></ul>');
                            me.element.removeClass('hide');
                        }
                    }
                });
        }, 500);
    };

    _Prtg.Plugins.registerPlugin("documentation", Documentation);

    var pluginName = "contexthelp";

    function Plugin(element, options) {
        this.element = element;
        this.open = false;
        this.$self = $(element);
        this.$last = this.$self.find('.lasthelpitem');
        this.$container = this.$self;//.css('maxHeight',(parseInt($(window).height() * 0.5, 10)+'px'));
        this.$toggler = this.$self.parent().find('#togglehelp');
        this.body = $('body');
        this.init();
    }

    Plugin.prototype.init = function () {
        var me = this,
            height = me.$container.height();
            me.body.removeClass('helpOpened');

        _Prtg.Events.subscribe('navigate.prtg,navigate.tab.prtg', $.proxy(me.refresh, me));
        me.refresh();
        this.$self.parent().find('#togglehelp,#closehelp').on('click', function (e) {
            toggle();
            e.stopImmediatePropagation();
        });

        //_Prtg.Events.subscribe('prtg.resize.layout', function () {
            //me.$container.css('maxHeight', parseInt($(window).height() * 0.5, 10) + 'px');
        //});

        if ($('#helpcontainer').hasClass('hidden')) {
            this.open = false;
        } else {
            this.open = true;
        }

        function toggle() {
            me.open = !me.open;
            me.animation2(!me.open);
            $.ajax({
                url: "/api/setshowhelpstatus.htm",
                data: {
                    "action": me.open ? 1 : 0,
                    "page": me.url,
                    "help": true
                },
                type: "GET"
            });
        }
    };

    function setColumnsClass(elem, text) {
        var sizeClasses = {
            l:'text_l',
            xl:'text_xl'
        };

        elem.removeClass(sizeClasses.xl +' '+ sizeClasses.l);

        if(text.length>400){
            elem.addClass(sizeClasses.xl)
        }
        else if(text.length>200){
            elem.addClass(sizeClasses.l);
        }

    }

    Plugin.prototype.animation2 = function (open) {

        var me = this;
        me.$container.removeClass('hidden');

        if (!open) {
            me.$container.removeClass('hidden');
            me.body.addClass('helpOpened');
            $("#sendfeedbackbox").css("right", "290px");
            me.$toggler.hide();
            $('footer').removeClass('hidebuttons');
            $('#prtg_growls').css('bottom', $('#helpcontainer').outerHeight() + 25);
        } else {
            $('footer').addClass('hidebuttons');
            me.$container.addClass('hidden');
            me.body.removeClass('helpOpened');
            $("#sendfeedbackbox").css("right", "");
            me.$toggler.show();
            $('#prtg_growls').css('bottom', "");
        }
    };

    Plugin.prototype.add = function (elm, data) {
        var urlchange = false,
            $content = $(elm),
            me = this;

        me.$self.find(".contexthelpbox").not('.lasthelpitem').remove();
        if (me.url !== encodeURIComponent(window.location.pathname.substr(1, 100))) {
            urlchange = true;
            me.url = encodeURIComponent(window.location.pathname.substr(1, 100));
            if (me.open !== data.show) me.open = data.show;
        }
        if ($content.length === 0) return;
        $content.each(function () {
            var $elm = $(this).detach();
            if (me.$container.find('#' + data.id).length === 0) {
                $elm.data().pluginFunction = 'remove';
                $elm.attr('id', data.id).insertBefore(me.$last);
                !!_Prtg.Plugins.TCT && _Prtg.Plugins.TCT.plugin.init(undefined, me.$self);
            }
        });
        setColumnsClass(me.$self, me.$self.find('p').text());
        if (!urlchange && me.open) {
            me.animation2(!me.open);
        } else if (urlchange) {
            me.animation2(!me.open);
        }
    };

    Plugin.prototype.remove = function (elm) {
        if (!elm) return;
        //if(this.open) this.animation2(this.open);
    };

    Plugin.prototype.refresh = function () {
        var me = this;
        me.$toggler.show();
        me.$self.find(".contexthelpbox").not('.lasthelpitem').remove();
        setColumnsClass(me.$self, me.$self.find('p').text());
    };

    $.fn[pluginName] = function (options) {
        var me = this,
            elm = this;
        if (!!options) {
            if (!!options.pluginTarget) me = $('#helpcontainer');
            if (!!options.pluginFunction) {
                return me.each(function () {
                    $.data(this, "plugin_" + pluginName)[options.pluginFunction](elm, options);
                });
            }
        }
        return me.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);
