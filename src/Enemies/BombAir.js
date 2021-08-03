import Enemy from "./Enemy.js";
import DropableAirEnergy from "../Objects/Dropables/DropableAirEnergy.js"
import DropableAirHealth from "../Objects/Dropables/DropableAirHealth.js"
import Audio from "../Audio.js";
import TileController from "../TileController.js"

//enemigo que hereda de Enemy
export default class BombAir extends Enemy {
  constructor(scene, x, y){
    super(scene, x, y, 'bomb', 50);
    //inicialización de variables
    this.sprite.setScale(1.65);

    //array de "scraps", pedazos que vuelan cuando muere
    if(this.scene.game.onPC){
      this.scrapArray[0] = 'bombScrap1';
      this.scrapArray[1] = 'bombScrap2';
    }

    //cuerpo de del enemigo que se añade al sprite y a los arrays de enemigos correspondientes
    const { Body, Bodies } = Phaser.Physics.Matter.Matter;
    const body = Phaser.Physics.Matter.Matter.Bodies.rectangle(0, 0, 25, 25, {chamfer: { radius: 8 } });

    this.sprite.setExistingBody(body).setPosition(x, y).setFixedRotation();
    this.scene.bulletInteracBodies[this.currentBodyIndex] = body;
    this.scene.enemyController.enemyBodies[this.currentEnemyIndex] = body;
    this.sprite.body.collisionFilter.group = -3;

    //variables de físicas
    this.sprite.setIgnoreGravity(true);
    this.sprite.body.frictionAir = 0.06;
    this.sprite.body.friction = 0;

    this.adjustedFriction = this.sprite.body.frictionAir / this.scene.matter.world.getDelta();

    //Variables de IA
    this.patrolDir = new Phaser.Math.Vector2(0,0);
    this.standByReDistance = 950;
    this.patrolDistance = 900;
    this.initPos = new Phaser.Math.Vector2(this.sprite.x, this.sprite.y);
    this.stopper = false;
    this.playerVector = new Phaser.Math.Vector2(0, 0);

    //Ajustar estas
    this.points = 75;               //puntos al matar a enemigo
    this.patrolRouteLength = 100;  //al patrullar cuanto se desplaza antes de darse la vuelta
    this.patrolSpeed = 2;                                             //velocidad al patrullar
    this.detectDistance = 400;                                        //distancia a la uqe detecta el jugador cuando esta patrullando
    this.detectSpeed = 4/this.scene.matter.world.getDelta();        //velocidad al detectarlo
    this.hitDistance = 50;                                            //distancia de la cual se pone a golpear
    this.hitSpeed = 0.5/this.scene.matter.world.getDelta();           //pequeña velocidad mientras está golpeando
    this.hitDamage = 150;                                              //daño al golpear
    this.healthDrop = 100;
    this.energyDrop = 200;                                             //drop de energia
    //Ajustar estas

    //IA
    //se preparan el nº de estados que tiene la FSM, que hace cuando empieza, acaba y update de cada estado
    this.initializeAI(4);
    //se paran todos los procesos del enemigo
    this.stateOnStart(0, function(){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.sprite.anims.stop();
      this.sprite.setVelocityX(0);
      this.sprite.setVelocityY(0);
      this.sprite.body.frictionAir = 10;
      TileController.disableEnemy(this.sprite);
    })
    this.stateOnEnd(0,function(){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      TileController.enableEnemy(this.sprite);
    })

    //modo patrulla
    this.stateOnStart(1, function(){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.sprite.body.frictionAir = 0.06;
      this.stopper = false;
      this.distanceToCheck= Math.sqrt( Math.pow(this.initPos.x - this.sprite.x,2) +  Math.pow(this.initPos.y - this.sprite.y,2));
      this.velX = Phaser.Math.FloatBetween(this.patrolSpeed/2, this.patrolSpeed);
      this.velY = Phaser.Math.FloatBetween(this.patrolSpeed/2, this.patrolSpeed);
      if(this.distanceToCheck < this.patrolRouteLength){
        this.patrolDir.x = (Math.random()<0.5)?-1:1;
        this.patrolDir.y = (Math.random()<0.5)?-1:1;
      }
      else{
        this.patrolDir.x = Math.sign(this.initPos.x - this.sprite.x);
        this.patrolDir.y = Math.sign(this.initPos.y - this.sprite.y);
      }

      this.sprite.anims.stop();

      this.patrolTimer1 = this.scene.time.addEvent({
        delay: 3000,
        callback: () => (this.resetState())
      },this);
      this.patrolTimer2 = this.scene.time.addEvent({
        delay: 1000,
        callback: () => (this.stopper = true)
      },this);
    });
    this.stateUpdate(1, function(time, delta){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      if(!this.stopper){
        this.sprite.setVelocityX(this.velX * this.patrolDir.x);
        this.sprite.setVelocityY(this.velY * this.patrolDir.y);
      }
      this.sprite.setFlipX(this.sprite.body.velocity.x<0);
    })
    this.stateOnEnd(1, function(){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.patrolTimer1.remove();
      this.patrolTimer2.remove();
    });

    //modo persecución
    this.stateOnStart(2, function(){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.sprite.anims.play('bombHoming', true);
    });
    this.stateUpdate(2, function(time, delta){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.sprite.setFlipX(this.scene.game.player.sprite.x<this.sprite.x);
      this.playerVector.x = this.scene.game.player.sprite.x - this.sprite.x;
      this.playerVector.y = this.scene.game.player.sprite.y - this.sprite.y;
      this.distanceToCheck = Math.sqrt( Math.pow(this.playerVector.x ,2) +  Math.pow(this.playerVector.y,2));
      if(this.distanceToCheck > this.hitDistance){
        this.sprite.setVelocityX((this.playerVector.x) *this.detectSpeed/this.distanceToCheck * delta);
        this.sprite.setVelocityY((this.playerVector.y) *this.detectSpeed/this.distanceToCheck * delta);
        //console.log("persuing");
      }else{
        this.targetDir = this.scene.game.player.sprite.x<this.sprite.x;
        this.sprite.setFlipX(this.targetDir);
        this.goTo(3);
      }
    })

    //modo ataque
    this.stateOnStart(3, function(){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.sprite.setFlipX(this.targetDir);
      this.inflictDamagePlayerArea();
      this.enemyDead(0,0, false, true);
    });
    this.startAI();
    //IA

    //AUDIO
      this.sfx=Audio.play3DenemyInstance(this, 42);
      this.sfxDetect=Audio.play2Dinstance(54);
      this.stateChanged=false;
    //
  }

