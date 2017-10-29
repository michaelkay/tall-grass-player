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
  
$result = $db->query('INSERT INTO "cat" ("name", "type", "sortorder") VALUES (\'Rock\',	\'ST\',	1)');
echo json_encode($result) . '<br>';
$result = $db->query('INSERT INTO "cat" ("name", "type", "sortorder") VALUES (\'Techno\',	\'ST\',	2)');
echo json_encode($result) . '<br>';
//$result = $db->query('INSERT INTO "station" ("c_id", "name", "url", "type", "sortorder") VALUES (1,	\'WMMR\',\'http://8703.live.streamtheworld.com:80/WMMRFMAAC_SC\',\'Rock\',99);');
//echo json_encode($result) . '<br>';
$result = $db->query('INSERT INTO "station" ("c_id", "name", "url", "type", "sortorder") VALUES (1,	\'RIT\',\'http://streaming.witr.rit.edu:8000/live\',\'Rock\',1);');
echo json_encode($result) . '<br>';
