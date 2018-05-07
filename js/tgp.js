// --------------------------------------------------------------------------------------------------------
// The Tall Grass Player
//
// A web based Internet radio station player for the browser and/or MPD
//
//
// (c)2017 The Green Island Companies LLC
// --------------------------------------------------------------------------------------------------------
//
//  This Source Code Form is subject to the terms of the Mozilla Public
//  License, v. 2.0. If a copy of the MPL was not distributed with this
//  file, You can obtain one at http://mozilla.org/MPL/2.0/.
// --------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------------------
// Global variables
// --------------------------------------------------------------------------------------------------------
var pageRefreshInterval;
var pollErrorCount = 0;
// the local play audio object
var localAudio;

// --------------------------------------------------------------------------------------------------------
// jQuery additions
// --------------------------------------------------------------------------------------------------------
	(function($){
      $.extend($.fn, {
		hideMessage: function(ms) {
			if(typeof(ms) === 'undefined') { 
				ms = 250;
			} 
			$(this).css({opacity:1}).animate({opacity: 0}, ms); 
			return this; }
      })
    })(jQuery)
	
// --------------------------------------------------------------------------------------------------------
// Rachet additions
// --------------------------------------------------------------------------------------------------------

// This is needed to proerly update the Rachet toggle on-screen item if it is updated by an external source (not the user)
function updateToggle(element, state) {

    let handle      = $(element).find('.toggle-handle');
    let toggleWidth = $(element).width();
    let handleWidth = $(handle).width();
    let offset      = (toggleWidth - handleWidth);

    if (state) {
      $(handle).css('transform', 'translate3d(' + offset + 'px,0,0)');
	  $(element).addClass("active");
    } else {
      $(handle).css('transform', 'translate3d(0,0,0)');
	  $(element).removeClass("active");
    }
}
// --------------------------------------------------------------------------------------------------------
// Volume knob specific javascript
//
// Based on https://codepen.io/blucube/pen/cudAz
// --------------------------------------------------------------------------------------------------------
var minangle = 0;
var maxangle = 270;
var angle = 0;
var isStartMove = false;
var center;

function pointerEventToXY(e){
	  var out = {x:0, y:0};
	  if(e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel'){
		touch = {pageX:0,pageY:0};
		if(e.touches && e.touches.length) {
			touch = e.touches[0];
		} else if (e.changedTouches && e.changedTouches.length) {
			touch = e.changedTouches[0];
		}
		out.x = touch.pageX;
		out.y = touch.pageY;
	  } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' || e.type=='mouseleave') {
		out.x = e.pageX;
		out.y = e.pageY;
	  }
	  return out;
};

function setAngle() {
  // rotate knob
  $('.knob').css({
    '-moz-transform':'rotate('+angle+'deg)',
    '-webkit-transform':'rotate('+angle+'deg)',
    '-o-transform':'rotate('+angle+'deg)',
    '-ms-transform':'rotate('+angle+'deg)',
    'transform':'rotate('+angle+'deg)'
  });
  
  // highlight ticks
  var activeTicks = (Math.round(angle / 10) + 1);
  $('.tick').removeClass('activetick');
  $('.tick').slice(0,activeTicks).addClass('activetick');
  
  // update % value in text
  var pc = Math.round((angle/270)*100);
  $('.current-value').text(pc+'%');
  
}

//calculates control's position related to top left corner of the page 
function findPos(obj) { 
	// Add up all the offsets for the entire page
	// Stop when the 'top' of the page is reached.
	// Note: This is a non-standard use of offsetParent() and
	// it can change if switching jQuery
	var curleft = curtop = 0; 
	if (obj.offsetParent()) { 
		do { 
			curleft += obj.position().left; 
			curtop += obj.position().top; 
			console.log(obj[0].tagName+" "+obj.position().left+":"+obj.position().top);
		} while ((!obj.is('html')) && (!obj.is('body')) && (obj = obj.offsetParent())); 
	}
	console.log('fp:'+curleft+','+curtop);
	return {X: curleft, Y: curtop}; 
}

function updateVolume(vol, callback) {
	// set the default value if callback is undefined
	callback = typeof callback !== 'undefined' ? callback : function(){};
	$.ajax({
		type: 'POST',
		contentType: 'application/json',
		url: 'api/mpd.php/setvolume',
		dataType: "json",
		data: JSON.stringify({'vol': vol}),
		success: callback,
		error: function(jqXHR, textStatus, errorThrown){
			console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);} 
	} );
}


// --------------------------------------------------------------------
// knob related bindings
//
// --------------------------------------------------------------------

