import { randomInt } from "crypto";
const p = 23;
const q = 11;
const g = 2;

function mod(n, p) {
  return ((n % p) + p) % p;
}

function modInverseFermat(a, p) {
  return modPow(a, p - 2, p); // Using Fermat's little theorem for prime p
}

function modPow(base, exp, mod) {
  let result = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 == 1) {
      result = (result * base) % mod;
    }
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

function calc_commitments(coefficients, sec) {
  const result = [];
  result.push(mod(Math.pow(g, sec), p));
  for (const coefficient of coefficients) {
    result.push(mod(Math.pow(g, coefficient), p));
  }
  return result;
}

function gen_proof(share) {
  return {
    i: share.x,
    value: mod(Math.pow(g, share.y), p)
  };
}

function verify_proof(commitments, proof) {
  const expected = commitments.reduce(
    (product, currentValue, j) =>
      mod(product * Math.pow(currentValue, Math.pow(proof.i, j)), p)
  );
  return expected === proof.value;
}

function split(sec, n, t) {
  const shares = { values: [] };
  const degrees = t - 1;
  const coefficients = [];
  for (let i = 0; i < degrees; i++) {
    const coefficient = randomInt(1, q-1);
    console.log(`Coefficient for degree ${i+1}: ${coefficient}`);
    coefficients.push(coefficient);
  }
  const commitments = calc_commitments(coefficients, sec);
  shares.commitments = commitments;
  for (let i = 1; i <= n; i++) {
    let y = sec;
    for (let j = 0; j < coefficients.length; j++) {
      y += coefficients[j] * Math.pow(i, j + 1);
    }
    shares.values.push({ x: i, y: mod(y, q) });
  }
  return shares;
}

function combine(shares) {
  return lagrange_interpolate(shares);
}

function lagrange_interpolate(shares) {
  let result = 0;
  for (let i = 0; i < shares.length; i++) {
    let basis = 1;
    for (let j = 0; j < shares.length; j++) {
      if (i === j) continue;
      let numerator = mod(0 - shares[j].x, q);
      let denominator = mod(shares[i].x - shares[j].x, q);
      basis = mod(basis * numerator * modInverseFermat(denominator, q), q);
    }
    result += mod(shares[i].y * basis, q);
  }
  return mod(result, q);
}

function main() {
  const secret = 7;
  const t = 3;
  const n = 5;

  console.log("secret: " + secret);

  const shares = split(secret, n, t);
  console.log('Shares:', shares);
  const combined_secret = combine(shares.values.slice(0, t));
  console.log('Reconstructed secret:', combined_secret);

  const validity_proofs = shares.values.map(share => gen_proof(share));
  console.log('Validity proofs:', validity_proofs);

  const proof_valid = validity_proofs.map(
    proof => verify_proof(shares.commitments, proof)
  );
  console.log('Proof validity:', proof_valid);
}

main();