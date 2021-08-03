import Enemy from "./Enemy.js";
import DropableBossEnergy from "../Objects/Dropables/DropableBossEnergy.js"
import BossGun from "./BossGun.js";
import Audio from "../Audio.js";
import BossAfter from "../NPCs/BossAfter.js"
import TileController from "../TileController.js"

//enemigo que hereda de Enemy
export default class Boss extends Enemy {
  constructor(scene, x, y){
    super(scene, x, y, 'bossIdle', 2000);   //5º parametro del contructor == vida
    //inicialización de variables

    //cuerpo de del enemigo que se añade al sprite y a los arrays de enemigos correspondientes
    const { Body, Bodies } = Phaser.Physics.Matter.Matter;
    const { width: w, height: h } = this.sprite
    const body = Bodies.rectangle(0, 6, w * 0.45, h * 0.85, { chamfer: { radius: 5 } })
    /*this.sensors = {
      left:   Bodies.rectangle(-28, 0, 10, 20, { isSensor: true }),
      right:  Bodies.rectangle(28, 0, 10, 20, { isSensor: true }),
      top:    Bodies.rectangle(0, -28, 20, 10, { isSensor: true }),
      bottom: Bodies.rectangle(0, 28, 20, 10, { isSensor: true })
    };
    const compoundBody = Body.create({
      parts: [body, this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.bottom]
    });

    this.sprite.setExistingBody(compoundBody).setPosition(x, y).setFixedRotation();*/
    this.sprite.setExistingBody(body).setPosition(x, y).setScale(1.5).setIgnoreGravity(true).setFixedRotation();
    this.scene.bulletInteracBodies[this.currentBodyIndex] = body;
    this.scene.enemyController.enemyBodies[this.currentEnemyIndex] = body;
    this.sprite.body.collisionFilter.group = -3;
    this.sprite.body.collisionFilter.category = 4;

    //variables de físicas
    this.sprite.body.frictionAir = 0.06;
    this.sprite.body.friction = 0;

    this.adjustedFriction = this.sprite.body.frictionAir / this.scene.matter.world.getDelta();

    //Variables de IA
    this.patrolDir = new Phaser.Math.Vector2(0,0);
    this.initDir = new Phaser.Math.Vector2(0,0);
    this.patrolDistance = 650;
    this.initPos = new Phaser.Math.Vector2(this.sprite.x, this.sprite.y-100);
    this.stopper = false;
    this.playerVector = new Phaser.Math.Vector2(0, 0);
    this.stopper = false;
    this.velX = 0;
    this.velY = 0;
    this.randPatrolSpeed = 0;
    this.currentWeapon = Math.floor(Math.random()*3);
    this.lethalLaser = false;

    //Ajustar estas
    this.patrolSpeed = 3.5;                                           //velocidad al patrullar
    this.patrolRouteLength = 500;                                     //al patrullar cuanto se desplaza antes de darse la vuelta
    this.landSpeed = 5/this.scene.matter.world.getDelta();           //velocidad mientras aterriza para dispara laser
    this.lastSpeed = 2/this.scene.matter.world.getDelta();           //velocidad mientras se va al punto de lanzamiento de su ultimo ataque
    /*
    Arma 0 = balas
    Arma 1 = misiles
    Arma 2 = bombas
    */
    this.fireRate = [3];                                              //fire rate de cada arma
    this.fireRate[0] = 150;
    this.fireRate[1] = 700;
    this.fireRate[2] = 500;
    this.fireDamage = [3]                                             //daño de cada arma
    this.fireDamage[0] = 5;
    this.fireDamage[1] = 75;
    this.fireDamage[2] = 35;


    this.nextEnergy = 250;                                            //cada cuanta vida gastada suelta energia
    this.healthDrop = 100;
    this.energyDrop = 300;                                             //drop de energia

    this.weaponSwitch = 3800;                                          //cada cuanto tiempo cambia de arm_airUp
    this.weaponSwitchRand = 500;                                       //varianza aleatoria del cambio de arma
    this.laserFire = 10000;                                             //cada cuanto dispara lasser
    //Ajustar estas
    //Variables de IA

    //arma del boss, clase separada con sus propios metodos
    this.gun = new BossGun(scene, this.sprite.x, this.sprite.y, this.fireDamage[0], this.fireDamage[1], this.fireDamage[2]);
    this.hpBoundry = this.nextEnergy;
    //timer de cambiar de arma durante el combate
    this.weasponSwitchTimer = this.scene.time.addEvent({
      delay: Phaser.Math.Between(this.weaponSwitch - this.weaponSwitchRand, this.weaponSwitch + this.weaponSwitchRand),
      callback: () => (this.cycleWeapon()),
      repeat: -1
    },this);
    /*
    this.scene.matterCollision.addOnCollideStart({
      objectA: [this.sensors.left, this.sensors.right, this.sensors.top, this.sensors.bottom],
      callback: this.onSensorCollide,
      context: this
    });*/

    //efectos de fuego iguales al jugador
    this.flyFire = this.scene.add.sprite(x, y, 'fire_fly', 0);
    this.flyFire.setScale(this.sprite.scale).setOrigin(0.5, 0.5);
    this.flyFire.setVisible(false);

    //timer para disparar el laser
    this.laserTimer = this.scene.time.addEvent({
      delay: this.laserFire,
      callback: () => (this.initializeLaser()),
      repeat: -1
    },this);

    //IA
    //se preparan el nº de estados que tiene la FSM, que hace cuando empieza, acaba y update de cada estado
    this.initializeAI(6);
    //estado por defeto, ataca al jugador y cambia de arma
    this.stateOnStart(0, function(){
      if(this.sprite == undefined || this.sprite.body == undefined)return;

      //AUDIO
      //se escoge un nuevo punto al que volar

      this.sprite.body.frictionAir = 0.06;
      this.stopper = false;
      this.velX = Phaser.Math.FloatBetween(this.patrolSpeed/2, this.patrolSpeed);
      this.velY = Phaser.Math.FloatBetween(this.patrolSpeed/2, this.patrolSpeed);

      if(this.sprite.y < this.initPos.y - 220){
        this.patrolDir.y = 1;
      }
      else if(this.sprite.y < this.initPos.y){
        this.patrolDir.y = (Math.random()<0.5)?-1:1;
      }else{
        this.patrolDir.y = -1;
      }

      if(this.sprite.x < this.initPos.x - 220){
        this.patrolDir.x = 1;
      }
      else if(this.sprite.x > this.initPos.x + 220){
        this.patrolDir.x = -1;
      }else{
        this.patrolDir.x = (Math.random()<0.5)?-1:1;
      }
      this.patrolTimer1 = this.scene.time.addEvent({
        delay: Phaser.Math.Between(2000, 2400),
        callback: () => (this.resetState())
      },this);

      //AUDIO
      //deja de tener velocidad constante (se va relantizando por el rozamiento con el aire que tiene)
      this.patrolTimer2 = this.scene.time.addEvent({
        delay: Phaser.Math.Between(1800, 2200),
        callback: () => (this.stopper = true)
      },this);

      //AUDIO
      //dispara, si quieres vete a BossGun.js para meter cosas al metodo shoot())
      this.fireTimer = this.scene.time.addEvent({
        delay: this.fireRate[this.currentWeapon],
        callback: () => (this.gun.shoot(this.currentWeapon)),
        repeat: -1
      },this);
    })

    this.stateUpdate(0, function(time, delta){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      if(!this.stopper){
        if(this.patrolDir.y <= 0 || this.sprite.y < this.initPos.y){
          this.sprite.setVelocityX(this.velX * this.patrolDir.x);
          this.sprite.setVelocityY(this.velY * this.patrolDir.y);
        }
      }
      this.playAnimation1();
      this.playerVector.x = this.scene.game.player.sprite.x - this.sprite.x;
      this.playerVector.y = this.scene.game.player.sprite.y - this.sprite.y;
      this.gun.followPosition(this.sprite.x,this.sprite.y);
      this.gun.aimGun(this.playerVector.angle());
    })
    this.stateOnEnd(0, function(){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.patrolTimer1.remove();
      this.patrolTimer2.remove();
      this.fireTimer.remove();
    });

    //empieza a irse hacia el suelo
    this.stateOnStart(1, function(){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.laserTimer.paused = true;
    });
    this.stateUpdate(1, function(time, delta){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.playAnimation1();
      this.playerVector.x = this.scene.game.player.sprite.x - this.sprite.x;
      this.playerVector.y = this.scene.game.player.sprite.y - this.sprite.y;
      this.gun.followPosition(this.sprite.x,this.sprite.y);
      this.gun.aimGun(this.playerVector.angle());
      this.initDir.x = this.initPos.x - this.sprite.x;
      this.initDir.y = this.initPos.y - this.sprite.y + 100;
      if(Math.abs(this.initDir.x) > 4 || Math.abs(this.initDir.y) > 4){
        this.initDir.normalize();
        this.sprite.setVelocityX(this.initDir.x * this.landSpeed * delta);
        this.sprite.setVelocityY(this.initDir.y * this.landSpeed * delta);
      }
      else{
        this.goTo(2);
      }
    })


    //Aterriza y se pone a cargar el laser
    this.stateOnStart(2, function(){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.playAnimation2();
      this.sprite.x = this.initPos.x;
      this.sprite.y = this.initPos.y + 100;
      this.sprite.setVelocityX(0);
      this.sprite.setVelocityY(0);
      //dispara laser
      this.laserDelayTimer = this.scene.time.addEvent({
        delay: 350,
        callback: () => (this.gun.fireLaser()),
        repeat: 1
      },this);
      this.laserDelayTimer2 = this.scene.time.addEvent({
        delay: 4750,
        callback: () => (this.goTo(0))
      },this);
    })

    this.stateUpdate(2, function(time, delta){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.gun.followPosition(this.sprite.x,this.sprite.y);
      this.gun.followLaser();
      if(!this.lethalLaser){
        this.playerVector.x = this.scene.game.player.sprite.x - this.sprite.x;
        this.playerVector.y = this.scene.game.player.sprite.y - this.sprite.y;
        this.gun.adjustLaser(this.playerVector.angle(), delta);
      }
    })
    this.stateOnEnd(2, function(){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.laserTimer.paused = false;
    });

    //Se le ha acabado la vida, se va hacia el centro de la arena
    this.stateUpdate(3, function(time, delta){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.playAnimation1();
      this.gun.followPosition(this.sprite.x,this.sprite.y);
      this.gun.sprite.angle = -90;
      this.initDir.x = this.initPos.x - this.sprite.x;
      this.initDir.y = this.initPos.y - this.sprite.y -220;
      if(Math.abs(this.initDir.x) > 4 || Math.abs(this.initDir.y) > 4){
        this.initDir.normalize();
        this.sprite.setVelocityX(this.initDir.x * this.lastSpeed * delta);
        this.sprite.setVelocityY(this.initDir.y * this.lastSpeed * delta);
      }
      else{
        this.goTo(4);
      }
    })

    //se prepara para disparar 3 laseres en todas direcciones (metete en BossGun.js para cambiar fireMegaLaser())
    this.stateOnStart(4, function(){
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      this.sprite.x = this.initPos.x;
      this.sprite.y = this.initPos.y - 220;
      this.sprite.setVelocityX(0);
      this.sprite.setVelocityY(0);
      this.gun.fireMegaLaser()
      this.patrolTimer1 = this.scene.time.addEvent({
        delay: 3250,
        callback: () => (this.goTo(5), this.gun.destroy())
      },this);
      this.playAnimation1();
    })

    //Se muere, terminando todos sus procesos, y creando la clase que habla con el jugador
    this.stateOnStart(5, function(){
      this.flyFire.setVisible(false);

      const effectDuration = 2000;

      this.scene.cameras.main.shake(effectDuration, 0.02, true);
      this.scene.cameras.main.flash(effectDuration*2, 255,255,255, true);
      this.scene.cameras.main.pan(2975, 1000, 2000, 'Linear', true); //182

          
        //AUDIO
          Audio.gameOver();

          Audio.play3DinstanceRnd(this, 59);
          Audio.play3DinstanceRnd(this, 65);
          //
      
      this.scene.time.addEvent({
        delay: 250,
        callback: () => (this.checkEnding())
      },this);

      this.scene.events.emit('noEnemy' + this.currentBodyIndex);
      this.scene.bulletInteracBodies[this.currentBodyIndex] = undefined;
      this.scene.enemyController.enemyBodies[this.currentEnemyIndex] = undefined;
      this.sprite.destroy();
      new BossAfter(this.scene, this.initPos.x, this.initPos.y - 220);
    })


    this.startAI();
    //IA

    //AUDIO
      this.sfx=Audio.play3DenemyInstance(this, 40);
      this.sfxDetect=Audio.play2Dinstance(54);
      this.stateChanged=false;
    //
  }

