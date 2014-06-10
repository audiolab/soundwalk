window.soundwalk = window.soundwalk || {};

(function($){
    var Info, Point, Points, walk, Marker, Markers;

    walk = soundwalk.walk = function () {

    }

    _.extend(walk, { model: {}, view: {}, controller: {}, frames: {}, constants: {}, icons:{} });

    _.extend(walk,	{
         /**
         * media.template( id )
         *
         * Fetches a template by id.
         * See wp.template() in `wp-includes/js/wp-util.js`.
         */
            template: wp.template,

        /**
         * media.post( [action], [data] )
         *
         * Sends a POST request to WordPress.
         * See wp.ajax.post() in `wp-includes/js/wp-util.js`.
         */
            post: wp.ajax.post,

        /**
         * media.ajax( [action], [options] )
         *
         * Sends an XHR request to WordPress.
         * See wp.ajax.send() in `wp-includes/js/wp-util.js`.
         */
            ajax: wp.ajax.send
    });

    //Define constants

    walk.constants.PLAY_POINT = 1;
    walk.constants.LOOP_POINT = 2;
    walk.constants.END_POINT = 3;
    walk.constants.WIFI_POINT = 4;
    walk.constants.LAYER_POINT = 5;

    walk.icons.Play = new L.Icon({
        iconUrl: '../wp-content/plugins/soundwalk/img/markers_play.png',
        iconSize: [25, 41],
        iconAnchor: [12,41]
    });
    walk.icons.Loop = new L.Icon({
        iconUrl: '../wp-content/plugins/soundwalk/img/markers_loop.png',
        iconSize: [25, 41],
        iconAnchor: [12,41]
    });

    walk.icons.End = new L.Icon({
        iconUrl: '../wp-content/plugins/soundwalk/img/markers_end.png',
        iconSize: [25, 41],
        iconAnchor: [12,41]
    });

    walk.icons.Wifi = new L.Icon({
        iconUrl: '../wp-content/plugins/soundwalk/img/markers_wifi.png',
        iconSize: [25, 41],
        iconAnchor: [12,41]
    });

    walk.icons.Layer = new L.Icon({
        iconUrl: '../wp-content/plugins/soundwalk/img/markers_layer.png',
        iconSize: [25, 41],
        iconAnchor: [12,41]
    });

    /* ----------------------------------------------------------------------------------------------------------------------------*/
    Info = walk.model.Info = Backbone.Model.extend({

    }); //Model Info
    /* ----------------------------------------------------------------------------------------------------------------------------*/

    Point = walk.model.Point = Backbone.Model.extend({
        toGeoJSON: function(){
            var r = {
                type: "Feature",
                geometry: {
                    type: "Circle",
                    coordinates: [parseFloat(this.attributes.lng), parseFloat(this.attributes.lat)],
                    radius: parseFloat(this.get('radius'))
                },
                properties:{
                    id: this.attributes.id,
                    title: this.attributes.title,
                    radius_units: 'm',
                    layer: parseInt(this.get('layer')),
                    file: this.get('fileInfo').get('filename'),
                    type: parseInt(this.get('type'))
                }
            };

            switch(this.get('type')){
                case walk.constants.WIFI_POINT:
                    r.properties.wifi= this.get('wifi');
                    break;
                case walk.constants.LAYER_POINT:
                    r.properties.toLayer= parseInt(this.get('toLayer'));
                    break;
            }

            return r;
        }

    });  //Model Point

/* ----------------------------------------------------------------------------------------------------------------------------*/

    Points = walk.model.Points = Backbone.Collection.extend({
        model: Point,
        toGeoJSON: function(){
            var r = {
                type: "FeatureCollection",
                features: []
            };

            this.forEach(function(element, index, list){
                r.features.push(element.toGeoJSON());
            }, this);

            return r;
        }
    });// Collection Points

/* ----------------------------------------------------------------------------------------------------------------------------*/

    Marker = walk.model.Marker = Backbone.Model.extend({
        toGeoJSON: function(){
            var r = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [parseFloat(this.attributes.lng), parseFloat(this.attributes.lat)]
                },
                properties:{
                    id: this.attributes.id,
                    title: this.attributes.title
                }
            };

            return r;
        }
    }); //Model Marker

/* ----------------------------------------------------------------------------------------------------------------------------*/

    Markers = walk.model.Markers = Backbone.Collection.extend({
        model: Marker,

        sync: function (method, model, options){

            if ('read' === method){
                options = options || {};
                options.context = this;
                options.data = _.extend( options.data || {}, {
                    action: 'get-markers-collection'
                });
                return walk.ajax( options );
            }
        },//sync

        toGeoJSON: function(){
            var r = {
                type: "FeatureCollection",
                features: []
            };

            this.forEach(function(element, index, list){
                r.features.push(element.toGeoJSON());
            }, this);

            return r;

        },//toGeoJSON

        parse: function( resp, xhr ) {
            if ( ! resp )
                return resp;

            return resp;
        }//parse

    }); // Collection Markers

/* ----------------------------------------------------------------------------------------------------------------------------*/
    Audio = walk.model.Audio = Backbone.Model.extend({

        sync: function (method, model, options){

            if ('read' === method){
                options = options || {};
                options.context = this;
                options.data = _.extend( options.data || {}, {
                    action: 'get-attachment',
                    id: options.id
                });
                return walk.ajax( options );
            }
        }//sync
    });



/* ----------------------------------------------------------------------------------------------------------------------------*/
    WalkM = walk.model.Walk = Backbone.Model.extend({
        sync: function (method, model, options){

            if ('create' === method && model){
                options = options || {};
                options.context = this;
                options.data = _.extend( options.data || {}, {
                    action: 'save-walk',
                    data: JSON.stringify(model.toJSON())
                });

                return walk.ajax( options );
            }
            if ('update' === method && model){
                options = options || {};
                options.context = this;
                options.data = _.extend( options.data || {}, {
                    action: 'save-walk',
                    data: JSON.stringify(model.toJSON()),
                    id: model.get('id')
                });

                return walk.ajax( options );
            }
            if ('read' === method && model){
                options = options || {};
                options.context = this;
                options.data = _.extend( options.data || {}, {
                    action: 'get-walk',
                    id: options.id
                });

                return walk.ajax( options );
            }
        }//sync
    });


    /* ----------------------------------------------------------------------------------------------------------------------------*/
}(jQuery));


