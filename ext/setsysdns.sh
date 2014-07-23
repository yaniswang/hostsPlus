
netname=$1
netname=${netname//_~/ }

if [ "$2" = "clear" ];then
    networksetup -setdnsservers "$netname" empty
else
    networksetup -setdnsservers "$netname" "$2"
fi