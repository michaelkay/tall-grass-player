<?php

// IF YOU ARE BEHIND A PROXY SERVER
// Uncomment the following lines.
// If your server does NOT require authentication, comment out
// the header line below.
//
// If you are NOT BEHIND a proxy server, do not include this code
/*
$PROXY_HOST = "proxy"; // Proxy server address
$PROXY_PORT = "8080";    // Proxy server port
$PROXY_USER = "user";    // Username
$PROXY_PASS = "pass";   // Password

$auth = base64_encode("$PROXY_USER:$PROXY_PASS");
stream_context_set_default(
 array(
  'http' => array(
   'proxy' => "tcp://$PROXY_HOST:$PROXY_PORT",
   'request_fulluri' => true,
   // Remove the 'header' option if proxy authentication is not required
   'header' => "Proxy-Authorization: Basic $auth"
  )
 )
);
*/

require 'Slim/Slim.php';
\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();

$app->get('/allstations', 'loadAllStations');
$app->get('/station/:id', 'loadStation');
//$app->post('/setvolume', 'setVolume');
$app->post('/setcatorder', 'setCatOrder');
$app->post('/setstationorder', 'setStOrder');
$app->put('/updatestation/:id', 'saveStation');
$app->put('/movestation/:id', 'saveMoveStation');
$app->post('/updatestation/:cid', 'saveNewStation');
$app->delete('/deletestation/:id', 'removeStation');
$app->put('/updatecat/:id', 'saveGrouping');
$app->post('/updatecat', 'saveGrouping');
$app->delete('/deletecat/:id', 'removeGrouping');

$app->run();

 // Helper function - get the first stream from a M3u file. Used to get the pure stream
 // if the user passes it to the save function
 function parseM3u($playlist) {
	
	// Remove byte order mark
	if (substr($playlist, 0, 3) === "\xEF\xBB\xBF") {
		$playlist = substr($playlist, 3);
    }
	
	$lines = explode("\n", $playlist);
	$linesCount = count($lines);
	
	// check for empty file or extended format
	if($linesCount == 0 || (strtoupper(substr(trim($lines[0]), 0, 7)) === '#EXTM3U') ) {
        $line = null;
    } else {
		$line = trim($lines[0]);
	}
	
	return $line;
}

function setVolume() {
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);
    $request = json_decode(Slim\Slim::getInstance()->request()->getBody());
    $mpd->setVolume($request->vol);
}

function setCatOrder() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');

    $request = json_decode(Slim\Slim::getInstance()->request()->getBody());
	$ar=explode(',',$request->catOrder);
	$sort = 10;
	
	try{
		$db = new PDO('sqlite:../radio.db');
		$sth = $db->prepare("UPDATE cat set sortorder = ? WHERE id = ?");
		foreach ($ar as $id) {
			$sth->execute(array($sort += 10, $id));
		}
		$db = null;
		echo json_encode(array("catOrder" => $ar));
	} catch(PDOException  $e ){
		$app->response->setStatus(500);
		echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
	}
}

function setStOrder() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
	$ar = array();
	
    $request = json_decode(Slim\Slim::getInstance()->request()->getBody());
	if (isset($request->stOrder))
		$ar=explode(',',$request->stOrder);
	$sort = 10;
	
	try{
		$db = new PDO('sqlite:../radio.db');
		$sth = $db->prepare("UPDATE station set sortorder = ? WHERE id = ?");
		foreach ($ar as $id) {
			$sth->execute(array($sort += 10, $id));
		}
		$db = null;
		echo json_encode(array("stOrder" => $ar));
	} catch(PDOException  $e ){
		$app->response->setStatus(500);
		echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
	}
}

// -----------------------------------------------------------------------------------------------------------
// loadAllStations()
//
// Loads the entire station DB in a JSON object. Works because the DB is never large
// -----------------------------------------------------------------------------------------------------------
function loadAllStations() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
	$allStations = array();

	try{
		$db = new PDO('sqlite:../radio.db');

		// Load the 1st level 
		$sth = $db->prepare("SELECT id,name,type,color,sortorder FROM cat ORDER BY sortorder;");
		$sth->execute();

		$allStations = $sth->fetchAll(PDO::FETCH_GROUP|PDO::FETCH_ASSOC);
		$allStations = array_map('reset', $allStations);

		// load the second level
		$sth = $db->prepare("SELECT id,name,type,url,sortorder FROM station WHERE c_id = ? ORDER BY sortorder;");
		foreach($allStations as $st_id => $station) {
			$sth->execute(array($st_id));
			$allStations[$st_id]['stationInfo'] = $sth->fetchAll(PDO::FETCH_GROUP|PDO::FETCH_ASSOC);
			$allStations[$st_id]['stationInfo'] = array_map('reset', $allStations[$st_id]['stationInfo']);
		}
		echo json_encode($allStations);
	} catch(PDOException  $e ){
		$app->response()->setStatus(500);
		echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
	}
}

