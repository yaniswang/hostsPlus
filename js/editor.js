/*!
 * hostsPlus
 *
 * @author Yanis.Wang<yanis.wang@gmail.com>
 * @site http://alibaba.com
 *
 * @Version: 1.0.0 (build 120408)
 */
(function($, _win, undefined) {
	var editor = $({});
	var codeMirror, $codeMirrorInput;
	var bWorking = false;
	var groupId = 1;


	//编辑器初始化
	var keyMaps = {};
	keyMaps[ctrlKey+'-Q']=function() {
		editor.toogleSelectionLine(true);
	}
	keyMaps[ctrlKey+'-/']=function() {
		editor.toogleSelectionLine();
	}
	keyMaps[ctrlKey+'-G']=function() {
		editor.addNewGroup();
	}
	keyMaps[ctrlKey+'-S']=function() {
		editor.trigger('save');
	}
	editor.init = function() {
		codeMirror = CodeMirror(document.body, {
			lineNumbers: true,
			fixedGutter: true,
			theme: 'Bespin',
			extraKeys: keyMaps,
			onChange: function() {
				if(!bWorking){
					editor.trigger('change');
				}
			}
		});
		codeMirror.focus();	
		$codeMirrorInput = $(codeMirror.getInputField());
		editor._initGutterSelect();
	}

	//初始化多行全选
	editor._initGutterSelect = function() {
		var bGutterSelect = false,
			lastSelect = null;
		var startLine = -1, oldStartLine;
		var $gutter = $(codeMirror.getGutterElement());
		$gutter.on('mousedown', function(e) {
			var curTarget = e.target;
			if (curTarget.tagName === 'PRE') {
				bGutterSelect = true;
				$gutter.css('cursor', 'text');
				startLine = $(curTarget).index();
				if(!e.shiftKey){
					oldStartLine = startLine;
				}
				selectLine(e.shiftKey?oldStartLine:startLine, startLine);
			}
		}).on('mousemove', function(e) {
			var curTarget = e.target;
			if (bGutterSelect && curTarget.tagName === 'PRE' && curTarget !== lastSelect) {
				lastSelect = curTarget;
				selectLine(startLine, $(curTarget).index());
			}
		});
		$(document).on('mouseup', function() {
			if (bGutterSelect) {
				bGutterSelect = false;
				$gutter.css('cursor', 'default');
			}
		});

		function selectLine(startLine, endLine) {
			if (startLine > endLine) {
				var temp = startLine;
				startLine = endLine;
				endLine = temp;
			}
			var endLineLen = codeMirror.getLine(endLine).length;
			//保存滚动现场
			var scrollInfo = codeMirror.getScrollInfo();
			codeMirror.setSelection({
				line: startLine,
				ch: 0
			}, {
				line: endLine,
				ch: endLineLen
			});
			codeMirror.scrollTo(scrollInfo.x, scrollInfo.y);
		}
	}

	//设置编辑器值
	editor.set = function(text) {
		bWorking = true;
		if(codeMirror){
			codeMirror.setValue(text);
			codeMirror.clearHistory();
		}
		bWorking = false;
	}

	//返回编辑结果
	editor.get = function() {
		if(codeMirror)return codeMirror.getValue();
	}

	//设置主题
	editor.setTheme = function(theme){
		if(codeMirror)codeMirror.setOption("theme", theme);
	}

	//切换选区的行状态
	editor.toogleSelectionLine = function(bPlusMode){
		var from = codeMirror.getCursor(true),
			to = codeMirror.getCursor(false);
		editor.toogleLine(from.line, to.line, bPlusMode);
	}

	//切换指定行的开启和关闭
	editor.toogleLine = function(startLine, endLine, bPlusMode) {
		var from = codeMirror.getCursor(true), fromLine = from.line,
			to = codeMirror.getCursor(false), toLine = to.line;
		var bNotLineStart = (from.ch > 0);
		var strLine, match;
		for (var i = startLine; i <= endLine; i++) {
			strLine = codeMirror.getLine(i);
			match = strLine.match(/^\s*(.)(.)/);
			if(match){
				if (match[1] === '#') {
					if(!/^\s*#\s*=+[^=]+=+/.test(strLine) && (!bPlusMode || (bPlusMode && match[2] === '!'))){
						//开启
						strLine = strLine.replace(/^\s*#!?\s*/, function(all){
							var changeLen = all.length;
							if(bNotLineStart && i === fromLine && i === startLine)from.ch-=changeLen;
							if(i === toLine && i === endLine)to.ch-=changeLen;
							return '';
						});
						codeMirror.setLine(i, strLine);
					}
				} else {
					//关闭
					strLine = strLine.replace(/^\s*/, function(all){
						var commentTag = bPlusMode?'#! ':'# ';
						var changeLen = commentTag.length - all.length;
						if(bNotLineStart && i === fromLine && i === startLine)from.ch+=changeLen;
						if(i === toLine && i === endLine)to.ch+=changeLen;
						return commentTag;
					});
					codeMirror.setLine(i, strLine);
				}
			}
		}
		codeMirror.setSelection(from, to);
	}

	//切换光标到指定行
	editor.gotoLine = function(line){
		codeMirror.setCursor({line:line,ch:0});
		var pos = codeMirror.charCoords({line:line,ch:0}, 'local');
		codeMirror.scrollTo(pos.x, pos.y);
	}

	//新建分组
	editor.addNewGroup = function(){
		var fromLine = codeMirror.getCursor(true).line, strLine, strPrevLine;
		var regGroup = /^\s*#\s*=+[^=]+=+/;
		strLine = codeMirror.getLine(fromLine);
		if(fromLine>0){
			strPrevLine = codeMirror.getLine(fromLine-1);
		}
		if(fromLine === 0 || !(regGroup.test(strLine) || regGroup.test(strPrevLine))){
			var strGroupId = 'group ' + groupId++;
			codeMirror.setLine(fromLine, '\r\n# ==================== ' + strGroupId + ' ====================\r\n' + strLine);
			codeMirror.setSelection({line:fromLine+1, ch:23}, {line:fromLine+1, ch:23 + strGroupId.length});
		}
	}

	_win.editor = editor;
})(jQuery, window);