$(document).ready(function() {

$('.knob').on('touchstart mousedown', function (e){
	if (!e) var e = window.event; 
	e.preventDefault();
	// Stop the polling refreshes - it causes a timing issue if the updates happen when moving the volume knob
	clearInterval(pageRefreshInterval);
	//alert('tstart');
	isStartMove = true;
	// Create a new refresh interval if one does not exist
	if (window.volumeRefreshInterval === undefined || window.volumeRefreshInterval == 0) {
		// This will update the volume while the volume knob is being dragged around
		// Only create if the interval isn't already running. This can Happen when a finger is dragged off screen without release
		window.volumeRefreshInterval = setInterval(function() {updateVolume(Math.round(angle/270*100));}, 400);
	}
});
		
$('.knob').on('touchmove mousemove', function (e){ 
		if (!e) var e = window.event;
        var xy = pointerEventToXY(e);
        e.preventDefault();
        if(isStartMove){ 
            var a = Math.atan2((xy.y - center.Y), (xy.x - center.X)) * 180 / Math.PI; //calculate angle
            // Dont rotate into the deadzone
			a = (a > 45 && a < 90 ? 45 : a );
			a = (a >= 90 && a < 135 ? 135 : a);
            var b = (a >= 135 ? a - 135 : 225 + a); //shift angle, so 0 will be on the same place as usual 270 
            // Prevent big changes. This also keeps the volume from jumping from 0-100% if someone swipes around the bottom
            if(Math.abs(b - angle) < 35) {
                angle = b;
                // There is rounding errors when setting the MPD volume. Include the error in the final
                // position so the knob doesn't jitter when the ajax returns
                angle = Math.round( Math.round(angle/270*100) /100*270);
            }
            // update the UI
            setAngle();
			//console.log("a: " + a + " cen: " + JSON.stringify(center) + " an: " + angle);
		}
});
		
$('.knob').on('touchend mouseup', function (e){ 
	if (!e) var e = window.event; 
	e.preventDefault();
	// Stop the volume update, clear the handle
	clearInterval(window.volumeRefreshInterval);
	window.volumeRefreshInterval = 0;
	isStartMove = false;
	setAngle();
	// Final update and UI refresh
	updateVolume(Math.round(angle/270*100), pollingUIUpdate);
	// Restart the screen update polls
	pageRefreshInterval = setInterval(function() {pollingUIUpdate();}, 5000);
});

});

// --------------------------------------------------------------------------------------------------------
// Data I/O routines
//
// --------------------------------------------------------------------------------------------------------

// --------------------------------------------------------------------
// Player items
// --------------------------------------------------------------------
function playerDeleteQueueItem(element, idx) {
	$.ajax({
		type: 'DELETE',
		url: 'api/mpd.php/deletequeueitem/'+Number(idx),
		dataType: "json", // data type of response
		success: function(data){
			// When the item is delete force a refresh of the list - a little overkill but safe
			showQueue(element);
		},
		error: function(jqXHR, textStatus, errorThrown){
			console.log('error: ' + jqXHR.responseText);} 
	});
}

function playerSetRepeat(state) {
	$.ajax({
		type: 'PUT',
		url: 'api/mpd.php/setrepeat/'+ state,
		dataType: "json"
	});
}

function playerPause(callback) {
	// set the default value if callback is undefined
	callback = typeof callback !== 'undefined' ? callback : function(){};
	// local playback check
	if (docCookies.getItem("localPlay") != "true") {
		$.ajax({type:'PUT', url:'api/mpd.php/transport/pause',success: callback() }); 
	} else {
		if(localAudio != undefined) {
			localAudio.pause();
			callback();
		}
	}
}

function playerPlay(calback) {
	// set the default value if callback is undefined
	callback = typeof callback !== 'undefined' ? callback : function(){};
	if (docCookies.getItem("localPlay") != "true") {
		$.ajax({type:'PUT', url:'api/mpd.php/transport/play',success: callback() });
	} else {
		if(localAudio != undefined) {
			localAudio.play();
			callback();
		}
	}
}

function playerStop(callback) {
	// set the default value if callback is undefined
	callback = typeof callback !== 'undefined' ? callback : function(){};
	if (docCookies.getItem("localPlay") != "true") {
		$.ajax({type:'PUT', url:'api/mpd.php/transport/stop',success:callback() });
	} else {
		// local player does not support stop
		if(localAudio != undefined) {
			localAudio.pause();
			callback();
		}
	}
}

function playerPrev(callback) {
	// set the default value if callback is undefined
	callback = typeof callback !== 'undefined' ? callback : function(){};
	$.ajax({type:'PUT', url:'api/mpd.php/transport/prev',success:callback() });
}

function playerNext(callback) {
	// set the default value if callback is undefined
	callback = typeof callback !== 'undefined' ? callback : function(){};
	$.ajax({type:'PUT', url:'api/mpd.php/transport/next',success:callback() });
}

function playerSeek(i, callback) {
	// set the default value if callback is undefined
	callback = typeof callback !== 'undefined' ? callback : function(){};
	$.ajax({type:'PUT', url:'api/mpd.php/seek/'+i,success:callback() });
}

