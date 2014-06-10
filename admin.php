<?php

//var_dump($GLOBALS['wp_scripts']->registered);
?>
<div class="wrap">
    <div id="icon-post" class="icon32"><br/></div>
   <div id="soundwalk-messages">
        <div>

        </div>
   </div><!--soundwalk-messages-->

    <h2>Add New Walk</h2>
        <!-- Forms are NOT created automatically, so you need to wrap the table in one to use features like bulk actions -->
        <form id="soundwalk-new-walk" method="POST">
            <input type="hidden" name="page" value="<?php echo $_REQUEST['page'] ?>" />
            <div id="soundwalk-tabs">
                <ul>
                    <li><a href="#soundwalk-datos">Datos del paseo</a></li>
                    <li><a href="#soundwalk-paseo">Puntos</a></li>
                </ul>
                <!-- -------------------------- -->
                <div id="soundwalk-datos">
                    <div id="walk-data" class="box">
                        <div class="panel-left">
                            <div id="titlediv" class="">
                                <h3 class="hndle"><span>Title</span></h3>
                                <div class="inside">
                                    <label class="screen-reader-text" for="title">Title</label>
                                    <input type="text" name="walk_title" size="30" tabindex="1" id="title" autocomplete="off" />
                                </div>
                            </div><!-- titlediv -->
                            <div id="walk-excerpt-box" class="">
                                <h3 class="hndle"><span>Description</span></h3>
                                <div class="inside">
                                    <label class="screen-reader-text" for="walk-excerpt">Description</label>
                                    <textarea id="walk-excerpt" rows="10" name="walk"></textarea>
                                </div>
                            </div><!-- excerpt -->
                        </div><!--panel-left-->
                        <div class="panel-right">
                            <div class="panel-wrap">
                                <div id="language" class="">
                                    <h3 class="hndle"><span>Language</span></h3>
                                    <div class="inside">
                                        <label class="screen-reader-text" for="walk-language">Language</label>
                                        <input name="walk_language" id="walk-language" type="text" tabindex="2" size="10" autocomplete="on"/>
                                    </div>

                                </div><!-- language -->
                                <div id="walk-picture-wrapper" class="">
                                    <h3 class="hndle"><span>Picture</span></h3>
                                    <div class="inside">

                                        <p>
                                          <a title="Imagenes" href="#" class="button image" data-type="image">Choose Image</a>
                                        </p>
                                        <div id="walk-picture-preview">
                                        </div>
                                        <input name="walk_picture" id="walk-picture" type="hidden" />
                                    </div>

                                </div><!-- language -->
                                <div id="walk-actions" class="">
                                    <h3 class="hndle"><span>Actions</span></h3>
                                    <div class="inside">
                                        <p class="submit">
                                            <input type="submit" name="Submit" class="button-primary" id="walk-submit" value="<?php esc_attr_e('Save Changes') ?>" />
                                        </p>
                                    </div>
                                </div><!-- areago-actions -->

                            </div>
                        </div><!--panel-right-->
                        <div class="clear"></div>
                    </div><!--walk-data-->
                </div> <!--soundwalk-datos-->

                <div id="soundwalk-paseo">

                    <div id="walk-editor" class="box">
                        <div id="editor-toolbar">
                            <ul>
                                <li id="add-point"><a title="Añadir Punto" href="#TB_inline?height=500&width=800&height=500&inlineId=markersMapWindow&modal=false" class="thickbox">Añadir Punto</a></li>
                                <li id="create-point"><a title="Crear Punto" href="#">Crear Punto</a></li>
                                <li id="edit-point"><a title="Editar Punto" href="#">Editar Punto</a></li>
                                <li id="delete-point"><a title="Borrar Punto" href="#">Borrar Punto</a></li>
                                <li id="kml-add"><a title="Añadir KML" href="#">Añadir KML</a></li>
                            </ul>
                        </div><!--editor-toolbar-->

                        <div id="editor-panels">
                            <div id="walk-preview">
                                <div id="walk-map"></div>
                            </div><!--walk-preview-->

                            <div id="walk-point-editor">
                                <!--TEMPLATE: tmpl-point-editor-template -->
                            </div><!--walk-point-data-->
                            <div class="clear"></div>
                        </div><!--editor-panels-->

                    </div><!--walk-editor-->


                </div><!--soundwalk-paseo-->

             </div><!--soundwalk-tabs-->
            <div id="markersMapWindow">
                <div id="markersWrapper">
                    <div id="markersMap"></div>
                    <div id="markerInfo">
                        <div id="marker-info-text"></div>
                        <div id="marker-player"></div>
                    </div>
                    <div id="marker-add-button"><button>Añadir</button></div>
                </div>
            </div>


        </form>
</div> <!--wrap-->

