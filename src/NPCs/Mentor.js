import Audio from "../Audio.js";
import FiniteStateMachine from "../FiniteStateMachine.js"
import Dialog from "../Plugins/Dialog.js"
import TileController from "../TileController.js"

//Clase padre de todos los enemigos
export default class Mentor extends FiniteStateMachine {
  constructor(scene, x, y) {
    super();
    //inicializacion
    //AUDIO
      this.walkLoop;
      this.surfaceLoop;
      this.engineLoop;
      this.propellerLoop;
      this.isWalking=false;
      this.isMoving=false;
    //


    //inicializacion
    this.scene = scene;
    this.sprite = scene.matter.add.sprite(x, y, 'mentorIdle', 0).setScale(2);

    //cuerpo del mentor
    const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
    const { width: w, height: h } = this.sprite;
    this.mainBody = Bodies.rectangle(0, 6, w * 0.45, h * 0.85, { chamfer: { radius: 5 } });
    this.sensor = Bodies.rectangle(0, 36, w * 0.3, 8, { isSensor: true });

    const compoundBody = Body.create({
      parts: [this.mainBody, this.sensor],
      frictionAir: 0.06,
      friction: 1,
      frictionStatic: 1
    });
    this.sprite.setScale(1.5);
    this.sprite
      .setExistingBody(compoundBody)
      .setFixedRotation()
      .setPosition(x, y)
      .setOrigin(0.5, 0.72)     //0.5, 0.55

    //variables fisicas
    this.touchingGround = false;
    this.sprite.setIgnoreGravity(false);
    this.sprite.body.collisionFilter.group = -2;
    this.sprite.body.collisionFilter.mask = 1;
    this.sprite.body.collisionFilter.category = 4;

    //detectores de collision con el suelo
    scene.matterCollision.addOnCollideStart({
      objectA: this.sensor,
      callback: this.onSensorCollideStart,
      context: this
    });
    scene.matterCollision.addOnCollideActive({
      objectA: this.sensor,
      callback: this.onSensorCollide,
      context: this
    });

    //mas variables fisicas y de movimiento
    this.moveTimer = undefined;
    this.speed = 0.33;
    this.objectiveX = this.sprite.x;
    this.objectiveY = this.sprite.y;
    this.speedVector = new Phaser.Math.Vector2(0, 0);
    this.reachedX = true;
    this.reachedY = true;

    //array de vectores a donde se va despues de terminar su dialogo, recorre todo el mapa del tutorial
    this.tutorialPositions = [];
    this.scene.dialogManager.setSpeakerVoice(1);
    //this.tutorialPositions[0] = new Phaser.Math.Vector2(1128,2560);
    //this.tutorialPositions[1] = new Phaser.Math.Vector2(1628,2260);

    scene.matter.world.on("beforeupdate", this.resetTouching, this);

    this.isFiring = false;


    //DIALOGOS
    this.isTalking = false;

    //aray de dialogos
    this.dialogArray = [];
    this.dialogArray[0] =
`[b]D42K-H[/b]
Finally... `+ this.scene.game.playerName +`, here we are!
Behold, here rises the Starvail Tower!
[b]D42K-H[/b]
This is the last bastion of our creators,
the place where life is born and dies...
[b]D42K-H[/b]
I can't wait to ascend! `+ this.scene.game.playerName +`,
follow me, I'll tell you what I know.
[b]TIP[/b]
Use the A and D keys to run.`;

    this.dialogArray[1] =
`[b]D42K-H[/b]
Hmm... this place reeks of bad oil,
it's more worn out than I expected...
[b]D42K-H[/b]
`+ this.scene.game.playerName +`, looks like we'll have to make
our way flying to the top of the tower.
[b]D42K-H[/b]
Let's look up there, follow me.
You remember how to fly, right?
[b]TIP[/b]
You can fly using your jet boots.
To activate them, press the W key.
[b]TIP[/b]
But, beware, for this consumes energy,
represented as the blue bar on your screen.
[b]TIP[/b]
Energy gets consumed exponentially while you fly;
that means that the more time you spend on air,
[b]TIP[/b]
more energy will be consumed each second. A smart
android will fly frequently on short intervals,
[b]TIP[/b]
rather than having long flights consume all its
energy. Managing of energy is key to your success,
[b]TIP[/b]
because if your energy runs out, your boots will
deactivate and you'll fall.
[b]TIP[/b]
You should never let this happen.`;

    this.dialogArray[2] =
`[b]D42K-H[/b]
Good job, `+ this.scene.game.playerName +`. I hope your air
navigation systems are up to date,
[b]D42K-H[/b]
because you'll surely need them here.
Now, you should check the integrity of
[b]D42K-H[/b]
your weapon systems. You know, vagrants
like us are treated as infected units here,
[b]D42K-H[/b]
so you'll probably need to engage in combat
with the automatons;
[b]D42K-H[/b]
try shooting the deactivated droid here.
I'll wait you up there.
[b]TIP[/b]
To fire your weapon, aim with the mouse. To
shoot, click the left mouse button.
[b]TIP[/b]
Defeated enemies drop energy cells, which
you can use to keep ascending through the tower.`;

    this.dialogArray[3] =
`[b]D42K-H[/b]
Careful, `+ this.scene.game.playerName +`! Looks like the defense
systems of Starvail include laser barriers.
[b]D42K-H[/b]
Why do you think the human gods keep those active?
Why would they impede us ascending the tower?
[b]D42K-H[/b]
...

[b]D42K-H[/b]
It's not like we can ask them, anyway. All
that is left in the physichal world is us, androids.
[b]D42K-H[/b]
Let's keep going, `+ this.scene.game.playerName +`.
Watch out for the lasers, fly over them.
[b]TIP[/b]
Lasers are harmful elements that will repel
and damage you on contact.
[b]TIP[/b]
Sometimes they will block your way, in which
case you'll have to find another route.
[b]TIP[/b]
In any case, you must keep away from them.`;

    this.dialogArray[4] =
`[b]D42K-H[/b]
Hmm... look at what we've got here, it's a
support storage unit!
[b]D42K-H[/b]
These units will surely contain energy and
repairment supplies. Anytime you find one,
[b]D42K-H[/b]
you should scavenge them. Take the energy
supplies, we're moving up!
[b]TIP[/b]
You may find supply chests scattered among
Starvail. They contain both energy and
[b]TIP[/b]
health units that will help you keep going,
so you should always open them.
[b]TIP[/b]
To open a chest or interact with any item,
you must click on said item.`;

    this.dialogArray[5] =
`[b]D42K-H[/b]
You know, `+ this.scene.game.playerName +`, I have noticed something
about the estructure of this tower.
[b]D42K-H[/b]
If at some point you feel lost, or don't know
where to go, I think you should look for
[b]D42K-H[/b]
the colorful circuits, like the ones I'm standing
on. They seem to be here to guide us, vagrants,
[b]D42K-H[/b]
to the top of the tower. In any case, let's keep
going. Look out for these lasers!
[b]TIP[/b]
In your way up Starvail Tower, you must remember
two things if you get lost:
[b]TIP[/b]
First: your goal is to get to the top of the tower,
so you should always go up.
[b]TIP[/b]
Second: if you don't know where to go up, look for
the colorful circuits scattered across all Starvail:
[b]TIP[/b]
They know the way!`;

    this.dialogArray[6] =
`[b]D42K-H[/b]
Keep up.`;
/*`[b]D42K-H[/b]
Hmm, what is this? An orange laser barrier?
From the data I can analyze, looks like
[b]D42K-H[/b]
these barriers can be managed by external
handlers. Try activating this button, `+ this.scene.game.playerName +`.
[b]TIP[/b]
Orange laser barriers, unlike red laser
barriers, can always be deactivated using their
[b]TIP[/b]
corresponding switch. If you stumble upon
a orange laser barrier that impedes your
[b]TIP[/b]
progress, you must search for its switch
in your surroundings.
[b]TIP[/b]
Barriers, both red and orange, may appear
randomly, so keep an eye for them!`;*/

    this.dialogArray[7] =
`[b]D42K-H[/b]
Good job, `+ this.scene.game.playerName +`!
...!
[b]D42K-H[/b]
Watch out, there's an automaton here!
Time to put your systems to test.
[b]D42K-H[/b]
But let me give you a new weapon first,
it'll surelly prove useful in combat situations:
[b]D42K-H[/b]
It's a plugin weapon that acts as a bomb launcher. 
Use it wisely, for it consumes energy to be shot!
[b]TIP[/b]
To change weapons, click or tap them on the weapon
selector, or simply use the mouse wheel if you're
[b]TIP[/b]
currently playing on PC. Special weapons will mark
a difference in combat, so you should look for
[b]TIP[/b]
more of them throught Starvail. Keep in mind most
of them require energy to be used, though.
[b]TIP[/b]
If you don't know where to find these weapons,
look for the vagrant droids, they'll know more!
[b]TIP[/b]
Meanwhile, you'll encounter a wide amount of 
enemies in your ascension through Starvail.
[b]TIP[/b]
You can fight or run, but keep in
mind they can provide you with the energy
[b]TIP[/b]
you need if you choose to defeat them.
And remember, if your health bar empties...
[b]TIP[/b]
your journey will come to an abrupt end`;

    this.dialogArray[8] =
`[b]D42K-H[/b]
Good battle performance, `+ this.scene.game.playerName +`!
Looks like this is the end of this block.
[b]D42K-H[/b]
From this point up, the paths begin to
diverge. In order to reach the top, [b]you[/b]
[b]D42K-H[/b]
must overcome three blocks similar to this
one. I won't accompany you, though, as
[b]D42K-H[/b]
this is a trial that we must face alone in
order to attain enlightenment.
[b]`+ this.scene.game.playerName +`[/b]
...

[b]D42K-H[/b]
Do you think we'll find the meaning of our
existence here, `+ this.scene.game.playerName +`?
[b]D42K-H[/b]
We came here to witness the 'birth of a
new star'. We must reach the top of this
[b]D42K-H[/b]
tower before the nigth ends in order to
be able to see it happen. If our logical
[b]D42K-H[/b]
processing units are right, this will provide
us with a 'reason to live'. I don't know
[b]D42K-H[/b]
when this technical requirement came to be,
but we cannot ignore it, right?
[b]D42K-H[/b]
We will fulfill this task tonight, I hope.
If you want to know how much time you have
[b]D42K-H[/b]
left until sunrise, you only have to look at
the moon; the contamination makes it harder
[b]D42K-H[/b]
to see, but if you look carefully you'll see it.
The moon rises from the west and hides to the east
[b]D42K-H[/b]
near dawn. If that happens, you'll have missed
the opportunity, `+ this.scene.game.playerName +`. Keep an eye on it.
[b]`+ this.scene.game.playerName +`[/b]
...
Okay.
[b]D42K-H[/b]
Before we go, I will give you one last advice,
`+ this.scene.game.playerName +`.
[b]D42K-H[/b]
You may find other vagrants, like us,
trying to make their way to the top of
[b]D42K-H[/b]
the tower. They won't try to harm you, and
may even call you for help, as they may
[b]D42K-H[/b]
be defenseless against the automatons of
this tower. Wether to help them or not
[b]D42K-H[/b]
is your [b]choice[/b]. They may even
reward you for your help, but I won't
[b]D42K-H[/b]
assist any of them, as I have limited
time to fulfill my primordial task:
[b]D42K-H[/b]
reaching the top of this tower before
sunrise. I advice you to do the same, `+ this.scene.game.playerName +`.
[b]D42K-H[/b]
The only thing that matters is reaching the top of
Starvail Tower, to discover the meaning of 'life'.
[b]D42K-H[/b]
Don't let that data be ignored.

[b]`+ this.scene.game.playerName +`[/b]
...

[b]D42K-H[/b]
I will meet you at the top of the tower, to witness
the birth of a new star. I wish you luck...
[b]D42K-H[/b]
for this night we will overcome the
malware known as 'existential dread'.
[b]TIP[/b]
Despite everything, keep in mind, your main
objective is [b] to make it to the top of[/b]
[b]TIP[/b]
[b]the tower in time[/b]. In order to
do this, [b]you must conquer three levels [/b]
[b]TIP[/b]
[b]similar to this one[/b].

[b]TIP[/b]
This concludes your introduction to the world
of Starvail.
[b]TIP[/b]
Now, go forth and discover the true meaning
of life, `+ this.scene.game.playerName +`!`;

    this.dialogArray[9] =
`[b]D42K-H[/b]
Good luck!`;
    this.currentDialog = -1;

    //efectos de fuego al voler como el jugador
    this.flyFire = this.scene.add.sprite(x, y, 'fire_fly', 0);
    this.flyFire.setScale(this.sprite.scale).setOrigin(0.5, 0.72);
    this.flyFire.setVisible(false);

    //IA
    //se preparan el nº de estados que tiene la FSM, que hace cuando empieza, acaba y update de cada estado
    //this.initializeAI(4);
    this.initializeAI(4);
    this.stateOnStart(0, function () {
      this.currentDialog++;
    });
    //si se detecta al jugador comienza el diálogo
    this.stateUpdate(0, function () {
      if(this.sprite == undefined || this.sprite.body == undefined || this.scene.game.player.sprite == undefined || this.scene.game.player.sprite.body == undefined)return;
      if (Math.sqrt(Math.pow(this.sprite.x - this.scene.game.player.sprite.x, 2) + Math.pow(this.sprite.y - this.scene.game.player.sprite.y, 2)) < 300 && this.touchingGround) {
        this.goTo(1);
      }
    });
    this.stateOnEnd(0, function () {
      this.sprite.setFlipX(this.scene.game.player.sprite.x < this.sprite.x);
      this.isTalking = true;
      this.scene.dialogManager.setCurrentSpeaker(this);
      this.scene.dialogManager.setSpeakerVoice(1);
      this.scene.dialogManager.textBox.start(this.dialogArray[this.currentDialog], 30);
      //this.scene.game.player.alive = false;
      this.scene.dialogManager.showDialogBox();
    })
    //estado en el que se va a un punto del mapar en concreto
    this.stateOnStart(2, function () {
      if (this.currentDialog < this.tutorialPositions.length) {
        this.moveTo(this.tutorialPositions[this.currentDialog]);
        //this.scene.game.player.alive = true;
      }
      else
        this.goTo(1);
    })
    this.stateUpdate(2, function (time, delta) {
      if(this.sprite == undefined || this.sprite.body == undefined)return;
      if (this.touchingGround) {
        //AUDIO
        if(!this.isMoving && !this.isWalking){
            this.isMoving=true;
            this.isWalking=true;
            this.walkLoop=Audio.play3Dinstance(this,91);
            this.surfaceLoop=Audio.play3Dinstance(this,92);
        }
        //
        if (Math.abs(this.sprite.x - this.objectiveX) <= 5) {
          this.reachedX = true;
          this.sprite.setVelocityX(0);
        }
        if (Math.abs(this.sprite.y - this.objectiveY) <= 5) {
          this.reachedY = true;
        }
      } else {
        //AUDIO
        if(!this.isMoving && !this.isWalking){
            this.isMoving=true;
            this.engineLoop=Audio.play3Dinstance(this,94);
            this.propellerLoop=Audio.play3Dinstance(this,95);
            Audio.play3Dinstance(this,96);
        }
        if(this.isMoving && this.isWalking){
            this.isMoving=false;
            this.isWalking=false;
            this.walkLoop.stop();
            this.surfaceLoop.stop();
            Audio.play3Dinstance(this,93);
        }
        //
        if (Math.abs(this.sprite.x - this.objectiveX) <= 5) {
          this.reachedX = true;
        }
        if (Math.abs(this.sprite.y - this.objectiveY) <= 5) {
          this.reachedY = true;
        }
      }
      if (!this.reachedX)
        this.sprite.setVelocityX(this.speedVector.x * delta);

      if (!this.reachedY)
        this.sprite.setVelocityY(this.speedVector.y * delta);

      if (this.reachedX){
          //AUDIO
          if(this.engineLoop != undefined){
            if(this.isMoving && this.engineLoop.isPlaying){
              this.isMoving=false;
              this.engineLoop.stop();
              this.propellerLoop.stop();
              Audio.play3Dinstance(this,97);
            }
          }
          if (this.isMoving && this.isWalking){
            this.isMoving=false;
            this.isWalking=false;
            this.walkLoop.stop();
            this.surfaceLoop.stop();
            Audio.play3Dinstance(this,93);
          }
          //
        this.goTo(0);
      }
    })
    this.startAI();

    this.scene.events.on("update", this.update, this);  //para que el update funcione
  }
  //termina de hablar y se va a otro punto del mapa
  finishedDialog() {
    this.isTalking = false;
    this.goTo(2);
    if(this.currentDialog >= (this.dialogArray.length-3)){
      if(this.scene.game.player.nextButton <= 1){
        this.scene.game.obtainedWeapons.push(4);
        this.scene.game.player.recieveWeapon(4);
      }
    }
  }

