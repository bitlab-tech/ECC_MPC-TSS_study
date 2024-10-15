const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const randomInt = require('crypto').randomInt;
var BigNumber = require('bignumber.js');

const p = 62687;

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
    shares.push({ x: i, y: y });
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
      let numerator = 0 - shares[j].x;
      let denominator = shares[i].x - shares[j].x;
      basis = basis * numerator / denominator;
    }
    result += shares[i].y * basis;
  }
  return result;
}

function lagrange_coefficient(i, t) {
  let basis = 1;
  for (let j = 1; j <= t; j++) {
    if (i + 1 === j) continue;
    let numerator = 0 - j;
    let denominator = i + 1 - j;
    basis = basis * numerator / denominator;
  }
  return basis;
}

function main() {  
  var A = ec.keyFromPrivate(7n);
  var B = ec.genKeyPair();
  
  var Ap = A.getPrivate();
  console.log("A-priv: ", Ap.toString(16));

  const shares = split(7, 5, 3);
  console.log("Shares: ", shares.map(share => ({
    x: share.x.toString(), y: share.y.toString()
  })));
  
  var AB = A.getPublic().mul(B.getPrivate());
  var BA = B.getPublic().mul(A.getPrivate());

  var AsB = shares.slice(0, 3).map((share, index) => {
    const share_lagrange_coefficient = lagrange_coefficient(index, 3);
    const lagrange_interpolate = share.y * share_lagrange_coefficient;
    const share_key = ec.keyFromPrivate(lagrange_interpolate);
    return B.getPublic().mul(share_key.getPrivate());
  });

  console.log("AB: ", AB.getX().toString(16));
  console.log("BA: ", BA.getX().toString(16));

  const combined = combine(shares.slice(0, 3));
  console.log("Combine: ", combined);

  let reconstructedSecret = AsB[0];
  for (let i = 1; i < AsB.length; i++) {
    const s = AsB[i];
    reconstructedSecret = reconstructedSecret.add(s);
  }
  console.log("Reconstructed secret: ", reconstructedSecret.getX().toString(16));
  console.log(
    "Reconstructed secret equals AB equals BA: ",
    reconstructedSecret.getX().toString(16) === AB.getX().toString(16) &&
    reconstructedSecret.getX().toString(16) === BA.getX().toString(16)
  );
}

main();
