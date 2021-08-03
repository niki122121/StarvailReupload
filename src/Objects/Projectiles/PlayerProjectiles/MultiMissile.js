import Projectile from "../Projectile.js";
import Bomb from "./Bomb.js";
import SuperiorQuery from "../../../SuperiorQuery.js";
import Audio from "../../../Audio.js";

//proyectil que hereda de Projectile
export default class MultiMissile extends Projectile {
  constructor(scene, x, y, spr, dmg, area, knockback, offsprings, offspringScale, speed, velDir, dir, expTime){
    super(scene, x, y, expTime);
    //inicializacion
    this.sprite = scene.matter.add.sprite(x,y,"bullets",spr);
    this.sprite.setScale(2.2,1.4);
    this.sprite.parent = this;
    this.dmg = dmg;
    this.area = area;
    this.knockback = knockback;
    this.offsprings = offsprings;
    this.offspringScale = offspringScale;
    this.initX = x;
    this.initY = y;

    this.sensor = Phaser.Physics.Matter.Matter.Bodies.circle(0,0,11);
    this.sensor.isSensor = true;

    this.sprite.setExistingBody(this.sensor).setPosition(x, y).setDepth(5);/*.setFriction(0).setFrictionStatic(0)*/
    this.sprite.angle = velDir.angle() * 180/Math.PI;
    //this.sprite.setAngularVelocity(0.2 * dir);
    this.sprite.body.collisionFilter.group = -2;
    //this.sprite.body.collisionFilter.category = 4;

    this.sprite.setIgnoreGravity(true);

    //se calcula la direccion y magnitud del vector de velocidad
    this.pVelocity = velDir;
    this.pVelocity = this.pVelocity.normalize().scale(speed);
    this.sprite.setVelocity(this.pVelocity.x , this.pVelocity.y);
    this.sprite.body.frictionAir = 0;

    this.sprite.body.restitution = 0.5;

    this.bombArmed1;
    //this.bombArmed2;

    //AUDIO
      this.sfx=Audio.play3Dinstance(this, 30);
      this.scene.events.on("update", this.update, this);
    //
  }

  //AUDIO
  update(time, delta){
    if(this.sprite!= undefined && this.sprite.body != undefined && Audio.waitForUpdate())
      this.sfx.volume=Audio.volume3D(this)
  }
  //

  //funciones de collision
  armBomb(){
    //this.sprite.body.collisionFilter.group = 0;
    this.bombArmed1 = this.scene.matterCollision.addOnCollideStart({
      objectA: this.sensor,
      callback: this.onSensorCollide,
      context: this
    });
  }

  //al collisionar con algo
  onSensorCollide({ bodyA, bodyB, pair }) {
    if(bodyB.isSensor ||  bodyB == undefined || bodyB.gameObject == undefined)return;

    this.reachedTarget(this, bodyB, pair);
  }

  reachedTarget(proj, bodyB, pair){
    if(this.sprite.body != undefined){
      this.bombArmed1();

      const bombExplosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, "explosion");
      bombExplosion.setDepth(10).setScale(this.area/15) //42
      this.damageEnemiesArea();

      //al completar su animacion de explsion, dicha instancia se autodestruye
      bombExplosion.on('animationcomplete', function(){
        bombExplosion.destroy();
      });
      //animacion de explosion
      bombExplosion.anims.play('explosion', true);

      const bombPreset = this.scene.game.player.weapons[4] //arma de bombas normales de player
      //que asco de collisiones..... tengo que usar un raycast mio proque matter no sabe como calcular collisones entre circulos y cubos.........
      var superiorColl = SuperiorQuery.superiorRayCastMisile(this.initX, this.initY, this.pVelocity, this.scene.bulletInteracBodies);
      if(superiorColl.body != undefined){
        const vertices = superiorColl.body.parts[superiorColl.part].vertices;
        const currentVertex = vertices[superiorColl.vertex];
        const nextVertex = vertices[(superiorColl.vertex+1) % vertices.length];
        var normalVector = new Phaser.Math.Vector2(nextVertex.y - currentVertex.y, currentVertex.x - nextVertex.x );

        const angleChangeRate = Math.PI/(2*(this.offsprings+1));
        var angle = normalVector.angle() + 0.25*Math.PI - angleChangeRate;

        var offspring;
        for(var i=0; i<this.offsprings; i++){
          const angleVector = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle))
          offspring = new Bomb(this.scene, this.sprite.x, this.sprite.y, bombPreset.wSprite, bombPreset.damage * this.offspringScale, bombPreset.area * this.offspringScale, bombPreset.knockback * this.offspringScale, Phaser.Math.FloatBetween(5, 10), angleVector, (angleVector.x < 0)?-1:1, Phaser.Math.FloatBetween(1750, 2250),true);
          offspring.sprite.setScale(this.offspringScale);
          offspring.delayArmBomb(300);
          angle -= angleChangeRate;
        }
        offspring = undefined;
      }
      else{
        for(var i=0; i<this.offsprings; i++){
          offspring = new Bomb(this.scene, this.sprite.x, this.sprite.y, bombPreset.wSprite, bombPreset.damage * this.offspringScale, bombPreset.area * this.offspringScale, bombPreset.knockback * this.offspringScale, 0, new Phaser.Math.Vector2(1, 1), 1, 2000,true);
          offspring.sprite.setScale(this.offspringScale);
          offspring.delayArmBomb(300);
        }
      }
      this.itemExpire();
    }
  }

  itemExpire(){
    this.scene.events.off("update", this.update, this);
      //AUDIO
        Audio.play3DinstanceRnd(this,17);
        this.sfx.volume= 0.0;
      //
    this.sensor = undefined;
    super.itemExpire();

    this.pVelocity = undefined;
    this.bombArmed1 = undefined;
    this.sfx = undefined;
    this.scene = undefined
  }

  damageEnemiesArea(){
    var damagedEnemies = SuperiorQuery.superiorRegion(this.sprite.x, this.sprite.y, this.area, this.scene.enemyController.enemyBodies);
    if(damagedEnemies.length > 0){/*AUDIO ENEMIGO DAÑADO*/}
    for(var i in damagedEnemies){
      if(damagedEnemies[i] != undefined && damagedEnemies[i].gameObject != null)
        damagedEnemies[i].gameObject.parent.damageAndKnock(this.dmg, this.knockback, new Phaser.Math.Vector2(damagedEnemies[i].gameObject.x - this.sprite.x, damagedEnemies[i].gameObject.y - this.sprite.y));
    }
  }

  //distancia al jugador
  distanceToPlayer(){
    if(this.sprite == undefined || this.sprite.body == undefined || this.scene.game.player == undefined || this.scene.game.player.sprite == undefined  || this.scene.game.player.sprite.body == undefined)
      return Number.MAX_SAFE_INTEGER;
    const distance = Math.sqrt(Math.pow(this.sprite.x - this.scene.game.player.sprite.x,2) + Math.pow(this.sprite.y - this.scene.game.player.sprite.y,2));
    if(distance == undefined)
      return Number.MAX_SAFE_INTEGER;
    else
      return Math.sqrt(Math.pow(this.sprite.x - this.scene.game.player.sprite.x,2) + Math.pow(this.sprite.y - this.scene.game.player.sprite.y,2));
  }
}