  //funciones de collisin con el suelo
  resetTouching() {
    this.touchingGround = false;
  }

  onSensorCollideStart({ bodyA, bodyB, pair }) {
    if (bodyB.isSensor || this.sprite == undefined || this.sprite.body == undefined) return;
    this.touchingGround = true;
    if (this.objectiveY - this.sprite.y >= 5) {
      this.sprite.setVelocityX(0);
      this.sprite.setVelocityY(0);
      this.reachedY = true;
      this.reachedX = true;
    }
  }

  onSensorCollide({ bodyA, bodyB, pair }) {
    if (bodyB.isSensor) return;
    this.touchingGround = true;
  }

  //update
  update(time, delta) {
    if(this.sprite == undefined || this.sprite.body == undefined)return;
    TileController.playerTouchBoundry(this.scene, this.sprite);
    this.updateAI(time, delta);
    this.playAnimation();
          //AUDIO
          if (this.isMoving && this.isWalking){
            this.walkLoop.volume=Audio.volume3D(this);
            this.surfaceLoop.volume=Audio.volume3D(this);
          }else if(this.isMoving && !this.touchingGround){
            this.engineLoop.volume=Audio.volume3D(this);
            this.propellerLoop.volume=Audio.volume3D(this);
          }
          //
  }

  //funcion que inicia la animacion correspondiente
  playAnimation() {
    if (!this.touchingGround) {
      this.flyFire.setVisible(true);
      if (this.sprite.body.velocity.y > 0.1) {
        this.sprite.anims.play('airDownMentor', true);
        this.flyFire.anims.play('fire_movedown', true);
      } else if (Math.abs(this.sprite.body.velocity.x) > 0.1) {
        this.sprite.anims.play('airMoveMentor', true);
        this.flyFire.anims.play('fire_fly', true);
      } else if (this.sprite.body.velocity.y < -0.1) {
        this.sprite.anims.play('airUpMentor', true);
        this.flyFire.anims.play('fire_moveup', true);
      } else {
        this.sprite.anims.play('airIdleMentor', true);
        this.flyFire.anims.play('fire_idle', true);
      }

    } else {
      this.flyFire.setVisible(false);
      if (Math.abs(this.sprite.body.velocity.x) > 0.1) {
        this.sprite.anims.play('wRightMentor', true);
      } else {
        this.sprite.anims.play('idleMentor', true);
      }
    }
    this.flyFire.x = this.sprite.x;
    this.flyFire.y = this.sprite.y;

    if (this.isFiring) {
      this.sprite.setFlipX(this.scene.game.player.sprite.x < this.sprite.x);
    } else {
      if (this.sprite.body.velocity.x > 0.1) {
        this.sprite.setFlipX(false);
        this.flyFire.setFlipX(false);
      } else if (this.sprite.body.velocity.x < -0.1) {
        this.sprite.setFlipX(true);
        this.flyFire.setFlipX(true);
      }
    }
  }

  //moverse a un punto del mapa
  moveTo(pos) {
    this.reachedX = false;
    this.reachedY = false;
    this.objectiveX = pos.x;
    this.objectiveY = pos.y;
    this.speedVector.x = pos.x - this.sprite.x;
    this.speedVector.y = pos.y - this.sprite.y;

    this.speedVector.normalize().scale(this.speed);
  }

  //distancia al jugaodor
  distanceToPlayer(){
    if(this.sprite == undefined || this.sprite.body == undefined || this.scene.game.player == undefined || this.scene.game.player.sprite == undefined  || this.scene.game.player.sprite.body == undefined)
      return Number.MAX_SAFE_INTEGER;
    const distance = Math.sqrt(Math.pow(this.sprite.x - this.scene.game.player.sprite.x,2) + Math.pow(this.sprite.y - this.scene.game.player.sprite.y,2));
    if(distance == undefined)
      return Number.MAX_SAFE_INTEGER;
    else
      return Math.sqrt(Math.pow(this.sprite.x - this.scene.game.player.sprite.x,2) + Math.pow(this.sprite.y - this.scene.game.player.sprite.y,2));
  }
  //
}
