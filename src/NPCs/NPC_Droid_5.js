import Audio from "../Audio.js";
import FiniteStateMachine from "../FiniteStateMachine.js"
import Dialog from "../Plugins/Dialog.js"

//Clase padre de todos los enemigos
export default class NPC_Droid_5 extends FiniteStateMachine{
  constructor(scene, x, y){
    super();
    //inicializacion
    this.scene = scene;
    this.sprite = scene.add.sprite(x,y,'npc5',0).setScale(1.5);
    this.sprite.setInteractive();
    this.sprite.playerInteractable = true;
    this.isTalking = false;
    this.enemiesLeft = 0;

    this.sprite.setOrigin(0.5,0.75);
    this.sprite.anims.play('npc5',true);

    //arma que proporciona al jugador
    this.weaponToGive = 6;
    /*
    0 - balas normales
    1 - balas rapidas
    2 - balas explosivas
    3 - balas rebotantes
    4 - bombas normales
    5 - bombas megaton
    6 - misiles
    7 - misiles que se separan en bombas
    8 - laser
    */

    //aray de dialogos
    this.dialogArray = [];
    this.dialogArray[0] =
`[b]Vagrant Droid #5[/b]
Please, come save me!
I need your help!`;

    this.dialogArray[1] =
`[b]Vagrant Droid #5[/b]
Thank you very much for your help!
You saved me! I must befriend you!
[b]Vagrant Droid #5[/b]
Oh, sorry, I didn't mean I must, I mean, I
want to know you! What's your name?
[b]`+ this.scene.game.playerName +`[/b]
My name is `+ this.scene.game.playerName +`.

[b]FR3UD[/b]
A pleasure to meet you, `+ this.scene.game.playerName +`.
My name is FR3UD. I hope you like it.
[b]FR3UD[/b]
Why should you like my name? Well, I think
it is a good name, but maybe I only think so
[b]FR3UD[/b]
because that's the way others tend to see it. I'm
not sure if I like myself... my self-concept
[b]FR3UD[/b]
is always based on the concept others have of me.
Do you think that's weird? Maybe I do too, then.
[b]FR3UD[/b]
Anyways, now that you saved me, I guess we can be
friends! Would you like to be my friend?
[b]FR3UD[/b]
I think that's why I came here, to this tower;
because I felt lonely... didn't you too?
[b]FR3UD[/b]
But now that I think of it... maybe accompanying you
isn't a good idea. I don't want to get hurt...
[b]FR3UD[/b]
Maybe I'm afraid to love after all. Even if I'm
lonely, we are never so defenceless against
[b]FR3UD[/b]
suffering as when we love others.
But thanks to you, I know myself better than before,
[b]FR3UD[/b]
and I think that's all I searched for in this tower.
Now, I must reward you both for saving my life and
[b]FR3UD[/b]
for helping me conciliate with my ego.
Take this, `+ this.scene.game.playerName +`:
OBTAINED PLUGIN WEAPON: GUIDED MISSILES


[b]FR3UD[/b]
Unlike us, these missiles will follow their target
until they join together in an... explosive way.
[b]FR3UD[/b]
They're very powerful, but keep in mind, they
also require energy!
[b]FR3UD[/b]
Thank you, again. At first, I only wanted you to
save me because I needed it, and I only talked to
[b]FR3UD[/b]
you because I felt like I should, but after all
I was wrong, and I really wanted to meet you.
[b]FR3UD[/b]
Maybe I'm not strong enough to accompany you,
and I hate being so weak, but from error to
[b]FR3UD[/b]
error, one discovers the entire truth. Don't
surrender in discovering your own self.
[b]FR3UD[/b]
Remember: One day, in retrospect, the years of
struggle will strike you as the most beautiful.
[b]FR3UD[/b]
Farewell!`;

    this.dialogArray[2] =
`[b]FR3UD[/b]
Remember: One day, in retrospect, the years of
struggle will strike you as the most beautiful.
[b]FR3UD[/b]
Farewell!`;

    this.currentDialog = -1;

    //al presionar el sprite se activa el dialogo
    this.sprite.on('pointerdown', function() {
      if(!this.isTalking){
        this.isTalking = true;
        this.sprite.setFlipX(this.scene.game.player.sprite.x < this.sprite.x)
        this.scene.dialogManager.setCurrentSpeaker(this);
        this.scene.dialogManager.textBox.start(this.dialogArray[this.currentDialog],30);
        this.scene.dialogManager.showDialogBox();
      }
    }, this);

    //IA
    //se preparan el nº de estados que tiene la FSM, que hace cuando empieza, acaba y update de cada estado
    //this.initializeAI(4);
    this.initializeAI(3);
    this.stateOnStart(0, function(){
    this.currentDialog = 0;
    });
    this.stateOnStart(1, function(){
      this.currentDialog = 1;
    });
    this.stateOnStart(2, function(){
      this.currentDialog = 2;
    })
    this.startAI();


  }
  //termina de hablar y al matar los enemigos que le rodean da su arma al jugador
  finishedDialog(){
    this.isTalking = false;
    if(this.currentStateId()==1){
      this.scene.game.obtainedWeapons.push(this.weaponToGive);
      this.scene.game.player.recieveWeapon(this.weaponToGive);
      console.log("arma conseguida");
      this.goTo(2);
      this.scene.game.npcHelped++;
      this.scene.game.points += 500;
    }
    else if(this.currentStateId() == 0 && this.enemiesLeft<=0){
      this.goTo(1);
    }
  }

  //al matar a un enemigo que le rodea se actualiza este valor
  enemyKilled(){
    this.enemiesLeft --;
    if(this.enemiesLeft<=0){
      Audio.clearNPC(this.scene);
    }
    if(this.enemiesLeft<=0 && !this.isTalking)
      this.goTo(1);
  }
}
