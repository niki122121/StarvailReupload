import EnergyBallMecha from "../Objects/Projectiles/EnemyProjectiles/EnergyBallMecha.js"
import Audio from "../Audio.js";

//arma de mech
export default class MechGun {
  constructor(scene, x, y, dmg){
    //variables
    this.scene = scene;
    this.sprite = scene.add.image(x,y,'gun')
    this.sprite.angle = Phaser.Math.Between(-180,0);
    this.sprite.setScale(2.5).setOrigin(0.1,0.5).setDepth(-2);
    this.dmg = dmg;
    this.exists = true;

    this.aimVector = new Phaser.Math.Vector2(1,0);
  }
  //actualizar posicion
  followPosition(xPos, yPos){
    if(this.exists){
      this.sprite.x = xPos;
      this.sprite.y = yPos;
    }
  }
  //actualizar angulo
  aimGun(ang){
    if(this.exists){
      this.aimVector.x = Math.cos(ang);
      this.aimVector.y = Math.sin(ang);
      this.sprite.angle = ang * 180/Math.PI;
    }
  }
  //disparar
  shoot(){
    if(this.exists)
      new EnergyBallMecha(this.scene, this.sprite.x + this.aimVector.x*70, this.sprite.y + this.aimVector.y*70, this.dmg, 0.1, 15, this.aimVector, 2000);
  }
  //destruir arma
  destroy(){
    this.exists = false;
    this.sprite.destroy();
  }

  //distnacia al jugador
  distanceToPlayer(){
    if(this.sprite != undefined)
      return Math.sqrt(Math.pow(this.sprite.x - this.scene.game.player.sprite.x,2) + Math.pow(this.sprite.y - this.scene.game.player.sprite.y,2));
    else
      return 1000; 
  }
}
