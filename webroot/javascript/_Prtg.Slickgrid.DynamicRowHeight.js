﻿(function ($) {
	$.extend(true, window, {
		"Slick": {
			"DynamicRowHeight": DynamicRowHeight
		}
	});
  var h;
	function DynamicRowHeight(grid) {
		//		var _grid = grid,
		//			self._positions,
		//			self._heights,
		//			_dynamic = this;

		/// SlickGrid overrides
		function appendRowHtml(stringArray, row) {
			var d = getDataItem(row);
			var dataLoading = row < getDataLength() && !d;
			var cellCss;
			var rowCss = "slick-row " +
					(dataLoading ? " loading" : "") +
					(row % 2 == 1 ? ' odd' : ' even');
      var colspan;

      stringArray.push("<div class='" + rowCss + "' row='" + row + "' style='min-height:"+d._estimatedHeight + "px'><row>");

			for (var i = 0, cols = columns.length; i < cols; i++) {
				var m = columns[i];
				colspan = d._colSpan();  // TODO:  don't calc unless we have to
				if (colspan > 1) {
					cellCss = "slick-cell lr l" + i + " r" + Math.min(columns.length - 1, i + colspan - 1) + (m.cssClass ? " " + (typeof(m.cssClass)==="function"?m.cssClass(d):m.cssClass) : "");
				}
				else {
					cellCss = "slick-cell lr c" + i + (!!m.cssClass ? " " + (typeof(m.cssClass)==="function"?m.cssClass(d):m.cssClass) : "");
				}

				if (row === activeRow && i === activeCell) {
					cellCss += (" active");
				}

				// TODO:  merge them together in the setter
				for (var key in cellCssClasses) {
					if (cellCssClasses[key][row] && cellCssClasses[key][row][m.id]) {
						cellCss += (" " + cellCssClasses[key][row][m.id]);
					}
				}

				stringArray.push("<div class='" + cellCss + " children" + (d.groupnum +''+d.devicenum) + "'>");

				// if there is a corresponding row (if not, this is the Add New row or this data hasn't been loaded yet)
				if (d) {
					stringArray.push(getFormatter(row, m)(row, i, d[m.field], m, d));
				}

				stringArray.push("</div>");

				if (colspan)
					i += (colspan - 1);
			}

			stringArray.push("</row></div>");
		}

		function asyncPostProcessRows() {
			var i = postProcessFromRow;
			var j = postProcessToRow;
			var range = {}, haselements = false;
			while (i <= j) {
				var row = (scrollDir >= 0) ? i++ : j--,
								rowNode = rowsCache[row],
								d = getDataItem(row),
								l = !d || d.leafs;
				if (!rowNode || !d || row >= getDataLength()) { continue; }
				range[d.objid] = row;
				haselements = true;
			}
			if(haselements){
				self.asyncPostProcessRange(range);
			}
		}

		function asyncPostProcessRangeV0(range) {
			var asyncCols = [];
			var content = '';
			var fragment = document.createDocumentFragment();

			for (var i = 0, j = 0, l = columns.length; i < l; ++i) {
				var m = columns[i];
				if (m.asyncPostRender)
					break;
				++j;
			}

			$.each(range, function (idx, row) {
				var rowNode = rowsCache[row];
				if (!rowNode || row >= getDataLength()) {
					return //continue;
				}

				var d = getDataItem(row)
					, cellNodes = rowNode.firstChild.childNodes;
				if (cellNodes.length > j) {
					content = m.asyncPostRender(cellNodes[j], row, d, m); //, self.layout);
					if (content.length) {
						rowNode = fragment.appendChild(rowNode.cloneNode(true));
						cellNodes = rowNode.firstChild.childNodes;
						cellNodes[j].innerHTML = content;
						rowsCache[row].parentNode.replaceChild(rowNode, rowsCache[row]);
						rowsCache[row] = rowNode;
					}
				}
			});
			self.onRefreshLeafs.notify();
		}


		function asyncPostProcessRangeV1(range) {
			// var asyncCols = [];
			var content = '';
			var m = columns[1];
			var r = document.createRange();

			$.each(range, function (idx, row) {
				var rowNode = rowsCache[row];
				var sensors = null;
				var cellNodes = null;
				var fragment = null;
				var clone = null;

				if (!rowNode || !rowNode.firstChild || row >= getDataLength()) {
					return //continue;
				}
				sensors = rowNode.firstChild.childNodes[1];
				if (!!sensors){
					content = m.asyncPostRender(sensors, row, getDataItem(row), m);

					if (content.length) {
						fragment = r.createContextualFragment(content);
						sensors.replaceChild(fragment.firstChild, sensors.firstChild);
					}
				}
			});
			self.onRefreshLeafs.notify();
		}
		function cleanupRows(rangeToKeep) {
			for (var i in rowsCache) {
				if (((i = parseInt(i, 10)) < rangeToKeep.top || i > rangeToKeep.bottom)) {
					removeRowFromCache(i);
				}
			}
		}
		function createCssRules() {
			$style = $("<style type='text/css' rel='stylesheet' name="+$.now()+"/>").appendTo($("head"));
			var rules = [];
			for (var i = 0, x = 0, w=0; i < columns.length; i++) {
				w = parseInt(columns[i].width);
				if(!isNaN(w)){
          i===0 && rules.push(("." + uid + " .c" + i + ", ." + uid + " .treeItem {min-width: "+w+"px;}"));
          i!==0 && rules.push(("." + uid + " .c" + i + "{max-width: "+w+"px;}"));
          i!==0 && rules.push(("." + uid + ".large sensor{width: "+(w-10)+"px;}"));
					rules.push(("." + uid + " .r" + i + " { width:" + (x+w +(i===1?3:0)) + "px; }"));
					x += w;
				}
			}
			rules.push(("." + uid + " .l0 { width:" +x+3+ "px;}"));
			if ($style[0].styleSheet) { // IE
				$style[0].styleSheet.cssText = rules.join(" ");
			}
			else {
				$style[0].appendChild(document.createTextNode(rules.join(" ")));
			}

			var sheets = document.styleSheets;
			for (var i = 0; i < sheets.length; i++) {
				if ((sheets[i].ownerNode || sheets[i].owningElement) == $style[0]) {
					stylesheet = sheets[i];
					break;
				}
			}
		}
		function getCellFromPoint(x, y) {
			var row = Math.floor((y + offset) / options.rowHeight);
			var cell = 0;

			var w = 0;
			for (var i = 0; i < columns.length && w < x; i++) {
				w += columns[i].width;
				cell++;
			}

			if (cell < 0) {
				cell = 0;
			}

			return { row: row, cell: cell - 1 };
		} //TODO: new calculation needed
		function getCellNodeBox(row, cell) {
			if (!cellExists(row, cell))
				return null;

			var y1 = row * options.rowHeight - offset;
			var y2 = y1 + options.rowHeight - 1;
			var x1 = 0;
			for (var i = 0; i < cell; i++) {
				x1 += columns[i].width;
			}
			var x2 = x1 + columns[cell].width;

			return {
				top: y1,
				left: x1,
				bottom: y2,
				right: x2
			};
		} //TODO: new calculation needed
		function getCellFromNode(node) {
			// read column number from .l1 or .c1 CSS classes
			var cls = /l\d+/.exec(node.className) || /c\d+/.exec(node.className);
			if (!cls)
				throw "getCellFromNode: cannot get cell - " + node.className;
			return parseInt(cls[0].substr(1, cls[0].length - 1), 10);
		}

		function getCellFromEvent(e) {
			var $cell = $(e.target).closest(".slick-cell", $canvas);
			if (!$cell.length)
				return null;

			return {
				row: $cell.parent().parent().attr("row") | 0,
				cell: getCellFromNode($cell[0])
			};
		}
		function getCellNode(row, cell) {
			if (rowsCache[row]) {
				var cells = $(rowsCache[row].firstChild).children();
				var nodeCell;
				for (var i = 0; i < cells.length; i++) {
					nodeCell = getCellFromNode(cells[i]);
					if (nodeCell === cell) {
						return cells[i];
					}
					else if (nodeCell > cell) {
						return null;
					}

				}
			}
			return null;
		}

		function getColspan(rowData, layout) {
			return rowData._colSpan();
		}

		function getRenderedRange(visibleRange) {
			var range = !!visibleRange ? visibleRange : getVisibleRange(),
					buffer = _Prtg.Core.objects.deviceCache;

			range.top -= buffer;
			range.bottom += buffer;
			range.top = Math.max(0, range.top);
			range.bottom = Math.min(getDataLength() - 1, range.bottom);
			return range;
		}
		function getVisibleRange(viewportTop) {
			if (viewportTop == null)
				viewportTop = scrollTop;
			return self.getTopAndBottom(scrollTop + offset, scrollTop + offset + viewportH);
		}
		function render() {
			var visible, rendered, top, bottom, buffer;
			buffer = _Prtg.Core.objects.deviceCache / 4
			visible = getVisibleRange();
			rendered = getRenderedRange({top: visible.top, bottom: visible.bottom});
			if(!lastrenderedRows
			|| (visible.top - lastrenderedRows.top) < buffer
			|| (lastrenderedRows.bottom - visible.bottom) < buffer){
					// remove rows no longer in the viewport
					cleanupRows(rendered);

					// add new rows
					renderRows(rendered);

					lastrenderedRows = rendered;
					postProcessFromRow = visible.top;
					postProcessToRow = visible.bottom; //Math.min(options.enableAddRow ? getDataLength() : getDataLength() - 1, visible.bottom);
					startPostProcessing();

					lastRenderedScrollTop = scrollTop;
					h_render = null;
					self.onPostRender.notify();
			}
		}

		function renderRowsV0(range) {
			var i, l,
				parentNode = $canvas[0],
				rowsBefore = renderedRows,
				stringArray = [],
				rows = [],
				startTimestamp = new Date(),
				needToReselectCell = false;
			//			self.layout = !$(parentNode).closest('.slickTree').is('.tiny');
			for (i = range.top; i <= range.bottom; i++) {
				if (rowsCache[i]) { continue; }
				renderedRows++;
				rows.push(i);
				appendRowHtml(stringArray, i);
				if (activeCellNode && activeRow === i) {
					needToReselectCell = true;
				}
				counter_rows_rendered++;
			}
			var x = document.createElement("div");
			x.innerHTML = stringArray.join("");
			var insert = (scrollDir === -1) ? parentNode.childNodes.length > 1 ? parentNode.childNodes[1] : null : null;

			for (i = 0, l = x.childNodes.length; i < l; i++) {
				rowsCache[rows[i]] = parentNode.insertBefore(x.firstChild, insert);
			}

			updateRowPositions();

			if (needToReselectCell) {
				activeCellNode = getCellNode(activeRow, activeCell);
			}

			if (renderedRows - rowsBefore > 5) {
				avgRowRenderTime = (new Date() - startTimestamp) / (renderedRows - rowsBefore);
			}
		}

		function renderRowsV1(range) {
			var i, l,x,
				parentNode = $canvas[0],
				rows = [],
				needToReselectCell = false,
				nodes = [],
				stringArray = [],
				r = document.createRange(),
				insert = (scrollDir === -1) ? parentNode.childNodes.length > 1 ? parentNode.childNodes[1] : null : null;

			for (i = range.top; i <= range.bottom; i++) {
				if (!!rowsCache[i]) { continue; }
				stringArray = [];
				renderedRows++;
				rows.push(i);
				appendRowHtml(stringArray, i);
				x = r.createContextualFragment(stringArray.join(""));
				rowsCache[i] = parentNode.insertBefore(x.firstChild, insert);
				counter_rows_rendered++;
			}
			updateRowPositions();
		}

		function scrollRowIntoView(row, doPaging) {
			var rowAtTop = self._positions[row];
			scrollTo(rowAtTop);
			render();
			return;
			var rowAtBottom = !!self._positions[row + 1]
							? self._positions[row + 1] - viewportH + (viewportHasHScroll ? scrollbarDimensions.height : 0)
							: null;
			// need to page down?
			if (!!self._positions[row + 1] && self._positions[row + 1] > scrollTop + viewportH + offset) {
				scrollTo(doPaging ? rowAtTop : rowAtBottom);
				render();
			}

			// or page up?
			else if (self._positions[row] < scrollTop + offset) {
				scrollTo(doPaging ? rowAtBottom : rowAtTop);
				render();
			}
		}
		function updateRowCount() {
			var newRowCount = getDataLength() + (options.enableAddRow ? 1 : 0) + (options.leaveSpaceForNewRows ? numVisibleRows - 1 : 0);
			var oldH = h;
			// remove the rows that are now outside of the data range
			// this helps avoid redundant calls to .removeRow() when the size of the data decreased by thousands of rows
			var l = options.enableAddRow ? getDataLength() : getDataLength() - 1;
			for (var i in rowsCache) {
				if (i >= l) {
					removeRowFromCache(i);
				}
			}
			if (options.fullHeight) {
				self.fullHeight();
			}
			th = Math.max(self._positions[self._positions.length - 1], viewportH - scrollbarDimensions.height);
			if (th < maxSupportedCssHeight) {
				// just one page
				h = ph = th;
				n = 1;
				cj = 0;
			}
			else {
				// break into pages
				h = maxSupportedCssHeight;
				ph = h / 100;
				n = Math.floor(th / ph);
				cj = (th - h) / (n - 1);
			}

			if (h !== oldH && !options.fullHeight && h > 0) {
				$canvas.css("height", h);
				scrollTop = $viewport[0].scrollTop;
			}

			var oldScrollTopInRange = (scrollTop + offset <= th - viewportH);

			if (th === 0 || scrollTop === 0) {
				page = offset = 0;
			}
			else if (oldScrollTopInRange) {
				// maintain virtual position
				scrollTo(scrollTop + offset);
			}
			else {
				// scroll to bottom
				scrollTo(th - viewportH);
			}

			if (h != oldH && options.fullHeight) {
				self.fullHeight();
			}
		}
		function updateRowPositions() {
			var rows = $canvas[0].childNodes,
				row = !rows[1] || parseInt(rows[1].getAttribute('row'));
			if (row !== true)
				rows[0].style.height = (self._positions[row] - offset) + "px";

		}

		/// Local functions
		function resizeCanvas() {
			if (options.autoHeight) {
				viewportH = options.rowHeight * (getDataLength() + (options.enableAddRow ? 1 : 0) + (options.leaveSpaceForNewRows ? numVisibleRows - 1 : 0));
			}
			else {
				viewportH = getViewportHeight();
			}
			if (!!options.fullHeight) {
				self.fullHeight();
			}

			numVisibleRows = Math.ceil(viewportH / options.rowHeight);
			viewportW = parseFloat($.css($container[0], "width", true));

			// var w = 0, i = columns.length;
			// while (i--) {
			// 	w += columns[i].width;
			// }
			// setCanvasWidth(w);

			updateRowCount();
			render();
		}


		function updateCanvasHeight() {
			if (options.fullHeight) {
				self.fullHeight();
			}
			var oldH = h;
			th = Math.max(self._positions[self._positions.length - 1], viewportH - scrollbarDimensions.height);
			if (th < maxSupportedCssHeight) {
				// just one page
				h = ph = th;
				n = 1;
				cj = 0;
			}
			else {
				// break into pages
				h = maxSupportedCssHeight;
				ph = h / 100;
				n = Math.floor(th / ph);
				cj = (th - h) / (n - 1);
			}

			if (h !== oldH && !options.fullHeight && h > 0) {
				$canvas.css("height", h);
				scrollTop = $viewport[0].scrollTop;
			}

		}
		function getTopAndBottom(top, bottom) {
			var _positions = this._positions,
				l = getDataLength(),
				i = 0,
				ret = { top: -1, bottom: -1 };
			while (i < l && _positions[i + 1] < top) ++i;
			ret.top = i;
			while (i < l && _positions[i] < bottom) ++i;
			ret.bottom = i;
			return ret;
		}
		function calculatePositions(start, stop) {
			var d, i;
			stop = getDataLength();
			if (!start) start = 0;
			for (i = start; i < stop; ++i) {
				d = getDataItem(i);
				this._positions[i + 1] = this._positions[i] + d._estimatedHeight;
			}
			this.updateCanvasHeight();
		}

		function initializeHeights(start, stop, all) {
			var d, i;
			if (!stop || stop > getDataLength()) stop = getDataLength();
			if (!start) start = 0;
			this._positions[0] = 0;
			for (i = start; i < stop; ++i) {
				d = getDataItem(i);
				if (d._changed || all)
					this._positions[i + 1] = this._positions[i] + d.estimatedHeight();
				else
					this._positions[i + 1] = this._positions[i] + d._estimatedHeight;
			}
			this.calculatePositions(stop);
			return true;
		}
		function parentHeight(){
			var parentH = null;
			try{
				parentH =  window.innerHeight
								- self.footer.offsetHeight
								+ (self.buttons ? self.buttons.offsetHeight : 0)
							 	- ($viewport.parent().is('.libTree') ? ($viewport.offset().top) : 0);
			}catch(e){
				parentH = $viewport.parents('.map_object').height();
			}
			return parentH;
		}
		function fullHeight() {
			var parentH = this.parentHeight();
			viewportH = this._positions[self._positions.length - 1] + 4;
			viewportH = parentH - viewportH > 0 ? parentH : viewportH;
			viewportH = viewportH < 640 ? 640 : viewportH;
			return viewportH;
		}

		function init(grid) {
			var modernDom = !!document.createRange().createContextualFragment && !window.winGUI ;
			// SlickGrid overrides
			grid.eval("self._positions=[]");
			grid.eval("self._heights=[]");
			grid.eval("self._rows=[]");
			grid.eval("self.onRefreshLeafs = new Slick.Event()");
			grid.eval("self.onPostRender = new Slick.Event()");
			grid.eval("self.footer = document.getElementsByTagName('footer')");
			grid.eval("self.buttons = document.getElementById('sensortreelinks')");

			grid.eval("cleanupRows=" + cleanupRows.toString());
			grid.eval("createCssRules=" + createCssRules.toString());
			grid.eval("createCssRules()");
			grid.eval("appendRowHtml=" + appendRowHtml.toString());
			grid.eval("asyncPostProcessRows=" + asyncPostProcessRows.toString());
			grid.eval("getCellFromEvent=" + getCellFromEvent.toString());
			grid.eval("getCellFromNode=" + getCellFromNode.toString());
			grid.eval("getCellNode=" + getCellNode.toString());
			grid.eval("getColspan=" + getColspan.toString());
			grid.eval("getRenderedRange=" + getRenderedRange.toString());
			grid.eval("getVisibleRange=self.getViewport=" + getVisibleRange.toString());
			grid.eval("render=" + render.toString());
			grid.eval("self.parentHeight=" + parentHeight.toString());
			grid.eval("self.fullHeight=" + fullHeight.toString());
			grid.eval("renderRows=" + (modernDom ? renderRowsV1.toString() :renderRowsV0.toString()));
			grid.eval("self.scrollRowIntoView = scrollRowIntoView=" + scrollRowIntoView.toString());
			grid.eval("updateRowPositions=self.updateRowPositions=" + updateRowPositions.toString());
			grid.eval("updateRowCount=" + updateRowCount.toString());
			grid.eval("var calculatePositions = self.calculatePositions=" + calculatePositions.toString());
			grid.eval("var updateCanvasHeight = self.updateCanvasHeight=" + updateCanvasHeight.toString());

			// Local functions
			grid.eval("self.getTopAndBottom=" + getTopAndBottom.toString());
			grid.eval("var initializeHeights = self.initializeHeights=" + initializeHeights.toString() + ";");
			grid.eval("self.asyncPostProcessRange=" + (modernDom ? asyncPostProcessRangeV1.toString() : asyncPostProcessRangeV0.toString()));
		};
		//Plugin
		function destroy() { };
		$.extend(this, {
			"init": init,
			"destroy": destroy
		});
	}
})(jQuery);
