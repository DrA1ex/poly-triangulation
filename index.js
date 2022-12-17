import * as Triangulation from "./triangulation.js";
import {Vector2} from "./vector.js";

const canvas = document.getElementById("canvas");

const dpr = window.devicePixelRatio;
const rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;

const ctx = canvas.getContext("2d");
ctx.scale(dpr, dpr);

const pointSize = 5;

/** @type {Vector2[]} */
const points = [];

canvas.onmousedown = canvas.ontouchstart = e => {
    e.stopPropagation();
    e.preventDefault();

    document.getElementById("hint").style.display = "none";

    const bcr = e.target.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    points.push(new Vector2(point.clientX - bcr.x, point.clientY - bcr.y));

    render();
}

const resizeObserver = new ResizeObserver((e) => {
    const rect = canvas.getBoundingClientRect();
    const oldSize = new Vector2(canvas.width, canvas.height);
    const newSize = new Vector2(rect.width * dpr, rect.height * dpr);

    if (oldSize.x === newSize.x && oldSize.y === newSize.y) return;

    canvas.width = newSize.x;
    canvas.height = newSize.y;
    ctx.scale(dpr, dpr);

    for (const point of points) {
        point.div(oldSize).mul(newSize);
    }

    render();
})

resizeObserver.observe(canvas);

function render() {
    if (points.length === 0) return;

    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = "black";
    ctx.font = "14px serif";
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i <= points.length; i++) {
        const index = i % points.length;
        const point = points[index];
        ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();

    ctx.fillStyle = "red";
    for (const point of points) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
        ctx.fill();
    }

    if (points.length < 3) return;

    ctx.fillStyle = "blue"
    const isClockwise = Triangulation.isClockwise(points);
    for (let i = 1; i <= points.length; i++) {
        const index = i % points.length;
        const point = points[index];
        const prev = points[i - 1];
        const next = points[(i + 1) % points.length];

        drawArrow(point, point.delta(prev).angleSelf(), pointSize * 2, pointSize);

        const tangent = prev.tangent(next);
        const offset = tangent.perpendicular()
            .scale(pointSize * 3)
            .scale(isClockwise ? 1 : -1);

        drawLabel(point, index.toString(), offset);
    }

    const polygons = Triangulation.earClipping(points);
    document.getElementById("error").style.display = polygons ? "none" : null;
    if (!polygons) return;

    ctx.strokeStyle = "#96b29a";
    ctx.setLineDash([2, 8]);
    for (const poly of polygons) {
        ctx.beginPath();
        ctx.moveTo(points[poly[0]].x, points[poly[0]].y);
        ctx.lineTo(points[poly[1]].x, points[poly[1]].y);
        ctx.lineTo(points[poly[2]].x, points[poly[2]].y);
        ctx.lineTo(points[poly[0]].x, points[poly[0]].y);
        ctx.stroke();
    }
}

function drawLabel(point, text, offset) {
    const measure = ctx.measureText(text);
    const height = measure.actualBoundingBoxAscent - measure.actualBoundingBoxDescent;
    ctx.fillText(text, offset.x + point.x - measure.width / 2, offset.y + point.y + height / 2);
}

function drawArrow(point, angle, size, offset) {
    ctx.save();

    ctx.fillStyle = ctx.strokeStyle;
    ctx.translate(point.x, point.y);
    ctx.rotate(angle - Math.PI);
    ctx.translate(offset, 0);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, -size / 2);
    ctx.lineTo(size, size / 2);
    ctx.lineTo(0, 0);
    ctx.fill();

    ctx.restore();
}