use num_bigint::BigUint;
use num_traits::One;
use rand::Rng;

/// Function to perform modular multiplication
fn mod_mul(a: &BigUint, b: &BigUint, p: &BigUint) -> BigUint {
    (a * b) % p
}

/// Encryption function
fn encrypt(
    x1: &BigUint,
    x2: &BigUint,
    g: &BigUint,
    d: &BigUint,
    p: &BigUint,
) -> (BigUint, BigUint, BigUint) {
    let mut rng = rand::thread_rng();
    let k_value: u32 = rng.gen_range(1..(p - BigUint::one()).to_u32_digits()[0]);
    let k: BigUint = BigUint::from(k_value);

    // Step 1: Compute y = k * g mod P
    let y = mod_mul(&k, g, p);

    // Step 2: Compute h = d * g (where g is a point on the curve)
    let h = mod_mul(d, g, p); // Here, we assume g is represented in a suitable form

    // Step 3: Compute (c1, c2) = k * h mod P
    let c1 = mod_mul(&k, &h, p);
    let c2 = c1.clone(); // Assuming h is a single value for this example

    // Step 4: Compute s1 = c1 * x1 mod P and s2 = c2 * x2 mod P
    let s1 = mod_mul(&c1, x1, p);
    let s2 = mod_mul(&c2, x2, p);

    // Return the encrypted form (y, s1, s2)
    (y, s1, s2)
}

/// Decryption function
fn decrypt(
    y: &BigUint,
    s1: &BigUint,
    s2: &BigUint,
    d: &BigUint,
    p: &BigUint,
) -> (BigUint, BigUint) {
    // Step 1: Compute dy
    let dy = mod_mul(d, y, p);

    // Step 2: Compute the modular inverse of dy
    let c_inv = dy.modinv(p).unwrap();

    // Step 3: Compute x1 and x2
    let x1 = mod_mul(s1, &c_inv, p);
    let x2 = mod_mul(s2, &c_inv, p);

    (x1, x2)
}

/// Function for partial decryption by each server
fn partial_decrypt(d_i: &BigUint, y: &BigUint, p: &BigUint) -> BigUint {
    (d_i * y) % p
}

/// Final decryption by B
fn threshold_decrypt(
    s1: &BigUint,
    s2: &BigUint,
    q1: &BigUint,
    q2: &BigUint,
    p: &BigUint,
) -> (BigUint, BigUint) {
    // Compute “Q\=(t1​j\=1∑t​Qj​)modP”
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
    let g = BigUint::from(5u32); // Example base point g

    let d = BigUint::from(7u32); // Example private key d
    let d1 = BigUint::from(3u32);
    let d2 = BigUint::from(4u32);

    let x1 = BigUint::from(7u32); // Example plaintext x1
    let x2 = BigUint::from(9u32); // Example plaintext x2

    // Encrypt the plaintext (x1, x2)
    let (y, s1, s2) = encrypt(&x1, &x2, &g, &d, &p);

    // Print the encrypted result
    println!("Encrypted: (y: {}, s1: {}, s2: {})", y, s1, s2);

    // Decrypt the ciphertext
    let (decrypted_x1, decrypted_x2) = decrypt(&y, &s1, &s2, &d, &p);
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
