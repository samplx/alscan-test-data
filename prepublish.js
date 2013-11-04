#!/usr/bin/env node
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4 fileencoding=utf-8 : */
/*
 *     Copyright 2013 James Burlingame
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *
 */

// enable JavaScript strict mode.
"use strict";

var fs = require("fs");
var path = require("path");
var util = require("util");

/**
 *  Create a directory (recusively)
 *
 *  @arg pathname of the directory.
 *  @arg mode option mode (default is 0755)
 */
function mkdir(pathname, mode) {
    var dirmode = mode || 493;  // 493 == 0755 (no octal in strict mode)
//    console.log("mkdir(pathname='"+pathname+"', mode=0"+dirmode.toString(8)+")");
    if (!fs.existsSync(pathname)) {
        var dirname = path.dirname(pathname);
        mkdir(dirname, dirmode);
        fs.mkdirSync(pathname, dirmode); 
    }
}

/**
 *  Copy a file.
 *  @arg source path to source file.
 *  @arg dest path to destination file.
 */
function copyFile(source, dest) {
    var e;
    try {
        fs.unlinkSync(dest);
    } catch (e) {
        var dirname = path.dirname(dest);
        mkdir(dirname);
    }
    var input = fs.createReadStream(source);
    var output = fs.createWriteStream(dest);
    input.pipe(output);
}

/**
 *  Create a lines test file.
 *  @arg pathname of the test file.
 *  @arg nLines total number of lines in the file.
 *  @hasNL true if the last line includes a new-line.
 */
function mklines(pathname, nLines, hasNL) {
    var output = fs.createWriteStream(pathname, { flags: 'w', encoding: 'utf8' });
    var n, line;
    for (n=1; n < nLines; n++) {
        line = n.toString();
        while (line.length < 8) {
            line = '0' + line;
        }
        line += "\n";
        output.write(line);
    }
    line = n.toString();
    while (line.length < 8) {
        line = '0' + line;
    }
    if (hasNL) {
        line += "\n";
    }
    output.end(line);
}

/**
 *  Create access-logs link.
 *  @arg pathname to the home directory.
 *  @arg account name.
 */
function createAccessLogs(pathname, account) {
    var e;
    if (!fs.existsSync(pathname)) {
        console.error("ERROR: createAccessLogs: pathname does not exist: " + pathname);
        return;
    }
    var cwd = process.cwd();
    process.chdir(pathname);
    try {
        fs.unlinkSync('access-logs');
    } catch (e) {
    }
    var linkname = '../../usr/local/apache/domlogs/' + account;
    try {
        fs.symlinkSync(linkname, 'access-logs');
    } catch (e) {
        console.error("ERROR: unable to create access-logs link: " + e.message);
    }
    process.chdir(cwd);
}

/**
 *  Create account domlogs links.
 *  @arg pathname to the domlog.
 *  @arg account name.
 *  @arg files Array of log file names.
 */
function createAccountLogs(pathname, account, files) {
    if (!fs.existsSync(pathname)) {
        console.error("ERROR: createAccountLogs: pathname does not exist: " + pathname);
        return;
    }
    var accountDir = path.join(pathname, account);
    mkdir(accountDir);
    files.forEach(function (file) {
        var e;
        var source = path.join(pathname, file);
        var dest = path.join(accountDir, file);
        try {
            if (fs.existsSync(source)) {
                if (fs.existsSync(dest)) {
                    fs.unlinkSync(dest);
                }
                fs.linkSync(source, dest);
            } else {
                console.error("ERROR: createAccountLogs: source does not exist: " + source);
            }
        } catch (e) {
            console.error("ERROR: createAccountLogs: unable to create link from " + source + " to " + dest);
        }
    });
}

var ips = [
    '100.43.83.155',
    '107.20.105.156',
    '108.178.58.134',
    '108.61.95.199',
    '109.206.179.190',
    '113.212.70.155',
    '118.210.119.98',
    '119.63.193.131',
    '119.63.193.132',
    '119.63.193.194',
    '119.63.193.195',
    '119.63.193.196',
    '122.162.24.97',
    '150.70.172.103',
    '150.70.172.108',
    '150.70.75.29',
    '157.55.32.102',
    '157.55.32.105',
    '157.55.32.94',
    '157.55.33.50',
    '157.55.33.83',
    '157.55.34.25',
    '157.55.36.39',
];

