//Zona de declaración de variables.
//Variables de la camara.

//Mirar luego para temas de camara
var cam;
var mouse;
//var firstFollow;
//var fadeOut;

//Imports en la escena.
import Player from "../../PlayerStuff/Player.js";
import Blackboard from "../../Enemies/Blackboard.js";
import ZapperGround from "../../Enemies/ZapperGround.js";
import SwordGround from "../../Enemies/SwordGround.js";
import Mecha from "../../Enemies/Mecha.js";
import Sith from "../../Enemies/Sith.js";
import ZapperAir from "../../Enemies/ZapperAir.js";
import BombAir from "../../Enemies/BombAir.js";
import GunnerAir from "../../Enemies/GunnerAir.js";
import Dialog from "../../Plugins/Dialog.js"
import Mentor from "../../NPCs/Mentor.js"
import NPC_Droid_1 from "../../NPCs/NPC_Droid_1.js"
import NPC_Droid_2 from "../../NPCs/NPC_Droid_2.js"
import NPC_Droid_3 from "../../NPCs/NPC_Droid_3.js"
import NPC_Droid_4 from "../../NPCs/NPC_Droid_4.js"
import NPC_Droid_5 from "../../NPCs/NPC_Droid_5.js"
import NPC_Droid_6 from "../../NPCs/NPC_Droid_6.js"
import NPC_Droid_7 from "../../NPCs/NPC_Droid_7.js"
import NPC_Droid_8 from "../../NPCs/NPC_Droid_8.js"
import NPC_Droid_Default1 from "../../NPCs/NPC_Droid_Default1.js"
import NPC_Droid_Default2 from "../../NPCs/NPC_Droid_Default2.js"
import BossBefore from "../../NPCs/BossBefore.js"
import Level3 from "./Level3.js";
import LevelBoss from "./LevelBoss.js";
import LevelEnd from "../../Objects/LevelEnd.js";
import Audio from "../../Audio.js";
import InteractableChest from "../../Objects/Interactables/InteractableChest.js"
import TileController from "../../TileController.js"
import LaserTrap from "../../Objects/Interactables/LaserTrap.js"

//Clase Scene2, que extiende de Phaser.Scene.
export default class Level2 extends Phaser.Scene {
  static count = 0;
  static addNumber(){
    Level2.count = (Level2.getNumber() + 1) ;
  }
  static getNumber(){
    return Level2.count;
  }
  constructor() {
    super('levelSecond' + (Level2.getNumber() + 1));
    Level2.addNumber();
  }
  preload(){
    Dialog.preloadToScene(this);
    //this.load.scenePlugin('AnimatedTiles', 'AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
  }

