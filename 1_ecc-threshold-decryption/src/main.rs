use num_bigint::BigUint;
use num_traits::{One, Zero};
use rand::Rng;

#[derive(Clone, Debug)]
struct Point {
    x: BigUint,
    y: BigUint,
}

impl Point {
    pub fn infinity() -> Point {
        Point {x: BigUint::zero(), y: BigUint::zero()}
    }

    fn equal(&self, other: &Point) -> bool {
        self.x == other.x && self.y == other.y
    }
}

struct EllipticCurve {
    a: BigUint,
    b: BigUint,
    p: BigUint,
}

impl EllipticCurve {
    fn is_on_curve(&self, point: &Point) -> bool {
        let left = (point.y.clone() * point.y.clone()) % &self.p;
        let right = (point.x.clone() * point.x.clone() * point.x.clone() + &self.a * &point.x + &self.b) % &self.p;
        left == right
    }

    /// Function to add two points on the elliptic curve
    fn add(&self, p1: &Point, p2: &Point) -> Result<Point, &str> {
        if p1.equal(&Point::infinity()) {
            return Ok(p2.clone());
        }
        if p2.equal(&Point::infinity()) {
            return Ok(p1.clone());
        }

        // Check if p1 and p2 are the same point (point doubling)
        if p1.x == p2.x && p1.y == p2.y {
            // Calculate lambda for point doubling
            let numerator = (BigUint::from(3u32) * &p1.x.clone() * &p1.x + &self.a.clone()) % &self.p;
            let denominator = (BigUint::from(2u32) * &p1.y.clone()) % &self.p;
            let lambda = numerator * denominator.modinv(&self.p).unwrap();

            // Use the lambda to compute the new point
            let x3 = (lambda.clone() * lambda.clone() - &p1.x - &p2.x) % &self.p;
            let y3 = (lambda.clone() * (&p1.x - &x3) - &p1.y) % &self.p;

            return Ok(Point{x: x3, y: y3});
        }

        // Check if p1 and p2 have the same x-coordinate (point addition)
        if p1.x == p2.x {
            // This means they are vertical and hence add to infinity
            return Ok(Point::infinity());
        }

        // Regular addition for distinct points
        let numerator = (p2.y.clone() - p1.y.clone()) % &self.p;
        let denominator = (p2.x.clone() - p1.x.clone()) % &self.p;
        let lambda = numerator * denominator.modinv(&self.p).unwrap();

        let x3 = (lambda.clone() * lambda.clone() - p1.x.clone() - p2.x.clone()) % &self.p;
        let y3 = (lambda * (p1.clone().x - x3.clone()) - p1.clone().y) % &self.p;

        Ok(Point{x: x3, y: y3})
    }

    fn scalar_mult(&self, k: &BigUint, p: &Point) -> Point {
        let mut result = Point { x: BigUint::zero(), y: BigUint::zero() }; // Identity point
        let mut temp = p.clone();
        let mut k = k.clone();

        while k > BigUint::zero() {
            if &k % 2u32 == BigUint::one() {
                result = self.add(&result, &temp).unwrap();
            }
            temp = self.add(&temp, &temp).unwrap(); // Double the point
            k >>= 1; // Right shift
        }
        result
    }
}

/// Function to perform modular multiplication
fn mod_mul(a: &BigUint, b: &BigUint, p: &BigUint) -> BigUint {
    (a * b) % p
}

