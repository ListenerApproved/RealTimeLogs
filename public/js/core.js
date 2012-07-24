"use strict"; 

jQuery(function($) { 
	window.graphEnabled = false;
	if (localStorage.hideip) {
		$("#hide-ip").val(localStorage.getItem("hideip"))
		console.log("read " + localStorage.getItem("hideip"))
	}

	var lineNum = 0;
	window.linenum = lineNum;
	var socket = io.connect('',{reconnect: true});
	var uniqueServers = [];
	socket.on('log', function (data) {
		parseLine(data);
	});

	var urlize = function(text) {
		var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return ("" + text).replace(exp,'<a href="$1" rel="nofollow" target="_blank">$1</a>');
	};

	//ParLine and LogLine should be more readable and well defined. 
	function parseLine(data) {
		currentLineCount = data.lineCount
		$('.numMessages').html(addCommas(currentLineCount) + " <span class='subtext'>messages</span>")
		var temp = data.text.split(' ');
		var tmpIP = " "
		for (var i in temp){ //find the ip
			if (temp[i].match(/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/)) {
				tmpIP = temp[i]
			} 
		}
		logLine(data.group, data.lineCount, data.server, temp[1] +' '+ temp[2] +' '+ temp[3], tmpIP, 'type', data.text)
	}

	function logLine(group, lineCount, server, date, ip, type, message){
		var ipArray = $('#hide-ip').val().split(",")
		if ($.inArray(ip, ipArray) == -1) {
			var msg = urlize(message.replace(date, '').replace(ip, '').replace(/-\s(?!:-)/g, ''));
			var line = '<tr name=' + group + ' class="lineItem ' + group + '">' +
			'<td class="lineNum">' + addCommas(lineCount) + '</td>' +
			'<td>' + date + '</td>' +
			'<td>' + server + '</td>' +
			'<td><a target=_blank href="http://ip-address-lookup-v4.com/ip/' + ip + '">' + ip + '</a></td>' +
			'<td class="msg">' + msg + '</td>' +
			'</tr>';
			$('#datagrid').prepend(line);
			if (lineNum > 1000) {
		    	$('.lineItem').last().remove();
		    }
		    lineNum++;
		    window.linenum = lineNum;
		}
	}

	//Date and Time stuff here
	function two(x) {return ((x>9)?"":"0")+x}
	function three(x) {return ((x>99)?"":"0")+((x>9)?"":"0")+x}

	function time(ms) {
		var sec = Math.floor(ms/1000)
		ms = ms % 1000
		//t = three(ms)
		var t = ""

		var min = Math.floor(sec/60)
		sec = sec % 60
		t = two(sec) + ":" + t

		var hr = Math.floor(min/60)
		min = min % 60
		t = two(min) + ":" + t

		var day = Math.floor(hr/60)
		hr = hr % 60
		t = two(hr) + ":" + t
		t = day + ":" + t

		return t
	}
	var currentLineCount = 0;
	var connectMS = 0;
	setInterval(function(){
		connectMS += 1000
		$('.elapsed').html(time(connectMS) + " <span class='subtext'>elapsed</span>")
		$('.mps').html(Math.round(currentLineCount / (connectMS / 60000) ) + "<span class='subtext'> MPM</span>")
		window.graphEnabled = true; //Wait one second until all the start up data is done loading to start graphing.
	},1000);
	//
	socket.on('system', function (data) {
		if (data.servers){
			data.servers.forEach(function (elem){
				uniqueServers.push(elem.group)
			});
			connectMS = data.time
			$('.serverCount').html(data.servers.length + "<span class='subtext'> servers</span>")
			$('.elapsed').html(time(connectMS) + " <span class='subtext'>elapsed</span>")
		}
		var serverGroups = _.uniq(uniqueServers)
		jQuery.fn.exists = function(){return this.length>0;}
		serverGroups.forEach(function (elem){

			if ($('#' + elem).size() === 0) {
				$('.footer').append('<div name="' + elem + '" id="' + elem + '" class="serversGroup " >' + elem + '</div>');
			}
		});
	});

	socket.on('buffer', function (result) {
		result.buffer || (result.buffer = []);
		result.buffer.forEach(function(data) {
			parseLine(data)
		})
	});


	$('.footer').on('click', '.serversGroup', function() {
		var btnName = $(this).attr('name')

		$('#master').find('tr').each(function() {
			$(this).show();
		})

		if (btnName != "all") {
			$('#master').find('tr').each(function() {
				var row = $(this);
				if ($(this).attr('name') != btnName) {
					row.hide()
				} else {
					$(this).show();
				}
			})
		}
	});

	function resizeScreen(){ 
		var autoMasterHeight = $(window).height() - ($(".topbar").height() + $(".footer").height())
		$("#master").css({"height": autoMasterHeight})
	}
	resizeScreen();

	$(window).resize(function() {
		resizeScreen();
	});

	function addCommas(nStr) {
		nStr += '';
		var x = nStr.split('.');
		var x1 = x[0];
		var x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
	}
});
