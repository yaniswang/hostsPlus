if [ "$2" = "clear" ];then
    networksetup -setdnsservers $1 empty
else
    networksetup -setdnsservers $1 $2
fi