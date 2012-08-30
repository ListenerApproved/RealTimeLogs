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

	socket.on('log', parseLine);

	function urlize(text) {
		var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return ("" + text).replace(exp, '<a href="$1" rel="nofollow" target="_blank">$1</a>');
	};

	function isIP(text) {
		return ("" + text).match(/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/);
	};

	function addCommas(nStr) {
		var x = ("" + nStr).split('.');
		var x1 = x[0],
				x2 = !!x[1] ? ('.' + x[1]) : '';

		x1 = x1.replace(/(\d+)(\d{3})/g, '$1,$2');
		return x1 + x2;
	}

	//ParLine and LogLine should be more readable and well defined.
	function parseLine(data) {
		currentLineCount = data.lineCount

		$('.numMessages').html(addCommas(currentLineCount) + '<span class="subtext"> messages</span>');

		var temp = ("" + data.text).split(' '),
				tmpIP = " ";

		temp.forEach(function(maybeIP) {
			if(isIP(maybeIP)) {
				tmpIP = maybeIP;
				return false;
			}
		});

		logLine(data.group, data.lineCount, data.server, temp.slice(0, 3).join(' '), tmpIP, 'type', data.text)
	}

	function logLine(group, lineCount, server, date, ip, type, message){
		var ipArray = $('#hide-ip').val().split(",");

		if ($.inArray(ip, ipArray) == -1) {
			var msg = urlize(message.replace(date, '').replace(ip, '').replace(/-\s(?!:-)/g, ''));
			var line = '<tr class="lineItem ' + group + '">' +
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

	setInterval(function() {
		connectMS += 1000
		$('.elapsed').html(time(connectMS) + '<span class="subtext"> servers</span>');
		$('.mps').html(Math.round(currentLineCount / (connectMS / 60000) ) + '<span class="subtext"> MPM</span>');
		window.graphEnabled = true; //Wait one second until all the start up data is done loading to start graphing.
	}, 1000);

	//
	socket.on('system', function (data) {
		if(data && data.time) connectMS = data.time;

		if(data && data.servers) {
			var serverGroups = _.pluck(data.servers, 'group');
			uniqueServers.push.apply(uniqueServers, serverGroups);


			$('.serverCount').html(data.servers.length + '<span class="subtext"> servers</span>');
			$('.elapsed').html(time(connectMS) + '<span class="subtext"> elapsed</span>');
		}

		var serverGroups = _.uniq(uniqueServers),
				groupCSS = "";

		serverGroups.forEach(function (elem){
			if ($('#' + elem).size() === 0) {
				$('.footer').append('<div data-group="' + elem + '" class="serversGroup">' + elem + '</div>');
				groupCSS += '#master.' + elem + ' tr.' + elem + ' { display: table-row; }\n';
			}
		});

		$("body").append('<style>' + groupCSS + '</style>');
	});

	socket.on('buffer', function (result) {
		(result.buffer || []).forEach(parseLine)
	});


	$('.footer').on('click', '.serversGroup', function() {
		$('.footer').find('.active').removeClass('active');
		$(this).addClass('active');

		$("#master").removeClass().addClass($(this).data('group') || 'all');
	});

	$(window).resize(function() {
		var autoMasterHeight = $(window).height() - ($(".topbar").height() + $(".footer").height()),
				autoCanvasWidth = Math.min(($(".topbar").width() - $(".topbarWrapper").width()) - 1, 1000);

		$("#master").css({ height: autoMasterHeight });
		$("canvas").css({ width: autoCanvasWidth, height: 40 });
	});

	$(window).resize();

	$("#save").on("click", function(){
		console.log("saved " + $('#hide-ip').val())
		localStorage.setItem("hideip", $('#hide-ip').val() )
	})
});