// -----------------------------------------------------------------------------------------------------------
// loadStation()
//
// Loads a station entry in a JSON object
// -----------------------------------------------------------------------------------------------------------
function loadStation($id) {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
	$allStations = array();
	$otherStations = array();

	try{
		$db = new PDO('sqlite:../radio.db');

		// Load the 1st level 
		$sth = $db->prepare("SELECT id,name,type,color,sortorder FROM cat WHERE id = ? ORDER BY sortorder;");
		$sth->execute(array($id));

		$allStations = $sth->fetchAll(PDO::FETCH_GROUP|PDO::FETCH_ASSOC);
		$allStations = array_map('reset', $allStations);

		// load the second level
		$sth = $db->prepare("SELECT id,name,type,url,sortorder FROM station WHERE c_id = ? ORDER BY sortorder;");
		foreach($allStations as $st_id => $station) {
			$sth->execute(array($st_id));
			$allStations[$st_id]['stationInfo'] = $sth->fetchAll(PDO::FETCH_GROUP|PDO::FETCH_ASSOC);
			$allStations[$st_id]['stationInfo'] = array_map('reset', $allStations[$st_id]['stationInfo']);
		}

		// Load the 'other' categories list
		$sth = $db->prepare("SELECT id,name,type,color,sortorder FROM cat WHERE id <> ? ORDER BY sortorder;");
		$sth->execute(array($id));

		$otherStations = $sth->fetchAll(PDO::FETCH_GROUP|PDO::FETCH_ASSOC);
		$otherStations = array_map('reset', $otherStations);

		echo json_encode(array("thisStation" => $allStations, "otherStations" => $otherStations));
	} catch(PDOException  $e ){
		$app->response->setStatus(500);
		echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
	}
}

// -----------------------------------------------------------------------------------------------------------
// saveGrouping()
//
// Update or insert a station node
// -----------------------------------------------------------------------------------------------------------
function saveGrouping($id = 0) {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
	
	$request = $app->request();
	$catName = $request->params('cat-name');
	// catType is optional for now
	$catType = $request->params('type');
	$catColor = $request->params('color');
	$catSort = $request->params('sort');
	
	// if ID is 0, assume an insert
	if($id == 0 && isset($catName) /*&& isset($catType)*/ && isset($catColor) && isset($catSort)) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("INSERT INTO cat (name, type, color, sortorder) VALUES (?, ?, ?, ?)");
			$sth->execute(array($request->params('cat-name'), $request->params('type'), $request->params('color'), $request->params('sort')));
			echo json_encode(array("id" => $db->lastInsertId()));
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
		}
	} else if($id > 0 && isset($catName) /*&& isset($catType)*/ && isset($catColor)) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("UPDATE cat set name = ?, type = ?, color = ? WHERE id = ?");
			$sth->execute(array($request->params('cat-name'), $request->params('type'), $request->params('color'), $id));
			echo json_encode(array("ok" => $id));
			$db = null;
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
		}
	} else {
		$app->response->setStatus(400);
		echo json_encode( array("error" => array( "text" => "input error") ) );
	}
}

// -----------------------------------------------------------------------------------------------------------
// removeGrouping()
//
// Delete a group node
//    note: this will also delete the stations below the node because of a SQL cascade
// -----------------------------------------------------------------------------------------------------------
function removeGrouping($id) {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
	
	if($id > 0) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("DELETE FROM cat WHERE id = ?");
			$sth->execute(array($id));
			echo json_encode(array("ok" => $id));
			$db = null;
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
		}
	} else {
		$app->response->setStatus(400);
		echo json_encode( array("error" => array( "text" => "input error") ) );
	}
}

// -----------------------------------------------------------------------------------------------------------
// saveStation()
//
// Update or insert a station node
// -----------------------------------------------------------------------------------------------------------
function saveStation($id) {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
	
	$request = $app->request();
	$stName = $request->params('st-name');
	$stUrl = $request->params('url');
	$stType = $request->params('type');
	
	// If the url is a playlist, decompse the playlist into the raw stream
	// NOTE: This will download the playlis and parse it. See the top of the 
	// file for proxy settings
	if (isset($stUrl)) {
		try {
			if (substr($stUrl, -4) === '.m3u') {
				$stUrl = parseM3u(file_get_contents($stUrl));
			} else if (substr($stUrl, -4) === '.pls') {
				$plStr = parse_ini_string(file_get_contents($stUrl), false, INI_SCANNER_RAW);
				// A little error checking
				if (isset($plStr['File1']))
					$stUrl = $plStr['File1'];
				else
					$stUrl = null;
			}
		} catch (Exception $e) {
			$stUrl = null;
		}
	}
	
	if (!isset($stUrl)) { 
		$app->response->setStatus(400);
		$app->response()->headers->set('Content-Type', 'application/json');
		echo json_encode( array("error" => array( "text" => "bad playlist in " . __FUNCTION__) ) );
	} else if($id > 0 && isset($stName) && isset($stUrl) && isset($stType)) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("UPDATE station set name = ?, url = ?, type = ? WHERE id = ?");
			$sth->execute(array($stName, $stUrl, $stType, $id));
			echo json_encode( array("ok" => array($stName, $stUrl, $stType, $id) ) );
			$db = null;
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
		}
	} else {
		$app->response->setStatus(400);
		echo json_encode( array("error" => array( "text" => "input error") ) );
	}
}
	
