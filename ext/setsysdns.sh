if [ "$2" = "clear" ];then
	echo "nameserver 127.0.0.1" > /etc/resolv.conf
else
	echo "nameserver $2" > /etc/resolv.conf
fi