  //comprueba el final conseguido por el jugador para enseñar el efcto correpsondiente
  checkEnding(){
    if(this.scene.game.npcHelped >= 2){
      this.scene.moon.setScale(1.1).setAlpha(0.7).anims.play('pulsar',true);
    }else{
      this.scene.moon.setScale(1.2).setAlpha(0.7).anims.play('darkHole',true);
    }
  }

  //se perapara para disparar el laser
  initializeLaser(){
    if(this.currentStateId() == 0){
      this.goTo(1);
    }
  }

  update(time, delta){
      super.update(time, delta);
  }

  //método para filtrado de collisiones con el tileado del mapa
  updateTouchBoundry(){
    if(this.sprite != undefined)
      TileController.playerTouchBoundry(this.scene, this.sprite);
  }

  //metodo para inicial la animación correspondiente mientras vuela
  playAnimation1(){
    const dir = this.scene.game.player.sprite.x < this.sprite.x;
    this.flyFire.setVisible(true);
    if(!this.stopper){
      if(this.sprite.body.velocity.y > 0.1){
        this.sprite.anims.play('airDownBoss', true);
        this.gun.adjustOffset(5 * ((dir)?1:-1), 4);
        this.flyFire.anims.play('fire_movedown', true);
      }else if(Math.abs(this.sprite.body.velocity.x) > 0.1){
        this.sprite.anims.play('airMoveBoss', true);
        this.gun.adjustOffset(-2 * ((dir)?1:-1), 4);
        this.flyFire.anims.play('fire_fly', true);
      }else if(this.sprite.body.velocity.y < -0.1){
        this.sprite.anims.play('airUpBoss', true);
        this.gun.adjustOffset(3 * ((dir)?1:-1), -1);
        this.flyFire.anims.play('fire_moveup', true);
      }
    }
    this.flyFire.x = this.sprite.x;
    this.flyFire.y = this.sprite.y;
    /*else{
      this.sprite.anims.play('airIdle', true);
      this.gun.adjustOffset(3 * ((dir)?1:-1), -1);
    }*/

    this.sprite.setFlipX(dir);
    this.flyFire.setFlipX(dir);
  }

