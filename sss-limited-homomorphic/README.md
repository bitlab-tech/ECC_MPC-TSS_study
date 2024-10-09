# Shamir's Secret Sharing limited homomorphism

This code implements **Shamir's Secret Sharing** (SSS) scheme in Node.js, allowing you to securely split a secret into multiple shares and later reconstruct it from a subset of those shares. It leverages **Lagrange interpolation** for both splitting and combining the shares.

### How Shamir's Secret Sharing Works
Shamir's scheme divides a secret $( s )$ into $( n )$ shares such that:
- **Threshold**: You need at least $( t )$ shares to reconstruct the secret.
- **Polynomial construction**: The secret $( s )$ is encoded as the constant term of a polynomial of degree $( t-1 )$, while the other coefficients are random values.

Each share corresponds to an evaluation of this polynomial at a different $( x )$-value.

For example, if the secret is $( s )$ and you want to split it into $( n = 3 )$ shares with a threshold $( t = 2 )$, the secret is encoded in a polynomial:
$f(x) = s + a_1 x$
where $a_1$ is a randomly chosen coefficient.

Another example, if the secret is $( s )$ and you want to split it into $( n = 5 )$ shares with a threshold $( t = 3 )$, the secret is encoded in a polynomial:
$f(x) = s + a_1 x + a_2 x^2$
where $a_1$ and $a_2$ are randomly chosen coefficients.

### Share Splitting
The code creates shares by evaluating the polynomial at different $( x )$-values. Each point $( x, y )$ represents a share, where:
- $x$ is a known value.
- $y$ is $f(x)$, the result of evaluating the polynomial at $( x )$.

These points $(x, y)$ are distributed to participants, and any subset of $t$ points can reconstruct the secret.

### Share Combination using Lagrange Interpolation
To reconstruct the secret, the code uses **Lagrange interpolation** to recover the constant term of the polynomial $f(0)$, which is the secret. Lagrange interpolation allows you to compute the original polynomial based on the known shares $(x, y)$, as long as you have at least $t$ shares.

The key formula used is:

$f(0) = \sum_{j=1}^{t} y_j \cdot \prod_{\substack{1 \leq m \leq t \\ m \neq j}} \frac{0 - x_m}{x_j - x_m}$

where $(x_j, y_j)$ are the known shares.

### Limited Homomorphism
One key aspect of this implementation is its **limited homomorphic properties**:
- You can perform calculations on individual shares (e.g., multiply a share by a constant or add a constant to a share).
- However, **you cannot perform operations between shares** (e.g., adding two shares together) without losing the integrity of the secret.

This means that while you can adjust individual shares independently (such as multiplying a share by 2), combining operations on multiple shares does not work under the same cryptographic guarantees.

Shamir's Secret Sharing exhibits **homomorphic properties** for **addition** and **scalar multiplication**, meaning you can add or multiply the shares and get the correct result when the secret is reconstructed.

However, it does not natively support multiplication of secrets without more complex operations, as multiplying shares results in a polynomial of higher degree.

#### Example:
- If you have a share $(x_1, y_1)$, you can safely multiply $y_1$ by a constant.
- However, adding the $y$-values of two different shares will not give a meaningful result.

This is due to the underlying structure of the polynomial, where the shares are points on different parts of the polynomial curve, and combining them directly does not produce valid results.

### Conclusion
This implementation demonstrates the secure splitting and reconstruction of secrets using Shamir's Secret Sharing, along with the ability to perform limited homomorphic operations on the shares. However, caution should be exercised when performing operations on the shares, as combining them directly could result in incorrect outcomes.