(function($){
    var soundwalk = window.soundwalk.walk,
        config = SoundwalkOptions; // Configuración inicial del mapa

/* ----------------------------------------------------------------------------------------------------------------------------*/

    /*
        VIEW WALKMAP
        Este view se encarga del mapa general de preview de un paseo.

     */


    soundwalk.view.WalkMap = Backbone.View.extend({
        el: $('#walk-preview'),
        map: undefined,
        collection: new soundwalk.model.Points,
        layers: [],
        state: 0,   //0 = normal, 1 = añadir punto , 2 = delete, 3 = edit

        initialize: function(){
            this.render();
            this.listenTo(this.collection, 'add', this.addPoint);
            this.listenTo(this.collection, 'reset', this.resetCollection);
        },

        render: function(){

            if(this.map === undefined){
                //No existe el mapa y por lo tanto tenemos que crearlo para el renderizarlo.
                this.map = L.map('walk-map').setView([config.lat, config.lng], config.zoom);
                var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                var osmAttrib='Map data © OpenStreetMap contributors';
                var osm = new L.TileLayer(osmUrl, {minZoom: 6, maxZoom: 19, attribution: osmAttrib});
                this.map.addLayer(osm);
                for (var i = 0; i<7; i++){
                    this.layers.push(L.layerGroup().addTo(this.map));
                }

                var oL = {
                    "Todos": this.layers[0],
                    "Capa 1": this.layers[1],
                    "Capa 2": this.layers[2],
                    "Capa 3": this.layers[3],
                    "Capa 4": this.layers[4],
                    "Capa 5": this.layers[5],
                    "Capa 6": this.layers[6]
                }

                L.control.layers({'Base': osm},oL).addTo(this.map);

            }

        },//render

        deleteMode: function(){
          this.state = 2;
        },

        editMode: function(){
            this.state = 3;
        },

        changeType: function(point, type){
            var _l = point.get('layer'),
                _mLID = point.get('mLID'),
                _m = this.layers[_l].getLayer(_mLID);

            switch (type){
                case soundwalk.constants.PLAY_POINT:
                    _m.setIcon(soundwalk.icons.Play);
                    break;
                case soundwalk.constants.LOOP_POINT:
                    _m.setIcon(soundwalk.icons.Loop);
                    break;
                case soundwalk.constants.END_POINT:
                    _m.setIcon(soundwalk.icons.End);
                    break;
                case soundwalk.constants.WIFI_POINT:
                    _m.setIcon(soundwalk.icons.Wifi);
                    break;
                case soundwalk.constants.LAYER_POINT:
                    _m.setIcon(soundwalk.icons.Layer);
                    break;
            }

        },

        createPoint: function(){
            this.state = 1;
            this.map.addOneTimeEventListener('click', this.mapClicked, this);
        },

        mapClicked: function(event){
            var latlng = event.latlng;
            var marker = L.marker(latlng,{draggable: true, title: '', icon: soundwalk.icons.Layer});
            var circle = L.circle(latlng, 5);

            this.stopListening(this.collection);

            var _p = new soundwalk.model.Point;

            _p.set({
                mID: '',
                lat:latlng.lat,
                lng: latlng.lng,
                title: '',
                files: '',
                fileInfo: '',
                autor: '',
                type: soundwalk.constants.LAYER_POINT,
                radius: 5,
                layer: 0,
                id: '',
                toLayer: 1,
                wifi: '',
                vibrate: false,
                autofade: false
            });
            this.collection.add(_p);

            this.listenTo(this.collection, 'add', this.addPoint);

            marker.pID = _p.cid;

            this.layers[0].addLayer(circle);
            this.layers[0].addLayer(marker);

            marker.addEventListener('dragend', this.markerMoved, this);
            marker.addEventListener('click', this.markerClicked, this);

            _p.set({
                mLID: this.layers[0].getLayerId(marker),
                cLID: this.layers[0].getLayerId(circle),
                id: _p.cid
            });

            this.state = 0;
            this.trigger('createdPoint', _p);

        },

        changeLayer: function(point, layer){

            var cLID = point.get('cLID');
            var mLID = point.get('mLID');
            var _l = point.get('layer');
            var _c = this.layers[_l].getLayer(cLID);
            var _m = this.layers[_l].getLayer(mLID);
            this.layers[_l].removeLayer(_c);
            this.layers[_l].removeLayer(_m);
            this.layers[layer].addLayer(_c);
            this.layers[layer].addLayer(_m);
        },

        changeRadius: function(point, radius){
            var _p = this.collection.get(point.get('id'));
            var cLID = _p.get('cLID');
            var _l = _p.get('layer');
            var _c = this.layers[_l].getLayer(cLID);
            _c.setRadius(radius);
        },
        resetCollection: function(collection, options){
            collection.forEach( function(element, index, list){
                var marker = L.marker([element.get('lat'), element.get('lng')],{draggable: true, clickable: true, title: element.get('title'), icon: soundwalk.icons.Play});
                var circle = L.circle([element.get('lat'), element.get('lng')], element.get('radius'));
                var _l = element.get('layer');
                marker.pID = element.get('id');
                this.layers[_l].addLayer(circle);
                this.layers[_l].addLayer(marker);

                marker.addEventListener('dragend', this.markerMoved, this);
                marker.addEventListener('click', this.markerClicked, this);

                element.set({
                    mLID: this.layers[_l].getLayerId(marker),
                    cLID: this.layers[_l].getLayerId(circle)
                });
            }, this);
        },

        addPoint: function(model, collection, options){
            var marker = L.marker([model.get('lat'), model.get('lng')],{draggable: true, clickable: true, title: model.get('title'), icon: soundwalk.icons.Play});
            var circle = L.circle([model.get('lat'), model.get('lng')], model.get('radius'));
            var _l = model.get('layer');
            marker.pID = model.get('id');
            this.layers[_l].addLayer(circle);
            this.layers[_l].addLayer(marker);

            marker.addEventListener('dragend', this.markerMoved, this);
            marker.addEventListener('click', this.markerClicked, this);

            model.set({
                mLID: this.layers[_l].getLayerId(marker),
                cLID: this.layers[_l].getLayerId(circle)
            });
        },
        markerClicked: function(event){
          switch(this.state){
              case 2:
                  //delete mode
                  var _m = event.target,
                      _pID = event.target.pID,
                      _p = this.collection.get(_pID),
                      _l = _p.get('layer'),
                      _cLID = _p.get('cLID'),
                      _c = this.layers[_l].getLayer(_cLID);

                  this.layers[_l].removeLayer(_c);
                  this.layers[_l].removeLayer(_m);
                  this.collection.remove(_p);
                  this.trigger('deletedPoint', _p);
                  break;
              case 3:
                  //edit mode
                  var _m = event.target,
                      _pID = event.target.pID,
                      _p = this.collection.get(_pID);
                  this.trigger('editPoint', _p);
                  break;
          }
        },
        markerMoved:function(event){
            var _m = event.target,
                _pID = event.target.pID,
                latlng = event.target.getLatLng(),
                _p = this.collection.get(_pID),
                _l = _p.get('layer'),
                _cLID = _p.get('cLID'),
                _c = this.layers[_l].getLayer(_cLID);

            _p.set({
                lat: latlng.lat,
                lng: latlng.lng
            })

            _c.setLatLng(latlng);
        }



    }); // view.WalkMap

/* ----------------------------------------------------------------------------------------------------------------------------*/

    /*
     VIEW AudioPlayer
     */

    soundwalk.view.AudioPlayer = Backbone.View.extend({
        template: soundwalk.template('audio-player'),
        model: new soundwalk.model.Audio(),

        initialize: function(){
            this.listenTo(this.model, 'sync', this.render);
            //this.model.fetch({id: this.options.aID});
        },



        render: function(){
            var _u = this.model.get('url');
            this.$el.html(this.template({url: _u}));
            this.$('audio').mediaelementplayer({
                audioWidth: '100%',
                audioHeight: 50,
                features: ['playpause','progress','volume']
            });
        }


    });

/* ----------------------------------------------------------------------------------------------------------------------------*/

    /*
     VIEW MARKERSMAP
     Este view se encarga del mapa con los marcadores generales.
     */

    soundwalk.view.MarkersMap = Backbone.View.extend({
        el: $('#markersWrapper'),
        map: undefined,
        collection: new soundwalk.model.Markers,
        self: undefined,
        player: undefined,
        template: soundwalk.template('marker-info'),
        marker:undefined,
        events:{
            'click #marker-add-button button': 'addPoint'
        },
        initialize: function(){
            self = this;
            this.listenTo(this.collection, 'sync', this.render);
            this.collection.fetch();
            this.render();

        },//initialize

        render: function(){

            if(this.map === undefined){
                //No existe el mapa y por lo tanto tenemos que crearlo para el renderizarlo.
                this.map = L.map('markersMap').setView([config.lat, config.lng], config.zoom);
                var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                var osmAttrib='Map data © OpenStreetMap contributors';
                var osm = new L.TileLayer(osmUrl, {minZoom: 6, maxZoom: 19, attribution: osmAttrib});
                this.map.addLayer(osm);

            }
            if(!this.collection.isEmpty()){
                //La colección no está vacia, por lo que tengo que poner los puntos en el mapa.
                L.geoJson(this.collection.toGeoJSON(),{
                    onEachFeature: function(feature, layer){
                        layer.on('click', self.onMarkerClick);
                    }
                }).addTo(this.map);
            }
        },//render

        onMarkerClick: function(event){
            //utilizar self porque no podemos acceder con THIS!!!!
            var layer = event.target;
            var feature = layer.feature;
            var id = feature.properties.id;
            //self.trigger('markerClick', self.collection.get(id));
            self.markerClick(self.collection.get(id));
        },

        markerClick: function (marker){
            this.marker = marker;
            this.player = new soundwalk.view.AudioPlayer({aID: marker.get('files')});
            this.player.model.fetch({id: marker.get('files')});
            this.player.setElement(this.$('#marker-player'));
            this.$('#marker-info-text').html(this.template({title: marker.get('title')}));
            this.$('#marker-add-button').show();

        },

        addPoint: function (event){
            self.trigger('markerClick', this.marker );
            tb_remove();
        }

    });//view.MarkersMap


/* ----------------------------------------------------------------------------------------------------------------------------*/

    /*
     VIEW PointInfo
     Este view responde a las selecciones de un punto o de un marcador y permite
     configurar los elementos de cada punto.
     */

    soundwalk.view.PointInfo = Backbone.View.extend({
        el: $('#soundwalk-datos'),
        model: new soundwalk.model.Info,
        file_frame:  wp.media.frames.file_frame = wp.media({
            multiple: false,
            library: {
                type: 'image'
            }
        }),
        image_template: soundwalk.template('point-info-picture'),

        events: {
            'click #walk-submit': 'onSubmit',
            'click #walk-picture-wrapper a': 'openMediaSelector'
        },

        initialize:function(){
            this.file_frame.on('select',this.pictureSelected, this);
            this.listenTo(this.model, 'change', this.updateFields);
            this.model.set({fID: ''});
        },

        updateFields: function (model, options){
            this.$('#title').val(model.get('title'));
            this.$('#walk-excerpt').val(model.get('description'));
            this.$('#walk-language').val(model.get('language'));
            this.$('#walk-picture-preview').html(this.image_template({url: model.get('fileName')}));
        },

        validate: function(){
            var _i = {
                title: this.$('#title').val(),
                description: this.$('#walk-excerpt').val(),
                language: this.$('#walk-language').val()
            }

            this.model.set(_i);

            if (_i.title == ""){
                return false;
            }
            return true;
        },

        pictureSelected: function(){
           var attachment = this.file_frame.state().get('selection').first().toJSON();
            var thumb = attachment.sizes.thumbnail.url;
            var id = attachment.id;

            this.$('#walk-picture-preview').html(this.image_template({url: thumb}));
            this.model.set({
                fID: id,
                fileName: attachment.filename
            });
        },

        openMediaSelector: function(event){
            event.preventDefault();
            if ( this.file_frame ){
                this.file_frame.open();
                return;
            };
        },
        onSubmit: function(event){
            event.preventDefault();
            this.trigger('submit');
            //console.log(editor.toGeoJSON());
        }

    });// PointInfo

/* ----------------------------------------------------------------------------------------------------------------------------*/

    /*
     VIEW PointEditor
     Este view responde a las selecciones de un punto o de un marcador y permite
     configurar los elementos de cada punto.
     */
    soundwalk.view.PointEditor = Backbone.View.extend({
        el: $('#walk-point-editor'),
        template: soundwalk.template('point-editor-template'),
        events: {
            'click #toggle-tipos a': 'toggleType',
            'click #layer-point a': 'toggleLayer',
            'click #layer-change-point a': 'changeToLayer',
            'change #wifi-point-essid': 'wifiChange',
            'click #option-vibrate': 'toggleVibrate',
            'click #option-autofade': 'toggleAutofade'
        },

        initialize:function(){
            this.render();
        },

        toggleVibrate: function(event){
          event.preventDefault();
            var _t = event.currentTarget;
            this.$(_t).toggleClass('selected');
            var _r = this.model.get('vibrate');
            this.model.set({vibrate: !(_r)});
        },

        toggleAutofade: function(event){
            event.preventDefault();
            var _t = event.currentTarget;
            this.$(_t).toggleClass('selected');
            var _r = this.model.get('autofade');
            this.model.set({autofade: !(_r)});
        },

        wifiChange: function(event){
            var _t = event.currentTarget;
            this.model.set({wifi: _t.value});
        },

        changeToLayer: function(event){
            event.preventDefault();
            var _t = event.currentTarget,
                layer = _t.dataset.layer;
            this.$('#layer-change-point a').removeClass('selected');
            this.$(_t).addClass('selected');
            this.trigger('layerToChange', this.model, layer );
            this.model.set({toLayer: layer});
        },

        toggleLayer: function(event){
            event.preventDefault();
            var _t = event.currentTarget,
                layer = _t.dataset.layer;
            this.$('#layer-point a').removeClass('selected');
            this.$(_t).addClass('selected');
            this.trigger('layerChange', this.model, layer );
            this.model.set({layer: layer});

        },

        toggleType: function(event){
            var _t = event.currentTarget,
                tipo = _t.dataset.type;
            this.$('#toggle-tipos a').removeClass('selected');
            this.$(_t).addClass('selected');
            var _type = 0;
            switch(tipo){
                case 'play':
                    _type = soundwalk.constants.PLAY_POINT;
                    this.$('#wifi-point').hide();
                    this.$('#layer-change-point').hide();
                    break;
                case 'loop':
                    _type =  soundwalk.constants.LOOP_POINT;
                    this.$('#wifi-point').hide();
                    this.$('#layer-change-point').hide();
                    break;
                case 'end':
                    _type =  soundwalk.constants.END_POINT;
                    this.$('#wifi-point').hide();
                    this.$('#layer-change-point').hide();
                    break;
                case 'wifi':
                    _type =  soundwalk.constants.WIFI_POINT;
                    this.$('#wifi-point').show();
                    this.$('#layer-change-point').hide();
                    break;
                case 'layer':
                    _type =  soundwalk.constants.LAYER_POINT;
                    this.$('#wifi-point').hide();
                    this.$('#layer-change-point').show();
                    break;
            }
            event.preventDefault();
            this.trigger('typeChange', this.model, _type );
            this.model.set({type: _type});
        },

        render: function(){
            if(_.isUndefined(this.model)){
                return;
            }

            var _t = this.template({
                title: this.model.get('title'),
                type: this.model.get('type'),
                autor: this.model.get('autor'),
                radio: this.model.get('radius'),
                layer: this.model.get('layer'),
                toLayer: this.model.get('toLayer'),
                wifi: this.model.get('wifi'),
                autofade: this.model.get('autofade'),
                vibrate: this.model.get('vibrate')
            });

            this.$el.html(_t);
            this.audioplayer = new soundwalk.view.AudioPlayer({aID: this.model.get('files')});
            this.audioplayer.setElement(this.$('#point-player'));
            this.$('.slider-radio').slider({
                min: 0,
                max: 99,
                value: 5
            });
            this.$('.slider-radio').bind('slide', _.bind(this.slide, this));
            this.$('#layer-change-point').hide();
            if(this.model.get('type') == 5){
                this.$('#layer-change-point').show();
            }
            this.$('#wifi-point').hide();
            if(this.model.get('type') == 4){
                this.$('#wifi-point').show();
            }
        },

        clean: function(){
            this.$el.empty();
            this.reset();
            this.model = undefined;
        },

        reset:function(){
            this.undelegateEvents();
        },

        slide: function(event, ui){
            this.$('.slider-radio-value').text('Radio: ' + ui.value + 'm');
            this.trigger('radiusChange', this.model, ui.value );
            this.model.set({radius: ui.value});
        }
    });

/* ----------------------------------------------------------------------------------------------------------------------------*/

    /*
     VIEW MessagePanel
     */

    soundwalk.view.Messages = Backbone.View.extend({
        el:$('#soundwalk-messages'),

        initialize: function(){
            this.render();
        },

        render: function(){
            this.$el.hide();
        },

        showMessage: function(mess, type){
          this.$el.empty();
          this.$el.html("<div class='" + type + "'><p>" + mess + "</p></div>");
          this.$el.show();
          this.$el.fadeIn('fast');

        }

    });



    /* ----------------------------------------------------------------------------------------------------------------------------*/

    /*
     VIEW WALKEDITOR
     Este view se encarga del mapa con los marcadores generales.
     */
    soundwalk.view.WalkEditor = Backbone.View.extend({
        el: $('#walk-editor'),
        markersMap: new soundwalk.view.MarkersMap, //Vista de los marcadores
       // points: new soundwalk.model.Points, Colección de puntos
        pointEditor: undefined,
        walkMap: new soundwalk.view.WalkMap,
        pointInfo: new soundwalk.view.PointInfo,
        walk: new soundwalk.model.Walk,
        messages: new soundwalk.view.Messages,

        events: {
            "click #create-point":  "createPoint",
            "click #delete-point": "deletePoint",
            "click #edit-point": "editPoint"
        },

        initialize: function(){
            this.listenTo(this.markersMap, 'markerClick', this.addPoint);
            this.listenTo(this.pointInfo, 'submit', this.submit);
            this.walk.set({
                points: new soundwalk.model.Points,
                info: new soundwalk.model.Info
            });
            if (_.has(config,'edit_Walk')){
                //tenemos que cargar el paseo para poder ponerlo!!!
                var _id = config.edit_Walk;
                this.listenToOnce(this.walk, 'sync', this.walkLoaded);
                this.walk.fetch({id: _id});
            }
            //this.listenTo(this.points, 'add', this.addPointToMap);
        },

        submit: function(){
          var valid_info = this.pointInfo.validate();
          if (valid_info){
              this.walk.set({info: this.pointInfo.model});
              this.listenToOnce(this.walk, 'sync', this.walkSaved);
              this.walk.save();
          }
        },

        walkLoaded: function(model, resp, options){
            //creo los puntos

            this.walkMap.collection.reset(model.get('points'));
            this.pointInfo.model = this.pointInfo.model.set(model.get('info'));

            this.walk.set({
                points: this.walkMap.collection,
                info: this.pointInfo.model
            })

        },

        walkSaved: function(model, resp, options){
            this.messages.showMessage('Paseo guardado correctamente', 'updated');
        },

        editPoint: function(){
            this.listenToOnce(this.walkMap, 'editPoint', this.editedPoint);
            this.walkMap.editMode();
            this.$('#editor-toolbar li').removeClass('selected');
            this.$('#edit-point').addClass('selected');
        },

        editedPoint: function(point){
            if(!_.isUndefined(this.pointEditor)){
                this.pointEditor.reset();
                this.stopListening(this.pointEditor);
            }

            this.pointEditor = new soundwalk.view.PointEditor({model: point});
            this.listenTo(this.pointEditor, 'radiusChange', this.radiusChange);
            this.listenTo(this.pointEditor, 'typeChange', this.typeChange);
            this.listenTo(this.pointEditor, 'layerChange', this.layerChange);
            this.$('#edit-point').removeClass('selected');
        },

        deletePoint:function(){
            this.listenToOnce(this.walkMap, 'deletedPoint', this.deletedPoint);
            this.walkMap.deleteMode();
            this.$('#editor-toolbar li').removeClass('selected');
            this.$('#delete-point').addClass('selected');
        },

        deletedPoint: function(point){
            this.$('#editor-toolbar li').removeClass('selected');
            this.walk.get('points').remove(point);
            //this.points.remove(point);
            if(this.pointEditor.model === point){
                this.pointEditor.clean();
            }
        },

        createPoint:function(){
            this.listenToOnce(this.walkMap, 'createdPoint', this.createdPoint);
            this.$('#editor-toolbar li').removeClass('selected');
            this.$('#create-point').addClass('selected');
            this.walkMap.createPoint();
        },
        createdPoint: function(point){
            //this.points.add(point);
            this.walk.get('points').add(point);
            if(!_.isUndefined(this.pointEditor)){
                // this.pointEditor.remove();
                this.pointEditor.reset();
                this.stopListening(this.pointEditor);

            }

            this.pointEditor = new soundwalk.view.PointEditor({model: point});
            this.listenTo(this.pointEditor, 'radiusChange', this.radiusChange);
            this.listenTo(this.pointEditor, 'typeChange', this.typeChange);
            this.listenTo(this.pointEditor, 'layerChange', this.layerChange);
            this.$('#editor-toolbar li').removeClass('selected');
        },

        layerChange: function(point, layer){
          this.walkMap.changeLayer(point, layer);
        },
        radiusChange: function(point, radius){
          this.walkMap.changeRadius(point, radius);
        },

        typeChange: function(point, type){
          this.walkMap.changeType(point, type);
        },

        addPoint: function(marker){
            var _p = new soundwalk.model.Point;

            _p.set({
                mID: marker.get('id'),
                lat: marker.get('lat'),
                lng: marker.get('lng'),
                title: marker.get('title'),
                files: marker.get('files'),
                fileInfo: new soundwalk.model.Audio,
                autor: marker.get('autor'),
                type: soundwalk.constants.PLAY_POINT,
                radius: 5,
                layer: 0,
                id: marker.get('id'),
                toLayer: 0,
                wifi: '',
                autofade: false,
                vibrate: false
            });

            _p.get('fileInfo').fetch({id: marker.get('files')});

            //this.points.add(_p);
            this.walk.get('points').add(_p);
            if(!_.isUndefined(this.pointEditor)){
               // this.pointEditor.remove();
                this.pointEditor.reset();
                this.stopListening(this.pointEditor);

            }
            this.pointEditor = new soundwalk.view.PointEditor({model: _p});
            this.walkMap.collection.add(_p);
            this.listenTo(this.pointEditor, 'radiusChange', this.radiusChange);
            this.listenTo(this.pointEditor, 'typeChange', this.typeChange);
            this.listenTo(this.pointEditor, 'layerChange', this.layerChange);

        },

        toGeoJSON: function(){
            return this.get('points').toGeoJSON();
            //return this.points.toGeoJSON();
        },

        addPointToMap: function(model, collection, options){
            this.markersMap.addPoint(model);
        }
    });




    }(jQuery));