<script type="text/html" id="tmpl-point-editor-template">
    <div class="panel-wrapper">
        <div class="title">
            <h3>{{data.title}}</h3>
        </div>
        <div class="point-info">
            <p>
                <strong>Autor: </strong>{{data.autor}}
            </p>
        </div>
        <div id="point-player"></div>

        <div class="editor-option">
            <label>Tipo de punto {{data.type}}</label>
            <div class="toggle-control" id="toggle-tipos">
                <ul>
                    <li id="tipo-once" class="first-leaf"><a <# if (data.type == 1) { #> class="selected" <# } #> data-type="play" href="#">Play</a></li>
                    <li id="tipo-loop"><a <# if (data.type == 2) { #> class="selected" <# } #> data-type="loop" href="#">Play Loop</a></li>
                    <li id="tipo-end"><a <# if (data.type == 3) { #> class="selected" <# } #> data-type="end" href="#">Play To End</a></li>
                    <li id="tipo-wifi"><a <# if (data.type == 4) { #> class="selected" <# } #> data-type="wifi" href="#">Wifi</a></li>
                    <li id="tipo-layer"><a <# if (data.type == 5) { #> class="selected" <# } #> data-type="layer" href="#">Layer</a></li>
                </ul>
            </div><!--toggle-control-->
        </div><!--editor-option-->
        <div class="editor-option">
            <label class="slider-radio-value">Radio: {{data.radio}}m</label>
            <div class="slider-control">
                <div class="slider-wrapper">
                    <div class="slider-radio"></div>
                </div>
            </div>
        </div><!--editor-option-->
        <div id="layer-point" class="editor-option">
            <label>Capa</label>
            <div class="layer-control">
                <ul>
                    <li class="first-leaf"><a <# if (data.layer == 0) { #> class="selected" <# } #> data-layer='0' href="#">Todas</a></li>
                    <li><a <# if (data.layer == 1) { #> class="selected" <# } #> data-layer='1' href="#">1</a></li>
                    <li><a <# if (data.layer == 2) { #> class="selected" <# } #> data-layer='2' href="#">2</a></li>
                    <li><a <# if (data.layer == 3) { #> class="selected" <# } #> data-layer='3' href="#">3</a></li>
                    <li><a <# if (data.layer == 4) { #> class="selected" <# } #> data-layer='4' href="#">4</a></li>
                    <li><a <# if (data.layer == 5) { #> class="selected" <# } #> data-layer='5' href="#">5</a></li>
                    <li><a <# if (data.layer == 6) { #> class="selected" <# } #> data-layer='6' href="#">6</a></li>
                </ul>
            </div>
        </div><!--editor-option-->
        <div id="layer-change-point" class="editor-option">
            <label>Capa destino</label>
            <div class="layer-control">
                <ul>
                    <li class="first-leaf"><a <# if (data.toLayer == 1) { #> class="selected" <# } #> data-layer='1' href="#">1</a></li>
                    <li><a <# if (data.toLayer == 2) { #> class="selected" <# } #> data-layer='2' href="#">2</a></li>
                    <li><a <# if (data.toLayer == 3) { #> class="selected" <# } #> data-layer='3' href="#">3</a></li>
                    <li><a <# if (data.toLayer == 4) { #> class="selected" <# } #> data-layer='4' href="#">4</a></li>
                    <li><a <# if (data.toLayer == 5) { #> class="selected" <# } #> data-layer='5' href="#">5</a></li>
                    <li><a <# if (data.toLayer == 6) { #> class="selected" <# } #> data-layer='6' href="#">6</a></li>
                </ul>
            </div>
        </div><!--editor-option-->

        <div id="wifi-point" class="editor-option">
            <label>Wifi ESSID</label>
            <div class="text-control">
                <div class="text-control-wrapper">
                    <input type="text" name="wifi-essid" id="wifi-point-essid">{{data.wifi}}</input>
                </div>
            </div>
        </div><!--editor-option-->

        <div id="options-change-point" class="editor-option">
            <label>Opciones</label>
            <div class="toggle-control" id="toogle-options">
                <ul>
                    <li class="first-leaf"><a <# if (data.vibrate) { #> class="selected" <# } #> id="option-vibrate" href="#">Vibrate</a></li>
                    <li><a <# if (data.autofade) { #> class="selected" <# } #> id="option-autofade" href="#">AutoFade</a></li>
                </ul>
            </div>
        </div><!--editor-option-->





    </div><!--panel-wrapper-->
</script>


<script type="text/html" id="tmpl-audio-player">
    <audio src="{{data.url}}"></audio>
</script>

<script type="text/html" id="tmpl-marker-info">
    <h3>{{data.title}}</h3>
</script>

<script type="text/html" id="tmpl-point-info-picture">
    <img src="{{data.url}}"/>
</script>