(function($){

    var soundwalk = window.soundwalk.walk;


    var ui = {

        initialize: function(){
            $('#soundwalk-tabs').tabs({active: 1});
            var editor = new soundwalk.view.WalkEditor;
        }

    };


    $(document).ready(function(){
        ui.initialize();
    });



}(jQuery));