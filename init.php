Creating tables<br>
This will backup the current site database and create a new data store. Calling this file should not be necessary unless you deleted the database.<br>
<?
if(!copy('radio.db','radio.db.bak')) {
	echo "File backup error<br>";
}

$db = new PDO('sqlite:radio.db');
$result = $db->query('DROP TABLE IF EXISTS "cat"');
echo json_encode($result) . '<br>';
$result = $db->query('CREATE TABLE "cat" (
  "id" integer NOT NULL,
  "name" text NOT NULL,
  "type" text NULL,
  "color" text NOT NULL DEFAULT \'#FFFFFF\',
  "sortorder" integer NOT NULL DEFAULT \'99999\',
  PRIMARY KEY ("id")
)');
echo json_encode($result) . '<br>';
$result = $db->query('DROP TABLE IF EXISTS "station"');
echo json_encode($result) . '<br>';
$result = $db->query('CREATE TABLE "station" (
  "id" integer NOT NULL,
  "c_id" integer NOT NULL,
  "name" text NOT NULL,
  "url" text NOT NULL,
  "type" text NULL,
  "sortorder" integer NULL DEFAULT \'99999\',
  PRIMARY KEY ("id"),
  FOREIGN KEY ("c_id") REFERENCES "cat" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
)');
echo json_encode($result) . '<br>';
  
$result = $db->query('INSERT INTO "cat" ("name", "type", "sortorder", "color") VALUES (\'Cool Sounds\',	\'ST\',	1, \'#D0FFFF\')');
echo json_encode($result) . '<br>';
$result = $db->query('INSERT INTO "cat" ("name", "type", "sortorder", "color") VALUES (\'Techno\',	\'ST\',	2, \'#FFD0D0\')');
echo json_encode($result) . '<br>';
$result = $db->query('INSERT INTO "station" ("c_id", "name", "url", "type", "sortorder") VALUES (2,	\'Traxx.fm Electro\',\'http://icepe3.infomaniak.ch:80/traxx003-low.mp3\',\'tech\',99);');
echo json_encode($result) . '<br>';
$result = $db->query('INSERT INTO "station" ("c_id", "name", "url", "type", "sortorder") VALUES (1,	\'WPSU Penn State Radio\',\'http://wpsu-ice.streamguys1.com/wpsu1\',\'other\',10);');
echo json_encode($result) . '<br>';
$result = $db->query('INSERT INTO "station" ("c_id", "name", "url", "type", "sortorder") VALUES (1,	\'Grooveyard Radio\',\'http://stardust.wavestreamer.com:3769/Live\',\'rock\',1);');
echo json_encode($result) . '<br>';
