<?php


if (!class_exists('Soundwalk_DB_Helper')){

	class Soundwalk_DB_Helper{

		const TABLE_NAME ="soundwalks";

		function install(){

			global $wpdb;

			$table_name = $wpdb->prefix . self::TABLE_NAME;


			$sql = "CREATE TABLE $table_name (
			id mediumint(9) NOT NULL AUTO_INCREMENT,
			time timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
			name tinytext NOT NULL,
			picture tinytext,
			pic_id tinytext,
			excerpt tinytext NOT NULL,
			description text NOT NULL,
			recordings int DEFAULT 0 NOT NULL,
			language tinytext NOT NULL,
			size int DEFAULT 0 NOT NULL,
			reference longtext DEFAULT '',
			points longtext DEFAULT '',
			hash tinytext DEFAULT '',
			kml longtext DEFAULT '',
			UNIQUE KEY id (id)
			);";

			require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
			dbDelta($sql);

		}

		function get_array_walks(){

			global $wpdb;
			$table_name = $wpdb->prefix . self::TABLE_NAME;

			$sql = "SELECT * FROM $table_name";
			$res = $wpdb->get_results($sql,ARRAY_A);
			return $res;

		}

		function delete_walk($id){
			global $wpdb;
			$table_name = $wpdb->prefix . self::TABLE_NAME;

			$sql = "DELETE FROM $table_name WHERE id='$id'";
			$res = $wpdb->get_results($sql,ARRAY_A);
			return $res;

		}

		function get_list_walks(){
			$walks = $this->get_array_walks();
			if ($walks==NULL)
				return NULL;

			$r = array();
			foreach ($walks as $walk){

				$o = new stdClass();
				$o->id = $walk['id'];
				$o->nombre = $walk['name'];
				$o->resumen = $walk['description'];
				$o->grabaciones = $walk['recordings'];
				$o->idioma = $walk['language'];
                $image_attributes = wp_get_attachment_image_src( $walk['pic_id'] );
				$o->imagen = $image_attributes[0];
				$o->hash = $walk['hash'];
				$o->referencia = json_decode($walk['reference']);
                $o->size = $walk['size'];
				$r[] = $o;
			}

			return $r;

		}// get_list_walks

		function get_walk($id,  $geoJSON = false){
			global $wpdb;
			$table_name = $wpdb->prefix . self::TABLE_NAME;
			$sql = "SELECT * FROM $table_name WHERE id = '$id'";
			$res = $wpdb->get_row($sql,OBJECT);

            if($geoJSON){
                $r = json_decode($res->points);
                $res->geoJSONpoints = $this->toGeoJSON($r);
                $res->points = $r;
            }else{
                $res->points = json_decode($res->points);
            }
			return $res;
		}// get_walk

        function toGeoJSON($data){
            $r = new stdClass();
            $r->type = "FeatureCollection";
            $r->features = array();
            foreach ($data as $point){
                $p = new stdClass();
                $p->type = "Feature";
                $p->geometry = new stdClass();
                $p->geometry->type = "Circle";
                $p->geometry->properties = new stdClass();
                $p->geometry->properties->radius_units = "m";
                $p->geometry->radius = $point->radius;
                $p->geometry->coordinates = array((float)$point->lng,(float)$point->lat);
                $p->properties = new stdClass();
                
                if(($point->files != '') && ($point->files != 'null' )){
                    $p->properties->file = $point->fileInfo->filename;
                }
                $p->properties->layer = (int)$point->layer;
                $p->properties->type = (int)$point->type;
                $p->properties->autofade = $point->autofade;
                $p->properties->vibrate = (boolean)$point->vibrate;
                $p->properties->essid = $point->wifi;
                $p->properties->tolayer = (int)$point->toLayer;
                $r->features[] = $p;
            }
            return $r;
        }

      function updatePointsAudios($points){
         if (!is_array($points)) return;
         $sm_helper = new Soundmap_Helper();
         $r_points = array();
         foreach($points as $point){
            $_id = $point->mID;
            $_m = $sm_helper->get_marker($_id);
            if (!$_m){
               $r_points[] = $point;
               continue;
            }
            $_title = get_the_title($_id);
            $_attID = $_m->marker['attachments'][0]['id'];
            $info = wp_prepare_attachment_for_js($_attID);
            $n_p = $point;
            $n_p->title = $_title;
            $n_p->fileInfo = $info;
				$n_p->files = $_attID;
            $r_points[] = $n_p;
         }
         return $r_points;


      }

        function update_walk_size($id){
            global $wpdb;
            $table_name = $wpdb->prefix . self::TABLE_NAME;
            $file_helper = new Soundwalk_File_Helper();

            $path = $file_helper->get_path($id);

            $io = popen('/usr/bin/du -sh ' . $path, 'r');
            $size = fgets($io, 4096);
            $size = substr ( $size, 0, strpos ( $size, "\t" ) );
            pclose($io);
            $wpdb->update($table_name, array('size' => $size), array('id' => $id));
        }

		function save_walk($data, $update=false){
			//guardar el paseo. Si ya existe, lo actualiza.

			global $wpdb;

			$table_name = $wpdb->prefix . self::TABLE_NAME;
			$sql = "INSERT INTO $table_name";
			//Primero chequeo que de verdad hay que guardar

            $titulo = $data->info->title;
            $description = $data->info->description;
            $language = $data->info->language;
            $pic_id = $data->info->fID;
				$total_points = count($data->points);
            $points = json_encode($this->updatePointsAudios($data->points));
            $hash = md5(uniqid(rand(), TRUE));

            if($update){
                $res = $wpdb->update(
                    $table_name,
                    array(
                        'name' => $titulo,	// string
                        'pic_id' => $pic_id,
                        'description' => $description,
                        'recordings' => $total_points,
                        'language' => $language,
                        'points' => $points,
                        'hash' => $hash,
                    ),
                    array( 'id' => $_POST['id'] )
                );
            }else{
                $sql .= "(name, pic_id, description, recordings, language, points, hash) ";
                $sql .= "VALUES (%s, %s, %s, %d, %s, %s, %s)";
                $res = $wpdb->query( $wpdb->prepare($sql,
                    $titulo,
                    $pic_id,
                    $description,
                    $total_points,
                    $language,
                    $points,
                    $hash
                ) );
            }//else

            if ($res){
                $result_id = $wpdb->get_var( "SELECT id FROM $table_name WHERE hash='$hash'");
                return $result_id;
            }else{
                return FALSE;
            }//$res

		}

	}//class Soundwalk_DB_Helper


}
