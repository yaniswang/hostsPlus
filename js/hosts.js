/*!
 * hostsPlus
 *
 * @author Yanis.Wang<yanis.wang@gmail.com>
 * @site http://alibaba.com
 *
 * @Version: 1.0.0 (build 120408)
 */
(function($,_win,undefined){

	var hosts={};
	var hostsPath='C:/Windows/System32/drivers/etc/hosts';
	var charset = isUTF8Bytes(readFile(hostsPath))?'utf-8':'ansi';
	
	//更新hosts，只在需要转换域名时有效
	hosts.update=function(){
		var hostsList=settings.get('hostsList'),curHost=settings.get('curHost');
		if(curHost===-1)return;
		var textHosts=hostsList[curHost].content,arrTextHosts=textHosts.split(/\r?\n/g);
		var arrPingList=[],domainCount=0,pingCount=0,arrIpList={};
		arrTextHosts.forEach(function(line){
			var match;
			if(match=line.match(/^\s*((?:\d+\.){3}\d+)\s+([^#]+)/)){//IP
				match[2].trim().split(/\s+/).forEach(function(domain){
					arrIpList[domain.toLowerCase()]=match[1];
				});
			}
			else if(/^\s*#/.test(line)===false){//cname转向
				match=line.match(/^\s*([^\s]+)\s+.+/);
				if(match!==null){
					arrPingList.push(match[1].toLowerCase());
				}				
			}
		});
		domainCount=arrPingList.length;
		if(domainCount>0){
			arrPingList.forEach(function(domain){
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
			});
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
		if(content!=sysHosts){
			writeFile(hostsPath, content, charset);
			clearSysDns();
		}
	}
	hosts.load=function(){
		return readFile(hostsPath, true, charset);
	}
	
	setInterval(hosts.update,settings.get('updateInterval')*1000);
	setTimeout(hosts.update,100);
	
	_win.hosts=hosts;	
})(jQuery,window);