<?php
require 'Slim/Slim.php';
\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();

$app->get('/allstations', 'loadAllStations');
$app->get('/station/:id', 'loadStation');
$app->post('/setvolume', 'setVolume');
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

    
function setVolume() {
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);
    $request = json_decode(Slim\Slim::getInstance()->request()->getBody());
    $mpd->setVolume($request->vol);
}

function setCatOrder() {
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
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			$app->response()->headers->set('Content-Type', 'application/json');
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("PDO Error: ".$e); } ); </script>';
		}
	echo json_encode(array("catOrder" => $ar));
}

function setStOrder() {
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
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			$app->response()->headers->set('Content-Type', 'application/json');
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("PDO Error: ".$e); } ); </script>';
		}
	echo json_encode(array("catOrder" => $ar));
}

// -----------------------------------------------------------------------------------------------------------
// loadAllStations()
//
// Loads the entire station DB in a JSON object. Works because the DB is never large
// -----------------------------------------------------------------------------------------------------------
function loadAllStations() {
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
	echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
	}
}

// -----------------------------------------------------------------------------------------------------------
// loadStation()
//
// Loads a station entry in a JSON object
// -----------------------------------------------------------------------------------------------------------
function loadStation($id) {
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
			$app->response()->headers->set('Content-Type', 'application/json');
			echo json_encode(array("id" => $db->lastInsertId()));
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			$app->response()->headers->set('Content-Type', 'application/json');
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("PDO Error: ".$e); } ); </script>';
		}
	} else if($id > 0 && isset($catName) /*&& isset($catType)*/ && isset($catColor)) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("UPDATE cat set name = ?, type = ?, color = ? WHERE id = ?");
			$sth->execute(array($request->params('cat-name'), $request->params('type'), $request->params('color'), $id));
	
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("Updated"); } );';
			//echo 'setTimeout(function() {$(".message-area").hideMessage()}, 5000 );</script>';
			//loadAllStations();
			//$db = null;
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			$app->response()->headers->set('Content-Type', 'application/json');
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("PDO Error: ".$e); } ); </script>';
		}
	} else {
		$app->response->setStatus(400);
		$app->response()->headers->set('Content-Type', 'application/json');
		echo json_encode( array("error" => array( "text" => "input error") ) );
		//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("ERROR"); } );';
		//echo 'setTimeout(function() {$(".message-area").hideMessage()}, 9000 );</script>';
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
	
	if($id > 0) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("DELETE FROM cat WHERE id = ?");
			$sth->execute(array($id));
	
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("Updated"); } );';
			//echo 'setTimeout(function() {$(".message-area").hideMessage()}, 5000 );</script>';
			//loadAllStations();
			//$db = null;
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			$app->response()->headers->set('Content-Type', 'application/json');
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("PDO Error: ".$e); } ); </script>';
		}
	} else {
		$app->response->setStatus(400);
		$app->response()->headers->set('Content-Type', 'application/json');
		echo json_encode( array("error" => array( "text" => "input error") ) );
		//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("ERROR"); } );';
		//echo 'setTimeout(function() {$(".message-area").hideMessage()}, 9000 );</script>';
	}
}

// -----------------------------------------------------------------------------------------------------------
// saveStation()
//
// Update or insert a station node
// -----------------------------------------------------------------------------------------------------------
function saveStation($id) {
	$app = \Slim\Slim::getInstance();
	
	$request = $app->request();
	$stName = $request->params('st-name');
	$stUrl = $request->params('url');
	$stType = $request->params('type');
	
	if($id > 0 && isset($stName) && isset($stUrl) && isset($stType)) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("UPDATE station set name = ?, url = ?, type = ? WHERE id = ?");
			$sth->execute(array($stName, $stUrl, $stType, $id));
	
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("Updated"); } );';
			//echo 'setTimeout(function() {$(".message-area").hideMessage()}, 5000 );</script>';
			//loadAllStations();
			//$db = null;
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			$app->response()->headers->set('Content-Type', 'application/json');
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("PDO Error: ".$e); } ); </script>';
		}
	} else {
		$app->response->setStatus(400);
		$app->response()->headers->set('Content-Type', 'application/json');
		echo json_encode( array("error" => array( "text" => "input error") ) );
		//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("ERROR"); } );';
		//echo 'setTimeout(function() {$(".message-area").hideMessage()}, 9000 );</script>';
	}
}