var agents = {
        "phone":        "Mozilla/5.0 (iPhone; CPU iPhone OS 5_0_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A405 Safari/7534.48.3",
        "mobile":       "Opera/9.80 (J2ME/MIDP; Opera Mini/4.3.24214/28.2555; U; en) Presto/2.8.119 Version/11.10",
        "tablet":       "Mozilla/5.0 (iPad; CPU OS 6_1_2 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10B147 Safari/8536.25",
        "browser":      "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; bgft)",
        "desktop":      "Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:0.9.4.1) Gecko/20020508 Netscape6/6.2.3",
        "download":     "Wget/1.x+cvs-stable (Red Hat modified)",
        "checker":      "Jigsaw/2.2.x W3C_CSS_Validator_JFouffa/2.0",
        "bot":          "Googlebot/2.1 (+http://www.google.com/bot.html)",
        "unwanted":     "ZmEu",
        "unclassified": "LotusDiscovery/x.0 (compatible; Mozilla 4.0; MSIE 4.01; Windows NT)",
        "none":         "-",
        "proxy":        "MIIxpc/4.2",
        "unknown":      "WTF/1.0 (compatible; test user-agent)",
};
 
/**
 *  Return an access-log style timestamp string.
 *  @arg datetime Date for the timestamp.
 *  @rtype String.
 */           
function getTimestamp(datetime) {
    //            0         1         2         3         
    //            0123456789012345678901234567890123456789
    // toString  =Fri Jan 01 2010 06:34:56 GMT-0600 (CST)
    // timestamp =01/Jan/2010:06:34:56 -0600

    var s = datetime.toString();
    var result =
                s.substr(8, 2) + '/' +
                s.substr(4, 3) + '/' +
                s.substr(11, 4) + ':' +
                s.substr(16, 2) + ':' +
                s.substr(19, 2) + ':' +
                s.substr(22, 2) + ' ' +
                s.substr(28, 5);

//    console.log('toString =' + s);
//    console.log('timestamp=' + result);    
    return result;
}                

/**
 *  Return a combined format access-log entry.
 *  @arg host IP address.
 *  @arg time Date of entry.
 *  @arg method.
 *  @arg uri.
 *  @arg status.
 *  @arg size.
 *  @arg referer.
 *  @arg agent user-agent string.
 */
function getCombinedLogEntry(host, time, method, uri, status, size, referer, agent) {
    var s = host + ' - - ' +
            '[' + getTimestamp(time) + '] "' + 
            method + ' ' + 
            uri + ' HTTP/1.1" ' +
            status + ' ' +
            size + ' ' +
            '"' + referer + '" ' +
            '"' + agent + '"' +
            "\n";
    return s;
}

/**
 *  Make the xxx.dst.us test log.
 *  Midnight has one request, each additional hour has one additional request (1:00 = 2, etc.)
 *  @arg pathname of the log file.
 *  @arg start Date.
 *  @arg stop Date.
 */
function makeDstUs(pathname, start, stop) {
    var time = new Date(start.getTime());
    var output = fs.createWriteStream(pathname, { flags: 'w', encoding: 'utf8' });
    var line;
    var perHour = time.getHours() + 1;
    
    while (time.getTime() <= stop.getTime()) {
        if (time.getHours() == 0) {
            perHour = 1;
        }
        line = getCombinedLogEntry(ips[0], time, 'GET', '/', 200, 781, '-', agents["browser"]);
        for (var n=0; n < perHour; n++) {
            output.write(line);
        }
        time.setTime(time.getTime() + (60 * 60 * 1000));
        perHour += 1;
    }
    output.end();
}

/**
 *  Make the days.info test log.
 *  Contains one "normal" request per hour. Contains one request for each agent type per day.
 *  @arg pathname of the log file.
 *  @arg start Date.
 *  @arg stop Date.
 */
