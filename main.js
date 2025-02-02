import * as THREE from 'three';

const questions = [
    "Who built Stonehenge?",
    "What happened to the Mary Celeste?",
    "Where will innovation take us next?",
    "What happened to the vanished colonists at Roanoke?"
];

class TypeWriter {
    constructor(textElement, words, waitTime = 3000) {
        this.textElement = textElement;
        this.words = words;
        this.waitTime = waitTime;
        this.txt = '';
        this.wordIndex = 0;
        this.isDeleting = false;
        this.type();
    }

    type() {
        const currentWord = this.words[this.wordIndex];
        const typeSpeed = this.isDeleting ? 50 : 100;

        if (this.isDeleting) {
            this.txt = currentWord.substring(0, this.txt.length - 1);
        } else {
            this.txt = currentWord.substring(0, this.txt.length + 1);
        }

        this.textElement.textContent = this.txt;

        if (!this.isDeleting && this.txt === currentWord) {
            // Wait before starting to delete
            setTimeout(() => {
                this.isDeleting = true;
                this.type();
            }, this.waitTime);
            return;
        } else if (this.isDeleting && this.txt === '') {
            this.isDeleting = false;
            // Move to next word
            this.wordIndex = (this.wordIndex + 1) % this.words.length;
            // Small pause before typing next word
            setTimeout(() => this.type(), 500);
            return;
        }

        setTimeout(() => this.type(), typeSpeed);
    }
}



class Globe {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.pins = [];
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('globe-container').appendChild(this.renderer.domElement);

        // Create wireframe sphere
        const geometry = new THREE.SphereGeometry(5, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);

        // Position camera
        this.camera.position.z = 15;

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Start animation and pin dropping
        this.animate();
        this.scheduleNextPin();
    }

    createPin() {
        const pinGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
        const pinMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const pin = new THREE.Mesh(pinGeometry, pinMaterial);

        // Random position on sphere surface
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const radius = 5;

        pin.position.x = radius * Math.sin(theta) * Math.cos(phi);
        pin.position.y = radius * Math.sin(theta) * Math.sin(phi);
        pin.position.z = radius * Math.cos(theta);

        // Orient pin to point outward from sphere center
        pin.lookAt(0, 0, 0);
        pin.rotateX(Math.PI / 2);

        this.scene.add(pin);
        this.pins.push({
            mesh: pin,
            createdAt: Date.now(),
            lifespan: 3000 // 3 seconds
        });
    }

    scheduleNextPin() {
        const delay = 1000 + Math.random() * 2000; // Random delay between 1-3 seconds
        setTimeout(() => {
            this.createPin();
            this.scheduleNextPin();
        }, delay);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate sphere
        this.sphere.rotation.y += 0.002;
        this.sphere.rotation.x += 0.001;

        // Update pins
        const now = Date.now();
        this.pins = this.pins.filter(pin => {
            const age = now - pin.createdAt;
            if (age > pin.lifespan) {
                this.scene.remove(pin.mesh);
                return false;
            }
            // Fade out pin
            pin.mesh.material.opacity = 1 - (age / pin.lifespan);
            return true;
        });

        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const textElement = document.querySelector('.typed-text');
    new TypeWriter(textElement, questions);
    new Globe();
});