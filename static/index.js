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

            // Load the data
            appProgramData = loadData(this._map);
        }
    }

    onLayerWillUnmount() {
        gl = undefined;
        appProgramInfo = undefined;
        appProgramData = undefined;
    }

    onDrawLayer(_info) {
        var map = this._map;
        if (!appProgramInfo || !appProgramData)
            return;

        //gl.clearColor(0.0, 0.0, 0.0, 0.2); // Draw shade, disabled by default

        // Clear buffer
        gl.clear(gl.COLOR_BUFFER_BIT);

        function draw(buffer, size, color) {
            // Bind buffer to vertex shader attribute
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(appProgramInfo.attribLocations.position, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(appProgramInfo.attribLocations.position);

            // Set uniform values
            setUniforms(map, color)

            // Draw!
            gl.drawArrays(gl.POINTS, 0, size);
        }

        gl.useProgram(appProgramInfo.program);

        if (appProgramData.portalsSize > 0)
            draw(appProgramData.portalsBuffer, appProgramData.portalsSize, [0.72, 0.11, 0.11, 1.0]);
        draw(appProgramData.visitsBuffer, appProgramData.visitsSize, [1.0, 0.92, 0.23, 1.0]);
        draw(appProgramData.capturesBuffer, appProgramData.capturesSize, [0.22, 0.56, 0.24, 1.0]);
    }

    _onLayerDidMove() {
        super._onLayerDidMove();
    }
}

function loadData(map) {
    if (!data)
        return

    function createBuffer(bufferData) {
        // Project LatLong data onto WebMercator canvas
        bufferData = bufferData.map(x => map.project(L.latLng(x), 18)._round().toArray());

        // Buffer object
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferData.flat()), gl.STATIC_DRAW);
        return buffer;
    }

    var portalsBuffer = createBuffer(data.portals);
    var visitsBuffer = createBuffer(data.visits);
    var capturesBuffer = createBuffer(data.captures);

    return {
        portalsBuffer: portalsBuffer,
        portalsSize: data.portals.length,
        visitsBuffer: visitsBuffer,
        visitsSize: data.visits.length,
        capturesBuffer: capturesBuffer,
        capturesSize: data.captures.length,
    };
}

function setUniforms(map, color) {
    var origin = map.project(map.containerPointToLatLng([0, 0]), 18)._round().toArray();
    gl.uniform2fv(appProgramInfo.uniformLocations.panning, origin);
    gl.uniform2fv(appProgramInfo.uniformLocations.canvasSize, map.getSize().toArray());
    gl.uniform1f(appProgramInfo.uniformLocations.zoom, map._zoom);
    gl.uniform4fv(appProgramInfo.uniformLocations.color, color);
}

// INIT
leafletMap = L.map('map').setView([51.0, 10.2], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{param}', { param: '' }).addTo(leafletMap);

// Load data
fetchJSON("/data.json", (result, error) => {
    if (result) {
        data = result;

        // Create and add WebGL layer
        var customLayer = new CustomLayer();
        customLayer.addTo(leafletMap);
    } else if (error) {
        console.log(error);
    }
});

[...document.getElementsByClassName("line-item")].forEach(function (x) {
    x.addEventListener("click", function (e) {
        var target = e.target;
        if (!target.classList.contains("disabled"))
            target.classList.add("disabled");
        else target.classList.remove("disabled");
    })
});