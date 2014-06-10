<?php
/*
Plugin Name: Soundwalk Web Interface
Plugin URI: http://www.audio-lab.org
Description: Plugin para la gesti?n de audioguias basado en el software Areago.
Version: 1.0
Author: Xavier Balderas
Author URI: http://www.audio-lab.org
License: GPL2
*/

require_once (dirname( __FILE__ ) . '/libs/db_helper.php');
require_once (dirname( __FILE__ ) . '/libs/classes.php');

if (!class_exists('SoundWalk')){

    class SoundWalk{

        function init (){
            add_image_size('soundwalk_picture', 512, 512, true);
        }// init

        function generate_rewrite_rules(){

            global $wp_rewrite;
            $newrules = array();
            $newrules['soundwalk/listado'] = 'wp-content/plugins/soundwalk/listado.php';
            $newrules['soundwalk/descarga/(\d*)$'] = 'wp-content/plugins/soundwalk/descarga.php?paseo=$1';
            $wp_rewrite->non_wp_rules = $newrules + $wp_rewrite->non_wp_rules;

        }//generate_rewrite_rules

        function register_actions(){
            add_action('admin_menu',array($this, 'admin_menu'));
            add_action('wp_ajax_save-walk',array($this,'save_walk'));
            add_action('wp_ajax_get-walk',array($this,'get_walk'));
            /*
            add_action('wp_ajax_areago_file_uploaded',array($this,'areago_ajax_file_uploaded'));
            add_filter('media_send_to_editor', array($this, 'areago_media_send_to_editor'), 50, 3);
            add_filter('upload_mimes', array($this,'areago_custom_upload_mimes')); */
        } //register_actions


        function get_walk(){
            if (!isset($_POST['id'])){
                wp_send_json_error("ID not available");
            }
            $db_helper = new Soundwalk_DB_Helper();
            $w = $db_helper->get_walk($_POST['id']);
            $r = array(
                'points' => $w->points,
                'info' => array(
                    'title' => $w->name,
                    'description' => $w->description,
                    'language' => $w->language,
                    'fID' => $w->pic_id,
                    'fileName' => wp_get_attachment_thumb_url( $w->pic_id ),
                ),
                'id' => $_POST['id']
            );
            wp_send_json_success($r);
        }


        function save_walk(){

            if (!isset($_POST['data'])){
                wp_send_json_error("Data not available");
            }

            $data = json_decode(stripslashes($_POST['data']));
            $up = (isset($_POST['id']))? true : false;
            $db_helper = new Soundwalk_DB_Helper();
            $id = $db_helper->save_walk($data, $up);

            if ($id === FALSE)
                wp_send_json_error("Error al guardar el paseo");

            $file_helper = new Soundwalk_File_Helper();
            $created = $file_helper->createFolder($id);

            if (!$created)
                wp_send_json_error("Error en la carpeta");

            $files_helper = new Soundwalk_File_Helper();
            $result = $files_helper->prepare_files($id);
            $db_helper->update_walk_size($id);
            //$zip_helper = new Soundwalk_ZIP();
            //$result = $zip_helper->create_zip($id);
            
            if ($result)
                wp_send_json_success(array('id'=>$id));

            wp_send_json_error("Error ZIP");

        }

        function admin_menu(){
            add_menu_page( 'List Walks', 'SoundWalks', 'manage_options', 'soundwalk-manage', array($this,'menu_page_callback'));
            add_submenu_page( "soundwalk-manage", "Add walk", "Add walk", 'manage_options', 'soundwalk-manage-add', array($this, 'manage_add') );
            add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));

        }// admin_menu

        function admin_enqueue_scripts($hook){

            if ($hook=='soundwalks_page_soundwalk-manage-add') {
                //Styles and scripts for the add/edit page.
                wp_enqueue_script('wp-util');
                wp_enqueue_script('jquery');
                wp_enqueue_script('jquery-ui-tabs');
                wp_enqueue_script('jquery-ui-slider');
                wp_enqueue_script('thickbox');
                wp_enqueue_script('underscore');
                wp_enqueue_script('backbone');
                wp_enqueue_media();
                wp_deregister_script('mediaelement');
                wp_register_script('mediaelement', plugins_url('js/mediaelement-and-player.min.js', __FILE__), array('jquery'), '2.13.1');
                wp_enqueue_script('wp-mediaelement');
                wp_enqueue_script('leafletjs','http://cdn.leafletjs.com/leaflet-0.6.4/leaflet.js',array(),'0.6.4',TRUE); // add Leaflet.js
                wp_enqueue_script('soundwalk_models', plugins_url('js/models.js', __FILE__), array(), '0.1', TRUE);
                wp_enqueue_script('soundwalk_views', plugins_url('js/views.js', __FILE__), array('soundwalk_models'), '0.1', TRUE);
                wp_enqueue_script('soundwalk_app', plugins_url('js/app.js', __FILE__), array('soundwalk_views', 'leafletjs', 'backbone', 'underscore', 'jquery'), '0.1', TRUE);
                wp_enqueue_style('leafletcss','http://cdn.leafletjs.com/leaflet-0.6.4/leaflet.css',array(),'0.6.4','all'); // add CSS Leaflet
                wp_enqueue_style('soundwalk_app_css',plugins_url('soundwalk.css', __FILE__),array(),'0.1','all'); // add CSS Soundwalk app
                global $soundmap;
                $params = array();
                $params += $soundmap->config['origin'];
                $params['mapType'] = $soundmap->config['mapType'];

                if (isset($_GET['walk']) && isset($_GET['action'])){
                    if($_GET['action'] = "edit"){
                        $params['edit_Walk'] = $_GET['walk'];
                    }
                }

                wp_localize_script('soundwalk_views','SoundwalkOptions',$params);

            }
        } //admin_enqueue_scripts

        function manage_add(){

            if (!current_user_can('manage_options'))  {
                wp_die( __('You do not have sufficient permissions to access this page.') );
            }

            if (!class_exists('Soundmap_Helper')){

                wp_die('Soundmap Plugin is needed');

            }

            if (isset($_GET['walk'])){



            }


            include_once (dirname( __FILE__ ) . '/admin.php');

        }// manage_add

        function menu_page_callback(){

            remove_filter('admin_footer','qtrans_modifyExcerpt'); // resuelve problema con qtranslate.

            add_thickbox();

            if (!current_user_can('manage_options'))  {
                wp_die( __('You do not have sufficient permissions to access this page.') );
            }

            if( isset($_GET[ 'action' ]) && $_GET[ 'action' ] == 'delete' ) {
                //Tenemos datos, por lo que hay que guardarlos...
                $id = $_GET['walk'];

                $db_helper = new Soundwalk_DB_Helper();
                $db_helper->delete_walk($id);
            }

            $table = new Soundwalk_Paseos_List_Table();
            $table->prepare_items();
            ?>
            <div class="wrap">

                <div id="icon-users" class="icon32"><br/></div>
                <h2>Walks <a href="<?php echo sprintf('?page=%s&action=%s"',$_REQUEST['page'],'add')?>" class="add-new-h2">Add walk</a></h2>

                <!-- Forms are NOT created automatically, so you need to wrap the table in one to use features like bulk actions -->
                <form id="areago-lists" method="get">
                    <style>
                        #areago-lists #excerpt{
                            width:auto;
                        }
                    </style>
                    <!-- For plugins, we also need to ensure that the form posts back to our current page -->
                    <input type="hidden" name="page" value="<?php echo $_REQUEST['page'] ?>" />
                    <!-- Now we can render the completed list table -->
                    <?php $table->display() ?>


                </form>

            </div>
            <?php




            // verify this came from the our screen and with proper authorization,
            // because save_post can be triggered at other times
            /*if (isset($_POST['soundmap_op_noncename'])){
                if ( !wp_verify_nonce( $_POST['soundmap_op_noncename'], plugin_basename( __FILE__ ) ) )
                    return;
                _soundmap_save_options();
            }*/
        }// menu_page_callback


    }// End class

}// endif


$soundwalk = new SoundWalk();
$soundwalk->register_actions();

register_activation_hook( __FILE__, 'soundwalk_install' );



function soundwalk_install(){

    global $wp_rewrite;
    $newrules = array();
    $newrules['soundwalk/listado'] = 'wp-content/plugins/soundwalk/listado.php';
    $newrules['soundwalk/descarga/(\d*)$'] = 'wp-content/plugins/soundwalk/descarga.php?paseo=$1';
    $wp_rewrite->non_wp_rules = $newrules + $wp_rewrite->non_wp_rules;

    flush_rewrite_rules(true);

    //Install the db.
    $db_helper = new Soundwalk_DB_Helper();
    $db_helper->install();


    $file_helper = new Soundwalk_File_Helper();
    $fileOK = $file_helper->check();

}// areago_install



add_action("init", array($soundwalk , "init"));
add_filter( 'generate_rewrite_rules',array($soundwalk, 'generate_rewrite_rules' ));