$(function(){
    var selected = [];
    table = $('#instances-table').DataTable({
        'ajax': {
            "type"   : "GET",
            "url"    : '/api/instances',
            "data"   : function( d ) {
            },
            "dataSrc": ""
        },
        'columns': [
            //{"data" : "false"},
            {"data" : "cloudProvider.provider", title: 'Provider'},
            {"data" : "id", title: 'Id'},
            {"data" : "name", title: 'Name'},
            {"data" : "zone", title: 'Zone'},
            {"data" : "os", title: 'OS'},
            {"data" : "type", title: 'type'},
            {"data" : "state", title: 'State'},
            {"data" : "cloudProvider.keyName", title: 'CSP.Id'}
        ],
        select: true,
        bRetrieve: true,
        "drawCallback": function( settings ) {
            $('<li><a onclick="refreshTable(1)" class="fa fa-refresh"></a></li>').prependTo('div.dataTables_paginate ul.pagination');
        }
        //'columnDefs': [{
        //    'targets': 0,
        //    'searchable': false,
        //    'orderable': false,
        //    'render': function (data, type, full, meta){
        //        console.log(data, type, full, meta);
        //        return '<input type="checkbox" name="" value="">';
        //    }
        //}]
    });
    //add selected class to row
    $('#instances-table tbody').on('click', 'tr', function () {
        $(this).toggleClass('selected');
    } );

    //create action buttons dinamically
    var tabs = [
        '<div class="col-sm-12">',
        '<div class="col-sm-2"></div>',
        '<div class="col-sm-2"><button type="button" class="btn btn-success">Start</button></div>',
        '<div class="col-sm-2"><button type="button" class="btn btn-warning">Stop</button></div>',
        '<div class="col-sm-2"><button type="button" class="btn btn-primary">Create</button></div>',
        '<div class="col-sm-2"><button type="button" class="btn btn-danger">Delete</button></div>',
        '<div class="col-sm-2"></div>',
        '</div>'
    ].join('');


    $( tabs ).insertAfter($('input[type=search]').parent().parent().parent());

    //init buttons
    $('button.btn-success').click(function(e){
        execAction('start');
    });

    $('button.btn-danger').click(function(e){
        execAction('terminate');
    });

    $('button.btn-primary').click(function(e){
        setProvidersSelect();
        $('#createModal').removeClass('hide');
        $('#createModal').modal();
    });

    $('button.btn-warning').click(function(e){
        execAction('stop');
    });

    //Create button in modal
    $('.modal .modal-footer .btn-primary').click(function(e){
        var provider = $('#select-providers :selected').val();

        var properties = {
            type : $('#select-type :selected').val(),
            image: $('#select-image :selected').val(),
            region: $('#select-region :selected').val(),
            name: $('#name').val()
        };

        var newInstance = {
            keyName: provider,
            properties: properties
        };

        if(!provider) {
            $('.modal').modal('hide');
            showError(new Error('No provider selected'), 5000);
            return;
        }

        execCreate(newInstance, function(res){
            $('.modal').modal('hide');
            parseActionExecution(res);
            refreshTable();
        }, function(err){
            $('.modal').modal('hide');
            showError(err, 5000);
        });


    });

    //event for provider select.
    $('#select-providers').on('change', function() {
        //when a provider is selected, we must fill others fields with data

        /*get selected value*/
        var account = $('#select-providers :selected').val();
        var provider = getProviderByKeyName(account);

        if(!provider){
            alert('ERROR: No provider selected');
            return;
        }

        getDispositions().then(function(dispositions){
            var data = dispositions[provider];

            //fill type
            var type = $('#select-type');
            type.empty();
            fillDropdown(type, data.type);
            //fill region
            var region = $('#select-region');
            region.empty();
            fillDropdown(region, data.region);
            //fill image
            var image = $('#select-image');
            image.empty();
            fillDropdown(image, data.image);

        });
    });

    //refresh table every 10 seconds
    //note: For setInterval to work, we must wrap the function with a function.
    setInterval( function(){refreshTable()} , 10000);

});

/*//---------------------Functions---------------------\\*/
var accounts = [];

function getSelectedRows(){
    var selected = [];
    $('.selected').each(function(i, it){selected.push($(it).children().map(function(i, it){return $(it).text();}).toArray());})
    return selected;
};