// --------------------------------------------------------------------
// Add a station to the MPD queue
// --------------------------------------------------------------------
function addStationQ(plQ, stName, stURL) {
	// These three commands will add the stream to the queue, set the title name and set the artist name (to the stream name)
	$.ajax({
		type: 'POST',
		url: 'api/mpd.php/queueadd',
		dataType: 'json',
		data: JSON.stringify({'song': stURL }),
		success: function(data) {
			if (data.response) {
				let stID = Number((data.response).split(':')[1]);
				//console.log("updating {%stID}-{%stName}");
				// If configured, jump right to the track
				if (plQ) {
					$.ajax({
						type: 'PUT',
						url: 'api/mpd.php/seek/'+stID,
						datatype: 'json',
						error: function(jqXHR, textStatus, errorThrown){
							console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);} 
					});
				}
				// at the same time - update the metadata
				$.ajax({
					type: 'POST',
					url: 'api/mpd.php/queuetagadd',
					datatype: 'json',
					data: JSON.stringify({'id': stID, 'tag':'Title', 'data':stName}),
					success: function (data){
						$.ajax({
							type: 'POST',
							url: 'api/mpd.php/queuetagadd',
							datatype: 'json',
							data: JSON.stringify({'id': stID, 'tag':'albumartist', 'data':stName}),
							success: function (data){
								//console.log( JSON.stringify({'id': stID, 'tag':'Artist', 'data':stName}) ); 
								},
							error: function(jqXHR, textStatus, errorThrown){
								console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);} 
						});}
				});	
			} },
		failure: function(data) {console.log('fail '+data); }
	}); 
}
// --------------------------------------------------------------------
// Play a URL based station
// --------------------------------------------------------------------
function playStation(clQ, plQ, stName, stURL) {
	// local playback check
	if (docCookies.getItem("localPlay") != "true") {
		// check if we need to clear the queue before adding a new station
		if (clQ) {
			//console.log('clear');
			$.ajax({
				type: 'PUT',
				url: 'api/mpd.php/clearqueue',
				dataType: "json", // data type of response
				success: function(data) {addStationQ(plQ, stName, stURL);},
				error: function(jqXHR, textStatus, errorThrown){
					console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);} 
			});
		} else {
			addStationQ(plQ, stName, stURL);
		}
	} else {
		// stop any audio that is already playing
		if(localAudio != undefined) {
			localAudio.pause();
			localAudio.src = '';
			localAudio.load();
		}
		// setup and play the URL
		localAudio = new Audio(stURL);
		localAudio.play();
		pollingUIUpdate();
	}
}

// --------------------------------------------------------------------
// Play a system playlist
// --------------------------------------------------------------------
function playPlaylist(name) {
	// local audio does not support playlists - no special code here
	$.ajax({
		type: 'POST',
		contentType: 'application/json',
		url: 'api/mpd.php/queueplaylist',
		dataType: "json",
		data: JSON.stringify({'name':name}),
		success: function(data, textStatus, jqXHR){
			// on success cascade a update queue buton call
				$.ajax({
					type: 'GET',
					url: 'api/mpd.php/playqueue',
					dataType: "json", // data type of response
					success: updateQueueButton });
		},
		error: function(jqXHR, textStatus, errorThrown){
			console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);} 
	});
}

// --------------------------------------------------------------------
// --------------------------------------------------------------------
// Station DB items
// --------------------------------------------------------------------
function updateCatSort(element) {
	var sortedIDs = [];

	$(element).find('[name=sort]').each(function(index) { $(this).val(index+1); });
	$(element).find('[name=id]').each(function(index) { sortedIDs.push($(this).val()); } );
	$(element).find('form span.raise-btn').show();
	$(element).find('form span.lower-btn').show();
	$(element).find('form span.raise-btn').first().hide();
	$(element).find('form span.lower-btn').last().hide();
	//console.log(JSON.stringify({'catOrder': sortedIDs.toString() }));
	$.ajax({
		type: 'POST',
		contentType: 'application/json',
		url: 'api/stations.php/setcatorder',
		dataType: "json",
		data: JSON.stringify({'catOrder': sortedIDs.toString() }),
		error: function(jqXHR, textStatus, errorThrown){
			console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);
		} 
	} );

};

function updateStationSort(element) {
	var sortedIDs = [];

	$(element).find('[name=sort]').each(function(index) { $(this).val(index+1); });
	$(element).find('[name=id]').each(function(index) { sortedIDs.push($(this).val()); } );
	$(element).find('form span.raise-btn').show();
	$(element).find('form span.lower-btn').show();
	$(element).find('form span.raise-btn').first().hide();
	$(element).find('form span.lower-btn').last().hide();
	$.ajax({
		type: 'POST',
		contentType: 'application/json',
		url: 'api/stations.php/setstationorder',
		dataType: "json",
		data: JSON.stringify({'stOrder': sortedIDs.toString() }),
		error: function(jqXHR, textStatus, errorThrown){
			console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);}
	} );
}

function saveCatForm(event) {
	let thisForm = $(this);

	event.preventDefault();
	$.ajax({
		type: 'PUT',
		data: $(this).serialize(),
		url: 'api/stations.php/updatecat/' + $(this).find('[name=id]').val(),
		success: function() { 
			// Update the output fields with edited record info
			$(thisForm).find('.cat-name-text').html($(thisForm).find('[name=cat-name]').val());
			$(thisForm).css({"background-color": $(thisForm).find('[name=color]').val()});
			// Remove the edit fields and show the display field
			$(".bar-footer .message-area").html("Updated").fadeIn(100).delay(5000).fadeOut(750);
			$('#page_edit .st-name-edit').hide();
			$('#page_edit .st-name-display').show();
			$('#page_edit .st-edit').each(function(i){$(this).slideUp(200);});
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);
			$(".bar-footer .message-area").html("ERROR").fadeIn(50).delay(9000).fadeOut(750);
		}
	} );
};

function saveCatFormNew(event) {

	let thisForm = $(this);

	// Stop the browser from submitting the form.
	event.preventDefault();
	$.ajax({
		type: 'POST',
		data: $(this).serialize(),
		url: 'api/stations.php/updatecat',
		success: function(jqXHR, textStatus) { 
			// Update the output fields with new record info
			$(thisForm).find('.cat-name-text').html($(thisForm).find('[name=cat-name]').val());
			// The new ID is in the return code
			$(thisForm).find('[name=id]').val(Number(jqXHR.id));
			$(thisForm).css({"background-color": $(thisForm).find('[name=color]').val()});
			// Update the sorting fields
			updateCatSort($(thisForm).parent());
			// Remove the 'new_st' class
			$(thisForm).removeClass('new_cat');
			// add the form submit (update) handler
			$(thisForm).unbind('submit');
			$(thisForm).submit(saveCatForm);
			// Remove the edit fields and show the display field
			$(".bar-footer .message-area").html("Added").fadeIn(100).delay(5000).fadeOut(750);
			$('#page_edit .st-name-edit').hide();
			$('#page_edit .st-name-display').show();
			$('#page_edit .st-edit').each(function(i){$(this).slideUp(200);});
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);
			$(".bar-footer .message-area").html("ERROR").fadeIn(50).delay(9000).fadeOut(750);
		}
	} );
};

