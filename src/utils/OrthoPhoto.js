import {BoxVolume} from "./Volume.js";
import {VolumeTool} from "../utils/VolumeTool.js";
import {ScreenBoxSelectTool} from "../utils/ScreenBoxSelectTool.js"
import {ClipPhoto, PreviewStatus, ClipTask} from "../defines.js"

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
			this.viewer.setClipTask(ClipTask.SHOW_INSIDE);
			this.item.visible = false;
			
		}
	}
}