  //método para animaciones mientras esta en el suelo
  playAnimation2(){
    const dir = this.scene.game.player.sprite.x < this.sprite.x;
    this.flyFire.setVisible(false);
    this.sprite.anims.play('idleBoss', true);
    this.gun.adjustOffset(5 * ((dir)?1:-1), 0);
    this.sprite.setFlipX(dir);

    this.flyFire.x = this.sprite.x;
    this.flyFire.y = this.sprite.y;
    this.flyFire.setFlipX(dir);
  }

  //cambia de arma
  cycleWeapon(){
    const nextWeapon = Math.floor(Math.random()*3);
    this.currentWeapon = (this.currentWeapon+nextWeapon)%3;
    this.fireTimer.delay = this.fireRate[this.currentWeapon];
    //AUDIO
    //cambia de arma, el arma escogida sera this.currentWeapon (AQUI NO DISPARA, SOLO CAMBIA DE ARMA)
    // 0 -> balas
    // 1-> misiles
    // 2-> bombas
    console.log("Boss ha cambiado de arma: " + this.currentWeapon);
  }


  //método que se invoca al recibir daño
  damage(dmg, v){
    //AUDIO
    if(Math.random()>0.3){
      var auxSfx=Audio.play3DinstanceRnd(this,45);
    }else{
      var auxSfx=Audio.play3DinstanceRnd(this,44);
    }
    auxSfx.setDetune(auxSfx.detune+100);

    //si se le ha infligido cierta cantidad de daño suelta energia
    if(this.sprite != undefined && this.sprite.body != undefined){
      const hpDiff = this.hpBoundry - dmg;
      if(hpDiff <= 0){
        const energyDrops = Math.floor(Math.abs(hpDiff)/this.nextEnergy);
        for(var i=0; i<energyDrops+1; i++){
          new DropableBossEnergy(this.scene, this.sprite.x, this.sprite.y, (this.sprite.x < this.scene.game.player.sprite.x)?1:-1,  this.energyDrop);
        }
        this.hpBoundry = this.nextEnergy;
      }else{
        this.hpBoundry -= dmg
      }
    }


    super.damage(dmg, v);
  }

