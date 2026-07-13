# Calculating the MeArm task space

## Purpose

This tutorial derives the mathematical region that the MeArm claw endpoint can
reach when the base, shoulder, and elbow servos remain inside their configured
angle limits. That Cartesian region is the arm's **task space** or
**workspace**.

The result is a geometric simulation boundary. It does not prove that every
point is physically safe: the model does not include torque, servo calibration,
backlash, link flex, self-collision, the table, wiring, or nearby objects.

The same calculation is presented as a four-step interactive lesson in
[`public/task-space-lab.html`](../public/task-space-lab.html). Its interface and
maintenance notes are documented in
[`public/TASK_SPACE_LAB.md`](../public/TASK_SPACE_LAB.md).

The equations here match the implementation in
[`src/core/kinematics.ts`](../src/core/kinematics.ts), the defaults in
[`src/core/profile.ts`](../src/core/profile.ts), and the boundary mesh in
[`src/viewer/task-space.ts`](../src/viewer/task-space.ts).

## 1. Distinguish configuration space from task space

The three positioning joint variables are:

| Symbol | Joint | Default limits |
| --- | --- | ---: |
| $\beta$ | base rotation | $-45^\circ \leq \beta \leq 45^\circ$ |
| $s$ | shoulder angle | $45^\circ \leq s \leq 135^\circ$ |
| $e$ | elbow/link angle | $-45^\circ \leq e \leq 45^\circ$ |

Together they form a three-dimensional rectangular configuration domain:

$$
Q = [\beta_{min},\beta_{max}]
    \times [s_{min},s_{max}]
    \times [e_{min},e_{max}].
$$

A point in configuration space is an angle triple
$q=(\beta,s,e)$. A point in task space is a Cartesian endpoint position
$p=(x,y,z)$.

The claw-opening servo is not part of this positional workspace because
opening or closing the claw does not change $(x,y,z)$. If gripper opening were
included as a task variable, the extended task state could instead be written
as $(x,y,z,g)$.

## 2. Use the project's angle convention

The current model uses these link dimensions:

| Symbol | Meaning | Default |
| --- | --- | ---: |
| $L_1$ | shoulder-to-elbow length | 80 mm |
| $L_2$ | elbow-to-wrist length | 80 mm |
| $L_3$ | horizontal hand offset | 22 mm |

The shoulder and elbow values are **absolute link angles in the vertical arm
plane**. The elbow term is therefore $\cos(e)$ and $\sin(e)$, not
$\cos(s+e)$ and $\sin(s+e)$ as in a common relative-elbow convention. The
viewer transform converts these absolute angles into its nested pivot
rotations.

The base angle is measured from the positive $y$ direction. Consequently,
$x$ uses sine and $y$ uses cosine.

The source-coordinate origin is at the shoulder/base reference plane. The
viewer adds a 28 mm visual base height only when placing geometry in the scene;
that rendering offset is not part of the task-space equations.

Angles shown in this tutorial use degrees for readability, but JavaScript's
trigonometric functions require radians:

$$
\theta_{rad}=\theta_{deg}\frac{\pi}{180}.
$$

## 3. Derive the forward kinematics

First calculate the horizontal radial distance $\rho$ from the base axis:

$$
\rho = L_3 + L_1\cos(s) + L_2\cos(e).
$$

The vertical coordinate is the sum of the vertical parts of the two links:

$$
z = L_1\sin(s) + L_2\sin(e).
$$

The base rotation sweeps $(\rho,z)$ around the vertical axis:

$$
\begin{aligned}
x &= \rho\sin(\beta),\\
y &= \rho\cos(\beta),\\
z &= L_1\sin(s)+L_2\sin(e).
\end{aligned}
$$

Define this forward-kinematic mapping as $p=f(q)$. The complete mathematical
workspace is then:

$$
W = f(Q) = \{f(\beta,s,e)\mid(\beta,s,e)\in Q\}.
$$

This definition is more useful than three independent coordinate ranges.
The coordinates are coupled: choosing an extreme $x$ value restricts the
possible $y$ and $z$ values at the same point.

## 4. Reduce the first calculation to a two-dimensional cross-section

Because $\beta$ only rotates the arm about the base, first study the shoulder
and elbow mapping into the radial/vertical plane:

$$
g(s,e) = (\rho,z).
$$

For the default profile:

$$
\begin{aligned}
\rho &= 22 + 80\cos(s) + 80\cos(e),\\
z &= 80\sin(s) + 80\sin(e).
\end{aligned}
$$

The rectangular $(s,e)$ domain has four edges. Mapping each edge produces one
curved boundary of the $(\rho,z)$ cross-section:

| Fixed limit | Varying angle | Boundary curve |
| --- | --- | --- |
| $s=45^\circ$ | $-45^\circ\leq e\leq45^\circ$ | $\rho=22+80\cos45^\circ+80\cos e$, $z=80\sin45^\circ+80\sin e$ |
| $s=135^\circ$ | $-45^\circ\leq e\leq45^\circ$ | $\rho=22+80\cos135^\circ+80\cos e$, $z=80\sin135^\circ+80\sin e$ |
| $e=-45^\circ$ | $45^\circ\leq s\leq135^\circ$ | $\rho=22+80\cos s+80\cos(-45^\circ)$, $z=80\sin s+80\sin(-45^\circ)$ |
| $e=45^\circ$ | $45^\circ\leq s\leq135^\circ$ | $\rho=22+80\cos s+80\cos45^\circ$, $z=80\sin s+80\sin45^\circ$ |

Each curve is a circular arc because one link contribution is fixed while the
other link rotates.

### Corner values

The four angle-limit corners map to:

| Shoulder | Elbow | $\rho$ (mm) | $z$ (mm) |
| ---: | ---: | ---: | ---: |
| $45^\circ$ | $-45^\circ$ | 135.1371 | 0 |
| $45^\circ$ | $45^\circ$ | 135.1371 | 113.1371 |
| $135^\circ$ | $45^\circ$ | 22 | 113.1371 |
| $135^\circ$ | $-45^\circ$ | 22 | 0 |

These four points do **not** define the complete boundary. The arcs bulge
beyond the corner values. Important intermediate points include:

| Fixed limit | Other angle | $\rho$ (mm) | $z$ (mm) | Meaning |
| --- | ---: | ---: | ---: | --- |
| $s=45^\circ$ | $e=0^\circ$ | 158.5685 | 56.5685 | maximum radial reach |
| $e=45^\circ$ | $s=90^\circ$ | 78.5685 | 136.5685 | maximum height |
| $s=135^\circ$ | $e=0^\circ$ | 45.4315 | 56.5685 | inner-edge bulge |
| $e=-45^\circ$ | $s=90^\circ$ | 78.5685 | 23.4315 | lower-edge bulge |

This is why mapping only the eight corners of the full three-dimensional angle
box would produce an incorrect workspace.

## 5. Sweep the cross-section through the base limits

For every reachable cross-section point $(\rho,z)$, vary the base angle over:

$$
-45^\circ\leq\beta\leq45^\circ.
$$

The point traces a horizontal circular arc:

$$
(x,y,z)=(\rho\sin\beta,\rho\cos\beta,z).
$$

Sweeping the entire $(\rho,z)$ region produces the curved three-dimensional
wedge shown by the application's **Task space** overlay.

## 6. Identify the six three-dimensional limit surfaces

The configuration box has six faces. Holding one angle at a limit and varying
the other two maps each face into one task-space surface:

| Surface pair | Fixed value | Parameters allowed to vary |
| --- | --- | --- |
| base limits | $\beta=\beta_{min}$ or $\beta_{max}$ | $s,e$ |
| shoulder limits | $s=s_{min}$ or $s_{max}$ | $\beta,e$ |
| elbow limits | $e=e_{min}$ or $e_{max}$ | $\beta,s$ |

For the default profile, these six mapped faces form the complete workspace
boundary. In set notation:

$$
\partial W = f(\partial Q).
$$

The implementation samples and triangulates all six faces rather than
constructing a box from coordinate extrema.

## 7. Check whether internal singularities add boundary surfaces

In a general nonlinear mapping, the outer boundary can also contain images of
critical points inside the configuration domain. Check this with the Jacobian
matrix:

$$
J(q)=\frac{\partial(x,y,z)}{\partial(\beta,s,e)}.
$$

For this forward model, the absolute Jacobian determinant simplifies to:

$$
|\det J| = |\rho L_1L_2\sin(s-e)|.
$$

The mapping is singular when either:

1. $\rho=0$, meaning the endpoint lies on the base rotation axis; or
2. $s-e=k\pi$, meaning the two planar link directions are aligned or
   anti-aligned.

For the interior of the default limits:

$$
\rho>0,\qquad 0<s-e<\pi.
$$

Therefore $|\det J|>0$ throughout the interior. The only aligned or
anti-aligned cases occur on configuration-limit edges, so they are already
included in the six mapped faces.

If an edited profile introduces an interior singularity or causes the mapping
to fold over itself, simply mapping the six angle-limit faces is no longer a
proof that every displayed patch lies on the outer hull. A fully general tool
would additionally map the critical set and determine which candidate patches
are externally visible, or reconstruct an approximate boundary from
volumetric reachability samples.

## 8. Calculate the default Cartesian bounding ranges

These ranges are useful for labels and camera fitting, but they are not a
substitute for the curved workspace.

### Radial range

Maximum radial reach occurs at $s=45^\circ$, $e=0^\circ$:

$$
\begin{aligned}
\rho_{max}
&=22+80\cos45^\circ+80\cos0^\circ\\
&=22+40\sqrt{2}+80\\
&\approx158.5685\text{ mm}.
\end{aligned}
$$