function saveStationForm(event) {
	let thisForm = $(this);

	event.preventDefault();
	// Check if this is just a save or a save and move to a new cat
	// If you create a new item and then save it again, it will not have a moveCat field. Just treat it as a basic save
	if ($(this).find('[name=moveCat]').length === 0 || Number($(this).find('[name=cat]').val()) === Number($(this).find('[name=moveCat]').val())) {
		$.ajax({
			type: 'PUT',
			data: $(this).serialize(),
			url: 'api/stations.php/updatestation/' + $(this).find('[name=id]').val(),
			success: function() { 
				// Update the output fields with edited record info
				$(thisForm).find('.st-name-text').html($(thisForm).find('[name=st-name]').val());
				$(".bar-footer .message-area").html("Updated").fadeIn(100).delay(5000).fadeOut(750);
				$('#page_edit .st-name-edit').hide();
				$('#page_edit .st-name-display').show();
				$('#page_edit .st-edit').each(function(i){$(this).slideUp(200);});
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);
				$(".bar-footer .message-area").html("ERROR").fadeIn(100).delay(9000).fadeOut(750);
			}
		} );
	} else {
		// Set the sort value to put the new item at the end
		$(this).find('[name=sort]').val(9999);
		$.ajax({
			type: 'PUT',
			data: $(this).serialize(),
			url: 'api/stations.php/movestation/' + $(this).find('[name=id]').val(),
			success: function() {
				// Just hide the form and show a message
				$(thisForm).hide();
				$(".bar-footer .message-area").html("Moved").fadeIn(100).delay(5000).fadeOut(750);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);
				$(".bar-footer .message-area").html("ERROR").fadeIn(100).delay(9000).fadeOut(750);
			}
		} );
	}
}

function saveStationFormNew(event) {
	// Stop the browser from submitting the form.
	let thisForm = $(this);

	console.log("save");
	event.preventDefault();
	$.ajax({
		type: 'POST',
		data: $(this).serialize(),
		url: 'api/stations.php/updatestation/' + $(this).find('[name=cat]').val(),
		success: function(jqXHR, textStatus) { 
			// Update the output fields with edited record info
			$(thisForm).find('.st-name-text').html($(thisForm).find('[name=st-name]').val());
			// The new ID is in the return code
			$(thisForm).find('[name=id]').val(Number(jqXHR.id));
			// Update the sorting fields
			updateStationSort($(thisForm).parent());
			// Remove the 'new_st' class
			$(thisForm).removeClass('new_st');
			// add the form submit (update) handler
			$(thisForm).unbind('submit');
			$(thisForm).submit(saveStationForm);
			// Remove the edit fields and show the display field
			$(".bar-footer .message-area").html("Added").fadeIn(100).delay(5000).fadeOut(750);
			$('#page_edit .st-name-edit').hide();
			$('#page_edit .st-name-display').show();
			$('#page_edit .st-edit').each(function(i){$(this).slideUp(200);});
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);
			$(".bar-footer .message-area").html("ERROR").fadeIn(100).delay(9000).fadeOut(750);
		}
	} );
}

// --------------------------------------------------------------------------------------------------------
// UI update routines
//
// --------------------------------------------------------------------------------------------------------

function mainPageRender() {
	// Shows the main page - called on initial load and after edits
	$('.st_list:not(#l_pl)').remove();
	$.ajax({
		type: 'GET',
		url: 'api/stations.php/allstations',
		dataType: "json", // data type of response
		cache: false,
		success: function(data) {
			//console.log(data);
			$("#page_home").prepend(tmpl("mainpage-station-list",data));
			//$("#st_edit").prepend(tmpl("st-edit",data));
		},
		error: function(jqXHR, textStatus, errorThrown){
			console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);
		} 		
	});
	
	// In local play mode hide the UI elements that don't do anything
	if (docCookies.getItem("localPlay") == "true") {
		$('.st_list#l_pl').hide();
		$('#btn-prev').hide();
		$('#btn-next').hide();
		$('#btn-volume').hide();
	} else {
		$('.st_list#l_pl').show();
		$('#btn-prev').show();
		$('#btn-next').show();
		$('#btn-volume').show();
	}
}

function catListRender() {
	// Remove the current content and rerender
	$('#cat_list').remove();
	// Get the station group list and update the page
	$.ajax({
		type: 'GET',
		url: 'api/stations.php/allstations',
		dataType: "json", // data type of response
		cache: false,
		success: function(data) {
			$("#page_edit").html(tmpl("cat-edit",data)); 
			$('#cat_list').find('form span.raise-btn').first().hide();
			$('#cat_list').find('form span.lower-btn').last().hide();
			// add the form submit handler
			$('#cat_list form').submit(saveCatForm);
			// Create the drag to sort object
			Sortable.create(cat_list, { handle: '.icon-bars',
				// This corrects the 44px space in the header. For some reason it adds an offset
				// to the dragged class without this item
				fallbackOffset: {x: 0, y: -44},
				onSort: function(evt) { updateCatSort($(evt.item).closest('form').parent()); } });		
			$("#page_edit").show(); },
		failure: function() {
			$("#page_edit").html("ERROR");
			$("#page_edit").show(); }
	} );
}

