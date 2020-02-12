export class VRMapControls{

	constructor(viewer){

		this.viewer = viewer;

		this.previousPads = [];

		this.snLeft = this.createControllerModel();
		this.snRight = this.createControllerModel();
					
		this.viewer.scene.scene.add(this.snLeft.node);
		this.viewer.scene.scene.add(this.snRight.node);	
		
		this.a=0;
		this.speedXY;
		
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
			position: new Float32Array(pad.pose.position)
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

	update(){
		this.a++;
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
		
		if (this.a%400==0){
			//console.log(Array.from(navigator.getGamepads()));
		}	
		
		const getPad = (list, pattern) => list.find(pad => pad.index === pattern.index);
		
		if(this.previousPads.length !== gamepads.length){
			this.previousPads = gamepads;
		}

		const left = gamepads.find(gp => gp.hand && gp.hand === "left");
		const right = gamepads.find(gp => gp.hand && gp.hand === "right");
				
		const triggered=[];
		const justTriggered=[];
		const justUntriggered=[];
		
		//Status of the trigger/Untrigger of every button at the beginning of every loop
		/*
		
		for (let i=0;i<5;i++){			
			triggered.push(gamepads.filter(gamepad => {
				return gamepad.buttons[i].pressed;
			}));	
			
			justTriggered.push(triggered.filter(gamepad => {
				const prev=this.previousPad(gamepad);
				const previouslyTriggered=prev.buttons[i].pressed;
				const currentlyTriggered=gamepad.buttons[i].pressed;
				return !previouslyTriggered && currentlyTriggered;
			}));

			justUntriggered.push(gamepads.filter(gamepad => {
				prev=this.previousPad(gamepad);
				const previouslyTriggered = prev.buttons[i].pressed;
				const currentlyTriggered = gamepad.buttons[i].pressed;
				return previouslyTriggered && !currentlyTriggered;
			}));
			
			
		}
		
		*/
		const toScene = (position) => {
			return new THREE.Vector3(position.x, -position.z, position.y);
		};
		
		//MOVE THE VIEW
		
		let speedX = 0;
		let speedY = 0;
		let speedZ = 0;
		let rotationY = 0;
		let rotationZ = 0;
		for (let gamepad of gamepads){
			if (gamepad.hand=="right"){
				speedX=-1*gamepad.axes[0];
				speedY=gamepad.axes[1];
			}
			if (gamepad.hand="left"){
				rotationY=-1*gamepad.axes[0];
				rotationZ=gamepad.axes[1];
			}
		}
		console.log(viewer.scene.view.direction.x);		
		
		for (let pointcloud of pointclouds){
			pointcloud.position.x+=1/50*speedX;
			pointcloud.position.y+=1/50*speedY;
			pointcloud.position.z+=speedZ;
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