import { randomInt } from "crypto";
const p = 62687;

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

function split(sec, n, t) {
  const shares = [];
  const degrees = t - 1;
  const coefficients = [];
  for (let i = 0; i < degrees; i++) {
    const coefficient = randomInt(1, p-1);
    console.log(`Coefficient for degree ${i+1}: ${coefficient}`);
    coefficients.push(coefficient);
  }
  for (let i = 1; i <= n; i++) {
    let y = sec;
    for (let j = 0; j < coefficients.length; j++) {
      y += coefficients[j] * Math.pow(i, j + 1);
    }
    shares.push({ x: i, y: y % p });
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
      let numerator = mod(0 - shares[j].x, p);
      let denominator = mod(shares[i].x - shares[j].x, p);
      basis = mod(basis * numerator * modInverseFermat(denominator, p), p);
    }
    result += mod(shares[i].y * basis, p);
  }
  return mod(result, p);
}

async function main() {
  const secret = 7;
  const t = 3;
  const n = 5;

  const shares = split(secret, n, t);
  console.log('Shares:', shares);
  const combined_secret = combine(shares.slice(0, t));
  console.log('Reconstructed secret:', combined_secret);

  const new_addition_secret = secret + 5;
  const computed_addition_shares = shares.slice(0, t).map(share => {
    return { x: share.x, y: share.y + 5 };
  });
  const new_combined_addition_secret = combine(computed_addition_shares);
  console.log('Updated reconstructed addition secret:', new_combined_addition_secret);
  console.log(
    'Updated addition secret is equal to combined secret: ',
    new_combined_addition_secret === new_addition_secret
  );

  const new_multiplication_secret = secret * 2;
  const computed_multiplication_shares = shares.slice(0, t).map(share => {
    return { x: share.x, y: share.y * 2 };
  });
  const new_combined_multiplication_secret = combine(computed_multiplication_shares);
  console.log(
    'Updated reconstructed multiplication secret:',
    new_combined_multiplication_secret
  );
  console.log(
    'Updated multiplication secret is equal to combined secret: ',
    new_combined_multiplication_secret === new_multiplication_secret
  );

  const secret2 = 5;
  const shares2 = split(secret2, 10, 2);
  const computed_shares2 = shares.slice(0, t).map((share, i) => {
    return { x: share.x, y: share.y + shares2[i].y };
  });
  const combined_secret2 = combine(computed_shares2);
  console.log('Reconstructed secret from shares of secret2:', combined_secret2);
  console.log(
    'Reconstructed secret from shares of secret2 is equal to secret + secret2: ',
    combined_secret2 === secret + secret2
  );
}

main();