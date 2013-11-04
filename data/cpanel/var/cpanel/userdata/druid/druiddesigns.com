--- 
customlog: 
  - 
    format: combined
    target: /usr/local/apache/domlogs/druiddesigns.com
  - 
    format: "\"%{%s}t %I .\\n%{%s}t %O .\""
    target: /usr/local/apache/domlogs/druiddesigns.com-bytes_log
documentroot: /home1/druid/public_html
group: druid
hascgi: 1
homedir: /home1/druid
ip: 192.185.33.67
owner: root
phpopenbasedirprotect: 1
port: 80
scriptalias: 
  - 
    path: /home1/druid/public_html/cgi-bin
    url: /cgi-bin/
serveradmin: webmaster@druiddesigns.com
serveralias: www.druiddesigns.com druiddesigns.biz www.druiddesigns.biz
servername: druiddesigns.com
usecanonicalname: 'Off'
user: druid
