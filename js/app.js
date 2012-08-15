/*!
 * hostsPlus
 *
 * @author Yanis.Wang<yanis.wang@gmail.com>
 * @site http://alibaba.com
 *
 * @Version: 1.0.0 (build 111112)
 */
(function($, _win, undefined) {

	var menuDns, menuHosts, menuGroup, menuSettingsTheme, menuTools;
	var menuIcon;

	var dialog;

	var app = {};
	var isEditorChanged = false;

	//软件初始化
	app.init = function() {

		var hostsList = settings.get('hostsList'),
			curHost = settings.get('curHost');
		//首次打开软件，读取系统默认hosts文件
		if (curHost === -1) {
			var textHosts = hosts.load();
			hostsList = [{
				name: '默认',
				content: textHosts
			}];
			settings.set('hostsList', hostsList);
			settings.set('curHost', 0);
		}

		app.initAppMenu();
		app.initSystemIcon();

		app.updateHostMenu();
		app.updateDnsMenu();
		app.updateToolsMenu();

		editor.init();
		editor.on('change', function(){
			app.updateTitle();
		});
		editor.on('save', app.saveEditor);
		app.loadCurTheme();

		//初始化对话框
		dialog = new jDialog({
			title: 'title',
			content: 'content',
			fixed: true,
			drag: true,
			modal: true
		});

		app.loadCurHost();

		app.toggleFullscreen();	
		if(settings.get('bHideAfterStart')){
			app.hide();
		}

		//定时回收垃圾
		setInterval(function(){
			air.System.gc();
		},10000);

	}

	//显示窗口
	app.show = function() {
		nativeWindow.visible = true;
		nativeWindow.orderToFront();
		nativeWindow.activate();
	}

	//隐藏窗口到系统栏
	app.hide = function() {;
		nativeWindow.visible = false;
	}

	//切换全屏状态
	app.toggleFullscreen = function() {
		nativeWindow.displayState == 'maximized' ? nativeWindow.restore() : nativeWindow.maximize();
	}

	//结束软件
	app.exit = function() {
		settings.save();
		NativeApplication.nativeApplication.icon.bitmaps = [];
		NativeApplication.nativeApplication.exit();
	}

	//设置启动时运行
	app.setStartAtLogin = function(bStart) {
		try {
			NativeApplication.nativeApplication.startAtLogin = bStart; //安装后可用
		} catch (e) {
			air.trace("Cannot set startAtLogin: " + e.message);
		}
	}

	//设置窗口一直居顶
	app.setAlwaysInFront = function(bFront) {
		nativeWindow.alwaysInFront = bFront;
	}

	//切换显示或隐藏
	app.toggleShow = function(){
		if (nativeWindow.visible){
			app.hide();
		}
		else{
			app.show();
		}
	}

	//初始化应用菜单
	app.initAppMenu = function() {
		var menuItem;

		//切换方案
		menuHosts = new air.NativeMenu();

		menuHosts.addItem(new air.NativeMenuItem('----', true));
		var menuItemHostsAdd = menuHosts.addItem(new air.NativeMenuItem('添加新方案'));
		menuItemHostsAdd.name = 'hostsadd';
		menuItemHostsAdd.addEventListener(air.Event.SELECT, app.menuSelect);

		var menuItemHostsDelete = menuHosts.addItem(new air.NativeMenuItem('删除当前方案'));
		menuItemHostsDelete.name = 'hostsdel';
		menuItemHostsDelete.addEventListener(air.Event.SELECT, app.menuSelect);

		menuHosts.addItem(new air.NativeMenuItem('----', true));

		var menuItemExit = menuHosts.addItem(new air.NativeMenuItem('退出'));
		menuItemExit.name = 'exit';
		menuItemExit.addEventListener(air.Event.SELECT, app.menuSelect);
		

		//切换分组
		menuGroup = new air.NativeMenu();

		var menuItemAllGroupOff = menuGroup.addItem(new air.NativeMenuItem('关闭所有分组'));
		menuItemAllGroupOff.name = 'setgroupoff';
		menuItemAllGroupOff.addEventListener(air.Event.SELECT, app.menuSelect);

		menuGroup.addItem(new air.NativeMenuItem('----', true));

		//切换DNS
		menuDns = new air.NativeMenu();

		menuDns.addItem(new air.NativeMenuItem('----', true));
		var menuItemDnsSetup = menuDns.addItem(new air.NativeMenuItem('设置DNS'));
		menuItemDnsSetup.name = 'dnssetup';
		menuItemDnsSetup.addEventListener(air.Event.SELECT, app.menuSelect);

		//工具菜单
		menuTools = new air.NativeMenu();

		//设置菜单
		var menuSettings = new air.NativeMenu();

		var menuSettingsPreference = menuSettings.addItem(new air.NativeMenuItem('首选项'));
		menuSettingsPreference.name = 'preference';
		menuSettingsPreference.addEventListener(air.Event.SELECT, app.menuSelect);

		menuSettingsTheme = new air.NativeMenu();
		menuSettings.addSubmenu(menuSettingsTheme, '主题');		

		//帮助主菜单
		var menuHelp = new air.NativeMenu();

		var menuItemManual = menuHelp.addItem(new air.NativeMenuItem('使用指南'));
		menuItemManual.name = 'manual';
		menuItemManual.addEventListener(air.Event.SELECT, app.menuSelect);

		var menuItemAbout = menuHelp.addItem(new air.NativeMenuItem('关于'));
		menuItemAbout.name = 'about';
		menuItemAbout.addEventListener(air.Event.SELECT, app.menuSelect);

		var appMenu = new air.NativeMenu();
		appMenu.addSubmenu(menuHosts, '方案');
		appMenu.addSubmenu(menuGroup, '分组');
		if(isWin){
			appMenu.addSubmenu(menuDns, 'DNS');
		}
		appMenu.addSubmenu(menuSettings, '设置');
		appMenu.addSubmenu(menuTools, '工具');
		appMenu.addSubmenu(menuHelp, '帮助');

		//Windows
		if (air.NativeWindow.supportsMenu) {
			nativeWindow.menu = appMenu;
		}
		//Mac
		if (NativeApplication.supportsMenu) {
			NativeApplication.nativeApplication.menu = appMenu;
		}
	}

	//初始化系统图标
	app.initSystemIcon = function() {
		menuIcon = new air.NativeMenu();

		var menuItemSep;

		if(isWin){
			menuItemSeparate = menuIcon.addItem(new air.NativeMenuItem('----', true));
			menuItemSeparate.name = 'dnsBottom';
		}

		var menuItemAllGroupOff = menuIcon.addItem(new air.NativeMenuItem('关闭所有分组'));
		menuItemAllGroupOff.name = 'setgroupoff';
		menuItemAllGroupOff.addEventListener(air.Event.SELECT, app.menuSelect);

		menuItemSeparate = menuIcon.addItem(new air.NativeMenuItem('----', true));
		menuItemSeparate.name = 'groupBottom';

		var menuItemToggleShow = menuIcon.addItem(new air.NativeMenuItem('显示/隐藏'));
		menuItemToggleShow.name = 'toggleshow';
		menuItemToggleShow.addEventListener(air.Event.SELECT, app.menuSelect);

		if(!isMac){
			var menuItemExit = menuIcon.addItem(new air.NativeMenuItem('退出'));
			menuItemExit.name = 'exit';
			menuItemExit.addEventListener(air.Event.SELECT, app.menuSelect);
		}
		

		//Windows
		if (NativeApplication.supportsSystemTrayIcon) {
			loadResource(isLinux?'icons/icon_linux.png':'icons/icon16.png', function(event) {
				NativeApplication.nativeApplication.icon.bitmaps = [event.target.content.bitmapData];
			});
			NativeApplication.nativeApplication.icon.tooltip = "hostsPlus";
			NativeApplication.nativeApplication.icon.menu = menuIcon;
			//点击系统栏图标切换显示和隐藏
			air.NativeApplication.nativeApplication.icon.addEventListener(air.MouseEvent.CLICK, app.toggleShow);
		}
		//Mac
		if (NativeApplication.supportsDockIcon) {
			loadResource('icons/icon128.png', function(event) {
				NativeApplication.nativeApplication.icon.bitmaps = [event.target.content.bitmapData];
			});
			NativeApplication.nativeApplication.icon.menu = menuIcon;
			var bDockInited = false;
			NativeApplication.nativeApplication.addEventListener(air.InvokeEvent.INVOKE, function(){
				if(bDockInited){
					app.toggleShow();
				}
				else{
					bDockInited = true;
					//屏蔽首次Invoke事件
				}
			});
		}
	}

	//菜单选择
	app.menuSelect = function(e) {
		var target = e.currentTarget;
		switch (target.name) {
		case 'sethost':
			settings.set('curHost', target.data);
			app.loadCurHost();
			app.updateHostMenu()
			break;
		case 'hostsadd':
			app.addHosts();
			break;
		case 'hostsdel':
			app.delHosts();
			break;
		case 'setgroup':
			app.setHostsGroup(target.label, !target.checked, target.data);
			break;
		case 'setgroupoff':
			app.setHostsGroup('',false);
			break;
		case 'setdns':
			settings.set('curDns', target.data);
			app.setSysDns();
			app.updateDnsMenu()
			break;
		case 'dnssetup':
			app.showDnsSetup();
			break;
		case 'preference':
			app.showPreference();
			break;
		case 'settheme':
			settings.set('curTheme', target.data);
			app.loadCurTheme();
			break;
		case 'tools':
			app.execTools(target.data);
			break;
		case 'manual':
			app.showManual();
			break;
		case 'about':
			app.showAbout();
			break;
		case 'toggleshow':
			app.toggleShow();
			break;
		case 'exit':
			app.exit();
			break;
		}
		if(nativeWindow.visible){
			nativeWindow.activate();
		}
	}

	//更新应用标题
	app.updateTitle = function(){
		var hostsList = settings.get('hostsList'),
			curHost = settings.get('curHost');
		document.title = (editor.bChanged()?' *':'') + hostsList[curHost].name + ' - hostsPlus';
	}

	//更新DNS菜单
	app.updateDnsMenu = function() {

		if(!isWin)return;

		var arrDnsList = settings.get('dnsList'),
			curDns = settings.get('curDns');

		var arrMenuItem, menuItem, addPos;
		var menuItemLocal, menuItemDns;
		var dns;

		arrMenuItem = menuDns.items;
		for (var i = 0, c = arrMenuItem.length; i < c; i++) {
			menuItem = arrMenuItem[i];
			if (menuItem.name === 'setdns') menuDns.removeItem(menuItem);
		}

		addPos = 0;

		menuItemLocal = menuDns.addItemAt(new air.NativeMenuItem('本地DNS'), addPos++);
		menuItemLocal.name = 'setdns';
		menuItemLocal.data = -1;
		menuItemLocal.checked = curDns === -1 ? true : false;
		menuItemLocal.addEventListener(air.Event.SELECT, app.menuSelect);

		for (var i = 0, c = arrDnsList.length; i < c; i++) {
			dns = arrDnsList[i];
			menuItemDns = menuDns.addItemAt(new air.NativeMenuItem(dns.name), addPos++);
			menuItemDns.name = 'setdns';
			menuItemDns.data = i;
			menuItemDns.checked = curDns === i ? true : false;
			menuItemDns.addEventListener(air.Event.SELECT, app.menuSelect);
		}

		//系统栏菜单
		arrMenuItem = menuIcon.items;
		for (var i = 0, c = arrMenuItem.length; i < c; i++) {
			menuItem = arrMenuItem[i];
			if (menuItem.name === 'dnsBottom') addPos = menuIcon.getItemIndex(menuItem);
			if (menuItem.name === 'setdns') menuIcon.removeItem(menuItem);
		}


		menuItemLocal = menuIcon.addItemAt(new air.NativeMenuItem('本地DNS'), addPos++);
		menuItemLocal.name = 'setdns';
		menuItemLocal.data = -1;
		menuItemLocal.checked = curDns === -1 ? true : false;
		menuItemLocal.addEventListener(air.Event.SELECT, app.menuSelect);

		for (var i = 0, c = arrDnsList.length; i < c; i++) {
			dns = arrDnsList[i];
			menuItemDns = menuIcon.addItemAt(new air.NativeMenuItem(dns.name), addPos++);
			menuItemDns.name = 'setdns';
			menuItemDns.data = i;
			menuItemDns.checked = curDns === i ? true : false;
			menuItemDns.addEventListener(air.Event.SELECT, app.menuSelect);
		}
	}

	//设置系统DNS
	app.setSysDns = function() {
		var bWifi = settings.get('bWifi'),
			arrDnsList = settings.get('dnsList'),
			curDns = settings.get('curDns');
		setSysDns(bWifi ? '无线网络连接' : '本地连接', curDns != -1 ? arrDnsList[curDns].ip : '');
	}

	//更新工具菜单
	app.updateToolsMenu = function() {
		var arrToolsList = settings.get('toolsList');
		var tool;

		var arrMenuItem, menuItem;
		arrMenuItem = menuTools.items;
		for (var i = 0, c = arrMenuItem.length; i < c; i++) {
			menuItem = arrMenuItem[i];
			menuTools.removeItem(menuItem);
		}

		for (var i = 0, c = arrToolsList.length; i < c; i++) {
			tool = arrToolsList[i];
			menuItem = menuTools.addItemAt(new air.NativeMenuItem(tool.name), i);
			menuItem.name = 'tools';
			menuItem.data = i;
			menuItem.checked = tool.enable ? true : false;
			menuItem.addEventListener(air.Event.SELECT, app.menuSelect);
		}
	}

	//执行工具
	app.execTools = function(i) {
		var arrToolsList = settings.get('toolsList'),
			tool = arrToolsList[i],
			cmd = tool.cmd;
		if (tool.enable !== undefined) tool.enable = !tool.enable;
		switch (tool.cmd) {
			case 'hostname':
				app.showHostName();
				break;
			case 'localip':
				app.showLocalIp();
				break;
			case 'iedns':
				setIeDns(tool.enable ? '1' : '0');
				break;
			case 'ffdns':
				air.navigateToURL(new air.URLRequest('https://addons.mozilla.org/zh-cn/firefox/addon/hostadmin/'));
				break;
		}
		app.updateToolsMenu();
	}

	//显示主机名
	app.showHostName = function(){
		hostname(function(name){
			var $hostname = $('<div class="appdialog hostname"><p><input id="hostname" type="text" value="'+name+'"></p><p class="buttonline"><button id="btnOk">确定</button></p></div>');
			var $txtHostname = $('#hostname', $hostname),
				$btnOk = $('#btnOk', $hostname);
			dialog.setTitle('当前主机名').setContent($hostname).moveTo().show();
			$txtHostname.select();
			$btnOk.click(function(){
				dialog.hide();
			});
		});
	}

	//显示本地IP列表
	app.showLocalIp = function(){
		var arrIp = getLocalIP();
		var $localip = $('<div class="appdialog localip"><p><textarea id="localip">'+arrIp.join('\r\n')+'</textarea></p><p class="buttonline"><button id="btnOk">确定</button></p></div>');
		var $txtLocalIp = $('#localip', $localip),
			$btnOk = $('#btnOk', $localip);
		dialog.setTitle('本机IP列表').setContent($localip).moveTo().show();
		$txtLocalIp.select();
		$btnOk.click(function(){
			dialog.hide();
		});
	}

	//显示DNS设置界面
	app.showDnsSetup = function() {
		var $DnsSetup = $('<div class="appdialog dnssetup"><p'+(isLinux?' style="display:none;"':'')+'><label for="bWifi">无线网络：</label> <input id="bWifi" type="checkbox" /></p><p>DNS列表：<br /><br /><textarea id="DnsList"></textarea><br /><span class="tip">示例：美国DNS 8.8.8.8 (中间以空格分隔，多行为多个DNS)</span></p><p class="buttonline"><button id="btnSave">保存修改</button></p></div>');
		var $bWifi = $('#bWifi', $DnsSetup),
			$DnsList = $('#DnsList', $DnsSetup),
			$btnSave = $('#btnSave', $DnsSetup);
		dialog.setTitle('编辑DNS').setContent($DnsSetup).moveTo().show();

		var bWifi = settings.get('bWifi'),
			arrDnsList = settings.get('dnsList'),
			arrStrDnsList = [];
		$.each(arrDnsList, function(id, dns) {
			arrStrDnsList.push(dns.name + ' ' + dns.ip);
		});
		$bWifi.attr('checked', bWifi ? true : false);
		$DnsList.val(arrStrDnsList.join('\r\n'));

		$btnSave.click(function() {
			settings.set('bWifi', $bWifi.attr('checked') ? true : false);
			arrStrDnsList = $DnsList.val().split(/\r?\n/);
			arrDnsList = [];
			var errMsg = null;
			$.each(arrStrDnsList, function(id, line) {
				if (line) {
					var arrLine = line.split(/\s+/);
					if (arrLine.length !== 2 || !/^(\d{1,3}\.){3}\d{1,3}$/.test(arrLine[1])) {
						errMsg = 'DNS列表格式无效，请重新修改。';
						return false;
					}
					arrDnsList.push({
						name: arrLine[0],
						ip: arrLine[1]
					});
				}
			});
			if (errMsg === null && arrDnsList.length === 0) {
				errMsg = 'DNS列表不允许为空';
			}
			if (errMsg) {
				$DnsList.focus();
				alert(errMsg);
			} else {
				settings.set('dnsList', arrDnsList);
				alert('Dns修改成功');
				dialog.hide();
				app.updateDnsMenu();
			}
		});
	}

	//显示关于界面
	app.showAbout = function(){
		var descriptor = '' + NativeApplication.nativeApplication.applicationDescriptor;
		var match = descriptor.match(/<versionLabel>(.+?)<\/versionLabel>/i); 
		var ver = '';
		if(match){
			ver = match[1];
		}
		var $about = $('<div class="appdialog about"><h1>hostsPlus</h1><p class="ver">v'+ver+'</p><p></p><p>hostsPlus是一个hosts增强编辑软件，主要实现以下功能增强：</p><ol><li>hosts方案管理</li><li>hosts分组管理</li><li>重定向到主机名或域名</li><li>DNS切换</li></ol><p>联系作者：<a href="mailto:yanis.wang@gmail.com">yanis.wang@gmail.com</a></p><p class="buttonline"><button id="btnOk">确定</button></p></div>');
		var $btnOk = $('#btnOk', $about);
		dialog.setTitle('关于hostsPlus').setContent($about).moveTo().show();

		$btnOk.click(function(){
			dialog.hide();
		});
	}

	//加载当前host方案到编辑器并生效
	app.loadCurHost = function() {
		var hostsList = settings.get('hostsList'),
			curHost = settings.get('curHost');
		var textHosts = hostsList[curHost].content;
		editor.set(textHosts);
		hosts.save(textHosts);
		app.updateGroupMenu();
		app.updateTitle();
	}

	//更新Host方案菜单
	app.updateHostMenu = function() {
		var hostsList = settings.get('hostsList'),
			curHost = settings.get('curHost');

		var arrMenuItem, menuItem;
		var menuItemHost;

		arrMenuItem = menuHosts.items;
		for (var i = 0, c = arrMenuItem.length; i < c; i++) {
			menuItem = arrMenuItem[i];
			if (menuItem.name === 'sethost') menuHosts.removeItem(menuItem);
		}

		var addPos = 0;
		var host;
		for (var i = 0, c = hostsList.length; i < c; i++) {
			host = hostsList[i];
			menuItemHost = menuHosts.addItemAt(new air.NativeMenuItem(host.name), addPos++);
			menuItemHost.name = 'sethost';
			menuItemHost.data = i;
			menuItemHost.checked = curHost === i ? true : false;
			menuItemHost.addEventListener(air.Event.SELECT, app.menuSelect);
		}
	}

	//更新host分组菜单
	app.updateGroupMenu = function() {
		var hostsList = settings.get('hostsList'),
			curHost = settings.get('curHost');
		if (curHost === -1) return;

		var textHosts = hostsList[curHost].content,
			arrTextHosts = textHosts.split(/\r?\n/g);

		var arrGroups = [], lastGroupName = null, lastGroupAttr, lastGroupCount = 0, lastGroupOnCount = 0;
		arrTextHosts.forEach(function(line) {
			var match = line.match(/^\s*#\s*=+\s*([^=]+?)\s*((?:\([^\(\)=]+\))*)\s*=+/i);
			if(match !== null){
				if(lastGroupName !== null){
					arrGroups.push({name:lastGroupName,data:lastGroupAttr, bOn:(lastGroupOnCount>0 && lastGroupOnCount === lastGroupCount)});
				}
				lastGroupName = match[1];
				lastGroupAttr = match[2];
				if(lastGroupAttr){
					lastGroupAttr = lastGroupAttr.replace(/\)\s*\(/g,',').replace(/\s*[()]\s*/g,'');
				}
				lastGroupCount = lastGroupOnCount = 0;
			}
			else{
				if(/^\s*(#[^!]|$)/.test(line) === false){
					lastGroupCount ++;
					if(/^\s*#!/.test(line) === false){
						lastGroupOnCount ++;
					}
				}
			}
		});
		if(lastGroupName !== null){
			arrGroups.push({name:lastGroupName, data:lastGroupAttr, bOn:(lastGroupOnCount>0 && lastGroupOnCount === lastGroupCount)});
		}

		var arrMenuItem,menuItem;
		var menuItemHost;
		arrMenuItem=menuGroup.items;
		for(var i=0,c=arrMenuItem.length;i<c;i++){
			menuItem=arrMenuItem[i];
			if(menuItem.name==='setgroup')menuGroup.removeItem(menuItem);
		}

		arrGroups.forEach(function(group) {
			menuItemHost = menuGroup.addItem(new air.NativeMenuItem(group.name));
			menuItemHost.name='setgroup';
			menuItemHost.data=group.data;
			menuItemHost.checked=group.bOn;
			menuItemHost.addEventListener(air.Event.SELECT , app.menuSelect);
		});

		//系统栏菜单
		arrMenuItem = menuIcon.items;
		for (var i = 0, c = arrMenuItem.length; i < c; i++) {
			menuItem = arrMenuItem[i];
			if (menuItem.name === 'groupBottom') addPos = menuIcon.getItemIndex(menuItem);
			if (menuItem.name === 'setgroup') menuIcon.removeItem(menuItem);
		}

		arrGroups.forEach(function(group) {
			menuItemHost = menuIcon.addItemAt(new air.NativeMenuItem(group.name),addPos++);
			menuItemHost.name='setgroup';
			menuItemHost.data=group.data;
			menuItemHost.checked=group.bOn;
			menuItemHost.addEventListener(air.Event.SELECT , app.menuSelect);
		});

	}

	//设置分组
	app.setHostsGroup = function(name, bOn, data){
		
		if(editor.bChanged()){
			if(confirm('您的编辑结果还没保存,，保存后才能切换分组，需要为您保存吗？')){
				app.saveEditor();
			}
			else{
				return;
			}
		}
		var hostsList = settings.get('hostsList'),
			curHost = settings.get('curHost');
		var textHosts = hostsList[curHost].content, arrTextHosts = textHosts.split(/\r?\n/g);;

		var groupName = null, arrGroupOn = {};
		if(bOn && data){
			//开启时才检测关联性
			var arrData = data.split(',');
			arrData.forEach(function(attr){
				attr = attr.toLowerCase();
				if(attr.substr(0,1) === '?'){
					arrGroupOn[attr.substr(1)] = true;
				}
				else{
					groupName = attr;
				}
			});
		}

		var targetGroupLine;
		var bGroupOn = null;
		for(var i=0,c=arrTextHosts.length;i<c;i++){
			line = arrTextHosts[i];
			var match = line.match(/^\s*#\s*=+\s*([^=]+?)\s*((?:\([^\(\)=]+\))*)\s*=+/i);
			if(match !== null){
				bGroupOn = null;
				if(match[1] === name || name === ''){
					bGroupOn = bOn;
					targetGroupLine = i;
				}
				else if(arrGroupOn[match[1].toLowerCase()]){
					//被依赖，开启
					bGroupOn = true;
				}
				else if(groupName !== null && match[2]){
					match = match[2].match(/\(\s*([^\?].*?)\s*\)/);
					if(match && match[1] && groupName === match[1].toLowerCase()){
						//同组，互斥
						bGroupOn = false;
					}
				}
			}
			else{
				if(bGroupOn !== null){
					if(bGroupOn){
						line = line.replace(/^\s*#!\s*/,'');
					}
					else{
						line = line.replace(/^\s*([^#])/,'#! $1');
					}
				}
			}
			arrTextHosts[i] = line;
		};
		textHost = arrTextHosts.join('\r\n');

		hostsList[curHost].content = textHost;

		app.loadCurHost();

		if(name === ''){
			targetGroupLine = 0;
		}
		if(targetGroupLine){
			editor.gotoLine(targetGroupLine);
		}

	}

	//更新主题菜单
	app.upateThemeMenu = function(){
		var menuItemTheme;

		menuSettingsTheme.removeAllItems();
		
		var themeList = settings['themeList']
			curTheme = settings.get('curTheme');

		for(var i=0,c=themeList.length;i<c;i++){
			menuItemTheme = menuSettingsTheme.addItem(new air.NativeMenuItem(themeList[i]));
			menuItemTheme.name = 'settheme';
			menuItemTheme.data = i;
			menuItemTheme.checked = (i === curTheme ? true : false);
			menuItemTheme.addEventListener(air.Event.SELECT , app.menuSelect);
		}
	}

	//加载当前选择的主题
	app.loadCurTheme = function(){
		var themeList = settings['themeList'],
			curTheme = settings.get('curTheme');
		editor.setTheme(themeList[curTheme]);
		app.upateThemeMenu();
	}

	//显示首选项
	app.showPreference = function(){
		var $preference = $('<div class="appdialog preference"><p><label for="bStartAtLogin">开机启动：</label> <input id="bStartAtLogin" type="checkbox" /></p><p><label for="bHideAfterStart">启动后隐藏：</label> <input id="bHideAfterStart" type="checkbox" /></p><p class="buttonline"><button id="btnSave">保存修改</button></p></div>');
		var $bStartAtLogin = $('#bStartAtLogin', $preference),
			$bHideAfterStart = $('#bHideAfterStart', $preference),
			$btnSave = $('#btnSave', $preference);
		dialog.setTitle('首选项').setContent($preference).moveTo().show();

		var bStartAtLogin = settings.get('bStartAtLogin'), bHideAfterStart = settings.get('bHideAfterStart');

		$bStartAtLogin.attr('checked', bStartAtLogin ? true : false);
		$bHideAfterStart.attr('checked', bHideAfterStart ? true : false);

		$btnSave.click(function(){
			bStartAtLogin = $bStartAtLogin.attr('checked') ? true : false;
			settings.set('bStartAtLogin', bStartAtLogin);
			settings.set('bHideAfterStart', $bHideAfterStart.attr('checked') ? true : false);
			app.setStartAtLogin(bStartAtLogin);
			alert('修改成功');
			dialog.hide();
		});
	}

	//添加新方案
	app.addHosts = function(){
		jDialog.prompt('请输入新方案名字！','',function(e){
			if(e.type === 'ok'){
				var hostsName = e.data.replace(/\r?\n/g,'');
				if(hostsName){
					var hostsList = settings.get('hostsList');
					hostsList.push({
						name: hostsName,
						content: ''
					});
					settings.set('curHost', hostsList.length-1);
					app.updateHostMenu();
					app.loadCurHost();
				}
			}
		});
	}

	//删除当前方案
	app.delHosts = function(){
		var hostsList = settings.get('hostsList'), curHost = settings.get('curHost');
		if(curHost === 0){
			alert('很抱歉，默认方案不允许删除。');
		}
		else{
			var hosts = hostsList[curHost];
			if(confirm('删除后无法恢复，确认要删除 [ ' + hosts.name + ' ] 这个方案吗？')){
				hostsList.splice(curHost,1);
				settings.set('curHost', 0);
				app.updateHostMenu();
				app.loadCurHost();
			}
		}
	}

	//切换方案
	app.toggleHosts = function(){
		var hostsList = settings.get('hostsList'), curHost = settings.get('curHost');
		var newCurHost = curHost + 1;
		if(newCurHost>=hostsList.length)newCurHost = 0;
		if(newCurHost !== curHost){
			if(editor.bChanged()){
				if(confirm('您的编辑结果还没保存，需要为您保存吗？')){
					app.saveEditor();
				}
				else{
					return;
				}
			}
			settings.set('curHost', newCurHost);
			app.updateHostMenu();
			app.loadCurHost();
		}
	}

	//显示使用指南
	app.showManual = function(){
		air.navigateToURL(new air.URLRequest('https://github.com/yaniswang/hostsPlus/wiki/manual'));
	}

	//保存最新编辑结果
	app.saveEditor = function(){
		var hostsList = settings.get('hostsList'),
			curHost = settings.get('curHost');
		var textHosts = editor.get();
		hostsList[curHost].content = textHosts;
		hosts.save(textHosts);
		app.updateGroupMenu();
		app.updateTitle();
		settings.save();
	}

	_win.app = app;
})(jQuery, window);