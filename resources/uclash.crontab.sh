#!/data/data/com.termux/files/usr/bin/bash
# edit this file to 
echo "[generate] $(date)"
node $(which uclash) generate -cp 
# pkill clash
# node $(which uclash) exec 1 --daemon "nohup&"