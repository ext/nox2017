#include "common.glsl"

uniform sampler2D texture0;

in vec2 uv;
in vec4 color;

layout(location = 0) out vec4 ocolor;

void main(void) {
	ocolor = color * texture(texture0, vec2(uv.s, uv.t));
}