function makeDaysInfo(pathname, start, stop) {
    var time = new Date(start.getTime());
    var perDay = new Date();
    var ipIndex = 0;
    var output = fs.createWriteStream(pathname, { flags: 'w', encoding: 'utf8' });
    var line;
    var field;
    
    while (time.getTime() <= stop.getTime()) {
        line = getCombinedLogEntry(ips[0], time, 'GET', '/pub/tuhs.org/PDP-11/Trees/2.11BSD/usr/src/usr.lib/lib2648/rdchar.c', 200, 781, '-', agents["bot"]);
        output.write(line);
        if (time.getHours() == 0) {
            perDay.setTime(time.getTime() + ((60 * (1 + time.getMonth())) + time.getDate()) * 1000);
            ipIndex = 1;
            for (field in agents) {
                line = getCombinedLogEntry(ips[ipIndex], perDay, 'GET', '/' + field, 200, 17681, '-', agents[field]);
                output.write(line);
                ipIndex += 1;
            }
        }
        time.setTime(time.getTime() + (60 * 60 * 1000));
    }
    output.end();
}

/**
 *  Make the minutes.info test log.
 *  Contains one "normal" request per minute.
 *  @arg pathname of the log file.
 *  @arg start Date.
 *  @arg stop Date.
 */
function makeMinutesInfo(pathname, start, stop) {
    var time = new Date(start.getTime());
    var perDay = new Date();
    var ipIndex = 0;
    var output = fs.createWriteStream(pathname, { flags: 'w', encoding: 'utf8' });
    var line;
    var field;
    
    while (time.getTime() <= stop.getTime()) {
        line = getCombinedLogEntry(ips[6], time, 'GET', '/rdchar.c', 200, 781, '-', agents["download"]);
        output.write(line);
        time.setTime(time.getTime() + (60 * 1000));
    }
    output.end();
}

/**
 *  Make the minutes.info test log.
 *  Contains one "normal" request per minute.
 *  @arg pathname of the log file.
 *  @arg start Date.
 *  @arg stop Date.
 */
function makeSecondsInfo(pathname, start, stop) {
    var time = start;
    var perDay = new Date();
    var ipIndex = 0;
    var output = fs.createWriteStream(pathname, { flags: 'w', encoding: 'utf8' });
    var line;
    var field;
    
    while (time.getTime() <= stop.getTime()) {
        line = getCombinedLogEntry(ips[6], time, 'GET', '/favicon.ico', 200, 781, '-', agents["unwanted"]);
        output.write(line);
        time.setTime(time.getTime() + (1 * 1000));
    }
    output.end();
}

/**
 *  Make the bandwidth.net test log.
 *  @arg pathname of the log file.
 *  @arg start Date.
 *  @arg stop Date.
 */
function makeBandwidthNet(pathname, start, stop) {
    var time = start;
    var ipIndex = 0;
    var output = fs.createWriteStream(pathname, { flags: 'w', encoding: 'utf8' });
    var line;
    var field;
    var size= 512;
    
    while (time.getTime() < stop.getTime()) {
        for (field in agents) {
            if (ipIndex == ips.length) {
                ipIndex = 0;
                size = 512;
            }
            line = getCombinedLogEntry(ips[ipIndex], time, 'GET', '/' + field, 200, size, '-', agents[field]);
            output.write(line);
            if (field == 'download') {
                for (var n=0; n < 15; n++) {
                    output.write(line);
                }
            }
            size = Math.floor(1.7 * size);
            ipIndex += 1;
        }
        time.setTime(time.getTime() + 600000);
    }
    output.end();
}

/**
 *  Create a dummy file (which should be ignored.)
 *  @arg pathname of the file.
 */
function makeIgnoredFile(pathname) {
    if (!fs.existsSync(pathname)) {
        var output = fs.createWriteStream(pathname, { flags: 'w', encoding: 'utf8' });
        output.write("# this file should be ignored.\n");
        output.end();
    }
}

/**
 *  Main entry point for prepublish script.
 */
