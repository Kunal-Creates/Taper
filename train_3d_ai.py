#!/usr/bin/env python3
"""
3D Object Generation AI Training Script
Trains an AI model to generate better Three.js code for 3D objects
"""

import json
import random
import re
from typing import List, Dict, Tuple
import openai
from pathlib import Path

class ThreeJSTrainer:
    def __init__(self):
        self.training_data = []
        self.geometries = {
            'sphere': 'SphereGeometry',
            'cube': 'BoxGeometry', 
            'cylinder': 'CylinderGeometry',
            'cone': 'ConeGeometry',
            'torus': 'TorusGeometry',
            'plane': 'PlaneGeometry',
            'ring': 'RingGeometry',
            'dodecahedron': 'DodecahedronGeometry',
            'icosahedron': 'IcosahedronGeometry',
            'octahedron': 'OctahedronGeometry',
            'tetrahedron': 'TetrahedronGeometry'
        }
        
        self.materials = {
            'standard': 'MeshStandardMaterial',
            'physical': 'MeshPhysicalMaterial',
            'basic': 'MeshBasicMaterial',
            'lambert': 'MeshLambertMaterial',
            'phong': 'MeshPhongMaterial'
        }
        
        self.colors = {
            'red': '0xff0000',
            'green': '0x00ff00', 
            'blue': '0x0000ff',
            'yellow': '0xffff00',
            'purple': '0x800080',
            'orange': '0xffa500',
            'pink': '0xffc0cb',
            'cyan': '0x00ffff',
            'gold': '0xffd700',
            'silver': '0xc0c0c0'
        }

    def generate_training_examples(self) -> List[Dict]:
        """Generate comprehensive training examples for 3D object creation"""
        examples = []
        
        # Basic shapes
        for shape, geometry in self.geometries.items():
            for color_name, color_hex in self.colors.items():
                prompt = f"Create a {color_name} {shape}"
                code = self.generate_code_template(shape, geometry, color_hex, color_name)
                examples.append({
                    'prompt': prompt,
                    'code': code,
                    'category': 'basic_shapes'
                })
        
        # Complex objects
        complex_objects = [
            ("spinning golden sphere", "sphere", "0xffd700", "metallic"),
            ("glowing blue cube", "cube", "0x0000ff", "emissive"),
            ("floating red cylinder", "cylinder", "0xff0000", "floating"),
            ("pulsing green torus", "torus", "0x00ff00", "pulsing"),
            ("rotating rainbow cone", "cone", "0xff0000", "rainbow"),
            ("transparent glass sphere", "sphere", "0x88ccff", "glass"),
            ("metallic silver cube", "cube", "0xc0c0c0", "metallic"),
            ("wooden brown cylinder", "cylinder", "0x8b4513", "wood"),
            ("crystal clear diamond", "octahedron", "0xffffff", "crystal"),
            ("glowing plasma ball", "sphere", "0xff00ff", "plasma")
        ]
        
        for prompt, shape, color, effect in complex_objects:
            geometry = self.geometries.get(shape, 'BoxGeometry')
            code = self.generate_advanced_code(shape, geometry, color, effect)
            examples.append({
                'prompt': prompt,
                'code': code,
                'category': 'advanced_objects'
            })
        
        return examples

    def generate_code_template(self, shape: str, geometry: str, color: str, color_name: str) -> str:
        """Generate basic Three.js code template"""
        
        # Geometry parameters based on shape
        params = {
            'SphereGeometry': '1.5, 32, 32',
            'BoxGeometry': '2, 2, 2',
            'CylinderGeometry': '1, 1, 3, 32',
            'ConeGeometry': '1.5, 3, 8',
            'TorusGeometry': '1.5, 0.5, 16, 100',
            'PlaneGeometry': '3, 3',
            'RingGeometry': '0.5, 1.5, 32',
            'DodecahedronGeometry': '1.5',
            'IcosahedronGeometry': '1.5',
            'OctahedronGeometry': '1.5',
            'TetrahedronGeometry': '1.5'
        }
        
        param = params.get(geometry, '1, 1, 1')
        
        # Basic animation based on shape
        animations = {
            'sphere': 'object.rotation.y += 0.02; object.position.y = Math.sin(Date.now() * 0.001) * 0.3;',
            'cube': 'object.rotation.x += 0.01; object.rotation.y += 0.01; object.rotation.z += 0.005;',
            'cylinder': 'object.rotation.y += 0.02; object.position.y = Math.sin(Date.now() * 0.001) * 0.2;',
            'cone': 'object.rotation.y += 0.015; object.position.y = Math.sin(Date.now() * 0.0015) * 0.4;',
            'torus': 'object.rotation.x += 0.01; object.rotation.y += 0.02;'
        }
        
        animation = animations.get(shape, 'object.rotation.x += 0.01; object.rotation.y += 0.01;')
        
        return f"""const geometry = new THREE.{geometry}({param});
const material = new THREE.MeshStandardMaterial({{ 
    color: {color}, 
    metalness: 0.3, 
    roughness: 0.4 
}});
const object = new THREE.Mesh(geometry, material);
object.castShadow = true;
object.receiveShadow = true;
object.userData.animate = () => {{ 
    {animation}
}};"""

    def generate_advanced_code(self, shape: str, geometry: str, color: str, effect: str) -> str:
        """Generate advanced Three.js code with special effects"""
        
        params = {
            'SphereGeometry': '1.5, 32, 32',
            'BoxGeometry': '2, 2, 2',
            'CylinderGeometry': '1, 1, 3, 32',
            'ConeGeometry': '1.5, 3, 8',
            'TorusGeometry': '1.5, 0.5, 16, 100',
            'OctahedronGeometry': '1.5'
        }
        
        param = params.get(geometry, '1, 1, 1')
        
        # Advanced materials and animations based on effect
        if effect == "metallic":
            material = f"new THREE.MeshStandardMaterial({{ color: {color}, metalness: 0.9, roughness: 0.1 }})"
            animation = "object.rotation.y += 0.02; object.material.metalness = 0.9 + Math.sin(Date.now() * 0.002) * 0.1;"
        elif effect == "emissive":
            material = f"new THREE.MeshStandardMaterial({{ color: {color}, emissive: {color}, emissiveIntensity: 0.3 }})"
            animation = "object.rotation.x += 0.01; object.rotation.y += 0.01; object.material.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.003) * 0.2;"
        elif effect == "floating":
            material = f"new THREE.MeshStandardMaterial({{ color: {color}, metalness: 0.2, roughness: 0.8 }})"
            animation = "object.rotation.y += 0.01; object.position.y = Math.sin(Date.now() * 0.001) * 1.5;"
        elif effect == "pulsing":
            material = f"new THREE.MeshStandardMaterial({{ color: {color}, metalness: 0.5, roughness: 0.3 }})"
            animation = "object.rotation.x += 0.005; object.rotation.y += 0.01; object.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.3);"
        elif effect == "rainbow":
            material = f"new THREE.MeshStandardMaterial({{ color: {color}, metalness: 0.3, roughness: 0.4 }})"
            animation = "object.rotation.y += 0.02; const time = Date.now() * 0.001; object.material.color.setHSL((time * 0.2) % 1, 0.8, 0.5);"
        elif effect == "glass":
            material = f"new THREE.MeshPhysicalMaterial({{ color: {color}, transmission: 0.9, opacity: 0.1, transparent: true, roughness: 0.0, metalness: 0.0 }})"
            animation = "object.rotation.x += 0.005; object.rotation.y += 0.01; object.position.y = Math.sin(Date.now() * 0.001) * 0.2;"
        elif effect == "wood":
            material = f"new THREE.MeshStandardMaterial({{ color: {color}, metalness: 0.0, roughness: 0.9 }})"
            animation = "object.rotation.y += 0.01;"
        elif effect == "crystal":
            material = f"new THREE.MeshPhysicalMaterial({{ color: {color}, transmission: 0.7, opacity: 0.3, transparent: true, roughness: 0.0, metalness: 0.1, clearcoat: 1.0 }})"
            animation = "object.rotation.x += 0.01; object.rotation.y += 0.015; object.rotation.z += 0.005;"
        elif effect == "plasma":
            material = f"new THREE.MeshStandardMaterial({{ color: {color}, emissive: {color}, emissiveIntensity: 0.5 }})"
            animation = "object.rotation.y += 0.03; const time = Date.now() * 0.001; object.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.3; object.material.color.setHSL((time * 0.5) % 1, 1, 0.5);"
        else:
            material = f"new THREE.MeshStandardMaterial({{ color: {color}, metalness: 0.3, roughness: 0.4 }})"
            animation = "object.rotation.x += 0.01; object.rotation.y += 0.01;"
        
        return f"""const geometry = new THREE.{geometry}({param});
const material = {material};
const object = new THREE.Mesh(geometry, material);
object.castShadow = true;
object.receiveShadow = true;
object.userData.animate = () => {{ 
    {animation}
}};"""

    def save_training_data(self, filename: str = "threejs_training_data.json"):
        """Save training data to JSON file"""
        examples = self.generate_training_examples()
        
        with open(filename, 'w') as f:
            json.dump(examples, f, indent=2)
        
        print(f"Generated {len(examples)} training examples saved to {filename}")
        return examples

    def create_prompt_templates(self) -> List[str]:
        """Create prompt templates for fine-tuning"""
        templates = [
            "You are an expert Three.js developer. Generate ONLY JavaScript code to create a 3D {object_type}.",
            "Create a Three.js {object_type} with {color} color and {material_type} material.",
            "Generate Three.js code for a {adjective} {object_type} that {animation_description}.",
            "Build a 3D {object_type} using Three.js with realistic {material_property} and smooth animation.",
        ]
        return templates

    def validate_generated_code(self, code: str) -> bool:
        """Validate that generated code follows Three.js patterns"""
        required_patterns = [
            r'const\s+geometry\s*=\s*new\s+THREE\.',
            r'const\s+material\s*=\s*new\s+THREE\.',
            r'const\s+object\s*=\s*new\s+THREE\.Mesh',
            r'object\.castShadow\s*=\s*true',
            r'object\.receiveShadow\s*=\s*true',
            r'object\.userData\.animate\s*='
        ]
        
        for pattern in required_patterns:
            if not re.search(pattern, code):
                return False
        return True

