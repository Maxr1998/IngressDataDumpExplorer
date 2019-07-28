const vertexShaderSrc = `
attribute vec2 position;
uniform vec2 panning;
uniform vec2 canvasSize;
uniform float zoom;
uniform vec4 color;

varying vec4 vColor;

void main()  {
    float divideFactor = exp2(18.0 - zoom);
    vec2 xy = ((position - panning) / canvasSize / vec2(divideFactor)) - vec2(0.5);
    gl_Position = vec4(xy * vec2(2.0, -2.0), 0.0, 1.0);
    gl_PointSize = max(3.2, 0.00055 * pow(zoom, 3.5));

    vColor = color;
}`;

const fragmentShaderSrc = `
precision mediump float;

varying vec4 vColor;

void main() {
    gl_FragColor = vColor;
}`;

var leafletMap;
var customLayer;
var gl;
var appProgramInfo;
var appProgramData;
var data;

class CustomLayer extends L.CanvasLayer {

    constructor() {
        super();
        this.supported = true;
    }

    initContext() {
        var canvas = this._canvas;
        gl = canvas.getContext('webgl');
        if (!gl) {
            this.supported = false;
            return false;
        }
        return true;
    }

    onLayerDidMount() {
        if (!gl && (!this.supported || !this.initContext()))
            return;
        if (!appProgramInfo) {
            // Create shaders and program
            var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
            var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
            var program = createProgram(gl, vertexShader, fragmentShader);

            appProgramInfo = {
                program: program,
                attribLocations: {
                    position: gl.getAttribLocation(program, 'position'),
                },
                uniformLocations: {
                    panning: gl.getUniformLocation(program, 'panning'),
                    canvasSize: gl.getUniformLocation(program, 'canvasSize'),
                    zoom: gl.getUniformLocation(program, 'zoom'),
                    color: gl.getUniformLocation(program, 'color'),
                },
            };

            // Use program
            gl.useProgram(appProgramInfo.program);

            if (!data)
                return;

            // Crate data buffers
            appProgramData = {
                portalsBuffer: gl.createBuffer(),
                portalsSize: data.portals.length,
                drawPortals: true,
                visitsBuffer: gl.createBuffer(),
                visitsSize: data.visits.length,
                drawVisits: true,
                capturesBuffer: gl.createBuffer(),
                capturesSize: data.captures.length,
                drawCaptures: true,
            };

            // Bind data
            this.bindData();
        }
    }

    onLayerWillUnmount() {
        gl = undefined;
        appProgramInfo = undefined;
        appProgramData = undefined;
    }

    bindData() {
        var map = this._map;
        if (!appProgramData)
            return;

        function bindBuffer(buffer, bufferData) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(
                // Project LatLong data onto WebMercator canvas
                bufferData.map(x => map.project(L.latLng(x), 18)._round().toArray()).flat()
            ), gl.STATIC_DRAW);
            return buffer;
        }

        bindBuffer(appProgramData.portalsBuffer, data.portals);
        bindBuffer(appProgramData.visitsBuffer, data.visits);
        bindBuffer(appProgramData.capturesBuffer, data.captures);
    }

    onDrawLayer(_info) {
        var map = this._map;
        if (!appProgramInfo || !appProgramData)
            return;

        // Clear buffer
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Set map uniforms
        updateMapUniforms(map);

        function draw(buffer, size, color) {
            // Bind buffer to vertex shader attribute
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(appProgramInfo.attribLocations.position, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(appProgramInfo.attribLocations.position);

            // Set color uniform
            gl.uniform4fv(appProgramInfo.uniformLocations.color, color);

            // Draw!
            gl.drawArrays(gl.POINTS, 0, size);
        }

        if (appProgramData.portalsSize > 0 && appProgramData.drawPortals)
            draw(appProgramData.portalsBuffer, appProgramData.portalsSize, [0.72, 0.11, 0.11, 1.0]);
        if (appProgramData.drawVisits)
            draw(appProgramData.visitsBuffer, appProgramData.visitsSize, [1.0, 0.92, 0.23, 1.0]);
        if (appProgramData.drawCaptures)
            draw(appProgramData.capturesBuffer, appProgramData.capturesSize, [0.22, 0.56, 0.24, 1.0]);
    }

    _onLayerDidMove() {
        super._onLayerDidMove();
    }
}

function updateMapUniforms(map) {
    var origin = map.project(map.containerPointToLatLng([0, 0]), 18)._round().toArray();
    gl.uniform2fv(appProgramInfo.uniformLocations.panning, origin);
    gl.uniform2fv(appProgramInfo.uniformLocations.canvasSize, map.getSize().toArray());
    gl.uniform1f(appProgramInfo.uniformLocations.zoom, map._zoom);
}

// INIT
leafletMap = L.map('map').setView([51.0, 10.2], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{param}', { param: '' }).addTo(leafletMap);

// Load data
fetchJSON("/data.json", (result, error) => {
    if (result) {
        data = result;

        // Create and add WebGL layer
        customLayer = new CustomLayer();
        customLayer.addTo(leafletMap);
    } else if (error) {
        console.log(error);
    }
});

[...document.getElementsByClassName("line-item")].forEach(function (x) {
    x.addEventListener("click", function (e) {
        var classes = e.target.classList;
        var draw;

        if (draw = classes.contains("disabled"))
            classes.remove("disabled");
        else classes.add("disabled");

        if (classes.contains("all") && appProgramData) {
            appProgramData.drawPortals = draw;
        } else if (classes.contains("visited") && appProgramData) {
            appProgramData.drawVisits = draw;
        } else if (classes.contains("captured") && appProgramData) {
            appProgramData.drawCaptures = draw;
        }

        customLayer.onDrawLayer();
    })
});