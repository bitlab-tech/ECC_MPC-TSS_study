import { randomInt } from "crypto";
import BigNumber from "bignumber.js";

const p = new BigNumber(23);
const q = new BigNumber(11);
const g = new BigNumber(2);

function mod(n, p) {
  return n.mod(p).plus(p).mod(p);
}

function modInverseFermat(a, p) {
  return modPow(a, p.minus(2), p); // Using Fermat's Little Theorem for prime p
}

function modPow(base, exp, m) {
  let result = new BigNumber(1);
  base = mod(base, m);
  while (exp.isGreaterThan(0)) {
    if (exp.mod(2).isEqualTo(1)) {
      result = mod(result.times(base), m);
    }
    exp = exp.idiv(2);  // Use integer division
    base = mod(base.times(base), m);
  }
  return result;
}

function calc_commitments(coefficients, sec) {
  const result = [];
  result.push(mod(g.pow(sec), p));
  for (const coefficient of coefficients) {
    result.push(mod(g.pow(coefficient), p));
  }
  return result;
}

function gen_proof(share) {
  return {
    i: share.x,
    value: mod(g.pow(share.y), p)
  };
}

function verify_proof(commitments, proof) {
  const expected = commitments.reduce(
    (product, currentValue, j) =>
      mod(product.times(currentValue.pow(proof.i.pow(j))), p)
  );
  return expected.isEqualTo(proof.value);
}

function split(sec, nShares, t) {
  const shares = { values: [] };
  const degrees = t - 1;
  const coefficients = [];
  
  // Generate random coefficients between 1 and q - 1
  for (let i = 0; i < degrees; i++) {
    const coefficient = new BigNumber(randomInt(1, q - 1));
    console.log(`Coefficient for degree ${i+1}: ${coefficient.toString()}`);
    coefficients.push(coefficient);
  }

  // Calculate commitments using the secret and the coefficients
  const commitments = calc_commitments(coefficients, sec);
  shares.commitments = commitments;
  
  // Calculate shares using the secret and the coefficients
  for (let i = 1; i <= nShares; i++) {
    let y = new BigNumber(sec);
    for (let j = 0; j < coefficients.length; j++) {
      y = mod(y.plus(coefficients[j].times(new BigNumber(i).pow(j + 1))), q);
    }
    shares.values.push({ x: new BigNumber(i), y: y });
  }
  return shares;
}

function combine(shares) {
  return lagrange_interpolate(shares);
}

function lagrange_interpolate(shares) {
  let result = new BigNumber(0);
  
  for (let i = 0; i < shares.length; i++) {
    let basis = new BigNumber(1);
    
    for (let j = 0; j < shares.length; j++) {
      if (i === j) continue;
      let numerator = mod(new BigNumber(0).minus(shares[j].x), q);
      let denominator = mod(shares[i].x.minus(shares[j].x), q);
      basis = mod(basis.times(numerator).times(modInverseFermat(denominator, q)), q);
    }
    
    result = mod(result.plus(shares[i].y.times(basis)), q);
  }
  return mod(result, q);
}

function main() {
  const n = 5;
  const t = 3;

  const u_list = [];
  const total_shares = [];
  const final_shares = [];

  console.log("===========================");
  console.log("Step 1:");

  // Step 1:
  // Each participant generates u_i
  // Calculates then broadcasts shares_i and commitments_i
  for (let i = 0; i < n; i++) {
    const u_i = new BigNumber(randomInt(1, q - 1));
    u_list.push(u_i);
    const shares_i = split(u_i, n, t);
    total_shares.push(shares_i);
    console.log(`Participant ${i + 1} generates u = ${u_i} shares = ${JSON.stringify(shares_i)}`)
  }

  console.log("===========================");
  console.log("Step 2:");

  // Step 2:
  // Each participant verifies their received shares
  for (let i = 0; i < total_shares.length; i++) {
    console.log(`Verifying shares for participant: ${i + 1}`);
    for (let j = 0; j < n; j++) {
      const valid = verify_proof(total_shares[j].commitments, gen_proof(total_shares[j].values[i]));
      console.log(`Share f(${i + 1}) from participant: ${j + 1} is: ${valid ? "valid" : "not valid"}`);
    }
  }

  console.log("===========================");
  console.log("Step 3:");

  // Step 3:
  // Each participant adds their shares received from the others
  // to get the final share value
  for (let i = 0; i < total_shares.length; i++) {
    console.log(`Calculate share for participant: ${i + 1}`);
    let final_share_value = new BigNumber(0);
    for (let j = 0; j < n; j++) {
      final_share_value = final_share_value.plus(total_shares[j].values[i].y);
    }
    final_share_value = final_share_value.mod(q);
    const final_share_i = { x: new BigNumber(i + 1) , y: final_share_value };
    console.log(`Final share for participant: ${i + 1} is: ${JSON.stringify(final_share_i)}`);
    final_shares.push(final_share_i);
  }

  console.log("===========================");
  console.log("Result verification:");

  // Verify if distributed shares are correct
  const secret = u_list.reduce((sum, currentValue) => sum.plus(currentValue)).mod(q);
  const reconstructed_secret = combine([final_shares[4], final_shares[0], final_shares[1]]);
  console.log("Secret: ", secret);
  console.log("Reconstructed secret: ", reconstructed_secret);
  console.log("Reconstructed secret is equal to secret: ", reconstructed_secret.isEqualTo(secret));
}

main();