def main():
    """Main training function"""
    trainer = ThreeJSTrainer()
    
    print("🎨 Three.js AI Training System")
    print("=" * 40)
    
    # Generate training data
    training_data = trainer.save_training_data()
    
    # Validate some examples
    valid_count = 0
    for example in training_data[:10]:  # Check first 10
        if trainer.validate_generated_code(example['code']):
            valid_count += 1
    
    print(f"✅ Validation: {valid_count}/10 examples passed")
    
    # Create fine-tuning dataset format
    fine_tune_data = []
    for example in training_data:
        fine_tune_data.append({
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert Three.js developer. Generate only clean JavaScript code without any markdown formatting, comments, or explanations."
                },
                {
                    "role": "user", 
                    "content": f"Create Three.js code for: {example['prompt']}"
                },
                {
                    "role": "assistant",
                    "content": example['code']
                }
            ]
        })
    
    # Save fine-tuning dataset
    with open('threejs_finetune_dataset.jsonl', 'w') as f:
        for item in fine_tune_data:
            f.write(json.dumps(item) + '\n')
    
    print(f"💾 Fine-tuning dataset saved: {len(fine_tune_data)} examples")
    print("🚀 Training data generation complete!")
    
    # Print some example prompts and codes
    print("\n📝 Sample Training Examples:")
    print("-" * 30)
    for i, example in enumerate(training_data[:3]):
        print(f"\nExample {i+1}:")
        print(f"Prompt: {example['prompt']}")
        print(f"Code Preview: {example['code'][:100]}...")

if __name__ == "__main__":
    main()