  //Función create, que crea los elementos del propio juego.
  create() {
    console.log(this);
    //AJUSTE FÍSICAS PARA MOBILE
      if(!this.game.onPC){
          this.matter.world.update30Hz();
      }
    //
    //INTERFAZ

    //Options field
    //var ebi=this.add.image(0,0,'ebi').setOrigin(0,0).setScale(0.25);

    //Boton pause
    this.botonPause = this.add.image(915,45,'btnPause').setScale(0.25).setAlpha(0.8).setScrollFactor(0).setDepth(100);
		this.botonPause.setInteractive()
    .on('pointerdown', () => this.pauseGame());

    this.botonPause.on('pointerover', function(pointer){
      this.alpha=1;
    });

    this.botonPause.on('pointerout', function(pointer){
      this.alpha=0.8;
    });

    //Pausa a traves de teclado
    //Creamos la tecla correspondiente con ESCAPE
    this.ESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.inPause=false;

    //INTERFAZ

    new Dialog(this, 50, 400, false,5000, {
      wrapWidth: 700,
      fixedWidth: 700,
      fixedHeight: 80,
    });

    //game.matter.world.pause();
    mouse = this.input.activePointer;

    //Camara.
    cam = this.cameras.main;
    cam.setBackgroundColor('#262626');
    this.matter.world.setBounds(0, 0, 3776, 4800);
    cam.setBounds(0, 0, 3776, 4800);

    cam.fadeIn(Audio.barRateDiv[2]);  //Constante de Audio para sincronía
    //fadeOut = false;


    //Backgrounds.
    this.add.image(-2000, 500, 'bg2').setScale(2).setScrollFactor(0.5,0.1).setDepth(-300);

    this.moon = this.add.sprite(this.game.moonPos.x, this.game.moonPos.y, 'moon', 0).setScrollFactor(0).setDepth(-400);
    this.timeBg = this.add.sprite(480, 270, 'animatedBg').setScrollFactor(0).setDepth(-500).anims.play('bgAnimation',true, this.game.currentBgAnimation);

    //Inicializacion y creacion de mapa de tiles.
    this.map = this.make.tilemap({ key: "map2", insertNull: true });
    const tileset1 = this.map.addTilesetImage("background_layer", "tilesBackgorund2", 32, 32, 1, 2);
    const tileset2 = this.map.addTilesetImage("front_layer", "tilesFront2", 32, 32, 1, 2);
    const tileset3 = this.map.addTilesetImage("main_layer", "tilesMain2", 32, 32, 1, 2);
    const tileset4 = this.map.addTilesetImage("second_layer", "tilesSecond2", 32, 32, 1, 2);
    const tileset5 = this.map.addTilesetImage("animated_layer", "animatedLayer1", 32, 32, 1, 2);

    //Capas de tiles.
    const mainlayer = this.map.createDynamicLayer("Main_Layer", [tileset1, tileset2, tileset3, tileset4, tileset5], 0, 0);
    mainlayer.depth = -5;
    const lethallayer = this.map.createDynamicLayer("Lethal_Layer", [tileset1, tileset2, tileset3, tileset4, tileset5], 0, 0);
    lethallayer.depth = -10;
    const frontlayer = this.map.createDynamicLayer("Front_Layer", [tileset1, tileset2, tileset3, tileset4, tileset5], 0, 0);
    frontlayer.depth = 25;
    const secondlayer = this.map.createDynamicLayer("Second_Layer", [tileset1, tileset2, tileset3, tileset4, tileset5], 0, 0);
    secondlayer.depth = -25;
    const background = this.map.createDynamicLayer("Background_Layer", [tileset1, tileset2, tileset3, tileset4, tileset5], 0, 0);
    background.depth = -30;

    //Colisiones de las capas.
    mainlayer.setCollisionByProperty({ Collides: true });
    this.matter.world.convertTilemapLayer(mainlayer);

    lethallayer.setCollisionByProperty({ Collides: true });
    this.matter.world.convertTilemapLayer(lethallayer);

    //capa letal pasa a ser un senosr
    lethallayer.forEachTile(function (tile) {
      if(tile.physics.matterBody != undefined){
        tile.physics.matterBody.body.isSensor = true;
        tile.physics.matterBody.body.collisionFilter.category = 1;
        tile.physics.matterBody.body.collisionFilter.group = -4;
      }
    }, this);

    //inicializamos el controlador de enemigos
    this.enemyController = new Blackboard(this);

    //array de metas
    this.goalArray = [];

    //se crean objetos esenciales de cada nivel como el player, los npcs, el boss....
    this.map.getObjectLayer("Special_Layer").objects.forEach(point => {
      if(point.name == "player"){
        this.playerStartX = point.x;
        this.playerStartY = point.y;
      }
      else if(point.name == "goal"){
        this.goalArray.push(new LevelEnd(this, point.x, point.y, 'star'));
      }
      else if(point.name == "boss"){
        new BossBefore(this, point.x, point.y);
      }
      else if(point.name == "NPC1"){
        new NPC_Droid_Default1(this, point.x, point.y);
      }
      else if(point.name == "NPC2"){
        new NPC_Droid_Default2(this, point.x, point.y);
      }
      else if(point.name == "NPC"){
        const randNumber = Math.floor(Math.random()*this.game.npcArray.length);
        const npcNumber = this.game.npcArray[randNumber];
        switch(npcNumber){
          case 1:
            this.encounterNPC =new NPC_Droid_1(this, point.x, point.y);
          break;
          case 2:
            this.encounterNPC =new NPC_Droid_2(this, point.x, point.y);
          break;
          case 3:
            this.encounterNPC =new NPC_Droid_3(this, point.x, point.y);
          break;
          case 4:
            this.encounterNPC =new NPC_Droid_4(this, point.x, point.y);
          break;
          case 5:
            this.encounterNPC =new NPC_Droid_5(this, point.x, point.y);
          break;
          case 6:
            this.encounterNPC =new NPC_Droid_6(this, point.x, point.y);
          break;
          case 7:
            this.encounterNPC =new NPC_Droid_7(this, point.x, point.y);
          break;
          /*case 8:
            this.encounterNPC =new NPC_Droid_8(this, point.x, point.y);
          break;*/
          default:
            this.encounterNPC =new NPC_Droid_2(this, point.x, point.y);
          break
        }
        this.game.npcArray.splice(randNumber,1);
      }
    });

    //Sistema dinámico de modificacion de collisiones
    var tileBodyMatrix = [];
    for (var i = 0; i < 155; i++) {
      tileBodyMatrix[i] = [];
      for (var j = 0; j < 155; j++) {
        tileBodyMatrix[i][j] = undefined;
      }
    }
    this.bulletInteracBodies = [];
    var counerAux = 0;
    mainlayer.forEachTile(function (tile) {
      //tile.setSize
      if (tile.physics.matterBody != undefined) {
        const tileBody = tile.physics.matterBody.body;
        tileBody.ignoreGravity = true;
        tileBody.ignorePointer = true;
        tileBody.original = undefined;
        tileBody.collisionFilter.category = 1;
        tileBody.collisionFilter.group = -4;
        if (tileBody.position.x > this.playerStartX - 32*30 && tileBody.position.x < this.playerStartX + 32*30 && tileBody.position.y > this.playerStartY - 32*30 && tileBody.position.y < this.playerStartY + 32*30) {
          tileBodyMatrix[Math.floor(tileBody.position.x / 32)][Math.floor(tileBody.position.y / 32)] = new BodyWrapper(tileBody, true);
          tileBody.collisionFilter.mask = 1;
        } else {
          tileBodyMatrix[Math.floor(tileBody.position.x / 32)][Math.floor(tileBody.position.y / 32)] = new BodyWrapper(tileBody, false);
          tileBody.collisionFilter.mask = 0;
          tileBody.isSleeping = true;
          tileBody.gameObject.tile.setVisible(false);
          //Phaser.Physics.Matter.Matter.Composite.removeBody(tile.physics.matterBody.world.localWorld, tileBody);
        }
        this.bulletInteracBodies[counerAux] = tile.physics.matterBody.body;
        counerAux++;
      }
    }, this);

    this.tileBodyMatrix = new Proxy(tileBodyMatrix, {
      get(target, prop) {
        return target[Math.max(0, prop)];
      }
    });
    this.touchedTiles = [];
    this.matter.world.on("afterupdate", this.resetTiles, this);
    this.graphics = this.add.graphics({ fillStyle: { color: 0xff0000}});    //QUITAR LUEGO !!

    //animacion de tiles de la capa de tiels animada
    this.animatedTiles.init(this.map);

    //arrays de enemigos de tierra/aire disponibles
    this.availableEnemiesGround = [];
    this.availableEnemiesGround[0] = {name: "zapper1", probability: 0.6};
    this.availableEnemiesGround[1] = {name: "sword", probability: 0.5};
    this.availableEnemiesGround[2] = {name: "mecha", probability: 0.2};
    //this.availableEnemiesGround[3] = {name: "sith", probability: 0};

    this.availableEnemiesAir = [];
    this.availableEnemiesAir[0] = {name: "zapper2", probability: 0.75};
    this.availableEnemiesAir[1] = {name: "gunner", probability: 0.3};
    //this.availableEnemiesAir[2] = {name: "bomb", probability: 0};

    //funcion crear enemigo
    function spawnEnemy(enemyName, scene, xPos, yPos){
      switch(enemyName){
        case "zapper1":
          return new ZapperGround(scene, xPos, yPos);
        case "zapper2":
          return new ZapperAir(scene, xPos, yPos);
        case "sword":
          return new SwordGround(scene, xPos, yPos);
        case "gunner":
          return new GunnerAir(scene, xPos, yPos);
        case "bomb":
          return new BombAir(scene, xPos, yPos);
        case "mecha":
          return new Mecha(scene, xPos, yPos);
        case "sith":
          return new Sith(scene, xPos, yPos);
        default:
          console.log("Enemy does not exist");
          return null;
      }
    }

    //inicialización de enemigos y cofres de capa de enemigos
    if(this.map.getObjectLayer("Enemy_Layer") != null)
      this.map.getObjectLayer("Enemy_Layer").objects.forEach(point => {
          spawnEnemy(point.name, this, point.x, point.y);
      });

    if(this.map.getObjectLayer("EnemySpawn_Layer") != null)
      this.map.getObjectLayer("EnemySpawn_Layer").objects.forEach(area => {
          var enemiesToSpawnArray;
          if(area.name == "both"){
            enemiesToSpawnArray = this.availableEnemiesGround.concat(this.availableEnemiesAir);
          }else if(area.name == "ground"){
            enemiesToSpawnArray = this.availableEnemiesGround;
          }else if (area.name == "air") {
            enemiesToSpawnArray =  this.availableEnemiesAir;
          }else{
            enemiesToSpawnArray = [];
          }
          const minCounter = 0;
          const maxCounter = enemiesToSpawnArray.length - 1;
          var enemiesToSpawn = Phaser.Math.Between(area.properties[1].value, area.properties[0].value);
          var currentEnemy;
          var randomSpawner;
          var breaker = 0;
          while(enemiesToSpawn > 0 && breaker < 100){   //por si acaso
            breaker++;
            currentEnemy = Phaser.Math.Between(minCounter, maxCounter);
            randomSpawner = Math.random();
            if(randomSpawner <= enemiesToSpawnArray[currentEnemy].probability){
              enemiesToSpawn--;
              if(area.properties[2].value){
                var enemyAux = spawnEnemy(enemiesToSpawnArray[currentEnemy].name, this, Phaser.Math.Between(area.x, area.x + area.width), Phaser.Math.Between(area.y, area.y + area.height));
                enemyAux.encounterNPC = this.encounterNPC;
                this.encounterNPC.enemiesLeft++;
              }else {
                spawnEnemy(enemiesToSpawnArray[currentEnemy].name, this, Phaser.Math.Between(area.x, area.x + area.width), Phaser.Math.Between(area.y, area.y + area.height));
              }

            }
          }
      });

    if(this.map.getObjectLayer("Chest_Layer") != null)
      this.map.getObjectLayer("Chest_Layer").objects.forEach(point => {
        if(point.name == "tutorialSpecial")
          new InteractableChest(this, point.x, point.y, 10 ,20000);
        else
          new InteractableChest(this, point.x, point.y, 200 ,300);
      });

    if(this.map.getObjectLayer("Waypoint_Layer") != null)
      this.map.getObjectLayer("Waypoint_Layer").objects.forEach(point => {
        if(point.name == "01")
          this.mentor = new Mentor(this, point.x, point.y);

        /*array de posiciones aqui
          var arrayPuntos = []
          ...
          ...
          this.mentor.tutorialPositions = arrayPuntos;
          //por ultimo modifica el array de dialogos de Mentor.js
        */
      });

    //jugador
    new Player(this, this.playerStartX, this.playerStartY);

    //new Mentor(this, this.playerStartX + 400, this.playerStartY)

    cam.startFollow(this.game.player.sprite, false, 0.1, 0.1, 0, 0);

    //inicialización de meta
    for(var i=0; i<this.goalArray.length; i++){
      this.goalArray[i].initGoal('levelThird', Level3);
    }

    //laseres y sonidos de laseres
    this.laserTrapArray = [];
    if(this.map.getObjectLayer("Sound_Layer") != null)
      this.map.getObjectLayer("Sound_Layer").objects.forEach(point => {
        this.laserTrapArray.push(new LaserTrap(this, point.x, point.y));
      });

    this.randomLaser = [];
    for(var i=0; i<40; i++){
      this.randomLaser[i] = Math.random();
    }
    if(this.map.getObjectLayer("Laser_Layer") != null)
      this.map.getObjectLayer("Laser_Layer").objects.forEach(point => {
        if(this.randomLaser[parseInt(point.properties[0].value)] < 0.25){
          console.log(point.properties[1].value);
          if(point.properties[1].value){
            var laserAux = this.matter.add.sprite(point.x, point.y-16, 'laserAux', 0);
            laserAux.setDepth(-11);
            laserAux.body.isStatic = true;
            laserAux.body.isSensor = true;
            laserAux.body.collisionFilter.category = 1;
            laserAux.body.collisionFilter.group = -4;
            laserAux.lethalLaser = true;
            laserAux.anims.play('laserAux', true);
          }
        }
        else if(this.randomLaser[parseInt(point.properties[0].value)] < 0.5){
          console.log(point.properties[1].value);
          if(!point.properties[1].value){
            var laserAux = this.matter.add.sprite(point.x, point.y-16, 'laserAux', 0);
            laserAux.setDepth(-11);
            laserAux.body.isStatic = true;
            laserAux.body.isSensor = true;
            laserAux.body.collisionFilter.category = 1;
            laserAux.body.collisionFilter.group = -4;
            laserAux.lethalLaser = true;
            laserAux.anims.play('laserAux', true);
          }
        }
        else{
          //ningun laser
        }
      });

    this.input.setDefaultCursor('none');

   this.maxMemory = 0;
   //AUDIO
      Audio.levelTwo(this);

      //
  }
  //Función update, que actualiza el estado de la escena.
  update(time, delta) {
      //AUDIO:
        Audio.update(this);
      //
    if(this.moon.x < this.game.moonMaxDistance){
      this.moon.x += (delta*this.game.moonVelocity);
      this.game.moonPos.x = this.moon.x;
    }


    if (this.ESC.isDown){
      if (!this.inPause) {
        this.inPause = true;
      }
    }

    if (this.ESC.isUp) {
      if (this.inPause){
      this.inPause = false;
      this.pauseGame();
      }
    }

    /*console.log(Phaser.Physics.Matter.Matter.Composite.allBodies(this.matter.world.localWorld).length);
    console.log(this.matter.world.localWorld.bodies.length);
    console.log("   ");*/

    /*this.maxMemory = Math.max(this.maxMemory, Math.round((performance.memory.usedJSHeapSize/1024/1024)));
    console.log(this.maxMemory + "    " + Math.round((performance.memory.usedJSHeapSize/1024/1024)));*/
    /*const usedHeap = performance.memory.usedJSHeapSize/1024/1024;
    if(usedHeap > 90){
      console.log("USING TOO MUCH MEMORY:  " + usedHeap);
    }*/
  }
  resetTiles(){
    for(var i=0; i<this.touchedTiles.length; i++){
      TileController.resetTileBody(this.touchedTiles[i]);
      this.touchedTiles[i].touched = false;
    }
    this.touchedTiles.length = 0;
    this.touchedTiles = [];
  }