function main() {
    if (!fs.existsSync('data')) {
        console.error("ERROR: no data directory.");
        return;
    }

    // cpanel alscan account
    copyFile('data/logs/alscan.info', 'data/cpanel/usr/local/apache/domlogs/alscan.info');
    makeMinutesInfo('data/cpanel/usr/local/apache/domlogs/minutes.alscan.info', new Date(2013, 0, 1, 0, 0, 0), new Date(2013, 0, 1, 23, 59, 59));
    makeSecondsInfo('data/cpanel/usr/local/apache/domlogs/seconds.alscan.info', new Date(2012, 11, 31, 0, 0, 0), new Date(2013, 0, 1, 23, 59, 59));
    makeDstUs('data/cpanel/usr/local/apache/domlogs/dst.alscan.info', new Date(2012, 10, 4, 0, 0, 0), new Date(2012, 10, 11, 23, 0, 0));
    makeDstUs('data/cpanel/usr/local/apache/domlogs/addon.alscan.info', new Date(2012, 2, 11, 0, 0, 0), new Date(2012, 2, 18, 23, 0, 0));
    makeDaysInfo('data/cpanel/usr/local/apache/domlogs/days.alscan.info', new Date(2012, 0, 1, 0, 0, 0), new Date(2012, 0, 31, 23, 0, 0));
    makeBandwidthNet('data/cpanel/usr/local/apache/domlogs/bandwidth.alscan.info', new Date(2001, 0, 1, 6, 34, 56), new Date(2001, 0, 1, 10, 0, 0));
    createAccountLogs('data/cpanel/usr/local/apache/domlogs', 'alscan',
        [
            'addon.alscan.info',
            'alscan.info',
            'bandwidth.alscan.info',
            'days.alscan.info',
            'dst.alscan.info',
            'minutes.alscan.info',
            'seconds.alscan.info'
        ]
    );
    

    // cpanel druid account
    copyFile('data/logs/alscan-org.druiddesigns.com', 'data/cpanel/usr/local/apache/domlogs/alscan-org.druiddesigns.com');
    copyFile('data/logs/ddinfo.druiddesigns.com', 'data/cpanel/usr/local/apache/domlogs/ddinfo.druiddesigns.com');
    copyFile('data/logs/ddnet.druiddesigns.com', 'data/cpanel/usr/local/apache/domlogs/ddnet.druiddesigns.com');
    copyFile('data/logs/ddorg.druiddesigns.com', 'data/cpanel/usr/local/apache/domlogs/ddorg.druiddesigns.com');
    copyFile('data/logs/druiddesigns.com', 'data/cpanel/usr/local/apache/domlogs/druiddesigns.com');
    copyFile('data/logs/druiddesigns.com-ssl_log', 'data/cpanel/usr/local/apache/domlogs/druiddesigns.com-ssl_log');
    copyFile('data/logs/ftp.druiddesigns.com-ftp_log', 'data/cpanel/usr/local/apache/domlogs/ftp.druiddesigns.com-ftp_log');
    copyFile('data/logs/isinfo.druiddesigns.com', 'data/cpanel/usr/local/apache/domlogs/isinfo.druiddesigns.com');
    copyFile('data/logs/isorg.druiddesigns.com', 'data/cpanel/usr/local/apache/domlogs/isorg.druiddesigns.com');
    copyFile('data/logs/redmine.druiddesigns.com', 'data/cpanel/usr/local/apache/domlogs/redmine.druiddesigns.com');
    copyFile('data/logs/z80cim.druiddesigns.com', 'data/cpanel/usr/local/apache/domlogs/z80cim.druiddesigns.com');
    createAccountLogs('data/cpanel/usr/local/apache/domlogs', 'druid',
        [
            'alscan-org.druiddesigns.com',
            'ddinfo.druiddesigns.com',
            'ddnet.druiddesigns.com',
            'ddorg.druiddesigns.com',
            'druiddesigns.com',
            'druiddesigns.com-ssl_log',
            'ftp.druiddesigns.com-ftp_log',
            'isinfo.druiddesigns.com',
            'isorg.druiddesigns.com',
            'redmine.druiddesigns.com',
            'z80cim.druiddesigns.com'
        ]
    );
    createAccessLogs('data/cpanel/home1/druid', 'druid');
    

    // cpanel samplx account
    copyFile('data/logs/samplx.org', 'data/cpanel/usr/local/apache/domlogs/samplx.org');
    copyFile('data/logs/pub.samplx.org', 'data/cpanel/usr/local/apache/domlogs/pub.samplx.org');
    createAccountLogs('data/cpanel/usr/local/apache/domlogs', 'samplx',
        [
            'pub.samplx.org',
            'samplx.org'
        ]
    );

    // cpanel main log
    copyFile('data/logs/main-access_log', 'data/cpanel/usr/local/apache/logs/access_log');
    // cpanel panel log
    copyFile('data/logs/cpanel-access_log', 'data/cpanel/usr/local/cpanel/logs/access_log');

    // cpanel test wtmp file
    copyFile('data/datetime/valid/var/log/wtmp', 'data/cpanel/var/log/wtmp');

    // cpanel create ignored files.
    var cpanelIgnored = [
            'addon.alscan.info-bytes_log',
            'alscan.info-bytes_log',
            'bandwidth.alscan.info-bytes_log',
            'days.alscan.info-bytes_log',
            'dst.alscan.info-bytes_log',
            'minutes.alscan.info-bytes_log',
            'seconds.alscan.info-bytes_log',
            'alscan-org.druiddesigns.com-bytes_log',
            'ddinfo.druiddesigns.com-bytes_log',
            'ddnet.druiddesigns.com-bytes_log',
            'ddorg.druiddesigns.com-bytes_log',
            'druiddesigns.com-bytes_log',
            'druiddesigns.com-ssl_log.bkup',
            'druiddesigns.com.bkup2',
            'ftp.druiddesigns.com-ftp_log.offset',
            'ftp.druiddesigns.com-ftp_log.offsetftpbytes',
            'isinfo.druiddesigns.com-bytes_log',
            'isorg.druiddesigns.com-bytes_log',
            'redmine.druiddesigns.com-bytes_log',
            'z80cim.druiddesigns.com-bytes_log',
            'pub.samplx.org-bytes_log',
            'samplx.org-bytes_log',
            'ftpxferlog',
            'ftpxferlog.offset',
            'ftpxferlog.offsetftpsep',
        ];
    cpanelIgnored.forEach(function (file) {
        var pathname = path.join('data/cpanel/usr/local/apache/domlogs', file);
        makeIgnoredFile(pathname);
    });
    
    // plesk files
    copyFile('data/datetime/valid/var/log/wtmp', 'data/plesk/var/log/wtmp');
    copyFile('data/logs/main-access_log', 'data/plesk/var/log/httpd/access_log');
    copyFile('data/logs/pub.samplx.org', 'data/plesk/var/log/httpd/ssl_access_log');
    copyFile('data/cpanel/usr/local/apache/domlogs/alscan.info', 'data/plesk/var/www/vhosts/alscan.info/statistics/logs/access_log');
    copyFile('data/cpanel/usr/local/apache/domlogs/bandwidth.alscan.info', 'data/plesk/var/www/vhosts/bandwidth.net/statistics/logs/access_log');
    copyFile('data/cpanel/usr/local/apache/domlogs/days.alscan.info', 'data/plesk/var/www/vhosts/days.info/statistics/logs/access_log');
    copyFile('data/cpanel/usr/local/apache/domlogs/minutes.alscan.info', 'data/plesk/var/www/vhosts/minutes.info/statistics/logs/access_log');
    copyFile('data/cpanel/usr/local/apache/domlogs/seconds.alscan.info', 'data/plesk/var/www/vhosts/seconds.info/statistics/logs/access_log');
    copyFile('data/cpanel/usr/local/apache/domlogs/dst.alscan.info', 'data/plesk/var/www/vhosts/fall.dst.us/statistics/logs/access_log');
    copyFile('data/cpanel/usr/local/apache/domlogs/addon.alscan.info', 'data/plesk/var/www/vhosts/spring.dst.us/statistics/logs/access_log');

    // create lines test files.
    mkdir('data/lines');
    mklines('data/lines/lines', 10000, true);
    mklines('data/lines/no-nl', 10000, false);
    
}

main();