function execAction(action, newInstance){
    if(!action) {
        showError(new Error('No action selected'));
        return;
    }

    var instances = getSelectedRows();

     var cmanData;

    if(action !== 'create') {
        if(instances.length === 0){
            showError(new Error('No rows selected'));
            return;
        };

        cmanData = {
            data: instances.map(function (it, i) {
                return {keyName: it[7], instanceId: it[1]}
            }), method: action
        };
    }
    else {
        cmanData = {newInstance: [newInstance], method: action};
    }

    post('/api/instances', cmanData, function(res){
        parseActionExecution(res);
        refreshTable(2);
    }, showError);
};

function execCreate(newInstance, cb, err){
    var cmanData = {newInstance: [newInstance], method: 'create'};

    post('/api/instances', cmanData, function(res){
        cb(res);
    }, err);
};


//wrapper to $.ajax since we cannot add contentType header to $.post
function post(url, data, success, err){
    $.ajax({
        url:url,
        type:"POST",
        data:JSON.stringify(data),
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success: success,
        error: err
    });
};

function showError(err, delay){
    console.log(err);
    var jsonError;
    if($.type(err) === "object" && err.responseText)
        jsonError = JSON.parse(err.responseText);
    else
        jsonError = {message: err.message};

    var text = jsonError.message || jsonError.error || "Generic server error";

    showAlert(text, 'danger', delay);
};

function refreshTable(source){

    if(getSelectedRows().length > 0 && !source)
        return;

    $('#instances-table').DataTable().ajax.reload();

    if(source && source === 1)
        showAlert('Table refreshed', 'info');

    console.log('table refreshed at ' + (new Date()).toISOString());
}

function parseActionExecution(response){
    var alertText = '';
    var type = 'info';
    var time;

    response.forEach(function(r){
        if(r.actionProcessed) {
            alertText = "_action_ action in instance with id _id_ could be processed."
                .replace('_action_', r.action)
                .replace('_id_', r.input);
            type = 'success';
        }
        else{
            alertText = "_action_ action in instance with id _id_ could not be processed. Error: _err_"
                .replace('_action_', r.action)
                .replace('_id_', r.input)
                .replace('_err_', r.errMessage);
            type = 'danger';
            time = 5000;
        }

        showAlert(alertText, type, time);

    });
};

function showAlert(message, type, closeDelay) {
    var DEFAULT_ALERT_TIME = 3000;
    if ($("#alerts-container").length == 0) {
        // alerts-container does not exist, add it
        $("body")
            .append( $('<div id="alerts-container" style="position: fixed; width: 50%; left: 25%; top: 10%;">') );
    }

    // default to alert-info; other options include success, warning, danger
    type = type || "info";

    // create the alert div
    var alert = $('<div class="alert alert-' + type + ' fade in">')
        .append(
            $('<button type="button" class="close" data-dismiss="alert">')
                .append("&times;")
        )
        .append(message);

    // add the alert div to top of alerts-container, use append() to add to bottom
    $("#alerts-container").prepend(alert);

    // if closeDelay was passed - set a timeout to close the alert
    if (closeDelay && closeDelay > 0)
        window.setTimeout(function() { alert.alert("close") }, closeDelay);
    else
        window.setTimeout(function() { alert.alert("close") }, DEFAULT_ALERT_TIME);
}

function getDispositions(){
    var promise = $.Deferred();
    $.getJSON('/api/instances/dispositions', function(res){
        promise.resolve(res);
    });
    return promise.promise();
};

function getProviders(){
    var promise = $.Deferred();
    $.getJSON('/api/providers', function(res){
        accounts = res;
        promise.resolve(res);
    });
    return promise.promise();
};

function setProvidersSelect(){
    if($('#select-providers option').length > 0) return;
    getProviders().then(function(providers){
        var select = $('#select-providers');
        select.append($("<option />").val('').text(''));
        fillDropdown(select, providers);
    });
};

function fillDropdown(dropdown, data){
    $.each(data, function() {
        dropdown.append($("<option />").val(this.id).text(this.label));
    });
};

function getProviderByKeyName(keyName){
    var found;
    $.each(accounts, function(){
        if(this.id === keyName)
            found = this.provider;
        return;
    });

    return found;
};