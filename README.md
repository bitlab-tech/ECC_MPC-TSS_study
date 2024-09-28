# ECC_MPC-TSS_study

This is an implementation of a proof-of-concept (POC) of the ideas proposed by ZHANG Xian-feng, ZHANG Feng, QIN Zhi-guang, LIU Jin-de in their paper [ECC Based Threshold Decryption Scheme and Its Application in Web Security](https://www.journal.uestc.edu.cn/en/article/id/2247) (2004).

In this paper Zhang, Zhang and Qin proposed a **Threshold Decryption scheme** based on $(t, n)$ secret sharing:

## Overview

In this scheme, let:
- $P>3$ be a prime number
- $E(A,B)$ be an Elliptic Curve group over $GF(P)$.
- $H$ be a cyclic subgroup of $E(A,B)$ such that
the discrete logarithm problem is intractable over $H$.
- $g$ be a generator for $H$.

and:

- $A$ be the sender,
- $B$ be the receiver, who does not keep his private key $d$ locally. Instead, $d$ is stored across $t$ out of $n$ share servers, represented as:

  $d = d_1 + d_2 + ... + d_t$

The corresponding share servers are denoted as $(C_1, C_2, ..., C_t)$. The encryption and decryption process follows these steps:

## Encryption Process

1. **Select a random integer** $(k < |H|)$.
2. **Compute**:
   - $y = k \cdot g \mod P$
   - $(c_1, c_2) = k \cdot h \mod P$
   - $s_1 = c_1 \cdot x_1 \mod P$
   - $s_2 = c_2 \cdot x_2 \mod P$

The encrypted form of $(X)$ is $(y, s_1, s_2)$.

## Normal decryption Process

To decrypt the ciphertext:

1. From the first coordinate $(y)$ of the encryption triplet, the holder of the private key $(d)$ computes:

   $[d \cdot y = (c_1, c_2) \mod P]$

2. Compute the plaintext values:
   - $x_1 = s_1 \cdot c^{-1} \mod P$
   - $x_2 = s_2 \cdot c^{-1} \mod P$

The decrypted form of $(y, s_1, s_2)$ yields $(x_1, x_2)$.

## Threshold Decryption process

B broadcasts $(y)$ in the encryption triplet $(y, s_1, s_2)$ to $C_1, C_2, \ldots, C_t$:

1. Each server $C_i$ computes:

   $Q_i = d_i \cdot y \mod P$

2. After obtaining all $(Q_i)$, $B$ computes:

   $Q = \left(\frac{1}{t} \sum_{j=1}^{t} Q_j\right) \mod P$

3. Finally, B computes:
   - $B_1 = s_1 \cdot Q^{-1} \mod P$
   - $B_2 = s_2 \cdot Q^{-1} \mod P$

Thus, the decrypted values are $(b_1, b_2)$.

## Proof of Correctness

The proof shows that:

$Q = \left(\sum_{j=1}^{t} Q_j \mod P\right) = \frac{1}{t} \sum_{j=1}^{t} d \cdot y \mod P$

This leads to the conclusion:

$(b_1, b_2) = (x_1, x_2) \mod P$


## Usage

### Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/ECC-Based-Threshold-Decryption.git
cd ECC-Based-Threshold-Decryption
```

### Running the code

To run the implementation, execute:

```bash
cargo run
```

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Acknowledgments

Thanks to the original authors and researchers: ZHANG Xian-feng, ZHANG Feng, QIN Zhi-guang, LIU Jin-de who contributed to the field of threshold decryption and ECC.
