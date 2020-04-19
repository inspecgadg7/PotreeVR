import {Utils} from "../utils.js";


export class VRMapControls{

	constructor(viewer){

		this.viewer = viewer;
		this.domElement=this.viewer.renderer.domElement;
		this.previousPads = [];

		this.snLeft = this.createControllerModel();
		this.snRight = this.createControllerModel();
					
		this.viewer.scene.scene.add(this.snLeft.node);
		this.viewer.scene.scene.add(this.snRight.node);	
		
		this.speed=20;
		this.rotationSpeed=20;
		this.prevTriggerTP=false;
	}

	createControllerModel(){
		const geometry = new THREE.SphereGeometry(1, 32, 32);
		const material = new THREE.MeshLambertMaterial( { color: 0xff0000, side: THREE.DoubleSide, flatShading: true } );
		const node = new THREE.Mesh(geometry, material);

		node.position.set(0, 0, 0.5);
		node.scale.set(0.02, 0.02, 0.02);
		node.visible = false;

		viewer.scene.scene.add(node);

		const controller = {
			node: node,
		};
		//viewer.scene.scene.add(node);

		return controller;
	}
	
	debugLine(start, end, index, color){

		if(typeof this.debugLines === "undefined"){

			const geometry = new THREE.SphereGeometry(1, 8, 8);

			this.debugLines = {
				geometry: geometry,
			};
		}

		const n = 100;

		if(!this.debugLines[index]){
			const geometry = this.debugLines.geometry;
			const material = new THREE.MeshBasicMaterial({color: color});
			const nodes = [];

			for(let i = 0; i <= n; i++){
				const u = i / n;

				const node = new THREE.Mesh(geometry, material);

				const position = new THREE.Vector3().addVectors(
					start.clone().multiplyScalar(1-u),
					end.clone().multiplyScalar(u)
				);

				node.position.copy(position);
				node.scale.set(0.002, 0.002, 0.002);
				this.viewer.scene.scene.add(node);
				nodes.push(node);
			}

			const debugLine = {
				material: material,
				nodes: nodes,
			};

			this.debugLines[index] = debugLine;
		}else{
			const debugLine = this.debugLines[index];

			for(let i = 0; i <= n; i++){
				const node = debugLine.nodes[i];
				const u = i / n;

				const position = new THREE.Vector3().addVectors(
					start.clone().multiplyScalar(1-u),
					end.clone().multiplyScalar(u)
				);

				node.position.copy(position);
			}
		}


	}

	getPointcloudsAt(pointclouds, position){

		const I = [];
		for(const pointcloud of pointclouds){

			const world = pointcloud.matrixWorld;
			const worldToObject = new THREE.Matrix4().getInverse(world);

			const center = position.clone();
			const radius = 0.01;
			//const radius = node.scale.x;
			const sphere = new THREE.Sphere(center, radius);
			sphere.applyMatrix4(worldToObject);

			const box = pointcloud.boundingBox;
			const intersects = box.intersectsSphere(sphere);

			if(intersects){
				I.push(pointcloud);
			}
		}

		return I;
	}

	copyPad(pad){
		const buttons = pad.buttons.map(b => {return {touched: b.touched,pressed: b.pressed}});

		const axes = pad.axes;

		const pose = {
			position: new Float32Array(pad.pose.position),
			orientation: new Float32Array(pad.pose.orientation)
		};

		const copy = {
			buttons: buttons,
			pose: pose, 
			hand: pad.hand,
			index: pad.index,
			axes: pad.axes
		};

		return copy;
	}

	previousPad(gamepad){
		return this.previousPads.find(c => c.index === gamepad.index);
	}
	distance(point1,point2){
		return Math.sqrt(point1.x^2+point2.x^2+point3.x^2);
	}
	getIntersectionPointCloud(){
		let camera = this.viewer.scene.getActiveCamera();
		let mouse = {
			x:this.domElement.clientWidth/2,
			y:this.domElement.clientHeight/2
			}
		let I = Utils.getMousePointCloudIntersection(
			mouse,
			camera,
			this.viewer,
			this.viewer.scene.pointclouds,
			{pickClipped: true});

		if (I === null) {
			return;
		}
		//console.log(I);
		return I.point.position;
		
	}

