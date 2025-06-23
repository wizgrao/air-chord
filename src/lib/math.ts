import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { add, count, sum } from "ramda";
export const fingies = [
    1, 5, 9, 13, 17
];


export interface coord {
    x: number;
    y: number;
    z: number;
}
export const sub: (x: coord, y: coord) => coord = (x, y) => ({ x: x.x - y.x, y: x.y - y.y, z: x.z - y.z });
export const scale: (r: number, y: coord) => coord = (r, y) => ({ x: r * y.x, y: r * y.y, z: r * y.z });
export const dot: (x: coord, y: coord) => number = (x, y) => x.x * y.x + x.y * y.y + x.z * y.z;
export const vecLen: (x: coord) => number = x => Math.sqrt(dot(x, x));
export const normalized: (x: coord) => coord = x => scale(1 / Math.sqrt(dot(x, x)), x);
export const cross: (x: coord) => (y: coord) => coord = x => y => ({ x: x.y * y.z - x.z * y.y, y: x.z * y.x - x.x * y.z, z: x.x * y.y - x.y * y.x });

export const getHand: (hand: "Right" | "Left") => (result: HandLandmarkerResult) => [coord[], coord[]] | null = hand => result => {
    for (let i = 0; i < result.handedness.length; i++) {
        const h = result.handedness[i]
        if (h[0].categoryName != hand) { // this appears to be flipped for whatever reason
            return [result.worldLandmarks[i], result.landmarks[i]]
        }
    }
    return null
}

export const getRightHand = getHand("Right")
export const getLeftHand = getHand("Left")

export const center: (coords: coord[]) => coord = (coords) => {
    let x = 0;
    let y = 0;
    let z = 0;
    for (const c of coords) {
        x += c.x;
        y += c.y;
        z + c.z;
    }
    x /= coords.length;
    y /= coords.length;
    z /= coords.length;
    return { x, y, z };
};

export const middleOfHand: (landmarks: coord[]) => coord = (landmarks) => {
    return center([landmarks[0], landmarks[5], landmarks[17]]);
};

export const handIsUpright: (landmarks: coord[]) => boolean = landmarks => {
    const vec = sub(landmarks[9], landmarks[0]);
    return Math.abs(vec.y) > Math.abs(vec.x);
}

export const isFingerExtended: (landmarks: coord[]) => ((finger: number) => boolean) = landmarks => finger => getFingerExtension(landmarks)(finger) < (finger === 1 ? .6 : 1);

export const getFingerExtension: (landmarks: coord[]) => ((finger: number) => number) = (landmarks) => (finger) => {
    const firstBone = normalized(sub(landmarks[finger + 1], landmarks[finger]))
    const secondBone = normalized(sub(landmarks[finger + 2], landmarks[finger + 1]))
    const thirdBone = normalized(sub(landmarks[finger + 3], landmarks[finger + 2]))

    const secondJoint = cross(secondBone)(firstBone);
    const thirdJoint = cross(thirdBone)(secondBone);

    return vecLen(secondJoint) + vecLen(thirdJoint)
}

export const getFingerSpread: (landmarks: coord[]) => number = landmarks => {
    const tips = fingies.map(add(3)).map(x => landmarks[x])
    const tipCenter = center(tips);
    const tipsDist = tips.map(x => Math.sqrt(dist2(x, tipCenter)))

    return sum(tipsDist)
}

export const numberExtendedFingers: (landmarks: coord[]) => number = landmarks => count(isFingerExtended(landmarks))(fingies)

export const sqrd: (x: number) => number = (x) => x * x;

export const dist2: (a: coord, b: coord) => number = (a, b) =>
    sqrd(a.x - b.x) + sqrd(a.y - b.y) + sqrd(a.x - b.y);

export const extractFingerExtensions: (landmarks: coord[]) => number[] = (landmarks) => {
    return fingies.map(getFingerExtension(landmarks));
};