// -----------------------------------------------------------------------------------------------------------
// saveMoveStation()
//
// Saves the station info but also moves the station to a new cat
// -----------------------------------------------------------------------------------------------------------
function saveMoveStation($id) {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
	
	$request = $app->request();
	$stName = $request->params('st-name');
	$stUrl = $request->params('url');
	$stType = $request->params('type');
	$newCat = $request->params('moveCat');
	$sort = $request->params('sort');
	
	// If the url is a playlist, decompse the playlist into the raw stream
	// NOTE: This will download the playlis and parse it. See the top of the 
	// file for proxy settings
	if (isset($stUrl) && substr($stUrl, -4) === '.m3u') {
		$stUrl = parseM3u(file_get_contents($stUrl));
	} else if (isset($stUrl) && substr($stUrl, -4) === '.pls') {
		$plStr = parse_ini_string(file_get_contents($stUrl), false, INI_SCANNER_RAW);
		// A little error checking
		if (isset($plStr['File1']))
			$stUrl = $plStr['File1'];
		else
			$stUrl = null;
	}
	
	if (!isset($stUrl)) { 
		$app->response->setStatus(400);
		$app->response()->headers->set('Content-Type', 'application/json');
		echo json_encode( array("error" => array( "text" => "bad playlist") ) );
	} else if($id > 0 && isset($stName) && isset($stUrl) && isset($stType)) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("UPDATE station set c_id = ?, name = ?, url = ?, type = ?, sortorder = ? WHERE id = ?");
			$sth->execute(array($newCat, $stName, $stUrl, $stType, $sort, $id));
			echo json_encode( array("ok" => array($newCat, $stName, $stUrl, $stType, $sort, $id) ) );
			$db = null;
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
		}
	} else {
		$app->response->setStatus(400);
		echo json_encode( array("error" => array( "text" => "input error") ) );
	}
}

// -----------------------------------------------------------------------------------------------------------
// saveNewStation()
//
// Insert a station node
// -----------------------------------------------------------------------------------------------------------
function saveNewStation($cid) {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
	
	$request = $app->request();
	$stName = $request->params('st-name');
	$stUrl = $request->params('url');
	$stType = $request->params('type');
	$stSort = $request->params('sort');
	
	// If the url is a playlist, decompse the playlist into the raw stream
	// NOTE: This will download the playlis and parse it. See the top of the 
	// file for proxy settings
	try {
		if (isset($stUrl) && substr($stUrl, -4) === '.m3u') {
			$stUrl = parseM3u(file_get_contents($stUrl));
		} else if (isset($stUrl) && substr($stUrl, -4) === '.pls') {
			$plStr = parse_ini_string(file_get_contents($stUrl), false, INI_SCANNER_RAW);
			// A little error checking
			if (isset($plStr['File1']))
				$stUrl = $plStr['File1'];
			else
				$stUrl = null;
		}
	} catch (Exception $e) {
		$stUrl = null;
	}
	
	if (!isset($stUrl)) { 
		$app->response->setStatus(400);
		echo json_encode( array("error" => array( "text" => "bad playlist in " . __FUNCTION__) ) );
	} else if($cid > 0 && isset($stName) && isset($stUrl) && isset($stType) && isset($stSort)) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("INSERT INTO station (name, c_id, url, type, sortorder) VALUES (?, ?, ?, ?, ?)");
			$sth->execute(array($stName, $cid, $stUrl, $stType, $stSort));	
			echo json_encode(array("id" => $db->lastInsertId()));
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
		}
	} else {
		$app->response->setStatus(400);
		echo json_encode( array("error" => array( "text" => "input error") ) );
	}
}

// -----------------------------------------------------------------------------------------------------------
// removeStation()
//
// Delete a station
// -----------------------------------------------------------------------------------------------------------
function removeStation($id) {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
	
	if($id > 0) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("DELETE FROM station WHERE id = ?");
			$sth->execute(array($id));
			echo json_encode(array("ok" => $id));
			$db = null;
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
		}
	} else {
		$app->response->setStatus(400);
		echo json_encode( array("error" => array( "text" => "input error") ) );
	}
}