  //método que se invoca al recibir daño con el laser
  damageLaser(dmg, v){
    //AUDIO
      Audio.lasserSufferingLoop.setDetune(-100);
    //
    if(this.sprite != undefined){
      const hpDiff = this.hpBoundry - dmg;
      if(hpDiff <= 0){
        const energyDrops = Math.floor(Math.abs(hpDiff)/this.nextEnergy);
        for(var i=0; i<energyDrops+1; i++){
          new DropableBossEnergy(this.scene, this.sprite.x, this.sprite.y, (this.sprite.x < this.scene.game.player.sprite.x)?1:-1,  this.energyDrop);
        }
        this.hpBoundry = this.nextEnergy;
      }else{
        this.hpBoundry -= dmg
      }
    }

    super.damageLaser(dmg, v);
  }
  //método que se invoca al dañar y empujar al boss
  damageAndKnock(dmg, knockback, v){
    if(this.sprite != undefined){
      const hpDiff = this.hpBoundry - dmg;
      if(hpDiff <= 0){
        const energyDrops = Math.floor(Math.abs(hpDiff)/this.nextEnergy);
        for(var i=0; i<energyDrops+1; i++){
          new DropableBossEnergy(this.scene, this.sprite.x, this.sprite.y, (this.sprite.x < this.scene.game.player.sprite.x)?1:-1,  this.energyDrop);
        }
        this.hpBoundry = this.nextEnergy;
      }else{
        this.hpBoundry -= dmg
      }
    }

    super.damageAndKnock(dmg, knockback, v);
  }

  //método que se invoca al morir el enemigo
  enemyDead(vXDmg, vYDmg, drop = true){
    if(!this.dead){
      this.goTo(3);
      //AUDIO
      Audio.play3DinstanceRnd(this, 52);
      //
      this.weasponSwitchTimer.destroy();
      this.patrolTimer1.destroy();
      this.patrolTimer2.destroy();
      this.fireTimer.destroy();
      this.laserTimer.destroy()
      if(this.laserDelayTimer != undefined)
        this.laserDelayTimer.destroy();
      if(this.laserDelayTimer2 != undefined)
        this.laserDelayTimer2.destroy();

      this.dead = true;
    }
  }
  //método llamado desde Blackboard.js para ajustar la distancia con el jugador
  updatePlayerPosition(dist){
    //AUDIO
      this.sfx.volume=Audio.volume2D(dist);
    //
  }
  //calcula la distanca al jugador
  distanceToPlayer(){
    if(this.sprite.body != undefined)
      return Math.sqrt(Math.pow(this.sprite.x - this.scene.game.player.sprite.x,2) + Math.pow(this.sprite.y - this.scene.game.player.sprite.y,2));
    else
      return 5000;   
  }


}
