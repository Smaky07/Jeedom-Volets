<?php
require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';

class Volets extends eqLogic {
	public static function pull($_option) {
		$Volet = Volets::byId($_option['Volets_id']);
		//log::add('Volets', 'debug', 'Objet mis à jour => ' . $_option['event_id'] . ' / ' . $_option['value']);
		if (is_object($Volet) && $Volet->getIsEnable() == 1) {
			foreach($Volet->getCmd() as $Commande)
				$Commande->execute();
		}
	}
  	public function preUpdate() {
    	}  
   	public function preInsert() {
	}    
    	public function postSave() {
		log::add('Volets', 'info', 'Activation des déclencheurs : ');
		$listener = listener::byClassAndFunction('Volets', 'pull', array('Volets_id' => intval($this->getId())));
		if (!is_object($listener)) {
		    $listener = new listener();
		}
		$listener->setClass('Volets');
		$listener->setFunction('pull');
		$listener->setOption(array('Volets_id' => intval($this->getId())));
		$listener->emptyEvent();
		
		$heliotrope=eqlogic::byId($this->getConfiguration('heliotrope'));
		if(is_object($heliotrope))
			$listener->addEvent($heliotrope->getCmd(null,'azimuth360'));
		$listener->save();		
	}	
}

class VoletsCmd extends cmd {
	public function getAngle($latitudeOrigine,$longitudeOrigne, $latitudeDest,$longitudeDest) {
		/*double longDelta = longitudeDest - longitudeOrigne;
		double y = Math.sin(longDelta) * Math.cos(latitudeDest);
		double x = Math.cos(latitudeOrigine)*Math.sin(latitudeDest) -Math.sin(latitudeOrigine)*Math.cos(latitudeDest)*Math.cos(longDelta);
		double angle = Math.toDegrees(Math.atan2(y, x));
		while (angle < 0) {
			angle += 360;
		}
		return (float) angle % 360;*/
		$longDelta = $longitudeDest - $longitudeOrigne;
		$y = sin($longDelta) * cos($latitudeDest);
		$x = cos($latitudeOrigine)*sin($latitudeDest) - sin($latitudeOrigine)*cos($latitudeDest)*cos($longDelta);
		$angle = rad2deg(atan2($y, $x));
		while ($angle < 0) {
			$angle += 360;
		}
		return  $angle % 360;
	}
    public function execute($_options = null) {
	    
		//Rechercher position du soleil => heliotrope
		$heliotrope=eqlogic::byId($this->getEqLogic()->getConfiguration('heliotrope'));
		if(is_object($heliotrope)){
			$Azimuth=$heliotrope->getCmd(null,'azimuth360')->execCmd();
			log::add('Volets','debug','L\'angle du soleil est '.$Azimuth.'°');
			//Calculer de l'angle de ma zone
			$Coord=json_decode($this->getLogicalId(),true);
			
			$Angle=$this->getAngle($Coord['Center']['lat'],
					       $Coord['Center']['lng'],
					       $Coord['Position']['lat'],
					       $Coord['Position']['lng']);
			log::add('Volets','debug','L\'angle de votre zone '.$this->getName().' par rapport au Nord est de '.$Angle.'°');
			//si l'Azimuth est compris entre mon angle et 180° on est dans la fenetre
			if($Azimuth>$Angle&&$Azimuth>$Angle-180)
				$action=json_decode($this->getConfiguration('action'),true)['in'];
			else
				$action=json_decode($this->getConfiguration('action'),true)['out'];
			foreach($action as $cmd)
				cmd::byId($cmd['cmd'])->execute($cmd['option']);
		}
    }
}
?>