/// Encryption function
fn encrypt(
    curve: &EllipticCurve,
    x1: &BigUint,
    x2: &BigUint,
    g: &Point,
    d: &BigUint,
    p: &BigUint,
) -> (Point, BigUint, BigUint) {
    let mut rng = rand::thread_rng();
    let k_value: u32 = rng.gen_range(1..(p - BigUint::one()).to_u32_digits()[0]);
    let k: BigUint = BigUint::from(k_value);

    // Step 1: Compute y = k * g (where g is a point on the curve)
    let y = g.clone(); // Start with g
    let y = g; // Assume g is already defined correctly as a Point and use scalar multiplication

    // Step 2: Compute h = d * g
    let h = curve.scalar_mult(d, g);

    // Step 3: Compute (c1, c2) = k * h
    let c1 = curve.scalar_mult(&k, &h);
    let c2 = c1.clone(); // Assuming h is a single value for this example

    // Step 4: Compute s1 = c1 * x1 and s2 = c2 * x2 (modify as per your logic)
    let s1 = mod_mul(&c1.x, x1, p); // Adjust s1 logic for points
    let s2 = mod_mul(&c2.x, x2, p); // Adjust s2 logic for points

    // Return the encrypted form (y, s1, s2)
    (y.clone(), s1, s2)
}

/// Decryption function
fn decrypt(
    curve: &EllipticCurve,
    y: &Point,
    s1: &BigUint,
    s2: &BigUint,
    d: &BigUint,
    p: &BigUint,
) -> (BigUint, BigUint) {
    // Step 1: Compute dy
    let dy = curve.scalar_mult(d, y); // Multiply point by private key

    // Step 2: Compute the modular inverse of dy (need to define how to get this for Points)
    let c_inv = dy.x.modinv(p).unwrap(); // Example, but this may need adjustment

    // Step 3: Compute x1 and x2
    let x1 = mod_mul(s1, &c_inv, p);
    let x2 = mod_mul(s2, &c_inv, p);

    (x1, x2)
}

/// Function for partial decryption by each server
fn partial_decrypt(d_i: &BigUint, y: &Point, p: &BigUint) -> BigUint {
    (d_i * y.clone().x) % p // Modify as needed to incorporate y correctly
}

/// Final decryption by B
fn threshold_decrypt(
    s1: &BigUint,
    s2: &BigUint,
    q1: &BigUint,
    q2: &BigUint,
    p: &BigUint,
) -> (BigUint, BigUint) {
    // Compute “Q = (q1 + q2) mod P”
    let q = (q1 + q2) % p;

    // Compute B1 = s1 * q1^{-1} mod P
    let q1_inv = q.modinv(p).unwrap();
    let b1 = (s1 * q1_inv) % p;

    // Compute B2 = s2 * q2^{-1} mod P
    let q2_inv = q.modinv(p).unwrap();
    let b2 = (s2 * q2_inv) % p;

    println!("Computed B1: {}, B2: {}", b1, b2);
    (b1, b2)
}

fn main() {
    let p = BigUint::from(23u32); // Example prime P
    let curve = EllipticCurve {
        a: BigUint::from(1u32), // Example parameters for the curve
        b: BigUint::from(1u32),
        p: p.clone(),
    };

    let g = Point {
        x: BigUint::from(5u32),
        y: BigUint::from(11u32), // Ensure this point is on the curve
    };

    let d = BigUint::from(7u32); // Example private key d
    let d1 = BigUint::from(3u32);
    let d2 = BigUint::from(4u32);

    let x1 = BigUint::from(5u32); // Example plaintext x1
    let x2 = BigUint::from(12u32); // Example plaintext x2

    // Encrypt the plaintext (x1, x2)
    let (y, s1, s2) = encrypt(&curve, &x1, &x2, &g, &d, &p);

    // Print the encrypted result
    println!("Encrypted: (y: {:?}, s1: {}, s2: {})", y, s1, s2);

    // Decrypt the ciphertext
    let (decrypted_x1, decrypted_x2) = decrypt(&curve,&y, &s1, &s2, &d, &p);
    println!(
        "Full d decrypted: (x1: {}, x2: {})",
        decrypted_x1, decrypted_x2
    );

    // Partial decryption by each server
    let q1 = partial_decrypt(&d1, &y, &p);
    let q2 = partial_decrypt(&d2, &y, &p);

    println!("Partial decryptions: Q1: {}, Q2: {}", q1, q2);

    // Decrypt the ciphertext using combined Q
    let (b1, b2) = threshold_decrypt(&s1, &s2, &q1, &q2, &p);
    println!("Split d decrypted: (x1: {}, x2: {})", b1, b2);
}
