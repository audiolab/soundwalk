  <?php

if(!isset($_GET['paseo']))
	die();

$id = $_GET['paseo'];

require_once( dirname(dirname(dirname(dirname( __FILE__ )))) . '/wp-load.php' );
require_once (dirname( __FILE__ ) . '/libs/classes.php');

$file_helper = new Soundwalk_File_Helper();
$url = $file_helper->get_Url($id);
$path = $file_helper->get_Path($id);


$files = scandir($path);
$files = array_diff($files, array('..', '.'));

$r = array();

foreach($files as $file){
	$o = new stdClass();
	$o->url = $url . '/' . $file;
	$o->name = $file;
	$r[] = $o;
}

header("Content-Type: application/json");
echo json_encode($r);

?>