﻿// _Prtg.LookupsDonut.js
(function($, window, document, undefined) {
  _Prtg.Graphixs = _Prtg.Graphixs || { "___": '_Prtg.Graphixs' };
  $.extend(true, _Prtg.Graphixs, {
    LookupsDonut: function LookupsDonut(placeholderName, configuration){
      var self = this;

      this.placeholderName = placeholderName;
      this.pointer = [
        {"x":0,"y":-0.8},
        {"x":0.04,"y":0.05},
        {"x":0.03,"y":0.1},
        {"x":-0.03,"y":0.1},
        {"x":-0.04,"y":0.05},
        {"x":0,"y":-0.8}
      ];

      this.configure = function(configuration)
      {
        this.config = configuration;

        this.config.count = configuration.lookups.length;
        this.config.size = this.config.size * 0.9;

        this.config.radius = (this.config.size * 0.97 / 2) *0.85;
        this.config.innerradius = this.config.radius * 0.66;
        this.config.cx = this.config.size / 2;
        this.config.cy = this.config.size / 2;
        this.config.greenColor 	= "status3";
        this.config.yellowColor = "status4";
        this.config.redColor 	= "status5";
        this.config.grayColor 	= "status0";
        this.config.colors
        this.config.squarert    = Math.ceil(Math.sqrt(this.config.lookups.length));
        this.config.square =  this.config.squarert*this.config.squarert;
        this.render = function(){};
        if(!this.config.lookups || this.config.lastvalueraw === undefined)
          return;
        else if(this.config.lookups[0][4]==3)
            this.render = this.renderBoolean;
        else if(this.config.lookups[0][4]==1)
          this.render = this.renderBitfield;
        else
          this.render = this.renderDonut;
      };
      this.renderBoolean = function(){
        var color = {"0": self.config.grayColor, "1":self.config.greenColor,"2":self.config.redColor,"3":self.config.yellowColor}
          , map = [3,0,2,1]
          , data = []
          , x = this.config.squarert
          , z = ~~(this.config.size*0.8 / this.config.squarert)
          , s = ~~(z/10)
          , html = '<div class="boolean gauge" style="width:'+self.config.size+'px;height:'+self.config.size+'px;"><div class="status">';

          this.config.lookups.forEach(function(d,i){
            if((''+self.config.lastvalue).toLowerCase() == d[1].toLowerCase())
              html += '<div class="current"';
            else
              html += '<div class="other"';
            html += ' title="'+d[1]+'""><div class="'+color[d[2]]+'" /></div>';
          });

          $(this.placeholderName).html(html
          // '<div class="boolean" style="width:'+self.config.size+'px;height:'+self.config.size+'px;">'
          //   +'<div class="status ' +(currentlookup[5]!==''?'expected':'unexpected')+ '">'
          //     +'<div class="unexpected" title="' +(currentlookup[5]==''?currentlookup[1]:otherlookup[1])+ '"><div style="background-color:'+color[(currentlookup[5]==''?currentlookup[2]:otherlookup[2])]+'" /></div>'
          //     +'<div class="expected" title="' +(currentlookup[5]!==''?currentlookup[1]:otherlookup[1])+ '"><div style="background-color:'+color[(currentlookup[5]==''?currentlookup[2]:otherlookup[2])]+'" /></div>'
            +'</div></div>'
          );
      };

      this.renderBitfield = function(value){
        var color = {"0": self.config.grayColor, "1":self.config.greenColor,"2":self.config.redColor,"3":self.config.yellowColor}
          , map = [3,0,2,1]
          , data = []
          , x = this.config.squarert
          , z = ~~(this.config.size*0.8 / this.config.squarert)
          , s = ~~(z/10)
          , svg = d3.select(this.placeholderName).append("svg")
              .attr({
                  class: "gauge",
                  width: this.config.size,
                  height:this.config.size
              })
              .append('g')
              .attr({
                transform: function(){return 'translate('+self.config.size * 0.1+','+self.config.size * 0.1+')';}
              });
        data.length = this.config.square;
        this.config.lookups.forEach(function(d,i){

            data[i] = {
                color: color[d[2]],
                title: d[1],
                on: (((self.config.lastvalueraw & +d[0]) > 0) || (self.config.lastvalueraw === 0 && +d[0] === 0))
              };
        });
        svg.selectAll('rect')
          .data(data)
          .enter()
          .append('rect')
            .attr({
              class: function(d) { return (!!d && d.color?d.color:null); },
              transform: function(d,i){return "translate(" + (i % x) * z + "," + ~~(i / x) * z + ")";},
              width: z-s,
              height: z-s,
              rx:~~(z/2),
              ry:~~(z/2),
              title: function(d){return (!!d && d.title) || "";}
            })
            .style({
                "fill-opacity": function(d) { return (!!d && d.color?d.on?null:0:0); },
                "stroke-width": s
                // "fill": function(d) { return (!!d && d.color?d.color:null); },
                // "fill-opacity": function(d) { return (!!d && d.color?d.on?null:0.5:0); },
                // "stroke": function(d){return !!d && d.color?d.color:null;},
                // "stroke-width": s

              });
      };
      this.renderDonut = function(value){
        var color = {"0": self.config.grayColor, "1":self.config.greenColor,"2":self.config.redColor,"3":self.config.yellowColor}
          , map = [3,0,2,1]
          , data = {}
          , count = 0
          , acount = 0
          , gap = 0
          , arc = d3.svg.arc()
                .outerRadius(this.config.radius)
                .innerRadius(this.config.innerradius)
          , svg = d3.select(this.placeholderName).append("svg")
                .attr({
                    class: "gauge",
                    width: this.config.size,
                    height: this.config.size
                });
        this.config.lookups.forEach(function(e){
          if(!data.hasOwnProperty(e[2])){
            data[e[2]] = {
              lookups: [e]
            };
            ++count;
          }else{
            data[e[2]].lookups.push(e);
          }
        });

        var angle = null
          , pie = d3.layout.pie()
              .sort(function(a, b) {
                 return d3.ascending(map[a[2]], map[b[2]]) || d3.ascending(parseInt(a[0], 10), parseInt(b[0], 10));})
              .value(function(d) {return 1;})
          , a = svg.append("g")
              .attr("transform", "translate(" + this.config.cx + "," + this.config.cy + ")")
          , g = a.selectAll(".arc")
              .data(pie(self.config.lookups))
              .enter().append("g")
              .attr("class", "arc lookups");
        acount++;
        g.append("path")
            .attr("d", arc)
            .attr("class", function(d,i) {
              switch(d.data[4]){
                case "1":
                  if((self.config.lastvalueraw & d.data[0]) == d.data[0])
                      angle= (d.startAngle + d.endAngle) / 2;
                  break;
                case "2":
                  if(self.config.lastvalueraw >= d.data[0] && self.config.lastvalueraw <= d.data[3])
                      angle= (d.startAngle + d.endAngle) / 2;
                  break;
                default:
                  if((''+self.config.lastvalueraw) == d.data[0].toLowerCase())
                      angle= (d.startAngle + d.endAngle) / 2;
                  break;
                }
              return color[d.data[2]]; })
            .style("stroke","#f3f2f2")
            .style("stroke-width","2px")
            .append("svg:title")
            .text(function(d){return d.data[1];});

        if(!!angle)
          this.drawPointer(
            svg.append("svg:g")
              .attr("class", "pointerContainer")
              .attr("transform","translate(" + self.config.cx + "," + self.config.cy + ") rotate("+ (angle * 180 / Math.PI) +")")
              ,self.config.radius*1.3);
      };

      this.drawPointer = function(pointerContainer,radius)
      {
        pointerContainer.selectAll("path")
          .data([self.pointer])
          .enter()
            .append("svg:path")
                .attr("class", "needle")
                .attr("d", d3.svg.line()
                  .x(function(d) { return d.x*radius;})
                  .y(function(d) { return d.y*radius;})
                  .interpolate("basis")
                  );
      };

      this.configure(configuration);
    }
  });
})(jQuery,window,document);
