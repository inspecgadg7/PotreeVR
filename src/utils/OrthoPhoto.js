import {BoxVolume} from "./Volume.js";
import {VolumeTool} from "../utils/VolumeTool.js";
import {ScreenBoxSelectTool} from "../utils/ScreenBoxSelectTool.js"
import {ClipPhoto, PreviewStatus, ClipTask} from "../defines.js"
import {Utils} from "../utils.js";

export class OrthoPhoto{
	constructor(viewer){
		
		this.viewer = viewer;
		this.item = new BoxVolume();
		this.numClip = 0;
	}
	
	//Called each time photography icon clicked
	
	createBoxVolume(){
		//If there was already a volume, remove it
		if (this.numClip==1){
			this.viewer.scene.removeAllClipVolumes();
		}
		
		//Creates a ScreenboxSelectTool if selected
		if (this.viewer.clipPhoto == ClipPhoto.SCREENBOX){
			let boxSelectTool = new ScreenBoxSelectTool(this.viewer);
			this.item = boxSelectTool.startInsertion();
						
		}
		//Creates a VolumeTool if selected
		else if (this.viewer.clipPhoto == ClipPhoto.VOLUMEBOX){
			let volumeTool = new VolumeTool(this.viewer);
			this.item = volumeTool.startInsertion({clip: true});
		}
		this.numClip = 1;
							
	}
	
	//Triggered each time SETUP/PREVIEW clicked
	
	actualizeMode(){
		
		//Case SETUP 
		
		if (this.viewer.previewStatus == PreviewStatus.SETUP){
			//HIGHLIGHT selected zone
			this.viewer.setClipTask(ClipTask.HIGHLIGHT);
			//borders are visible and can be selected to adjust size
			this.item.visible = true;			
			
		}
		
		//Case PREVIEW	
		
		else if (this.viewer.previewStatus == PreviewStatus.PREVIEW){
			//Only SHOW_INSIDE selected zone
			this.viewer.setClipTask(ClipTask.SHOW_INSIDE);
			//borders not visible
			this.item.visible = false;
			
			let maxScale = Math.max(...this.item.scale.toArray());
			let minScale = Math.min(...this.item.scale.toArray());
			let handleLength = Math.abs(this.item.scale.dot(new THREE.Vector3(0,0,1)));
			let alignment = new THREE.Vector3(0,0,1).multiplyScalar(2*minScale / handleLength);
			alignment.applyMatrix4(this.item.matrixWorld);
			let newCamPos = alignment;
			let newCamTarget = this.item.getWorldPosition(new THREE.Vector3());
			
			//Camera is moved to the top of the clipping box
			Utils.moveTo(this.viewer.scene, newCamPos, newCamTarget);
		}
	}
}