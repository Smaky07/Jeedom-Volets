var map;
var DroitLatLng=new Object();
var CentreLatLng=new Object();
var GaucheLatLng=new Object();
$("#table_cmd").sortable({axis: "y", cursor: "move", items: ".cmd", placeholder: "ui-state-highlight", tolerance: "intersect", forcePlaceholderSize: true});
$("#table_condition").sortable({axis: "y", cursor: "move", items: ".ConditionGroup", placeholder: "ui-state-highlight", tolerance: "intersect", forcePlaceholderSize: true});
$("#table_action").sortable({axis: "y", cursor: "move", items: ".ActionGroup", placeholder: "ui-state-highlight", tolerance: "intersect", forcePlaceholderSize: true});
$('body').on('change','.eqLogicAttr[data-l1key=configuration][data-l2key=isRandom]',function(){
	if($(this).is(':checked'))
		$('.Presence').show();
	else
		$('.Presence').hide();
});
$('body').on('change','.eqLogicAttr[data-l1key=configuration][data-l2key=heliotrope]',function(){
	$('#MyMap').html('');
	$.ajax({
		type: 'POST',            
		async: false,
		url: 'plugins/Volets/core/ajax/Volets.ajax.php',
		data:{
			action: 'getInformation',
			heliotrope:$(this).val(),
		},
		dataType: 'json',
		global: false,
		error: function(request, status, error) {},
		success: function(data) {
			if (!data.result)
				$('#div_alert').showAlert({message: 'Aucun message reçu', level: 'error'});
			if (typeof(data.result.geoloc) !== 'undefined') {
				var center=data.result.geoloc.configuration.coordinate.split(",");
				CentreLatLng.lat=parseFloat(center[0]);
				CentreLatLng.lng=parseFloat(center[1]);
				map = new ol.Map({
					view: new ol.View({
						center: ol.proj.fromLonLat([CentreLatLng.lng,CentreLatLng.lat]),
						zoom: 10
					}),
					layers: [
						new ol.layer.Tile({
							source: new ol.source.OSM()
						})
					],
					target: 'MyMap'
				});
			}
		}
	});
});

