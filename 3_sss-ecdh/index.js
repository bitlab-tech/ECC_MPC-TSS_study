const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const randomBytes = require('crypto').randomBytes;
var BigNumber = require('bignumber.js');

const p = ec.curve.p; // Prime field of the curve
const n = new BigNumber(ec.curve.n); // Order of the curve

function modInverseFermat(a, p) {
  return modPow(a, p.minus(2), p); // Using Fermat's Little Theorem for prime p
}

function modPow(base, exp, mod) {
  let result = new BigNumber(1);
  base = base.mod(mod);
  while (exp.isGreaterThan(0)) {
    if (exp.mod(2).isEqualTo(1)) {
      result = result.times(base).mod(mod);
    }
    exp = exp.idiv(2);  // Use integer division
    base = base.times(base).mod(mod);
  }
  return result;
}

function split(sec, nShares, t) {
  const shares = [];
  const degrees = t - 1;
  const coefficients = [];
  
  // Generate random coefficients between 1 and p - 1
  for (let i = 0; i < degrees; i++) {
    const coefficient = new BigNumber(
      randomBytes(32).toString('hex'), 16
    ).mod(n.minus(1)).plus(1);
    console.log(`Coefficient for degree ${i+1}: ${coefficient.toString()}`);
    coefficients.push(coefficient);
  }
  
  // Calculate shares using the secret and the coefficients
  for (let i = 1; i <= nShares; i++) {
    let y = new BigNumber(sec);
    for (let j = 0; j < coefficients.length; j++) {
      y = y.plus(coefficients[j].times(new BigNumber(i).pow(j + 1))).mod(n);
    }
    shares.push({ x: new BigNumber(i), y: y });
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
      let numerator = new BigNumber(0).minus(shares[j].x);
      let denominator = shares[i].x.minus(shares[j].x);
      basis = basis.times(numerator).times(modInverseFermat(denominator, n));
    }
    
    result = result.plus(shares[i].y.times(basis));
  }
  return result.mod(n);
}

function lagrange_coefficient(x, x_coordinates) {
  let basis = new BigNumber(1);
  for (let j = 0; j < x_coordinates.length; j++) {
    if (x.isEqualTo(x_coordinates[j])) continue;
    let numerator = new BigNumber(0).minus(x_coordinates[j]);
    let denominator = new BigNumber(x).minus(x_coordinates[j]);
    basis = basis.times(numerator).times(modInverseFermat(denominator, n)).mod(n);
  }
  return basis;
}

function main() {  
  var A = ec.genKeyPair();
  var B = ec.genKeyPair();
  
  var Ap = A.getPrivate();
  console.log("A-priv: ", Ap.toString(16));

  const shares = split(new BigNumber(Ap.toString()), 5, 3);
  console.log("Shares: ", shares.map(share => ({
    x: share.x.toString(), y: share.y.toString(16)
  })));
  
  var AB = A.getPublic().mul(B.getPrivate());
  var BA = B.getPublic().mul(A.getPrivate());

  const sharesUsed = [shares[0], shares[2], shares[3]];
  var AsB = sharesUsed.map(share => {
    const x_coordinates = sharesUsed.map(share => share.x);
    const share_lagrange_coefficient = lagrange_coefficient(share.x, x_coordinates);
    const lagrange_interpolate = share.y.times(share_lagrange_coefficient).mod(n);
    const share_key = ec.keyFromPrivate(lagrange_interpolate.toString(16));
    return B.getPublic().mul(share_key.getPrivate());
  });

  console.log("AB: ", AB.getX().toString(16));
  console.log("BA: ", BA.getX().toString(16));

  const combined = combine(shares.slice(0, 3));
  console.log("Reconstructed A private key: ", combined.toString(16));

  let reconstructedSecret = AsB[0];
  for (let i = 1; i < AsB.length; i++) {
    const s = AsB[i];
    reconstructedSecret = reconstructedSecret.add(s);
  }
  reconstructedSecret = new BigNumber(reconstructedSecret.getX().toString()).mod(n);
  console.log("Reconstructed shared secret: ", reconstructedSecret.toString(16));
  console.log(
    'Reconstructed secret from shares is equal to AB and BA: ',
    reconstructedSecret.toString(16) === AB.getX().toString(16) &&
    reconstructedSecret.toString(16) === BA.getX().toString(16)
  );
}

main();
