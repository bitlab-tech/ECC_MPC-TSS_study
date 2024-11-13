# Shamir's Secret Sharing limited homomorphism

This code implements [Shamir's Secret Sharing (SSS)](https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing) scheme in Node.js, allowing you to securely split a secret into multiple shares and later reconstruct it from a subset of those shares. It leverages **Lagrange interpolation** for combining the shares.

### How Shamir's Secret Sharing Works
Shamir's scheme divides a secret $( s )$ into $( n )$ shares such that:
- **Threshold**: You need at least $( t )$ shares to reconstruct the secret.
- **Polynomial construction**: The secret $( s )$ is encoded as the constant term of a polynomial of degree $( t-1 )$ over $\mathbb{Z}_P $, while the other coefficients are random values.

Each share corresponds to an evaluation of this polynomial at a different $( x )$-value.

For example, if the secret is $( s )$ and you want to split it into $( n = 3 )$ shares with a threshold $( t = 2 )$, the secret is encoded in a polynomial:

- $f(x) = s + a_1 x$

where $a_1$ is a randomly chosen coefficient.

Another example, if the secret is $( s )$ and you want to split it into $( n = 5 )$ shares with a threshold $( t = 3 )$, the secret is encoded in a polynomial:

- $f(x) = s + a_1 x + a_2 x^2$

where $a_1$ and $a_2$ are randomly chosen coefficients.

### Share Splitting
The code creates shares by evaluating the polynomial at different $x$ values. Each point $( x, y )$ represents a share, where:
- $x$ is a known value.
- $y$ is $f(x)$, the result of evaluating the polynomial at $x$.

These points $(x, y)$ are distributed to participants, and any subset of $t$ points can reconstruct the secret.

### Share Combination using Lagrange Interpolation
To reconstruct the secret, the code uses [Lagrange interpolation](https://en.wikipedia.org/wiki/Lagrange_polynomial) to recover the constant term of the polynomial $f(0)$, which is the secret. Lagrange interpolation allows you to compute the original polynomial based on the known shares $(x, y)$, as long as you have at least $t$ shares.

The key formula used is:

$f(0) = \sum_{j=1}^{t} y_j \cdot \prod_{\substack{1 \leq m \leq t \\ m \neq j}} \frac{0 - x_m}{x_j - x_m}$

where $(x_j, y_j)$ are the known shares.

### Limited Homomorphism
One key aspect of this implementation is its limited homomorphic properties, which allow for the following operations:

- Addition: You can add the shares of two secrets, provided that:
  - Both secrets are shared using polynomials of the same degree.
  - The addition is performed on all shares corresponding to the same $x$-values.

  The result of the addition will be equal to the sum of the two secrets $(s_1 + s_2)$, which can be recovered using Lagrange interpolation.

- Multiplication by a constant: You can multiply each share $y_i$ by a constant $c$, which will correctly reflect when the secret is reconstructed.

- Multiplication between shares: it's **not possible** since the degree of the resulting polynomial will be higher, potentially requiring more shares to reconstruct the secret.

#### Example:
- If you have shares $(x_1, y_1)$ for one secret and $(x_1, y_2)$ for another secret, and both are represented by polynomials of the same degree, you can safely add the corresponding $y$-values to get a share for  $s_1 + s_2$.
- Similarly, multiplying a share ​$(y_1)$ by a constant $c$ will yield a valid share of the scaled secret.

However, **adding or multiplying shares across different polynomials of different degrees or performing operations on only some shares (instead of all)** will lead to incorrect results.

### Conclusion
This implementation demonstrates secure splitting and reconstruction of secrets using Shamir's Secret Sharing, with limited homomorphic properties that allow for addition and multiplication under specific conditions. When performing operations on shares, ensure they are done on all shares and on polynomials of the same degree or less to preserve the integrity of the scheme.