	update(){
		const {viewer, snLeft, snRight} = this;
		
		const pointclouds = viewer.scene.pointclouds;
		
		const vr = viewer.vr;

		const vrActive = vr && vr.display.isPresenting;

		snLeft.node.visible = vrActive;
		snRight.node.visible = vrActive;

		if(!vrActive){

			return;
		}
				
		const gamepads = Array.from(navigator.getGamepads()).filter(p => p !== null).map(this.copyPad);
				
		const getPad = (list, pattern) => list.find(pad => pad.index === pattern.index);
		
		if(this.previousPads.length !== gamepads.length){
			this.previousPads = gamepads;
		}

		const left = gamepads.find(gp => gp.hand && gp.hand === "left");
		const right = gamepads.find(gp => gp.hand && gp.hand === "right");
				
		const toScene = (position) => {
			return new THREE.Vector3(position.x, -position.z, position.y);
		};
				
		//MOVE THE VIEW
		
		let speedX = 0;
		let speedY = 0;
		let speedZ = 0;
		
		let rotationY = 0;
		let rotationZ = 0;
		
		let triggerA = false;
		let triggerB = false;
		
		let triggerX = false;
		let triggerY = false;
		
		let justTriggeredTP = false;
		let gamepadPos = 0;
		
		let justTriggeredMoveToPoint = false;
		
		const positionHeadVR=vr.frameData.pose.position;
		
		for (let gamepad of gamepads){
			if (gamepad.hand=="right"){
				speedX=-1*gamepad.axes[0];                                                                  
				speedY=gamepad.axes[1];
				                                  
				triggerA=gamepad.buttons[3].pressed;
				triggerB=gamepad.buttons[4].pressed;
				
				const prev = this.previousPad(gamepad);
				if (!prev.buttons[1].pressed && gamepad.buttons[1].pressed){
					justTriggeredTP=true;
					gamepadPos=gamepad.pose.position;
				}
				
			}
			else if (gamepad.hand="left"){
				rotationY=gamepad.axes[0];
				//rotationZ=gamepad.axes[1];
				
				triggerX=gamepad.buttons[3].pressed;
				triggerY=gamepad.buttons[4].pressed;
				
				const prev = this.previousPad(gamepad);
				if (!prev.buttons[1].pressed && gamepad.buttons[1].pressed){
					justTriggeredMoveToPoint=true;
					gamepadPos=gamepad.pose.position;
				}
			}
		}
		
		//Trigger a TP in the direction of the gamepad
		
		if (justTriggeredTP==true){
			let dirX=positionHeadVR[0]-gamepadPos[0];
			let dirY=positionHeadVR[1]-gamepadPos[1];
			let dirZ=positionHeadVR[2]-gamepadPos[2];
			const normDir=Math.sqrt(dirX^2+dirY^2+dirZ^2);
			dirX=dirX/normDir;
			dirY=dirY/normDir;
			dirZ=dirZ/normDir;
			//direction x -z y
			if (gamepadPos.length>0){
				for (let pointcloud of pointclouds){
					const moveSpeed=1/10*this.speed;
					pointcloud.position.x += moveSpeed*dirX;
					pointcloud.position.y += moveSpeed*-1*dirZ; 
					pointcloud.position.z += moveSpeed*dirY;
				}
			}
		}
		
		//Instantaneous tp to a point of the pointcloud
		
		if (justTriggeredMoveToPoint==true){
			const newPos=this.getIntersectionPointCloud();	
			if (newPos !=null){
				const moveX=positionHeadVR[0]-newPos.x;
				const moveY=positionHeadVR[1]-newPos.y;
				const moveZ=positionHeadVR[2]-newPos.z;
				for (let pointcloud of pointclouds){
					pointcloud.position.x+=moveX;
					pointcloud.position.y+=moveY;
					pointcloud.position.z+=moveZ;
				}				
			}				
		}
				
		//Do Increase/Decrease moving speed if button Y/X pressed
		
		if (triggerX && triggerY){
		}
		else if (triggerX){
			this.speed/=1.02;
		}
		else if (triggerY){
			this.speed*=1.02;
		}
		
		//Go Up/down if button B/A pressed
		if (triggerA && triggerB){
			speedZ=0;
		}
		else if (triggerA){
			speedZ=1/1000*this.speed;
		}
		else if (triggerB){
			speedZ=-1*1/1000*this.speed;
		}
		
		//move all pointclouds
				
		const orientationVR=vr.frameData.pose.orientation;		
		let angle=orientationVR[1]*Math.PI;
		
		for (let pointcloud of pointclouds){
			const moveSpeed=1/1000*this.speed;
			pointcloud.position.x += moveSpeed*speedX*Math.cos(angle)-1*moveSpeed*speedY*Math.sin(angle); 
			pointcloud.position.y += moveSpeed*speedX*Math.sin(angle)+moveSpeed*speedY*Math.cos(angle); 
			pointcloud.position.z += speedZ;
		}
		
		{ // MOVE CONTROLLER SCENE NODE
			if(right){
				const {node, debug} = snLeft;
				const position = toScene(new THREE.Vector3(...right.pose.position));
				node.position.copy(position);
			}
			
			if(left){
				const {node, debug} = snRight;				
				const position = toScene(new THREE.Vector3(...left.pose.position));
				node.position.copy(position);
			}
		}

		this.previousPads = gamepads;
		
		
	}
};