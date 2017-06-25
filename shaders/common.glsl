#version 300 es

precision mediump float;

layout(std140) uniform projectionViewMatrices {
   mat4 projectionViewMatrix;
   mat4 projectionMatrix;
   mat4 viewMatrix;
};

layout(std140) uniform modelMatrices {
   mat4 modelMatrix;
};