Minimum radial reach occurs at $s=135^\circ$, $e=\pm45^\circ$:

$$
\rho_{min}=22\text{ mm}.
$$

### Horizontal Cartesian ranges

Because $\rho$ remains positive and $|\beta|\leq45^\circ$:

$$
|x|_{max}=\rho_{max}\sin45^\circ\approx112.1249\text{ mm}.
$$

The smallest forward $y$ value uses the minimum radius and the largest base
deflection:

$$
y_{min}=\rho_{min}\cos45^\circ\approx15.5563\text{ mm}.
$$

The largest $y$ value occurs at $\beta=0^\circ$ and $\rho=\rho_{max}$:

$$
y_{max}=158.5685\text{ mm}.
$$

### Vertical range

The minimum height is:

$$
z_{min}=80\sin45^\circ+80\sin(-45^\circ)=0.
$$

The maximum height occurs at $s=90^\circ$, $e=45^\circ$:

$$
z_{max}=80+40\sqrt{2}\approx136.5685\text{ mm}.
$$

The resulting axis-aligned bounding box is:

| Coordinate | Minimum (mm) | Maximum (mm) |
| --- | ---: | ---: |
| $x$ | -112.1249 | 112.1249 |
| $y$ | 15.5563 | 158.5685 |
| $z$ | 0 | 136.5685 |

Do not interpret this table as three independent sliders. For example, the
maximum $x$, maximum $y$, and maximum $z$ values cannot occur simultaneously.

## 9. Work one forward-kinematic example

Choose a configuration on the positive base-limit surface:

$$
(\beta,s,e)=(45^\circ,90^\circ,0^\circ).
$$

Calculate the radius and height:

$$
\begin{aligned}
\rho &=22+80\cos90^\circ+80\cos0^\circ=102\text{ mm},\\
z &=80\sin90^\circ+80\sin0^\circ=80\text{ mm}.
\end{aligned}
$$

Rotate through the base angle:

$$
\begin{aligned}
x &=102\sin45^\circ\approx72.1249\text{ mm},\\
y &=102\cos45^\circ\approx72.1249\text{ mm},\\
z &=80\text{ mm}.
\end{aligned}
$$

So this angle triple maps to approximately
$(72.1249,72.1249,80)$ mm.

## 10. Turn the calculation into a surface mesh

For a numerical visualization, choose a subdivision count $N$ and process each
of the six configuration faces:

1. Fix one joint at its minimum or maximum.
2. Divide each of the other two joint ranges into $N$ intervals.
3. Evaluate the forward kinematics at every grid point.
4. Connect each four-point grid cell as two triangles.
5. Repeat for all six faces.
6. Draw the triangles with a low-opacity material and optionally draw the
   parameter-grid lines over them.

Conceptual pseudocode:

```text
for each (fixedJoint, fixedLimit, varyingJointU, varyingJointV):
    for u = 0 ... N:
        for v = 0 ... N:
            angles[fixedJoint] = fixedLimit
            angles[varyingJointU] = lerp(Umin, Umax, u / N)
            angles[varyingJointV] = lerp(Vmin, Vmax, v / N)
            vertex[u, v] = forwardKinematics(angles)

    for u = 0 ... N - 1:
        for v = 0 ... N - 1:
            emit triangles from the four neighboring vertices
```

The application uses $N=20$, giving:

$$
6(N+1)^2=6(21)^2=2646
$$

surface vertices before any optional vertex sharing. Increasing $N$ makes the
curves smoother but increases geometry and grid-line density.

## 11. Verify the calculation

A practical verification sequence is:

1. Check that every generated coordinate is finite.
2. Confirm the generated mesh has six sampled faces.
3. Compute its Cartesian bounding box.
4. Compare the default extrema with the values derived above.
5. Change a profile value and confirm the mesh changes.
6. Check that the scene-coordinate conversion is correct:
   source $(x,y,z)$ becomes Three.js $(x,z,y)$ plus the visual base-height
   offset.
7. Keep reachability tests separate from physical-safety claims.

These checks are automated in
[`tests/task-space.test.ts`](../tests/task-space.test.ts).

## 12. Summary

The calculation can be summarized as:

1. Start with the three-dimensional servo-limit box $Q$.
2. Use the project's absolute-angle forward kinematics to map $Q$ into
   Cartesian coordinates.
3. Analyze the four curved $(\rho,z)$ edges from the shoulder/elbow limits.
4. Sweep that region through the base-angle interval.
5. Map and triangulate all six configuration-limit faces.
6. Check the Jacobian for interior singularities before claiming those faces
   are the complete outer boundary for a different profile.

For the default MeArm profile, there are no interior singularities, so the six
mapped servo-limit faces give the complete mathematical task-space boundary.