// -----------------------------------------------------------------------------------------------------------
// saveMoveStation()
//
// Saves the station info but also moves the station to a new cat
// -----------------------------------------------------------------------------------------------------------
function saveMoveStation($id) {
	$app = \Slim\Slim::getInstance();
	
	$request = $app->request();
	$stName = $request->params('st-name');
	$stUrl = $request->params('url');
	$stType = $request->params('type');
	$newCat = $request->params('moveCat');
	$sort = $request->params('sort');
	
	if($id > 0 && isset($stName) && isset($stUrl) && isset($stType)) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("UPDATE station set c_id = ?, name = ?, url = ?, type = ?, sortorder = ? WHERE id = ?");
			$sth->execute(array($newCat, $stName, $stUrl, $stType, $sort, $id));
	
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("Updated"); } );';
			//echo 'setTimeout(function() {$(".message-area").hideMessage()}, 5000 );</script>';
			//loadAllStations();
			//$db = null;
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			$app->response()->headers->set('Content-Type', 'application/json');
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("PDO Error: ".$e); } ); </script>';
		}
	} else {
		$app->response->setStatus(400);
		$app->response()->headers->set('Content-Type', 'application/json');
		echo json_encode( array("error" => array( "text" => "input error") ) );
		//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("ERROR"); } );';
		//echo 'setTimeout(function() {$(".message-area").hideMessage()}, 9000 );</script>';
	}
}

// -----------------------------------------------------------------------------------------------------------
// saveNewStation()
//
// Insert a station node
// -----------------------------------------------------------------------------------------------------------
function saveNewStation($cid) {
	$app = \Slim\Slim::getInstance();
	
	$request = $app->request();
	$stName = $request->params('st-name');
	$stUrl = $request->params('url');
	$stType = $request->params('type');
	$stSort = $request->params('sort');
	
	// 
	if($cid > 0 && isset($stName) && isset($stUrl) && isset($stType) && isset($stSort)) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("INSERT INTO station (name, c_id, url, type, sortorder) VALUES (?, ?, ?, ?, ?)");
			$sth->execute(array($stName, $cid, $stUrl, $stType, $stSort));	
			$app->response()->headers->set('Content-Type', 'application/json');
			echo json_encode(array("id" => $db->lastInsertId()));
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			$app->response()->headers->set('Content-Type', 'application/json');
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("PDO Error: ".$e); } ); </script>';
		}
	} else {
		$app->response->setStatus(400);
		$app->response()->headers->set('Content-Type', 'application/json');
		echo json_encode( array("error" => array( "text" => "input error") ) );
		//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("ERROR"); } );';
		//echo 'setTimeout(function() {$(".message-area").hideMessage()}, 9000 );</script>';
	}
}

// -----------------------------------------------------------------------------------------------------------
// removeStation()
//
// Delete a station
// -----------------------------------------------------------------------------------------------------------
function removeStation($id) {
	$app = \Slim\Slim::getInstance();
	
	if($id > 0) {
		try{
			$db = new PDO('sqlite:../radio.db');
			$sth = $db->prepare("DELETE FROM station WHERE id = ?");
			$sth->execute(array($id));
	
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("Updated"); } );';
			//echo 'setTimeout(function() {$(".message-area").hideMessage()}, 5000 );</script>';
			//loadAllStations();
			//$db = null;
		} catch(PDOException  $e ){
			$app->response->setStatus(500);
			$app->response()->headers->set('Content-Type', 'application/json');
			echo json_encode( array("error" => array( "text" => "PDO Error: " .$e ) ) );
			//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("PDO Error: ".$e); } ); </script>';
		}
	} else {
		$app->response->setStatus(400);
		$app->response()->headers->set('Content-Type', 'application/json');
		echo json_encode( array("error" => array( "text" => "input error") ) );
		//echo '<script> $(document).ready(function() {$(".bar-footer .message-area").html("ERROR"); } );';
		//echo 'setTimeout(function() {$(".message-area").hideMessage()}, 9000 );</script>';
	}
}
