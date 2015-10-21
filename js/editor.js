/*!
 * hostsPlus
 *
 * @author Yanis.Wang<yanis.wang@gmail.com>
 *
 */
(function($, _win, undefined) {
	var editor = $({});
	var codeMirror, $codeMirrorInput;
	var bWorking = false;
	var groupId = 1;

	editor.init = function() {

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
		keyMaps[ctrlKey+'-S']=editor.save;
		keyMaps['Shift-'+ctrlKey+'-F']=function(){
			editor.format();
		};

		codeMirror = CodeMirror(document.body, {
			lineNumbers: true,
			fixedGutter: true,
			theme: 'Bespin',
			extraKeys: keyMaps
		});
		codeMirror.focus();
		codeMirror.on('change', function(){
				if(!bWorking){
					editor.trigger('change');
				}
			});
		$codeMirrorInput = $(codeMirror.getInputField());
		$codeMirrorInput.on('keydown', function(e){
			var keyName = String.fromCharCode(e.keyCode);
			//屏蔽无效控制键
			if(e.ctrlKey && keyName && /^[^qyasgzcxv/]$/i.test(keyName) && e.which !== 9){
				return false;
			}
		});
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

	//是否可撤销
	editor.bChanged = function(){
		return codeMirror.historySize().undo>0;
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
		codeMirror.scrollTo(pos.left, pos.top);
	}

	//获取屏幕和光标
	editor.getBookmark = function(){
		var scrollInfo = codeMirror.getScrollInfo(),
			cursorInfo = codeMirror.getCursor();
		return {
			x: scrollInfo.left,
			y: scrollInfo.top,
			line:cursorInfo.line,
			ch:cursorInfo.ch
		};
	}

	//还原屏幕和光标
	editor.setBookmark = function(bookmark){
		codeMirror.scrollTo(bookmark.x, bookmark.y);
		codeMirror.setCursor({line:bookmark.line,ch:bookmark.ch});
	}

	//在当前位置新建分组
	editor.addNewGroup = function(){
		var fromLine = codeMirror.getCursor(true).line, strLine;
		var regGroup = /^\s*#\s*=+[^=]+=+/;
		strLine = codeMirror.getLine(fromLine);

		var strGroupId = 'group ' + groupId++;
		codeMirror.setLine(fromLine, '\r\n# ==================== ' + strGroupId + ' ====================\r\n\r\n' + strLine);
		codeMirror.setSelection({line:fromLine+1, ch:23}, {line:fromLine+1, ch:23 + strGroupId.length});
	}

	// 格式化hosts
	editor.format = function(){
		codeMirror.eachLine(function(lineInfo){
			var lineNumber = codeMirror.getLineNumber(lineInfo);
			var text = lineInfo.text;
			text = text.replace(/^\s*(#!?)?\s*([^\s]+)\s+(.+)/, function(all, comment, ip, others){
				if(isIp(ip)){
					var ipLen = /:/.test(ip) ? 39: 15;
					var space = new Array(ipLen-ip.length+2).join(' ');
					return (comment?comment+' ':'') + ip + space + others;
				}
				return all;
			});
			codeMirror.setLine(lineNumber, text);
		});
	}

	// 保存编辑
	editor.save = function(){
		codeMirror.clearHistory();
		editor.trigger('save');
	}

	_win.editor = editor;
})(jQuery, window);