function saveEqLogic(_eqLogic) {
	_eqLogic.configuration.condition=new Object();
	_eqLogic.configuration.action=new Object();
	var ConditionArray= new Array();
	var ActionArray= new Array();
	$('#conditiontab .ConditionGroup').each(function( index ) {
		ConditionArray.push($(this).getValues('.expressionAttr')[0])
	});
	$('#actiontab .ActionGroup').each(function( index ) {
		ActionArray.push($(this).getValues('.expressionAttr')[0])
	});
	_eqLogic.configuration.condition=ConditionArray;
	_eqLogic.configuration.action=ActionArray;
   	return _eqLogic;
}
function printEqLogic(_eqLogic) {
	$('.ConditionGroup').remove();
	$('.ActionGroup').remove();
	$('.eqLogicAttr[data-l1key=configuration][data-l2key=Droite]').val(JSON.stringify(_eqLogic.configuration.Droite));
	$('.eqLogicAttr[data-l1key=configuration][data-l2key=Centre]').val(JSON.stringify(_eqLogic.configuration.Centre));
	$('.eqLogicAttr[data-l1key=configuration][data-l2key=Gauche]').val(JSON.stringify(_eqLogic.configuration.Gauche));
	if (typeof(_eqLogic.configuration.heliotrope) !== 'undefined' && _eqLogic.configuration.heliotrope!='') 
		TraceMapZone(_eqLogic);
	if (typeof(_eqLogic.configuration.condition) !== 'undefined') {
		for(var index in _eqLogic.configuration.condition) { 
			if( (typeof _eqLogic.configuration.condition[index] === "object") && (_eqLogic.configuration.condition[index] !== null) )
				addCondition(_eqLogic.configuration.condition[index],$('#conditiontab').find('table tbody'));
		}
	}
	if (typeof(_eqLogic.configuration.action) !== 'undefined') {
			for(var index in _eqLogic.configuration.action) { 
				if( (typeof _eqLogic.configuration.action[index] === "object") && (_eqLogic.configuration.action[index] !== null) )
					addAction(_eqLogic.configuration.action[index],$('#actiontab').find('table tbody'));
			}
	}	
}
function TraceMapZone(_zone){
	DroitLatLng.lat=CentreLatLng.lat;
	DroitLatLng.lng=CentreLatLng.lng- (1 / 3600);
	GaucheLatLng.lat=CentreLatLng.lat;
	GaucheLatLng.lng=CentreLatLng.lng+ (1 / 3600);
	if (typeof(_zone.configuration.Droite) !== 'undefined' && _zone.configuration.Droite != "") {
		if (typeof(_zone.configuration.Droite.lat) !== 'undefined' && _zone.configuration.Droite.lat != "" ) 
			DroitLatLng.lat=parseFloat(_zone.configuration.Droite.lat);
		if (typeof(_zone.configuration.Droite.lng) !== 'undefined' && _zone.configuration.Droite.lng != "" ) 
			DroitLatLng.lng=parseFloat(_zone.configuration.Droite.lng);
	}
	if (typeof(_zone.configuration.Gauche) !== 'undefined' && _zone.configuration.Gauche != "") {
		if (typeof(_zone.configuration.Gauche.lat) !== 'undefined' && _zone.configuration.Gauche.lat != "" ) 
			GaucheLatLng.lat=parseFloat(_zone.configuration.Gauche.lat);
		if (typeof(_zone.configuration.Gauche.lng) !== 'undefined' && _zone.configuration.Gauche.lng != "" ) 
			GaucheLatLng.lng=parseFloat(_zone.configuration.Gauche.lng);
	}
	if (typeof(_zone.configuration.Centre) !== 'undefined' && _zone.configuration.Centre != "") {
		if (typeof(_zone.configuration.Centre.lat) !== 'undefined' && _zone.configuration.Centre.lat != "" ) 
			CentreLatLng.lat=parseFloat(_zone.configuration.Centre.lat);
		if (typeof(_zone.configuration.Centre.lng) !== 'undefined' && _zone.configuration.Centre.lng != "" )
			CentreLatLng.lng=parseFloat(_zone.configuration.Centre.lng);
	}
	$('.AngleDroite').text(getAngle(CentreLatLng,DroitLatLng));
	$('.AngleGauche').text(getAngle(CentreLatLng,GaucheLatLng));
	var features = [];
	var PolylineDroite = new ol.geom.Polygon([[[CentreLatLng.lng,CentreLatLng.lat], [DroitLatLng.lng,DroitLatLng.lat]]]);
	PolylineDroite.transform('EPSG:4326', 'EPSG:3857');
	features.push(new ol.Feature(PolylineDroite));
	var PolylineGauche = new ol.geom.Polygon([[[CentreLatLng.lng,CentreLatLng.lat], [GaucheLatLng.lng,GaucheLatLng.lat]]]);
	PolylineGauche.transform('EPSG:4326', 'EPSG:3857');
	features.push(new ol.Feature(PolylineGauche));
	var Droit = new ol.Feature({
		geometry: new ol.geom.Point(ol.proj.transform([DroitLatLng.lng,DroitLatLng.lat], 'EPSG:4326', 'EPSG:3857'))
	});
	Droit.setStyle([  
		new ol.style.Style({      
			image: new ol.style.Circle({
     				radius: 5,
        			stroke: new ol.style.Stroke({
          				color: '#000'
				}),
				fill: new ol.style.Fill({
					color: 'rgba(255,255,255,0.4)'
				}),
      			}),
			text: new ol.style.Text({
				text: _zone.name + " - Droite vue extérieur",
				offsetY: -25,
				fill: new ol.style.Fill({
					color: '#fff'
				})
			})
		})
	]);
	map.addInteraction(new ol.interaction.Modify({
		features: new ol.Collection([Droit]),
		style: null
	}));
	Droit.on('change',function(){
		var coord = this.getGeometry().getCoordinates();
		coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
		DroitLatLng.lat= coord[1];
		DroitLatLng.lng= coord[0];
		$('.AngleDroite').text(getAngle(CentreLatLng,DroitLatLng));
		$('.eqLogicAttr[data-l1key=configuration][data-l2key=Droite]').val(JSON.stringify(DroitLatLng));
		PolylineDroite.setCoordinates([[[CentreLatLng.lng,CentreLatLng.lat], [DroitLatLng.lng,DroitLatLng.lat]]]);
		PolylineDroite.transform('EPSG:4326', 'EPSG:3857');
	},Droit);
	features.push(Droit);
	var Centre = new ol.Feature({
		geometry: new ol.geom.Point(ol.proj.transform([CentreLatLng.lng,CentreLatLng.lat], 'EPSG:4326', 'EPSG:3857'))
	});
	map.addInteraction(new ol.interaction.Modify({
		features: new ol.Collection([Centre]),
		style: null
	}));
	Centre.on('change',function(){
		var coord = this.getGeometry().getCoordinates();
		coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
		CentreLatLng.lat= coord[1];
		CentreLatLng.lng= coord[0];
		$('.AngleDroite').text(getAngle(CentreLatLng,DroitLatLng));
		$('.AngleGauche').text(getAngle(CentreLatLng,GaucheLatLng));
		$('.eqLogicAttr[data-l1key=configuration][data-l2key=Centre]').val(JSON.stringify(CentreLatLng));
		PolylineDroite.setCoordinates([[[CentreLatLng.lng,CentreLatLng.lat], [DroitLatLng.lng,DroitLatLng.lat]]]);
		PolylineDroite.transform('EPSG:4326', 'EPSG:3857');
		PolylineGauche.setCoordinates([[[CentreLatLng.lng,CentreLatLng.lat], [GaucheLatLng.lng,GaucheLatLng.lat]]]);
		PolylineGauche.transform('EPSG:4326', 'EPSG:3857');
	},Centre);
	features.push(Centre);
	var Gauche = new ol.Feature({
		geometry: new ol.geom.Point(ol.proj.transform([GaucheLatLng.lng,GaucheLatLng.lat], 'EPSG:4326', 'EPSG:3857')),
		style: new ol.style.Style({text:new ol.style.Text({text: _zone.name + " - Gauche vue extérieur"})})
	});
	Gauche.setStyle([
		new ol.style.Style({  
			image: new ol.style.Circle({
     				radius: 5,
        			stroke: new ol.style.Stroke({
          				color: '#000'
				}),
				fill: new ol.style.Fill({
					color: 'rgba(255,255,255,0.4)'
				}),
      			}),
			text: new ol.style.Text({
				text: _zone.name + " - Gauche vue extérieur",
				offsetY: -25,
				fill: new ol.style.Fill({
					color: '#fff'
				})
			})
		})
	]);
	map.addInteraction(new ol.interaction.Modify({
		features: new ol.Collection([Gauche]),
		style: null
	}));
	Gauche.on('change',function(){
		var coord = this.getGeometry().getCoordinates();
		coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
		GaucheLatLng.lat= coord[1];
		GaucheLatLng.lng= coord[0];
		$('.AngleGauche').text(getAngle(CentreLatLng,GaucheLatLng));
		$('.eqLogicAttr[data-l1key=configuration][data-l2key=Gauche]').val(JSON.stringify(GaucheLatLng));
		PolylineGauche.setCoordinates([[[CentreLatLng.lng,CentreLatLng.lat], [GaucheLatLng.lng,GaucheLatLng.lat]]]);
		PolylineGauche.transform('EPSG:4326', 'EPSG:3857');
	},Gauche);
	features.push(Gauche);
	var vectorLayer = new ol.layer.Vector({
		source: new ol.source.Vector({
			features: features 
		})
	});
	map.addLayer(vectorLayer);
	map.getView().fit(vectorLayer.getSource().getExtent(), map.getSize());
}
function addCondition(_condition,_el) {
	var tr = $('<tr class="ConditionGroup">')
		.append($('<td>')
			.append($('<input type="checkbox" class="expressionAttr" data-l1key="enable"/>')))
		.append($('<td>')
			.append($('<div class="input-group">')
				.append($('<span class="input-group-btn">')
					.append($('<a class="btn btn-default conditionAttr btn-sm" data-action="remove">')
						.append($('<i class="fa fa-minus-circle">'))))
				.append($('<input class="expressionAttr form-control input-sm cmdCondition" data-l1key="expression"/>'))
				.append($('<span class="input-group-btn">')
					.append($('<a class="btn btn-warning btn-sm listCmdCondition">')
						.append($('<i class="fa fa-list-alt">'))))))
		.append($('<td>')
			.append($('<select class="expressionAttr form-control input-sm cmdCondition" data-l1key="TypeGestion" />')
			       .append($('<option value="all">')
					.text('{{Position du soleil et Jour / Nuit}}'))
			       .append($('<option value="Helioptrope">')
					.text('{{Position du soleil}}'))
			       .append($('<option value="DayNight">')
					.text('{{Jour / Nuit}}'))
			       .append($('<option value="Day">')
					.text('{{Jour}}'))
			       .append($('<option value="Night">')
					.text('{{Nuit}}')))
			.append($('<select class="expressionAttr form-control input-sm cmdCondition" data-l1key="saison" />')
			       .append($('<option value="all">')
					.text('{{Toutes les saisons}}'))
			       .append($('<option value="été">')
					.text('{{Eté}}'))
			       .append($('<option value="hiver">')
					.text('{{Hivers}}')))
			.append($('<select class="expressionAttr form-control input-sm cmdCondition" data-l1key="evaluation" />')
			       .append($('<option value="all">')
					.text('{{Ouverture et Fermeture}}'))
			       .append($('<option value="close">')
					.text('{{Fermeture}}'))
			       .append($('<option value="open">')
					.text('{{Ouverture}}')))
			.append($('<select class="expressionAttr form-control input-sm cmdCondition" data-l1key="controle" />')
			       .append($('<option value="No">')
					.text('{{Condition normale}}'))
			       .append($('<option value="Yes">')
					.text('{{Condition vérifiée à l\'inverse si soleil dans fenêtre. Permet d\'ouvrir le volet l\'été et le fermer l\'hiver}}'))))	
		.append($('<td>'));

        _el.append(tr);
        _el.find('tr:last').setValues(_condition, '.expressionAttr');
  
}
function addAction(_action,  _el) {
	var tr = $('<tr class="ActionGroup">');
	tr.append($('<td>')
		.append($('<input type="checkbox" class="expressionAttr" data-l1key="enable"/>')));		
	tr.append($('<td>')
		.append($('<div class="input-group">')
			.append($('<span class="input-group-btn">')
				.append($('<a class="btn btn-default ActionAttr btn-sm" data-action="remove">')
					.append($('<i class="fa fa-minus-circle">'))))
			.append($('<input class="expressionAttr form-control input-sm cmdAction" data-l1key="cmd"/>'))
			.append($('<span class="input-group-btn">')
				.append($('<a class="btn btn-success btn-sm listAction" title="Sélectionner un mot-clé">')
					.append($('<i class="fa fa-tasks">')))
				.append($('<a class="btn btn-success btn-sm listCmdAction">')
					.append($('<i class="fa fa-list-alt">'))))));
	tr.append($('<td>')
	       .append($(jeedom.cmd.displayActionOption(init(_action.cmd, ''), _action.options))));
	tr.append($('<td>')
		.append($('<select class="expressionAttr form-control input-sm cmdAction" data-l1key="TypeGestion" />')
		       .append($('<option value="all">')
				.text('{{Position du soleil et Jour / Nuit}}'))
		       .append($('<option value="Helioptrope">')
				.text('{{Position du soleil}}'))
		       .append($('<option value="DayNight">')
				.text('{{Jour / Nuit}}'))
		       .append($('<option value="Day">')
				.text('{{Jour}}'))
		       .append($('<option value="Night">')
				.text('{{Nuit}}')))
		.append($('<select class="expressionAttr form-control input-sm cmdAction" data-l1key="saison" />')
		       .append($('<option value="all">')
				.text('{{Toutes les saisons}}'))
		       .append($('<option value="été">')
				.text('{{Eté}}'))
		       .append($('<option value="hiver">')
				.text('{{Hivers}}')))
		.append($('<select class="expressionAttr form-control input-sm cmdAction" data-l1key="evaluation" />')
		       .append($('<option value="all">')
				.text('{{Ouverture et Fermeture}}'))
		       .append($('<option value="close">')
				.text('{{Fermeture}}'))
		       .append($('<option value="open">')
				.text('{{Ouverture}}'))));

        _el.append(tr);
        _el.find('tr:last').setValues(_action, '.expressionAttr');
  
}
$('#tab_zones a').click(function(e) {
    e.preventDefault();
    $(this).tab('show');
});
$('body').on('focusout','.expressionAttr[data-l1key=cmd]', function (event) {
    var expression = $(this).closest('.ActionGroup').getValues('.expressionAttr');
    var el = $(this);
    jeedom.cmd.displayActionOption($(this).value(), init(expression[0].options), function (html) {
        el.closest('.ActionGroup').find('.actionOptions').html(html);
    })
});
$('body').on('click','.conditionAttr[data-action=add]',function(){
	addCondition({},$(this).closest('.tab-pane').find('table'));
});
$('body').on('click','.conditionAttr[data-action=remove]',function(){
	$(this).closest('tr').remove();
});
$('body').on('click','.listCmdCondition',function(){
	var el = $(this).closest('tr').find('.expressionAttr[data-l1key=expression]');	
	jeedom.cmd.getSelectModal({cmd: {type: 'info'}}, function (result) {
		var message = 'Aucun choix possible';
		if(result.cmd.subType == 'numeric'){
			message = '<div class="row">  ' +
			'<div class="col-md-12"> ' +
			'<form class="form-horizontal" onsubmit="return false;"> ' +
			'<div class="form-group"> ' +
			'<label class="col-xs-5 control-label" >'+result.human+' {{est}}</label>' +
			'             <div class="col-xs-3">' +
			'                <select class="conditionAttr form-control" data-l1key="operator">' +
			'                    <option value="==">{{égal}}</option>' +
			'                  <option value=">">{{supérieur}}</option>' +
			'                  <option value="<">{{inférieur}}</option>' +
			'                 <option value="!=">{{différent}}</option>' +
			'            </select>' +
			'       </div>' +
			'      <div class="col-xs-4">' +
			'         <input type="number" class="conditionAttr form-control" data-l1key="operande" />' +
			'    </div>' +
			'</div>' +
			'<div class="form-group"> ' +
			'<label class="col-xs-5 control-label" >{{Ensuite}}</label>' +
			'             <div class="col-xs-3">' +
			'                <select class="conditionAttr form-control" data-l1key="next">' +
			'                    <option value="">rien</option>' +
			'                  <option value="OU">{{ou}}</option>' +
			'            </select>' +
			'       </div>' +
			'</div>' +
			'</div> </div>' +
			'</form> </div>  </div>';
		}
		if(result.cmd.subType == 'string'){
			message = '<div class="row">  ' +
			'<div class="col-md-12"> ' +
			'<form class="form-horizontal" onsubmit="return false;"> ' +
			'<div class="form-group"> ' +
			'<label class="col-xs-5 control-label" >'+result.human+' {{est}}</label>' +
			'             <div class="col-xs-3">' +
			'                <select class="conditionAttr form-control" data-l1key="operator">' +
			'                    <option value="==">{{égale}}</option>' +
			'                  <option value="matches">{{contient}}</option>' +
			'                 <option value="!=">{{différent}}</option>' +
			'            </select>' +
			'       </div>' +
			'      <div class="col-xs-4">' +
			'         <input class="conditionAttr form-control" data-l1key="operande" />' +
			'    </div>' +
			'</div>' +
			'<div class="form-group"> ' +
			'<label class="col-xs-5 control-label" >{{Ensuite}}</label>' +
			'             <div class="col-xs-3">' +
			'                <select class="conditionAttr form-control" data-l1key="next">' +
			'                    <option value="">{{rien}}</option>' +
			'                  <option value="OU">{{ou}}</option>' +
			'            </select>' +
			'       </div>' +
			'</div>' +
			'</div> </div>' +
			'</form> </div>  </div>';
		}
		if(result.cmd.subType == 'binary'){
			message = '<div class="row">  ' +
			'<div class="col-md-12"> ' +
			'<form class="form-horizontal" onsubmit="return false;"> ' +
			'<div class="form-group"> ' +
			'<label class="col-xs-5 control-label" >'+result.human+' {{est}}</label>' +
			'            <div class="col-xs-7">' +
			'                 <input class="conditionAttr" data-l1key="operator" value="==" style="display : none;" />' +
			'                  <select class="conditionAttr form-control" data-l1key="operande">' +
			'                       <option value="1">{{Ouvert}}</option>' +
			'                       <option value="0">{{Fermé}}</option>' +
			'                       <option value="1">{{Allumé}}</option>' +
			'                       <option value="0">{{Éteint}}</option>' +
			'                       <option value="1">{{Déclenché}}</option>' +
			'                       <option value="0">{{Au repos}}</option>' +
			'                       </select>' +
			'                    </div>' +
			'                 </div>' +
			'<div class="form-group"> ' +
			'<label class="col-xs-5 control-label" >{{Ensuite}}</label>' +
			'             <div class="col-xs-3">' +
			'                <select class="conditionAttr form-control" data-l1key="next">' +
			'                  <option value="">{{rien}}</option>' +
			'                  <option value="OU">{{ou}}</option>' +
			'            </select>' +
			'       </div>' +
			'</div>' +
			'</div> </div>' +
			'</form> </div>  </div>';
		}

		bootbox.dialog({
			title: "{{Ajout d'une nouvelle condition}}",
			message: message,
			buttons: {
				"Ne rien mettre": {
					className: "btn-default",
					callback: function () {
						el.atCaret('insert', result.human);
					}
				},
				success: {
					label: "Valider",
					className: "btn-primary",
					callback: function () {
    						var condition = result.human;
						condition += ' ' + $('.conditionAttr[data-l1key=operator]').value();
						if(result.cmd.subType == 'string'){
							if($('.conditionAttr[data-l1key=operator]').value() == 'matches'){
								condition += ' "/' + $('.conditionAttr[data-l1key=operande]').value()+'/"';
							}else{
								condition += ' "' + $('.conditionAttr[data-l1key=operande]').value()+'"';
							}
						}else{
							condition += ' ' + $('.conditionAttr[data-l1key=operande]').value();
						}
						condition += ' ' + $('.conditionAttr[data-l1key=next]').value()+' ';
						el.atCaret('insert', condition);
						if($('.conditionAttr[data-l1key=next]').value() != ''){
							el.click();
						}
					}
				},
			}
		});
	});
});
$('body').on('click','.ActionAttr[data-action=add]',function(){
	addAction({},$(this).closest('.tab-pane').find('table'));
});
$('body').on('click','.ActionAttr[data-action=remove]', function () {
	$(this).closest('.ActionGroup').remove();
});
$("body").on('click', ".listAction", function() {
	var el = $(this).closest('td').find('.expressionAttr[data-l1key=cmd]');
	jeedom.getSelectActionModal({}, function (result) {
		el.value(result.human);
		jeedom.cmd.displayActionOption(el.value(), '', function (html) {
			el.closest('.form-group').find('.actionOptions').html(html);
		});
	});
}); 
$("body").on('click', ".listCmdAction", function() {
	var el = $(this).closest('td').find('.expressionAttr[data-l1key=cmd]');
	jeedom.cmd.getSelectModal({cmd: {type: 'action'}}, function (result) {
		el.value(result.human);
		jeedom.cmd.displayActionOption(el.value(), '', function (html) {
			el.closest('.form-group').find('.actionOptions').html(html);
		});
	});
});
function addCmdToTable(_cmd) {
	var tr =$('<tr class="cmd" data-cmd_id="' + init(_cmd.id) + '">');
	tr.append($('<td>')
		.append($('<input type="hidden" class="cmdAttr form-control input-sm" data-l1key="id">'))
		.append($('<input class="cmdAttr form-control input-sm" data-l1key="name" value="' + init(_cmd.name) + '" placeholder="{{Name}}" title="Name">')));
	var parmetre=$('<td>');	
	parmetre.append($('<span class="type" type="' + init(_cmd.type) + '">')
			.append(jeedom.cmd.availableType()));
	parmetre.append($('<span class="subType" subType="'+init(_cmd.subType)+'">'));
	if (is_numeric(_cmd.id)) {
		parmetre.append($('<a class="btn btn-default btn-xs cmdAction" data-action="test">')
			.append($('<i class="fa fa-rss">')
				.text('{{Tester}}')));
	}
	parmetre.append($('<a class="btn btn-default btn-xs cmdAction tooltips" data-action="configure">')
		.append($('<i class="fa fa-cogs">')));
	parmetre.append($('<div>')
		.append($('<span>')
			.append($('<label class="checkbox-inline">')
				.append($('<input type="checkbox" class="cmdAttr checkbox-inline" data-size="mini" data-label-text="{{Historiser}}" data-l1key="isHistorized" checked/>'))
				.append('{{Historiser}}')
				.append($('<sup>')
					.append($('<i class="fa fa-question-circle tooltips" style="font-size : 1em;color:grey;">')
					.attr('title','Souhaitez vous Historiser les changements de valeur'))))));
	parmetre.append($('<div>')
		.append($('<span>')
			.append($('<label class="checkbox-inline">')
				.append($('<input type="checkbox" class="cmdAttr checkbox-inline" data-size="mini" data-label-text="{{Afficher}}" data-l1key="isVisible" checked/>'))
				.append('{{Afficher}}')
				.append($('<sup>')
					.append($('<i class="fa fa-question-circle tooltips" style="font-size : 1em;color:grey;">')
					.attr('title','Souhaitez vous afficher cette commande sur le dashboard'))))));
	tr.append(parmetre);
	$('#table_cmd tbody').append(tr);
	$('#table_cmd tbody tr:last').setValues(_cmd, '.cmdAttr');
	jeedom.cmd.changeType($('#table_cmd tbody tr:last'), init(_cmd.subType));
}
function getAngle(Origine, Destination) { 
	var rlongitudeOrigine = Math.radians(Origine.lng); 
	var rlatitudeOrigine = Math.radians(Origine.lat); 
	var rlongitudeDest = Math.radians(Destination.lng); 
	var rlatitudeDest = Math.radians(Destination.lat); 
	var longDelta = rlongitudeDest - rlongitudeOrigine; 
	var y = Math.sin(longDelta) * Math.cos(rlatitudeDest); 
	var x = (Math.cos(rlatitudeOrigine)*Math.sin(rlatitudeDest)) - (Math.sin(rlatitudeOrigine)*Math.cos(rlatitudeDest)*Math.cos(longDelta)); 
	var angle = Math.degrees(Math.atan2(y, x)); 
	if (angle < 0) { 

		angle += 360; 
	}
	return Math.round(angle % 360);
}
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};