function updateVolumeAngle(data) {
	// Volume is 0-100%, map that to the angle
	angle = Math.round(data.volume/100*270);
	setAngle();
};

function renderSystemPlaylist(element) {
	$.ajax({
		type: 'GET',
		url: 'api/mpd.php/playlists',
		dataType: "json", // data type of response
		success: function (data) {
			// JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
			let list = data == null ? [] : (data.playlists instanceof Array ? data.playlists : [data.playlists]);
			
			$(element).find('ul li').remove();
			$(element).find('ul').append(tmpl("playlists", list));
		},
		error: function(jqXHR, textStatus, errorThrown){
			console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);} 
	});
};

function updateQueueButton(data) {
	// JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
	let list = data == null ? [] : (data.playqueue instanceof Array ? data.playqueue : [data.playqueue]);
	$('#queueinfo').html("Queue - " + list.length);
};

function showQueue(element) {
	// Only check the server is this isn't local play mode
	if (docCookies.getItem("localPlay") != "true") {
		$.ajax({
			type: 'GET',
			url: 'api/mpd.php/playqueue',
			dataType: "json", // data type of response
			success: function(data) {
				// JAX-RS serializes an empty list as null, and a 'collection of one' as an object (not an 'array of one')
				let list = data == null ? [] : (data.playqueue instanceof Array ? data.playqueue : [data.playqueue]);

				element.html('');
				element.append(tmpl("playqueue", list));
				
				// The following should be moved to where all .on() elements are defined but it didn't work
				// when added there
				$('li').on('swipeleft', function (e) {
					playerDeleteQueueItem($('#page_queue'), $(this).attr('id').split('_')[1]);	
				});
				$.ajax({
					type: 'GET',
					url: 'api/mpd.php/status',
					dataType: "json", // data type of response
					success: function(data){
						element.find('#pl_'+Number(data.songid)).addClass('q_selected');
					}
				});
			},
			error: function(jqXHR, textStatus, errorThrown){
				element.html('<div class="content-padded"><h4>Cannot connect to MPD</h4></div>');
				console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);} 
		}); 
	} else {
		element.html('<div class="content-padded"><h3>Local mode does not queue</h3></div>');
	}
};

function pollingUIUpdate() {
	// Only check the server is this isn't local play mode
	if (docCookies.getItem("localPlay") != "true") {
		// update the Queue button 
		$.ajax({
			type: 'GET',
			url: 'api/mpd.php/playqueue',
			dataType: "json",
			success: function (e) {
				// Reset the error counter and set polling back to the normal time
				if (pollErrorCount >= 3) {
					clearInterval(pageRefreshInterval);
					pageRefreshInterval = setInterval(function() {pollingUIUpdate();}, 5000);
				}
				pollErrorCount = 0;
				updateQueueButton(e);
			},
			error: function (e) {
				pollErrorCount++;
				if (pollErrorCount == 3) {
					// If the server is missing for 3 tries, slow the checking
					$('#queueinfo').html("<span class='tgp-icon tgp-attention' style='margin-left: -7px;margin-right:6px'></span>ERROR");
					clearInterval(pageRefreshInterval);
					pageRefreshInterval = setInterval(function() {pollingUIUpdate();}, 15000);
					console.log("Connect connect - slowing polls #1");
				} else if (pollErrorCount == 10) {
					// If the server is missing for 10 tries (2 minutes), display message and slow checking more				
					clearInterval(pageRefreshInterval);
					pageRefreshInterval = setInterval(function() {pollingUIUpdate();}, 45000);
					console.log("Connect connect - slowing polls #2");
				}
			}

		});
		// Note: errors are checked and handled in the playqueue ajax call
		$.ajax({
			type: 'GET',
			url: 'api/mpd.php/status',
			dataType: "json", // data type of response
			success: function(data) {
				updateVolumeAngle(data);
				// This highlights the queue items (if on screen)
				$('#page_queue li').removeClass('q_selected');
				$('#page_queue #pl_'+Number(data.songid)).addClass('q_selected');
				if(data.state == 'play') {
					$('#btn-pause').show(); $('#btn-play').hide();
				} else {
					$('#btn-pause').hide(); $('#btn-play').show();
				}
				// This updates the repeat toggle item (on config screen)
				updateToggle($('#tog-repeat'), (Number(data.repeat) == 1) );
			}
		});
	} else {
		// update UI elements for local play
		if(localAudio != undefined && localAudio.paused != true) {
			$('#btn-pause').show(); $('#btn-play').hide();
		} else {
			$('#btn-pause').hide(); $('#btn-play').show();
		}
		$('#queueinfo').html("<span class='tgp-icon tgp-attention' style='margin-left: -7px;margin-right:6px'></span>LOCAL");
		// This updates the repeat toggle item - always false
		updateToggle($('#tog-repeat'), (false) );
		
	}
}

