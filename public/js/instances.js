$(function(){
    $('#instances-table').DataTable({
        'ajax': {
            "type"   : "GET",
            "url"    : '/api/instances',
            "data"   : function( d ) {
                console.log('d', d);
            },
            "dataSrc": ""
        },
        'columns': [
            {"data" : "cloudProvider.provider", title: 'Provider'},
            {"data" : "id", title: 'Id'},
            {"data" : "zone", title: 'Zone'},
            {"data" : "os", title: 'OS'},
            {"data" : "type", title: 'type'},
            {"data" : "public_dns_name", title: 'DNS'},
            {"data" : "state", title: 'State'},
            {"data" : "cloudProvider.keyName", title: 'CSP.Id'}
        ]
    });
});