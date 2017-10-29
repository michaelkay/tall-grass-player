<?php
require 'Slim/Slim.php';
require_once('mpd/mpd.class.php');
require_once('mpd/globalFunctions.php');
\Slim\Slim::registerAutoloader();

DEFINE('MPD_HOST',          'poolradio.home');
DEFINE('MPD_PORT',          '6600');
DEFINE('MPD_PASSWORD',      NULL);

$app = new \Slim\Slim();

// MPD REST requests
$app->get('/playqueue', 'getPlayQueue');
$app->get('/playlists', 'getPlayLists');
$app->get('/playlist/:list', 'getPlayList');
$app->get('/status', 'getStatus');
$app->get('/mpddirectory(/:dir)', 'getDirectory');
$app->post('/queueadd', 'addToQueue');
$app->post('/queueshuffle', 'shuffleQueue');
$app->post('/queuemovetrack', 'moveTrackInQueue');
$app->post('/queuemovetracktostart', 'moveTrackStartOfQueue');
$app->post('/queuemovetracktoend', 'moveTrackEndOfQueue');
$app->post('/queueplaylist', 'addPlaylistToQueue');
$app->put('/clearqueue', 'clearQueue');
$app->delete('/deletequeueitem/:id', 'deleteQueueItem');
$app->post('/queuetagadd', 'addQueueTagInfo');
$app->post('/setvolume', 'setVolume');
$app->get('/setvolume', 'setVolume');
$app->put('/transport/:action', 'transport');
$app->put('/setrepeat/:i', 'repeat');
$app->put('/seek/:id', 'seekTrack');

$app->run();

function getPlayQueue() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);

	if ($mpd->connected) {
		echo '{"playqueue": ' .json_encode($mpd->playlist) . '}';
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}

function getPlayLists() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);

	if ($mpd->connected) {
		echo '{"playlists": ' .json_encode($mpd->GetPlaylists()) . '}';
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}

function getPlayList($list) {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);

	if ($mpd->connected) {
		echo '{"playlist": ' .json_encode(array('name'=>$list, 'files'=> $mpd->GetPlaylist($list))) . '}';
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}

function getStatus() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);

	if ($mpd->connected) {
		echo json_encode($mpd->getStatus());
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}

function getDirectory($dir = '/') {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);

	if ($mpd->connected) {
		echo '{"directory-list":'.json_encode($mpd->GetDir($dir)).'}';
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}

function addToQueue() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);
    
	if ($mpd->connected) {
		$request = json_decode(Slim\Slim::getInstance()->request()->getBody());
		if (isset($request->song)) {
			$ret = $mpd->PLAdd($request->song);
			
			echo '{"response": ' . json_encode($ret) . '}';
		} else {
			$app->response()->setStatus(400);
			echo '{"error":{"text": "No song"}}';
		}
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}

function shuffleQueue() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);

	if ($mpd->connected) {
		$mpd->PLShuffle();
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}

function moveTrackInQueue() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);

	if ($mpd->connected) {
		$request = json_decode(Slim\Slim::getInstance()->request()->getBody());
		if (isset($request->st_pos) && isset($request->end_pos)) {
			$mpd->PLMoveTrack($request->st_pos, $request->end_pos);
		} else {
			$app->response()->setStatus(400);
			echo '{"error":{"text": "Missing id/tag/data"}}';
		}
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}
		
function moveTrackStartOfQueue() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);

	if ($mpd->connected) {
		$request = json_decode(Slim\Slim::getInstance()->request()->getBody());
		if (isset($request->st_pos)) {
			$mpd->PLMoveTrack($request->st_pos, -1);
		} else {
			$app->response()->setStatus(400);
			echo '{"error":{"text": "Missing id/tag/data"}}';
		}
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}
		
function moveTrackEndOfQueue() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);

	if ($mpd->connected) {
		$request = json_decode(Slim\Slim::getInstance()->request()->getBody());
		if (isset($request->st_pos)) {
			$mpd->PLMoveTrack($request->st_pos, 99999);
		} else {
			$app->response()->setStatus(400);
			echo '{"error":{"text": "Missing id/tag/data"}}';
		}
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}
		
function addPlaylistToQueue() {
    $dbnameList = array();
    
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);
    
	if ($mpd->connected) {
		$request = \Slim\Slim::getInstance()->request();
		$playlist = json_decode($request->getBody());
		$fileList = $mpd->GetPlaylist($playlist->name);
		foreach($fileList as $file) {
			array_push($dbnameList, $file['file']);
		}
		
		$ret = $mpd->PLAddBulk($dbnameList);
		echo '{"response": ' . json_encode($ret) . '}';
	} else {
		$app = \Slim\Slim::getInstance();
		$app->response()->setStatus(400);
		$app->response()->headers->set('Content-Type', 'application/json');
		echo '{"error":{"text": "Not connected"}}';
	}
}

function clearQueue() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);
	if ($mpd->connected) {
		$mpd->PLClear();
		echo '{}';
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}

function deleteQueueItem($id) {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);
    
	if ($mpd->connected && $id) {
		$ret = $mpd->PLRemoveId($id);
		echo '{"response": ' . json_encode($ret) . '}';
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}
    
function addQueueTagInfo() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);
    
	if ($mpd->connected) {
		$request = json_decode(Slim\Slim::getInstance()->request()->getBody());
		if (isset($request->id) && isset($request->tag) && isset($request->data)) {
			//$ret = $request->id . " " . $request->tag . " " . ;
			$ret = $mpd->PLAddTag($request->id, $request->tag, $request->data);
			
			echo '{"response": ' . json_encode($ret) . '}';
		} else {
			$app->response()->setStatus(400);
			echo '{"error":{"text": "Missing id/tag/data"}}';
		}
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}

function setVolume() {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);
	
	if ($mpd->connected) {
		$request = json_decode(Slim\Slim::getInstance()->request()->getBody());
		$mpd->setVolume($request->vol);		
		echo '{"volume": ' . json_encode($mpd->volume) . '}';
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}
    
function transport($action) {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);
	
	if ($mpd->connected) {
		if($action == 'play') {
			$ret = $mpd->Play();
		} else if ($action == 'pause') {
			// Note - pause is a toggle action - it will either pause or unpause.
			$ret = $mpd->Pause();
		} else if ($action == 'next') {
			$ret = $mpd->Next();
		} else if ($action == 'prev') {
			$ret = $mpd->Previous();
		} else {
			$ret = $mpd->Stop();
		}
	
		echo '{"action": ' . json_encode($ret) . '}';
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}

function repeat($i) {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);
	
	if ($mpd->connected && ($i == 1 || $i == 0)) {
		$ret = $mpd->SetRepeat($i);
		echo '{"action": ' . json_encode($ret) . '}';
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}	

function seekTrack($i) {
	$app = \Slim\Slim::getInstance();
	$app->response()->headers->set('Content-Type', 'application/json');
    // calls RefreshInfo() on create
    $mpd = new mpd(MPD_HOST, MPD_PORT, MPD_PASSWORD);
	
	if ($mpd->connected) {
		if ( $i > 0) {
			$ret = $mpd->SkipToId($i);
			echo '{"action": ' . json_encode($ret) . '}';
		} else {
			$app->response()->setStatus(400);
			echo '{"error":{"text": "bad track id"}}';
		}
	} else {
		$app->response()->setStatus(400);
		echo '{"error":{"text": "Not connected"}}';
	}
}