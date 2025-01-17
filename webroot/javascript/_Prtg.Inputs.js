﻿/* _Prtg.Inputs.js */
(function($, window, document, undefined) {

	function prtgFieldsetToggler(element, options) {
		this.el = (!(element instanceof jQuery)) ? element : element[0];
		this.$el = (!(element instanceof jQuery)) ? $(element) : element;
		this.$checkicon = $('<i class="icon-dark prtg-checkbox"></i>');
		if(this.$el.is(':checked'))
			this.$checkicon.toggleClass("icon-check");
		this.init();
	}

	prtgFieldsetToggler.prototype.init = function() {
		var me = this,
            $fieldset = me.$el.closest("fieldset");

        me.$el.closest("legend").addClass('switchcheckbox');

		this.$el.hide()
			.on("change", function(){
                    if (me.$el.hasClass("toggleFieldset")) {
                        $fieldset.toggleClass("collapsed");
                        if(!$fieldset.is('.collapsed')) $fieldset.trigger('groupshow');
                    }
                    me.$checkicon.toggleClass("icon-check");
			})
			.parent()
			.find('label[for="' + this.$el.attr("id") + '"]')
			.prepend(this.$checkicon);
	};

	$.fn['prtgFieldsetToggler'] = function(options) {
		return this.each(function() {
			if (!$.data(this, 'plugin_prtgFieldsetToggler')) {
				var type = $(this).attr("type");
				if (type === "checkbox") {
					$.data(this, 'plugin_prtgFieldsetToggler', new prtgFieldsetToggler(this, options));
				}
			}
		});
	};


  function Country(element, data, parent){
    this.element = element;
    this.data = data;
    this.parent = parent;
    this.phonefield = null;
    this.countrynamefield = null;
    if(this.data.phoneFieldId)
      this.phonefield = document.getElementById(this.data.phoneFieldId);
    if(this.data.countryNameId)
      this.countrynamefield = document.getElementById(this.data.countryNameId);
    this.init(this);
  }

  Country.prototype.init = function init(_this){
      var currentcountry = _this.data.country;
      var options = '';
      Object.keys(countries).sort()
        .forEach(function(key){
          var country = countries[key];
          options += '<option value="' + key + '" data-country="' + JSON.stringify(country) + '" '+ (key===currentcountry ? ' selected' : '') + '>' + country.name + '</option>';
        });
      _this.element.insertAdjacentHTML('beforeend', options);

      if(_this.phonefield){
        if(currentcountry.length)
          _this.phonefield.value = '+' + countries[currentcountry].code;
        else
          _this.phonefield.value = '+' + countries[_this.element.options[_this.element.selectedIndex].value].code;
        _this.element.addEventListener('change', function(){
          _this.phonefield.value = '+' + countries[_this.element.options[_this.element.selectedIndex].value].code;
        });
      }
      if(_this.countrynamefield){
        if(currentcountry.length)
          _this.countrynamefield.value = currentcountry + ': ' + countries[currentcountry].name;
        else
          _this.countrynamefield.value = _this.element.options[_this.element.selectedIndex].value + ': ' + countries[_this.element.options[_this.element.selectedIndex].value].name;
        _this.element.addEventListener('change', function(){
          _this.countrynamefield.value = _this.element.options[_this.element.selectedIndex].value + ': ' + countries[_this.element.options[_this.element.selectedIndex].value].name;
        });
      }
  };

  _Prtg.Plugins.registerPlugin('country-select', Country);

  var countries = {
    "BD": {
        "code": "880",
        "name": "\u09ac\u09be\u0982\u09b2\u09be\u09a6\u09c7\u09b6 \u0997\u09a3\u09aa\u09cd\u09b0\u099c\u09be\u09a4\u09a8\u09cd\u09a4\u09cd\u09b0\u09c0 (Bangladesh)"
    },
    "BF": {
        "code": "226",
        "name": "Burkina Faso"
    },
    "BG": {
        "code": "359",
        "name": "\u0411\u044a\u043b\u0433\u0430\u0440\u0438\u044f (Bulgaria)"
    },
    "BA": {
        "code": "387",
        "name": "Bosna i Hercegovina (Bosnia and Herzegovina)"
    },
    "BB": {
        "code": "1246",
        "name": "Barbados"
    },
    "BE": {
        "code": "32",
        "name": "Belgi\u00eb (Belgium)"
    },
    "BL": {
        "code": "590",
        "name": "Saint-Barth\u00e9lemy (Saint Barth\u00e9lemy)"
    },
    "BM": {
        "code": "1441",
        "name": "Bermuda"
    },
    "BN": {
        "code": "673",
        "name": "Negara Brunei Darussalam (Brunei)"
    },
    "BO": {
        "code": "591",
        "name": "Estado Plurinacional de Bolivia (Bolivia)"
    },
    "BH": {
        "code": "973",
        "name": "\u200f\u0627\u0644\u0628\u062d\u0631\u064a\u0646 (Bahrain)"
    },
    "BI": {
        "code": "257",
        "name": "R\u00e9publique du Burundi (Burundi)"
    },
    "BJ": {
        "code": "229",
        "name": "B\u00e9nin (Benin)"
    },
    "BT": {
        "code": "975",
        "name": "\u0f60\u0f56\u0fb2\u0f74\u0f42\u0f0b\u0f61\u0f74\u0f63\u0f0b (Bhutan)"
    },
    "JM": {
        "code": "1876",
        "name": "Jamaica"
    },
    "BV": {
        "code": "47",
        "name": "Bouvet\u00f8ya (Bouvet Island)"
    },
    "BW": {
        "code": "267",
        "name": "Republic of Botswana (Botswana)"
    },
    "WS": {
        "code": "685",
        "name": "S\u0101moa (Samoa)"
    },
    "BR": {
        "code": "55",
        "name": "Brasil (Brazil)"
    },
    "BS": {
        "code": "1242",
        "name": "Commonwealth of the Bahamas (Bahamas)"
    },
    "JE": {
        "code": "44",
        "name": "Bailiwick of Jersey (Jersey)"
    },
    "BZ": {
        "code": "501",
        "name": "Belize"
    },
    "RU": {
        "code": "7",
        "name": "\u0420\u043e\u0441\u0441\u0438\u044f (Russia)"
    },
    "RW": {
        "code": "250",
        "name": "Rwanda"
    },
    "RS": {
        "code": "381",
        "name": "\u0421\u0440\u0431\u0438\u0458\u0430 (Serbia)"
    },
    "TL": {
        "code": "670",
        "name": "Rep\u00fablica Democr\u00e1tica de Timor-Leste (Timor-Leste)"
    },
    "RE": {
        "code": "262",
        "name": "La R\u00e9union (R\u00e9union)"
    },
    "TM": {
        "code": "993",
        "name": "T\u00fcrkmenistan (Turkmenistan)"
    },
    "TJ": {
        "code": "992",
        "name": "\u0422\u043e\u04b7\u0438\u043a\u0438\u0441\u0442\u043e\u043d (Tajikistan)"
    },
    "RO": {
        "code": "40",
        "name": "Rom\u00e2nia (Romania)"
    },
    "TK": {
        "code": "690",
        "name": "Tokelau"
    },
    "GW": {
        "code": "245",
        "name": "Guin\u00e9-Bissau (Guinea-Bissau)"
    },
    "GU": {
        "code": "1671",
        "name": "Guam"
    },
    "GT": {
        "code": "502",
        "name": "Rep\u00fablica de Guatemala (Guatemala)"
    },
    "GS": {
        "code": "500",
        "name": "South Georgia and the South Sandwich Islands (South Georgia)"
    },
    "GR": {
        "code": "30",
        "name": "\u0395\u03bb\u03bb\u03ac\u03b4\u03b1 (Greece)"
    },
    "GQ": {
        "code": "240",
        "name": "Guinea Ecuatorial (Equatorial Guinea)"
    },
    "GP": {
        "code": "590",
        "name": "Guadeloupe"
    },
    "JP": {
        "code": "81",
        "name": "\u65e5\u672c (Japan)"
    },
    "GY": {
        "code": "592",
        "name": "Co-operative Republic of Guyana (Guyana)"
    },
    "GG": {
        "code": "44",
        "name": "Bailiwick of Guernsey (Guernsey)"
    },
    "GF": {
        "code": "594",
        "name": "Guyane fran\u00e7aise (French Guiana)"
    },
    "GE": {
        "code": "995",
        "name": "\u10e1\u10d0\u10e5\u10d0\u10e0\u10d7\u10d5\u10d4\u10da\u10dd (Georgia)"
    },
    "GD": {
        "code": "1473",
        "name": "Grenada"
    },
    "GB": {
        "code": "44",
        "name": "United Kingdom of Great Britain and Northern Ireland (United Kingdom)"
    },
    "GA": {
        "code": "241",
        "name": "R\u00e9publique gabonaise (Gabon)"
    },
    "SV": {
        "code": "503",
        "name": "Rep\u00fablica de El Salvador (El Salvador)"
    },
    "GM": {
        "code": "220",
        "name": "Republic of the Gambia (Gambia)"
    },
    "GL": {
        "code": "299",
        "name": "Kalaallit Nunaat (Greenland)"
    },
    "GI": {
        "code": "350",
        "name": "Gibraltar"
    },
    "GH": {
        "code": "233",
        "name": "Republic of Ghana (Ghana)"
    },
    "OM": {
        "code": "968",
        "name": "\u0639\u0645\u0627\u0646 (Oman)"
    },
    "TN": {
        "code": "216",
        "name": "\u062a\u0648\u0646\u0633 (Tunisia)"
    },
    "JO": {
        "code": "962",
        "name": "\u0627\u0644\u0623\u0631\u062f\u0646 (Jordan)"
    },
    "WF": {
        "code": "681",
        "name": "Wallis et Futuna (Wallis and Futuna)"
    },
    "HR": {
        "code": "385",
        "name": "Hrvatska (Croatia)"
    },
    "HT": {
        "code": "509",
        "name": "Ha\u00efti (Haiti)"
    },
    "HU": {
        "code": "36",
        "name": "Magyarorsz\u00e1g (Hungary)"
    },
    "HK": {
        "code": "852",
        "name": "\u9999\u6e2f (Hong Kong)"
    },
    "HN": {
        "code": "504",
        "name": "Rep\u00fablica de Honduras (Honduras)"
    },
    "HM": {
        "code": "672",
        "name": "Heard Island and McDonald Islands"
    },
    "VE": {
        "code": "58",
        "name": "Rep\u00fablica Bolivariana de Venezuela (Venezuela)"
    },
    "PR": {
        "code": "1",
        "name": "Estado Libre Asociado de Puerto Rico (Puerto Rico)"
    },
    "PS": {
        "code": "970",
        "name": "\u0641\u0644\u0633\u0637\u064a\u0646 (Palestine)"
    },
    "PW": {
        "code": "680",
        "name": "Republic of Palau (Palau)"
    },
    "PT": {
        "code": "351",
        "name": "Rep\u00fablica portugu\u00eas (Portugal)"
    },
    "SJ": {
        "code": "4779",
        "name": "Svalbard og Jan Mayen (Svalbard and Jan Mayen)"
    },
    "PY": {
        "code": "595",
        "name": "Rep\u00fablica de Paraguay (Paraguay)"
    },
    "IQ": {
        "code": "964",
        "name": "\u0627\u0644\u0639\u0631\u0627\u0642 (Iraq)"
    },
    "PA": {
        "code": "507",
        "name": "Panam\u00e1 (Panama)"
    },
    "PF": {
        "code": "689",
        "name": "Polyn\u00e9sie fran\u00e7aise (French Polynesia)"
    },
    "PG": {
        "code": "675",
        "name": "Papua Niugini (Papua New Guinea)"
    },
    "PE": {
        "code": "51",
        "name": "Per\u00fa (Peru)"
    },
    "PK": {
        "code": "92",
        "name": "Islamic Republic of Pakistan (Pakistan)"
    },
    "PH": {
        "code": "63",
        "name": "Pilipinas (Philippines)"
    },
    "PN": {
        "code": "64",
        "name": "Pitcairn Group of Islands (Pitcairn Islands)"
    },
    "PL": {
        "code": "48",
        "name": "Polska (Poland)"
    },
    "PM": {
        "code": "508",
        "name": "Saint-Pierre-et-Miquelon (Saint Pierre and Miquelon)"
    },
    "ZM": {
        "code": "260",
        "name": "Republic of Zambia (Zambia)"
    },
    "EH": {
        "code": "212",
        "name": "\u0627\u0644\u0635\u062d\u0631\u0627\u0621 \u0627\u0644\u063a\u0631\u0628\u064a\u0629 (Western Sahara)"
    },
    "EE": {
        "code": "372",
        "name": "Eesti (Estonia)"
    },
    "EG": {
        "code": "20",
        "name": "\u0645\u0635\u0631 (Egypt)"
    },
    "ZA": {
        "code": "27",
        "name": "Republiek van Suid-Afrika (South Africa)"
    },
    "EC": {
        "code": "593",
        "name": "Rep\u00fablica del Ecuador (Ecuador)"
    },
    "IT": {
        "code": "39",
        "name": "Italia (Italy)"
    },
    "VN": {
        "code": "84",
        "name": "Vi\u1ec7t Nam (Vietnam)"
    },
    "SB": {
        "code": "677",
        "name": "Solomon Islands"
    },
    "ET": {
        "code": "251",
        "name": "\u12a2\u1275\u12ee\u1335\u12eb (Ethiopia)"
    },
    "SA": {
        "code": "966",
        "name": "\u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0633\u0639\u0648\u062f\u064a\u0629 (Saudi Arabia)"
    },
    "ES": {
        "code": "34",
        "name": "Espa\u00f1a (Spain)"
    },
    "ME": {
        "code": "382",
        "name": "\u0426\u0440\u043d\u0430 \u0413\u043e\u0440\u0430 (Montenegro)"
    },
    "MD": {
        "code": "373",
        "name": "Republica Moldova (Moldova)"
    },
    "MG": {
        "code": "261",
        "name": "Madagasikara (Madagascar)"
    },
    "MF": {
        "code": "590",
        "name": "Saint-Martin (Saint Martin)"
    },
    "MA": {
        "code": "212",
        "name": "\u0627\u0644\u0645\u063a\u0631\u0628 (Morocco)"
    },
    "MC": {
        "code": "377",
        "name": "Principaut\u00e9 de Monaco (Monaco)"
    },
    "UZ": {
        "code": "998",
        "name": "O\u2018zbekiston (Uzbekistan)"
    },
    "ML": {
        "code": "223",
        "name": "R\u00e9publique du Mali (Mali)"
    },
    "MO": {
        "code": "853",
        "name": "\u6fb3\u9580 (Macau)"
    },
    "MN": {
        "code": "976",
        "name": "\u041c\u043e\u043d\u0433\u043e\u043b \u0443\u043b\u0441 (Mongolia)"
    },
    "MH": {
        "code": "692",
        "name": "M\u0327aje\u013c (Marshall Islands)"
    },
    "MK": {
        "code": "389",
        "name": "\u041c\u0430\u043a\u0435\u0434\u043e\u043d\u0438\u0458\u0430 (Macedonia)"
    },
    "MU": {
        "code": "230",
        "name": "Maurice (Mauritius)"
    },
    "MT": {
        "code": "356",
        "name": "Malta"
    },
    "MW": {
        "code": "265",
        "name": "Mala\u0175i (Malawi)"
    },
    "MV": {
        "code": "960",
        "name": "\u078b\u07a8\u0788\u07ac\u0780\u07a8\u0783\u07a7\u0787\u07b0\u0796\u07ad\u078e\u07ac (Maldives)"
    },
    "MQ": {
        "code": "596",
        "name": "Martinique"
    },
    "MP": {
        "code": "1670",
        "name": "Commonwealth of the Northern Mariana Islands (Northern Mariana Islands)"
    },
    "MS": {
        "code": "1664",
        "name": "Montserrat"
    },
    "MR": {
        "code": "222",
        "name": "\u0645\u0648\u0631\u064a\u062a\u0627\u0646\u064a\u0627 (Mauritania)"
    },
    "IM": {
        "code": "44",
        "name": "Isle of Man"
    },
    "UG": {
        "code": "256",
        "name": "Republic of Uganda (Uganda)"
    },
    "MY": {
        "code": "60",
        "name": "\u0645\u0644\u064a\u0633\u064a\u0627 (Malaysia)"
    },
    "MX": {
        "code": "52",
        "name": "M\u00e9xico (Mexico)"
    },
    "IL": {
        "code": "972",
        "name": "\u05d9\u05e9\u05e8\u05d0\u05dc (Israel)"
    },
    "FR": {
        "code": "33",
        "name": "R\u00e9publique fran\u00e7aise (France)"
    },
    "IO": {
        "code": "246",
        "name": "British Indian Ocean Territory"
    },
    "FX": {
        "code": "33",
        "name": "R\u00e9publique fran\u00e7aise (France)"
    },
    "SH": {
        "code": "290",
        "name": "Saint Helena, Ascension and Tristan da Cunha"
    },
    "AX": {
        "code": "358",
        "name": "\u00c5land (\u00c5land Islands)"
    },
    "FI": {
        "code": "358",
        "name": "Suomi (Finland)"
    },
    "FJ": {
        "code": "679",
        "name": "Republic of Fiji (Fiji)"
    },
    "FK": {
        "code": "500",
        "name": "Falkland Islands"
    },
    "FM": {
        "code": "691",
        "name": "Federated States of Micronesia (Micronesia)"
    },
    "FO": {
        "code": "298",
        "name": "F\u00f8royar (Faroe Islands)"
    },
    "NI": {
        "code": "505",
        "name": "Rep\u00fablica de Nicaragua (Nicaragua)"
    },
    "NL": {
        "code": "31",
        "name": "Nederland (Netherlands)"
    },
    "NO": {
        "code": "47",
        "name": "Norge (Norway)"
    },
    "NA": {
        "code": "264",
        "name": "Republic of Namibia (Namibia)"
    },
    "VU": {
        "code": "678",
        "name": "Ripablik blong Vanuatu (Vanuatu)"
    },
    "NC": {
        "code": "687",
        "name": "Nouvelle-Cal\u00e9donie (New Caledonia)"
    },
    "NE": {
        "code": "227",
        "name": "R\u00e9publique du Niger (Niger)"
    },
    "NF": {
        "code": "672",
        "name": "Territory of Norfolk Island (Norfolk Island)"
    },
    "NG": {
        "code": "234",
        "name": "Federal Republic of Nigeria (Nigeria)"
    },
    "NZ": {
        "code": "64",
        "name": "New Zealand"
    },
    "NP": {
        "code": "977",
        "name": "\u0928\u092a\u0932 (Nepal)"
    },
    "NR": {
        "code": "674",
        "name": "Republic of Nauru (Nauru)"
    },
    "NU": {
        "code": "683",
        "name": "Niu\u0113 (Niue)"
    },
    "CK": {
        "code": "682",
        "name": "Cook Islands"
    },
    "CH": {
        "code": "41",
        "name": "Schweiz (Switzerland)"
    },
    "CO": {
        "code": "57",
        "name": "Rep\u00fablica de Colombia (Colombia)"
    },
    "CN": {
        "code": "86",
        "name": "\u4e2d\u56fd (China)"
    },
    "CM": {
        "code": "237",
        "name": "Cameroun (Cameroon)"
    },
    "CL": {
        "code": "56",
        "name": "Rep\u00fablica de Chile (Chile)"
    },
    "CC": {
        "code": "61",
        "name": "Territory of the Cocos (Keeling) Islands (Cocos (Keeling) Islands)"
    },
    "CA": {
        "code": "1",
        "name": "Canada"
    },
    "CG": {
        "code": "242",
        "name": "R\u00e9publique du Congo (Republic of the Congo)"
    },
    "CF": {
        "code": "236",
        "name": "B\u00eaafr\u00eeka (Central African Republic)"
    },
    "CZ": {
        "code": "420",
        "name": "\u010cesk\u00e1 republika (Czech Republic)"
    },
    "CY": {
        "code": "357",
        "name": "\u039a\u03cd\u03c0\u03c1\u03bf\u03c2 (Cyprus)"
    },
    "CX": {
        "code": "61",
        "name": "Territory of Christmas Island (Christmas Island)"
    },
    "CR": {
        "code": "506",
        "name": "Rep\u00fablica de Costa Rica (Costa Rica)"
    },
    "CV": {
        "code": "238",
        "name": "Cabo Verde (Cape Verde)"
    },
    "CU": {
        "code": "53",
        "name": "Rep\u00fablica de Cuba (Cuba)"
    },
    "SZ": {
        "code": "268",
        "name": "Kingdom of Swaziland (Swaziland)"
    },
    "KG": {
        "code": "996",
        "name": "\u041a\u044b\u0440\u0433\u044b\u0437\u0441\u0442\u0430\u043d (Kyrgyzstan)"
    },
    "KE": {
        "code": "254",
        "name": "Republic of Kenya (Kenya)"
    },
    "SR": {
        "code": "597",
        "name": "Republiek Suriname (Suriname)"
    },
    "KI": {
        "code": "686",
        "name": "Independent and Sovereign Republic of Kiribati (Kiribati)"
    },
    "KH": {
        "code": "855",
        "name": "K\u00e2mp\u016dch\u00e9a (Cambodia)"
    },
    "KN": {
        "code": "1869",
        "name": "Federation of Saint Christopher and Nevisa (Saint Kitts and Nevis)"
    },
    "KM": {
        "code": "269",
        "name": "Komori (Comoros)"
    },
    "ST": {
        "code": "239",
        "name": "S\u00e3o Tom\u00e9 e Pr\u00edncipe (S\u00e3o Tom\u00e9 and Pr\u00edncipe)"
    },
    "SK": {
        "code": "421",
        "name": "Slovensko (Slovakia)"
    },
    "KR": {
        "code": "82",
        "name": "\ub300\ud55c\ubbfc\uad6d (South Korea)"
    },
    "SI": {
        "code": "386",
        "name": "Slovenija (Slovenia)"
    },
    "KW": {
        "code": "965",
        "name": "\u0627\u0644\u0643\u0648\u064a\u062a (Kuwait)"
    },
    "SN": {
        "code": "221",
        "name": "S\u00e9n\u00e9gal (Senegal)"
    },
    "SM": {
        "code": "378",
        "name": "Serenissima Repubblica di San Marino (San Marino)"
    },
    "SL": {
        "code": "232",
        "name": "Republic of Sierra Leone (Sierra Leone)"
    },
    "SC": {
        "code": "248",
        "name": "R\u00e9publique des Seychelles (Seychelles)"
    },
    "KZ": {
        "code": "7",
        "name": "\u049a\u0430\u0437\u0430\u049b\u0441\u0442\u0430\u043d (Kazakhstan)"
    },
    "KY": {
        "code": "1345",
        "name": "Cayman Islands"
    },
    "SG": {
        "code": "65",
        "name": "Republic of Singapore (Singapore)"
    },
    "SE": {
        "code": "46",
        "name": "Sverige (Sweden)"
    },
    "DO": {
        "code": "1",
        "name": "Rep\u00fablica Dominicana (Dominican Republic)"
    },
    "DM": {
        "code": "1767",
        "name": "Commonwealth of Dominica (Dominica)"
    },
    "DJ": {
        "code": "253",
        "name": "R\u00e9publique de Djibouti (Djibouti)"
    },
    "DK": {
        "code": "45",
        "name": "Danmark (Denmark)"
    },
    "VG": {
        "code": "1284",
        "name": "Virgin Islands (British Virgin Islands)"
    },
    "DE": {
        "code": "49",
        "name": "Deutschland (Germany)"
    },
    "YE": {
        "code": "967",
        "name": "\u0627\u0644\u064a\u064e\u0645\u064e\u0646 (Yemen)"
    },
    "DZ": {
        "code": "213",
        "name": "\u0627\u0644\u062c\u0632\u0627\u0626\u0631 (Algeria)"
    },
    "US": {
        "code": "1",
        "name": "United States of America (United States)"
    },
    "UY": {
        "code": "598",
        "name": "Rep\u00fablica Oriental del Uruguay (Uruguay)"
    },
    "YT": {
        "code": "262",
        "name": "D\u00e9partement de Mayotte (Mayotte)"
    },
    "UM": {
        "code": "1",
        "name": "United States Minor Outlying Islands"
    },
    "LC": {
        "code": "1758",
        "name": "Saint Lucia"
    },
    "LA": {
        "code": "856",
        "name": "\u0eaa\u0e9b\u0e9b\u0ea5\u0eb2\u0ea7 (Laos)"
    },
    "TV": {
        "code": "688",
        "name": "Tuvalu"
    },
    "TW": {
        "code": "886",
        "name": "\u81fa\u7063 (Taiwan)"
    },
    "TT": {
        "code": "1868",
        "name": "Republic of Trinidad and Tobago (Trinidad and Tobago)"
    },
    "TR": {
        "code": "90",
        "name": "T\u00fcrkiye (Turkey)"
    },
    "LK": {
        "code": "94",
        "name": "\u0dc1\u0dca\u200d\u0dbb\u0dd3 \u0dbd\u0d82\u0d9a\u0dcf\u0dc0 (Sri Lanka)"
    },
    "LI": {
        "code": "423",
        "name": "F\u00fcrstentum Liechtenstein (Liechtenstein)"
    },
    "LV": {
        "code": "371",
        "name": "Latvija (Latvia)"
    },
    "TO": {
        "code": "676",
        "name": "Kingdom of Tonga (Tonga)"
    },
    "LT": {
        "code": "370",
        "name": "Lietuva (Lithuania)"
    },
    "LU": {
        "code": "352",
        "name": "Grand-Duch\u00e9 de Luxembourg (Luxembourg)"
    },
    "LS": {
        "code": "266",
        "name": "Kingdom of Lesotho (Lesotho)"
    },
    "TH": {
        "code": "66",
        "name": "\u0e1b\u0e23\u0e30\u0e40\u0e17\u0e28\u0e44\u0e17\u0e22 (Thailand)"
    },
    "TF": {
        "code": "262",
        "name": "Territoire des Terres australes et antarctiques fran\u00e7aises"
    },
    "TG": {
        "code": "228",
        "name": "R\u00e9publique togolaise (Togo)"
    },
    "TD": {
        "code": "235",
        "name": "Tchad (Chad)"
    },
    "TC": {
        "code": "1649",
        "name": "Turks and Caicos Islands"
    },
    "VA": {
        "code": "379",
        "name": "Vaticano (Vatican City)"
    },
    "VC": {
        "code": "1784",
        "name": "Saint Vincent and the Grenadines"
    },
    "AE": {
        "code": "971",
        "name": "\u062f\u0648\u0644\u0629 \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062a \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0645\u062a\u062d\u062f\u0629 (United Arab Emirates)"
    },
    "AD": {
        "code": "376",
        "name": "Andorra"
    },
    "AG": {
        "code": "1268",
        "name": "Antigua and Barbuda"
    },
    "AF": {
        "code": "93",
        "name": "\u0627\u0641\u063a\u0627\u0646\u0633\u062a\u0627\u0646 (Afghanistan)"
    },
    "AI": {
        "code": "1264",
        "name": "Anguilla"
    },
    "VI": {
        "code": "1340",
        "name": "Virgin Islands of the United States (United States Virgin Islands)"
    },
    "IS": {
        "code": "354",
        "name": "\u00cdsland (Iceland)"
    },
    "AM": {
        "code": "374",
        "name": "\u0540\u0561\u0575\u0561\u057d\u057f\u0561\u0576 (Armenia)"
    },
    "AL": {
        "code": "355",
        "name": "Shqip\u00ebria (Albania)"
    },
    "AO": {
        "code": "244",
        "name": "Rep\u00fablica de Angola (Angola)"
    },
    "AN": {
        "code": "599",
        "name": "Antia Hulandes (Netherlands Antilles)"
    },
    "AQ": {
        "code": "672",
        "name": "Antarctica"
    },
    "AS": {
        "code": "1684",
        "name": "American Samoa"
    },
    "AR": {
        "code": "54",
        "name": "Rep\u00fablica Argentina (Argentina)"
    },
    "AU": {
        "code": "61",
        "name": "Commonwealth of Australia (Australia)"
    },
    "AT": {
        "code": "43",
        "name": "\u00d6sterreich (Austria)"
    },
    "AW": {
        "code": "297",
        "name": "Aruba"
    },
    "IN": {
        "code": "91",
        "name": "\u092d\u093e\u0930\u0924 (India)"
    },
    "TZ": {
        "code": "255",
        "name": "Jamhuri ya Muungano wa Tanzania (Tanzania)"
    },
    "AZ": {
        "code": "994",
        "name": "Az\u0259rbaycan (Azerbaijan)"
    },
    "IE": {
        "code": "353",
        "name": "\u00c9ire (Ireland)"
    },
    "ID": {
        "code": "62",
        "name": "Republik Indonesia (Indonesia)"
    },
    "UA": {
        "code": "380",
        "name": "\u0423\u043a\u0440\u0430\u0457\u043d\u0430 (Ukraine)"
    },
    "QA": {
        "code": "974",
        "name": "\u0642\u0637\u0631 (Qatar)"
    },
    "MZ": {
        "code": "258",
        "name": "Mo\u00e7ambique (Mozambique)"
    }
  };
  countries.sort


})(jQuery, window, document);
