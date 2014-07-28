/*!
 * hostsPlus
 *
 * @author Yanis.Wang<yanis.wang@gmail.com>
 *
 */
(function($,_win,undefined){

	var hosts={};
	var hostsPath = '';

	if(isWin)hostsPath = 'C:/Windows/System32/drivers/etc/hosts';
	else if(isLinux)hostsPath = '/etc/hosts';
	else if(isMac)hostsPath = '/etc/hosts';

	var charset = isUTF8Bytes(readFile(hostsPath))?'utf-8':'ansi';

	//更新hosts，只在需要转换域名时有效
	hosts.update=function(){
		var hostsList=settings.get('hostsList'),curHost=settings.get('curHost');
		if(curHost===-1)return;
		var textHosts=hostsList[curHost].content,arrTextHosts=textHosts.split(/\r?\n/g);
		var arrPingList={},domainCount=0,pingCount=0,arrIpList={};
		arrTextHosts.forEach(function(line){
			var match;
			match = line.match(/^\s*([^\s]+)\s+([^#]+)/);
			if(match && isIp(match[1])){//IP
				match[2].trim().split(/\s+/).forEach(function(domain){
					arrIpList[domain.toLowerCase()]=match[1];
				});
			}
			else if(/^\s*#/.test(line)===false){//cname转向
				match=line.match(/^\s*([^\s]+)\s+.+/);
				if(match!==null){
					arrPingList[match[1].toLowerCase()] = true;
				}
			}
		});
		domainCount=Object.keys(arrPingList).length;
		if(domainCount>0){
			for(domain in arrPingList){
				if(!arrIpList[domain]){
					ping(domain,function(ip){
						arrIpList[domain]=ip;
						pingCount++;
						//所有待ping的IP全部工作结束
						if(pingCount===domainCount){
							replaceDomain2Ip();
						}
					});
				}
				else{
					//已在IP列表中，直接使用列表数据
					pingCount++;
					if(pingCount===domainCount){
						replaceDomain2Ip();
					}
				}
			};
		}
		function replaceDomain2Ip(){
			arrTextHosts.forEach(function(line,i){
				if(/^\s*#/.test(line)===false&&/^\s*(\d+\.){3}\d+\s+.+/.test(line)===false){
					line=line.replace(/^(\s*)([^\s]+)(\s+.+)/,function(all,left,domain,right){
						var ip=arrIpList[domain.toLowerCase()];
						if(ip)domain=ip;
						return left+domain+right;
					});
					arrTextHosts[i]=line;
				}
			});
			hosts.save(arrTextHosts.join('\r\n'));
		}
	}

	//保存内容到hosts文件
	hosts.save=function(content){
		var sysHosts=hosts.load();
		if(content!==sysHosts){//与系统hosts有差异才保存
			try{
				writeFile(hostsPath, content, charset);
			}
			catch(e){
				var isShowHelp = confirm('hosts写入失败, 需要查看帮助信息吗？');
				if(isShowHelp){
					navigateToURL('https://github.com/yaniswang/hostsPlus/wiki/access');
				}
			}
			clearSysDns();
		}
	}

	//读取系统hosts文件
	hosts.load=function(){
		return readFile(hostsPath, true, charset);
	}

	if(isWin){
		// Win下开启机器名解析
		setInterval(hosts.update,settings.get('updateInterval')*1000);
		setTimeout(hosts.update,100);
	}

	_win.hosts=hosts;
})(jQuery,window);