  //método para filtrado de collisiones con el tileado del mapa
  updateTouchBoundry(){
    if(this.sprite != undefined){
      if(this.currentStateId() > 0){
        TileController.enemyFullTouchBoundry(this.scene, this.sprite, 1, 1);
      }
    }
  }

  onSensorCollide({ bodyA, bodyB, pair }){
    if (bodyB.isSensor) return;
    if (bodyA === this.sensors.right || bodyA === this.sensors.left)
      this.patrolDir.x = -this.patrolDir.x;
    else if (bodyA === this.sensors.top || bodyA === this.sensors.bottom)
      this.patrolDir.y = -this.patrolDir.y;
  }

  //método para infligir daño al jugador
  inflictDamagePlayerArea(position){
    if(this.sprite == undefined || this.sprite.body == undefined)return;
    if(super.playerHit(this.sprite.x-100, this.sprite.y-100, this.sprite.x+100, this.sprite.y+100))
      this.scene.game.player.playerDamage(this.hitDamage);
  }

  //método que se invoca al recibir daño
  damage(dmg, v){
      //AUDIO
        if(Math.random()>0.4){
          var auxSfx=Audio.play3DinstanceRnd(this,45);
        }else{
         var auxSfx=Audio.play3DinstanceRnd(this,44);
        }
          auxSfx.setDetune(auxSfx.detune+50);
      //
    if(this.currentStateId() == 1){
      //AUDIO
        this.soundChangeState();
      //
      this.goTo( 2);
    }else if(this.currentStateId() != 0)
      super.damage(dmg, v);
  }

  //método que se invoca al recibir daño con el laser
  damageLaser(dmg, v){
    //AUDIO
      Audio.lasserSufferingLoop.setDetune(-150);
    //
    if(this.currentStateId() == 1){
      //AUDIO
        this.soundChangeState();
      //
      this.goTo(2);
    }else if(this.currentStateId() != 0)
      super.damageLaser(dmg, v);
  }

  //método que se invoca al morir el enemigo
  enemyDead(vXDmg, vYDmg, drop = true, kamikaze = false){
    this.goTo(0);
    if(!this.dead){
      //AUDIO
          Audio.play3DinstanceRnd(this, 52);
          Audio.play3DinstanceRnd(this, 64);
          this.sfx.stop();
          this.sfxDetect.stop();
      //
      //explosion al morir
      let explosion = this.scene.add.sprite(this.sprite.x, this.sprite.y, "enemyExplosion");
      explosion.setDepth(10);
      if(kamikaze) {
        explosion.setScale(4);
      } else {
        explosion.setScale(2);
      }
      //al completar su animacion de explsion, dicha instancia se autodestruye
      explosion.on('animationcomplete', function(){
        explosion.destroy();
      });
      //animacion de explosion
      explosion.anims.play('enemyExplosion', true);
      super.enemyDead(!kamikaze);
      //drops de energía y vida
      if(drop) {
        if(Math.random() < 0.3){
          new DropableAirHealth(this.scene, this.sprite.x, this.sprite.y, (this.scene.game.player.sprite.x - this.sprite.x), (this.scene.game.player.sprite.y - this.sprite.y), this.healthDrop);
          }
        new DropableAirEnergy(this.scene, this.sprite.x, this.sprite.y, (this.scene.game.player.sprite.x - this.sprite.x), (this.scene.game.player.sprite.y - this.sprite.y),  this.energyDrop);
      }
    }
  }

  //método llamado desde Blackboard.js para ajustar la distancia con el jugador
  updatePlayerPosition(dist){
    switch (this.currentStateId()) {
      case 0:
        if(dist <= this.patrolDistance)
          this.goTo(1);
        if(dist > this.standByReDistance)
          this.goTo(0);
      break;
      case 1:
        if(dist <= this.detectDistance){
          //AUDIO
            this.soundChangeState();
          //
          this.goTo(2);
        }
        if(dist > this.standByReDistance)
          this.goTo(0);
      break;
      case 2:
        //AUDIO
        this.sfxDetect.setRate(Audio.volume2D(dist)+0.75);

        //
        if(dist > this.standByReDistance){
          //AUDIO
          this.stateChanged=false;
          this.sfxDetect.stop();
          //
          this.goTo(0);
        }
      break;
      case 3:
        if(dist > this.standByReDistance)
          this.goTo(0);
      break;
    }
  }

  //AUDIO
  soundChangeState(){
    if(!this.stateChanged){
      this.sfxDetect=Audio.play3Dinstance(this, 43);
      this.stateChanged=true;
    }
  }
  //
}
