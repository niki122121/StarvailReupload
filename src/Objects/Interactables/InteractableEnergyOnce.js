import Interactable from "./Interactable.js"
import DropableGroundEnergy from "../Dropables/DropableGroundEnergy.js"
export default class InteractableEnergyOnce extends Interactable {
  constructor(scene, x, y, energy){
    super(scene, x, y, 'star', true, false);
    this.sprite.setScale(2);
    this.spSize = 2;
    this.spChangeSpeed = 0.005;
    this.spMaxSize = 2;
    this.spMinSize = 1.8;

    this.energy = energy
  }

  onActivated(){
    super.onActivated();
    new DropableGroundEnergy(this.scene, this.sprite.x, this.sprite.y, Phaser.Math.Between(-1.6, 1.6),  this.energy);
  }

  onPermaDeactivated(){
    this.sprite.destroy();
  }
}
