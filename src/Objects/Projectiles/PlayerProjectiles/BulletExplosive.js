import Projectile from "../Projectile.js";
import Enemy from "../../../Enemies/Enemy.js";
import SuperiorQuery from "../../../SuperiorQuery.js";
import Audio from "../../../Audio.js";

//proyectil que hereda de Projectile
export default class BulletExplosive extends Projectile {
  constructor(scene, x, y, spr, dmg, knockback, speed, velDirection, expTime, target, distanceToPlayer){
    super(scene, x, y,  expTime);
    //inicializacion
    this.sprite = scene.add.sprite(x,y,"bullets",spr);
    this.sprite.setScale(0.85);
    this.target = target;
    this.dmg = dmg;
    this.knockback = knockback;

    const xAux = this.sprite.x;
    const yAux = this.sprite.y;

    //se calcula la direccion y magnitud del vector de velocidad
    this.pVelocity = new Phaser.Math.Vector2(velDirection.x, velDirection.y);
    this.pVelocity.scale(speed / this.scene.matter.world.getDelta());

    this.distAcumulator = distanceToPlayer;
    //si el "target" del proyectil es un enemigo se invoca una funcion especial
    if(this.target.collided && this.target.colSpecialObj != undefined && Object.getPrototypeOf(this.target.colSpecialObj.constructor) === Enemy)
      this.prepareBullet(this.target.colSpecialObj.currentBodyIndex, x, y, this.scene.input.activePointer.x + this.scene.cameras.main.scrollX, this.scene.input.activePointer.y + this.scene.cameras.main.scrollY , speed);

    this.sprite.setDepth(5);
    this.sprite.angle = this.pVelocity.angle() * 180/Math.PI;
    this.scene.events.on("update", this.update, this); //para que se ejecute el udate
  }

  //se para el update y si se trata de un enemigo, este recibe daño
  itemExpire(){
    this.scene.events.off("update", this.update, this);

    //AUDIO_BALAEXPLOSIVA
      Audio.play3Dinstance(this, 2);
    //

    const bombExplosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, "explosion");
    bombExplosion.setDepth(10) //42
    if(this.target.collided && this.target.colSpecialObj != undefined && Object.getPrototypeOf(this.target.colSpecialObj.constructor) === Enemy){
      this.target.colSpecialObj.damageAndKnock(this.dmg, this.knockback, this.pVelocity);

      if(this.target != undefined && this.target.colSpecialObj != undefined && this.target.colSpecialObj.sprite != undefined && this.target.colSpecialObj.sprite.body != undefined){
        bombExplosion.x += (this.target.colSpecialObj.sprite.body.velocity.x*8);
        bombExplosion.y += (this.target.colSpecialObj.sprite.body.velocity.y*8);
      }

      //AUDIO ENEMIGO DAÑADO
        Audio.play3DinstanceRnd(this,39);
      //
    }else{
      //AUDIO
        Audio.play3DinstanceRnd(this, 1);
      //
    }

    //al completar su animacion de explsion, dicha instancia se autodestruye
    bombExplosion.on('animationcomplete', function(){
      bombExplosion.destroy();
    });
    //animacion de explosion
    bombExplosion.anims.play('explosion', true);

    super.itemExpire();
  }

  //update (al no tratarse de un cuerpo fisico, las posiciones nuevas se calculan "a mano")
  update(time, delta){
    if(this.sprite != undefined){
      this.sprite.x += (this.pVelocity.x * delta);
      this.sprite.y += (this.pVelocity.y * delta);
    }
  }

  //funcion especial para balas dirigidas hacia enemigos que podrían morir antes de que estas lleguen
  prepareBullet(index, x, y, targetX, targetY, speed){
    //evento especial que espera a ver si el target desaparece y recalcula la nueva collision de la bala
    this.scene.events.once('noEnemy' + index, function(){
      if(this.sprite == undefined)return;
      var auxDir = new Phaser.Math.Vector2(this.pVelocity.x, this.pVelocity.y);
      auxDir.normalize();
      this.target = SuperiorQuery.superiorRayCast(x, y, auxDir, 14 ,this.scene.bulletInteracBodies);
      const bulletDistance = Math.sqrt(Math.pow(this.target.colX - this.sprite.x,2) + Math.pow(this.target.colY - this.sprite.y,2));
      this.expTime = Math.min(1000,(bulletDistance * this.scene.matter.world.getDelta())/speed);
      this.distAcumulator += bulletDistance;
      this.timer.reset({
        delay: this.expTime,
        callback: () => (this.itemExpire())
      });
    },this);
    //mejorar esto si las balas hacen mucho daño
  }
  //distancia al jugador
  distanceToPlayer(){
    if(this.distAcumulator == undefined)
      return Number.MAX_SAFE_INTEGER;
    else
      return this.distAcumulator;
  }
}
