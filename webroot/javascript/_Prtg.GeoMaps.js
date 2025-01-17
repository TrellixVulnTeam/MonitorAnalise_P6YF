﻿/*
_Prtg.GeoMaps.js
*/

(function($){
	var states = {0:'unknown', 1:'unknown', 2:'paused', 3:'up',4:'unusual',5:'warn',6:'downack',7:'down'}
		, methods = {
				init: function init(data, parent) {
					return this.each(function () {
						var $me = $(this)
							, domobj = $me.parent()[0]
							, data = $me.data()
							, initmap = function(domobj, data, parent){
								$me.parent().data('geomap',new geomap(domobj, data.markers.locationlist, data, data.apiKey, null, parent));
								$me.remove();
							};
						$me.children('div').remove();
						if($me.parent().is(':visible'))
							initmap(domobj, data, parent);
						else
							if($me.parent().is('.mobile'))
								$(document).one('pageshow', function(e){
									initmap(domobj, data, parent);
								});
							else
								$me.closest('fieldset').one('groupshow.prtg', function(e){
									e.stopPropagation()
									initmap(domobj, data, parent);
								});
					});
				}
			},

	geomap = function geomap(domobj, data, opts, apiKey, callback, parent){
		var geocoder = this.geolocator()
			, locatortimer = null
			, renderer = OpenLayers.Util.getParameters(window.location.href).renderer
			, me = this
			, i =0
			, bounds = new OpenLayers.Bounds();
		this.renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;
		this.timer = (function(){if($(parent).Events) return $(parent).Events(); else return null;})();
		this.objectid = opts.objectId;
		this.domobj = domobj;
		this.data = data || {};
		this.callback = callback || null;
		this.apiKey = apiKey;
		this.options = $.extend(true, {
			edit: false,
			provider: 'mapquest',
			maptype: 'roadmap',
			layers:{
				'cloudmade': {
					"tiles":[
						"/api/tiles.htm?cache=true&dom=cm1&path="+apiKey.split('#')[0]+"/"+(apiKey.split('#')[1]||1)+"/256/${z}/${x}/${y}.png",
						"/api/tiles.htm?cache=true&dom=cm2&path="+apiKey.split('#')[0]+"/"+(apiKey.split('#')[1]||1)+"/256/${z}/${x}/${y}.png",
						"/api/tiles.htm?cache=true&dom=cm3&path="+apiKey.split('#')[0]+"/"+(apiKey.split('#')[1]||1)+"/256/${z}/${x}/${y}.png"],
					"opts": {
						attribution: "CloudMade",
						maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
						maxResolution: 156543.0339,
						units: "m",
						projection: "EPSG:900913",
						numZoomLevels: _Prtg.Options.geomapZoomLevels,
						displayOutsideMaxExtent: true,
						wrapDateLine: true,
						transitionEffect: 'resize'
					}
				},
				'ovi': {
					"roadmap":{
						"tiles":[
							"/api/tiles.htm?cache=true&dom=ovi1&path=maptile/2.1/maptile/newest/normal.day/${z}/${x}/${y}/256/png8",
							"/api/tiles.htm?cache=true&dom=ovi2&path=maptile/2.1/maptile/newest/normal.day/${z}/${x}/${y}/256/png8",
							"/api/tiles.htm?cache=true&dom=ovi3&path=maptile/2.1/maptile/newest/normal.day/${z}/${x}/${y}/256/png8"
						],
						"opts": {transitionEffect: 'resize', numZoomLevels: _Prtg.Options.geomapZoomLevels, attribution: "Here Maps"}
					},
					"ovisatelite":{
            "tiles":[
              "/api/tiles.htm?cache=true&dom=mqos1&path=maptile/2.1/maptile/newest/hybrid.day/${z}/${x}/${y}/256/png8",
              "/api/tiles.htm?cache=true&dom=mqos2&path=maptile/2.1/maptile/newest/hybrid.day/${z}/${x}/${y}/256/png8",
              "/api/tiles.htm?cache=true&dom=mqos3&path=maptile/2.1/maptile/newest/hybrid.day/${z}/${x}/${y}/256/png8",
              "/api/tiles.htm?cache=true&dom=mqos4&path=maptile/2.1/maptile/newest/hybrid.day/${z}/${x}/${y}/256/png8"
            ],
            "opts": {transitionEffect: 'resize', numZoomLevels: _Prtg.Options.geomapZoomLevels, attribution: "Here Maps"}
					}
				},
				'mapquest':{
					"roadmap": {
            "tiles":[
              "/api/tiles.htm?cache=true&dom=ovi1&path=maptile/2.1/maptile/newest/normal.day/${z}/${x}/${y}/256/png8",
              "/api/tiles.htm?cache=true&dom=ovi2&path=maptile/2.1/maptile/newest/normal.day/${z}/${x}/${y}/256/png8",
              "/api/tiles.htm?cache=true&dom=ovi3&path=maptile/2.1/maptile/newest/normal.day/${z}/${x}/${y}/256/png8"
            ],
            "opts": {transitionEffect: 'resize', numZoomLevels: _Prtg.Options.geomapZoomLevels, attribution: "Here Maps"}
					},
					"mqaerial":{
            "tiles":[
              "/api/tiles.htm?cache=true&dom=mqos1&path=maptile/2.1/maptile/newest/hybrid.day/${z}/${x}/${y}/256/png8",
              "/api/tiles.htm?cache=true&dom=mqos2&path=maptile/2.1/maptile/newest/hybrid.day/${z}/${x}/${y}/256/png8",
              "/api/tiles.htm?cache=true&dom=mqos3&path=maptile/2.1/maptile/newest/hybrid.day/${z}/${x}/${y}/256/png8",
              "/api/tiles.htm?cache=true&dom=mqos4&path=maptile/2.1/maptile/newest/hybrid.day/${z}/${x}/${y}/256/png8"
            ],
            "opts": {transitionEffect: 'resize', numZoomLevels: _Prtg.Options.geomapZoomLevels, attribution: "Here Maps"}
					}
				}
			}
		},opts.options || {});
		this.layers = [];
		this.markers = [];
		this.projection = new OpenLayers.Projection("EPSG:4326");
		this.maxSizeWithIcons = 18;
		this.size = new OpenLayers.Size(_Prtg.Core.objects.geomapIconSize,_Prtg.Core.objects.geomapIconSize);
		this.offset = new OpenLayers.Pixel(-(this.size.w/2), -this.size.h);
		this.controls = [];
		this.vectors = new OpenLayers.Layer.Vector("Vector Layer", {
					renderers: self.renderer
		 });
		this.boxes = new OpenLayers.Layer.Boxes("Boxes");
		this.style_mark={
				cursor:'move',
				fillColor: '#fff',
				fillOpacity:1,
				strokeWidth: 1,
				graphicWidth:14,
				graphicHeight:14,
				graphicXOffset:-7,
				graphicYOffset :-7,
				externalGraphic:'/images/geoflag.png'
				// graphicTitle:'Please drag and drop marker for positioning'
			};
		this.icon = new OpenLayers.Icon('', this.size,0);

		if(this.options.provider.toLowerCase() !== 'google')
			init.call(this);

		function init(){
			$(domobj)
				.removeClass('geomap refreshable')
				.addClass('loading geomap-active geomap-type-'+this.options.provider.toLowerCase());
            if ($(domobj).find('.loadspinner').length == 0){
                $(domobj).append('<div class="loadspinner"></div>')
            }
			this.map = new OpenLayers.Map(domobj, {
					theme: null,
					controls: [
						new OpenLayers.Control.TouchNavigation({
								dragPanOptions: {
										enableKinetic: true
								}
						}),
						new OpenLayers.Control.Zoom(),
						new OpenLayers.Control.Navigation({'zoomWheelEnabled':true,'zoomBoxEnabled':true})
					]
			});
			switch(this.options.provider.toLowerCase()){
				case 'ovi':
					this.layers.push(new OpenLayers.Layer.OSM(this.options.maptype,
							this.options.layers['ovi'][this.options.maptype].tiles,
							this.options.layers['ovi'][this.options.maptype].opts));
					break;
				case 'mapquest':
					this.layers.push(new OpenLayers.Layer.OSM(this.options.maptype,
							this.options.layers['mapquest'][this.options.maptype].tiles,
							this.options.layers['mapquest'][this.options.maptype].opts));
					break;
				case 'cloudmade':
					this.layers.push(new OpenLayers.Layer.OSM(this.options.maptype,
							this.options.layers['cloudmade'].tiles,
							this.options.layers['cloudmade'].opts));
					break;
				default: //mapquest
					this.layers.push(new OpenLayers.Layer.OSM('roadmap',
							this.options.layers['mapquest']['roadmap'].tiles,
							this.options.layers['mapquest']['roadmap'].opts));
					break;

			}
			this.map.addLayers(this.layers);
			this.layers[0].events.register("loadend", this.layers[0], function() {
				$(domobj)
					.removeClass('loading')
					.find('.olMapViewport div:first-child, .olControlDragFeature')
						.css('z-Index','')
      });
			this.map.addLayer(this.vectors);
			this.map.addLayer(this.boxes);
			$(this.boxes.div).addClass('boxes')
			this.mapprojection = this.map.getProjectionObject();
			// if(this.layers.length > 1)
				// this.map.addControl(new OpenLayers.Control.LayerSwitcher());
			try{
				this.map.zoomToMaxExtent();
				this.map.setCenter(new OpenLayers.LonLat(0,33).transform(this.projection,this.map.getProjectionObject()));
				this.markers = new OpenLayers.Layer.Markers( "Markers" );
				this.map.addLayer(this.markers);
				this.callback && this.callback.call(domobj);
			}catch(e){if(!!console && console.log)console.log('BAD GEOMAP ERROR:',e);return;}

			this.sparklines = $('#geomapsparkline').parent().css('display','block').end().contents();
			this.sparklines.detach();
			if(!this.options.edit){
				for(var i in this.data){
					if(this.data[i].coordinates[0] !== -1 && this.data[i].coordinates[1] !== -1){
						this.data[i].lonlat = new OpenLayers.LonLat(this.data[i].coordinates[0], this.data[i].coordinates[1])
							.transform(this.projection,this.map.getProjectionObject());
						this.data[i].marker = this.addMarker(this.data[i]);
					}
					if(!!this.data[i].track){
						this.tracking(this, this.data[i]).done(function(d){
							bounds = null;
							bounds = me.markers.getDataExtent();
							if(!!d['values'] && !!d['values'].length){
								bounds.extend(me.vectors.getDataExtent());
								$('#geomapsparkline').append(me.sparklines);
								me.sparkline($('#geomapsparkline'), me.data[i].location, d['values']);
							}else{
								me.map.zoomTo(0);
							}
							me.map.zoomToExtent(bounds, false);
						});
					}
				}
				if(this.markers.markers.length){
					bounds = this.markers.getDataExtent();
					this.map.zoomToExtent(bounds, false);
				}
				for(var marker in this.markers.markers)
					this.markers.markers[marker].icon.imageDiv.firstChild.id = this.markers.markers[marker].icon.imageDiv.id;

				if(this.timer){
					this.timer.subscribe('refresh.events.prtg',$.proxy(this.refresh, this));
					this.timer.subscribeOnce('navigate.prtg', $.proxy(function(e){
						this.timer.unsubscribe('refresh.events.prtg',$.proxy(this.refresh, this));
					}, this));
				}

			} else {
				var $input = $(domobj).next() //parent().find('input[name="lonlat_"]')
					, loc = (function(){
							var ret = $input.val().split(',');
							if(ret.length < 2) {ret=[0,0];} return [parseFloat(ret[0]),parseFloat(ret[1])];
						})()
					, nomarker = (loc[0]===0 && loc[1]===0);
				loc = new OpenLayers.LonLat(loc[0],loc[1])
					.transform(this.projection,this.map.getProjectionObject());

				var geometry = new OpenLayers.Geometry.Point(loc.lon,loc.lat)
					, marker = new OpenLayers.Marker(loc, this.icon);

				this.vectors.addFeatures([new OpenLayers.Feature.Vector(geometry,null,this.style_mark)]);
				if(!nomarker){
					this.markers.addMarker(marker);
					$(marker.icon.imageDiv).hide();
				}
				this.controls.push(new OpenLayers.Control.DragFeature(this.vectors, {
					'onComplete': function(vector, pixel){
						var lonlat = this.map.getLonLatFromPixel(pixel);
						lonlat = lonlat.transform(
								me.map.getProjectionObject(),
								me.projection
						);
            			$input.val(lonlat.lon +',' + lonlat.lat);
						$input.trigger('formchange');
					}
				}));
				// this.controls.push(new OpenLayers.Control.MousePosition());
				$.each(this.controls,function(i,control){
					me.map.addControl(control);
					control.activate();
				});
				if(!nomarker)
					me.map.zoomToExtent(this.markers.getDataExtent(), false);
				else
					this.map.zoomToMaxExtent();
				if(geocoder){
					$('#location_').bind('keyup', function(){
						clearTimeout(locatortimer);
						var elm = this
							, self = me
							, obj = domobj
							, lastsearch = ""
							, locator = function(){
									var search = $(elm).val();
									if(lastsearch !== search)
										geocoder.geocode(search, obj).done(function(result){
											$input.val(result.location|| '0,0');
											var loc = result.location.split(',');
											nomarker = (loc[0]==='0' && loc[1]==='0');

											loc = new OpenLayers.LonLat(loc[0],loc[1])
												.transform(
													self.projection,
													self.map.getProjectionObject()
												);

											self.vectors.destroyFeatures();
											self.markers.destroy();
											self.markers = new OpenLayers.Layer.Markers( "Markers" );
											var geometry = new OpenLayers.Geometry.Point(loc.lon,loc.lat)
												, marker = new OpenLayers.Marker(loc, self.icon.clone());
											self.vectors.addFeatures([new OpenLayers.Feature.Vector(geometry,null,self.style_mark)]);
											if(nomarker)
												self.map.zoomToMaxExtent();
											else{
												self.markers.addMarker(marker);
												$(marker.icon.imageDiv).hide();
												self.map.zoomToExtent(self.markers.getDataExtent(), false);
											}

										});
								lastsearch=search;
								$('#submitbuttonbox').addClass("active");
							};
							locatortimer = setTimeout(locator,1000);
					});
				}
			}
		}
	};
	geomap.prototype.refresh = function geomapRefresh(e){
		var self = this
		$.ajax({
			type: 'GET',
			url:'/api/geomarkers.json',
			data: {id:self.objectid},
			dataType: 'json',
			beforeSend: function(jqXHR){
				jqXHR.peNumber = 'PE1003'
			}
		}).done(function(json){
			self.vectors.removeAllFeatures();
			while(self.markers.markers.length){
				m = self.markers.markers[0];
				self.markers.removeMarker(m);
				m.destroy();
			}
			while(self.boxes.markers.length){
				m = self.boxes.markers[0];
				self.boxes.removeMarker(m);
				m.destroy();
			}
			self.data = json.locationlist;
			for(var i in self.data){
				if(!!self.data[i].track)
					self.tracking(self, self.data[i]);
				if(self.data[i].coordinates[0] !== -1 && self.data[i].coordinates[1] !== -1){
					self.data[i].lonlat = new OpenLayers.LonLat(self.data[i].coordinates[0], self.data[i].coordinates[1])
						.transform(self.projection,self.map.getProjectionObject());
					self.data[i].marker = self.addMarker.apply(self, [self.data[i]]);
				}
			}
		});
	};
	geomap.prototype.geolocator = function(){
		self = this;
		return {
			geocode: function(search, elm){
				var dfd = $.Deferred()
					, loc = search.replace(/(\r\n|\n|\r)/g," ").replace(/(\{(.*)\})/g,"").match( /-?\d+\.\d+/g ) || []
					, func = {
						"0": function(search){
							$.ajax({
								dataType: "json",
								global: false,
								url: '/api/geolocator.htm',
								data: {
									cache: false,
									dom: 0,
									path: search.replace(/ /g,'+') + '&key=' + self.apiKey
								}
							}).done(function (resp, status) {
								if(!!resp
								&& resp.status === "OK"
								&& resp.results.length > 0
								&& !!resp.results[0].geometry
								&& !!resp.results[0].geometry.location) {
									loc[0] = resp.results[0].geometry.location.lng;
									loc[1] = resp.results[0].geometry.location.lat;
									resp.location =  loc.join(',');
									dfd.resolve(resp);
									return;
								} else {
									func['2'](search);
								}
							}).fail(function(resp){
									func['2'](search);
							});
						},
						"2": function(search){
							$.ajax({
								dataType: "json",
								global: false,
								url: '/api/geolocator.htm',
								data: {
									cache: false,
									dom: 2,
									path: search.replace(/ /g,'+')
								}
							}).done(function (resp, status) {
								if(!!resp
								&& resp.Response.View.length > 0
                				&& resp.Response.View[0].Result.length > 0
                				&& !!resp.Response.View[0].Result[0].Location.DisplayPosition) {
									loc[0] = resp.Response.View[0].Result[0].Location.DisplayPosition.Longitude;
									loc[1] = resp.Response.View[0].Result[0].Location.DisplayPosition.Latitude;
									resp.location =  loc.join(',');
									dfd.resolve(resp);
									return;
								} else {
                                    resp.nomarker = true;
                                    dfd.reject(resp);
								}
							}).fail(function(resp){
                                resp.nomarker = true;
                                dfd.reject(resp);
							});
						}
					};
		var apiEntry = !!self.apiKey ? "0" : "2";
        if(loc.length !== 2)
				  func[apiEntry](search.split('\n')[0].trim());
        else
          dfd.resolve({location:loc[1]+','+loc[0]});
				return dfd.promise();
			}
		};
	};
	geomap.prototype.sparkline = function sparkline($elm,location, data){
		$elm.find('[locationname]').html(location).removeAttr('locationname');
		$elm.find('[data-x-axis]').each(function(){
	    var $elm = $(this)
	    	, xpart = $elm.data().xAxis
	    	, ypart = $elm.data().yAxis;
	    if(data[0][xpart.property]===undefined){
	    	$elm.hide();
	    	return;
	    }
	    var pxwidth = $elm.width()
	      , pxheight = $elm.height()
	      , top = ((parseInt($elm.css('font-size'),10)||10) >> 1)
	      , graph = d3.select($elm[0])
	      	.append("svg:svg")
	      	.attr("width","100%")
	      	.attr("height","100%")
	      	.append('g')
	      	.attr("transform", "translate("+((pxwidth-xpart.xrange[1])/2) +","+top+")")
	      , xtime = (typeof(data[0][xpart.property])==='object')
	      , x = (xtime
	      		? d3.time.scale().range(xpart.xrange)
	      		: d3.scale.linear().range(xpart.xrange))
	      , xAxis = (xpart.display ? d3.svg.axis().scale(x).orient(xpart.display.split(' ')[0]) : null);
	    $elm.removeAttr('data-x-axis');
	    graph.append('svg:rect')
	      .attr('width', "100%")
	      .attr('height',"100%")
	      .attr('fill', "white");

	    if(xtime){
	    	if(!!xAxis){
					xAxis
						.tickSize(3)
						.tickPadding(1)
						.outerTickSize(0);
			  }
		    x.domain([
		    	d3.min(data.map(function(d){return d[xpart.property];})),
		    	d3.max(data.map(function(d){return d[xpart.property];}))
		    	// d3.extent(data,function(d){return d[xpart.property];})
		    ]);
				graph.append("g")
		      .attr("class", "x axis " +xpart.display)
		      .attr("transform", "translate(0," + (xpart.display==="top"?0:xpart.yrange[0]) + ")")
		      .call(xAxis)
				  .selectAll("text")
						.attr("transform", "rotate(62)")
				    .style("text-anchor", "start");
				graph.append("text")
					.attr('class','x-label')
					.attr("transform", 'translate(' + (xpart.xrange[1] / 2) + ',' + (pxheight - 3*top) + ')')
					.style("text-anchor", "middle")
					.text(xpart.label);
		  }else{
				xAxis
					.tickSize(3)
					.tickPadding(1)
					.outerTickSize(0);
		    x.domain([
		    	0,
		    	d3.max(data.map(function(d){return d[xpart.property];}))
		    ]);
				graph.append("g")
		      .attr("class", "x axis " +xpart.display)
		      .attr("transform", "translate(0," + (xpart.display==="top"?0:xpart.yrange[0]) + ")")
		      .call(xAxis)
				  .selectAll("text")
				    .style("text-anchor", "middle");
				graph.append("text")
					.attr('class','x-label')
					.attr("transform", 'translate(' + (xpart.xrange[1] / 2) + ',' + (pxheight - 7*top) + ')')
					.style("text-anchor", "middle")
					.text(xpart.label);
		  }

	    if(!!xAxis){
				graph.append("g")
		      .attr("class", "x axis ticksonly " +(xpart.display==="top"?"bottom":"top"))
		      .attr("transform", "translate(0," + (xpart.display==="top"?xpart.yrange[0]:0) + ")")
		      .call(xAxis)
			}

      ypart.forEach(function(ypart){
      	if(data[0][ypart.property]===undefined){
					graph.append("g")
			      .attr("class", "y axis " +ypart.display)
						.attr("transform", "translate("+(ypart.display==='left'?0:xpart.xrange[1])+",0)")
						.append("path")
							.attr('class', 'domain')
							.attr('d','M0,0H0V'+xpart.yrange[0]+'H0');
      		return;
      	}
	      var y = d3.scale.linear().range(xpart.yrange)
			  , yAxis = (ypart.display ? d3.svg.axis().scale(y).orient(ypart.display.split(' ')[0]) : null)
	      , chart = d3.svg[ypart.chart.split(' ')[0]]()
	        .x(function(d){return  x(d[xpart.property]); })
	       	.interpolate('linear');

		    if(!!chart.y0)
		    	chart
		        .y0(xpart.yrange[0])
		        .y1(function(d){return y(d[ypart.property]);})
		    else
		    	chart
		        .y(function(d){return y(d[ypart.property]);})
		 	 	y.domain([0, d3.max(data.map(function(d){return d[ypart.property];}))]);
				graph.append("svg:path")
					.attr('class',ypart.property + ' data ' + ypart.chart)
					.attr("d", chart(data));
				if(!!yAxis){
					yAxis
						.tickSize(3)
						.tickPadding(1)
						.outerTickSize(0);
					graph.append("g")
			      .attr("class", "y axis " +ypart.display)
						.attr("transform", "translate("+(ypart.display==='left'?0:xpart.xrange[1])+",0)")
			      .call(yAxis);
			  }else{
					graph.append("g")
			      .attr("class", "y axis " +ypart.display)
						.attr("transform", "translate("+(ypart.display==='left'?0:xpart.xrange[1])+",0)")
						.append("path")
							.attr('class', 'domain')
							.attr('d','M0,0H0V'+xpart.yrange[0]+'H0');
			  }
				graph.append("text")
					.attr('class','y-label ' +ypart.property)
					.attr("transform", "rotate(-90)")
					.attr("y", (ypart.display==='left'?0:xpart.xrange[1]))
					.attr("x", xpart.yrange[0] / -2)
					.attr("dy", (ypart.display==='left'?"-3.4em":"4em"))
					.style("text-anchor", "middle")
					.text(ypart.label);

    	});
    });
	},
	geomap.prototype.tracking = function tracking(self, item){
		var style = $.extend(true,{
					  strokeColor: '#0000ff',
					  strokeOpacity: 0.5,
					  strokeWidth: 5
					},(item.track.style||{}))
				, pt = null
				, vt = null
				, publicmapid = _Prtg.Util.getUrlVars()["mapid"];
		if(!!publicmapid)
			item.track.mapid = publicmapid;
		item.track.style && delete item.track.style;
		return $.ajax({
			'url': '/api/table.json',
			// 'url': '/historicdata_1.htm',
			'dataType': 'json',
			'data': $.extend(true,item.track,{
				content:'values',
				sortby:'-datetime',
				columns:'datetime=treejson,value_',
				graphid:0,
				usecaption:true
			}),
			'type':'post',
			beforeSend: function(jqXHR){
				jqXHR.ignoreError = true;
				jqXHR.peNumber = 'PE1003b';
				jqXHR.ignoreManager = true;
			}
		})
		.fail(function(){})
		.done(function(d){
			var points=[]
				, olElm
				, olElx

			if(!!d['values']){
				d['values'] = $.map(d['values'].reverse(), function(elm){
					var lg = elm['Longitude'];
					var lt = elm['Latitude'];
					if(!!lg && !!lt && lg!=="Error" && lt !== "Error"){
						elm.point = new OpenLayers.Geometry.Point(lg,lt).transform(self.projection, self.mapprojection);

						if(!!pt){
							elm['Distance'] = (Math.round(elm.point.distanceTo(pt.point)) / 1000);
							elm['Speed'] = elm.Distance * 3600000 / (elm.datetime - vt.datetime);
							elm['Distance'] += pt.Distance;
							if(elm['Speed'] > 1235.0 || elm['Speed'] < 0.0001){
								vt = elm;
								return null;
							}
						}else{
							elm['Distance'] = 0;
							elm['Speed'] = 0;
						}
						points.push(elm.point);
						// elm.date = new Date((25569 - elm.datetime) * -86400); convert delphi tdatetime
						elm['Date'] = new Date(elm.datetime);
						pt = elm;
						vt = elm;
						if(!!item.track.waypointmarker){
							var boxclass = item.track.waypointstyle || 'box';
							self.boxes.addMarker(
								(
									olElm = new OpenLayers.Marker.Box(
										OpenLayers.Bounds.fromArray([pt.point.x-item.track.waypointmarker,pt.point.y-item.track.waypointmarker,pt.point.x+item.track.waypointmarker,pt.point.y+item.track.waypointmarker])
									)
								)
							);
							olElm.setBorder(style.strokeColor, style.strokeWidth);

							$(olElm.div)
								.css({
									'opacity':style.strokeOpacity,
									'background-color':style.strokeColor
								})
								.addClass(boxclass)
								.attr('title',elm.Date.toPrtgString()+' ['+lg+','+lt+']')
								.attr('data-original-title',elm.Date.toPrtgString()+' ['+lg+','+lt+']')
								.html('<span>'+elm.Date.toLocaleTimeString()+'</span>');
						}
						return elm;
					} else {
						return null;
					}
				});
				if(points.length){
					item.coordinates[0] = pt['Longitude'];
					item.coordinates[1] = pt['Latitude'];
					item.lonlat = new OpenLayers.LonLat(item.coordinates[0], item.coordinates[1])
						.transform(self.projection,self.mapprojection);
					item.marker.lonlat = item.lonlat;
					item.marker.moveTo(self.map.getLayerPxFromLonLat(item.lonlat));
					self.vectors.addFeatures(
						new OpenLayers.Feature.Vector(
							(
								olElm = OpenLayers.Geometry.Polygon.createRegularPolygon(
									pt.point
									,Math.round((pt['Accuracy']||0))
									, 50
								)
							)
						)
					);
					olElx = new OpenLayers.Feature.Vector(olElm, null, style);
					self.vectors.addFeatures([olElx]);
					self.vectors.addFeatures(
						new OpenLayers.Feature.Vector(
							(
								olElm = new OpenLayers.Geometry.LineString(points.reverse())
							)
						)
					);
					olElx = new OpenLayers.Feature.Vector(olElm, null, style);
					self.vectors.addFeatures([olElx]);
				}else{
					item.coordinates[0] = 0;
					item.coordinates[1] = 0;
					item.lonlat = new OpenLayers.LonLat(item.coordinates[0], item.coordinates[1])
						.transform(self.projection,self.mapprojection);
					item.marker.lonlat = item.lonlat;
					item.marker.moveTo(self.map.getLayerPxFromLonLat(item.lonlat));
				}
			}
		});
	}
	geomap.prototype.addMarker = function addMarker(data){
		var $link = $(data.link)
						.addClass('mapmarker')
						.attr('href', "/devices.htm?filter_location=@sub("+encodeURIComponent(data.location)+")")
			, marker = new OpenLayers.Marker(data.lonlat)
			, icon = marker.icon;

		icon.url = '';
    if(!!_Prtg.supportsTouch)
      marker.events.register("touchstart", marker,  function(){});

		$link.addClass('locationlist');
		if(this.size.w < this.maxSizeWithIcons){
			$link.removeAttr('style');
			$link.removeClass('devicemenu probemenu groupmenu');
		}

		icon.imageDiv.id = icon.imageDiv.firstChild.id = data.id;
		this.markers.addMarker(marker);
		// marker.icon.imageDiv.title = data.location;
		$(marker.icon.imageDiv)
			.addClass(states[data.state] + ' map-marker' +(this.size.w < this.maxSizeWithIcons?' map-marker-small':''))
			.html($link.text('')[0].outerHTML)
			.attr('data-delay','500')
			.attr('data-title',data.location);
		return marker;
	};

	geomap.prototype.disable = function disable(active){
		for(var i=0, l = this.map.controls.length; i<l; ++i)
			if(this.map.controls[i].displayClass === "olControlDragFeature"){
				if(!active)
					this.map.controls[i].deactivate();
				else
					this.map.controls[i].activate();
				break;
			}
	}

	try{_Prtg.Core.objects.geomapMaxZoomLevel}catch(e){
		$.extend(true,window,{"_Prtg":{Core:{objects:{geomapMaxZoomLevel:15,geomapIconSize:22}}}});
	}

	$.fn.geomap = function (method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.sensortree');
		}
	};

})(jQuery);
