import {BoxVolume} from "./Volume.js";
import {VolumeTool} from "../utils/VolumeTool.js";
import {ScreenBoxSelectTool} from "../utils/ScreenBoxSelectTool.js"
import {ClipPhoto, PreviewStatus, ClipTask} from "../defines.js"
import {Utils} from "../utils.js";

export class OrthoPhoto{
	constructor(viewer){
		
		this.viewer = viewer;
		this.item = new BoxVolume();
	}
	
	start(){
		if (this.viewer.clipPhoto == ClipPhoto.SCREENBOX){
			let boxSelectTool = new ScreenBoxSelectTool(this.viewer);
			this.item = boxSelectTool.startInsertion();
						
		}
		else if (this.viewer.clipPhoto == ClipPhoto.VOLUMEBOX){
			let volumeTool = new VolumeTool(this.viewer);
			this.item = volumeTool.startInsertion({clip: true});
		}
								
	}
	actualizeMode(){
		if (this.viewer.previewStatus == PreviewStatus.SETUP){
			this.viewer.setClipTask(ClipTask.HIGHLIGHT);
			this.item.visible = true;			
			
		}
				
		else if (this.viewer.previewStatus == PreviewStatus.PREVIEW){
			//this.viewer.setClipTask(ClipTask.SHOW_INSIDE);
			this.item.visible = false;
			
			/*
						
			let maxScale = Math.max(...this.item.scale.toArray());
			let minScale = Math.min(...this.item.scale.toArray());
			let handleLength = Math.abs(this.item.scale.dot(new THREE.Vector3(0,0,1)));
			let alignment = new THREE.Vector3(0,0,1).multiplyScalar(2 * maxScale / handleLength);
			alignment.applyMatrix4(this.item.matrixWorld);
			let newCamPos = alignment;
			let newCamTarget = this.item.getWorldPosition(new THREE.Vector3());

			Utils.moveTo(this.viewer.scene, newCamPos, newCamTarget);
			
			*/	
			
			let maxScale = Math.max(...this.item.scale.toArray());
			let minScale = Math.min(...this.item.scale.toArray());
			let handleLength = Math.abs(this.item.scale.dot(new THREE.Vector3(0,0,1)));
			let alignment = new THREE.Vector3(0,0,1).multiplyScalar(2*minScale / handleLength);
			alignment.applyMatrix4(this.item.matrixWorld);
			let newCamPos = alignment;
			let newCamTarget = this.item.getWorldPosition(new THREE.Vector3());

			Utils.moveTo(this.viewer.scene, newCamPos, newCamTarget);
		}
	}
}