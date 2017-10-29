<?php	$allStations = array();

	try{
	$db = new PDO('sqlite:../radio.db');

	// Load the 1st level 
	$sth = $db->prepare("SELECT id,name,type,color,sortorder FROM cat ORDER BY sortorder;");
	$sth->execute();

	$allStations = $sth->fetchAll(PDO::FETCH_GROUP|PDO::FETCH_ASSOC);
	echo json_encode($allStations);
	$allStations = array_map('reset', $allStations);
	echo "<hr>";
	echo json_encode($allStations);
	echo "<hr>";

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
