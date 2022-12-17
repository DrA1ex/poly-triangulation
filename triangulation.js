import {List} from "./list.js";

/**
 * @typedef {{point: Vector2, index: number}} IndexedPoint
 */

/**
 * @param {Vector2[]} points
 * @return {Array<[number, number, number]> | null}
 */
export function earClipping(points) {
    if (points.length < 3) return null;

    const indexedPoints = points.map((v, i) => ({point: v, index: i}));
    if (isClockwise(points)) indexedPoints.reverse();

    /** @type {List<IndexedPoint>} */
    const list = new List(indexedPoints);
    const polygons = new Array(points.length - 2);
    let outIndex = 0;

    let current = list.first;
    let lastAfterCut = list.first;
    while (list.size > 3) {
        const next = list.next(current);
        if (isEar(list, current)) {
            polygons[outIndex++] = getTriangleIndices(list, current);
            list.remove(current);
            lastAfterCut = next;
        } else if (next === lastAfterCut) {
            // If we made a full loop, then algorithm doesn't work for this kind of polygon
            return null;
        }

        current = next;
    }

    polygons[outIndex++] = getTriangleIndices(list, list.first);
    return polygons;
}

/**
 * @param {Vector2[]} points
 * @return {boolean}
 */
export function isClockwise(points) {
    let bottomRight = points[0];
    let bottomRightIndex = 0;

    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const check = point.y !== bottomRight.y ? point.y < bottomRight.y : point.x > bottomRight.x;
        if (check) {
            bottomRight = point;
            bottomRightIndex = i;
        }
    }

    const prev = points[(points.length + bottomRightIndex - 1) % points.length];
    const next = points[(bottomRightIndex + 1) % points.length];

    return !isInternal(bottomRight, prev, next);
}

/**
 * @param {List<IndexedPoint>} list
 * @param {ListNode<IndexedPoint>} origin
 * @return {boolean}
 */
function isEar(list, origin) {
    const prev = list.previous(origin);
    const next = list.next(origin);

    const internal = isNodeInternal(origin, prev, next);
    if (!internal) return false;

    let current = next.next ?? list.last;
    while (current !== prev) {
        const checkSum = isNodeInternal(origin, prev, current) +
            isNodeInternal(prev, next, current) +
            isNodeInternal(next, origin, current);

        // Point contained by a triangle if all check return same result
        const inside = checkSum === 0 || checkSum === 3;
        if (inside) return false;

        current = list.next(current);
    }

    return true;
}

/**
 * @param {ListNode<IndexedPoint>} origin
 * @param {ListNode<IndexedPoint>} prev
 * @param {ListNode<IndexedPoint>} next
 * @return {boolean}
 */
function isNodeInternal(origin, prev, next) {
    return isInternal(origin.value.point, prev.value.point, next.value.point);
}

/**
 *
 * @param {Vector2} origin
 * @param {Vector2} prev
 * @param {Vector2} next
 * @return {boolean}
 */
function isInternal(origin, prev, next) {
    const localPrev = prev.delta(origin);
    const localNext = next.delta(origin);
    const cross = localNext.cross(localPrev);

    return cross > 0;
}

/**
 * @param {List<IndexedPoint>} list
 * @param {ListNode<IndexedPoint>} origin
 * @return {*[]}
 */
function getTriangleIndices(list, origin) {
    const prev = list.previous(origin);
    const next = list.next(origin);

    return [prev.value.index, origin.value.index, next.value.index];
}
