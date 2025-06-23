export const c0 = 32.7032;
export const II = 9/8;
export const iii = 6/5;
export const III = 5 / 4;
export const IV = 4/3;
export const v = 64/45;
export const V = 3 / 2;
export const VI = 5/3;
export const VII = 15/8;
export const totalOctaves = 5;

export const majTriad: (x: number) => number[] = (x) => [x, III * x, V * x];
export const minorTriad: (x: number) => number[] = (x) => [x, iii * x, V * x];
export const diminishedTriad: (x: number) => number[] = (x) => [x, iii * x, v * x];

export const triads: (x: number) => number[][] = x => [majTriad(x), minorTriad(II*x), minorTriad(III*x), majTriad(IV*x), majTriad(V*x), minorTriad(VI*x), diminishedTriad(VII*x)]

export const expandChord: (chord: number[], totalOctaves: number) => number[] = (
    chord,
    totalOctaves
) => {
    const ret = [...chord];
    for (let i = 0; i < chord.length * (totalOctaves - 1); i++) {
        ret.push(ret[i] * 2);
    }
    return ret;
};
