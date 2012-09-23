/*!
 * jDialog
 *
 * @author Yanis.Wang<yanis.wang@gmail.com>
 *
 */
(function($,_win,_doc,undefined){

	var defaults={title:'提示',type:'text',skin:'default',position:{'left':'center','top':'center'},focus:'mousedown',shadow:4,time:0,noTitle:false,noBorder:false,fixed:false,drag:false,modal:false,animate:300};//默认设置

	var jDialog=function(){
		var _this=this;
		_this.init.apply(_this,arguments);
	};
	jDialog.version='1.0.0';
	jDialog.settings=defaults;

	//读JS当前路径
	var jsRoot=$('script:last')[0].src.replace(/[^\/]+$/,'');
	if(!jsRoot.match(/^https?/i))jsRoot=location+jsRoot;


	//初始化jDialog
	var isIE=$.browser.msie,browVer=$.browser.version,isIE6=isIE&&browVer<7,isTouch=('ontouchend' in _doc);;
	var $win=$(_win),_docElem,_body;
	var $modalMask,$dragMask;
	var arrTopZindex=[99000,100000];//遮盖层上下的zIndex
	var arrModalDailog=[],modalCount=0;
	//遮盖控制
	function showModal(dialog){
		if(arrModalDailog.length==0)$modalMask.show();
		$modalMask.css('zIndex',dialog.zIndex);
		arrModalDailog.push(dialog);
		modalCount++;
	}
	function hideModal(){
		arrModalDailog.pop();
		modalCount--;
		modalCount==0?$modalMask.hide():$modalMask.css('zIndex',arrModalDailog[arrModalDailog.length-1].zIndex);
	}
	$(function(){
		_docElem=_doc.documentElement;
		_body=_doc.body;
		//加载全局样式
		$('head').append("<style>.jDialog{position:absolute;}.dd_shadow{position:absolute;background:#000;}.dd_mask{position:fixed;top:0;left:0;height:100%;width:100%;background-color:#000;opacity:.2;filter:alpha(opacity=20);_position:absolute;_height:expression(Math.max(document.documentElement.clientHeight,document.documentElement.scrollHeight)+'px');_width:expression(Math.max(document.documentElement.clientWidth,document.documentElement.scrollWidth)+'px');}.dd_drag{cursor:move;user-selec:none;-moz-user-selec:none;-webkit-user-select:none;}.dd_wait{width:100%;height:100%;}.dd_dragMask{display:none;position:fixed;cursor:move;z-index:99999999999;top:0;left:0;height:100%;width:100%;background-color:#000;opacity:0;filter:alpha(opacity=0);_position:absolute;_height:expression(Math.max(document.documentElement.clientHeight,document.documentElement.scrollHeight)+'px');_width:expression(Math.max(document.documentElement.clientWidth,document.documentElement.scrollWidth)+'px');}.dd_content{word-break:break-all;word-wrap:break-word;}.dd_info{padding:20px;}.dd_button{text-align:right;padding:6px 10px;background:#F6F6F6;border-top:1px solid #EBEBEB;}.dd_button button{margin-right:5px;padding:2px 10px;vertical-align: bottom;}</style>");
		$modalMask=$('<div class="dd_mask" style="display:none"></div>').appendTo('body');//模式遮罩
		$dragMask=$('<div class="dd_dragMask"></div>').appendTo('body');//fix拖动时被iframe影响的问题
		//修正IE6在fixed模式下抖动问题
		isIE6 && $(_body).css('backgroundAttachment') !== 'fixed' && $('html').css({backgroundImage: 'url(about:blank)',backgroundAttachment: 'fixed'});
		//Esc隐藏模式窗口
		$(_doc).keydown(function(e){
			if(e.which===27){
				if(modalCount>0){
					var dialog=arrModalDailog[modalCount-1];
					if(!dialog.settings.noClose)dialog.hide();
					return false;
				}
			}
		});
	});

	jDialog.prototype={
		//初始化对话框
		init:function(options,callback){
			var _this=this;
			_this.bShow=false;
			var settings=_this.settings=$.extend({},jDialog.settings,options);
			if((isIE&&browVer<9&&settings.corner)||isIE6)settings.animate=false;//IE6,7,8 tip模式或者IE6强制关闭动画
			if(isTouch)settings.fixed=false;//触摸屏浏览器不支持fixed模式，强制改为绝对定位
			var $wrap=$('<div class="dd_'+settings.skin+'"></div>').appendTo('body');
			var $dialog=_this.$dialog=$('<div style="display:none;'+(settings.noBorder?'border:none':'')+'" class="jDialog">'+(!settings.noTitle?'<div class="dd_title">标题</div>':'')+'<span title="关闭'+(_this.settings.modal?' (Esc)':'')+'" class="dd_close"'+(settings.noClose?' style="display:none"':'')+'>×</span><div class="dd_content"></div></div>').appendTo($wrap);
			var $title=_this.$title=$dialog.find('.dd_title');
			_this.$titletext=$dialog.find('.dd_title');
			var $content=_this.$content=$dialog.find('.dd_content');
			var $shadow=_this.$shadow=$('<div style="display:none;" class="dd_shadow"></div>').appendTo($wrap).css('opacity',0.15);
			_this.setTitle(settings.title).setContent(settings.content);
			//初始化corner
			var corner=settings.corner;
			if(corner){
				var arrCorner=corner.match(/[a-z]+|[A-Z][a-z]+|\d+/g),cornerSide=arrCorner[0],cornerPosition=arrCorner[1],distance=arrCorner[2]?parseInt(arrCorner[2]):0,centerName=cornerSide.match(/top|bottom/)?'left':'top';
				var $corner=_this.$corner=$('<div class="dd_corner dd_corner_'+cornerSide+'" style="'+cornerSide+':-20px;'+(cornerPosition=='Center'?centerName+':50%;margin-'+centerName+':-10px;':(cornerPosition+':'+distance+'px;'))+'"></div>').appendTo($dialog);
				var x=0,y=0,dialogWidth=$dialog.outerWidth(),dialogHeight=$dialog.outerHeight();
				var s1=cornerSide.substr(0,1),p1=cornerPosition.substr(0,1),d=distance+11;
				if(s1.match(/[tb]/)){//上下
					if(s1=='t')y=10;
					else y=-(dialogHeight+10);
					if(p1=='L')x=-d;
					if(p1=='C')x=-(dialogWidth/2);
					if(p1=='R')x=-(dialogWidth-d);
				}
				if(s1.match(/[lr]/)){//左右
					if(s1=='l')x=10;
					else x=-(dialogWidth+10);
					if(p1=='T')y=-d;
					if(p1=='C')y=-(dialogHeight/2);
					if(p1=='B')y=-(dialogHeight-d);
				}
				_this.offsetFix={x:x,y:y};//坐标偏移
			}
			//绑定事件
			var focus=settings.focus;
			if(focus)$dialog.bind(focus+' touchstart',function(){_this.setTopLayer();});//鼠标点击提升到最上层
			$dialog.find('.dd_close').bind('click touchend',function(){_this.hide();return false;});//关闭按钮
			var drag=settings.drag,shadow=settings.shadow;
			if(drag){
				(drag=='all'?$dialog:$title).addClass('dd_drag').bind({'mousedown touchstart':function(e){
					if(e.target.className=='dd_close')return;
					if(e.type.substr(0,5)=='touch')e=e.originalEvent.targetTouches[0];
					_this.bDrag=true;
					var offset=$dialog.offset();
					_this.lastDragOffset={x:e.pageX-offset.left,y:e.pageY-offset.top};
					$dragMask.show();
					if(e.preventDefault)e.preventDefault();
				},'selectstart':function(){return false;}});//开始拖动
				$(_doc).bind({'mousemove touchmove':function(e){
					if(_this.bDrag){
						if(e.type.substr(0,5)=='touch')e=e.originalEvent.targetTouches[0];
						var scrollLeft=_docElem.scrollLeft||_body.scrollLeft,scrollTop=_docElem.scrollTop||_body.scrollTop;
						var limitLeft=0,limitTop=0,limitRight=_docElem.clientWidth-$dialog.outerWidth(),limitBottom=_docElem.clientHeight-$dialog.outerHeight();

						var lastDragOffset=_this.lastDragOffset;
						var left=e.pageX-lastDragOffset.x,top=e.pageY-lastDragOffset.y;
						if(settings.fixed&&!isIE6){
							left-=scrollLeft;
							top-=scrollTop;
						}
						else{
							limitLeft=scrollLeft;
							limitTop=scrollTop;
							limitRight+=limitLeft;
							limitBottom+=limitTop;
						}
						left=left<limitLeft?limitLeft:(left>limitRight?limitRight:left);
						top=top<limitTop?limitTop:(top>limitBottom?limitBottom:top);

						if(!isIE6||!corner){
							$dialog.css('opacity',0.5);
							$shadow.hide();
						}
						$dialog.css({left:left,top:top});
						$shadow.css({left:left+shadow,top:top+shadow});
						if(isIE6)_this.changeFixed();
						return false;
					}
				},'mouseup touchend':function(){//结束拖动
					if(_this.bDrag){
						_this.bDrag=false;
						$dialog.css('opacity','');
						$shadow.show();
						$dragMask.hide();
					}
				}});
			}
			_this.changeFixed().setTopLayer().moveTo();
			var timer;
			if(!drag)$win.bind('resize',function(){
				if(timer)clearTimeout(timer);
				timer=setTimeout(function(){_this.moveTo();},100);//某些浏览器事件响应频率过高
			});
		},
		//设置标题
		setTitle:function(sHtml){
			var _this=this;
			_this.$titletext.html(sHtml);
			return _this;
		},
		//设置内容
		setContent:function(sHtml){
			if(sHtml===undefined)return;
			var _this=this,settings=_this.settings,type=settings.type;
			if(type=='iframe'){
				_this.bIframeInit=false;//iframe接口初始化
				sHtml=$('<div class="dd_wait"></div><iframe frameborder="0" src="'+sHtml+(/\?/.test(sHtml)?'&':'?')+'parenthost='+location.host+'" style="width:100%;height:'+(settings.height?(settings.height-_this.$title.outerHeight()+'px'):'100%')+';visibility:hidden;"></iframe>');
			}
			else if(type=='ajax'){
				$.get(sHtml+(sHtml.indexOf("?")!=-1?'&':'?')+'r='+(new Date().getTime()),function(data){_this._setContent(data);});
				sHtml=$('<div class="dd_wait" style="width:200px;height:100px;"></div>');
			}
			else if(type=='text')sHtml=$('<div class="dd_text"></div>').append(sHtml);
			_this._setContent(sHtml);
			if(type==='iframe'){
				var $iframe=sHtml.eq(1),$wait=sHtml.eq(0);
				var iframeWin=$iframe[0].contentWindow,result;
				var onIframeCallback=settings.iframeCallback;
				$iframe.load(function(){
					if($wait){//显示内页
						$wait.remove();
						$wait=null;
						$iframe.css('visibility','');
					}
					initIframe();//初始化接口
					if(result){//跨域，取返回值
						var bResult=true;
						try{
							result=eval('('+unescape(result)+')');
						}
						catch(e){
							bResult=false;
						}
						if(bResult)return iframeCallback(result);
					}
				})
				//初始化iframe接口
				function initIframe(){
					try{
						iframeWin.callback=iframeCallback;
						iframeWin.unloadme=function(){_this.hide()};
						$(iframeWin.document).keydown(function(){});
						result=iframeWin.name;
					}
					catch(ex){}
				}
				//iframe窗口回调
				function iframeCallback(v){
					iframeWin.document.write('');
					_this.hide();
					if(v!=null&&onIframeCallback)onIframeCallback.call(_this,v);
				}
				initIframe();
			}
			return _this;
		},
		//内部设置内容
		_setContent:function(sHtml){
			var _this=this;
			_this.$content.html(sHtml);
			_this.updateSize();
			return _this;
		},
		_updateSize:function(){
			this.updateSize();
		},
		//更新内容大小和阴影
		updateSize:function(){
			var _this=this,$dialog=_this.$dialog,$content=_this.$content,settings=_this.settings,width=settings.width,height=settings.height;
			//限制高宽
			$dialog.add($content).css({width:'',height:''});
			var dialogWidth=$dialog.width(),newWidth;
			if(width){
				if(isNaN(width)){
					var minWidth=width[0],maxWidth=width[1];
					if(minWidth&&dialogWidth<minWidth)newWidth=minWidth;
					if(maxWidth&&dialogWidth>maxWidth)newWidth=maxWidth;
				}
				else newWidth=width;
				if(newWidth){
					$dialog.css('width',newWidth);
					$content.css({'width':newWidth});
				}
			}
			var dialogHeight=$dialog.height(),newHeight;
			if(height){
				if(isNaN(height)){
					var minHeight=height[0],maxHeight=height[1];
					if(minHeight&&dialogHeight<minHeight)newHeight=minHeight;
					if(maxHeight&&dialogHeight>maxHeight)newHeight=maxHeight;
				}
				else newHeight=height;
				if(newHeight){
					$dialog.css('height',newHeight);
					$content.css('height',newHeight-_this.$title.outerHeight());
				}
			}
			//更新阴影高宽
			_this.$shadow.css({width:$dialog.outerWidth(),height:$dialog.outerHeight()});
			setTimeout(function(){
				if(_this.$dialog)_this.$shadow.css({width:$dialog.outerWidth(),height:$dialog.outerHeight()});
				if(isIE6)_this.moveTo();
			},300);
			return _this;
		},
		//显示对话框
		show:function(position,y){
			var _this=this;
			if(position)_this.moveTo(position,y);
			if(_this.$dialog&&!_this.bShow){
				var settings=_this.settings;
				if(settings.beforeShow&&settings.beforeShow.call(_this)===false)return _this;
				var $all=_this.$dialog.add(_this.$shadow);
				if(settings.modal)showModal(_this);
				var animate=settings.animate;
				animate?$all.fadeIn(animate):$all.show();
				_this.updateSize();//显示后修正内容和阴影大小
				_this.bShow=true;
				//延迟自动隐藏
				var time=settings.time;
				if(time>0)setTimeout(function(){_this.hide();},time);
				if(settings.afterShow)settings.afterShow.call(_this);
			}
			return _this;
		},
		//隐藏对话框
		hide:function(tempAnimate){
			var _this=this,settings=_this.settings;
			if(_this.bShow){
				if(settings.beforeHide&&settings.beforeHide.call(_this)===false)return _this;
				var $all=_this.$dialog.add(_this.$shadow);
				if(settings.modal)hideModal();
				var animate=settings.animate*0.5;
				if(tempAnimate!=undefined)animate=tempAnimate;
				animate?$all.fadeOut(animate):$all.hide();
				_this.bShow=false;
				if(settings.afterHide)settings.afterHide.call(_this);
			}
			return _this;
		},
		//移动对话框
		moveTo:function(position,y){
			var _this=this,settings=_this.settings,$dialog=_this.$dialog;
			if(y!==undefined)position={'left':position,'top':y};
			if(position!==undefined)settings.position=position;
			else position=settings.position;
			var left,top;
			var scrollLeft=_docElem.scrollLeft||_body.scrollLeft,scrollTop=_docElem.scrollTop||_body.scrollTop,clientWidth=_docElem.clientWidth,clientHeight=_docElem.clientHeight,dialogWidth=$dialog.outerWidth(),dialogHeight=$dialog.outerHeight();
			var right=position.right,bottom=position.bottom;
			left=position.left!=undefined?position.left:right!='center'?(clientWidth-dialogWidth-right):right;
			top=position.top!=undefined?position.top:bottom!='center'?(clientHeight-dialogHeight-bottom):bottom;
			if(left=='center')left=(clientWidth-dialogWidth)/2;
			if(top=='center')top=(clientHeight-dialogHeight)/2;
			//fixed模式下以屏幕左上角为起始坐标，其它模式以网页左上角为起始坐标
			if(settings.fixed&&isIE6){
				left+=scrollLeft;
				top+=scrollTop;
			}
			var offsetFix=_this.offsetFix;
			if(offsetFix){
				left+=offsetFix.x;
				top+=offsetFix.y;
			}
			var moveMode=settings.animate&&_this.bShow?'animate':'css',shadow=settings.shadow;
			_this.$dialog[moveMode]({'left':left,'top':top});
			_this.$shadow[moveMode]({'left':left+shadow,'top':top+shadow});
			if(isIE6)_this.changeFixed();
			return _this;
		},
		//最顶端显示
		setTopLayer:function(){
			var _this=this,i=_this.settings.modal?1:0;
			if(!_this.zIndex||_this.zIndex+3<arrTopZindex[i]){
				_this.zIndex=arrTopZindex[i]++;//最下面留给遮盖层
				_this.$shadow.css('zIndex',arrTopZindex[i]++);
				_this.$dialog.css('zIndex',arrTopZindex[i]++);
			}
			return _this;
		},
		//删除当前所有资源
		remove:function(){
			var _this=this,$dialog=_this.$dialog;
			if($dialog){
				_this.hide();
				$dialog.parent().html('').remove();
				_this.$dialog=_this.$shadow=null;
				_this.bShow=false;
			}
		},
		//切换固定显示模式
		changeFixed:function(bFixed){
			var _this=this,settings=_this.settings;
			if(bFixed!=undefined)settings.fixed=bFixed;
			else bFixed=settings.fixed;
			var style1=_this.$dialog[0].style,style2=_this.$shadow[0].style;
			if(bFixed){
				if(isIE6){
					var sDocElem='(document.documentElement||document.body)';
					var left = parseInt(style1.left) - _docElem.scrollLeft,top = parseInt(style1.top) - _docElem.scrollTop;
					style2.position=style1.position='absolute';
					style1.setExpression('left',sDocElem+".scrollLeft+"+left+"+'px'");
					style1.setExpression('top',sDocElem+".scrollTop+"+top+"+'px'");
					style2.setExpression('left',sDocElem+".scrollLeft+"+(left+settings.shadow)+"+'px'");
					style2.setExpression('top',sDocElem+".scrollTop+"+(top+settings.shadow)+"+'px'");
				}
				else style2.position=style1.position = 'fixed';
			}
			else{
				style2.position=style1.position='absolute';
				if(isIE6){
					style1.removeExpression('left');
					style1.removeExpression('top');
				}
			}
			return _this;
		}
	};
	_win.jDialog=jDialog;

	//---------------------------alert,confirm,prompt模块---------------------------
	var sOk='<button class="dd_ok">确定</button>',sCancel='<button class="dd_cancel">取消</button>';
	var alertFunc=jDialog.alert=function(sHtml,callback){
		var bCallback=false,$dialog,$content=$('<div class="dd_info">'+sHtml+'</div><div class="dd_button">'+sOk+'</div>'),$button=$content.find('button');
		$dialog=showMessage($content,function(){return checkCallback('hide');});
		$button.focus().click(function(){checkCallback('ok');});
		function checkCallback(type){
			if(bCallback)return;
			if(callback&&callback({type:type})==false)return false;
			bCallback=true;
			if(type!='hide')$dialog.hide();
			$dialog=null;
		}
	}
	var confirmFunc=jDialog.confirm=function(sHtml,callback){
		var bCallback=false,$dialog,$content=$('<div class="dd_info">'+sHtml+'</div><div class="dd_button">'+sOk+sCancel+'</div>'),$button=$content.find('button');
		$dialog=showMessage($content,function(){return checkCallback('hide');});
		$button.click(function(){checkCallback(this.className.substr(3));}).eq(0).focus();
		function checkCallback(type){
			if(bCallback)return;
			if(callback&&callback({type:type})==false)return false;
			bCallback=true;
			if(type!='hide')$dialog.hide();
			$dialog=null;
		}
	}
	var promptFunc=jDialog.prompt=function(sHtml,defValue,callback){
		var bCallback=false,$dialog,$content=$('<div class="dd_info">'+sHtml+'<br /><br /><input type="text" size="30" value="'+defValue+'"/></div><div class="dd_button">'+sOk+sCancel+'</div>'),$input=$content.find('input'),$button=$content.find('button');
		$button.click(function(){
			var type=this.className.substr(3);
			checkCallback(type,type=='ok'?$input.val():'');
		});
		$content.find('input[type=text]').keypress(function(e){
			if(e.which==13)checkCallback('ok',$input.val());//回车
		});
		$dialog=showMessage($content,function(){return checkCallback('hide');});
		$input.focus();
		function checkCallback(type,data){
			if(bCallback)return;
			if(callback&&callback({type:type,data:data})==false)return false;
			bCallback=true;
			if(type!='hide')$dialog.hide();
			$dialog=null;
		}
	}
	function showMessage(sHtml,hideCallback){
		return new jDialog($.extend({},jDialog.messageSettings,{content:sHtml,beforeHide:function(){return hideCallback();},afterHide:function(){this.remove();}})).show();
	}
	jDialog.messageSettings={type:'html',modal:true,drag:true,fixed:true,animate:false,width:[0,300]};


	//---------------------------popup模块---------------------------
	var popupFunc=jDialog.popup=function(sHtml,popupOptions,dialogOptions){
		if(!popupOptions)popupOptions={};
		if(!dialogOptions)dialogOptions={};
		//初始化对话框
		var $dialog=new jDialog($.extend({},jDialog.popupSettings,{content:sHtml,corner:popupOptions.corner},dialogOptions));
		function popupTo(target,position){
			var _this=this,$target=$(target);
			if(position)popupPosition=position;
			else position=popupPosition;
			var offset=$target.offset(),width=$target.outerWidth(),height=$target.outerHeight();
			var left=offset.left,top=offset.top;
			if(position){
				if(position.left!=undefined){
					left+=position.left;
					top+=position.top;
				}
				else if(position.match(/^center$/i)){
					left+=width/2;
					top+=height/2;
				}
				else{
					var arrCorner=position.match(/[a-z]+|[A-Z][a-z]+|\d+/g);
					var s1=arrCorner[0].substr(0,1),p1=arrCorner[1].substr(0,1),d=arrCorner[2]?parseInt(arrCorner[2]):0;
					if(s1.match(/[tb]/)){//上下
						if(s1=='b')top+=height;
						if(p1=='L')left+=d;
						else if(p1=='C')left+=width/2;
						else left+=width-d;
					}
					else{//左右
						if(s1=='r')left+=width;
						if(p1=='T')top+=d;
						else if(p1=='C')top+=height/2;
						else top+=height-d;
					}
				}
			}
			else{
				left+=width;
				top+=height;
			}
			$dialog.moveTo(left,top);
			return _this;
		}
		$dialog.popupTo=popupTo;
		var target=popupOptions.target,popupPosition=popupOptions.position;
		if(target)$dialog.popupTo(target);
		else if(popupPosition&&popupPosition.left)$dialog.moveTo(popupPosition);
		//绑定事件
		var _timerShow,_timerHide;
		var showOptions=popupOptions.show,showTarget;
		if(showOptions&&(showTarget=showOptions.target?showOptions.target:target)){//显示事件
			var showDelay=showOptions.delay?showOptions.delay:0;
			$(showTarget).bind(showOptions.event,function(){
				var _this=this;
				if(showDelay){
					clearTimeout(_timerShow);
					_timerShow=setTimeout(function(){$dialog.popupTo(_this).show();},showDelay);
				}
				else $dialog.popupTo(_this).show();
			});
		}
		var hideOptions=popupOptions.hide;
		if(hideOptions){//隐藏事件
			var hideTarget=hideOptions.target;
			if(hideTarget=='both')hideTarget=$dialog.$dialog.add(target);
			else hideTarget=target;
			if(hideTarget){//有事件源
				var hideDelay=hideOptions.delay,$hideTarget=$(hideTarget);
				$hideTarget.bind(hideOptions.event,function(e){
					var hideTarget,relatedTarget=e.relatedTarget;
					for(var i=0;i<$hideTarget.length;i++){
						hideTarget=$hideTarget[i];
						if(hideTarget===relatedTarget||$.contains(hideTarget,relatedTarget))return;//事件源内部
					}
					clearTimeout(_timerShow);
					if(hideDelay){
						clearTimeout(_timerHide);
						_timerHide=setTimeout(function(){$dialog.hide();},hideDelay);
					}
					else $dialog.hide();
				});
				if(hideDelay)$hideTarget.mouseover(function(){clearTimeout(_timerHide);});
			}
		}
		return $dialog;
	};
	jDialog.popupSettings={noTitle:true,noClose:true};

	//---------------------------jquery插件---------------------------
	$.fn.jDialog=function(options){//dDailog插件
		var arrDialog=[],arrDiv;
		this.each(function(){
			arrDiv=$(this).hide().children('div');
			arrDialog.push(new jDialog($.extend(options,{title:arrDiv[0].childNodes,content:arrDiv[1].childNodes})));
		});
		if(arrDialog.length===0)arrDialog=false;
		if(arrDialog.length===1)arrDialog=arrDialog[0];
		return arrDialog;
	};
	$.fn.dTip=function(options){//dTip插件
		var _this=this;
		_this.each(function(){//取消默认title事件
			var $this=$(this);
			$this.attr('dtitle',$this.attr("title")).removeAttr('title');
		});
		var settings=$.extend({},{maxWidth:300,delay:200},options),dialogOptions={content:'',noTitle:true,noClose:true,skin:'tip',shadow:3};
		var delay=settings.delay,maxWidth=settings.maxWidth,skin=settings.skin;
		if(maxWidth)dialogOptions.width=[0,maxWidth];
		if(skin)dialogOptions.skin=skin;

		var dialog=new jDialog(dialogOptions);

		var bTitleClose,bShow,lastOffset,_timer;
		_this.bind({mouseover:function(){
			hideTip();
			bTitleClose=false;
		},mousemove:function(e){
			if(!bTitleClose){
				var $this=$(this);
				if(bShow){//已显示，检查移动幅度
					if(Math.abs(e.pageX-lastOffset.x)>10||Math.abs(e.pageY-lastOffset.y)>10){//超过范围内移动隐藏
						hideTip();
						bTitleClose=true;
					}
				}
				else{//首次显示
					clearTimeout(_timer);
					_timer=setTimeout(function(){
						dialog.setContent($this.attr('dtitle')).moveTo(e.pageX,e.pageY+22).show();
						bShow=true;
						lastOffset={x:e.pageX,y:e.pageY};
					},delay);
				}
			}
		},mouseout:function(){
			if(!bTitleClose){
				clearTimeout(_timer);
				hideTip();
			}
		}});
		function hideTip(){
			dialog.hide();
			bShow=false;
		}
		return _this;
	};

})(jQuery,window,document);