import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useEffect, useState } from "react";

export const ParticlesBackground = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(loadSlim).then(() => {
      setInit(true);
    });
  }, []);

  return (
    init && (
      <Particles
        id="tsparticles"
        className="-z-10"
        options={{
          particles: {
            number: { value: 80, density: { enable: true } },
            color: { value: "#1ecc83" },
            shape: {
              type: "circle",
            },
            opacity: {
              value: 0.15782952832645453,
            },
            size: {
              value: 7.891476416322726,
            },
            line_linked: {
              enable: false,
              distance: 529.1259800856225,
              color: "#1ecc83",
              opacity: 0,
              width: 6.573989449548644,
            },
            move: {
              enable: true,
              speed: 8.017060304327615,
              direction: "right",
              random: false,
              straight: false,
              attract: {
                enable: false,
              },
            },
          },
          interactivity: {
            detect_on: "canvas",

            modes: {
              grab: { distance: 400, line_linked: { opacity: 1 } },
              bubble: {
                distance: 400,
                size: 40,
                duration: 2,
                opacity: 8,
                speed: 3,
              },
              repulse: { distance: 200, duration: 0.4 },
              push: { particles_nb: 4 },
              remove: { particles_nb: 2 },
            },
          },
          retina_detect: true,
        }}
      />
    )
  );
};