  pauseGame(){
    console.log("Juego pausado");

    this.input.setDefaultCursor('url(assets/cursor.png), pointer');

    this.game.pauseInfo = 'levelSecond' + (Level2.getNumber());
    this.game.pauseScene = this;

    var clockTimer = new Date();
    this.game.pauseClock = clockTimer.getTime();

    this.botonPause.alpha=0.8;
    this.scene.run("ScenePause");
    this.scene.bringToTop("ScenePause");
    this.scene.pause('levelSecond' + (Level2.getNumber()));
  }

  startDebugLoop(deltaLoop, memoryLoop){
    if(deltaLoop)
      this.events.on("update", this.printDelta, this);

    if(memoryLoop)
      this.events.on("update", this.printMemory, this);
  }

  stopDebugLoop(){
    this.events.off("update", this.printDelta);
    this.events.off("update", this.printMemory);
  }

  printDelta(time, delta){
    console.log("Last Delta:  " + (Math.round(delta))+ " ms");
  }
  printMemory(time, delta){
    console.log("Used Memory: " + (Math.round((performance.memory.usedJSHeapSize/1024/1024))) + " Mb");
  }
}


class BodyWrapper {
  constructor(body, active) {
    this.body = body;
    this.active = active;
    this.touched = false;
  }
}
