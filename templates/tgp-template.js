<script type="text/x-tmpl" id="mainpage-station-list">
{% let tkeys = []; for(var tkey in o) tkeys.push(tkey); tkeys.sort(function(b,a){return o[b].sortorder-o[a].sortorder}); %}
{% for (let i=0,oKey1=tkeys[i]; i<tkeys.length; i++,oKey1=tkeys[i]) { %}
	<div class="st_list" id="l_{%=oKey1%}">
	<button class="btn btn-block" style="background-color: {%=o[oKey1].color%};">
		{%=o[oKey1].name%}
		<span class="badge badge-primary">{%=Object.keys(o[oKey1].stationInfo).length%}</span>
	</button>
	<div class="stations card" style="display: none;">		
	<ul class="table-view">
		{% let tkeys2 = []; for(let tkey in o[oKey1].stationInfo) tkeys2.push(tkey); tkeys2.sort(function(b,a){return o[oKey1].stationInfo[b].sortorder-o[oKey1].stationInfo[a].sortorder}); %}
		{% for (let i=0,oKey2=tkeys2[i]; i<tkeys2.length; i++,oKey2=tkeys2[i]) { %}
			<li class="table-view-cell station-link" data-stationurl="{%=o[oKey1].stationInfo[oKey2].url%}" style="background-color: {%=o[oKey1].color%}" data-stationname="{%=o[oKey1].stationInfo[oKey2].name%}">
			{%=o[oKey1].stationInfo[oKey2].name%}
			<span class="badge badge-primary">{%=o[oKey1].stationInfo[oKey2].type%}</span>
			</li>
		{% } %}
	</ul>
	</div>
	</div>
{% } %}
</script>

<script type="text/x-tmpl" id="playlists">
{% for (var i=0; i<o.length; i++) { %}
<li class="table-view-cell pl_item">{%=o[i]%}</li>
{% } %}
</script>

<script type="text/x-tmpl" id="playqueue">
<div class="card">
<h3>Current Queue</h3>
<ul class="table-view">
{% for (var i=0; i<o.length; i++) { %}
<li id="pl_{%=o[i].Id%}" class="table-view-cell q_item">
	{% if(typeof(o[i].Title) !== 'undefined' && typeof(o[i].Name) !== 'undefined' && o[i].Title.slice(10,-1) == o[i].Name) { %}
		<span class="q-title">{%=o[i].Title.slice(9)%}</span><br>
		<span class="q-detail">&nbsp</span>
	{% } else if(typeof(o[i].Title) !== 'undefined' && o[i].Title.substring(0,7) == 'stream:' && typeof(o[i].Name) !== 'undefined') { %}
		<span class="q-title">{%=o[i].Title.slice(9, o[i].Title.length-o[i].Name.length-2)%}</span><br>
		<span class="q-detail">{%=o[i].Name%}</span>
	{% } else if(typeof(o[i].Title) !== 'undefined' && o[i].Title.substring(0,7) == 'stream:') { %}
		<span class="q-title">{%=o[i].Title.slice(9)%}</span><br>
		<span class="q-detail">&nbsp</span>
	{% } else { %}
		<span class="q-title">{%=o[i].Title%}</span><br>
		<span class="q-detail">{%=o[i].Artist%} - {%=o[i].Album%}</span>
	{% } %}
</li>
{% } %}
</ul></div>
</script>

<script type="text/x-tmpl" id="st-edit">
<h3>Edit Stations</h3>
<div id="st-edit-list">
<div class="row-sm">
{% let i=0,tkeys = []; for(var tkey in o) tkeys.push(tkey); tkeys.sort(function(b,a){return o[b].sortorder-o[a].sortorder}); %}
{% for (i=0,oKey1=tkeys[i]; i<tkeys.length; i++,oKey1=tkeys[i]) { %}
	{% if(i>0 && (i%4)==0) { %}
		</div><div class="row-sm">
	{% } %}
	<div class="col-sm" data-i="{%=i%}">
		<a href="edit.php?st={%=oKey1%}" data-ignore="push">
		<button class="btn btn-block" style="background-color: {%=o[oKey1].color%};">{%=o[oKey1].name%}</button>
		</a>
	</div>
{% } %}
{% for (let ii=(i%4); ii>0; --ii) { %}
	<div class="col-sm"></div>
{% } %}
</div>
</div>
</script>

<script type="text/x-tmpl" id="station-list">
<ul>
{% for (var key in o) { %}
    <li>{%=o[key].name%}
	<ul>
	{% for (var key2 in o[key].stationInfo) { %}
		<li>{%=key2%} - {%=o[key].stationInfo[key2].name%} - {%=o[key].stationInfo[key2].url%}</li>
	{% } %}
	</ul>
	</li>
{% } %}
</ul>
</script>

