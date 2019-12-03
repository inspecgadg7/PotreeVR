export class VRMapControls{

	constructor(viewer){

		this.viewer = viewer;

		this.snLeft = this.createControllerModel();
		this.snRight = this.createControllerModel();
		
		this.viewer.scene.scene.add(this.snLeft.node);
		this.viewer.scene.scene.add(this.snRight.node);
		this.a=1;
		

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
	
	copyPad(pad){
		const buttons = pad.buttons.map(b => {return {pressed: b.pressed}});

		const pose = {
			position: new Float32Array(pad.pose.position),
			orientation: new Float32Array(pad.pose.position),
		};

		const copy = {
			buttons: buttons,
			pose: pose, 
			hand: pad.hand,
			index: pad.index,
		};

		return copy;
	}

	update(){
		
		const {selection, viewer, snLeft, snRight} = this;
		const vr = viewer.vr;

		const vrActive = vr && vr.display.isPresenting;

		snLeft.node.visible = vrActive;
		snRight.node.visible = vrActive;

		if(!vrActive){

			return;
		}

		const pointclouds = viewer.scene.pointclouds;

		
		const gamepads = Array.from(navigator.getGamepads()).filter(p => p !== null).map(this.copyPad);
		if (this.a==5){
			console.log(Array.from(navigator.getGamepads()));
			console.log(gamepads);
			console.log(this.viewer.scene.view.direction);
		}
		this.a+=1;
		
		const toScene = (position) => {
			return new THREE.Vector3(position.x, -position.z, position.y);
		};
		
		const left = gamepads.find(gp => gp.hand && gp.hand === "left");
		const right = gamepads.find(gp => gp.hand && gp.hand === "right");
		
		const triggeredTP = gamepads.filter(gamepad => {
			return gamepad.buttons[1].pressed;
		});	
		
		
		if(this.a%300==0){
			
			this.viewer.scene.view.position.x += 5*this.viewer.scene.view.direction.x,
			this.viewer.scene.view.position.y += 5*this.viewer.scene.view.direction.y,
			this.viewer.scene.view.position.z += 5*this.viewer.scene.view.direction.z
			
			///this.viewer.scene.view.position.copy(this.viewer.scene.view.position.x += 5*this.viewer.scene.view.direction.x,this.viewer.scene.view.position.y += 5*this.viewer.scene.view.direction.y,this.viewer.scene.view.position.z += 5*this.viewer.scene.view.direction.z);
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