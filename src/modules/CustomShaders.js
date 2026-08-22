import * as THREE from 'three';

/**
 * Adds a custom Fresnel rim-light term on top of Three's built-in PBR (MeshStandardMaterial) via onBeforeCompile, instead of writing a full
 * ShaderMaterial from scratch. This keeps physically based lighting, shadows, and environment reflections intact while layering a bespoke
 * GLSL effect on top — the same approach used for "dissolve" or "hologram" transitions in production configurators.
 *
 * Uniforms (fresnelBias / fresnelScale / fresnelPower) are attached to material.userData.fresnelUniforms so the Debug panel can drive them live with lil-gui sliders.
 */
export function attachFresnel(material, color = '#49d5e8') {
  const uniforms = {
    fresnelBias: { value: 0.05 },
    fresnelScale: { value: 0.0 }, // 0 = disabled by default
    fresnelPower: { value: 2.2 },
    fresnelColor: { value: new THREE.Color(color) },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vFresnelNormal;
         varying vec3 vFresnelView;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vFresnelNormal = normalize(normalMatrix * normal);
         vFresnelView = -normalize((modelViewMatrix * vec4(position, 1.0)).xyz);`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float fresnelBias;
         uniform float fresnelScale;
         uniform float fresnelPower;
         uniform vec3 fresnelColor;
         varying vec3 vFresnelNormal;
         varying vec3 vFresnelView;`
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         // --- Custom Fresnel rim term ---
         float fresnel = fresnelBias + fresnelScale * pow(1.0 + dot(vFresnelView, vFresnelNormal), fresnelPower);
         gl_FragColor.rgb += fresnelColor * clamp(fresnel, 0.0, 1.0);`
      );
  };

  material.userData.fresnelUniforms = uniforms;
  material.needsUpdate = true;
  return uniforms;
}

/** Reads the live fresnelScale for a material, defaulting to 0 if not attached. */
export function getFresnelScale(material) {
  return material?.userData?.fresnelUniforms?.fresnelScale?.value ?? 0;
}

export function setFresnelScale(material, value) {
  if (material?.userData?.fresnelUniforms) {
    material.userData.fresnelUniforms.fresnelScale.value = value;
  }
}