<script type="text/x-tmpl" id="station_edit">
{% for (let key in o.thisStation) { %}
{% o2 = o.thisStation; %}
    <h3>{%=o2[key].name%}</h3>
	<div id="st-edit-list" data-cat="{%=key%}" style="background-color: {%=o2[key].color%}">
	{% let tkeys2 = []; for(let tkey in o2[key].stationInfo) tkeys2.push(tkey); tkeys2.sort(function(b,a){return o2[key].stationInfo[b].sortorder-o2[key].stationInfo[a].sortorder}); %}
	{% let sort=10; %}
	{% for (let i=0,key2=tkeys2[i]; i<tkeys2.length; i++,key2=tkeys2[i]) { %}
		<form id="station-{%=key2%}" method="POST" name="station-{%=key2%}" action="#">
		<input type="hidden" name="action" value="update">
		<input type="hidden" name="page" value="st">
		<input type="hidden" name="cat" value="{%=key%}">
		<input type="hidden" name="id" value="{%=key2%}">
		<input type="hidden" name="sort" value="{%=sort++%}">
		<div class="st-name-row row-sm"  >
			<div class="st-name-display row-sm">
				<div class="col-sm-10"><span class="icon icon-bars"></span></div>
				<div class="col-sm st-name-text">{%=o2[key].stationInfo[key2].name%}</div>
				<div class="edit-btns col-sm-20"><div class="row-sm">
					<div class="col-sm"><span class="lower-btn tgp-down-circled tgp-icon-clickable"><span class="reader-text">Sort down</span></span></div>
					<div class="col-sm"><span class="raise-btn tgp-up-circled tgp-icon-clickable"><span class="reader-text">Sort up</span></span></div>
					<div class="col-sm"><span class="more-btn icon tgp-sliders tgp-icon-clickable"><span class="reader-text">Edit</span></span></div>
					<div class="col-sm-10"></div>
				</div></div>
			</div>
			<div class="st-name-edit row-sm" style="display:none">
				<div class="submit-btn col-sm-10"><span class="tgp-floppy tgp-icon-clickable"><span class="reader-text">Save edit</span></span></div>
				<div class="col-sm"><input type="text" name="st-name" value="{%=o2[key].stationInfo[key2].name%}"></div>
				<div class="col-sm-10"><span class="delete-btn tgp-icon-clickable tgp-trash-empty"><span class="reader-text">Delete station</span></span></div>
			</div>
		</div>
		<div class="st-edit" style="display:none">
		<div class="row-sm">
			<div class="col-sm-15"></div>
			<div class="col-sm">
				<div class="row-sm"><div class="st-field-edit cf"><input type="text" name="url" value="{%=o2[key].stationInfo[key2].url%}"></div></div>
				<div class="row-sm"><div class="st-field-edit cf">
					<select name="type">
						<option value="alt">Alternative</option>
						<option value="country">Country</option>
						<option value="metal">Metal</option>
						<option value="other">Other</option>
						<option value="rock">Rock</option>
						<option value="tech">Techno</option>
					</select>
				</div></div>
				<div class="row-sm rowMoveCat">
					<div class="col-sm-15"><span class="tgp-exchange tgp-icon-clickable"><span class="reader-text">Move station</span></span></div>
					<div class="col-sm-85 selMoveCat" style="display:none"><div class="st-field-edit cf"><select name="moveCat">
						<option value="{%=key%}">{%=o2[key].name%}</option>
						{% let tkeys4 = []; for(let tkey3 in o.otherStations) tkeys4.push(tkey3); tkeys4.sort(function(b,a){return o.otherStations[b].sortorder-o.otherStations[a].sortorder}); %}
						{% for (let j=0; j<tkeys4.length; j++) { %}
							{% o3 = o.otherStations[tkeys4[j]]; %}
							<option value="{%=tkeys4[j]%}">{%=o3.name%}</option>
						{% } %}
					</select></div></div>
					<div class="col-sm txtMoveCat">Move to a new category</div>
				</div>
			</div>
			<div class="col-sm-15"></div>
		</div>
		</div>
		</form>
	{% } %}
	</div>
{% } %}
</script>

