<?php 
header('Content-type: application/json');
require_once( dirname(dirname(dirname(dirname( __FILE__ )))) . '/wp-load.php' );
require_once (dirname( __FILE__ ) . '/libs/db_helper.php');


$db_helper = new Soundwalk_DB_Helper();

$walks = $db_helper->get_list_walks();
echo json_encode($walks);

?>