// --------------------------------------------------------------------
// stationRender(id)
// This will display the edit sceen for all stations in a category.
// --------------------------------------------------------------------
function stationRender(id) {
	// Display the list of station on the edit screen
	$.ajax({
		type: 'GET',
		url: 'api/stations.php/station/' + id,
		dataType: "json", // data type of response
		cache: false,
		success: function(data){
			$("#page_edit").html(tmpl("station_edit",data)); 
			// Hide the first raise button and the last lower button
			$('#st-edit-list').find('form span.raise-btn').first().hide();
			$('#st-edit-list').find('form span.lower-btn').last().hide();
			// add the form submit handler
			$('#st-edit-list form').submit(saveStationForm);
			// Create the drag to sort object
			Sortable.create(document.getElementById('st-edit-list'), { handle: '.icon-bars',
				// This corrects the 44px space in the header. For some reason it adds an offset
				// to the dragged class without this item
				fallbackOffset: {x: 0, y: -44},
				onSort: function(evt) { updateStationSort($(evt.item).closest('form').parent()); } });		
			$("#page_edit").show(); },
		failure: function() {
			$("#page_edit").html("ERROR");
			$("#page_edit").show(); }
	} );
}
    
// --------------------------------------------------------------------------------------------------------
// document ready calls
//
// --------------------------------------------------------------------------------------------------------