<script type="text/x-tmpl" id="station_add">
<form class="new_st" method="POST" name="station-0000" action="#">
		<input type="hidden" name="action" value="add">
		<input type="hidden" name="page" value="st">
		<input type="hidden" name="cat" value="{%=o.cat%}">
		<input type="hidden" name="id" value="">
		<input type="hidden" name="sort" value="9999">
		<div class="st-name-row row-sm">
			<div class="st-name-display row-sm" style="display:none">
				<div class="col-sm-10"><span class="icon icon-bars"></span></div>
				<div class="col-sm st-name-text"></div>
				<div class="edit-btns col-sm-20"><div class="row-sm">
					<div class="col-sm"><span class="lower-btn tgp-down-circled tgp-icon-clickable"><span class="reader-text">Sort down</span></span></div>
					<div class="col-sm"><span class="raise-btn tgp-up-circled tgp-icon-clickable"><span class="reader-text">Sort up</span></span></div>
					<div class="col-sm"><span class="more-btn icon tgp-sliders tgp-icon-clickable"><span class="reader-text">Edit</span></span></div>
					<div class="col-sm-10"></div>
				</div></div>
			</div>
			<div class="st-name-edit row-sm">
				<div class="submit-btn col-sm-10"><span class="tgp-floppy tgp-icon-clickable"><span class="reader-text">Save edit</span></span></div>
				<div class="col-sm"><input type="text" name="st-name" value=""></div>
				<div class="col-sm-10"><span class="delete-btn tgp-icon-clickable tgp-trash-empty"><span class="reader-text">Delete station</span></span></div>
			</div>
			<div class="st-edit" >
				<div class="row-sm">
					<div class="col-sm-15"></div>
					<div class="col-sm">
						<div class="st-field-edit row cf"><input type="text" name="url"></div>
						<div class="st-field-edit row cf">
							<select name="type">
								<option value="alt">Alternative</option>
								<option value="country">Country</option>
								<option value="metal">Metal</option>
								<option value="other">Other</option>
								<option value="rock">Rock</option>
								<option value="tech">Techno</option>
							</select>
						</div>
					</div>
					<div class="col-sm-15"></div>
				</div>
			</div>
		</div>
</form>
</script>

<script type="text/x-tmpl" id="color-select">
<select name="color">
<option value="#FFFFFF" style="background-color: #FFFFFF">FFFFFF</option>
{% for(let i=0xf0; i>=0xa0; i -= 0x20) { %}
	{% let color = Number((i<<16) | (255<<8) | 255 ).toString(16).toUpperCase();%}
	<option value="#{%=color%}" style="background-color: #{%=color%}" {% print("#"+color == o.selColor ? 'selected' : ''); %} >{%=color%}</option>
	{% } %}
{% for(let i=0xf0; i>=0xa0; i -= 0x20) { %}
	{% let color = Number((255<<16) | (i<<8) | 255).toString(16).toUpperCase();%}
	<option value="#{%=color%}" style="background-color: #{%=color%}" {% print("#"+color == o.selColor ? 'selected' : ''); %} >{%=color%}</option>
	{% } %}
{% for(let i=0xf0; i>=0xa0; i -= 0x20) { %}
	{% let color = Number((255<<16) | (255<<8) | i ).toString(16).toUpperCase();%}
	<option value="#{%=color%}" style="background-color: #{%=color%}" {% print("#"+color == o.selColor ? 'selected' : ''); %} >{%=color%}</option>
	{% } %}
{% for(let i=0xf0; i>=0xa0; i -= 0x20) { %}
	{% let color = Number((255<<16) | (i<<8) | i ).toString(16).toUpperCase();%}
	<option value="#{%=color%}" style="background-color: #{%=color%}" {% print("#"+color == o.selColor ? 'selected' : ''); %} >{%=color%}</option>
	{% } %}
{% for(let i=0xf0; i>=0xa0; i -= 0x20) { %}
	{% let color = Number((i<<16) | (255<<8) | i ).toString(16).toUpperCase();%}
	<option value="#{%=color%}" style="background-color: #{%=color%}" {% print("#"+color == o.selColor ? 'selected' : ''); %} >{%=color%}</option>
	{% } %}
{% for(let i=0xf0; i>=0xa0; i -= 0x20) { %}
	{% let color = Number((i<<16) | (i<<8) | 255 ).toString(16).toUpperCase();%}
	<option value="#{%=color%}" style="background-color: #{%=color%}" {% print("#"+color == o.selColor ? 'selected' : ''); %} >{%=color%}</option>
	{% } %}
{% for(let i=0xf0; i>=0xa0; i -= 0x20) { %}
	{% let color = Number((i<<16) | (i<<8) | i ).toString(16).toUpperCase();%}
	<option value="#{%=color%}" style="background-color: #{%=color%}" {% print("#"+color == o.selColor ? 'selected' : ''); %} >{%=color%}</option>
	{% } %}
