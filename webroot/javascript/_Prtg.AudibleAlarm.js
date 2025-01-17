﻿/* _Prtg.Ausiblealarm.js */
(function ($, window, document, undefined) {
  _Prtg.AudibleAlarm = {
    playAlarm: function() {
      if(_Prtg.Options.playAlarmSound === 0) return;
      if(_Prtg.Options.playAlarmSound === 1 && !($('#dashboard1').length || $('#dashboard2').length || $('#dashboard3').length)) return;

      if($('#audiblealarm').length <= 0) {
        $("#alarmsound").empty().append('<audio id="audiblealarm"><source src="/sounds/beep.ogg" type="audio/ogg" /><source src="/sounds/beep.mp3" type="audio/mpeg3" /></audio>');
      }
      var audiblealarm = document.getElementById("audiblealarm");
      audiblealarm.load();
      audiblealarm.play();
    }
  };
})(jQuery, window, document);