$(document).ready(function() {		
	pollingUIUpdate();
	// Update the standard info every 10 seconds
	pageRefreshInterval = setInterval(function() {pollingUIUpdate();}, 5000);
	
	// Load the templates, add them to the DOM, call AJAX to get the json data, and then render the template
	// with the json. This could be rewritten to use $.Deferred
	// This is used so the templates code can be stored in a different file from the html file
	$.ajax({
		url: 'templates/tgp-template.js',
		type : "GET",
		dataType: 'text',
		cache: true,
		success: function(contents) {
		// Add the templates to the DOM then layout the homepage
		$("#all_template").append(contents);
		mainPageRender();
		}
	});		

	// --------------------------------------------------------------------------------------------------------
	// setup all the UI bindings
	// --------------------------------------------------------------------------------------------------------
	//
	// --------------------------------------------------------------------
	// Edit stations - all key bindings
	// --------------------------------------------------------------------
	// long tap - go to station edit screen (from home screen)
	$('#page_home').on('taphold', '.st_list:not(#l_pl) .btn', function(e) {
		// Hide the current content, get the station info from ajax and render the edit template
		$('.page').hide();
		$('#btn-config').hide();
		$('#bar-home').hide();
		$('#btn-home').show();
		$('#bar-edit').show();
		$("span.add-st-button").show();
		$("span.add-cat-button").hide();
		// Show the items
		stationRender(Number($(this).parent().attr('id').split('_')[1]));
	} );
	$('#page_edit').on('click', '#st-edit-list .submit-btn', function(e) {
		// Arrg - have to validate the hard way since I'm too lazy to include
		// a library
		let formOK = true;
		
		if ($(this).closest('form').find('[name=st-name]').val().length < 3) { 
			$(this).parents('form').find('[name=st-name]').css({"border": "2px solid #f00"});
			$(".bar-footer .message-area").html("Too short").fadeIn(100).delay(9000).fadeOut(750);
			formOK = false;
		} else if ($(this).closest('form').find('[name=st-name]').val().length > 29) {
			$(this).parents('form').find('[name=st-name]').css({"border": "2px solid #f00"});
			$(".bar-footer .message-area").html("Too long").fadeIn(100).delay(9000).fadeOut(750);
			formOK = false;
		} else {
			$(this).parents('form').find('[name=st-name]').removeAttr( 'style' );
		}
		if ($(this).closest('form').find('[name=url]').val().length < 4) {
			$(this).parents('form').find('[name=url]').css({"border": "2px solid #f00"});
			$(".bar-footer .message-area").html("Too short").fadeIn(100).delay(9000).fadeOut(750);
			formOK = false;
		} else {
			$(this).parents('form').find('[name=url]').removeAttr( 'style' );
		}
		if (formOK) $(this).closest('form').submit();
	} );
	// Station reorder buttons
	$('#page_edit').on('click', '#st-edit-list .lower-btn', function(e) {
		var thisForm = $(this).closest('form');
		$(thisForm).insertAfter($(thisForm).next('form'));
		updateStationSort( $(thisForm).parent() );
	} );
	$('#page_edit').on('click', '#st-edit-list .raise-btn', function(e) {
		var thisForm = $(this).closest('form');
		$(thisForm).insertBefore($(thisForm).prev('form'));
		updateStationSort( $(thisForm).parent() );
	} );
	// Expand edit area
	$('#page_edit').on('click', '#st-edit-list .more-btn', function(e) {
		$('#page_edit .st-edit').each(function(i){$(this).slideUp(200);});
		$('#page_edit .st-name-edit').hide();
		$('#page_edit .st-name-display').show();
		$(this).parents().siblings('.st-edit').slideDown(200);
		$(this).closest('.st-name-display').hide();
		$(this).closest('.st-name-row').find('.st-name-edit').fadeIn(200);
	});
	$('#page_edit').on('click', '#st-edit-list .delete-btn', function(e) {
		let thisForm = $(this).parents('form');
		let parentForm = $(thisForm).parent();
		
		// Only items with IDs need to be removed from the DB. 'new' records can just be 
		// removed from the DOM
		if ($(thisForm).find('[name=id]').val() > 0) {
			$.ajax({
				type: 'DELETE',
				url: 'api/stations.php/deletestation/' + $(thisForm).find('[name=id]').val(),
				success: function() { 
					$(thisForm).remove();
					// Set the raise/lower buttons correctly
					$(parentForm).parent().find('form span.raise-btn').first().hide();
					$(parentForm).parent().find('form span.lower-btn').last().hide();			
					//Message
					$(".bar-footer .message-area").html("Deleted").fadeIn(100).delay(5000).fadeOut(750);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);
					$(".bar-footer .message-area").html("ERROR").fadeIn(100).delay(9000).fadeOut(750);
				}
			} );
		} else {
			$(thisForm).remove();
			// Set the raise/lower buttons correctly
			$(parentForm).parent().find('form span.raise-btn').first().hide();
			$(parentForm).parent().find('form span.lower-btn').last().hide();			
		}
	} );
	// Show the move station select box
	$('#page_edit').on('click', '.rowMoveCat', function (e) {$(this).find('.selMoveCat').show(); $(this).find('.txtMoveCat').hide(); } );
	// The station add button
	$('.add-st-button').on('click', function(e) {
		$('#page_edit .st-edit').each(function(i){$(this).slideUp(200);});
		$('#page_edit .st-name-edit').hide();
		$('#page_edit .st-name-display').show();
		$('#st-edit-list').append(tmpl("station_add", {cat: Number($('#st-edit-list').data("cat"))} ));
		$('#st-edit-list form.new_st').submit(saveStationFormNew);
	} );
	// --------------------------------------------------------------------
	// Edit groups - all key bindings
	// --------------------------------------------------------------------
	$('#btn-cat-edit').on('click', function(e) {
		// Happens on the config page. Hide the current page, hide the config button (shouldn't be shown anyway),
		// Show the home button, show the correct header and footer, show the cat add button (in footer)
		$('.page').hide();
		$('#btn-config').hide();
		$('#bar-home').hide();
		$('#btn-home').show();
		$('#bar-edit').show();
		$("span.add-st-button").hide();
		$("span.add-cat-button").show();
		catListRender();
	});	
	$('#page_edit').on('click', '#cat_list .submit-btn', function(e) {
		if ($(this).closest('form').find('[name=cat-name]').val().length > 2 ) {
			$(this).closest('form').submit();
		} else {
			$(this).parents('form').find('[name=cat-name]').css({"border": "2px solid #f00"});
			$(".bar-footer .message-area").html("Too short").fadeIn(100).delay(9000).fadeOut(750);
		} } );
	// Cat reorder buttons
	$('#page_edit').on('click', '#cat_list .lower-btn', function(e) {
		var thisForm = $(this).closest('form');
		$(thisForm).insertAfter($(thisForm).next('form'));
		updateCatSort( $(thisForm).parent() );
	} );
	$('#page_edit').on('click', '#cat_list .raise-btn', function(e) {
		var thisForm = $(this).closest('form');
		$(thisForm).insertBefore($(thisForm).prev('form'));
		updateCatSort( $(thisForm).parent() );
	} );
	// Expand edit area
	$('#page_edit').on('click', '#cat_list .more-btn', function(e) {
		$('#page_edit .st-edit').each(function(i){$(this).slideUp(200);});
		$('#page_edit .st-name-edit').hide();
		$('#page_edit .st-name-display').show();
		$(this).parents().siblings('.st-edit').slideDown(200);
		$(this).closest('.st-name-display').hide();
		$(this).closest('.st-name-row').find('.st-name-edit').fadeIn(200);
	});
	$('#page_edit').on('click', '#cat_list .delete-btn', function(e) {
		let thisForm = $(this).parents('form');
		let parentForm = $(thisForm).parent();
		
		// Only items with IDs need to be removed from the DB. 'new' records can just be 
		// removed from the DOM
		if ($(thisForm).find('[name=id]').val() > 0) {
			$.ajax({
				type: 'DELETE',
				url: 'api/stations.php/deletecat/' + $(thisForm).find('[name=id]').val(),
				success: function() { 
					$(thisForm).remove();
					// Set the raise/lower buttons correctly
					$(parentForm).parent().find('form span.raise-btn').first().hide();
					$(parentForm).parent().find('form span.lower-btn').last().hide();			
					//Message
					$(".bar-footer .message-area").html("Deleted").fadeIn(100).delay(5000).fadeOut(750);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					console.log('error: ' + jqXHR.responseText + " " + textStatus + " " + errorThrown);
					$(".bar-footer .message-area").html("ERROR").fadeIn(100).delay(9000).fadeOut(750);
				}
			} );
		} else {
			$(thisForm).remove();
			// Set the raise/lower buttons correctly
			$(parentForm).parent().find('form span.raise-btn').first().hide();
			$(parentForm).parent().find('form span.lower-btn').last().hide();			
		}
	} );
	// --------------------------------------------------------------------
	// Main page input elements
	// --------------------------------------------------------------------
	// Adding a station to the queue
	$('#page_home').on('click', '.station-link', function(e) {
		// Clearin the queue and autoplay based on cookie values
		playStation(docCookies.getItem("clearQ") == "true", docCookies.getItem("playItem") == "true", $(this).data('stationname'), $(this).data('stationurl'));
	});
	// Adding a playlist to the queue
	$('#page_home').on('click', '.pl_item', function(e) {
		playPlaylist($(this).text());
	});
	// Click on system playlist button. Hide anything open and open the playlist
	$('#page_home').on('click', '.st_list#l_pl .btn', function(e) { 
		$(this).parent().siblings().find('.stations').each(function() { $(this).hide(); });
		$(this).parent().find('.stations').toggle();
		renderSystemPlaylist($(this).parent());
	} );
	// Station group button - expand the list
	$('#page_home').on('click', '.st_list:not(#l_pl) .btn', function(e) { 
		$(this).parent().siblings().find('.stations').each(function() { $(this).hide(); });
		$(this).parent().find('.stations').toggle();} );

	// --------------------------------------------------------------------
	// Queue page bindings
	// --------------------------------------------------------------------
	// old UI/UX (the taphold sucked)
	//$('#page_queue').on('taphold', 'li', function (e) {
	//	playerDeleteQueueItem($('#page_queue'), $(this).attr('id').split('_')[1]);	
	//});
	
	// NOTE: the following does not work (swipe bug maybe?) when added here. So, it is added
	// to the code that renders the view of the queue.
	//$('#page_queue').on('swipeleft', 'li', function (e) {
	//	playerDeleteQueueItem($('#page_queue'), $(this).attr('id').split('_')[1]);	
	//});
	
	$('#page_queue').on('singletap', 'li', function (e) {
		// These lines fake the highlight because the UIUpdate can take a long time
		$('#page_queue li').removeClass('q_selected');
		$(this).addClass('q_selected');
	
		playerSeek($(this).attr('id').split('_')[1], function (e) { } );	
		//playerSeek($(this).attr('id').split('_')[1], function (e) {pollingUIUpdate();} );	
	});
	// --------------------------------------------------------------------
	// Config page bindings
	// --------------------------------------------------------------------

	// The cat add button click
	$('.add-cat-button').on('click', function(e) {
		$('#page_edit .st-edit').each(function(i){$(this).slideUp(200);});
		$('#page_edit .st-name-edit').hide();
		$('#page_edit .st-name-display').show();
		$('#cat_list').append(tmpl("cat-add", {selColor: "XYZ"}));
		// The submit handler for the form
		$('#cat_list form.new_cat').submit(saveCatFormNew);
	} );

	$('#tog-clear-queue').on('toggle', function(e) {docCookies.setItem("clearQ",$(e.target).hasClass("active"), Infinity); } );
	$('#tog-play-item').on('toggle', function(e) {docCookies.setItem("playItem",$(e.target).hasClass("active"), Infinity); } );
	$('#tog-repeat').on('toggle', function(e) {
		playerSetRepeat($(e.target).hasClass("active") ? 1 : 0);
	});
	$('#tog-local-play').on('toggle', function(e) {
		docCookies.setItem("localPlay",$(e.target).hasClass("active"), Infinity);
		// stop any audio that is already playing
		if(localAudio != undefined) {
			localAudio.pause();	localAudio.src = ''; localAudio.load();
		}
		// update the UI elements
		pollingUIUpdate();
		// Reset the errorcount since polling is starting new
		pollErrorCount = 0;
	});
	// --------------------------------------------------------------------
	// Page switch button clicks
	// --------------------------------------------------------------------
	$('#queueinfo').on('click', function (e) {
		$('.page').hide();
		$('#btn-config').hide();
		$('#btn-home').show();
		$('#page_queue').show(); 
		showQueue($('#page_queue'));
	});		
	$('#btn-config').on('click', function(e) {
		$('.page').hide();
		$('#btn-config').hide();
		$('#btn-home').show();
		if (docCookies.getItem("playItem") == "true") {updateToggle($('#tog-play-item'), true); }
		if (docCookies.getItem("clearQ") == "true") {updateToggle($('#tog-clear-queue'), true); }
		if (docCookies.getItem("localPlay") == "true") {updateToggle($('#tog-local-play'), true); }
		$('#page_config').show(); 
	});
	$('#btn-home').on('click', function(e) {
		$('.page').hide();
		$('#btn-home').hide();
		$('#bar-edit').hide();
		$('#bar-home').show();
		$('#btn-config').show();
		mainPageRender();
		$('#page_home').show(); 
	});
	$('#btn-mute').on('click', function (e) {
		updateVolume(0, pollingUIUpdate);
	});
	$('#btn-volume').on('click',function(e) {
		$('#btn-config').hide();
		$('#btn-home').show();
		$('.page').hide();
		$('#page_volume').show(); 
		// The Zepto way
		//pos = findPos($('.knob'));
		//center = {X: pos.X + $('.knob').width() / 2, Y: pos.Y + $('.knob').height() / 2}; 
		// The jQuery way
		center = {X: Math.floor($('.knob').offset().left+($('.knob').width() / 2)), Y: Math.floor($('.knob').offset().top + ($('.knob').height() / 2))};
	});
		
	// --------------------------------------------------------------------
	// Transport clicks
	// --------------------------------------------------------------------
	$('#btn-pause').on('click', function(e) {
		playerPause( function(){$('#btn-pause').hide(); $('#btn-play').show();} );
	});
	$('#btn-play').on('click', function(e) {
		playerPlay( function(){$('#btn-pause').show(); $('#btn-play').hide();} );
	});
	$('#btn-stop').on('click', function(e) {
		playerStop(function(){$('#btn-pause').hide(); $('#btn-play').show();} );
	});
	$('#btn-prev').on('click', function(e) { playerPrev(); });
	$('#btn-next').on('click', function(e) { playerNext(); });

})

/* to be added - shake to shuffle	 
var myShakeEvent = new Shake({
    threshold: 15, // optional shake strength threshold
    timeout: 1000 // optional, determines the frequency of event generation
});
*/
/* add to the display queue page
myShakeEvent.start();

window.addEventListener('shake', shakeEventDidOccur, false);

//function to call when shake occurs
function shakeEventDidOccur () {

    //put your own code here etc.
    alert('shake!');
}

then  when done
window.removeEventListener('shake', shakeEventDidOccur, false);
myShakeEvent.stop();
*/