</select>
</script>

<script type="text/x-tmpl" id="cat-edit">
<h3>Category Edit Page</h3>
<div id="cat_list">
{% let tkeys = []; for(var tkey in o) tkeys.push(tkey); tkeys.sort(function(b,a){return o[b].sortorder-o[a].sortorder}); %}
{% let sort=10; %}
{% for (let i=0,key=tkeys[i]; i<tkeys.length; i++,key=tkeys[i]) { %}
	<form id="cat-{%=key%}" method="POST" name="cat-{%=key%}" style="background-color: {%=o[key].color%}" action="#">
		<input type="hidden" name="action" value="update">
		<input type="hidden" name="page" value="cat">
		<input type="hidden" name="id" value="{%=key%}">
		<input type="hidden" name="sort" value="{%=sort%}">
		<div class="st-name-row row-sm">
			<div class="st-name-display row-sm">
				<div class="col-sm-10"><span class="icon icon-bars"></span></div>
				<div class="col-sm cat-name-text">{%=o[key].name%}</div>
				<div class="edit-btns col-sm-20"><div class="row-sm">
					<div class="col-sm"><span class="lower-btn tgp-down-circled tgp-icon-clickable"><span class="reader-text">Sort down</span></span></div>
					<div class="col-sm"><span class="raise-btn tgp-up-circled tgp-icon-clickable"><span class="reader-text">Sort up</span></span></div>
					<div class="col-sm"><span class="more-btn icon tgp-sliders tgp-icon-clickable"><span class="reader-text">Edit</span></span></div>
					<div class="col-sm-10"></div>
				</div></div>
			</div>
			<div class="st-name-edit row-sm" style="display:none">
				<div class="submit-btn col-sm-10"><span class="tgp-floppy tgp-icon-clickable"><span class="reader-text">Save edit</span></span></div>
				<div class="col-sm"><input type="text" name="cat-name" value="{%=o[key].name%}"></div>
				<div class="col-sm-10"><span class="delete-btn tgp-icon-clickable tgp-trash-empty"><span class="reader-text">Delete station</span></span></div>
			</div>
		</div>
		<div class="st-edit" style="display:none">
		<div class="row-sm">
			<div class="col-sm-20"></div>
			<div class="col-sm">
				<div class="row">
					{% include('color-select', {selColor: o[key].color}); %}
				</div></div>
			<div class="col-sm-20"></div>
		</div>
		</div>
	</form>
{% } %}
</div>
</script>

<script type="text/x-tmpl" id="cat-add">
<form id="cat-0000" class="new_cat" method="POST" name="cat-0000" action="#">
	<input type="hidden" name="action" value="add">
	<input type="hidden" name="page" value="cat">
	<input type="hidden" name="id" value="">
	<input type="hidden" name="sort" value="9999">
	<div class="st-name-row row-sm">
		<div class="st-name-display row-sm" style="display:none">
			<div class="col-sm-10"><span class="icon icon-bars"></span></div>
			<div class="col-sm cat-name-text"></div>
			<div class="edit-btns col-sm-20"><div class="row-sm">
				<div class="col-sm"><span class="lower-btn tgp-down-circled tgp-icon-clickable"><span class="reader-text">Sort down</span></span></div>
				<div class="col-sm"><span class="raise-btn tgp-up-circled tgp-icon-clickable"><span class="reader-text">Sort up</span></span></div>
				<div class="col-sm"><span class="more-btn icon tgp-sliders tgp-icon-clickable"><span class="reader-text">Edit</span></span></div>
				<div class="col-sm-10"></div>
			</div></div>
		</div>
		<div class="st-name-edit row-sm" >
			<div class="submit-btn col-sm-10"><span class="tgp-floppy tgp-icon-clickable"></span></div>
			<div class="col-sm"><input type="text" name="cat-name" value=""></div>
			<div class="col-sm-10"><span class="delete-btn tgp-icon-clickable tgp-trash-empty"></span></div>
		</div>
	</div>
	<div class="st-edit">
	<div class="row-sm">
		<div class="col-sm-20"></div>
		<div class="col-sm">
		<div class="row">
			{% include('color-select', o); %}
			<!--
			<select name="type" style="display:none">
				<option value="alt">Alternative</option>
				<option value="country">Country</option>
				<option value="metal">Metal</option>
				<option value="other">Other</option>
				<option value="rock">Rock</option>
				<option value="tech">Techno</option>
			</select>
			-->
		</div></div>
		<div class="col-sm-20"></div>
		</div>
		</div>
	</div>
</form>
</script>